"""Cluster report generation and persistence."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import pandas as pd

REPORT_FILENAME = "cluster_report.json"


@dataclass
class LargestClusterMetadata:
    id: int
    size: int
    top_countries: list[str]
    sample_texts: list[str]


@dataclass
class ClusterReport:
    total_points: int
    total_clusters_global: int
    noise_count: int
    noise_ratio: float
    per_country_cluster_count: dict[str, int]
    largest_cluster: LargestClusterMetadata
    processing_time_seconds: float

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["noise_ratio"] = round(self.noise_ratio, 6)
        payload["processing_time_seconds"] = round(self.processing_time_seconds, 3)
        return payload


def build_cluster_report(
    clustered_frame: pd.DataFrame,
    *,
    processing_time_seconds: float,
) -> ClusterReport:
    """Aggregate the key report statistics from clustered output rows."""

    total_points = len(clustered_frame)
    global_non_noise = clustered_frame[clustered_frame["global_cluster"] >= 0]
    total_clusters_global = int(global_non_noise["global_cluster"].nunique())
    noise_count = int((clustered_frame["global_cluster"] == -1).sum())
    noise_ratio = 0.0 if total_points == 0 else noise_count / float(total_points)

    per_country_cluster_count = (
        clustered_frame[clustered_frame["country_cluster"] >= 0]
        .groupby("country_code")["country_cluster"]
        .nunique()
        .astype(int)
        .to_dict()
    )
    for country_code in clustered_frame["country_code"].unique():
        per_country_cluster_count.setdefault(str(country_code), 0)

    if global_non_noise.empty:
        largest_cluster = LargestClusterMetadata(id=-1, size=0, top_countries=[], sample_texts=[])
    else:
        cluster_sizes = global_non_noise.groupby("global_cluster").size().sort_values(ascending=False)
        largest_cluster_id = int(cluster_sizes.index[0])
        largest_rows = global_non_noise[global_non_noise["global_cluster"] == largest_cluster_id]
        top_countries = largest_rows["country_code"].value_counts().head(5).index.astype(str).tolist()
        sample_texts = largest_rows["text"].head(3).astype(str).tolist()
        largest_cluster = LargestClusterMetadata(
            id=largest_cluster_id,
            size=int(cluster_sizes.iloc[0]),
            top_countries=top_countries,
            sample_texts=sample_texts,
        )

    return ClusterReport(
        total_points=total_points,
        total_clusters_global=total_clusters_global,
        noise_count=noise_count,
        noise_ratio=noise_ratio,
        per_country_cluster_count=per_country_cluster_count,
        largest_cluster=largest_cluster,
        processing_time_seconds=processing_time_seconds,
    )


def write_cluster_report(report: ClusterReport, path: Path | str) -> Path:
    """Persist the cluster report JSON to disk."""

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report.to_dict(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return path
