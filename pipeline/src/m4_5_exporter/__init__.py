"""Data exporter module exports."""

from src.m4_5_exporter.json_writer import (
    build_record_id,
    build_text_snippet,
    load_clustered_frame,
    write_static_jsons,
)
from src.m4_5_exporter.neon_ingest import (
    build_neon_rows,
    connect_neon,
    fetch_article_count,
    migrate_schema,
    upsert_articles,
)
from src.m4_5_exporter.validator import ExportValidationError, validate_exports

__all__ = [
    "ExportValidationError",
    "build_neon_rows",
    "build_record_id",
    "build_text_snippet",
    "connect_neon",
    "fetch_article_count",
    "load_clustered_frame",
    "migrate_schema",
    "upsert_articles",
    "validate_exports",
    "write_static_jsons",
]
