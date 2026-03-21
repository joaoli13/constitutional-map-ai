"""Data exporter module exports."""

from src.m4_5_exporter.json_writer import (
    build_record_id,
    build_text_snippet,
    load_clustered_frame,
    write_static_jsons,
)
from src.m4_5_exporter.neon_ingest import (
    CREATE_EXTENSION_SQL,
    build_neon_rows,
    connect_neon,
    fetch_article_count,
    load_embedding_lookup,
    migrate_schema,
    upsert_articles,
    validate_embedding_vector,
)
from src.m4_5_exporter.validator import ExportValidationError, validate_exports

__all__ = [
    "ExportValidationError",
    "CREATE_EXTENSION_SQL",
    "build_neon_rows",
    "build_record_id",
    "build_text_snippet",
    "connect_neon",
    "fetch_article_count",
    "load_embedding_lookup",
    "load_clustered_frame",
    "migrate_schema",
    "upsert_articles",
    "validate_exports",
    "validate_embedding_vector",
    "write_static_jsons",
]
