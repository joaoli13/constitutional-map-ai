from __future__ import annotations

import csv
import json

import pytest

from src.m2_segmenter.csv_writer import (
    REPORT_FILENAME,
    write_all_articles_csv,
    write_country_csv,
    write_segmentation_report,
)
from src.m2_segmenter.segmenter import ConstitutionalSegmenter
from src.shared.constants import ALL_ARTICLES_FILENAME
from src.shared.models import CountryMetadata


def _metadata() -> CountryMetadata:
    return CountryMetadata(
        country_name="Testland",
        country_code="TST",
        iso_alpha2="TS",
        region="Test Region",
        sub_region="Test Sub-region",
        constitution_year=2024,
        last_amendment_year=None,
        language="en",
        available_languages=["en"],
        source_url="https://example.test/constitution/Testland_2024?lang=en",
        file_path="data/raw/TST_2024.txt",
        status="success",
    )


def _article_text(prefix: str) -> str:
    blocks = []
    for number in range(1, 7):
        blocks.extend(
            [
                f"{prefix} {number}",
                f"Body of segment {number}.",
            ]
        )
    return "\n\n".join(blocks)


def _section_text() -> str:
    blocks = []
    for number in range(1, 7):
        blocks.extend(
            [
                f"Section {number}. Heading {number}",
                f"Body of segment {number}.",
            ]
        )
    return "\n\n".join(blocks)


def _symbol_text() -> str:
    blocks = []
    for number in range(1, 7):
        blocks.extend(
            [
                f"§ {number}",
                f"Body of segment {number}.",
            ]
        )
    return "\n\n".join(blocks)


def _numeric_text() -> str:
    blocks = []
    for number in range(1, 7):
        blocks.extend(
            [
                f"{number}. Heading {number}",
                f"Body of segment {number}.",
            ]
        )
    return "\n\n".join(blocks)


def _chapter_text(prefix: str) -> str:
    numerals = ["I", "II", "III", "IV", "V", "VI"]
    blocks = []
    for index, numeral in enumerate(numerals, start=1):
        blocks.extend(
            [
                f"{prefix} {numeral}. Heading {index}",
                f"Body of segment {index}.",
            ]
        )
    return "\n\n".join(blocks)


@pytest.mark.parametrize(
    ("pattern_name", "text"),
    [
        ("article", _article_text("Article")),
        ("art", _article_text("Art")),
        ("section", _section_text()),
        ("symbol", _symbol_text()),
        ("numeric", _numeric_text()),
        ("chapter", _chapter_text("Chapter")),
        ("part", _chapter_text("Part")),
    ],
)
def test_segmenter_detects_each_supported_pattern(pattern_name: str, text: str) -> None:
    segmenter = ConstitutionalSegmenter(token_counter=lambda value: len(value.split()))
    articles, report = segmenter.segment_country(_metadata(), text)

    assert report.pattern == pattern_name
    assert len(articles) == 6
    assert all(article.text for article in articles)
    if pattern_name in {"chapter", "part"}:
        assert report.fallback_used is True
    else:
        assert report.fallback_used is False


def test_segmenter_splits_oversized_segments_and_suffixes_ids() -> None:
    text = "\n\n".join(
        [
            "Article 1",
            "alpha beta gamma delta epsilon zeta",
            "eta theta iota kappa lambda mu",
            "Article 2",
            "short body",
            "Article 3",
            "short body",
            "Article 4",
            "short body",
            "Article 5",
            "short body",
            "Article 6",
            "short body",
        ]
    )
    segmenter = ConstitutionalSegmenter(token_counter=lambda value: len(value.split()), max_tokens=5)
    articles, _ = segmenter.segment_country(_metadata(), text)

    oversized_parts = [article for article in articles if article.article_id.startswith("Article 1.p")]
    assert len(oversized_parts) >= 2
    assert all(len(article.text.split()) <= 5 for article in oversized_parts)


def test_segmenter_reports_low_counts_and_removes_duplicates() -> None:
    text = "\n\n".join(
        [
            "Article 1",
            "same text",
            "Article 2",
            "same text",
            "Article 3",
            "different text",
        ]
    )
    segmenter = ConstitutionalSegmenter(token_counter=lambda value: len(value.split()))
    articles, report = segmenter.segment_country(_metadata(), text)

    assert len(articles) == 2
    assert report.duplicate_count == 1
    assert any("below the expected minimum" in warning for warning in report.warnings)
    assert any("Removed 1 duplicate segments." == warning for warning in report.warnings)


def test_csv_writer_outputs_country_consolidated_and_report_files(tmp_path) -> None:
    segmenter = ConstitutionalSegmenter(token_counter=lambda value: len(value.split()))
    articles, report = segmenter.segment_country(_metadata(), _article_text("Article"))

    country_csv = write_country_csv(articles, output_dir=tmp_path)
    consolidated_csv = write_all_articles_csv(articles, output_dir=tmp_path)
    report_json = write_segmentation_report([report], output_dir=tmp_path)

    assert country_csv.name == "TST_2024.csv"
    assert consolidated_csv.name == ALL_ARTICLES_FILENAME
    assert report_json.name == REPORT_FILENAME

    with country_csv.open(encoding="utf-8", newline="") as file_obj:
        rows = list(csv.DictReader(file_obj))
    assert rows[0]["NomeDoPais"] == "Testland"
    assert rows[0]["NrDispositivo"] == "Article 1"

    payload = json.loads(report_json.read_text(encoding="utf-8"))
    assert payload[0]["pattern"] == "article"
    assert payload[0]["segment_count"] == 6
