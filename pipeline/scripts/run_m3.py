#!/usr/bin/env python3
"""Run the M3 semantic embedder."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the semantic embedder (M3).")
    parser.add_argument(
        "--articles-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "articles" / "all_articles.csv",
        help="Path to the consolidated M2 CSV file.",
    )
    parser.add_argument(
        "--metadata-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "raw" / "metadata.json",
        help="Path to the M1 metadata.json file.",
    )
    parser.add_argument(
        "--output-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "embeddings" / "embeddings.parquet",
        help="Where to write the embeddings Parquet file.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "embeddings" / "embedding_report.json",
        help="Where to write the embedding coverage report JSON.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Only embed the first N segments.")
    parser.add_argument("--country-code", default=None, help="Only embed one ISO alpha-3 country code.")
    parser.add_argument(
        "--no-progress",
        action="store_true",
        help="Disable the live tqdm progress bar.",
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

    if str(PIPELINE_ROOT) not in sys.path:
        sys.path.insert(0, str(PIPELINE_ROOT))

    from src.m3_embedder import ConstitutionalEmbedder

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    embedder = ConstitutionalEmbedder(
        articles_path=args.articles_path,
        metadata_path=args.metadata_path,
        output_path=args.output_path,
        report_path=args.report_path,
    )
    report = embedder.run(
        limit=args.limit,
        country_code=args.country_code,
        write_report=True,
        show_progress=not args.no_progress,
    )
    payload = report.to_dict()
    print(
        "Embedded "
        f"{payload['embedded_segments']} new segments "
        f"({payload['cached_segments']} cached, {payload['total_segments']} total)."
    )
    print(
        "API calls: "
        f"{payload['api_call_count']} | "
        f"Failures: {payload['failure_counts']} | "
        f"Elapsed: {payload['elapsed_seconds']}s | "
        f"Estimated cost: ${payload['estimated_cost_usd']}"
    )
    print(f"Outputs written to {args.output_path} and {args.report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
