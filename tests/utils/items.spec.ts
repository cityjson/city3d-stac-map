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

  test("applies conservative cap when zoom is null (initial load)", () => {
    const items = makeManyItems(1000);
    const result = filterVisibleItems(items, viewport, null);
    expect(result!.visible.length).toBeLessThanOrEqual(200);
    expect(result!.total).toBe(1000);
  });

  test("does not thin when below max threshold", () => {
    const items = makeManyItems(150);
    const result = filterVisibleItems(items, viewport, 5);
    expect(result!.visible.length).toBe(150);
  });

  test("applies thinning even without bbox (initial load protection)", () => {
    const items = makeManyItems(1000);
    const result = filterVisibleItems(items, null, null);
    expect(result!.visible.length).toBeLessThanOrEqual(200);
    expect(result!.total).toBe(1000);
  });
});
