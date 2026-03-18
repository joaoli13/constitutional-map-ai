"""Main semantic clustering pipeline."""

from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd

from src.m4_clusterer.country_clusters import CountryClusterer
from src.m4_clusterer.hdbscan_runner import GlobalClusteringResult, GlobalHDBSCANRunner
from src.m4_clusterer.report_generator import (
    REPORT_FILENAME,
    ClusterReport,
    build_cluster_report,
    write_cluster_report,
)
from src.m4_clusterer.umap_reducer import DualUMAPReducer, UMAPProjectionResult
from src.shared.constants import CLUSTERS_DIR, EMBEDDINGS_DIR, RAW_DIR
from src.shared.models import CountryMetadata

LOGGER = logging.getLogger(__name__)

EMBEDDING_COLUMNS = {
    "country_code",
    "country_name",
    "year",
    "article_id",
    "text",
    "embedding",
    "model",
    "dimensions",
    "embedded_at",
}
CLUSTERED_COLUMNS = [
    "country_code",
    "country_name",
    "region",
    "article_id",
    "text",
    "x",
    "y",
    "z",
    "global_cluster",
    "country_cluster",
    "cluster_probability",
]


@dataclass
class ClustererRunResult:
    clustered_path: str
    report_path: str
    total_points: int
    total_clusters_global: int
    noise_ratio: float
    processing_time_seconds: float


class SemanticClusterer:
    """Load embeddings, project them, cluster them, and persist the outputs."""

    def __init__(
        self,
        *,
        embeddings_path: Path | str = EMBEDDINGS_DIR / "embeddings.parquet",
        metadata_path: Path | str = RAW_DIR / "metadata.json",
        output_path: Path | str = CLUSTERS_DIR / "clustered.parquet",
        report_path: Path | str = CLUSTERS_DIR / REPORT_FILENAME,
        reducer: DualUMAPReducer | None = None,
        global_runner: GlobalHDBSCANRunner | None = None,
        country_clusterer: CountryClusterer | None = None,
        logger: logging.Logger | None = None,
    ) -> None:
        self.embeddings_path = Path(embeddings_path)
        self.metadata_path = Path(metadata_path)
        self.output_path = Path(output_path)
        self.report_path = Path(report_path)
        self.reducer = reducer or DualUMAPReducer()
        self.global_runner = global_runner or GlobalHDBSCANRunner()
        self.country_clusterer = country_clusterer or CountryClusterer()
        self.logger = logger or LOGGER

    def run(
        self,
        *,
        limit: int | None = None,
        country_code: str | None = None,
        write_report: bool = True,
    ) -> tuple[pd.DataFrame, ClusterReport, ClustererRunResult]:
        started_at = time.perf_counter()
        frame = self._load_embeddings_frame()

        if country_code:
            frame = frame[frame["country_code"] == country_code.upper()].reset_index(drop=True)
        if limit is not None:
            frame = frame.head(limit).reset_index(drop=True)
        if len(frame) < 2:
            raise ValueError("At least two embedded rows are required to run clustering.")

        region_map = self._load_region_map()
        frame["region"] = frame["country_code"].map(region_map)
        if frame["region"].isna().any():
            missing_codes = sorted(frame.loc[frame["region"].isna(), "country_code"].unique().tolist())
            raise ValueError(f"Missing region metadata for country codes: {missing_codes}")

        embeddings = np.vstack(frame["embedding"].to_numpy())

        self.logger.info("Running dual UMAP projections on %s rows.", len(frame))
        projection = self.reducer.reduce(embeddings)

        self.logger.info("Running global HDBSCAN clustering.")
        global_result = self.global_runner.cluster(projection.cluster_projection)

        self.logger.info("Running per-country HDBSCAN clustering.")
        country_labels = self.country_clusterer.cluster_by_country(
            projection.cluster_projection,
            frame["country_code"].to_numpy(),
        )

        clustered_frame = self._build_clustered_frame(
            frame=frame,
            projection=projection,
            global_result=global_result,
            country_labels=country_labels,
        )

        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        clustered_frame.to_parquet(self.output_path, index=False)

        processing_time_seconds = time.perf_counter() - started_at
        report = build_cluster_report(
            clustered_frame,
            processing_time_seconds=processing_time_seconds,
        )
        if write_report:
            write_cluster_report(report, self.report_path)

        run_result = ClustererRunResult(
            clustered_path=str(self.output_path),
            report_path=str(self.report_path),
            total_points=len(clustered_frame),
            total_clusters_global=report.total_clusters_global,
            noise_ratio=report.noise_ratio,
            processing_time_seconds=processing_time_seconds,
        )
        return clustered_frame, report, run_result

    def _load_embeddings_frame(self) -> pd.DataFrame:
        if not self.embeddings_path.exists():
            raise FileNotFoundError(f"Embeddings Parquet not found: {self.embeddings_path}")

        frame = pd.read_parquet(self.embeddings_path)
        missing_columns = EMBEDDING_COLUMNS.difference(frame.columns)
        if missing_columns:
            raise ValueError(
                f"Embeddings Parquet is missing required columns: {sorted(missing_columns)}"
            )

        frame = frame.loc[:, sorted(EMBEDDING_COLUMNS)].copy()
        frame["country_code"] = frame["country_code"].astype(str)
        frame["country_name"] = frame["country_name"].astype(str)
        frame["article_id"] = frame["article_id"].astype(str)
        frame["text"] = frame["text"].astype(str)
        frame["embedding"] = frame["embedding"].apply(lambda value: np.asarray(value, dtype=np.float32))
        return frame.sort_values(["country_code", "article_id"], kind="stable").reset_index(drop=True)

    def _load_region_map(self) -> dict[str, str]:
        payload = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        metadata_entries = [CountryMetadata.model_validate(item) for item in payload]
        return {
            entry.country_code: entry.region
            for entry in metadata_entries
            if entry.status == "success"
        }

    def _build_clustered_frame(
        self,
        *,
        frame: pd.DataFrame,
        projection: UMAPProjectionResult,
        global_result: GlobalClusteringResult,
        country_labels: np.ndarray,
    ) -> pd.DataFrame:
        clustered = pd.DataFrame(
            {
                "country_code": frame["country_code"].to_numpy(),
                "country_name": frame["country_name"].to_numpy(),
                "region": frame["region"].to_numpy(),
                "article_id": frame["article_id"].to_numpy(),
                "text": frame["text"].to_numpy(),
                "x": projection.viz_projection[:, 0].astype(np.float32, copy=False),
                "y": projection.viz_projection[:, 1].astype(np.float32, copy=False),
                "z": projection.viz_projection[:, 2].astype(np.float32, copy=False),
                "global_cluster": global_result.labels.astype(int, copy=False),
                "country_cluster": country_labels.astype(int, copy=False),
                "cluster_probability": global_result.probabilities.astype(np.float32, copy=False),
            }
        )

        if not np.isfinite(clustered[["x", "y", "z"]].to_numpy()).all():
            raise ValueError("UMAP produced non-finite visualization coordinates.")

        return clustered.loc[:, CLUSTERED_COLUMNS]
