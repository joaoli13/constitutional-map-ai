"""Neon PostgreSQL schema management and article ingest."""

from __future__ import annotations

import math
import os
from dataclasses import dataclass
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extensions import connection as PsycopgConnection
from tqdm import tqdm

from src.m1_scraper.url_builder import extract_document_year_from_file_path
from src.m4_5_exporter.json_writer import build_record_id, build_text_snippet, load_metadata_map
from src.shared.constants import (
    DEFAULT_EMBEDDING_DIMENSIONS,
    EMBEDDINGS_DIR,
    NEON_BATCH_SIZE,
    RAW_DIR,
)

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    country_code TEXT NOT NULL,
    country_name TEXT NOT NULL,
    region TEXT NOT NULL,
    article_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    text TEXT NOT NULL,
    text_snippet TEXT NOT NULL,
    global_cluster INTEGER NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    z REAL NOT NULL,
    embedding vector(768),
    search_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(text, ''))) STORED
);
"""

CREATE_EXTENSION_SQL = "CREATE EXTENSION IF NOT EXISTS vector;"

ALTER_TABLE_ADD_EMBEDDING_SQL = """
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS embedding vector(768);
"""

CREATE_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS articles_search_tsv_idx
ON articles
USING GIN (search_tsv);
"""

UPSERT_SQL = """
INSERT INTO articles (
    id,
    country_code,
    country_name,
    region,
    article_id,
    year,
    text,
    text_snippet,
    global_cluster,
    x,
    y,
    z,
    embedding
) VALUES (
    %(id)s,
    %(country_code)s,
    %(country_name)s,
    %(region)s,
    %(article_id)s,
    %(year)s,
    %(text)s,
    %(text_snippet)s,
    %(global_cluster)s,
    %(x)s,
    %(y)s,
    %(z)s,
    %(embedding)s::vector
)
ON CONFLICT (id) DO UPDATE SET
    country_code = EXCLUDED.country_code,
    country_name = EXCLUDED.country_name,
    region = EXCLUDED.region,
    article_id = EXCLUDED.article_id,
    year = EXCLUDED.year,
    text = EXCLUDED.text,
    text_snippet = EXCLUDED.text_snippet,
    global_cluster = EXCLUDED.global_cluster,
    x = EXCLUDED.x,
    y = EXCLUDED.y,
    z = EXCLUDED.z,
    embedding = EXCLUDED.embedding;
"""

DELETE_STALE_SQL = """
DELETE FROM articles
WHERE NOT (id = ANY(%s));
"""

TRUNCATE_SQL = "TRUNCATE TABLE articles;"


@dataclass
class NeonIngestResult:
    row_count: int
    batch_count: int
    pruned_row_count: int


def connect_neon(dsn: str | None = None) -> PsycopgConnection:
    """Open a Neon connection."""

    connection_string = dsn or os.getenv("NEON_DATABASE_URL")
    if not connection_string:
        raise ValueError("NEON_DATABASE_URL is required for Neon ingest.")
    return psycopg2.connect(connection_string)


def migrate_schema(connection: PsycopgConnection) -> None:
    """Create the articles table and GIN index idempotently."""

    with connection.cursor() as cursor:
        cursor.execute(CREATE_EXTENSION_SQL)
        cursor.execute(CREATE_TABLE_SQL)
        cursor.execute(ALTER_TABLE_ADD_EMBEDDING_SQL)
        cursor.execute(CREATE_INDEX_SQL)
    connection.commit()


def build_neon_rows(
    clustered_frame: pd.DataFrame,
    *,
    embeddings_path: Path | str = EMBEDDINGS_DIR / "embeddings.parquet",
    metadata_path: Path | str = RAW_DIR / "metadata.json",
    show_progress: bool = False,
) -> list[dict[str, object]]:
    """Map clustered parquet rows to Neon article records."""

    metadata_map = load_metadata_map(metadata_path)
    embedding_lookup = load_embedding_lookup(embeddings_path)
    rows: list[dict[str, object]] = []

    for row in tqdm(
        clustered_frame.itertuples(index=False),
        total=len(clustered_frame),
        desc="Build Neon rows",
        unit="article",
        disable=not show_progress,
    ):
        metadata = metadata_map[str(row.country_code)]
        document_year = extract_document_year_from_file_path(metadata.file_path)
        year = document_year or metadata.last_amendment_year or metadata.constitution_year
        record_id = build_record_id(str(row.country_code), year, str(row.article_id))
        embedding = embedding_lookup.get(record_id)
        if embedding is None:
            raise ValueError(f"Missing embedding for Neon article row: {record_id}")
        rows.append(
            {
                "id": record_id,
                "country_code": str(row.country_code),
                "country_name": str(row.country_name),
                "region": str(row.region),
                "article_id": str(row.article_id),
                "year": int(year),
                "text": str(row.text),
                "text_snippet": build_text_snippet(str(row.text)),
                "global_cluster": int(row.global_cluster),
                "x": float(row.x),
                "y": float(row.y),
                "z": float(row.z),
                "embedding": embedding,
            }
        )

    return rows


def upsert_articles(
    connection: PsycopgConnection,
    rows: list[dict[str, object]],
    *,
    batch_size: int = NEON_BATCH_SIZE,
    show_progress: bool = False,
) -> NeonIngestResult:
    """Upsert article rows into Neon in batches and prune stale rows."""

    batch_count = 0
    if rows:
        batch_offsets = range(0, len(rows), batch_size)
        total_batches = (len(rows) + batch_size - 1) // batch_size
        for offset in tqdm(
            batch_offsets,
            total=total_batches,
            desc="Upsert Neon batches",
            unit="batch",
            disable=not show_progress,
        ):
            batch = rows[offset : offset + batch_size]
            with connection.cursor() as cursor:
                cursor.executemany(UPSERT_SQL, batch)
            connection.commit()
            batch_count += 1

    pruned_row_count = prune_stale_articles(
        connection,
        valid_ids=[str(row["id"]) for row in rows],
    )

    return NeonIngestResult(
        row_count=len(rows),
        batch_count=batch_count,
        pruned_row_count=pruned_row_count,
    )


def prune_stale_articles(
    connection: PsycopgConnection,
    *,
    valid_ids: list[str],
) -> int:
    """Remove Neon rows that are no longer present in the current dataset."""

    with connection.cursor() as cursor:
        if valid_ids:
            cursor.execute(DELETE_STALE_SQL, (valid_ids,))
            deleted_count = max(cursor.rowcount, 0)
        else:
            cursor.execute("SELECT COUNT(*) FROM articles;")
            row = cursor.fetchone()
            deleted_count = int(row[0]) if row is not None else 0
            cursor.execute(TRUNCATE_SQL)
    connection.commit()
    return deleted_count


def fetch_article_count(connection: PsycopgConnection) -> int:
    """Return the current article count in Neon."""

    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM articles;")
        row = cursor.fetchone()
    return int(row[0]) if row is not None else 0


def load_embedding_lookup(
    embeddings_path: Path | str,
    *,
    expected_dimensions: int = DEFAULT_EMBEDDING_DIMENSIONS,
) -> dict[str, str]:
    """Load and validate canonical document embeddings keyed by article record id."""

    embeddings_path = Path(embeddings_path)
    if not embeddings_path.exists():
        raise FileNotFoundError(f"Embeddings Parquet not found: {embeddings_path}")

    frame = pd.read_parquet(embeddings_path)
    required_columns = {"country_code", "year", "article_id", "embedding"}
    missing_columns = required_columns.difference(frame.columns)
    if missing_columns:
        raise ValueError(
            f"Embeddings Parquet is missing required columns: {sorted(missing_columns)}"
        )

    lookup: dict[str, str] = {}
    for row in frame.itertuples(index=False):
        vector = validate_embedding_vector(
            getattr(row, "embedding"),
            expected_dimensions=expected_dimensions,
        )
        record_id = build_record_id(
            str(getattr(row, "country_code")),
            int(getattr(row, "year")),
            str(getattr(row, "article_id")),
        )
        lookup[record_id] = vector_to_sql_literal(vector)

    return lookup


def validate_embedding_vector(
    embedding: object,
    *,
    expected_dimensions: int = DEFAULT_EMBEDDING_DIMENSIONS,
) -> list[float]:
    """Validate an embedding vector before Neon ingest."""

    if isinstance(embedding, (str, bytes)) or not hasattr(embedding, "__iter__"):
        raise ValueError("Embedding payload must be a list or tuple of floats.")

    vector = [float(value) for value in embedding]
    if len(vector) != expected_dimensions:
        raise ValueError(
            f"Embedding dimension mismatch: expected {expected_dimensions}, got {len(vector)}."
        )
    if any(not math.isfinite(value) for value in vector):
        raise ValueError("Embedding vector contains NaN or Inf values.")

    return vector


def vector_to_sql_literal(vector: list[float]) -> str:
    """Serialize a validated embedding to pgvector input syntax."""

    return "[" + ",".join(str(value) for value in vector) + "]"
