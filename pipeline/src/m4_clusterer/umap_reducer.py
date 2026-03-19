"""Dual UMAP projection helpers for clustering and visualization."""

from __future__ import annotations

import os
import inspect
import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from src.shared.constants import (
    UMAP_METRIC,
    UMAP_MIN_DIST_CLUSTER,
    UMAP_MIN_DIST_VIZ,
    UMAP_N_NEIGHBORS_CLUSTER,
    UMAP_N_NEIGHBORS_VIZ,
    UMAP_RANDOM_STATE,
)


@dataclass
class UMAPProjectionResult:
    cluster_projection: np.ndarray
    viz_projection: np.ndarray


def ensure_runtime_cache_dirs() -> None:
    """Point runtime caches to writable temp directories."""

    cache_root = Path(tempfile.gettempdir()) / "tca-runtime-cache"
    numba_dir = cache_root / "numba"
    matplotlib_dir = cache_root / "matplotlib"
    xdg_dir = cache_root / "xdg"

    for path in (numba_dir, matplotlib_dir, xdg_dir):
        path.mkdir(parents=True, exist_ok=True)

    os.environ.setdefault("NUMBA_CACHE_DIR", str(numba_dir))
    os.environ.setdefault("MPLCONFIGDIR", str(matplotlib_dir))
    os.environ.setdefault("XDG_CACHE_HOME", str(xdg_dir))


def patch_sklearn_validation_compat():
    """Bridge the `ensure_all_finite`/`force_all_finite` sklearn API mismatch."""

    from sklearn.utils import validation

    signature = inspect.signature(validation.check_array)
    if "ensure_all_finite" in signature.parameters:
        return validation.check_array

    original = validation.check_array

    def check_array_compat(*args, ensure_all_finite=None, **kwargs):
        if ensure_all_finite is not None and "force_all_finite" not in kwargs:
            kwargs["force_all_finite"] = ensure_all_finite
        return original(*args, **kwargs)

    validation.check_array = check_array_compat
    return check_array_compat


class DualUMAPReducer:
    """Apply independent UMAP projections for clustering and visualization."""

    def __init__(
        self,
        *,
        cluster_components: int = 50,
        viz_components: int = 3,
        cluster_neighbors: int = UMAP_N_NEIGHBORS_CLUSTER,
        viz_neighbors: int = UMAP_N_NEIGHBORS_VIZ,
        cluster_min_dist: float = UMAP_MIN_DIST_CLUSTER,
        viz_min_dist: float = UMAP_MIN_DIST_VIZ,
        metric: str = UMAP_METRIC,
        random_state: int = UMAP_RANDOM_STATE,
    ) -> None:
        self.cluster_components = cluster_components
        self.viz_components = viz_components
        self.cluster_neighbors = int(
            os.getenv("UMAP_N_NEIGHBORS_CLUSTER", str(cluster_neighbors))
        )
        self.viz_neighbors = int(os.getenv("UMAP_N_NEIGHBORS_VIZ", str(viz_neighbors)))
        self.cluster_min_dist = float(
            os.getenv("UMAP_MIN_DIST_CLUSTER", str(cluster_min_dist))
        )
        self.viz_min_dist = float(os.getenv("UMAP_MIN_DIST_VIZ", str(viz_min_dist)))
        self.metric = os.getenv("UMAP_METRIC", metric)
        self.random_state = int(os.getenv("UMAP_RANDOM_STATE", str(random_state)))

    def reduce(self, embeddings: np.ndarray) -> UMAPProjectionResult:
        """Fit the two UMAP projections over the same input embeddings."""

        if embeddings.ndim != 2:
            raise ValueError("Embeddings must be a 2D array.")
        if len(embeddings) < 2:
            raise ValueError("At least two embeddings are required for UMAP.")

        ensure_runtime_cache_dirs()
        check_array_compat = patch_sklearn_validation_compat()
        from umap import UMAP
        import umap.umap_ as umap_module

        umap_module.check_array = check_array_compat

        cluster_reducer = UMAP(
            n_components=self.cluster_components,
            n_neighbors=min(self.cluster_neighbors, len(embeddings) - 1),
            min_dist=self.cluster_min_dist,
            metric=self.metric,
            random_state=self.random_state,
        )
        viz_reducer = UMAP(
            n_components=self.viz_components,
            n_neighbors=min(self.viz_neighbors, len(embeddings) - 1),
            min_dist=self.viz_min_dist,
            metric=self.metric,
            random_state=self.random_state,
        )

        cluster_projection = cluster_reducer.fit_transform(embeddings)
        viz_projection = viz_reducer.fit_transform(embeddings)
        return UMAPProjectionResult(
            cluster_projection=np.asarray(cluster_projection, dtype=np.float32),
            viz_projection=np.asarray(viz_projection, dtype=np.float32),
        )
