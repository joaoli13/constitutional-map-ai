"""Country-level processing policy helpers."""

from __future__ import annotations

import tomllib
from dataclasses import dataclass
from pathlib import Path

from src.shared.constants import PIPELINE_ROOT
from src.shared.models import CountryMetadata

COUNTRY_PROCESSING_CONFIG_PATH = PIPELINE_ROOT / "config" / "country_processing.toml"


@dataclass(frozen=True)
class CountryProcessingPolicy:
    processing_enabled: bool = True
    reason: str | None = None


def load_country_processing_policies(
    path: Path | str = COUNTRY_PROCESSING_CONFIG_PATH,
) -> dict[str, CountryProcessingPolicy]:
    config_path = Path(path)
    if not config_path.exists():
        return {}

    payload = tomllib.loads(config_path.read_text(encoding="utf-8"))
    countries = payload.get("countries", {})
    if not isinstance(countries, dict):
        raise ValueError("country_processing.toml must define a [countries] table.")

    policies: dict[str, CountryProcessingPolicy] = {}
    for country_code, raw_policy in countries.items():
        if not isinstance(raw_policy, dict):
            raise ValueError(
                f"country_processing.toml entry for {country_code!r} must be a table."
            )

        reason = raw_policy.get("reason")
        policies[country_code.upper()] = CountryProcessingPolicy(
            processing_enabled=bool(raw_policy.get("processing_enabled", True)),
            reason=str(reason) if reason is not None else None,
        )

    return policies


def resolve_country_processing_policy(
    country_code: str,
    *,
    path: Path | str = COUNTRY_PROCESSING_CONFIG_PATH,
) -> CountryProcessingPolicy:
    return load_country_processing_policies(path).get(
        country_code.upper(),
        CountryProcessingPolicy(),
    )


def apply_country_processing_policy(
    metadata: CountryMetadata,
    *,
    path: Path | str = COUNTRY_PROCESSING_CONFIG_PATH,
) -> CountryMetadata:
    policy = resolve_country_processing_policy(metadata.country_code, path=path)
    metadata.processing_enabled = policy.processing_enabled
    metadata.processing_reason = policy.reason
    return metadata


def is_country_processing_enabled(
    metadata: CountryMetadata,
    *,
    path: Path | str = COUNTRY_PROCESSING_CONFIG_PATH,
) -> bool:
    policy = resolve_country_processing_policy(metadata.country_code, path=path)
    if metadata.country_code.upper() in load_country_processing_policies(path):
        return policy.processing_enabled
    return metadata.processing_enabled
