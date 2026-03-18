## 0. Project Setup

- [x] 0.1 Initialise monorepo structure: create `pipeline/` and `app/` top-level directories
- [x] 0.2 Configure `pipeline/pyproject.toml` with all Python dependencies (httpx, beautifulsoup4, playwright, google-generativeai, umap-learn, hdbscan, pyarrow, pandas, psycopg2-binary, pydantic)
- [x] 0.3 Create `pipeline/src/shared/` with `constants.py`, `models.py` (Pydantic), and `country_codes.py` (ISO 3166 mapping)
- [x] 0.4 Scaffold `.env.example` at repo root documenting all required variables
- [x] 0.5 Fill in `openspec/project.md` with actual stack, conventions, and constraints
- [x] 0.6 Initialise `app/` with `npx create-next-app` (TypeScript, App Router, Tailwind)
- [x] 0.7 Install frontend dependencies: `@react-three/fiber`, `@react-three/drei`, `three`, `react-simple-maps`, `zustand`, `recharts`, `@neondatabase/serverless`, `next-intl` — note: `--legacy-peer-deps` required due to `react-simple-maps` not yet declaring React 19 peer dep; `.npmrc` configured accordingly

## 1. M1 — Constitutional Scraper

- [x] 1.1 Implement discovery phase: fetch Constitute Project listing, parse country entries, write initial `metadata.json`
- [x] 1.2 Implement `url_builder.py`: construct per-country text URLs (`/constitution/{Country}_{Year}?lang=en`)
- [x] 1.3 Implement `parser.py`: extract constitutional text body from HTML, strip navigation/headers/footers
- [x] 1.4 Implement `scraper.py`: main download loop with 2 s rate limit, 3-retry backoff (5/15/45 s), SHA-256 cache check
- [x] 1.5 Implement Playwright fallback for JS-rendered pages
- [x] 1.6 Write `scripts/run_m1.py` orchestrator
- [x] 1.7 Write `tests/test_scraper.py` (unit tests with mocked HTTP; integration test against one real URL)

## 2. M2 — Constitutional Segmenter

- [x] 2.1 Implement `patterns.py`: ordered regex list for Article/Art./Section/§/numeric/Chapter/Part patterns
- [x] 2.2 Implement `segmenter.py`: pattern detection, split, paragraph-merge for orphan paragraphs, 8 000-token oversized split
- [x] 2.3 Implement `validators.py`: segment count check (5–500), duplicate detection, character-coverage check (±5%)
- [x] 2.4 Implement `csv_writer.py`: per-country CSV and consolidated `all_articles.csv`
- [x] 2.5 Write `scripts/run_m2.py` orchestrator
- [x] 2.6 Write `tests/test_segmenter.py` (unit tests for each regex pattern; edge cases: <5 segments, oversized segments)

## 3. M3 — Semantic Embedder

- [x] 3.1 Implement `gemini_client.py`: wrapper around `genai.embed_content` with configurable model and dimensionality
- [x] 3.2 Implement `cache.py`: check existing `embeddings.parquet` by `article_id` to skip already-embedded segments
- [x] 3.3 Implement `batch_processor.py`: parallel batching respecting `EMBEDDING_MAX_RPM`, exponential-backoff retry on 429/5xx, checkpoint every 1 000 segments
- [x] 3.4 Implement `embedder.py`: main pipeline (load CSV → cache check → batch → write Parquet → coverage report)
- [x] 3.5 Write `scripts/run_m3.py` orchestrator
- [x] 3.6 Write `tests/test_embedder.py` (mock Gemini API; verify Parquet schema, vector norms, cache skip behaviour)

## 4. M4 — Semantic Clusterer

- [x] 4.1 Implement `umap_reducer.py`: dual UMAP (50D cluster + 3D viz) with fixed random state; expose params via env vars
- [x] 4.2 Implement `hdbscan_runner.py`: global HDBSCAN on 50D projection; expose `min_cluster_size` and `min_samples` via env vars
- [x] 4.3 Implement `country_clusters.py`: per-country HDBSCAN loop with reduced parameters
- [x] 4.4 Implement `report_generator.py`: write `cluster_report.json` with all required statistics
- [x] 4.5 Implement `clusterer.py`: main pipeline (load Parquet → UMAP → HDBSCAN global → HDBSCAN per-country → write `clustered.parquet` → report)
- [x] 4.6 Write `scripts/run_m4.py` orchestrator
- [x] 4.7 Write `tests/test_clusterer.py` (small synthetic embedding fixture; verify output schema, noise ratio, report fields)

## 5. M4.5 — Data Exporter

- [x] 5.1 Implement Neon schema migration in `neon_ingest.py`: CREATE TABLE IF NOT EXISTS + GIN index (idempotent)
- [x] 5.2 Implement `neon_ingest.py`: upsert loop in batches of 500 from `clustered.parquet`
- [x] 5.3 Implement `json_writer.py`: generate `index.json`, `clusters.json`, and `countries/{CODE}.json` from `clustered.parquet` + `metadata.json`
- [x] 5.4 Implement `validator.py`: consistency checks (country file count, Neon row count, non-empty snippets); exit non-zero on failure
- [x] 5.5 Write `scripts/run_m4_5.py` orchestrator
- [x] 5.6 Write `scripts/run_pipeline.py`: full end-to-end orchestrator (M1 → M4.5)
- [x] 5.7 Write `tests/test_exporter.py` (mock Neon connection; verify JSON schema, file counts, validation logic)

## 6. M5 — Web App: i18n Setup

- [x] 6.1 Configure `next-intl`: add plugin to `next.config.ts`, create `i18n.ts` routing config for locales `['en', 'es', 'pt']` with `en` as default
- [x] 6.2 Create locale message files: `app/messages/en.json`, `app/messages/es.json`, `app/messages/pt.json` — stub all keys with English values initially
- [x] 6.3 Implement locale detection middleware (`app/middleware.ts`): priority order — `tca-locale` in `localStorage` cookie → `Accept-Language` → fallback `en`
- [x] 6.4 Implement `LanguageSelector` component in the app header: dropdown with EN / ES / PT, writes selection to `localStorage` and updates active locale

## 7. M5 — Web App: Foundation

- [x] 7.1 Configure `next.config.ts`: set `output: 'standalone'`; add `next-intl` plugin; verify `public/data/` is served statically
- [x] 7.2 Implement Zustand store (`stores/appStore.ts`): country selection set, loaded country data cache, selected point, search results, colour mode toggle
- [x] 7.3 Implement `lib/neon.ts`: `@neondatabase/serverless` client initialised from `NEON_DATABASE_URL`
- [x] 7.4 Implement `app/api/search/route.ts`: `GET /api/search?q&country&cluster&limit` → Neon `plainto_tsquery` query; return JSON matching spec
- [x] 7.5 Implement `app/api/compare/route.ts`: `GET /api/compare?a&b` → Jaccard on cluster overlap + centroid distance from client-side loaded data
- [x] 7.6 Write integration test for `/api/search` against a Neon test database

## 8. M5 — Web App: Components

- [x] 8.1 Implement `hooks/useCountryData.ts`: fetch `/data/countries/{CODE}.json` on first selection; cache in store
- [x] 8.2 Implement `components/WorldMap.tsx`: `react-simple-maps` SVG map, toggle-select on click, colour sync with store, zoom/pan, disabled state for no-data countries, hover tooltip
- [x] 8.3 Implement `components/ControlPanel.tsx`: selected country list with colours, preset buttons (G7/G20/BRICS/EU/ASEAN/AU/All/None), search-by-name filter, ordering options
- [x] 8.4 Implement `components/PointCloud.tsx`: `InstancedMesh` rendering, per-instance colour/size, ghost opacity for unselected countries, colour-mode switch (country vs. cluster)
- [x] 8.5 Implement `components/Canvas3D.tsx`: `@react-three/fiber` scene with `OrbitControls`, auto-rotate toggle, `PointCloud` inside, double-click to focus
- [x] 8.6 Implement `components/DetailPanel.tsx`: article full text, country name, article id, cluster id, cluster probability
- [x] 8.7 Implement `components/SearchPanel.tsx`: search input → `/api/search` → result list with highlight; click result → select country + focus point
- [x] 8.8 Implement `components/StatsPanel.tsx`: per-country article count, cluster count, semantic coverage, entropy from `index.json`
- [x] 8.9 Implement `lib/colors.ts`: HSL-spaced colour palette generation for up to 20 distinct countries
- [x] 8.10 Populate `messages/es.json` and `messages/pt.json` with accurate translations of all keys (translate from English stubs created in 6.2)
- [x] 8.11 Compose `app/page.tsx`: assemble all panels in the layout described in the PRD (world map + control panel top, canvas centre, detail panel bottom); include `LanguageSelector` in header

## 9. Deploy & Validation

- [x] 9.1 Configure Vercel project: root directory = `app/`, set `NEON_DATABASE_URL` environment variable
- [x] 9.2 Run M1–M4.5 pipeline end-to-end; verify `cluster_report.json` and exporter validation pass
- [x] 9.3 Commit generated `app/public/data/` files to the repository
- [ ] 9.4 Deploy to Vercel; verify world map loads, country selection works, search returns results
- [ ] 9.5 Manual smoke test: select G7 preset → 3D points appear, hover tooltip shows, search "fundamental rights" returns results, detail panel opens
- [ ] 9.6 i18n smoke test: switch to PT → all visible strings render in Portuguese; switch to ES → all strings render in Spanish; reload → locale persists
