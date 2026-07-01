# AGENTS.md

## Project Context

This is a **research project** at TU Delft focused on 3D city model metadata for geospatial data catalogs.

**Goal:** Extend the [STAC](https://stacspec.org/) (SpatioTemporal Asset Catalog) specification with a custom extension for 3D city models (CityJSON, CityGML, etc.), and build a viewer that natively supports it.

This codebase is a **fork of [stac-map](https://github.com/developmentseed/stac-map)** (by Development Seed) — a map-first, single-page, statically-hosted STAC visualizer. We are extending it with native support for the **3D City Models STAC extension** (`city3d`).

### STAC City3D Extension

- **Spec repo:** https://github.com/cityjson/stac-city3d
- **Schema ID:** `https://cityjson.github.io/stac-city3d/v0.1.0/schema.json`
- **Field prefix:** `city3d:`
- **Scope:** Item Properties, Collection Summaries, Assets
- **Maturity:** Proposal

**Extension fields:**
| Field | Type | Description |
|---|---|---|
| `city3d:version` | string | Spec version (e.g. "1.1" CityJSON, "3.0" CityGML) |
| `city3d:city_objects` | integer or `{min, max, total}` | City object count (integer for Items, stats object for Collections) |
| `city3d:lods` | [number] | Levels of Detail (supports decimals like 1.2, 2.3 per Biljecki et al.) |
| `city3d:co_types` | [string] | City object types: Building, Bridge, Road, Tunnel, WaterBody, etc. Extension types prefixed with `+` |
| `city3d:attributes` | [{name, type, description?, required?}] | Semantic attribute schema on city objects |
| `city3d:semantic_surfaces` | boolean | Has semantic surfaces (RoofSurface, WallSurface, etc.) |
| `city3d:textures` | boolean | Has texture information |
| `city3d:materials` | boolean | Has material information |

**Related extensions:** Projection (`proj:code`), File (`file:checksum`, `file:size`), Statistics, Language.

**Supported formats:** CityJSON, CityJSONSeq, FlatCityBuf, CityGML, OBJ.

## Commands

- `yarn dev` — Dev server at http://localhost:5173/stac-map/
- `yarn build` — Type-check + build (`tsc -b && vite build`)
- `yarn lint` — ESLint
- `yarn format` — Prettier (write)
- `yarn format:check` — Prettier (check only)
- `yarn test` — Vitest browser tests (requires `yarn playwright install` first)

## Architecture

**Core flow:** Single `href` (URL param) → fetch `value` (STAC Catalog/Collection/Item/API/ItemCollection/geoparquet) → drives all UI. See `docs/architecture.md`.

**Key directories:**
- `src/store/` — Zustand store with 16 slices (href, value, collections, items, bbox, cogs, etc.). Only `restrictToThreeBandCogs` and `hivePartitioning` are persisted to localStorage.
- `src/components/` — React components. `src/components/ui/` is auto-generated Chakra UI (excluded from lint).
- `src/components/value/city3d.tsx` — **City3D extension visualization component** (renders metadata from Items and Collection summaries).
- `src/types/stac.d.ts` — TypeScript types including `City3DProperties`, `CityObjectsStatistics`, `AttributeDefinition`, `CityObjectType`.
- `src/hooks/` — React hooks (stac, store, wmts, planetary-computer)
- `src/utils/` — Utility functions
- `docs/decisions/` — Architecture Decision Records (ADRs)

### City3D Integration Points

The City3D extension is currently rendered in `src/components/value.tsx`:
- For **Items** (`type === "Feature"`): `<City3D properties={value.properties} />`
- For **Collections**: `<City3D summaries={(value as StacCollection).summaries} />`

The `city3d.tsx` component:
- Extracts `city3d:*` and `proj:*` fields from properties or summaries
- Groups city object types by category (Buildings, Infrastructure, Water, Vegetation, Terrain, Other)
- Displays LoD badges, appearance features (semantic surfaces/textures/materials), CRS links to epsg.io

## Tech Stack

React 19, Chakra UI v3, Vite, TypeScript, Zustand (state), @tanstack/react-query, deck.gl + MapLibre GL (maps), DuckDB-WASM (geoparquet), stac-ts/stac-wasm

## Code Style

- **Conventional Commits** required (enforced by release-please)
- ESLint + Prettier with organize-imports plugin
- `src/components/ui/` is excluded from linting (auto-generated)

## Environment Variables

- `VITE_BASE_PATH` — URL path prefix (default: `/stac-map/`)
- `VITE_DEFAULT_HREF` — STAC resource to load on startup (default: none, shows intro)

## Testing

Vitest with `@vitest/browser-playwright` — tests run in headless Chromium (not jsdom). Test files in `tests/`.

## Gotchas

- Vite requires `vite-plugin-wasm` + `vite-plugin-top-level-await` for WASM (DuckDB, stac-wasm)
- `@geoarrow/geoarrow-js` is pinned to a **fork** (`github:smohiudd/geoarrow-js#feature/wkb`)
- Zustand `partialize` only persists 2 settings to localStorage — all other state is transient
- Package manager is **Yarn 1 (classic)** — use `yarn`, not `npm`
- `city3d:city_objects` has dual types: integer in Items, `{min, max, total}` stats object in Collection summaries
- Collection summaries use different formats (arrays, range objects) that need special extraction — see `extractCity3DSummaries()` in `city3d.tsx`
