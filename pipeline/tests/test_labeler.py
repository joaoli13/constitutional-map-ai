from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import pytest

from src.m4_6_labeler.labeler import LabellingResult, _parse_labels, label_top_clusters
from src.m4_6_labeler.prompt_builder import build_prompt, sample_country_texts
from src.shared.models import ClusterIndexEntry


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

def _make_frame(rows: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(rows)


def _default_entry(**kwargs) -> ClusterIndexEntry:
    defaults = dict(
        id=0,
        size=3,
        top_countries=["AAA", "BBB"],
        top_countries_counts=[2, 1],
        country_count=2,
        all_countries=["AAA", "BBB"],
        centroid=[0.0, 0.0, 0.0],
        sample_texts=["text a", "text b"],
    )
    defaults.update(kwargs)
    return ClusterIndexEntry.model_validate(defaults)


_FRAME = _make_frame(
    [
        {"country_code": "AAA", "global_cluster": 0, "x": 0.1, "y": 0.0, "z": 0.0, "text": "alpha one two three"},
        {"country_code": "AAA", "global_cluster": 0, "x": 0.2, "y": 0.0, "z": 0.0, "text": "alpha four five six"},
        {"country_code": "BBB", "global_cluster": 0, "x": 0.3, "y": 0.0, "z": 0.0, "text": "beta constitutional rights"},
        {"country_code": "CCC", "global_cluster": 1, "x": 1.0, "y": 0.0, "z": 0.0, "text": "other cluster"},
    ]
)


# ---------------------------------------------------------------------------
# _parse_labels
# ---------------------------------------------------------------------------

class TestParseLabels:
    def test_clean_json(self):
        raw = '{"en": "Fundamental Rights", "pt": "Direitos Fundamentais"}'
        result = _parse_labels(raw)
        assert result["en"] == "Fundamental Rights"
        assert result["pt"] == "Direitos Fundamentais"

    def test_json_embedded_in_prose(self):
        raw = 'Sure, here it is:\n{"en": "Judicial Review"}\nHope that helps.'
        result = _parse_labels(raw)
        assert result["en"] == "Judicial Review"

    def test_raises_on_no_json(self):
        with pytest.raises(ValueError, match="No JSON object found"):
            _parse_labels("No JSON here at all.")


# ---------------------------------------------------------------------------
# sample_country_texts
# ---------------------------------------------------------------------------

class TestSampleCountryTexts:
    def test_returns_texts_for_known_countries(self):
        entry = _default_entry()
        result = sample_country_texts(entry, _FRAME)
        assert "AAA" in result
        assert "BBB" in result

    def test_excludes_other_clusters(self):
        entry = _default_entry()
        result = sample_country_texts(entry, _FRAME)
        assert "CCC" not in result

    def test_word_budget_respected(self):
        entry = _default_entry(all_countries=["AAA"])
        result = sample_country_texts(entry, _FRAME, max_words_per_country=5)
        assert len(result["AAA"].split()) <= 5

    def test_returns_empty_for_unknown_cluster(self):
        entry = _default_entry(id=99, top_countries=["AAA"], all_countries=["AAA"])
        result = sample_country_texts(entry, _FRAME)
        assert result == {}

    def test_top_countries_take_priority(self):
        entry = _default_entry(
            top_countries=["AAA"],
            all_countries=["AAA", "BBB"],
        )
        # max_countries=1 means only AAA (first) should appear
        result = sample_country_texts(entry, _FRAME, max_countries=1)
        assert "AAA" in result
        assert "BBB" not in result


# ---------------------------------------------------------------------------
# build_prompt
# ---------------------------------------------------------------------------

class TestBuildPrompt:
    def test_contains_cluster_id(self):
        entry = _default_entry(id=42)
        samples = {"AAA": "some text"}
        prompt = build_prompt(entry, samples, avoid=[])
        assert "42" in prompt

    def test_contains_all_languages(self):
        entry = _default_entry()
        samples = {"AAA": "text"}
        prompt = build_prompt(entry, samples, avoid=[])
        for lang in ("en", "pt", "es", "it", "fr", "ja", "zh"):
            assert f'"{lang}"' in prompt

    def test_avoid_block_present_when_provided(self):
        entry = _default_entry()
        samples = {"AAA": "text"}
        prompt = build_prompt(entry, samples, avoid=["Judicial Review"])
        assert "Judicial Review" in prompt

    def test_no_avoid_block_when_empty(self):
        entry = _default_entry()
        samples = {"AAA": "text"}
        prompt = build_prompt(entry, samples, avoid=[])
        assert "Names already used" not in prompt


# ---------------------------------------------------------------------------
# label_top_clusters (dry-run, no Gemini call)
# ---------------------------------------------------------------------------

def _make_clusters_json(tmp_path, entries: list[dict]) -> Path:
    path = tmp_path / "clusters.json"
    path.write_text(json.dumps(entries, ensure_ascii=False), encoding="utf-8")
    return path


def _cluster_row(cluster_id: int, country: str, n: int = 1) -> list[dict]:
    return [
        {
            "country_code": country,
            "global_cluster": cluster_id,
            "x": float(cluster_id),
            "y": 0.0,
            "z": 0.0,
            "text": f"text {cluster_id} {i}",
        }
        for i in range(n)
    ]


def _build_frame(*specs: tuple[int, str, int]) -> pd.DataFrame:
    rows = []
    for cluster_id, country, n in specs:
        rows.extend(_cluster_row(cluster_id, country, n))
    return pd.DataFrame(rows)


def _cluster_entry(cluster_id: int, countries: list[str]) -> dict:
    return {
        "id": cluster_id,
        "size": len(countries),
        "labels": None,
        "top_countries": countries[:10],
        "top_countries_counts": [1] * min(len(countries), 10),
        "country_count": len(countries),
        "all_countries": countries,
        "centroid": [float(cluster_id), 0.0, 0.0],
        "sample_texts": [],
    }


class TestLabelTopClustersDryRun:
    def test_dry_run_does_not_modify_file(self, tmp_path):
        entries = [_cluster_entry(0, ["AAA", "BBB", "CCC"])]
        path = _make_clusters_json(tmp_path, entries)
        original = path.read_text()

        frame = _build_frame((0, "AAA", 2), (0, "BBB", 1), (0, "CCC", 1))
        result = label_top_clusters(path, frame, dry_run=True)

        assert path.read_text() == original
        assert result.labelled == 0

    def test_dry_run_skips_count_matches_top_n(self, tmp_path):
        # Create 12 clusters; top-10 should be skipped in dry-run.
        entries = [
            _cluster_entry(i, [f"C{j:02d}" for j in range(i + 1)])
            for i in range(12)
        ]
        path = _make_clusters_json(tmp_path, entries)
        frame = _build_frame(*[(i, f"C{i:02d}", 1) for i in range(12)])
        result = label_top_clusters(path, frame, dry_run=True)

        # top 10 are skipped, the other 2 have no sample texts (only 1 country
        # each but still exist in the frame), so total skipped = 10.
        assert result.skipped == 10
        assert result.labelled == 0
        assert result.failed == 0

    def test_cluster_with_no_sample_texts_is_skipped(self, tmp_path):
        # Cluster exists in JSON but its country has no rows in the frame.
        entries = [_cluster_entry(0, ["XXX"])]
        path = _make_clusters_json(tmp_path, entries)
        frame = pd.DataFrame(columns=["country_code", "global_cluster", "x", "y", "z", "text"])
        result = label_top_clusters(path, frame, dry_run=True)
        assert result.skipped == 1

    def test_result_is_labelling_result_instance(self, tmp_path):
        entries = [_cluster_entry(0, ["AAA"])]
        path = _make_clusters_json(tmp_path, entries)
        frame = _build_frame((0, "AAA", 1))
        result = label_top_clusters(path, frame, dry_run=True)
        assert isinstance(result, LabellingResult)
