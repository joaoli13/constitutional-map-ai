"""CSV and report writers for constitutional segmentation."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Iterable

from src.shared.constants import ALL_ARTICLES_FILENAME, ARTICLES_DIR
from src.shared.models import Article
from src.m2_segmenter.segmenter import SegmentationReport

CSV_COLUMNS = ("NomeDoPais", "Data", "NrDispositivo", "Texto")
REPORT_FILENAME = "segmentation_report.json"


def write_country_csv(
    articles: list[Article],
    *,
    output_dir: Path | str = ARTICLES_DIR,
) -> Path:
    if not articles:
        raise ValueError("Cannot write a country CSV without articles.")

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    country_code = articles[0].country_code
    year = articles[0].year
    csv_path = output_dir / f"{country_code}_{year}.csv"
    _write_csv(csv_path, articles)
    return csv_path


def write_all_articles_csv(
    articles: list[Article],
    *,
    output_dir: Path | str = ARTICLES_DIR,
) -> Path:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    csv_path = output_dir / ALL_ARTICLES_FILENAME
    _write_csv(csv_path, articles)
    return csv_path


def write_segmentation_report(
    reports: list[SegmentationReport],
    *,
    output_dir: Path | str = ARTICLES_DIR,
) -> Path:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    report_path = output_dir / REPORT_FILENAME
    payload = [report.to_dict() for report in reports]
    report_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return report_path


def remove_stale_country_csvs(
    keep_paths: Iterable[Path | str],
    *,
    output_dir: Path | str = ARTICLES_DIR,
) -> list[Path]:
    output_dir = Path(output_dir)
    if not output_dir.exists():
        return []

    keep_names = {Path(path).name for path in keep_paths}
    removed_paths: list[Path] = []
    for csv_path in output_dir.glob("*.csv"):
        if csv_path.name == ALL_ARTICLES_FILENAME or csv_path.name in keep_names:
            continue
        csv_path.unlink()
        removed_paths.append(csv_path)

    return sorted(removed_paths)


def _write_csv(path: Path, articles: list[Article]) -> None:
    with path.open("w", encoding="utf-8", newline="") as file_obj:
        writer = csv.DictWriter(file_obj, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        for article in articles:
            writer.writerow(
                {
                    "NomeDoPais": article.country_name,
                    "Data": article.year,
                    "NrDispositivo": article.article_id,
                    "Texto": article.text,
                }
            )
