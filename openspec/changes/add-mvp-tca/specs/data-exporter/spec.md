## ADDED Requirements

### Requirement: Static JSON Generation

The exporter SHALL convert `data/clusters/clustered.parquet` into three categories of static JSON files written to `app/public/data/`:

- `index.json` — array of country objects with fields: `code`, `iso_alpha2`, `name`, `region`, `sub_region`, `constitution_year`, `last_amendment_year`, `article_count`, `cluster_count`, `semantic_coverage`, `semantic_entropy`, `has_data`, plus a top-level `generated_at`, `pipeline_version`, and `total_articles`.
- `clusters.json` — global cluster list with fields per cluster: `id`, `size`, `label` (null in v1), `top_countries`, `centroid` (mean x/y/z), `sample_texts` (up to 5).
- `countries/{CODE}.json` — per-country point arrays with fields per article: `id`, `article_id`, `text_snippet` (≤ 200 chars), `x`, `y`, `z`, `global_cluster`, `country_cluster`, `cluster_probability`.

#### Scenario: All country files generated

- **WHEN** the exporter runs on a complete `clustered.parquet`
- **THEN** one `{CODE}.json` file exists under `app/public/data/countries/` for every country with `has_data: true` in `index.json`

#### Scenario: index.json totals are consistent

- **WHEN** `index.json` is generated
- **THEN** the sum of `article_count` across all country entries equals `total_articles`, which equals the row count of `clustered.parquet`

#### Scenario: File size within CDN limits

- **WHEN** all country JSON files are generated
- **THEN** no single `{CODE}.json` exceeds 500 KB, and total size of `app/public/data/` does not exceed 60 MB

---

### Requirement: Neon Full-text Search Schema

The exporter SHALL create (or migrate) the `articles` table in Neon with the schema: `id TEXT PRIMARY KEY`, `country_code TEXT`, `country_name TEXT`, `region TEXT`, `article_id TEXT`, `year INTEGER`, `text TEXT`, `text_snippet TEXT`, `global_cluster INTEGER`, `x REAL`, `y REAL`, `z REAL`. A GIN index on `to_tsvector('english', text)` SHALL exist before ingest begins.

#### Scenario: Schema created idempotently

- **WHEN** the exporter runs against a Neon database that already has the `articles` table
- **THEN** it does not raise an error and the schema remains unchanged

---

### Requirement: Neon Article Ingest

The exporter SHALL upsert all rows from `clustered.parquet` into the `articles` table in batches of 500, using `ON CONFLICT (id) DO UPDATE` to refresh `text`, `global_cluster`, `x`, `y`, `z`. The `text` field SHALL contain the full article text; `text_snippet` SHALL contain the first 200 characters.

#### Scenario: Full ingest completes without data loss

- **WHEN** the exporter finishes ingesting
- **THEN** `SELECT COUNT(*) FROM articles` equals the row count of `clustered.parquet`

#### Scenario: Re-ingest after pipeline update is safe

- **WHEN** the pipeline is re-run and the exporter ingests updated data into a non-empty Neon table
- **THEN** existing rows are updated (not duplicated) and the final count still equals the Parquet row count

---

### Requirement: Export Validation

After generating all artefacts, the exporter SHALL verify consistency between the Parquet source and the generated outputs, logging a pass/fail summary. The pipeline MUST NOT be considered complete if validation fails.

#### Scenario: Validation passes on clean run

- **WHEN** JSON files and Neon ingest complete without errors
- **THEN** validation confirms: country file count == `has_data` count in `index.json`, Neon article count == Parquet row count, no `text_snippet` field is empty

#### Scenario: Validation fails and is reported

- **WHEN** a country JSON file is missing or Neon article count does not match
- **THEN** the exporter exits with a non-zero status code and logs the specific discrepancy
