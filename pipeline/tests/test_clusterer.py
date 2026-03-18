from __future__ import annotations

import json

import numpy as np
import pandas as pd

from src.m4_clusterer.clusterer import SemanticClusterer
from src.m4_clusterer.country_clusters import CountryClusterer
from src.m4_clusterer.report_generator import build_cluster_report


def _normalized(vector: np.ndarray) -> np.ndarray:
    norm = np.linalg.norm(vector)
    return vector / norm


def _make_embedding(center_index: int, noise_seed: int) -> np.ndarray:
    rng = np.random.default_rng(noise_seed)
    vector = np.zeros(768, dtype=np.float32)
    vector[center_index] = 1.0
    vector += rng.normal(0.0, 0.015, size=768).astype(np.float32)
    return _normalized(vector).astype(np.float32)


def _write_embeddings_fixture(path) -> None:
    rows: list[dict[str, object]] = []
    semantic_centers = {"A": 0, "B": 1, "C": 2}
    country_layout = {
        "AAA": [("A", 8), ("B", 7)],
        "BBB": [("A", 15)],
        "CCC": [("B", 15)],
        "DDD": [("C", 15)],
        "TNY": [("C", 2)],
    }
    country_names = {
        "AAA": "Alpha",
        "BBB": "Beta",
        "CCC": "Gamma",
        "DDD": "Delta",
        "TNY": "Tiny",
    }

    noise_seed = 1
    for country_code, groups in country_layout.items():
        article_index = 1
        for semantic_group, count in groups:
            for _ in range(count):
                rows.append(
                    {
                        "country_code": country_code,
                        "country_name": country_names[country_code],
                        "year": 2024,
                        "article_id": f"Article {article_index}",
                        "text": f"{country_names[country_code]} article {article_index} in group {semantic_group}",
                        "embedding": _make_embedding(semantic_centers[semantic_group], noise_seed),
                        "model": "models/gemini-embedding-001",
                        "dimensions": 768,
                        "embedded_at": "2026-03-17T00:00:00+00:00",
                    }
                )
                article_index += 1
                noise_seed += 1

    pd.DataFrame(rows).to_parquet(path, index=False)


def _write_metadata_fixture(path, *, disabled_codes: set[str] | None = None) -> None:
    disabled_codes = disabled_codes or set()
    payload = [
        {
            "country_name": "Alpha",
            "country_code": "AAA",
            "iso_alpha2": "AA",
            "region": "Region 1",
            "sub_region": "Subregion",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/AAA",
            "file_path": "data/raw/AAA_2024.txt",
            "status": "success",
            "processing_enabled": "AAA" not in disabled_codes,
        },
        {
            "country_name": "Beta",
            "country_code": "BBB",
            "iso_alpha2": "BB",
            "region": "Region 1",
            "sub_region": "Subregion",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/BBB",
            "file_path": "data/raw/BBB_2024.txt",
            "status": "success",
            "processing_enabled": "BBB" not in disabled_codes,
        },
        {
            "country_name": "Gamma",
            "country_code": "CCC",
            "iso_alpha2": "CC",
            "region": "Region 2",
            "sub_region": "Subregion",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/CCC",
            "file_path": "data/raw/CCC_2024.txt",
            "status": "success",
            "processing_enabled": "CCC" not in disabled_codes,
        },
        {
            "country_name": "Delta",
            "country_code": "DDD",
            "iso_alpha2": "DD",
            "region": "Region 2",
            "sub_region": "Subregion",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/DDD",
            "file_path": "data/raw/DDD_2024.txt",
            "status": "success",
            "processing_enabled": "DDD" not in disabled_codes,
        },
        {
            "country_name": "Tiny",
            "country_code": "TNY",
            "iso_alpha2": "TN",
            "region": "Region 3",
            "sub_region": "Subregion",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/TNY",
            "file_path": "data/raw/TNY_2024.txt",
            "status": "success",
            "processing_enabled": "TNY" not in disabled_codes,
        },
    ]
    path.write_text(json.dumps(payload), encoding="utf-8")


def test_clusterer_writes_schema_and_report(tmp_path) -> None:
    embeddings_path = tmp_path / "embeddings.parquet"
    metadata_path = tmp_path / "metadata.json"
    output_path = tmp_path / "clustered.parquet"
    report_path = tmp_path / "cluster_report.json"
    _write_embeddings_fixture(embeddings_path)
    _write_metadata_fixture(metadata_path)

    clusterer = SemanticClusterer(
        embeddings_path=embeddings_path,
        metadata_path=metadata_path,
        output_path=output_path,
        report_path=report_path,
    )

    clustered_frame, report, run_result = clusterer.run()

    assert output_path.exists()
    assert report_path.exists()
    assert run_result.total_points == len(clustered_frame)
    assert list(clustered_frame.columns) == [
        "country_code",
        "country_name",
        "region",
        "article_id",
        "text",
        "x",
        "y",
        "z",
        "global_cluster",
        "country_cluster",
        "cluster_probability",
    ]
    assert clustered_frame["x"].notna().all()
    assert clustered_frame["y"].notna().all()
    assert clustered_frame["z"].notna().all()
    assert np.isfinite(clustered_frame[["x", "y", "z"]].to_numpy()).all()
    assert report.total_points == len(clustered_frame)
    assert report.total_clusters_global >= 3
    assert report.noise_ratio <= 0.1
    assert report.largest_cluster.size > 0

    payload = json.loads(report_path.read_text(encoding="utf-8"))
    assert payload["total_points"] == len(clustered_frame)
    assert payload["largest_cluster"]["top_countries"]


def test_country_clusterer_marks_tiny_country_as_noise() -> None:
    features = np.random.default_rng(42).normal(size=(8, 4)).astype(np.float32)
    country_codes = np.array(["AAA"] * 6 + ["TNY"] * 2)

    clusterer = CountryClusterer(min_cluster_size=3, min_samples=2)
    labels = clusterer.cluster_by_country(features, country_codes)

    assert len(labels) == 8
    assert np.all(labels[country_codes == "TNY"] == -1)


def test_build_cluster_report_matches_frame_counts() -> None:
    clustered_frame = pd.DataFrame(
        [
            {
                "country_code": "AAA",
                "country_name": "Alpha",
                "region": "Region 1",
                "article_id": "Article 1",
                "text": "alpha one",
                "x": 0.1,
                "y": 0.2,
                "z": 0.3,
                "global_cluster": 0,
                "country_cluster": 0,
                "cluster_probability": 0.9,
            },
            {
                "country_code": "AAA",
                "country_name": "Alpha",
                "region": "Region 1",
                "article_id": "Article 2",
                "text": "alpha two",
                "x": 0.4,
                "y": 0.5,
                "z": 0.6,
                "global_cluster": -1,
                "country_cluster": -1,
                "cluster_probability": 0.0,
            },
            {
                "country_code": "BBB",
                "country_name": "Beta",
                "region": "Region 2",
                "article_id": "Article 1",
                "text": "beta one",
                "x": 0.7,
                "y": 0.8,
                "z": 0.9,
                "global_cluster": 0,
                "country_cluster": 1,
                "cluster_probability": 0.8,
            },
        ]
    )

    report = build_cluster_report(clustered_frame, processing_time_seconds=1.25)

    assert report.total_points == 3
    assert report.total_clusters_global == 1
    assert report.noise_count == 1
    assert round(report.noise_ratio, 3) == 0.333
    assert report.per_country_cluster_count == {"AAA": 1, "BBB": 1}
    assert report.largest_cluster.id == 0
    assert report.largest_cluster.size == 2


def test_clusterer_skips_processing_disabled_countries(tmp_path) -> None:
    embeddings_path = tmp_path / "embeddings.parquet"
    metadata_path = tmp_path / "metadata.json"
    output_path = tmp_path / "clustered.parquet"
    report_path = tmp_path / "cluster_report.json"
    _write_embeddings_fixture(embeddings_path)
    _write_metadata_fixture(metadata_path, disabled_codes={"TNY"})

    clusterer = SemanticClusterer(
        embeddings_path=embeddings_path,
        metadata_path=metadata_path,
        output_path=output_path,
        report_path=report_path,
    )

    clustered_frame, _, _ = clusterer.run()

    assert "TNY" not in set(clustered_frame["country_code"])
