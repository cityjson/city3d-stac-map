# Viewport-Aware Item Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce map rendering overhead when a STAC collection has many items by filtering bboxes to the viewport and thinning them at low zoom levels.

**Architecture:** Create a pure utility function `filterVisibleItems` that performs viewport culling + zoom-based thinning. Expose it via a new `useVisibleItems()` React hook that the map component consumes instead of the raw `useItems()`. A small `ItemsNotice` component shows a message when items are being thinned. Non-map consumers (`value.tsx`, `search.tsx`, `collections/index.tsx`, `value/items.tsx`) continue using `useItems()` unfiltered — they need full item lists for sidebar rendering, progress bars, and downloads. The map component keeps `useItems()` for the value layer's `filled` prop to avoid visual regression.

**Tech Stack:** React hooks, Zustand store (existing `bbox`/`zoom` state), `useMemo`, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/utils/items.ts` | Pure function `filterVisibleItems(items, bbox, zoom)` — viewport culling + zoom-based sampling. Constants for zoom thresholds and item caps. |
| Create | `tests/utils/items.spec.ts` | Unit tests for `filterVisibleItems` |
| Modify | `src/hooks/store.ts` | Add `useVisibleItems()` hook that composes `useItems()` + store bbox/zoom + `filterVisibleItems` |
| Modify | `src/components/map.tsx:1,73,125-141` | Add `useVisibleItems()` alongside existing `useItems()` — use filtered data for the `"items"` GeoJsonLayer, keep unfiltered items for the `"value"` layer's `filled` prop |
| Create | `src/components/items-notice.tsx` | Small UI component: "Showing X of Y items — zoom in to see more" |
| Modify | `src/components/map.tsx:276` | Wrap map in container div, render `<ItemsNotice>` overlay when items are thinned |

---

### Task 1: Pure filtering utility

**Files:**
- Create: `src/utils/items.ts`
- Create: `tests/utils/items.spec.ts`

- [ ] **Step 1: Write failing tests for viewport culling**

```ts
// tests/utils/items.spec.ts
import type { StacItem } from "stac-ts";
import { describe, expect, test } from "vitest";
import { filterVisibleItems } from "../../src/utils/items";
import type { BBox2D } from "../../src/types/map";

function makeItem(id: string, bbox: number[]): StacItem {
  return {
    type: "Feature",
    stac_version: "1.0.0",
    id,
    geometry: { type: "Point", coordinates: [bbox[0], bbox[1]] },
    bbox,
    properties: { datetime: "2020-01-01T00:00:00Z" },
    links: [],
    assets: {},
  };
}

describe("filterVisibleItems", () => {
  const viewport: BBox2D = [0, 0, 10, 10];

  test("returns null when items is null", () => {
    expect(filterVisibleItems(null, viewport, 14)).toBeNull();
  });

  test("returns all items when bbox is null", () => {
    const items = [makeItem("a", [1, 1, 2, 2])];
    const result = filterVisibleItems(items, null, 14);
    expect(result!.visible).toEqual(items);
    expect(result!.total).toBe(1);
  });

  test("filters out items outside viewport", () => {
    const inside = makeItem("in", [1, 1, 2, 2]);
    const outside = makeItem("out", [20, 20, 30, 30]);
    const result = filterVisibleItems([inside, outside], viewport, 14);
    expect(result!.visible).toEqual([inside]);
    expect(result!.total).toBe(2);
  });

  test("keeps items that partially overlap viewport", () => {
    const partial = makeItem("partial", [-5, -5, 5, 5]);
    const result = filterVisibleItems([partial], viewport, 14);
    expect(result!.visible).toEqual([partial]);
  });

  test("keeps items with no bbox", () => {
    const noBbox: StacItem = {
      type: "Feature",
      stac_version: "1.0.0",
      id: "no-bbox",
      geometry: { type: "Point", coordinates: [0, 0] },
      bbox: undefined as unknown as number[],
      properties: { datetime: "2020-01-01T00:00:00Z" },
      links: [],
      assets: {},
    };
    const result = filterVisibleItems([noBbox], viewport, 14);
    expect(result!.visible).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn test tests/utils/items.spec.ts`
Expected: FAIL — `filterVisibleItems` does not exist

- [ ] **Step 3: Write the `filterVisibleItems` function (viewport culling only)**

```ts
// src/utils/items.ts
import type { StacItem } from "stac-ts";
import type { BBox2D } from "../types/map";

export interface FilteredItems {
  visible: StacItem[];
  total: number;
}

export function filterVisibleItems(
  items: StacItem[] | null,
  bbox: BBox2D | null,
  zoom: number | null
): FilteredItems | null {
  if (!items) return null;
  const total = items.length;

  if (!bbox) return { visible: items, total };

  // Viewport culling: AABB intersection test
  const visible = items.filter((item) => {
    const b = item.bbox;
    if (!b || b.length < 4) return true;
    return (
      b[0] <= bbox[2] && b[2] >= bbox[0] && b[1] <= bbox[3] && b[3] >= bbox[1]
    );
  });

  return { visible, total };
}
```

- [ ] **Step 4: Run tests to verify viewport culling passes**

Run: `yarn test tests/utils/items.spec.ts`
Expected: PASS

- [ ] **Step 5: Add failing tests for zoom-based thinning**

Append to `tests/utils/items.spec.ts`:

```ts
describe("zoom-based thinning", () => {
  const viewport: BBox2D = [0, 0, 100, 100];

  function makeManyItems(count: number): StacItem[] {
    return Array.from({ length: count }, (_, i) =>
      makeItem(
        `item-${i}`,
        [i % 100, i % 100, (i % 100) + 1, (i % 100) + 1]
      )
    );
  }

  test("caps items at 200 when zoom < 8", () => {
    const items = makeManyItems(1000);
    const result = filterVisibleItems(items, viewport, 5);
    expect(result!.visible.length).toBeLessThanOrEqual(200);
    expect(result!.total).toBe(1000);
  });

  test("caps items at 500 when zoom is between 8 and 12", () => {
    const items = makeManyItems(1000);
    const result = filterVisibleItems(items, viewport, 10);
    expect(result!.visible.length).toBeLessThanOrEqual(500);
    expect(result!.total).toBe(1000);
  });

  test("caps with non-even item counts", () => {
    const items = makeManyItems(1001);
    const result = filterVisibleItems(items, viewport, 5);
    expect(result!.visible.length).toBeLessThanOrEqual(200);
    expect(result!.visible.length).toBeGreaterThanOrEqual(190);
    expect(result!.total).toBe(1001);
  });

  test("does not thin when zoom >= 12", () => {
    const items = makeManyItems(1000);
    const result = filterVisibleItems(items, viewport, 14);
    expect(result!.visible.length).toBe(1000);
    expect(result!.total).toBe(1000);
  });

  test("does not thin when zoom is null", () => {
    const items = makeManyItems(1000);
    const result = filterVisibleItems(items, viewport, null);
    expect(result!.visible.length).toBe(1000);
  });

  test("does not thin when below max threshold", () => {
    const items = makeManyItems(150);
    const result = filterVisibleItems(items, viewport, 5);
    expect(result!.visible.length).toBe(150);
  });
});
```

- [ ] **Step 6: Run tests to verify thinning tests fail**

Run: `yarn test tests/utils/items.spec.ts`
Expected: FAIL — thinning assertions fail (all 1000 items returned)

- [ ] **Step 7: Implement zoom-based thinning**

Update `src/utils/items.ts` — add thinning logic after viewport culling:

```ts
// src/utils/items.ts
import type { StacItem } from "stac-ts";
import type { BBox2D } from "../types/map";

const ZOOM_LOW = 8;
const ZOOM_MEDIUM = 12;
const MAX_ITEMS_LOW = 200;
const MAX_ITEMS_MEDIUM = 500;

export interface FilteredItems {
  visible: StacItem[];
  total: number;
}

export function filterVisibleItems(
  items: StacItem[] | null,
  bbox: BBox2D | null,
  zoom: number | null
): FilteredItems | null {
  if (!items) return null;
  const total = items.length;

  if (!bbox) return { visible: items, total };

  // Viewport culling: AABB intersection test
  let visible = items.filter((item) => {
    const b = item.bbox;
    if (!b || b.length < 4) return true;
    return (
      b[0] <= bbox[2] && b[2] >= bbox[0] && b[1] <= bbox[3] && b[3] >= bbox[1]
    );
  });

  // Zoom-based thinning: deterministic stride sampling
  if (zoom != null) {
    const maxItems =
      zoom < ZOOM_LOW
        ? MAX_ITEMS_LOW
        : zoom < ZOOM_MEDIUM
          ? MAX_ITEMS_MEDIUM
          : Infinity;
    if (visible.length > maxItems) {
      const step = visible.length / maxItems;
      visible = Array.from({ length: maxItems }, (_, i) =>
        visible[Math.floor(i * step)]
      );
    }
  }

  return { visible, total };
}
```

- [ ] **Step 8: Run all tests to verify everything passes**

Run: `yarn test tests/utils/items.spec.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/utils/items.ts tests/utils/items.spec.ts
git commit -m "$(cat <<'EOF'
feat: add viewport culling and zoom-based thinning for map items

Introduces filterVisibleItems() utility that:
- Filters items whose bbox does not intersect the map viewport
- Applies deterministic stride sampling at low zoom levels (max 200 at z<8, 500 at z<12)
EOF
)"
```

---

### Task 2: `useVisibleItems` hook

**Files:**
- Modify: `src/hooks/store.ts`

- [ ] **Step 1: Add `useVisibleItems` hook**

Add imports at the top of `src/hooks/store.ts` and the new hook after `useCollectionBounds`:

```ts
import { useMemo } from "react";
import { filterVisibleItems } from "@/utils/items";
```

Then add after the existing `useCollectionBounds` function:

```ts
export function useVisibleItems() {
  const items = useItems();
  const bbox = useStore((store) => store.bbox);
  const zoom = useStore((store) => store.zoom);

  return useMemo(
    () => filterVisibleItems(items, bbox, zoom),
    [items, bbox, zoom]
  );
}
```

- [ ] **Step 2: Verify the project compiles**

Run: `yarn tsc -b --noEmit`
Expected: No type errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/store.ts
git commit -m "feat: add useVisibleItems hook for viewport-filtered map items"
```

---

### Task 3: Wire up the map component

**Files:**
- Modify: `src/components/map.tsx:1,73,115,125-141`

**Important:** Keep `useItems()` for the `"value"` layer's `filled` prop check. Only use `useVisibleItems()` for the `"items"` GeoJsonLayer data. This prevents visual regression where the value layer fills in when the user pans away from all items.

- [ ] **Step 1: Update imports in map.tsx**

In `src/components/map.tsx`, change line 1 from:

```ts
import { useCollectionBounds, useItems } from "@/hooks/store";
```

to:

```ts
import { useCollectionBounds, useItems, useVisibleItems } from "@/hooks/store";
```

- [ ] **Step 2: Add `useVisibleItems` call alongside existing `useItems`**

After line 73 (`const items = useItems();`), add:

```ts
const filteredItems = useVisibleItems();
```

- [ ] **Step 3: Update the `"items"` GeoJsonLayer to use filtered data**

Replace the items layer block (lines 125-141) with:

```ts
  if (visualizeItemBounds) {
    layers.push(
      new GeoJsonLayer({
        id: "items",
        data: (filteredItems?.visible as Feature[]) || undefined,
        filled: true,
        getFillColor: (e) =>
          e.id === hoveredItem?.id ? fillColor : transparent,
        getLineColor: lineColor,
        getLineWidth: lineWidth,
        lineWidthUnits: "pixels",
        pickable: true,
        onClick: (e) => setPickedItem(e.object),
        onHover: (e) => setHoveredItem(e.object),
      })
    );
  }
```

Note: The `"value"` layer's `filled` prop on line 115 stays as `filled: !(items || cogHref)` — unchanged, still using the unfiltered `items`.

- [ ] **Step 4: Verify the project compiles**

Run: `yarn tsc -b --noEmit`
Expected: No type errors

- [ ] **Step 5: Commit**

```bash
git add src/components/map.tsx
git commit -m "feat: use viewport-filtered items on the map layer"
```

---

### Task 4: Items notice overlay

**Files:**
- Create: `src/components/items-notice.tsx`
- Modify: `src/components/map.tsx:276`

- [ ] **Step 1: Create the ItemsNotice component**

```tsx
// src/components/items-notice.tsx
import type { FilteredItems } from "@/utils/items";
import { Text } from "@chakra-ui/react";

export default function ItemsNotice({
  filteredItems,
}: {
  filteredItems: FilteredItems | null;
}) {
  if (!filteredItems) return null;
  const { visible, total } = filteredItems;
  if (visible.length >= total) return null;

  return (
    <Text
      position="absolute"
      bottom={4}
      left="50%"
      transform="translateX(-50%)"
      bg="bg/80"
      backdropFilter="blur(4px)"
      px={3}
      py={1}
      borderRadius="md"
      fontSize="xs"
      color="fg.muted"
      zIndex={1}
      whiteSpace="nowrap"
    >
      Showing {visible.length.toLocaleString()} of {total.toLocaleString()}{" "}
      items — zoom in or pan to see more
    </Text>
  );
}
```

- [ ] **Step 2: Add the notice to the map**

In `src/components/map.tsx`, add the import at the top:

```ts
import ItemsNotice from "./items-notice";
```

Then wrap the return statement (starting at line 276) in a container div and add the notice. Replace the existing return with:

```tsx
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MaplibreMap
        id="map"
        ref={mapRef}
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 1,
        }}
        projection={projection}
        mapStyle={`https://basemaps.cartocdn.com/gl/${mapStyle}/style.json`}
        style={{ zIndex: 0 }}
        onLoad={() => setIsLoaded(true)}
        onMoveEnd={() => {
          const bbox = mapRef?.current
            ?.getBounds()
            .toArray()
            .flatMap((a) => a);
          const sanitizedBbox = bbox && sanitizeBbox(bbox);
          if (sanitizedBbox) setBbox(sanitizedBbox);
          const zoom = mapRef?.current?.getZoom();
          if (zoom !== undefined) setZoom(zoom);
        }}
      >
        {webMapLink && webMapLink.rel === "tilejson" && (
          <Source
            key={webMapLink.href}
            id="web-map-link-tilejson"
            type="raster"
            url={webMapLink.href}
          >
            <MaplibreLayer id="web-map-link-layer-tilejson" type="raster" />
          </Source>
        )}
        {webMapLink && webMapLink.rel === "wmts" && wmtsTileUrl && (
          <Source
            key={wmtsTileUrl}
            id="web-map-link-wmts"
            type="raster"
            tiles={[wmtsTileUrl]}
            tileSize={256}
          >
            <MaplibreLayer id="web-map-link-layer-wmts" type="raster" />
          </Source>
        )}
        <DeckGLOverlay
          layers={layers}
          getCursor={(props) => getCursor(mapRef, props)}
        ></DeckGLOverlay>
      </MaplibreMap>
      {visualizeItemBounds && <ItemsNotice filteredItems={filteredItems} />}
    </div>
  );
```

- [ ] **Step 3: Verify the project compiles and the layout is not broken**

Run: `yarn tsc -b --noEmit`
Expected: No type errors

Then run `yarn dev` and verify the map still fills its container correctly — the wrapper `<div>` with `position: relative; width: 100%; height: 100%` should preserve the existing layout.

- [ ] **Step 4: Commit**

```bash
git add src/components/items-notice.tsx src/components/map.tsx
git commit -m "feat: show notice when map items are thinned at low zoom"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run all tests**

Run: `yarn test`
Expected: All tests pass (existing + new)

- [ ] **Step 2: Run lint**

Run: `yarn lint`
Expected: No lint errors

- [ ] **Step 3: Run type check + build**

Run: `yarn build`
Expected: Build succeeds

- [ ] **Step 4: Manual smoke test**

Run: `yarn dev`
Verify:
1. Load a collection with many items (e.g. 1000+)
2. At low zoom: notice says "Showing 200 of X items — zoom in or pan to see more"
3. Zooming in: more items appear, notice updates
4. At high zoom: all viewport items shown, notice disappears
5. Sidebar items list still shows full count (not filtered)
6. Search progress bar still shows full count
7. Download buttons export all items (not just visible)
8. Panning away from items does NOT cause the value layer to become filled (no visual flicker)
