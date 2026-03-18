"""Discovery helpers for the constitutional scraper."""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass
from html import unescape

from bs4 import BeautifulSoup

from src.m1_scraper.parser import extract_available_languages, extract_constitution_years
from src.m1_scraper.url_builder import (
    build_raw_text_relative_path,
    build_text_url,
    extract_constitution_id,
    extract_document_year,
)
from src.shared.country_codes import CountryInfo, by_name
from src.shared.models import CountryMetadata

_COUNTRY_NAME_ALIASES = {
    "bahamas the": "Bahamas",
    "bolivia plurinational state of": "Bolivia",
    "brunei darussalam": "Brunei",
    "cape verde": "Cabo Verde",
    "china people s republic of": "China",
    "congo democratic republic of the": "Congo (Dem. Rep.)",
    "congo republic of the": "Congo (Rep.)",
    "czech republic": "Czechia",
    "gambia the": "Gambia",
    "iran islamic republic of": "Iran",
    "korea democratic people s republic of": "Korea (North)",
    "korea republic of": "Korea (South)",
    "lao people s democratic republic": "Laos",
    "micronesia federated states of": "Micronesia",
    "moldova republic of": "Moldova",
    "north macedonia republic of": "North Macedonia",
    "russian federation": "Russia",
    "syrian arab republic": "Syria",
    "taiwan republic of china": "Taiwan",
    "tanzania united republic of": "Tanzania",
    "united states of america": "United States",
    "venezuela bolivarian republic of": "Venezuela",
    "viet nam": "Vietnam",
}
_SUPPORTED_EXTRA_COUNTRIES = {
    "palestine": CountryInfo(
        alpha3="PSE",
        alpha2="PS",
        name="Palestine",
        region="Asia",
        sub_region="Western Asia",
    ),
}
_UNSUPPORTED_LISTING_NAMES = {
    "baden",
    "bavaria",
    "ethereum world",
    "h j res",
    "kosovo",
    "long view micro school",
    "mars",
    "pocket network",
    "s j res",
    "somaliland",
    "us amendment proposals",
}


@dataclass(frozen=True)
class ListingEntry:
    display_name: str
    constitution_id: str
    href: str


def parse_listing_entries(html: str) -> list[ListingEntry]:
    """Parse the listing page and return unique constitution entries."""

    soup = BeautifulSoup(html, "lxml")
    entries: list[ListingEntry] = []
    seen_ids: set[str] = set()

    for anchor in soup.select('a[href^="/constitution/"][target="_self"]'):
        href = anchor.get("href", "").strip()
        display_name = unescape(anchor.get_text(" ", strip=True))
        constitution_id = extract_constitution_id(href)

        if not display_name or constitution_id is None or constitution_id in seen_ids:
            continue

        if extract_document_year(constitution_id) is None:
            continue

        seen_ids.add(constitution_id)
        entries.append(
            ListingEntry(
                display_name=display_name,
                constitution_id=constitution_id,
                href=href,
            )
        )

    return entries


def build_discovery_metadata(
    entry: ListingEntry,
    page_html: str,
    previous_metadata: CountryMetadata | None = None,
) -> CountryMetadata | None:
    """Build a metadata entry from a listing entry and its constitution page."""

    country_info = resolve_country_info(entry.display_name)
    if country_info is None:
        return None

    document_year = extract_document_year(entry.constitution_id)
    if document_year is None:
        return None

    available_languages = extract_available_languages(page_html) or ["en"]
    constitution_year, last_amendment_year = extract_constitution_years(
        page_html,
        fallback_document_year=document_year,
    )

    preferred_language = "en" if "en" in available_languages else available_languages[0]
    relative_file_path = build_raw_text_relative_path(country_info.alpha3, document_year)

    metadata_kwargs = {
        "country_name": country_info.name,
        "country_code": country_info.alpha3,
        "iso_alpha2": country_info.alpha2,
        "region": country_info.region,
        "sub_region": country_info.sub_region,
        "constitution_year": constitution_year,
        "last_amendment_year": last_amendment_year,
        "language": preferred_language,
        "available_languages": available_languages,
        "source_url": build_text_url(entry.constitution_id, preferred_language),
        "file_path": relative_file_path.as_posix(),
    }

    if previous_metadata is not None and _preserve_cached_fields(previous_metadata, metadata_kwargs):
        metadata_kwargs["sha256"] = previous_metadata.sha256
        metadata_kwargs["scraped_at"] = previous_metadata.scraped_at
        metadata_kwargs["status"] = previous_metadata.status

    return CountryMetadata(**metadata_kwargs)


def resolve_country_info(display_name: str) -> CountryInfo | None:
    """Resolve a Constitute listing label to a local country record."""

    normalized_name = _normalize_lookup_name(display_name)
    if normalized_name in _UNSUPPORTED_LISTING_NAMES:
        return None

    extra_country = _SUPPORTED_EXTRA_COUNTRIES.get(normalized_name)
    if extra_country is not None:
        return extra_country

    alias_target = _COUNTRY_NAME_ALIASES.get(normalized_name)
    if alias_target is not None:
        return by_name(alias_target)

    exact_match = by_name(unescape(display_name))
    if exact_match is not None:
        return exact_match

    return by_name(_restore_name_tokens(normalized_name))


def _preserve_cached_fields(
    previous_metadata: CountryMetadata,
    new_metadata: dict[str, object],
) -> bool:
    return (
        previous_metadata.language == new_metadata["language"]
        and previous_metadata.file_path == new_metadata["file_path"]
    )


def _normalize_lookup_name(value: str) -> str:
    value = unescape(value)
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.lower().replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def _restore_name_tokens(value: str) -> str:
    return " ".join(token.capitalize() for token in value.split())
