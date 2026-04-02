#!/usr/bin/env python3
"""Run the M4.6 cluster labeller."""

from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

PIPELINE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = PIPELINE_ROOT.parent


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the cluster labeller (M4.6).")
    parser.add_argument(
        "--clusters-path",
        type=Path,
        default=REPO_ROOT / "app" / "public" / "data" / "clusters.json",
        help="Path to clusters.json produced by M4.5.",
    )
    parser.add_argument(
        "--clustered-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "clusters" / "clustered.parquet",
        help="Path to the clustered parquet output from M4.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Build prompts but skip Gemini calls and do not write to disk.",
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

    from src.m4_5_exporter.json_writer import load_clustered_frame
    from src.m4_6_labeler import label_top_clusters

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    if not args.clusters_path.exists():
        print(f"ERROR: clusters.json not found at {args.clusters_path}", file=sys.stderr)
        print("Run M4.5 first: python scripts/run_m4_5.py", file=sys.stderr)
        return 1

    print("M4.6: loading clustered parquet...")
    clustered_frame = load_clustered_frame(args.clustered_path)

    print("M4.6: labelling top clusters..." + (" (dry-run)" if args.dry_run else ""))
    result = label_top_clusters(
        args.clusters_path,
        clustered_frame,
        dry_run=args.dry_run,
        show_progress=show_progress,
    )

    print(
        f"M4.6 complete: {result.labelled} labelled, "
        f"{result.skipped} skipped, {result.failed} failed."
    )
    if result.errors:
        for err in result.errors:
            print(f"  ERROR: {err}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
