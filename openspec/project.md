# Project Context

## Purpose

**The Constitutional Atlas** — *A semantic map of the world's constitutions*

A comparative semantic analysis platform for the world's in-force constitutions. The project scrapes, segments, embeds (Gemini), and clusters (~50 000 segments from ~193 countries) constitutional texts, then exposes an interactive 3D visualization on the web.

## Tech Stack

**Pipeline (offline — `pipeline/`):**
- Python 3.11+
- `httpx`, `beautifulsoup4`, `playwright` — web scraping
- `google-generativeai` — Gemini embedding API (`gemini-embedding-001`, 768d)
- `umap-learn`, `hdbscan` — dimensionality reduction and clustering
- `pyarrow`, `pandas` — Parquet storage
- `psycopg2-binary` — Neon ingest

**Web App (Vercel — `app/`):**
- Next.js 14 (App Router), TypeScript
- `@react-three/fiber`, `@react-three/drei`, `three` — 3D point cloud
- `react-simple-maps` + TopoJSON Natural Earth 110m — world map
- Tailwind CSS + shadcn/ui — UI components
- Zustand — global state
- Recharts — statistics charts
- `@neondatabase/serverless` — Neon PostgreSQL (HTTP driver, no TCP)
- next-intl (or equivalent) — i18n (en / es / pt)

**Infrastructure:**
- Vercel — web app deploy (root: `app/`)
- Neon PostgreSQL — full-text search on article texts
- Vercel CDN — static JSON data files (`app/public/data/`)

## Project Conventions

### Naming

- Product name: **The Constitutional Atlas**
- Tagline / subtitle: *A semantic map of the world's constitutions*

### Code Style

- Python: follow PEP 8; use `ruff` for linting and formatting
- TypeScript: strict mode; ESLint + Prettier
- File names: snake_case for Python, kebab-case for Next.js components

### Architecture Patterns

- Pipeline and web app are fully decoupled; they share only `app/public/data/` (files) and Neon (database)
- No Python in Vercel runtime; all data pre-processed to static JSON by M4.5
- Data serving hierarchy: static JSON from CDN (default) → Neon Route Handler (search only)
- Next.js Route Handlers used only for `/api/search` and `/api/compare`

### Testing Strategy

- Pipeline: pytest unit tests with mocked HTTP / API calls; at least one integration test per module
- Web app: no testing framework mandated in v1; add Playwright e2e in v2

### Git Workflow

- Feature branches; squash-merge to main
- `pipeline/` and `app/` can be committed independently
- Generated `app/public/data/` files ARE committed to the repository (Vercel CDN source of truth)

## Domain Context

- Constitutional texts follow different legal traditions (civil law, common law, Islamic, hybrid) with varying article numbering conventions
- Data source: Constitute Project (CC BY-NC 3.0); citation mandatory in the deployed UI
- Data updates require re-running the full pipeline and re-deploying (v1 design decision)

## Important Constraints

- CC BY-NC 3.0 licence — non-commercial use only
- Constitute Project scraping: max 1 req/2 s; respect robots.txt; use academic User-Agent
- Gemini API: 8 192 token max per embedding request; segments exceeding this must be split
- Vercel serverless function limit: 250 MB compressed — no Python/pyarrow in runtime

## External Dependencies

| Service | Used by | Purpose |
|---------|---------|---------|
| Constitute Project | M1 pipeline | Source of constitutional texts |
| Google Gemini API | M3 pipeline | `gemini-embedding-001` embeddings |
| Neon PostgreSQL | M4.5 pipeline + `/api/search` | Full-text search on article texts |
| Vercel | M5 web app | Hosting + CDN for static JSON |

## Internationalisation

Portal languages (v1): English (default), Español, Português.
All UI strings must be externalised. Language auto-detected from browser `Accept-Language`; user override stored in `localStorage`.
