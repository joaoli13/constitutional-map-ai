from __future__ import annotations

import os
from collections import defaultdict
from hashlib import sha256

import httpx
import pytest

from src.m1_scraper.discovery import resolve_country_info
from src.m1_scraper.parser import extract_text_from_html
from src.m1_scraper.scraper import ConstitutionalScraper
from src.m1_scraper.url_builder import build_listing_url, build_text_url
from src.shared.constants import CONSTITUTE_USER_AGENT, SCRAPER_MIN_TEXT_LENGTH
from src.shared.models import CountryMetadata

LISTING_HTML = """
<html>
  <body>
    <a href="/constitution/Brazil_2017?lang=en" target="_self">Brazil</a>
    <a href="/constitution/Brunei_2006?lang=en" target="_self">Brunei Darussalam</a>
    <a href="/constitution/Mars_2128?lang=en" target="_self">Mars</a>
  </body>
</html>
"""

BRAZIL_DISCOVERY_HTML = """
<html>
  <head>
    <title>Brazil 1988 (rev. 2017) Constitution - Constitute</title>
    <meta name="description" content="Brazil's Constitution of 1988 with Amendments through 2017">
  </head>
  <body>
    <div class="constitution-content" data-languages="en,es,ar"></div>
  </body>
</html>
"""

BRUNEI_DISCOVERY_HTML = """
<html>
  <head>
    <title>Brunei 1959 (rev. 2006) Constitution - Constitute</title>
    <meta name="description" content="Brunei's Constitution of 1959 with Amendments through 2006">
  </head>
  <body>
    <div class="constitution-content" data-languages="ms,ar"></div>
  </body>
</html>
"""

SHORT_BODY_HTML = """
<html>
  <body>
    <div class="constitution-content__copy">
      <h3>Art 1</h3>
      <p class="content">Short body.</p>
    </div>
  </body>
</html>
"""

LONG_PARAGRAPH = "Fundamental rights and democratic guarantees are protected. " * 12
LONG_BODY_HTML = f"""
<html>
  <body>
    <div class="constitution-content" data-languages="en,es,ar"></div>
    <div class="constitution-content__copy">
      <div class="section-topic"><span class="topic">Remove me</span></div>
      <h3>Art 1</h3>
      <p class="content">{LONG_PARAGRAPH}</p>
      <ol>
        <li style="list-style-type: 'I. '">First clause.</li>
        <li>Second clause.</li>
      </ol>
    </div>
  </body>
</html>
"""


def test_extract_text_from_html_strips_topics_and_keeps_structure() -> None:
    text = extract_text_from_html(LONG_BODY_HTML)

    assert "Remove me" not in text
    assert "Art 1" in text
    assert "I. First clause." in text
    assert "2. Second clause." in text


def test_resolve_country_info_handles_curly_apostrophes() -> None:
    country = resolve_country_info("China (People\u2019s Republic of)")

    assert country is not None
    assert country.alpha3 == "CHN"
    assert country.name == "China"


def test_scraper_run_downloads_supported_constitutions(tmp_path) -> None:
    client = _build_client(
        {
            build_listing_url(): [httpx.Response(200, text=LISTING_HTML)],
            build_text_url("Brazil_2017", "en"): [
                httpx.Response(200, text=BRAZIL_DISCOVERY_HTML),
                httpx.Response(200, text=LONG_BODY_HTML),
            ],
            build_text_url("Brunei_2006", "en"): [httpx.Response(200, text=BRUNEI_DISCOVERY_HTML)],
            build_text_url("Brunei_2006", "ms"): [httpx.Response(200, text=LONG_BODY_HTML)],
        }
    )

    with ConstitutionalScraper(
        output_dir=tmp_path,
        client=client,
        sleep_fn=lambda _: None,
        monotonic_fn=_monotonic_source(0.0, 2.1, 4.2, 6.3, 8.4),
    ) as scraper:
        metadata_entries = scraper.run()

    assert [entry.country_code for entry in metadata_entries] == ["BRA", "BRN"]
    assert metadata_entries[0].constitution_year == 1988
    assert metadata_entries[0].last_amendment_year == 2017
    assert metadata_entries[0].status == "success"
    assert metadata_entries[0].language == "en"
    assert metadata_entries[1].constitution_year == 1959
    assert metadata_entries[1].last_amendment_year == 2006
    assert metadata_entries[1].status == "success"
    assert metadata_entries[1].language == "ms"

    assert (tmp_path / "BRA_2017.txt").exists()
    assert (tmp_path / "BRN_2006.txt").exists()
    assert (tmp_path / "metadata.json").exists()


def test_scraper_retries_transient_errors_with_backoff(tmp_path) -> None:
    sleep_calls: list[float] = []
    client = _build_client(
        {
            build_text_url("Brazil_2017", "en"): [
                httpx.Response(500, text="server error"),
                httpx.Response(502, text="bad gateway"),
                httpx.Response(200, text=BRAZIL_DISCOVERY_HTML),
            ]
        }
    )

    with ConstitutionalScraper(
        output_dir=tmp_path,
        client=client,
        sleep_fn=sleep_calls.append,
        monotonic_fn=_monotonic_source(0.0, 2.1, 4.2),
    ) as scraper:
        html, _ = scraper._request_html(build_text_url("Brazil_2017", "en"))

    assert "Brazil 1988" in html
    assert sleep_calls == [5, 15]


def test_scraper_uses_cache_hit_when_hash_matches(tmp_path) -> None:
    file_path = tmp_path / "BRA_2017.txt"
    file_path.write_text("cached constitution text\n", encoding="utf-8")
    file_hash = sha256(file_path.read_bytes()).hexdigest()
    metadata = CountryMetadata(
        country_name="Brazil",
        country_code="BRA",
        iso_alpha2="BR",
        region="Americas",
        sub_region="South America",
        constitution_year=1988,
        last_amendment_year=2017,
        language="en",
        available_languages=["en"],
        source_url=build_text_url("Brazil_2017", "en"),
        file_path="data/raw/BRA_2017.txt",
        sha256=file_hash,
        status="pending",
    )

    calls = {"count": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        calls["count"] += 1
        return httpx.Response(500, text="unexpected request", request=request)

    client = httpx.Client(transport=httpx.MockTransport(handler), follow_redirects=True)
    with ConstitutionalScraper(output_dir=tmp_path, client=client, sleep_fn=lambda _: None) as scraper:
        scraper._process_metadata_entry(metadata)

    assert metadata.status == "success"
    assert calls["count"] == 0


def test_scraper_uses_playwright_fallback_for_short_pages(tmp_path) -> None:
    client = _build_client(
        {
            build_text_url("Brazil_2017", "en"): [httpx.Response(200, text=SHORT_BODY_HTML)],
        }
    )

    with ConstitutionalScraper(
        output_dir=tmp_path,
        client=client,
        playwright_fetcher=lambda _: LONG_BODY_HTML,
        sleep_fn=lambda _: None,
    ) as scraper:
        text, _ = scraper._download_text(build_text_url("Brazil_2017", "en"))

    assert len(text) > SCRAPER_MIN_TEXT_LENGTH


@pytest.mark.skipif(
    os.getenv("RUN_CONSTITUTE_INTEGRATION") != "1",
    reason="Set RUN_CONSTITUTE_INTEGRATION=1 to run the live Constitute integration test.",
)
def test_integration_real_constitution_page() -> None:
    url = os.getenv(
        "CONSTITUTE_INTEGRATION_URL",
        "https://www.constituteproject.org/constitution/Brazil_2017?lang=en",
    )
    response = httpx.get(
        url,
        follow_redirects=True,
        headers={"User-Agent": CONSTITUTE_USER_AGENT},
        timeout=30.0,
    )
    response.raise_for_status()

    text = extract_text_from_html(response.text)
    assert len(text) > SCRAPER_MIN_TEXT_LENGTH


def _build_client(routes: dict[str, list[httpx.Response]]) -> httpx.Client:
    counters: defaultdict[str, int] = defaultdict(int)

    def handler(request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if url not in routes:
            raise AssertionError(f"Unexpected request URL: {url}")

        index = counters[url]
        counters[url] += 1
        responses = routes[url]
        response = responses[index] if index < len(responses) else responses[-1]
        return httpx.Response(
            status_code=response.status_code,
            headers=response.headers,
            content=response.content,
            request=request,
        )

    return httpx.Client(transport=httpx.MockTransport(handler), follow_redirects=True)


def _monotonic_source(*values: float):
    iterator = iter(values)
    last_value = values[-1] if values else 0.0

    def inner() -> float:
        nonlocal last_value
        try:
            last_value = next(iterator)
        except StopIteration:
            last_value += 2.1
        return last_value

    return inner
