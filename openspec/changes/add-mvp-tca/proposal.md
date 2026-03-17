# Change: Add MVP — The Constitutional Atlas

## Why

The Constitutional Atlas does not yet exist as code. This change delivers the complete v1 MVP: a Python data pipeline that collects, segments, embeds, and clusters constitutional texts from ~193 countries, plus a Next.js web app deployed on Vercel that lets researchers and curious users explore the global semantic space of constitutions interactively.

## What Changes

- **ADDED** `constitutional-scraper` — Python module (M1) that discovers and downloads constitutional texts from the Constitute Project, with rate limiting, retry/backoff, and SHA-256 caching.
- **ADDED** `constitutional-segmenter` — Python module (M2) that splits raw texts into individual articles/sections, handling multiple legal traditions (civil law, common law, Islamic, hybrid), and produces per-country CSVs plus a consolidated `all_articles.csv`.
- **ADDED** `semantic-embedder` — Python module (M3) that generates 768-dimensional embeddings via the Google Gemini API (`gemini-embedding-001`) for every constitutional segment, with incremental caching and rate-limited batching.
- **ADDED** `semantic-clusterer` — Python module (M4) that reduces embeddings via UMAP (768D → 50D for clustering, 768D → 3D for visualization) and applies HDBSCAN globally and per-country, producing `clustered.parquet` with 3D coordinates and cluster labels.
- **ADDED** `data-exporter` — Python module (M4.5) that converts the Parquet output into CDN-ready static JSON files (`index.json`, `clusters.json`, per-country `{CODE}.json`) and ingests full article texts into a Neon PostgreSQL database for full-text search.
- **ADDED** `atlas-visualization` — Next.js 14 web app (M5) deployed on Vercel: interactive world map for country selection, 3D point cloud for semantic exploration, full-text search via Neon, point interaction panels, cluster visualization, and basic comparison mode. The portal is multilingual at launch: **English** (default), **Español**, and **Português**; all UI strings are externalised to locale files.

## Impact

- Affected specs: all 6 new capabilities (greenfield — no existing specs)
- Affected code: entire codebase (new project)
- Breaking changes: none
- Data licence: Creative Commons Attribution-NonCommercial 3.0 Unported (Constitute Project); citation must appear in the deployed application UI
- Key external dependencies: Constitute Project website/API, Google Gemini API, Neon PostgreSQL, Vercel
- i18n: `next-intl` (or equivalent); locale files `en.json`, `es.json`, `pt.json` required before deploy
