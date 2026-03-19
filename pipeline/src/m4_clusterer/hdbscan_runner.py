"""Global HDBSCAN clustering helpers."""

from __future__ import annotations

import os
import warnings
from dataclasses import dataclass
from importlib.metadata import PackageNotFoundError, version
from inspect import signature

import numpy as np

from src.shared.constants import HDBSCAN_METRIC, HDBSCAN_MIN_CLUSTER_SIZE, HDBSCAN_MIN_SAMPLES


@dataclass
class GlobalClusteringResult:
    labels: np.ndarray
    probabilities: np.ndarray

    @property
    def cluster_count(self) -> int:
        return len({int(label) for label in self.labels if int(label) >= 0})

    @property
    def noise_count(self) -> int:
        return int(np.sum(self.labels == -1))

    @property
    def noise_ratio(self) -> float:
        return 0.0 if len(self.labels) == 0 else self.noise_count / float(len(self.labels))


class GlobalHDBSCANRunner:
    """Run the global HDBSCAN clustering pass."""

    def __init__(
        self,
        *,
        min_cluster_size: int = HDBSCAN_MIN_CLUSTER_SIZE,
        min_samples: int = HDBSCAN_MIN_SAMPLES,
        metric: str = HDBSCAN_METRIC,
    ) -> None:
        self.min_cluster_size = int(os.getenv("HDBSCAN_MIN_CLUSTER_SIZE", str(min_cluster_size)))
        self.min_samples = int(os.getenv("HDBSCAN_MIN_SAMPLES", str(min_samples)))
        self.metric = metric

    def cluster(self, features: np.ndarray) -> GlobalClusteringResult:
        """Assign global cluster labels and probabilities."""

        if len(features) < self.min_cluster_size:
            return GlobalClusteringResult(
                labels=np.full(len(features), -1, dtype=int),
                probabilities=np.zeros(len(features), dtype=np.float32),
            )

        import hdbscan
        from sklearn.utils.validation import check_array

        if "force_all_finite" not in signature(check_array).parameters:
            sklearn_version = _safe_package_version("scikit-learn")
            hdbscan_version = _safe_package_version("hdbscan")
            raise RuntimeError(
                "Incompatible dependency set for M4: "
                f"scikit-learn {sklearn_version} removes check_array(force_all_finite=...), "
                f"but hdbscan {hdbscan_version} still relies on it. "
                "Use the pipeline environment with the project constraints "
                "(scikit-learn>=1.5,<1.8), then rerun M4."
            )

        model = hdbscan.HDBSCAN(
            min_cluster_size=self.min_cluster_size,
            min_samples=self.min_samples,
            metric=self.metric,
            cluster_selection_method="eom",
            prediction_data=True,
            core_dist_n_jobs=1,
        )
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore",
                message="'force_all_finite' was renamed to 'ensure_all_finite' in 1\\.6 and will be removed in 1\\.8\\.",
                category=FutureWarning,
            )
            labels = model.fit_predict(features).astype(int, copy=False)
        probabilities = np.asarray(model.probabilities_, dtype=np.float32)
        return GlobalClusteringResult(labels=labels, probabilities=probabilities)


def _safe_package_version(package_name: str) -> str:
    try:
        return version(package_name)
    except PackageNotFoundError:
        return "unknown"
