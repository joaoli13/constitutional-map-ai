"""Static JSON generation for clustered constitutional data."""

from __future__ import annotations

import json
import math
import re
import shutil
import tomllib
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
from tqdm import tqdm

from src.m1_scraper.url_builder import extract_document_year_from_file_path
from src.shared.constants import APP_PUBLIC_DATA_DIR, CLUSTERS_DIR, PIPELINE_ROOT, TEXT_SNIPPET_LENGTH
from src.shared.models import ArticlePoint, ClusterIndexEntry, CountryIndexEntry, CountryMetadata

INDEX_FILENAME = "index.json"
CLUSTERS_FILENAME = "clusters.json"
LEGACY_COUNTRIES_FULL_DIRNAME = "countries-full"
_ID_SANITIZE_RE = re.compile(r"[^A-Za-z0-9]+")


@dataclass
class ExportedJsonArtifacts:
    index_path: Path
    clusters_path: Path
    countries_dir: Path
    country_file_count: int


def load_clustered_frame(path: Path | str = CLUSTERS_DIR / "clustered.parquet") -> pd.DataFrame:
    """Load the clustered parquet file."""

    frame = pd.read_parquet(path)
    return frame.copy()


def load_metadata_map(
    path: Path | str,
) -> dict[str, CountryMetadata]:
    """Load successful country metadata keyed by alpha-3 code."""

    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    entries = [CountryMetadata.model_validate(item) for item in payload]
    return {entry.country_code: entry for entry in entries if entry.status == "success"}


def build_record_id(country_code: str, year: int, article_id: str) -> str:
    """Build a stable record identifier for JSON and Neon rows."""

    slug = _ID_SANITIZE_RE.sub("_", article_id).strip("_") or "article"
    return f"{country_code}_{year}_{slug}"


def build_text_snippet(text: str, limit: int = TEXT_SNIPPET_LENGTH) -> str:
    """Return a normalized text snippet capped at the configured length."""

    compact = " ".join(text.split())
    return compact[:limit].strip()


def pipeline_version() -> str:
    """Read the pipeline version from pyproject.toml."""

    pyproject_path = PIPELINE_ROOT / "pyproject.toml"
    payload = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    return str(payload["project"]["version"])


def write_static_jsons(
    clustered_frame: pd.DataFrame,
    *,
    metadata_path: Path | str,
    output_dir: Path | str = APP_PUBLIC_DATA_DIR,
    show_progress: bool = False,
) -> ExportedJsonArtifacts:
    """Generate index, clusters, and per-country JSON files."""

    output_dir = Path(output_dir)
    countries_dir = output_dir / "countries"
    legacy_countries_full_dir = output_dir / LEGACY_COUNTRIES_FULL_DIRNAME
    output_dir.mkdir(parents=True, exist_ok=True)
    countries_dir.mkdir(parents=True, exist_ok=True)
    if legacy_countries_full_dir.exists():
        shutil.rmtree(legacy_countries_full_dir)

    metadata_map = load_metadata_map(metadata_path)
    generated_at = datetime.now(timezone.utc).isoformat()
    total_articles = len(clustered_frame)

    index_payload = build_index_payload(
        clustered_frame,
        metadata_map=metadata_map,
        generated_at=generated_at,
    )
    clusters_payload = build_clusters_payload(clustered_frame)
    country_payloads = build_country_payloads(
        clustered_frame,
        metadata_map=metadata_map,
        show_progress=show_progress,
    )
    expected_country_filenames = {f"{country_code}.json" for country_code in country_payloads}
    for stale_country_path in countries_dir.glob("*.json"):
        if stale_country_path.name not in expected_country_filenames:
            stale_country_path.unlink()

    index_path = output_dir / INDEX_FILENAME
    clusters_path = output_dir / CLUSTERS_FILENAME
    index_path.write_text(json.dumps(index_payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    clusters_path.write_text(
        json.dumps(clusters_payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    country_items = country_payloads.items()
    for country_code, payload in tqdm(
        country_items,
        total=len(country_payloads),
        desc="Write country JSON",
        unit="country",
        disable=not show_progress,
    ):
        (countries_dir / f"{country_code}.json").write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    if index_payload["total_articles"] != total_articles:
        raise ValueError("index.json total_articles does not match the clustered parquet row count.")

    return ExportedJsonArtifacts(
        index_path=index_path,
        clusters_path=clusters_path,
        countries_dir=countries_dir,
        country_file_count=len(country_payloads),
    )


def build_index_payload(
    clustered_frame: pd.DataFrame,
    *,
    metadata_map: dict[str, CountryMetadata],
    generated_at: str,
) -> dict[str, object]:
    """Build the top-level index.json payload."""

    total_global_clusters = int(
        clustered_frame.loc[clustered_frame["global_cluster"] >= 0, "global_cluster"].nunique()
    )
    countries: list[dict[str, object]] = []

    grouped = clustered_frame.groupby("country_code")
    for country_code, metadata in sorted(metadata_map.items()):
        if country_code in grouped.groups:
            subset = grouped.get_group(country_code).copy()
            article_count = len(subset)
            non_noise_clusters = subset.loc[subset["global_cluster"] >= 0, "global_cluster"]
            cluster_count = int(non_noise_clusters.nunique())
            semantic_coverage = (
                0.0 if total_global_clusters == 0 else cluster_count / float(total_global_clusters)
            )
            semantic_entropy = normalized_cluster_entropy(non_noise_clusters.tolist())
            has_data = True
        else:
            article_count = 0
            cluster_count = 0
            semantic_coverage = 0.0
            semantic_entropy = 0.0
            has_data = False

        document_year = extract_document_year_from_file_path(metadata.file_path)
        year = document_year or metadata.last_amendment_year or metadata.constitution_year

        entry = CountryIndexEntry(
            code=metadata.country_code,
            iso_alpha2=metadata.iso_alpha2,
            name=metadata.country_name,
            region=metadata.region,
            sub_region=metadata.sub_region,
            constitution_year=year,
            last_amendment_year=metadata.last_amendment_year,
            article_count=article_count,
            cluster_count=cluster_count,
            semantic_coverage=semantic_coverage,
            semantic_entropy=semantic_entropy,
            has_data=has_data,
        )
        countries.append(entry.model_dump())

    return {
        "generated_at": generated_at,
        "pipeline_version": pipeline_version(),
        "total_articles": int(clustered_frame.shape[0]),
        "countries": countries,
    }


def build_clusters_payload(clustered_frame: pd.DataFrame) -> list[dict[str, object]]:
    """Build the global clusters.json payload."""

    payload: list[dict[str, object]] = []
    non_noise = clustered_frame[clustered_frame["global_cluster"] >= 0]
    for cluster_id, subset in sorted(non_noise.groupby("global_cluster"), key=lambda item: int(item[0])):
        centroid = [
            float(subset["x"].mean()),
            float(subset["y"].mean()),
            float(subset["z"].mean()),
        ]
        top_countries = subset["country_code"].value_counts().head(5).index.astype(str).tolist()
        sample_texts = subset["text"].head(5).astype(str).tolist()
        entry = ClusterIndexEntry(
            id=int(cluster_id),
            size=int(len(subset)),
            label=None,
            top_countries=top_countries,
            centroid=centroid,
            sample_texts=sample_texts,
        )
        payload.append(entry.model_dump())
    return payload


def build_country_payloads(
    clustered_frame: pd.DataFrame,
    *,
    metadata_map: dict[str, CountryMetadata],
    show_progress: bool = False,
) -> dict[str, list[dict[str, object]]]:
    """Build per-country point payloads."""

    payloads: dict[str, list[dict[str, object]]] = {}
    country_groups = sorted(clustered_frame.groupby("country_code"))
    for country_code, subset in tqdm(
        country_groups,
        total=len(country_groups),
        desc="Build country payloads",
        unit="country",
        disable=not show_progress,
    ):
        metadata = metadata_map[country_code]
        document_year = extract_document_year_from_file_path(metadata.file_path)
        year = document_year or metadata.last_amendment_year or metadata.constitution_year

        points: list[dict[str, object]] = []
        for row in subset.sort_values("article_id", kind="stable").itertuples(index=False):
            point = ArticlePoint(
                id=build_record_id(country_code, year, str(row.article_id)),
                article_id=str(row.article_id),
                text_snippet=build_text_snippet(str(row.text)),
                x=float(row.x),
                y=float(row.y),
                z=float(row.z),
                global_cluster=int(row.global_cluster),
                country_cluster=int(row.country_cluster),
                cluster_probability=float(row.cluster_probability),
            )
            points.append(point.model_dump())

        payloads[country_code] = points
    return payloads


def normalized_cluster_entropy(cluster_ids: list[int]) -> float:
    """Return a 0-1 normalized entropy over the country's global-cluster distribution."""

    filtered = [cluster_id for cluster_id in cluster_ids if cluster_id >= 0]
    if len(filtered) <= 1:
        return 0.0

    counts = Counter(filtered)
    total = float(sum(counts.values()))
    probabilities = [count / total for count in counts.values()]
    entropy = -sum(probability * math.log(probability) for probability in probabilities if probability > 0)
    max_entropy = math.log(len(counts))
    if max_entropy == 0:
        return 0.0
    return entropy / max_entropy
