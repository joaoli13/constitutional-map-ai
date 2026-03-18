"""Core segmentation pipeline for constitutional texts."""

from __future__ import annotations

import logging
import re
from dataclasses import asdict, dataclass, field
from functools import lru_cache
from pathlib import Path
from typing import Callable

import tiktoken

from src.m2_segmenter.patterns import FALLBACK_PATTERNS, PRIMARY_PATTERNS, SegmentPattern
from src.m2_segmenter.validators import (
    character_coverage_ratio,
    remove_duplicate_articles,
    validate_character_coverage,
    validate_segment_count,
)
from src.m1_scraper.url_builder import extract_document_year_from_file_path
from src.shared.constants import RAW_DIR, SEGMENT_MAX_COUNT, SEGMENT_MAX_TOKENS, SEGMENT_MIN_COUNT
from src.shared.models import Article, CountryMetadata

LOGGER = logging.getLogger(__name__)
_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?;:])\s+")
_WHITESPACE_RE = re.compile(r"\s+")


@dataclass
class SegmentationReport:
    country_name: str
    country_code: str
    year: int
    pattern: str
    fallback_used: bool
    segment_count: int
    duplicate_count: int
    coverage_ratio: float
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["coverage_ratio"] = round(self.coverage_ratio, 6)
        return payload


class ConstitutionalSegmenter:
    """Segment raw constitutional texts into article-level records."""

    def __init__(
        self,
        *,
        raw_dir: Path | str = RAW_DIR,
        token_counter: Callable[[str], int] | None = None,
        max_tokens: int = SEGMENT_MAX_TOKENS,
        logger: logging.Logger | None = None,
    ) -> None:
        self.raw_dir = Path(raw_dir)
        self.token_counter = token_counter or default_token_counter
        self.max_tokens = max_tokens
        self.logger = logger or LOGGER

    def segment_country(
        self,
        metadata: CountryMetadata,
        raw_text: str,
    ) -> tuple[list[Article], SegmentationReport]:
        source_text = normalize_source_text(raw_text)
        document_year = extract_document_year_from_file_path(metadata.file_path)
        year = document_year or metadata.last_amendment_year or metadata.constitution_year

        pattern, segments, fallback_used = self._detect_segments(source_text)
        warnings: list[str] = []

        if not segments:
            warnings.append("No segment boundary matched; the full document was kept as one segment.")
            pattern_name = "document"
            segments = [("Document 1", source_text)]
            fallback_used = True
        else:
            pattern_name = pattern.name
            if fallback_used:
                warnings.append(
                    f"Structural or best-effort fallback used with pattern '{pattern_name}'."
                )

        articles = [
            Article(
                country_name=metadata.country_name,
                country_code=metadata.country_code,
                year=year,
                article_id=identifier,
                text=body,
            )
            for identifier, body in segments
            if body.strip()
        ]

        articles = self._split_oversized_articles(articles)
        articles, duplicate_count = remove_duplicate_articles(articles)
        if duplicate_count:
            warnings.append(f"Removed {duplicate_count} duplicate segments.")

        coverage_ratio = character_coverage_ratio(source_text, articles)
        warnings.extend(validate_segment_count(len(articles)))
        coverage_warning = validate_character_coverage(coverage_ratio)
        if coverage_warning is not None:
            warnings.append(coverage_warning)

        report = SegmentationReport(
            country_name=metadata.country_name,
            country_code=metadata.country_code,
            year=year,
            pattern=pattern_name,
            fallback_used=fallback_used,
            segment_count=len(articles),
            duplicate_count=duplicate_count,
            coverage_ratio=coverage_ratio,
            warnings=warnings,
        )

        self._log_report(report)
        return articles, report

    def _detect_segments(
        self,
        text: str,
    ) -> tuple[SegmentPattern | None, list[tuple[str, str]], bool]:
        best_primary: tuple[SegmentPattern, list[tuple[str, str]]] | None = None

        for pattern in PRIMARY_PATTERNS:
            segments = split_with_pattern(text, pattern)
            if SEGMENT_MIN_COUNT <= len(segments) <= SEGMENT_MAX_COUNT:
                return pattern, segments, False
            if segments and (best_primary is None or len(segments) > len(best_primary[1])):
                best_primary = (pattern, segments)

        for pattern in FALLBACK_PATTERNS:
            segments = split_with_pattern(text, pattern)
            if segments:
                return pattern, segments, True

        if best_primary is not None:
            return best_primary[0], best_primary[1], True

        return None, [], True

    def _split_oversized_articles(self, articles: list[Article]) -> list[Article]:
        expanded_articles: list[Article] = []
        for article in articles:
            if self.token_counter(article.text) <= self.max_tokens:
                expanded_articles.append(article)
                continue

            chunks = split_oversized_text(
                article.text,
                max_tokens=self.max_tokens,
                token_counter=self.token_counter,
            )
            for index, chunk in enumerate(chunks, start=1):
                expanded_articles.append(
                    Article(
                        country_name=article.country_name,
                        country_code=article.country_code,
                        year=article.year,
                        article_id=f"{article.article_id}.p{index}",
                        text=chunk,
                    )
                )
        return expanded_articles

    def _log_report(self, report: SegmentationReport) -> None:
        for warning in report.warnings:
            self.logger.warning("%s [%s]: %s", report.country_name, report.pattern, warning)


def split_with_pattern(text: str, pattern: SegmentPattern) -> list[tuple[str, str]]:
    matches = list(pattern.regex.finditer(text))
    if not matches:
        return []

    segments: list[tuple[str, str]] = []
    orphan_prefix = text[: matches[0].start()].strip()

    if orphan_prefix:
        segments.append(("Preamble", orphan_prefix))

    for index, match in enumerate(matches):
        identifier = normalize_source_text(match.group(0))
        next_start = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        body = text[match.end() : next_start].strip()

        if not body:
            continue

        segments.append((identifier, body))

    return segments


def split_oversized_text(
    text: str,
    *,
    max_tokens: int,
    token_counter: Callable[[str], int],
) -> list[str]:
    paragraphs = [paragraph.strip() for paragraph in text.split("\n\n") if paragraph.strip()]
    if not paragraphs:
        return [normalize_source_text(text)]

    chunks: list[str] = []
    current_parts: list[str] = []

    for paragraph in paragraphs:
        candidate = join_paragraphs([*current_parts, paragraph])
        if current_parts and token_counter(candidate) > max_tokens:
            chunks.append(join_paragraphs(current_parts))
            current_parts = []

        if token_counter(paragraph) <= max_tokens:
            current_parts.append(paragraph)
            continue

        if current_parts:
            chunks.append(join_paragraphs(current_parts))
            current_parts = []

        chunks.extend(split_long_paragraph(paragraph, max_tokens=max_tokens, token_counter=token_counter))

    if current_parts:
        chunks.append(join_paragraphs(current_parts))

    return chunks


def split_long_paragraph(
    paragraph: str,
    *,
    max_tokens: int,
    token_counter: Callable[[str], int],
) -> list[str]:
    sentences = [sentence.strip() for sentence in _SENTENCE_SPLIT_RE.split(paragraph) if sentence.strip()]
    if len(sentences) <= 1:
        return split_long_sentence(paragraph, max_tokens=max_tokens, token_counter=token_counter)

    chunks: list[str] = []
    current_sentences: list[str] = []
    for sentence in sentences:
        candidate = " ".join([*current_sentences, sentence]).strip()
        if current_sentences and token_counter(candidate) > max_tokens:
            chunks.append(" ".join(current_sentences).strip())
            current_sentences = []

        if token_counter(sentence) > max_tokens:
            if current_sentences:
                chunks.append(" ".join(current_sentences).strip())
                current_sentences = []
            chunks.extend(split_long_sentence(sentence, max_tokens=max_tokens, token_counter=token_counter))
            continue

        current_sentences.append(sentence)

    if current_sentences:
        chunks.append(" ".join(current_sentences).strip())

    return chunks


def split_long_sentence(
    sentence: str,
    *,
    max_tokens: int,
    token_counter: Callable[[str], int],
) -> list[str]:
    words = sentence.split()
    chunks: list[str] = []
    current_words: list[str] = []

    for word in words:
        candidate = " ".join([*current_words, word]).strip()
        if current_words and token_counter(candidate) > max_tokens:
            chunks.append(" ".join(current_words).strip())
            current_words = [word]
            continue
        current_words.append(word)

    if current_words:
        chunks.append(" ".join(current_words).strip())

    return chunks


def join_paragraphs(paragraphs: list[str]) -> str:
    return "\n\n".join(paragraph.strip() for paragraph in paragraphs if paragraph.strip()).strip()


def normalize_source_text(text: str) -> str:
    lines = [line.rstrip() for line in text.replace("\r\n", "\n").replace("\r", "\n").split("\n")]
    normalized_lines = [line for line in lines]
    normalized_text = "\n".join(normalized_lines)
    normalized_text = re.sub(r"\n{3,}", "\n\n", normalized_text)
    return normalized_text.strip()


@lru_cache(maxsize=1)
def _encoding() -> tiktoken.Encoding:
    return tiktoken.get_encoding("cl100k_base")


def default_token_counter(text: str) -> int:
    compact_text = _WHITESPACE_RE.sub(" ", text).strip()
    if not compact_text:
        return 0
    return len(_encoding().encode(compact_text))
