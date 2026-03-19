"""Per-country clustering helpers."""

from __future__ import annotations

import logging
import os
import warnings

import numpy as np

from src.shared.constants import HDBSCAN_COUNTRY_MIN_CLUSTER_SIZE, HDBSCAN_COUNTRY_MIN_SAMPLES

LOGGER = logging.getLogger(__name__)


class CountryClusterer:
    """Run a country-scoped HDBSCAN pass over each country's subset."""

    def __init__(
        self,
        *,
        min_cluster_size: int = HDBSCAN_COUNTRY_MIN_CLUSTER_SIZE,
        min_samples: int = HDBSCAN_COUNTRY_MIN_SAMPLES,
        logger: logging.Logger | None = None,
    ) -> None:
        self.min_cluster_size = int(
            os.getenv("HDBSCAN_COUNTRY_MIN_CLUSTER_SIZE", str(min_cluster_size))
        )
        self.min_samples = int(os.getenv("HDBSCAN_COUNTRY_MIN_SAMPLES", str(min_samples)))
        self.logger = logger or LOGGER

    def cluster_by_country(
        self,
        features: np.ndarray,
        country_codes: np.ndarray,
    ) -> np.ndarray:
        """Return country-scoped labels aligned to the input rows."""

        labels = np.full(len(features), -1, dtype=int)
        if len(features) == 0:
            return labels

        import hdbscan

        unique_codes = list(dict.fromkeys(country_codes.tolist()))
        for code in unique_codes:
            mask = country_codes == code
            subset = features[mask]
            if len(subset) < self.min_cluster_size:
                continue

            try:
                model = hdbscan.HDBSCAN(
                    min_cluster_size=self.min_cluster_size,
                    min_samples=self.min_samples,
                    metric="euclidean",
                    cluster_selection_method="eom",
                    prediction_data=False,
                    core_dist_n_jobs=1,
                )
                with warnings.catch_warnings():
                    warnings.filterwarnings(
                        "ignore",
                        message="'force_all_finite' was renamed to 'ensure_all_finite' in 1\\.6 and will be removed in 1\\.8\\.",
                        category=FutureWarning,
                    )
                    subset_labels = model.fit_predict(subset).astype(int, copy=False)
            except Exception as exc:
                self.logger.warning("Country clustering failed for %s: %s", code, exc)
                subset_labels = np.full(len(subset), -1, dtype=int)

            labels[mask] = subset_labels

        return labels
