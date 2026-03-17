## ADDED Requirements

### Requirement: Article Segmentation

The segmenter SHALL split each raw constitutional text into individual segments (articles, sections, or equivalent units) by applying a priority-ordered list of regex patterns that cover civil law (`Article N`, `Art. N`), common law (`Section N`), symbolic (`§ N`), numeric (`N.`), and structural fallbacks (`Chapter`, `Part`). The detected pattern SHALL be the first one that yields ≥ 5 segments for the document.

#### Scenario: Civil-law constitution segmented correctly

- **WHEN** a constitution uses the pattern `Article 1`, `Article 2`, …
- **THEN** the output CSV contains one row per article, `NrDispositivo` matches the article identifier, and the segment count is between 5 and 500

#### Scenario: Common-law constitution segmented correctly

- **WHEN** a constitution uses `Section 1`, `Section 2`, …
- **THEN** the output CSV contains one row per section with `NrDispositivo` set to the section identifier

#### Scenario: No primary pattern matches — structural fallback used

- **WHEN** none of the article/section patterns yield ≥ 5 segments
- **THEN** the segmenter falls back to `Chapter` or `Part` splitting, and a warning is logged

---

### Requirement: Segment Quality Validation

The segmenter SHALL validate each country's output and flag anomalies without aborting the pipeline. A segment exceeding 8 000 tokens SHALL be split at paragraph boundaries. Duplicate segments within the same country SHALL be detected and removed.

#### Scenario: Oversized segment subdivided

- **WHEN** a segment's token count exceeds 8 000
- **THEN** it is split into paragraph-level sub-segments, each suffixed with `.p1`, `.p2`, … in `NrDispositivo`, and none of the resulting sub-segments exceeds 8 000 tokens

#### Scenario: Too few segments flagged

- **WHEN** fewer than 5 segments are produced for a country after all pattern attempts
- **THEN** a warning entry is added to the segmentation report and the country is included in the output with whatever segments were found

#### Scenario: Duplicate segments removed

- **WHEN** two segments within the same country have identical `Texto` values
- **THEN** only the first occurrence is kept and the duplicate count is recorded in the segmentation report

---

### Requirement: Per-country and Consolidated CSV Output

The segmenter SHALL write one CSV file per country to `data/articles/{CODE}_{YEAR}.csv` with columns `NomeDoPais`, `Data`, `NrDispositivo`, `Texto`, and a single consolidated `data/articles/all_articles.csv` containing all countries.

#### Scenario: Per-country file written

- **WHEN** segmentation succeeds for a country
- **THEN** `data/articles/{CODE}_{YEAR}.csv` exists, has a header row, and every `Texto` cell is non-empty

#### Scenario: Consolidated file matches sum of per-country files

- **WHEN** all countries have been segmented
- **THEN** the row count of `all_articles.csv` equals the sum of row counts across all per-country CSVs (excluding headers)
