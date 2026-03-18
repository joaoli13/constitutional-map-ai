"""Main scraping pipeline for constitutional texts."""

from __future__ import annotations

import json
import logging
import time
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
from typing import Callable

import httpx

from src.m1_scraper.discovery import (
    build_discovery_metadata,
    parse_listing_entries,
    resolve_country_info,
)
from src.m1_scraper.parser import extract_text_from_html
from src.m1_scraper.url_builder import (
    build_listing_url,
    build_text_url,
    extract_constitution_id,
    extract_document_year,
    extract_document_year_from_file_path,
)
from src.shared.constants import (
    CONSTITUTE_USER_AGENT,
    RAW_DIR,
    SCRAPER_BACKOFF_DELAYS,
    SCRAPER_MAX_RETRIES,
    SCRAPER_MIN_TEXT_LENGTH,
    SCRAPER_RATE_LIMIT_SECONDS,
)
from src.shared.models import CountryMetadata
from src.shared.processing_policy import apply_country_processing_policy

LOGGER = logging.getLogger(__name__)


class ScraperNotFoundError(RuntimeError):
    """Raised when a constitution page cannot be found."""


class ScraperTimeoutError(RuntimeError):
    """Raised when repeated requests fail or time out."""


class ConstitutionalScraper:
    """Download and cache constitutional texts from the Constitute Project."""

    def __init__(
        self,
        output_dir: Path | str = RAW_DIR,
        *,
        client: httpx.Client | None = None,
        playwright_fetcher: Callable[[str], str] | None = None,
        sleep_fn: Callable[[float], None] = time.sleep,
        monotonic_fn: Callable[[], float] = time.monotonic,
        logger: logging.Logger | None = None,
    ) -> None:
        self.output_dir = Path(output_dir)
        self.metadata_path = self.output_dir / "metadata.json"
        self.sleep_fn = sleep_fn
        self.monotonic_fn = monotonic_fn
        self.logger = logger or LOGGER
        self.playwright_fetcher = playwright_fetcher or self._fetch_with_playwright

        self._owns_client = client is None
        self.client = client or httpx.Client(
            follow_redirects=True,
            headers={"User-Agent": CONSTITUTE_USER_AGENT},
            timeout=httpx.Timeout(30.0),
        )
        self._last_request_at: float | None = None

    def close(self) -> None:
        if self._owns_client:
            self.client.close()

    def __enter__(self) -> ConstitutionalScraper:
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    def run(self, *, limit: int | None = None, metadata_only: bool = False) -> list[CountryMetadata]:
        """Run discovery and optionally download all constitutional texts."""

        self.output_dir.mkdir(parents=True, exist_ok=True)
        existing_metadata = self._load_existing_metadata()

        listing_html, _ = self._request_html(build_listing_url())
        listing_entries = parse_listing_entries(listing_html)
        if limit is not None:
            listing_entries = listing_entries[:limit]

        metadata_entries: list[CountryMetadata] = []
        for entry in listing_entries:
            country_info = resolve_country_info(entry.display_name)
            if country_info is None:
                self.logger.debug("Skipping unsupported listing entry: %s", entry.display_name)
                continue

            document_year = extract_document_year(entry.constitution_id)
            if document_year is None:
                self.logger.warning("Skipping entry with invalid constitution id: %s", entry.constitution_id)
                continue

            previous_metadata = existing_metadata.get((country_info.alpha3, document_year))

            try:
                page_html, _ = self._request_html(build_text_url(entry.constitution_id, "en"))
                metadata = build_discovery_metadata(entry, page_html, previous_metadata)
            except ScraperNotFoundError:
                metadata = self._build_fallback_metadata(
                    entry=entry,
                    country_name=country_info.name,
                    country_code=country_info.alpha3,
                    iso_alpha2=country_info.alpha2,
                    region=country_info.region,
                    sub_region=country_info.sub_region,
                    status="not_found",
                    previous_metadata=previous_metadata,
                )
            except ScraperTimeoutError:
                metadata = self._build_fallback_metadata(
                    entry=entry,
                    country_name=country_info.name,
                    country_code=country_info.alpha3,
                    iso_alpha2=country_info.alpha2,
                    region=country_info.region,
                    sub_region=country_info.sub_region,
                    status="timeout",
                    previous_metadata=previous_metadata,
                )

            if metadata is None:
                continue

            metadata_entries.append(metadata)

        self._write_metadata(metadata_entries)
        if metadata_only:
            return metadata_entries

        for metadata in metadata_entries:
            self._process_metadata_entry(metadata)
            self._write_metadata(metadata_entries)

        return metadata_entries

    def _process_metadata_entry(self, metadata: CountryMetadata) -> None:
        if self._is_cache_hit(metadata):
            metadata.status = "success"
            self.logger.info("Cache hit for %s", metadata.file_path)
            return

        constitution_id = extract_constitution_id(metadata.source_url or metadata.file_path)
        if constitution_id is None:
            metadata.status = "not_found"
            self.logger.warning("Missing constitution id for %s", metadata.country_name)
            return

        any_timeout = False
        for language in self._download_languages(metadata):
            url = build_text_url(constitution_id, language)
            try:
                text, final_url = self._download_text(url)
            except ScraperNotFoundError:
                continue
            except ScraperTimeoutError:
                any_timeout = True
                continue

            if len(text) < SCRAPER_MIN_TEXT_LENGTH:
                metadata.language = language
                metadata.source_url = str(final_url)
                metadata.sha256 = None
                metadata.status = "suspicious"
                self.logger.warning("Suspiciously short text for %s (%s chars)", metadata.country_name, len(text))
                return

            self._write_text(metadata, text)
            metadata.language = final_url.params.get("lang", language)
            metadata.source_url = str(final_url)
            metadata.sha256 = sha256(text.encode("utf-8")).hexdigest()
            metadata.scraped_at = datetime.now(timezone.utc)
            metadata.status = "success"
            self.logger.info("Downloaded %s (%s)", metadata.country_name, metadata.language)
            return

        metadata.sha256 = None
        metadata.status = "timeout" if any_timeout else "not_found"
        self.logger.warning("Failed to download %s (%s)", metadata.country_name, metadata.status)

    def _download_text(self, url: str) -> tuple[str, httpx.URL]:
        html, final_url = self._request_html(url)
        text = extract_text_from_html(html)
        if len(text) >= SCRAPER_MIN_TEXT_LENGTH:
            return text, final_url

        try:
            rendered_html = self._fetch_rendered_html(url)
        except Exception as exc:  # pragma: no cover - defensive; depends on Playwright runtime.
            self.logger.warning("Playwright fallback failed for %s: %s", url, exc)
            return text, final_url

        rendered_text = extract_text_from_html(rendered_html)
        return rendered_text, final_url

    def _request_html(self, url: str) -> tuple[str, httpx.URL]:
        delays = SCRAPER_BACKOFF_DELAYS[:SCRAPER_MAX_RETRIES]

        for attempt in range(SCRAPER_MAX_RETRIES + 1):
            self._wait_for_rate_limit()
            try:
                response = self.client.get(url)
            except httpx.HTTPError as exc:
                if attempt >= SCRAPER_MAX_RETRIES:
                    raise ScraperTimeoutError(str(exc)) from exc
                self._sleep_backoff(delays[attempt], url, attempt + 1, exc)
                continue

            if response.status_code in {403, 404}:
                raise ScraperNotFoundError(f"{response.status_code} for {url}")

            if response.status_code >= 500 or response.status_code == 429:
                if attempt >= SCRAPER_MAX_RETRIES:
                    raise ScraperTimeoutError(f"{response.status_code} for {url}")
                self._sleep_backoff(
                    delays[attempt],
                    url,
                    attempt + 1,
                    RuntimeError(f"HTTP {response.status_code}"),
                )
                continue

            if 400 <= response.status_code < 500:
                raise ScraperNotFoundError(f"{response.status_code} for {url}")

            return response.text, response.url

        raise ScraperTimeoutError(f"Unexpected retry exhaustion for {url}")

    def _fetch_rendered_html(self, url: str) -> str:
        self._wait_for_rate_limit()
        return self.playwright_fetcher(url)

    def _fetch_with_playwright(self, url: str) -> str:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page(user_agent=CONSTITUTE_USER_AGENT)
            page.goto(url, wait_until="networkidle", timeout=60_000)
            html = page.content()
            browser.close()
            return html

    def _wait_for_rate_limit(self) -> None:
        now = self.monotonic_fn()
        if self._last_request_at is not None:
            remaining = SCRAPER_RATE_LIMIT_SECONDS - (now - self._last_request_at)
            if remaining > 0:
                self.sleep_fn(remaining)
                now = self.monotonic_fn()

        self._last_request_at = now

    def _sleep_backoff(self, delay: float, url: str, retry_number: int, exc: Exception) -> None:
        self.logger.warning("Retry %s for %s after %ss (%s)", retry_number, url, delay, exc)
        self.sleep_fn(delay)

    def _write_text(self, metadata: CountryMetadata, text: str) -> None:
        text_path = self._absolute_file_path(metadata)
        text_path.parent.mkdir(parents=True, exist_ok=True)
        text_path.write_text(f"{text.rstrip()}\n", encoding="utf-8")

    def _write_metadata(self, metadata_entries: list[CountryMetadata]) -> None:
        payload = [entry.model_dump(mode="json") for entry in metadata_entries]
        self.metadata_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def _load_existing_metadata(self) -> dict[tuple[str, int], CountryMetadata]:
        if not self.metadata_path.exists():
            return {}

        try:
            payload = json.loads(self.metadata_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            self.logger.warning("Ignoring malformed metadata file at %s", self.metadata_path)
            return {}

        metadata_by_key: dict[tuple[str, int], CountryMetadata] = {}
        for raw_entry in payload:
            metadata = CountryMetadata.model_validate(raw_entry)
            document_year = self._document_year(metadata)
            if document_year is None:
                continue
            metadata_by_key[(metadata.country_code, document_year)] = metadata

        return metadata_by_key

    def _is_cache_hit(self, metadata: CountryMetadata) -> bool:
        if not metadata.sha256:
            return False

        text_path = self._absolute_file_path(metadata)
        if not text_path.exists():
            return False

        file_hash = sha256(text_path.read_bytes()).hexdigest()
        return file_hash == metadata.sha256

    def _absolute_file_path(self, metadata: CountryMetadata) -> Path:
        return self.output_dir / Path(metadata.file_path).name

    def _document_year(self, metadata: CountryMetadata) -> int | None:
        return (
            extract_document_year_from_file_path(metadata.file_path)
            or metadata.last_amendment_year
            or metadata.constitution_year
        )

    def _download_languages(self, metadata: CountryMetadata) -> list[str]:
        candidates = [metadata.language, *metadata.available_languages]
        deduplicated: list[str] = []
        for candidate in candidates:
            if candidate and candidate not in deduplicated:
                deduplicated.append(candidate)
        return deduplicated or ["en"]

    def _build_fallback_metadata(
        self,
        *,
        entry: object,
        country_name: str,
        country_code: str,
        iso_alpha2: str,
        region: str,
        sub_region: str,
        status: str,
        previous_metadata: CountryMetadata | None,
    ) -> CountryMetadata:
        constitution_id = getattr(entry, "constitution_id")
        document_year = extract_document_year(constitution_id)
        if document_year is None:
            raise ValueError(f"Invalid constitution id: {constitution_id}")

        metadata = CountryMetadata(
            country_name=country_name,
            country_code=country_code,
            iso_alpha2=iso_alpha2,
            region=region,
            sub_region=sub_region,
            constitution_year=document_year,
            last_amendment_year=None,
            language="en",
            available_languages=["en"],
            source_url=build_text_url(constitution_id, "en"),
            file_path=(Path("data") / "raw" / f"{country_code}_{document_year}.txt").as_posix(),
            status=status,
        )

        if previous_metadata is not None and previous_metadata.language == metadata.language:
            metadata.sha256 = previous_metadata.sha256
            metadata.scraped_at = previous_metadata.scraped_at

        return apply_country_processing_policy(metadata)
