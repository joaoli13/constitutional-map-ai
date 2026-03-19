from __future__ import annotations

import csv
import json

import pytest

from src.m2_segmenter.csv_writer import (
    REPORT_FILENAME,
    remove_stale_country_csvs,
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


def _article_text_with_titles(prefix: str) -> str:
    blocks = []
    for number in range(1, 7):
        blocks.extend(
            [
                f"{prefix} {number}. Heading {number}",
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


def test_segmenter_detects_article_headers_with_titles_after_number() -> None:
    segmenter = ConstitutionalSegmenter(token_counter=lambda value: len(value.split()))
    articles, report = segmenter.segment_country(_metadata(), _article_text_with_titles("Article"))

    assert report.pattern == "article"
    assert len(articles) == 6
    assert articles[0].article_id == "Article 1. Heading 1"
    assert articles[0].text == "Body of segment 1."


def test_segmenter_emits_preamble_as_its_own_segment() -> None:
    text = "\n\n".join(
        [
            "Preamble",
            "Introductory text before the first article.",
            "Article 1. Heading 1",
            "Body of segment 1.",
            "Article 2. Heading 2",
            "Body of segment 2.",
            "Article 3. Heading 3",
            "Body of segment 3.",
            "Article 4. Heading 4",
            "Body of segment 4.",
            "Article 5. Heading 5",
            "Body of segment 5.",
            "Article 6. Heading 6",
            "Body of segment 6.",
        ]
    )
    segmenter = ConstitutionalSegmenter(token_counter=lambda value: len(value.split()))
    articles, report = segmenter.segment_country(_metadata(), text)

    assert report.pattern == "article"
    assert len(articles) == 7
    assert articles[0].article_id == "Preamble"
    assert articles[0].text == "Preamble\n\nIntroductory text before the first article."
    assert articles[1].article_id == "Article 1. Heading 1"
    assert articles[1].text == "Body of segment 1."


def test_segmenter_detects_mixed_numeric_article_headers_like_saint_lucia() -> None:
    text = "\n\n".join(
        [
            "Preamble",
            "Foundational text before the numbered provisions.",
            "CHAPTER I. RIGHTS",
            "1. Whereas every person is entitled to the protection of the law.",
            "a. life and liberty;",
            "b. freedom of conscience.",
            "2",
            "1. A person shall not be deprived of life intentionally.",
            "2. This protection applies in accordance with law.",
            "3",
            "1. A person shall not be deprived of personal liberty save as authorized by law.",
            "2. Judicial safeguards shall apply.",
            "4",
            "1. No person shall be held in slavery or servitude.",
            "2. Forced labour is prohibited.",
            "5. No person shall be subjected to torture.",
            "2. No person shall be subjected to inhuman treatment.",
            "6",
            "1. No person shall be deprived of property except by law.",
            "2. Compensation shall be provided when required.",
        ]
    )
    segmenter = ConstitutionalSegmenter(token_counter=lambda value: len(value.split()))
    articles, report = segmenter.segment_country(_metadata(), text)

    assert report.pattern == "numeric_heading"
    assert report.fallback_used is False
    assert len(articles) == 7
    assert articles[0].article_id == "Preamble"
    assert articles[1].article_id == "1"
    assert articles[1].text.startswith("CHAPTER I. RIGHTS")
    assert articles[2].article_id == "2"
    assert articles[2].text.startswith("1. A person shall not be deprived of life intentionally.")
    assert articles[5].article_id == "5"
    assert articles[5].text.startswith("No person shall be subjected to torture.")


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


def test_remove_stale_country_csvs_keeps_only_current_country_files(tmp_path) -> None:
    current_path = tmp_path / "TST_2024.csv"
    stale_path = tmp_path / "OLD_1900.csv"
    current_path.write_text("header\n", encoding="utf-8")
    stale_path.write_text("header\n", encoding="utf-8")
    (tmp_path / ALL_ARTICLES_FILENAME).write_text("header\n", encoding="utf-8")

    removed_paths = remove_stale_country_csvs([current_path], output_dir=tmp_path)

    assert removed_paths == [stale_path]
    assert current_path.exists()
    assert not stale_path.exists()
    assert (tmp_path / ALL_ARTICLES_FILENAME).exists()
