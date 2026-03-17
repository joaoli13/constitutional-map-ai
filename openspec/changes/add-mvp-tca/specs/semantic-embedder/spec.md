## ADDED Requirements

### Requirement: Embedding Generation

The embedder SHALL call the Google Gemini API (`gemini-embedding-001`, task type `RETRIEVAL_DOCUMENT`) for each segment in `all_articles.csv` and produce a 768-dimensional unit-norm float vector. Results SHALL be persisted to `data/embeddings/embeddings.parquet` with columns `country_code`, `country_name`, `year`, `article_id`, `text`, `embedding`, `model`, `dimensions`, and `embedded_at`.

#### Scenario: Embedding produced and stored

- **WHEN** the embedder processes a segment successfully
- **THEN** the resulting row in `embeddings.parquet` has an `embedding` column of exactly 768 floats, L2 norm ≈ 1.0 (tolerance ±0.01), and no NaN or Inf values

#### Scenario: Configurable output dimensionality

- **WHEN** the environment variable `EMBEDDING_DIMENSIONS` is set to a value other than 768 (e.g., 1536)
- **THEN** all vectors in the output Parquet have that exact dimension

---

### Requirement: Incremental Processing with Cache

The embedder SHALL skip segments whose embedding already exists in `embeddings.parquet` (matched by `article_id`), enabling the pipeline to be resumed after interruption without re-calling the API.

#### Scenario: Interrupted run resumed without re-embedding

- **WHEN** `embeddings.parquet` already contains embeddings for N segments and the embedder is re-run on the full `all_articles.csv`
- **THEN** only the remaining segments are sent to the API; the N cached rows are preserved unchanged in the output

---

### Requirement: Rate-limited Batching with Retry

The embedder SHALL process segments in parallel batches respecting the configured `EMBEDDING_MAX_RPM` limit and SHALL retry individual requests that fail with HTTP 429 or 5xx using exponential backoff (up to 3 attempts). A checkpoint SHALL be written to disk every 1 000 segments processed.

#### Scenario: Rate-limit error handled transparently

- **WHEN** the API returns HTTP 429 for a request
- **THEN** the embedder waits the prescribed backoff duration and retries; on success the embedding is stored normally; the event is logged

#### Scenario: Checkpoint written during long run

- **WHEN** 1 000 segments have been successfully embedded since the last checkpoint
- **THEN** the current batch is flushed to `embeddings.parquet` so progress is not lost on crash

---

### Requirement: Embedding Coverage Report

After processing, the embedder SHALL log a summary report including total segments processed, API call count, failure count by error type, total elapsed time, and estimated cost at current Gemini pricing.

#### Scenario: Report generated at end of run

- **WHEN** the embedder finishes processing all segments
- **THEN** a report is printed to stdout (and optionally saved as `data/embeddings/embedding_report.json`) with all required fields populated
