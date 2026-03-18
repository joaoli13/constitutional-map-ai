from __future__ import annotations

from src.shared.models import CountryMetadata
from src.shared.processing_policy import (
    apply_country_processing_policy,
    is_country_processing_enabled,
    load_country_processing_policies,
)


def test_processing_policy_loads_and_applies_country_override(tmp_path) -> None:
    config_path = tmp_path / "country_processing.toml"
    config_path.write_text(
        """
[countries.GBR]
processing_enabled = false
reason = "No single written constitution."
""".strip()
        + "\n",
        encoding="utf-8",
    )

    metadata = CountryMetadata(
        country_name="United Kingdom",
        country_code="GBR",
        iso_alpha2="GB",
        region="Europe",
        sub_region="Northern Europe",
        constitution_year=1215,
        last_amendment_year=2013,
        language="en",
        available_languages=["en"],
        source_url="https://example.test/GBR",
        file_path="data/raw/GBR_2013.txt",
        status="success",
    )

    policies = load_country_processing_policies(config_path)
    updated_metadata = apply_country_processing_policy(metadata, path=config_path)

    assert policies["GBR"].processing_enabled is False
    assert updated_metadata.processing_enabled is False
    assert updated_metadata.processing_reason == "No single written constitution."
    assert is_country_processing_enabled(updated_metadata, path=config_path) is False
