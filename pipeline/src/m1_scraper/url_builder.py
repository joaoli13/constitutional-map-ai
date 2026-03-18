"""URL and path helpers for the constitutional scraper."""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlencode, urljoin, urlparse

from src.shared.constants import CONSTITUTE_BASE_URL, CONSTITUTE_LIST_PATH, RAW_DIR

_CONSTITUTION_ID_RE = re.compile(r"(?P<constitution_id>[^/?#]+)")
_DOCUMENT_YEAR_RE = re.compile(r"_(?P<year>\d{4})(?:[A-Z]+)?$")


def build_listing_url(language: str = "en", status: str = "in_force") -> str:
    """Return the Constitute listing URL for a given language/status pair."""

    query = urlencode({"lang": language, "status": status})
    return f"{CONSTITUTE_BASE_URL}{CONSTITUTE_LIST_PATH.split('?')[0]}?{query}"


def build_text_url(constitution_id: str, language: str = "en") -> str:
    """Return the HTML page URL for a constitution version."""

    query = urlencode({"lang": language})
    return urljoin(CONSTITUTE_BASE_URL, f"/constitution/{constitution_id}?{query}")


def extract_constitution_id(url_or_path: str) -> str | None:
    """Extract the constitution id from a URL or path."""

    path = urlparse(url_or_path).path or url_or_path
    if "/constitution/" in path:
        path = path.split("/constitution/", maxsplit=1)[1]

    match = _CONSTITUTION_ID_RE.search(path.strip("/"))
    if match is None:
        return None

    return match.group("constitution_id")


def extract_document_year(constitution_id: str) -> int | None:
    """Extract the trailing document year from a constitution id."""

    match = _DOCUMENT_YEAR_RE.search(constitution_id)
    if match is None:
        return None

    return int(match.group("year"))


def build_raw_text_relative_path(country_code: str, document_year: int) -> Path:
    """Return the relative raw text path stored in metadata."""

    return Path("data") / "raw" / f"{country_code}_{document_year}.txt"


def build_raw_text_path(country_code: str, document_year: int) -> Path:
    """Return the absolute raw text path on disk."""

    return RAW_DIR / f"{country_code}_{document_year}.txt"


def extract_document_year_from_file_path(file_path: str) -> int | None:
    """Extract the document year from a stored raw text path."""

    return extract_document_year(Path(file_path).stem)
