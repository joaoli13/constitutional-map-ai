from __future__ import annotations

import json

import pandas as pd
import pytest

from src.m4_5_exporter.json_writer import build_clusters_payload, load_clustered_frame, write_static_jsons
from src.m4_5_exporter.neon_ingest import (
    CREATE_EXTENSION_SQL,
    CREATE_INDEX_SQL,
    CREATE_TABLE_SQL,
    build_neon_rows,
    migrate_schema,
    upsert_articles,
    validate_embedding_vector,
)
from src.m4_5_exporter.validator import ExportValidationError, validate_exports


def _clustered_fixture(path) -> pd.DataFrame:
    frame = pd.DataFrame(
        [
            {
                "country_code": "AAA",
                "country_name": "Alpha",
                "region": "Region 1",
                "article_id": "Article 1",
                "text": "Alpha article one " * 20,
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
                "text": "Alpha article two " * 20,
                "x": 0.4,
                "y": 0.5,
                "z": 0.6,
                "global_cluster": 1,
                "country_cluster": 1,
                "cluster_probability": 0.8,
            },
            {
                "country_code": "BBB",
                "country_name": "Beta",
                "region": "Region 2",
                "article_id": "Article 1",
                "text": "Beta article one " * 20,
                "x": 0.7,
                "y": 0.8,
                "z": 0.9,
                "global_cluster": 1,
                "country_cluster": 0,
                "cluster_probability": 0.7,
            },
        ]
    )
    frame.to_parquet(path, index=False)
    return frame


def _metadata_fixture(path) -> None:
    payload = [
        {
            "country_name": "Alpha",
            "country_code": "AAA",
            "iso_alpha2": "AA",
            "region": "Region 1",
            "sub_region": "Subregion 1",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/AAA",
            "file_path": "data/raw/AAA_2024.txt",
            "status": "success",
        },
        {
            "country_name": "Beta",
            "country_code": "BBB",
            "iso_alpha2": "BB",
            "region": "Region 2",
            "sub_region": "Subregion 2",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/BBB",
            "file_path": "data/raw/BBB_2024.txt",
            "status": "success",
        },
        {
            "country_name": "Gamma",
            "country_code": "CCC",
            "iso_alpha2": "CC",
            "region": "Region 3",
            "sub_region": "Subregion 3",
            "constitution_year": 2024,
            "last_amendment_year": 2024,
            "language": "en",
            "available_languages": ["en"],
            "source_url": "https://example.test/CCC",
            "file_path": "data/raw/CCC_2024.txt",
            "status": "success",
        },
    ]
    path.write_text(json.dumps(payload), encoding="utf-8")


def _embeddings_fixture(path) -> None:
    def unit_vector(index: int) -> list[float]:
        values = [0.0] * 768
        values[index] = 1.0
        return values

    pd.DataFrame(
        [
            {
                "country_code": "AAA",
                "country_name": "Alpha",
                "year": 2024,
                "article_id": "Article 1",
                "text": "Alpha article one " * 20,
                "embedding": unit_vector(0),
                "model": "models/gemini-embedding-001",
                "dimensions": 768,
                "embedded_at": "2026-03-19T00:00:00Z",
            },
            {
                "country_code": "AAA",
                "country_name": "Alpha",
                "year": 2024,
                "article_id": "Article 2",
                "text": "Alpha article two " * 20,
                "embedding": unit_vector(1),
                "model": "models/gemini-embedding-001",
                "dimensions": 768,
                "embedded_at": "2026-03-19T00:00:00Z",
            },
            {
                "country_code": "BBB",
                "country_name": "Beta",
                "year": 2024,
                "article_id": "Article 1",
                "text": "Beta article one " * 20,
                "embedding": unit_vector(2),
                "model": "models/gemini-embedding-001",
                "dimensions": 768,
                "embedded_at": "2026-03-19T00:00:00Z",
            },
        ]
    ).to_parquet(path, index=False)


class FakeCursor:
    def __init__(self, *, delete_rowcount: int = 0) -> None:
        self.executed: list[tuple[str, object | None]] = []
        self.fetchone_result = (3,)
        self.delete_rowcount = delete_rowcount
        self.rowcount = 0

    def execute(self, sql: str, params=None) -> None:
        self.executed.append((sql, params))
        if "DELETE FROM articles" in sql:
            self.rowcount = self.delete_rowcount
        else:
            self.rowcount = 0

    def executemany(self, sql: str, param_list) -> None:
        batch = list(param_list)
        self.executed.append((sql, batch))
        self.rowcount = len(batch)

    def fetchone(self):
        return self.fetchone_result

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        return None


class FakeConnection:
    def __init__(self, *, delete_rowcount: int = 0) -> None:
        self.cursors: list[FakeCursor] = []
        self.commit_count = 0
        self.delete_rowcount = delete_rowcount

    def cursor(self) -> FakeCursor:
        cursor = FakeCursor(delete_rowcount=self.delete_rowcount)
        self.cursors.append(cursor)
        return cursor

    def commit(self) -> None:
        self.commit_count += 1


def test_json_writer_outputs_expected_files_and_schema(tmp_path) -> None:
    clustered_path = tmp_path / "clustered.parquet"
    metadata_path = tmp_path / "metadata.json"
    output_dir = tmp_path / "public" / "data"
    frame = _clustered_fixture(clustered_path)
    _metadata_fixture(metadata_path)
    stale_country_dir = output_dir / "countries"
    stale_country_dir.mkdir(parents=True, exist_ok=True)
    (stale_country_dir / "STALE.json").write_text("[]\n", encoding="utf-8")

    artifacts = write_static_jsons(
        load_clustered_frame(clustered_path),
        metadata_path=metadata_path,
        output_dir=output_dir,
    )

    index_payload = json.loads(artifacts.index_path.read_text(encoding="utf-8"))
    clusters_payload = json.loads(artifacts.clusters_path.read_text(encoding="utf-8"))
    alpha_payload = json.loads((artifacts.countries_dir / "AAA.json").read_text(encoding="utf-8"))

    assert index_payload["total_articles"] == len(frame)
    assert index_payload["pipeline_version"] == "0.1.0"
    assert len(index_payload["countries"]) == 3
    assert next(country for country in index_payload["countries"] if country["code"] == "CCC")["has_data"] is False
    assert len(clusters_payload) == 2
    assert clusters_payload[1]["top_countries"] == ["AAA", "BBB"]
    assert clusters_payload[0]["country_count"] == 1  # cluster 0 has only AAA
    assert clusters_payload[1]["country_count"] == 2  # cluster 1 has AAA + BBB
    assert len(alpha_payload) == 2
    assert all(len(point["text_snippet"]) <= 200 for point in alpha_payload)
    assert not (output_dir / "countries-full").exists()
    assert not (artifacts.countries_dir / "STALE.json").exists()


def test_build_clusters_payload_country_count() -> None:
    """country_count reflects the number of distinct country_codes in each cluster."""
    frame = pd.DataFrame(
        [
            {"country_code": "AAA", "global_cluster": 0, "x": 0.0, "y": 0.0, "z": 0.0, "text": "a"},
            {"country_code": "AAA", "global_cluster": 1, "x": 0.0, "y": 0.0, "z": 0.0, "text": "b"},
            {"country_code": "BBB", "global_cluster": 1, "x": 0.0, "y": 0.0, "z": 0.0, "text": "c"},
            {"country_code": "CCC", "global_cluster": 1, "x": 0.0, "y": 0.0, "z": 0.0, "text": "d"},
            {"country_code": "AAA", "global_cluster": -1, "x": 0.0, "y": 0.0, "z": 0.0, "text": "noise"},
        ]
    )
    payload = build_clusters_payload(frame)
    by_id = {entry["id"]: entry for entry in payload}
    assert by_id[0]["country_count"] == 1   # only AAA
    assert by_id[1]["country_count"] == 3   # AAA, BBB, CCC
    assert -1 not in by_id                  # noise excluded


def test_neon_migration_and_upsert_use_expected_sql(tmp_path) -> None:
    del tmp_path
    connection = FakeConnection(delete_rowcount=1)
    migrate_schema(connection)

    assert connection.commit_count == 1
    executed_sql = [sql for sql, _ in connection.cursors[0].executed]
    assert CREATE_EXTENSION_SQL.strip() in executed_sql[0]
    assert CREATE_TABLE_SQL.strip() in executed_sql[1]
    assert CREATE_INDEX_SQL.strip() in executed_sql[3]

    rows = [
        {
            "id": "AAA_2024_Article_1",
            "country_code": "AAA",
            "country_name": "Alpha",
            "region": "Region 1",
            "article_id": "Article 1",
            "year": 2024,
            "text": "alpha",
            "text_snippet": "alpha",
            "global_cluster": 0,
            "x": 0.1,
            "y": 0.2,
            "z": 0.3,
            "embedding": "[1.0,0.0,0.0,0.0]",
        },
        {
            "id": "BBB_2024_Article_1",
            "country_code": "BBB",
            "country_name": "Beta",
            "region": "Region 2",
            "article_id": "Article 1",
            "year": 2024,
            "text": "beta",
            "text_snippet": "beta",
            "global_cluster": 1,
            "x": 0.4,
            "y": 0.5,
            "z": 0.6,
            "embedding": "[0.0,1.0,0.0,0.0]",
        },
    ]
    result = upsert_articles(connection, rows, batch_size=1)

    assert result.row_count == 2
    assert result.batch_count == 2
    assert result.pruned_row_count == 1
    assert connection.commit_count == 4
    upsert_statements = [entry for cursor in connection.cursors[1:] for entry in cursor.executed]
    upsert_sql_entries = [entry for entry in upsert_statements if "ON CONFLICT (id) DO UPDATE" in entry[0]]
    delete_sql_entries = [entry for entry in upsert_statements if "DELETE FROM articles" in entry[0]]
    assert len(upsert_sql_entries) == 2
    assert len(delete_sql_entries) == 1


def test_build_neon_rows_and_validator_detect_missing_country_file(tmp_path) -> None:
    clustered_path = tmp_path / "clustered.parquet"
    embeddings_path = tmp_path / "embeddings.parquet"
    metadata_path = tmp_path / "metadata.json"
    output_dir = tmp_path / "public" / "data"
    frame = _clustered_fixture(clustered_path)
    _embeddings_fixture(embeddings_path)
    _metadata_fixture(metadata_path)

    neon_rows = build_neon_rows(
        frame,
        embeddings_path=embeddings_path,
        metadata_path=metadata_path,
    )
    assert len(neon_rows) == 3
    assert neon_rows[0]["text_snippet"]
    assert neon_rows[0]["year"] == 2024
    assert neon_rows[0]["embedding"].startswith("[")

    artifacts = write_static_jsons(frame, metadata_path=metadata_path, output_dir=output_dir)
    (artifacts.countries_dir / "BBB.json").unlink()

    with pytest.raises(ExportValidationError):
        validate_exports(
            clustered_frame=frame,
            index_path=artifacts.index_path,
            clusters_path=artifacts.clusters_path,
            countries_dir=artifacts.countries_dir,
            neon_article_count=3,
        )


def test_validate_embedding_vector_rejects_dimension_mismatch() -> None:
    with pytest.raises(ValueError, match="Embedding dimension mismatch"):
        validate_embedding_vector([1.0, 0.0, 0.0], expected_dimensions=4)
