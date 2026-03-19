#!/usr/bin/env python3
"""Run the M4 semantic clusterer."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the semantic clusterer (M4).")
    parser.add_argument(
        "--embeddings-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "embeddings" / "embeddings.parquet",
        help="Path to the M3 embeddings Parquet file.",
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
        default=PIPELINE_ROOT / "data" / "clusters" / "clustered.parquet",
        help="Where to write the clustered Parquet file.",
    )
    parser.add_argument(
        "--report-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "clusters" / "cluster_report.json",
        help="Where to write the cluster report JSON.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Only cluster the first N rows.")
    parser.add_argument("--country-code", default=None, help="Only cluster one ISO alpha-3 country code.")
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

    from src.m4_clusterer import SemanticClusterer

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    clusterer = SemanticClusterer(
        embeddings_path=args.embeddings_path,
        metadata_path=args.metadata_path,
        output_path=args.output_path,
        report_path=args.report_path,
    )
    _, report, run_result = clusterer.run(
        limit=args.limit,
        country_code=args.country_code,
        write_report=True,
    )
    payload = report.to_dict()
    print(
        "Clustered "
        f"{run_result.total_points} rows into {payload['total_clusters_global']} global clusters "
        f"(noise ratio {payload['noise_ratio']})."
    )
    print(
        "Largest cluster: "
        f"id={payload['largest_cluster']['id']} "
        f"size={payload['largest_cluster']['size']} "
        f"top_countries={payload['largest_cluster']['top_countries']}"
    )
    print(f"Outputs written to {args.output_path} and {args.report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
