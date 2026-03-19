#!/usr/bin/env python3
"""Run the M1 constitutional scraper."""

from __future__ import annotations

import argparse
import logging
import sys
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

PIPELINE_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    raw_dir = PIPELINE_ROOT / "data" / "raw"
    parser = argparse.ArgumentParser(description="Run the constitutional scraper (M1).")
    parser.add_argument("--limit", type=int, default=None, help="Only process the first N countries.")
    parser.add_argument(
        "--metadata-only",
        action="store_true",
        help="Run discovery and write metadata.json without downloading text files.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=raw_dir,
        help=f"Raw text output directory (default: {raw_dir})",
    )
    parser.add_argument(
        "--log-level",
        choices=("DEBUG", "INFO", "WARNING", "ERROR"),
        default="INFO",
        help="Logging verbosity.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    load_dotenv(PIPELINE_ROOT / ".env")
    if str(PIPELINE_ROOT) not in sys.path:
        sys.path.insert(0, str(PIPELINE_ROOT))

    from src.m1_scraper import ConstitutionalScraper

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    with ConstitutionalScraper(output_dir=args.output_dir) as scraper:
        metadata_entries = scraper.run(limit=args.limit, metadata_only=args.metadata_only)

    status_counts = Counter(entry.status for entry in metadata_entries)
    total = len(metadata_entries)
    summary = ", ".join(f"{status}={count}" for status, count in sorted(status_counts.items()))
    print(f"Processed {total} countries. {summary}")
    print(f"Metadata written to {args.output_dir / 'metadata.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
