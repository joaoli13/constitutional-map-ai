# Design: The Constitutional Atlas MVP

## Context

Greenfield project. Two completely independent subsystems share only a file boundary and a Neon database:

1. **Pipeline** (`pipeline/`) — Python batch process, runs offline on the developer's machine (or CI). Produces JSON artefacts and populates Neon.
2. **Web App** (`app/`) — Next.js 14, deployed on Vercel. Consumes the JSON artefacts from CDN and queries Neon for search.

No Python runs in Vercel at any point.

## Goals / Non-Goals

**Goals:**
- Deliver a working, publicly accessible v1 at `vercel.app` domain
- Support exploration of ~193 countries × ~50 000 constitutional segments
- Full-text search across all segments via Neon
- 60 FPS 3D rendering with up to 10 000 visible points

**Non-Goals (v1):**
- Semantic (vector) search — deferred to v2.0
- Automatic pipeline re-runs / data refresh — manual re-deploy in v1
- User accounts, favourites, or saved views
- Mobile-first layout (responsive but desktop-primary)

## Decisions

### D1: Static JSON on Vercel CDN instead of a runtime API for data

**Decision:** The pipeline's final step (M4.5) writes per-country JSON files into `app/public/data/`. Vercel serves them as static assets from its CDN edge.

**Why:** Vercel serverless functions cannot run `pyarrow`/`pandas` (250 MB compressed limit). Serving large binary Parquet files from a function would also add cold-start latency (~3–5 s) and exceed the 3 s load target. Static CDN responses have no cold start and are globally cached.

**Alternatives considered:**
- FastAPI on Railway: works but adds a second service to maintain, CORS config, and ~$5–15/mo cost for idle servers.
- Vercel KV / Blob: viable for binary storage but adds per-request cost for data that never changes between pipeline runs.

**Trade-off:** Data updates require re-running the pipeline and re-deploying. Acceptable for v1; automate with GitHub Actions in v2.

### D2: Neon PostgreSQL (HTTP driver) for full-text search

**Decision:** Article texts are ingested into Neon using `psycopg2` from the pipeline. The Next.js Route Handler queries Neon via `@neondatabase/serverless` (HTTP protocol, no persistent connection).

**Why:** Full-text search over 50 000 records is impractical client-side (Fuse.js would require downloading all texts, ~50 MB). PostgreSQL's `to_tsvector` + GIN index gives sub-100 ms queries. The Neon HTTP driver avoids TCP connection overhead in serverless environments.

**Alternatives considered:**
- Algolia: excellent DX but ~$50/mo for this volume at paid tier; adds a third external dependency.
- SQLite in Vercel KV: read-only SQLite via Cloudflare is elegant but not on Vercel natively.

### D3: Next.js 14 App Router instead of Vite + React SPA

**Decision:** Use Next.js as the single framework for both the UI and the two Route Handlers (`/api/search`, `/api/compare`).

**Why:** Native Vercel integration (zero config deploy), built-in TypeScript, `next/image` for flag assets, and Route Handlers replace the FastAPI server without adding a separate process. Vite SPA would require a separate Express/Fastify server to host the two dynamic endpoints.

**Trade-off:** Next.js App Router has a steeper learning curve than plain React; `@react-three/fiber` requires `'use client'` directive on canvas components — well-understood pattern.

### D4: InstancedMesh for point cloud rendering

**Decision:** Render all constitutional segments as a single `THREE.InstancedMesh` with per-instance colour and size attributes.

**Why:** Drawing 50 000 individual `Mesh` objects would produce 50 000 draw calls → ~3 FPS. `InstancedMesh` collapses all points into one draw call regardless of count.

**Trade-off:** Instance attribute updates (colour change on country selection) require iterating the instance buffer — O(n) but fast in practice for n ≤ 50 000.

### D5: Project layout — monorepo with two independent roots

```
/
├── pipeline/     # Python project (pyproject.toml)
└── app/          # Node project (package.json)
```

Pipeline writes to `app/public/data/` and to Neon. After that, the two subsystems are fully decoupled. Vercel is configured to deploy only the `app/` directory (`Root Directory: app`).

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Constitute Project blocks scraping | Check for public API first; use academic User-Agent; throttle to 1 req/2 s |
| 50 000-point JSON exceeds CDN limits | Per-country split (~150 KB each); lazy-load only selected countries |
| Neon cold start on search | HTTP driver (~100–300 ms); acceptable for a search action |
| Three.js WebGL not supported on some devices | Graceful fallback message; consider 2D scatter as fallback in v1.1 |

## Migration Plan

N/A — greenfield project.

## Open Questions

- Should the Vercel deployment use a custom domain from day one, or start on `.vercel.app`?
- Does the pipeline need to run in CI (e.g., GitHub Actions) or purely locally for v1?
