## ADDED Requirements

### Requirement: Constitution Discovery

The scraper SHALL fetch the list of all in-force constitutions from the Constitute Project, collecting for each country: name, ISO alpha-3 code, ISO alpha-2 code, geographic region, sub-region, constitution year, last amendment year, and the set of available language codes.

#### Scenario: Full list retrieved

- **WHEN** the scraper runs the discovery phase against the Constitute Project listing endpoint
- **THEN** it produces a list of ≥ 190 country entries, each with name, ISO codes, region, and at least one available language

#### Scenario: Country without English version recorded

- **WHEN** a country's constitution is not available in English
- **THEN** the entry is still included in the list, with the available language(s) noted and `language` field set to the original language code

---

### Requirement: Text Acquisition

The scraper SHALL download the full text of each constitution, preferring English (`lang=en`) over the original language, and save each to `data/raw/{COUNTRY_CODE}_{YEAR}.txt`. A `metadata.json` file SHALL be written alongside containing all discovery fields plus `source_url`, `file_path`, `sha256`, `scraped_at`, and `status`.

#### Scenario: English text successfully downloaded

- **WHEN** a country has an English version available and the request succeeds
- **THEN** the file is saved to `data/raw/{CODE}_{YEAR}.txt`, `metadata.json` entry has `status: "success"` and `language: "en"`, and `sha256` matches the file content

#### Scenario: English unavailable, original language downloaded

- **WHEN** no English version exists for a country
- **THEN** the original-language text is saved, `language` is set to the detected language code, and `status` is `"success"`

#### Scenario: Text suspiciously short

- **WHEN** the downloaded text is fewer than 500 characters
- **THEN** `status` is set to `"suspicious"` and no file is written to `data/raw/`

---

### Requirement: Scraping Resilience

The scraper SHALL enforce a minimum delay of 2 seconds between requests, identify itself via an academic research User-Agent, and retry failed requests up to 3 times with exponential backoff (5 s, 15 s, 45 s). If all retries fail, it SHALL mark the entry `status: "timeout"` or `"not_found"` and continue to the next country.

#### Scenario: Transient HTTP 5xx error recovered

- **WHEN** a request fails with a 5xx status and a subsequent retry within the backoff schedule succeeds
- **THEN** the text is saved normally and the retry count is recorded in the log

#### Scenario: All retries exhausted

- **WHEN** a request fails on all 3 retry attempts
- **THEN** the country entry in `metadata.json` has `status: "timeout"`, no file is written, and the scraper proceeds to the next country without crashing

#### Scenario: Previously downloaded file not re-fetched

- **WHEN** `data/raw/{CODE}_{YEAR}.txt` already exists and its SHA-256 matches the stored hash in `metadata.json`
- **THEN** the scraper skips the download and logs a cache-hit message

---

### Requirement: JavaScript-rendered Page Fallback

When a page requires JavaScript rendering to expose the constitutional text, the scraper SHALL fall back to a headless Playwright browser session to fetch the content.

#### Scenario: Playwright fallback triggered

- **WHEN** the plain HTTP response does not contain the expected constitutional text body (heuristic: body text < 500 chars after HTML stripping)
- **THEN** the scraper retries the URL via Playwright headless and extracts the text from the rendered DOM
