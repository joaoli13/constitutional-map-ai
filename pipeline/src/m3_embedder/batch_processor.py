"""Parallel embedding processor with rate limiting and retries."""

from __future__ import annotations

import logging
import os
import threading
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Callable, Sequence

from src.m3_embedder.gemini_client import GeminiEmbeddingClient, is_retryable_error
from src.shared.constants import EMBEDDING_CHECKPOINT_INTERVAL

LOGGER = logging.getLogger(__name__)

CheckpointCallback = Callable[[list[dict[str, object]], "BatchProcessingStats"], None]
ProgressCallback = Callable[[int, int, "BatchProcessingStats"], None]


@dataclass
class BatchProcessingStats:
    completed_count: int = 0
    api_call_count: int = 0
    success_count: int = 0
    failure_counts: dict[str, int] = field(default_factory=dict)
    checkpoint_count: int = 0

    @property
    def failure_count(self) -> int:
        return sum(self.failure_counts.values())


class EmbeddingProcessingError(RuntimeError):
    """Raised when a row cannot be embedded after retries."""

    def __init__(self, error_type: str, attempts: int, message: str) -> None:
        super().__init__(message)
        self.error_type = error_type
        self.attempts = attempts


class EmbeddingBatchProcessor:
    """Process rows in parallel while respecting a max-RPM budget."""

    def __init__(
        self,
        client: GeminiEmbeddingClient,
        *,
        batch_size: int | None = None,
        max_rpm: int | None = None,
        max_attempts: int = 3,
        checkpoint_interval: int = EMBEDDING_CHECKPOINT_INTERVAL,
        sleep_fn: Callable[[float], None] = time.sleep,
        monotonic_fn: Callable[[], float] = time.monotonic,
        logger: logging.Logger | None = None,
    ) -> None:
        self.client = client
        self.batch_size = batch_size or int(os.getenv("EMBEDDING_BATCH_SIZE", "100"))
        self.max_rpm = max_rpm or int(os.getenv("EMBEDDING_MAX_RPM", "1500"))
        self.max_attempts = max_attempts
        self.checkpoint_interval = checkpoint_interval
        self.sleep_fn = sleep_fn
        self.monotonic_fn = monotonic_fn
        self.logger = logger or LOGGER
        self._rate_lock = threading.Lock()
        self._next_request_at: float | None = None

    def process_rows(
        self,
        rows: Sequence[dict[str, object]],
        *,
        checkpoint_callback: CheckpointCallback | None = None,
        progress_callback: ProgressCallback | None = None,
    ) -> tuple[list[dict[str, object]], BatchProcessingStats]:
        """Embed rows and periodically flush via callback."""

        if not rows:
            return [], BatchProcessingStats()

        stats = BatchProcessingStats()
        results: list[dict[str, object]] = []
        failure_counter: Counter[str] = Counter()
        worker_count = max(1, min(self.batch_size, len(rows), 32))

        with ThreadPoolExecutor(max_workers=worker_count) as executor:
            futures = [executor.submit(self._embed_row_with_retry, row) for row in rows]
            for future in as_completed(futures):
                try:
                    record, attempts = future.result()
                except EmbeddingProcessingError as exc:
                    stats.api_call_count += exc.attempts
                    failure_counter[exc.error_type] += 1
                    stats.completed_count += 1
                    stats.failure_counts = dict(failure_counter)
                    if progress_callback:
                        progress_callback(stats.completed_count, len(rows), stats)
                    continue

                stats.api_call_count += attempts
                stats.success_count += 1
                stats.completed_count += 1
                results.append(record)
                stats.failure_counts = dict(failure_counter)

                if progress_callback:
                    progress_callback(stats.completed_count, len(rows), stats)

                if checkpoint_callback and stats.success_count % self.checkpoint_interval == 0:
                    stats.checkpoint_count += 1
                    checkpoint_callback(results, stats)

        stats.failure_counts = dict(failure_counter)
        return results, stats

    def _embed_row_with_retry(self, row: dict[str, object]) -> tuple[dict[str, object], int]:
        attempts = 0
        for attempt_index in range(1, self.max_attempts + 1):
            attempts = attempt_index
            self._wait_for_rate_limit()
            try:
                embedding = self.client.embed_text(str(row["text"]))
            except Exception as exc:
                error_type = type(exc).__name__
                if attempt_index >= self.max_attempts or not is_retryable_error(exc):
                    raise EmbeddingProcessingError(error_type, attempts, str(exc)) from exc

                delay = float(2 ** (attempt_index - 1))
                self.logger.warning(
                    "Retrying embedding for %s after %s (%ss backoff, attempt %s/%s).",
                    row["article_id"],
                    error_type,
                    delay,
                    attempt_index,
                    self.max_attempts,
                )
                self.sleep_fn(delay)
                continue

            return {
                "country_code": row["country_code"],
                "country_name": row["country_name"],
                "year": int(row["year"]),
                "article_id": row["article_id"],
                "text": row["text"],
                "embedding": embedding,
                "model": self.client.model,
                "dimensions": self.client.dimensions,
                "embedded_at": datetime.now(timezone.utc).isoformat(),
            }, attempts

        raise EmbeddingProcessingError("UnknownError", attempts, "Unexpected retry exhaustion.")

    def _wait_for_rate_limit(self) -> None:
        if self.max_rpm <= 0:
            return

        interval = 60.0 / float(self.max_rpm)
        sleep_for = 0.0

        with self._rate_lock:
            now = self.monotonic_fn()
            scheduled_at = max(now, self._next_request_at or now)
            sleep_for = max(0.0, scheduled_at - now)
            self._next_request_at = scheduled_at + interval

        if sleep_for > 0:
            self.sleep_fn(sleep_for)
