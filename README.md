# city3d-stac-map

[![CI status](https://img.shields.io/github/actions/workflow/status/cityjson/city3d-stac-map/ci.yaml?style=for-the-badge&label=CI)](https://github.com/cityjson/city3d-stac-map/actions/workflows/ci.yaml)
[![GitHub deployments](https://img.shields.io/github/deployments/cityjson/city3d-stac-map/github-pages?style=for-the-badge&label=Deploy)](https://github.com/cityjson/city3d-stac-map/deployments/github-pages)

A map-first STAC visualizer with native support for 3D city models. Built as part of a research project at [TU Delft](https://www.tudelft.nl/) to bring [CityJSON](https://www.cityjson.org/), CityGML, and other 3D city model formats into the [STAC](https://stacspec.org/) ecosystem.

**Live demo:** [city3d-stac-map](https://cityjson.github.io/city3d-stac-map/?href=https://storage.googleapis.com/city3d-stac/catalog.json)

<!-- markdownlint-disable MD033 -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="img/stac-map-dark.png">
  <img alt="city3d-stac-map screenshot" src="img/stac-map-dark.png">
</picture>
<!-- markdownlint-enable MD033 -->

## What is this?

This project extends [stac-map](https://github.com/developmentseed/stac-map) (by Development Seed) with native support for the [STAC City3D Extension](https://github.com/cityjson/stac-city3d) — a proposed STAC extension for describing 3D city model datasets.

The viewer understands `city3d:*` metadata fields and renders them as rich, interactive panels, including:

- **Level of Detail (LoD)** badges with support for decimal LoDs (per Biljecki et al.)
- **City object types** grouped by category (Buildings, Infrastructure, Water, Vegetation, Terrain)
- **Appearance features** — semantic surfaces, textures, materials
- **CRS display** with links to [epsg.io](https://epsg.io/)
- **Attribute schemas** and city object statistics
- Support for both **Item properties** and **Collection summaries**

### Supported formats

CityJSON, CityJSONSeq, FlatCityBuf, CityGML, OBJ

### STAC City3D Extension

The extension adds these fields (prefix `city3d:`) to STAC Items and Collections:

| Field | Type | Description |
|---|---|---|
| `city3d:version` | string | Spec version (e.g. "1.1" for CityJSON) |
| `city3d:city_objects` | integer / object | City object count or `{min, max, total}` stats |
| `city3d:lods` | [number] | Levels of Detail |
| `city3d:co_types` | [string] | City object types (Building, Bridge, Road, etc.) |
| `city3d:attributes` | [object] | Semantic attribute definitions |
| `city3d:semantic_surfaces` | boolean | Has semantic surfaces |
| `city3d:textures` | boolean | Has textures |
| `city3d:materials` | boolean | Has materials |

See the full spec at [cityjson/stac-city3d](https://github.com/cityjson/stac-city3d).

## Features from upstream

In addition to City3D support, this viewer retains all features from stac-map:

- Client-side COG rendering via [deck.gl-raster](https://github.com/developmentseed/deck.gl-raster)
- Collection rendering via web map services
- [stac-geoparquet](https://github.com/radiantearth/stac-geoparquet-spec) visualization, upload, and export

## Development

Requires [Yarn](https://yarnpkg.com/) (v1 classic):

```shell
git clone git@github.com:cityjson/city3d-stac-map.git
cd city3d-stac-map
yarn install
yarn dev
```

The dev server starts at <http://localhost:5173/stac-map/>.

### Code quality

```shell
yarn lint
yarn format
```

### Testing

```shell
yarn playwright install
yarn test
```

## Deployment

The app is deployed as a static site via GitHub Pages. See [deploy.yaml](./.github/workflows/deploy.yaml).

### Custom deployment

You can deploy your own instance using environment variables:

| Variable | Description | Default |
|---|---|---|
| `VITE_BASE_PATH` | URL path prefix (e.g., `/my-app/`) | `/stac-map/` |
| `VITE_DEFAULT_HREF` | STAC resource to load on startup | None (shows intro) |

```shell
VITE_BASE_PATH=/ VITE_DEFAULT_HREF=https://my-stac-api.com yarn build
```

## Architecture

See [docs/architecture.md](./docs/architecture.md) for details. The core flow is:

> Single `href` (URL param) → fetch STAC resource → render metadata + map

The City3D extension is integrated in:
- `src/components/value/city3d.tsx` — City3D visualization component
- `src/types/stac.d.ts` — TypeScript types for City3D fields
- `src/components/value.tsx` — Integration point for Items and Collections

## Acknowledgements

This project is a fork of [stac-map](https://github.com/developmentseed/stac-map) by [Development Seed](https://developmentseed.org/). The upstream project provides the core STAC visualization infrastructure that this fork extends.

## License

See [LICENSE](./LICENSE).
