"""Main semantic embedding pipeline."""

from __future__ import annotations

import json
import logging
import math
import os
import time
from dataclasses import asdict, dataclass
from contextlib import nullcontext
from pathlib import Path
from typing import Callable

import pandas as pd
import tiktoken
from tqdm.auto import tqdm

from src.m1_scraper.url_builder import extract_document_year_from_file_path
from src.m3_embedder.batch_processor import BatchProcessingStats, EmbeddingBatchProcessor
from src.m3_embedder.cache import (
    EMBEDDING_COLUMNS,
    combine_embedding_frames,
    load_embedding_cache,
    split_pending_rows,
    write_embedding_cache,
)
from src.m3_embedder.gemini_client import GeminiEmbeddingClient
from src.shared.constants import (
    ALL_ARTICLES_FILENAME,
    ARTICLES_DIR,
    DEFAULT_EMBEDDING_DIMENSIONS,
    DEFAULT_EMBEDDING_MODEL,
    DEFAULT_EMBEDDING_TASK_TYPE,
    EMBEDDINGS_DIR,
    RAW_DIR,
)

LOGGER = logging.getLogger(__name__)
REPORT_FILENAME = "embedding_report.json"


@dataclass
class EmbeddingRunReport:
    total_segments: int
    cached_segments: int
    embedded_segments: int
    api_call_count: int
    failure_counts: dict[str, int]
    elapsed_seconds: float
    estimated_cost_usd: float
    output_path: str
    report_path: str

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["elapsed_seconds"] = round(self.elapsed_seconds, 3)
        payload["estimated_cost_usd"] = round(self.estimated_cost_usd, 6)
        return payload


class ConstitutionalEmbedder:
    """Generate semantic embeddings for segmented constitutional articles."""

    def __init__(
        self,
        *,
        articles_path: Path | str = ARTICLES_DIR / ALL_ARTICLES_FILENAME,
        metadata_path: Path | str = RAW_DIR / "metadata.json",
        output_path: Path | str = EMBEDDINGS_DIR / "embeddings.parquet",
        report_path: Path | str = EMBEDDINGS_DIR / REPORT_FILENAME,
        client: GeminiEmbeddingClient | None = None,
        batch_processor: EmbeddingBatchProcessor | None = None,
        token_counter: Callable[[str], int] | None = None,
        logger: logging.Logger | None = None,
    ) -> None:
        self.articles_path = Path(articles_path)
        self.metadata_path = Path(metadata_path)
        self.output_path = Path(output_path)
        self.report_path = Path(report_path)
        self.logger = logger or LOGGER
        self.client = client or GeminiEmbeddingClient(
            model=os.getenv("EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL),
            dimensions=int(os.getenv("EMBEDDING_DIMENSIONS", str(DEFAULT_EMBEDDING_DIMENSIONS))),
            task_type=os.getenv("EMBEDDING_TASK_TYPE", DEFAULT_EMBEDDING_TASK_TYPE),
        )
        self.batch_processor = batch_processor or EmbeddingBatchProcessor(self.client)
        self.token_counter = token_counter or default_token_counter

    def run(
        self,
        *,
        limit: int | None = None,
        country_code: str | None = None,
        write_report: bool = True,
        show_progress: bool = False,
    ) -> EmbeddingRunReport:
        started_at = time.perf_counter()
        articles_frame = self._load_articles_frame()

        if country_code:
            articles_frame = articles_frame[
                articles_frame["country_code"] == country_code.upper()
            ].reset_index(drop=True)
        if limit is not None:
            articles_frame = articles_frame.head(limit).reset_index(drop=True)

        if articles_frame.empty:
            combined = combine_embedding_frames(
                load_embedding_cache(
                    self.output_path,
                    expected_dimensions=self.client.dimensions,
                    expected_model=self.client.model,
                ),
                [],
            )
            write_embedding_cache(combined, self.output_path)
            report = EmbeddingRunReport(
                total_segments=0,
                cached_segments=0,
                embedded_segments=0,
                api_call_count=0,
                failure_counts={},
                elapsed_seconds=time.perf_counter() - started_at,
                estimated_cost_usd=0.0,
                output_path=str(self.output_path),
                report_path=str(self.report_path),
            )
            if write_report:
                self._write_report(report)
            return report

        cache_frame = load_embedding_cache(
            self.output_path,
            expected_dimensions=self.client.dimensions,
            expected_model=self.client.model,
        )
        pending_frame, cached_count = split_pending_rows(articles_frame, cache_frame)
        pending_rows = pending_frame.to_dict(orient="records")
        new_rows: list[dict[str, object]] = []

        def checkpoint_callback(
            current_rows: list[dict[str, object]],
            _stats: BatchProcessingStats,
        ) -> None:
            combined = combine_embedding_frames(cache_frame, current_rows)
            write_embedding_cache(combined, self.output_path)

        progress_context = (
            tqdm(total=len(pending_rows), desc="Embedding", unit="segment", leave=True)
            if show_progress and pending_rows
            else nullcontext()
        )
        with progress_context as progress_bar:
            if progress_bar is not None:
                progress_bar.set_postfix(cached=cached_count, failed=0, api_calls=0)

            def progress_callback(
                completed_count: int,
                total_count: int,
                stats: BatchProcessingStats,
            ) -> None:
                if progress_bar is None:
                    return
                progress_bar.update(completed_count - progress_bar.n)
                progress_bar.set_postfix(
                    cached=cached_count,
                    failed=stats.failure_count,
                    api_calls=stats.api_call_count,
                )
                if completed_count >= total_count:
                    progress_bar.refresh()

            if pending_rows:
                new_rows, stats = self.batch_processor.process_rows(
                    pending_rows,
                    checkpoint_callback=checkpoint_callback,
                    progress_callback=progress_callback if progress_bar is not None else None,
                )
            else:
                stats = BatchProcessingStats()

        combined = combine_embedding_frames(cache_frame, new_rows)
        write_embedding_cache(combined, self.output_path)

        elapsed_seconds = time.perf_counter() - started_at
        estimated_cost = estimate_embedding_cost_usd(
            pending_rows,
            price_per_million_tokens=float(
                os.getenv("EMBEDDING_PRICE_PER_MILLION_TOKENS", "0.15")
            ),
            token_counter=self.token_counter,
        )
        report = EmbeddingRunReport(
            total_segments=len(articles_frame),
            cached_segments=cached_count,
            embedded_segments=len(new_rows),
            api_call_count=stats.api_call_count,
            failure_counts=stats.failure_counts,
            elapsed_seconds=elapsed_seconds,
            estimated_cost_usd=estimated_cost,
            output_path=str(self.output_path),
            report_path=str(self.report_path),
        )
        if write_report:
            self._write_report(report)
        return report

    def _load_articles_frame(self) -> pd.DataFrame:
        if not self.articles_path.exists():
            raise FileNotFoundError(f"Articles CSV not found: {self.articles_path}")
        if not self.metadata_path.exists():
            raise FileNotFoundError(f"Metadata JSON not found: {self.metadata_path}")

        frame = pd.read_csv(self.articles_path)
        required_columns = {"NomeDoPais", "Data", "NrDispositivo", "Texto"}
        missing_columns = required_columns.difference(frame.columns)
        if missing_columns:
            raise ValueError(f"Articles CSV is missing required columns: {sorted(missing_columns)}")

        frame = frame.rename(
            columns={
                "NomeDoPais": "country_name",
                "Data": "year",
                "NrDispositivo": "article_id",
                "Texto": "text",
            }
        )
        frame = frame.loc[:, ["country_name", "year", "article_id", "text"]].copy()
        frame["year"] = frame["year"].astype(int)
        frame["text"] = frame["text"].fillna("").astype(str)
        frame["country_code"] = self._resolve_country_codes(frame)
        frame = frame.loc[:, ["country_code", "country_name", "year", "article_id", "text"]]
        frame = frame.drop_duplicates(subset=["country_code", "year", "article_id"], keep="first")
        return frame.reset_index(drop=True)

    def _resolve_country_codes(self, frame: pd.DataFrame) -> pd.Series:
        metadata_payload = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        direct_map: dict[tuple[str, int], str] = {}
        fallback_name_map: dict[str, set[str]] = {}

        for item in metadata_payload:
            if item.get("status") != "success":
                continue

            country_name = str(item["country_name"])
            country_code = str(item["country_code"])
            document_year = extract_document_year_from_file_path(str(item["file_path"]))
            if document_year is None:
                document_year = int(item["constitution_year"])

            direct_map[(country_name, document_year)] = country_code
            fallback_name_map.setdefault(country_name, set()).add(country_code)

        resolved_codes: list[str] = []
        for row in frame.itertuples(index=False):
            direct_match = direct_map.get((row.country_name, int(row.year)))
            if direct_match is not None:
                resolved_codes.append(direct_match)
                continue

            fallback_codes = fallback_name_map.get(row.country_name, set())
            if len(fallback_codes) == 1:
                resolved_codes.append(next(iter(fallback_codes)))
                continue

            raise ValueError(
                f"Could not resolve country code for {row.country_name!r} ({row.year})."
            )

        return pd.Series(resolved_codes, index=frame.index)

    def _write_report(self, report: EmbeddingRunReport) -> None:
        self.report_path.parent.mkdir(parents=True, exist_ok=True)
        self.report_path.write_text(
            json.dumps(report.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )


def default_token_counter(text: str) -> int:
    """Approximate Gemini billing tokens for cost estimation."""

    encoding = tiktoken.get_encoding("cl100k_base")
    return len(encoding.encode(text))


def estimate_embedding_cost_usd(
    rows: list[dict[str, object]],
    *,
    price_per_million_tokens: float,
    token_counter: Callable[[str], int],
) -> float:
    """Estimate embedding cost from the text payload size."""

    total_tokens = sum(token_counter(str(row["text"])) for row in rows)
    return (total_tokens / 1_000_000.0) * price_per_million_tokens
