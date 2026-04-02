"""Prompt assembly and article sampling for M4.6 cluster labelling."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

import pandas as pd

if TYPE_CHECKING:
    from src.shared.models import ClusterIndexEntry

_LANGUAGES = ("en", "pt", "es", "it", "fr", "ja", "zh")
_LANGUAGE_NAMES = {
    "en": "English",
    "pt": "Portuguese",
    "es": "Spanish",
    "it": "Italian",
    "fr": "French",
    "ja": "Japanese",
    "zh": "Chinese (Simplified)",
}

_MAX_COUNTRIES = 20
_MAX_WORDS_PER_COUNTRY = 300


def _euclidean_distance(x: float, y: float, z: float, cx: float, cy: float, cz: float) -> float:
    return math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)


def sample_country_texts(
    cluster: "ClusterIndexEntry",
    clustered_frame: pd.DataFrame,
    *,
    max_countries: int = _MAX_COUNTRIES,
    max_words_per_country: int = _MAX_WORDS_PER_COUNTRY,
) -> dict[str, str]:
    """Return a dict of country_code → sampled text for a cluster.

    Country selection:
    - Start with `top_countries` (up to 10, already by article count).
    - Fill remaining slots from `all_countries` (random sample if needed).

    Article selection per country:
    - Rank articles in that country belonging to this cluster by Euclidean
      distance to the cluster centroid (ascending = closest first).
    - Concatenate article texts until `max_words_per_country` words are reached.
    """
    cx, cy, cz = cluster.centroid

    # Build ordered country list: top first, then others up to max_countries.
    top = list(cluster.top_countries or [])
    others: list[str] = []
    if cluster.all_countries:
        top_set = set(top)
        candidates = [c for c in cluster.all_countries if c not in top_set]
        remaining_slots = max(0, max_countries - len(top))
        if remaining_slots and candidates:
            # Deterministic: sort alphabetically (reproducible without random seed).
            others = sorted(candidates)[:remaining_slots]
    countries = (top + others)[:max_countries]

    cluster_mask = clustered_frame["global_cluster"] == cluster.id
    cluster_rows = clustered_frame[cluster_mask].copy()

    result: dict[str, str] = {}
    for country_code in countries:
        country_rows = cluster_rows[cluster_rows["country_code"] == country_code].copy()
        if country_rows.empty:
            continue

        country_rows["_dist"] = country_rows.apply(
            lambda row: _euclidean_distance(row["x"], row["y"], row["z"], cx, cy, cz),
            axis=1,
        )
        country_rows = country_rows.sort_values("_dist", kind="stable")

        words_collected: list[str] = []
        budget = max_words_per_country
        for text in country_rows["text"].astype(str):
            words = text.split()
            if not words:
                continue
            words_to_add = words[:budget]
            words_collected.extend(words_to_add)
            budget -= len(words_to_add)
            if budget <= 0:
                break

        if words_collected:
            result[country_code] = " ".join(words_collected)

    return result


def build_prompt(
    cluster: "ClusterIndexEntry",
    samples: dict[str, str],
    avoid: list[str],
) -> str:
    """Assemble the full prompt for naming a single cluster in 7 languages."""

    language_lines = "\n".join(
        f'  "{lang}": "<name in {_LANGUAGE_NAMES[lang]}>"'
        for lang in _LANGUAGES
    )

    avoid_block = ""
    if avoid:
        formatted = ", ".join(f'"{name}"' for name in avoid)
        avoid_block = (
            f"\n\nNames already used for other clusters (do NOT reuse or closely echo these):\n"
            f"{formatted}"
        )

    country_blocks: list[str] = []
    for country_code, text in samples.items():
        country_blocks.append(f"[{country_code}]\n{text}")
    context_section = "\n\n---\n\n".join(country_blocks)

    return f"""You are a constitutional law expert naming a thematic cluster of constitutional articles from world constitutions.

Cluster ID: {cluster.id}
Cluster size: {cluster.size} articles from {cluster.country_count} countries

Below are representative constitutional article excerpts from countries in this cluster:

{context_section}
{avoid_block}

Task: Provide a SHORT topic name (≤5 words) that captures the central constitutional theme shared across these excerpts. The name must be:
- Concise (≤5 words)
- Descriptive of the shared theme
- Different from the avoided names listed above

Respond ONLY with a JSON object mapping language codes to names — no other text:
{{
{language_lines}
}}"""
