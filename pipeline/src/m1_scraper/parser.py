"""HTML parsing helpers for Constitute Project pages."""

from __future__ import annotations

import re
from html import unescape

from bs4 import BeautifulSoup, Tag

_TITLE_RE = re.compile(
    r"^(?P<country>.+?)\s+(?P<constitution_year>\d{4})"
    r"(?:\s+\(rev\.\s+(?P<revision_year>\d{4})\))?\s+Constitution",
    re.IGNORECASE,
)
_DESCRIPTION_RE = re.compile(
    r"Constitution of\s+(?P<constitution_year>\d{4})"
    r"(?:\s+with Amendments? through\s+(?P<revision_year>\d{4}))?",
    re.IGNORECASE,
)
_LIST_MARKER_RE = re.compile(r"'([^']+)'")
_BLOCK_SELECTOR = ("h1", "h2", "h3", "h4", "h5", "h6", "p", "li")


def extract_available_languages(html: str) -> list[str]:
    """Extract the list of available constitution languages from a page."""

    soup = BeautifulSoup(html, "lxml")
    container = soup.select_one("div.constitution-content[data-languages]")
    if container is not None:
        raw_value = container.get("data-languages", "")
        languages = [language.strip().lower() for language in raw_value.split(",") if language.strip()]
        if languages:
            return _deduplicate(languages)

    languages: list[str] = []
    for link in soup.select(".site-nav__menu--lang a"):
        language = _normalize_text(link.get_text(" ", strip=True)).lower()
        if language:
            languages.append(language)

    return _deduplicate(languages)


def extract_constitution_years(
    html: str,
    fallback_document_year: int | None = None,
) -> tuple[int, int | None]:
    """Extract the original and latest document years from a page."""

    soup = BeautifulSoup(html, "lxml")

    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    match = _TITLE_RE.search(title)
    if match is not None:
        return _build_year_tuple(match.group("constitution_year"), match.group("revision_year"))

    description = ""
    description_tag = soup.select_one('meta[name="description"]')
    if description_tag is not None:
        description = description_tag.get("content", "").strip()

    match = _DESCRIPTION_RE.search(description)
    if match is not None:
        return _build_year_tuple(match.group("constitution_year"), match.group("revision_year"))

    if fallback_document_year is None:
        raise ValueError("Unable to extract constitution year from HTML.")

    return fallback_document_year, None


def extract_text_from_html(html: str) -> str:
    """Extract the plain-text constitution body from a page."""

    soup = BeautifulSoup(html, "lxml")
    container = soup.select_one("div.constitution-content__copy")
    if container is None:
        return ""

    for unwanted in container.select("script, style, noscript, .section-topic"):
        unwanted.decompose()

    blocks: list[str] = []
    for element in container.find_all(_BLOCK_SELECTOR):
        block = _extract_block_text(element)
        if block:
            blocks.append(block)

    return "\n\n".join(blocks).strip()


def _build_year_tuple(
    constitution_year: str | None,
    revision_year: str | None,
) -> tuple[int, int | None]:
    original_year = int(constitution_year) if constitution_year is not None else None
    latest_year = int(revision_year) if revision_year else None

    if original_year is None:
        raise ValueError("A constitution year is required.")

    if latest_year == original_year:
        latest_year = None

    return original_year, latest_year


def _extract_block_text(element: Tag) -> str:
    text = _normalize_text(element.get_text(" ", strip=True))
    if not text:
        return ""

    if element.name == "li":
        marker = _extract_list_marker(element)
        return f"{marker} {text}".strip() if marker else text

    return text


def _extract_list_marker(element: Tag) -> str | None:
    style = element.get("style", "")
    match = _LIST_MARKER_RE.search(style)
    if match is not None:
        return match.group(1).strip()

    if element.parent is not None and element.parent.name == "ol":
        siblings = [child for child in element.parent.find_all("li", recursive=False)]
        try:
            return f"{siblings.index(element) + 1}."
        except ValueError:
            return None

    if element.parent is not None and element.parent.name == "ul":
        return "-"

    return None


def _deduplicate(values: list[str]) -> list[str]:
    seen: set[str] = set()
    unique_values: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        unique_values.append(value)
    return unique_values


def _normalize_text(value: str) -> str:
    value = unescape(value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()
