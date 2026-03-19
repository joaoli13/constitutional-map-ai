"""Validation helpers for constitutional segmentation."""

from __future__ import annotations

import re

from src.shared.constants import SEGMENT_MAX_COUNT, SEGMENT_MIN_COUNT
from src.shared.models import Article


def validate_segment_count(segment_count: int) -> list[str]:
    warnings: list[str] = []
    if segment_count < SEGMENT_MIN_COUNT:
        warnings.append(
            f"Segment count {segment_count} is below the expected minimum of {SEGMENT_MIN_COUNT}."
        )
    if segment_count > SEGMENT_MAX_COUNT:
        warnings.append(
            f"Segment count {segment_count} exceeds the expected maximum of {SEGMENT_MAX_COUNT}."
        )
    return warnings


def remove_duplicate_articles(articles: list[Article]) -> tuple[list[Article], int]:
    seen_texts: set[str] = set()
    unique_articles: list[Article] = []
    duplicates = 0

    for article in articles:
        normalized_text = _normalize_text(article.text)
        if normalized_text in seen_texts:
            duplicates += 1
            continue
        seen_texts.add(normalized_text)
        unique_articles.append(article)

    return unique_articles, duplicates


def character_coverage_ratio(source_text: str, articles: list[Article]) -> float:
    normalized_source_length = len(_normalize_text(source_text))
    if normalized_source_length == 0:
        return 1.0

    normalized_segment_length = sum(
        len(_normalize_text(f"{article.article_id} {article.text}")) for article in articles
    )
    return normalized_segment_length / normalized_source_length


def validate_character_coverage(coverage_ratio: float, tolerance: float = 0.05) -> str | None:
    if abs(1.0 - coverage_ratio) <= tolerance:
        return None

    return (
        f"Character coverage ratio {coverage_ratio:.3f} fell outside the expected "
        f"{1.0 - tolerance:.2f}-{1.0 + tolerance:.2f} range."
    )


def _normalize_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()
