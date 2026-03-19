#!/usr/bin/env python3
"""Run the M4.5 data exporter."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the data exporter (M4.5).")
    parser.add_argument(
        "--clustered-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "clusters" / "clustered.parquet",
        help="Path to the clustered parquet output from M4.",
    )
    parser.add_argument(
        "--metadata-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "raw" / "metadata.json",
        help="Path to the M1 metadata.json file.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=REPO_ROOT / "app" / "public" / "data",
        help="Directory where static JSON files will be written.",
    )
    parser.add_argument(
        "--skip-neon",
        action="store_true",
        help="Skip Neon schema migration and article ingest.",
    )
    parser.add_argument(
        "--log-level",
        choices=("DEBUG", "INFO", "WARNING", "ERROR"),
        default="INFO",
        help="Logging verbosity.",
    )
    return parser.parse_args()


def load_environment() -> None:
    for candidate in (
        REPO_ROOT / ".env.local",
        REPO_ROOT / ".env",
        PIPELINE_ROOT / ".env.local",
        PIPELINE_ROOT / ".env",
    ):
        if candidate.exists():
            load_dotenv(candidate, override=False)


def main() -> int:
    args = parse_args()
    load_environment()
    show_progress = sys.stderr.isatty()

    if str(PIPELINE_ROOT) not in sys.path:
        sys.path.insert(0, str(PIPELINE_ROOT))

    from src.m4_5_exporter import (
        build_neon_rows,
        connect_neon,
        fetch_article_count,
        load_clustered_frame,
        migrate_schema,
        upsert_articles,
        validate_exports,
        write_static_jsons,
    )

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    print("M4.5: loading clustered parquet...")
    clustered_frame = load_clustered_frame(args.clustered_path)
    print("M4.5: writing static JSON exports...")
    artifacts = write_static_jsons(
        clustered_frame,
        metadata_path=args.metadata_path,
        output_dir=args.output_dir,
        show_progress=show_progress,
    )

    neon_row_count: int | None = None
    if not args.skip_neon:
        print("M4.5: migrating Neon schema...")
        connection = connect_neon()
        try:
            migrate_schema(connection)
            print("M4.5: building Neon rows...")
            ingest_rows = build_neon_rows(
                clustered_frame,
                metadata_path=args.metadata_path,
                show_progress=show_progress,
            )
            print("M4.5: upserting Neon batches...")
            ingest_result = upsert_articles(
                connection,
                ingest_rows,
                show_progress=show_progress,
            )
            neon_row_count = fetch_article_count(connection)
        finally:
            connection.close()
        print(
            "Neon ingest complete: "
            f"{ingest_result.row_count} rows across {ingest_result.batch_count} batches; "
            f"{ingest_result.pruned_row_count} stale rows pruned."
        )

    print("M4.5: validating exports...")
    summary = validate_exports(
        clustered_frame=clustered_frame,
        index_path=artifacts.index_path,
        clusters_path=artifacts.clusters_path,
        countries_dir=artifacts.countries_dir,
        neon_article_count=neon_row_count,
    )
    print(
        f"Exported {summary.total_articles} articles into {summary.country_file_count} country files."
    )
    print(
        f"Validation passed. Total exported size: {summary.total_data_size_bytes} bytes."
    )
    print(f"Outputs written to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
