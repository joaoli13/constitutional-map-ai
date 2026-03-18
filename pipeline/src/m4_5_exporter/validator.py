"""Validation checks for exported JSON files and Neon ingest."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

COUNTRY_FILE_MAX_BYTES = 500 * 1024
TOTAL_DATA_MAX_BYTES = 60 * 1024 * 1024


class ExportValidationError(RuntimeError):
    """Raised when exported artifacts are inconsistent."""


@dataclass
class ValidationSummary:
    country_file_count: int
    has_data_count: int
    total_articles: int
    neon_article_count: int | None
    total_data_size_bytes: int


def validate_exports(
    *,
    clustered_frame: pd.DataFrame,
    index_path: Path | str,
    clusters_path: Path | str,
    countries_dir: Path | str,
    neon_article_count: int | None,
) -> ValidationSummary:
    """Validate exported files against the clustered source data."""

    index_path = Path(index_path)
    clusters_path = Path(clusters_path)
    countries_dir = Path(countries_dir)
    errors: list[str] = []

    if not index_path.exists():
        errors.append(f"Missing index.json: {index_path}")
    if not clusters_path.exists():
        errors.append(f"Missing clusters.json: {clusters_path}")
    if not countries_dir.exists():
        errors.append(f"Missing countries directory: {countries_dir}")

    if errors:
        raise ExportValidationError("; ".join(errors))

    index_payload = json.loads(index_path.read_text(encoding="utf-8"))
    countries = index_payload.get("countries", [])
    total_articles = int(index_payload.get("total_articles", -1))
    expected_total = int(len(clustered_frame))

    summed_article_count = int(sum(int(country["article_count"]) for country in countries))
    if total_articles != expected_total:
        errors.append(
            f"index.json total_articles={total_articles} does not match clustered rows={expected_total}"
        )
    if summed_article_count != total_articles:
        errors.append(
            f"Sum of country article_count values ({summed_article_count}) does not match total_articles={total_articles}"
        )

    has_data_countries = [country["code"] for country in countries if country.get("has_data")]
    country_files = sorted(countries_dir.glob("*.json"))
    country_file_codes = [path.stem for path in country_files]
    if len(country_files) != len(has_data_countries):
        errors.append(
            f"Country file count ({len(country_files)}) does not match has_data count ({len(has_data_countries)})"
        )
    if sorted(country_file_codes) != sorted(has_data_countries):
        errors.append("Country JSON filenames do not match the countries marked has_data=true.")

    for path in country_files:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if any(not point.get("text_snippet", "").strip() for point in payload):
            errors.append(f"Country file {path.name} contains an empty text_snippet.")
        if path.stat().st_size > COUNTRY_FILE_MAX_BYTES:
            errors.append(f"Country file {path.name} exceeds {COUNTRY_FILE_MAX_BYTES} bytes.")

    total_data_size = sum(
        file_path.stat().st_size
        for file_path in [index_path, clusters_path, *country_files]
        if file_path.exists()
    )
    if total_data_size > TOTAL_DATA_MAX_BYTES:
        errors.append(
            f"Exported data size {total_data_size} exceeds {TOTAL_DATA_MAX_BYTES} bytes."
        )

    if neon_article_count is not None and neon_article_count != expected_total:
        errors.append(
            f"Neon article count {neon_article_count} does not match clustered rows={expected_total}"
        )

    if errors:
        raise ExportValidationError("; ".join(errors))

    return ValidationSummary(
        country_file_count=len(country_files),
        has_data_count=len(has_data_countries),
        total_articles=total_articles,
        neon_article_count=neon_article_count,
        total_data_size_bytes=total_data_size,
    )
