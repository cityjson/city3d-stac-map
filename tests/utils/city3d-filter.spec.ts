import type { StacCollection } from "stac-ts";
import { describe, expect, test } from "vitest";
import {
  isCollectionMatchingBooleanSummary,
  isCollectionMatchingCoTypes,
  isCollectionMatchingLods,
} from "../../src/utils/city3d-filter";

function makeCollection(summaries?: Record<string, unknown>): StacCollection {
  return {
    type: "Collection",
    stac_version: "1.0.0",
    id: "test",
    description: "Test collection",
    license: "MIT",
    extent: {
      spatial: { bbox: [[-180, -90, 180, 90]] },
      temporal: { interval: [["2020-01-01T00:00:00Z", null]] },
    },
    links: [],
    summaries,
  };
}

describe("City3D collection filters", () => {
  test("include LoD requires a known matching LoD", () => {
    const selected = new Set([3]);

    expect(
      isCollectionMatchingLods(
        makeCollection({ "city3d:lods": [1, 2] }),
        selected,
        "include"
      )
    ).toBe(false);
    expect(
      isCollectionMatchingLods(makeCollection(), selected, "include")
    ).toBe(false);
  });

  test("include LoD 3 matches numeric, string, and nested summaries", () => {
    const selected = new Set([3]);

    expect(
      isCollectionMatchingLods(
        makeCollection({ "city3d:lods": [3] }),
        selected,
        "include"
      )
    ).toBe(true);
    expect(
      isCollectionMatchingLods(
        makeCollection({ "city3d:lods": ["3"] }),
        selected,
        "include"
      )
    ).toBe(true);
    expect(
      isCollectionMatchingLods(
        makeCollection({ "city3d:lods": [[1, 2], [3]] }),
        selected,
        "include"
      )
    ).toBe(true);
  });

  test("include city object type excludes collections with unknown types", () => {
    const selected = new Set(["Bridge"]);

    expect(
      isCollectionMatchingCoTypes(
        makeCollection({ "city3d:co_types": ["Building"] }),
        selected,
        "include"
      )
    ).toBe(false);
    expect(
      isCollectionMatchingCoTypes(makeCollection(), selected, "include")
    ).toBe(false);
  });

  test("include city object type matches known selected type", () => {
    expect(
      isCollectionMatchingCoTypes(
        makeCollection({ "city3d:co_types": [["Building"], ["Bridge"]] }),
        new Set(["Bridge"]),
        "include"
      )
    ).toBe(true);
  });

  test("exclude and any pass collections with missing summaries", () => {
    expect(
      isCollectionMatchingCoTypes(
        makeCollection(),
        new Set(["Bridge"]),
        "exclude"
      )
    ).toBe(true);
    expect(
      isCollectionMatchingBooleanSummary(
        makeCollection(),
        "city3d:textures",
        "any"
      )
    ).toBe(true);
    expect(
      isCollectionMatchingBooleanSummary(
        makeCollection(),
        "city3d:textures",
        "must-not"
      )
    ).toBe(true);
  });

  test("include boolean requires known true summary", () => {
    expect(
      isCollectionMatchingBooleanSummary(
        makeCollection({ "city3d:textures": [false] }),
        "city3d:textures",
        "must"
      )
    ).toBe(false);
    expect(
      isCollectionMatchingBooleanSummary(
        makeCollection({ "city3d:textures": [false, true] }),
        "city3d:textures",
        "must"
      )
    ).toBe(true);
    expect(
      isCollectionMatchingBooleanSummary(
        makeCollection(),
        "city3d:textures",
        "must"
      )
    ).toBe(false);
  });
});
