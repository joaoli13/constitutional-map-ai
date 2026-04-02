"""M4.6 Cluster Labeller — generates multilingual names for top clusters."""

from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd
from tqdm import tqdm

from src.m4_6_labeler.gemini_text_client import GeminiTextClient
from src.m4_6_labeler.prompt_builder import build_prompt, sample_country_texts
from src.shared.models import ClusterIndexEntry

LOGGER = logging.getLogger(__name__)

_TOP_N = 10
_JSON_RE = re.compile(r"\{[^{}]*\}", re.DOTALL)


@dataclass
class LabellingResult:
    labelled: int = 0
    skipped: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


def _parse_labels(raw: str) -> dict[str, str]:
    """Extract the JSON object from the model response."""
    match = _JSON_RE.search(raw)
    if not match:
        raise ValueError(f"No JSON object found in response: {raw!r}")
    return json.loads(match.group())


def _load_clusters(clusters_path: Path) -> list[dict]:
    return json.loads(clusters_path.read_text(encoding="utf-8"))


def _save_clusters(clusters_path: Path, payload: list[dict]) -> None:
    clusters_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def label_top_clusters(
    clusters_path: Path,
    clustered_frame: pd.DataFrame,
    *,
    dry_run: bool = False,
    show_progress: bool = False,
    api_key: str | None = None,
    model: str | None = None,
) -> LabellingResult:
    """Label the top-N clusters by country_count and patch clusters.json.

    Parameters
    ----------
    clusters_path:
        Path to the ``clusters.json`` file produced by M4.5.
    clustered_frame:
        The clustered parquet DataFrame (must contain columns: country_code,
        global_cluster, x, y, z, text).
    dry_run:
        If True, build prompts and parse mock responses but do NOT write to disk
        and do NOT call the Gemini API.
    show_progress:
        Render a tqdm progress bar when True.
    api_key:
        Gemini API key (falls back to ``GEMINI_API_KEY`` env var).
    model:
        Gemini model name override.
    """
    payload = _load_clusters(clusters_path)

    # Identify top-N by country_count.
    entries = [ClusterIndexEntry.model_validate(item) for item in payload]
    top_entries = sorted(entries, key=lambda e: e.country_count, reverse=True)[:_TOP_N]

    client_kwargs: dict = {}
    if api_key:
        client_kwargs["api_key"] = api_key
    if model:
        client_kwargs["model"] = model

    client: GeminiTextClient | None = None
    if not dry_run:
        client = GeminiTextClient(**client_kwargs)

    result = LabellingResult()
    avoid: list[str] = []  # accumulates English names for distinctness

    for entry in tqdm(
        top_entries,
        total=len(top_entries),
        desc="Label clusters",
        unit="cluster",
        disable=not show_progress,
    ):
        samples = sample_country_texts(entry, clustered_frame)
        if not samples:
            LOGGER.warning("Cluster %d: no sample texts found, skipping.", entry.id)
            result.skipped += 1
            continue

        prompt = build_prompt(entry, samples, avoid)

        if dry_run:
            LOGGER.info("Cluster %d: dry-run, skipping Gemini call.", entry.id)
            result.skipped += 1
            continue

        try:
            assert client is not None
            raw = client.generate(prompt)
            labels = _parse_labels(raw)
        except Exception as exc:
            msg = f"Cluster {entry.id}: labelling failed — {exc}"
            LOGGER.error(msg)
            result.errors.append(msg)
            result.failed += 1
            continue

        # Patch the payload entry.
        for item in payload:
            if item.get("id") == entry.id:
                item["labels"] = labels
                break

        if "en" in labels:
            avoid.append(labels["en"])

        result.labelled += 1
        LOGGER.info("Cluster %d labelled: %s", entry.id, labels.get("en", "?"))

    # Only persist when not in dry-run and at least one label was written.
    if not dry_run and result.labelled > 0:
        _save_clusters(clusters_path, payload)
        LOGGER.info(
            "clusters.json updated: %d labelled, %d skipped, %d failed.",
            result.labelled,
            result.skipped,
            result.failed,
        )
    elif not dry_run:
        LOGGER.warning("No clusters were labelled; clusters.json not modified.")

    # Verify that only top_ids clusters are labelled (safety check).
    unlabelled_top = [e.id for e in top_entries if e.id not in {
        item["id"] for item in payload if item.get("labels")
    }]
    if unlabelled_top and not dry_run:
        LOGGER.warning("Some top clusters still lack labels: %s", unlabelled_top)

    return result
