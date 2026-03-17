## ADDED Requirements

### Requirement: Application Bootstrap

The web app SHALL load `index.json` and `clusters.json` on initial page load, render the world map and an empty 3D canvas, and reach an interactive state within 3 seconds on a 10 Mbps connection. The Constitute Project citation SHALL be visible in the footer at all times.

#### Scenario: Initial load meets performance target

- **WHEN** a user opens the app for the first time (no cache)
- **THEN** the world map is interactive and the 3D canvas is rendered within 3 seconds

#### Scenario: Citation visible

- **WHEN** the app is loaded at any route
- **THEN** the footer contains the text "Elkins, Ginsburg, Melton — Constitute Project" or equivalent attribution

---

### Requirement: World Map Country Selection

The app SHALL render an interactive SVG world map using `react-simple-maps` and TopoJSON (Natural Earth 110m). Clicking a country with data SHALL toggle its selection. Countries without data SHALL render in a disabled state with a tooltip explaining unavailability. The map SHALL support zoom (1×–8×, scroll or buttons) and pan (drag).

#### Scenario: Country selected via map click

- **WHEN** a user clicks a country that has data and is not currently selected
- **THEN** the country is added to the selection, its fill changes to the assigned colour, and the corresponding points become visible in the 3D canvas within 500 ms

#### Scenario: Country deselected via map click

- **WHEN** a user clicks a country that is already selected
- **THEN** it is removed from the selection, its fill reverts to neutral grey, and its 3D points fade out

#### Scenario: Country without data clicked

- **WHEN** a user clicks a country that has no constitutional data
- **THEN** nothing is added to the selection and a tooltip appears with an explanatory message

---

### Requirement: Geopolitical Group Presets

The app SHALL provide one-click presets to select/deselect all countries in: G7, G20, BRICS, EU (27 members), ASEAN (10 members), African Union (55 members), All, and None. Preset activation SHALL be additive (does not clear existing selection) except for "None" which clears all.

#### Scenario: G7 preset applied

- **WHEN** the user clicks the G7 preset button
- **THEN** all 7 G7 countries are added to the selection (those not already selected become selected)

#### Scenario: None preset clears selection

- **WHEN** the user clicks the None preset
- **THEN** all currently selected countries are deselected and the 3D canvas shows no points

---

### Requirement: Lazy Country Data Loading

The app SHALL load `public/data/countries/{CODE}.json` only when a country is first selected, caching it in the Zustand store for the session. Deselecting a country SHALL NOT evict its data from the cache.

#### Scenario: Data fetched on first selection

- **WHEN** a country is selected for the first time in a session
- **THEN** a network request is made to `/data/countries/{CODE}.json` and the points appear in the canvas after the response

#### Scenario: Re-selection uses cached data

- **WHEN** a country is deselected and then re-selected
- **THEN** no new network request is made and the points appear immediately

---

### Requirement: 3D Point Cloud Rendering

The app SHALL render constitutional segments as a single `InstancedMesh`. Each point's colour SHALL match its country's assigned colour; unselected-country points SHALL be rendered at 5% opacity ("ghost" mode). Point size SHALL be proportional to `cluster_probability`. The camera SHALL support orbit (drag), zoom (scroll), and pan (Shift+drag). An auto-rotate toggle SHALL be available.

#### Scenario: Points rendered at 60 FPS with 10 000 visible points

- **WHEN** up to 10 000 points from selected countries are visible
- **THEN** the frame rate is ≥ 60 FPS on a modern desktop GPU

#### Scenario: Unselected points ghosted

- **WHEN** some countries are selected and others are not, and "show all" mode is active
- **THEN** selected-country points render at full opacity; all other points render at 5% opacity

---

### Requirement: Point Interaction

Hovering over a point in the 3D canvas SHALL show a tooltip with country name, article identifier, and the first 100 characters of the text. Clicking a point SHALL expand the detail panel below the canvas with the full article text, country name, article id, cluster id, and cluster probability.

#### Scenario: Hover tooltip shown

- **WHEN** the user hovers the cursor over a point
- **THEN** a tooltip appears within 100 ms showing country, article id, and text snippet

#### Scenario: Click opens detail panel

- **WHEN** the user clicks a point
- **THEN** the bottom detail panel expands and displays the full text of the selected article

---

### Requirement: Cluster Colour Mode

The app SHALL provide a toggle to switch point colouring from "by country" to "by global cluster". In cluster mode, each cluster ID maps to a distinct colour; noise points (cluster -1) are rendered grey.

#### Scenario: Switch to cluster colour mode

- **WHEN** the user activates the cluster colour toggle
- **THEN** all visible points update their colour to reflect `global_cluster` instead of country, within one render frame

---

### Requirement: Full-text Search

The app SHALL provide a search input that calls `GET /api/search?q={query}` and displays up to 20 matching articles with country, article id, and a highlighted text snippet. Selecting a result SHALL highlight the corresponding point in the 3D canvas (loading its country data if not yet cached) and open the detail panel.

#### Scenario: Search returns relevant results

- **WHEN** a user types "freedom of speech" and submits
- **THEN** results appear within 2 seconds, each showing country name, article id, and a text snippet containing the matched terms

#### Scenario: Search result highlights 3D point

- **WHEN** a user clicks a search result
- **THEN** the corresponding country is added to the selection (if not already), the 3D canvas navigates to that point, and the detail panel opens with the full article text

---

### Requirement: Country Statistics Panel

The app SHALL display, for each selected country, the article count, cluster count, semantic coverage (% of global clusters touched), and semantic entropy. These values SHALL be read from `index.json` (no additional network request).

#### Scenario: Stats shown for selected country

- **WHEN** a country is selected
- **THEN** its stats panel entry shows article count, cluster count, semantic coverage, and entropy, all consistent with `index.json`

---

### Requirement: Internationalisation

The web app SHALL support three languages at launch: English (`en`, default), Spanish (`es`), and Portuguese (`pt`). All user-visible strings — labels, tooltips, error messages, panel headings, preset names, the Constitute Project citation, and the app subtitle — MUST be externalised into per-locale message files (`en.json`, `es.json`, `pt.json`). No hardcoded UI strings are permitted outside these files.

The active locale SHALL be determined in this order of priority:
1. Value stored in `localStorage` under `tca-locale` (user's explicit choice)
2. Browser `Accept-Language` header (best match among `en`, `es`, `pt`)
3. Fallback to `en`

A language selector control SHALL be visible in the application header at all times.

#### Scenario: Browser language matched automatically

- **WHEN** a first-time user's browser reports `Accept-Language: pt-BR`
- **THEN** the app renders in Portuguese without any user action

#### Scenario: User switches language manually

- **WHEN** the user selects "Español" from the language selector
- **THEN** all UI strings update to Spanish immediately, and the choice is persisted in `localStorage` so subsequent visits also open in Spanish

#### Scenario: Unsupported browser language falls back to English

- **WHEN** the browser reports a language not in `{en, es, pt}` (e.g., `ja`)
- **THEN** the app renders in English

#### Scenario: No hardcoded strings in components

- **WHEN** any component renders a user-visible string
- **THEN** the string originates from the active locale message file, not from a hardcoded literal in JSX or TypeScript

---

### Requirement: Vercel Deploy Configuration

The Next.js app SHALL be deployable to Vercel by pointing the project root to `app/`, with `NEON_DATABASE_URL` as the only required environment variable. The static data files in `public/data/` SHALL be committed to the repository and served by Vercel's CDN.

#### Scenario: Successful production deploy

- **WHEN** the `app/` directory is deployed to Vercel with `NEON_DATABASE_URL` configured
- **THEN** the app is accessible at the Vercel URL, the world map loads, and a search query returns results from Neon
