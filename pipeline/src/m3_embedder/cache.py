"""Parquet cache helpers for embedding runs."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

EMBEDDING_COLUMNS = [
    "country_code",
    "country_name",
    "year",
    "article_id",
    "text",
    "embedding",
    "model",
    "dimensions",
    "embedded_at",
]

_CACHE_KEY_COLUMNS = ["country_code", "year", "article_id"]


def load_embedding_cache(
    path: Path | str,
    *,
    expected_dimensions: int,
    expected_model: str,
) -> pd.DataFrame:
    """Load the existing Parquet cache if present and compatible."""

    path = Path(path)
    if not path.exists():
        return empty_embedding_frame()

    frame = pd.read_parquet(path)
    for column in EMBEDDING_COLUMNS:
        if column not in frame.columns:
            raise ValueError(f"Embedding cache is missing required column: {column}")

    frame = frame.loc[:, EMBEDDING_COLUMNS].copy()
    frame["year"] = frame["year"].astype(int)
    frame["dimensions"] = frame["dimensions"].astype(int)
    frame = frame[
        (frame["dimensions"] == expected_dimensions) & (frame["model"] == expected_model)
    ].copy()
    frame["_cache_key"] = build_cache_key(frame)
    frame = frame.drop_duplicates(subset="_cache_key", keep="last")
    return frame


def empty_embedding_frame() -> pd.DataFrame:
    """Return an empty frame with the expected output columns."""

    return pd.DataFrame(columns=EMBEDDING_COLUMNS)


def build_cache_key(frame: pd.DataFrame) -> pd.Series:
    """Build a composite key to avoid article-id collisions across countries/years."""

    return (
        frame["country_code"].astype(str)
        + "::"
        + frame["year"].astype(str)
        + "::"
        + frame["article_id"].astype(str)
    )


def split_pending_rows(
    articles_frame: pd.DataFrame,
    cache_frame: pd.DataFrame,
) -> tuple[pd.DataFrame, int]:
    """Split the input articles into cached and pending segments."""

    working = articles_frame.copy()
    working["_cache_key"] = build_cache_key(working)
    cached_keys = set(cache_frame.get("_cache_key", pd.Series(dtype=str)).astype(str))
    pending = working[~working["_cache_key"].isin(cached_keys)].copy()
    cached_count = len(working) - len(pending)
    return pending.drop(columns="_cache_key"), cached_count


def combine_embedding_frames(cache_frame: pd.DataFrame, new_rows: list[dict[str, object]]) -> pd.DataFrame:
    """Merge existing cache rows with newly embedded records."""

    frames = []
    if not cache_frame.empty:
        frames.append(cache_frame.loc[:, EMBEDDING_COLUMNS].copy())
    if new_rows:
        frames.append(pd.DataFrame(new_rows, columns=EMBEDDING_COLUMNS))

    if not frames:
        return empty_embedding_frame()

    combined = pd.concat(frames, ignore_index=True)
    combined["_cache_key"] = build_cache_key(combined)
    combined = combined.drop_duplicates(subset="_cache_key", keep="last")
    combined = combined.sort_values(["country_code", "year", "article_id"], kind="stable")
    return combined.loc[:, EMBEDDING_COLUMNS].reset_index(drop=True)


def write_embedding_cache(frame: pd.DataFrame, path: Path | str) -> Path:
    """Write embeddings to Parquet atomically."""

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    frame.loc[:, EMBEDDING_COLUMNS].to_parquet(tmp_path, index=False)
    tmp_path.replace(path)
    return path
