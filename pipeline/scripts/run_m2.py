#!/usr/bin/env python3
"""Run the M2 constitutional segmenter."""

from __future__ import annotations

import argparse
import json
import logging
import sys
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

PIPELINE_ROOT = Path(__file__).resolve().parents[1]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the constitutional segmenter (M2).")
    parser.add_argument(
        "--metadata-path",
        type=Path,
        default=PIPELINE_ROOT / "data" / "raw" / "metadata.json",
        help="Path to the M1 metadata.json file.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=PIPELINE_ROOT / "data" / "articles",
        help="Directory where per-country and consolidated CSVs will be written.",
    )
    parser.add_argument("--limit", type=int, default=None, help="Only segment the first N countries.")
    parser.add_argument("--country-code", default=None, help="Only segment one ISO alpha-3 country code.")
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

    from src.m2_segmenter import ConstitutionalSegmenter
    from src.m2_segmenter.csv_writer import (
        write_all_articles_csv,
        write_country_csv,
        write_segmentation_report,
    )
    from src.shared.models import CountryMetadata

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )

    metadata_payload = json.loads(args.metadata_path.read_text(encoding="utf-8"))
    metadata_entries = [CountryMetadata.model_validate(item) for item in metadata_payload]
    metadata_entries = [entry for entry in metadata_entries if entry.status == "success"]

    if args.country_code:
        metadata_entries = [
            entry for entry in metadata_entries if entry.country_code == args.country_code.upper()
        ]
    if args.limit is not None:
        metadata_entries = metadata_entries[: args.limit]

    segmenter = ConstitutionalSegmenter(raw_dir=args.metadata_path.parent)
    all_articles = []
    reports = []

    for metadata in metadata_entries:
        raw_path = args.metadata_path.parent / Path(metadata.file_path).name
        if not raw_path.exists():
            logging.warning("Skipping missing raw text file: %s", raw_path)
            continue

        raw_text = raw_path.read_text(encoding="utf-8")
        articles, report = segmenter.segment_country(metadata, raw_text)
        write_country_csv(articles, output_dir=args.output_dir)
        all_articles.extend(articles)
        reports.append(report)

    write_all_articles_csv(all_articles, output_dir=args.output_dir)
    write_segmentation_report(reports, output_dir=args.output_dir)

    pattern_counts = Counter(report.pattern for report in reports)
    summary = ", ".join(f"{pattern}={count}" for pattern, count in sorted(pattern_counts.items()))
    print(f"Segmented {len(reports)} countries into {len(all_articles)} records. {summary}")
    print(f"Outputs written to {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
