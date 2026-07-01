import type { StacCollection } from "stac-ts";

export const KNOWN_LODS = [0, 1, 1.2, 1.3, 2, 2.2, 2.3, 3] as const;

export const CO_TYPE_GROUPS: Record<string, string[]> = {
  Buildings: [
    "Building",
    "BuildingPart",
    "BuildingInstallation",
    "BuildingStorey",
    "BuildingRoom",
  ],
  Infrastructure: [
    "Bridge",
    "BridgePart",
    "Road",
    "Railway",
    "Tunnel",
    "TunnelPart",
    "TransportSquare",
  ],
  Water: ["WaterBody", "WaterSurface"],
  Vegetation: ["PlantCover", "SolitaryVegetationObject"],
  Terrain: ["TINRelief", "LandUse"],
  Other: ["CityFurniture", "CityObjectGroup", "GenericCityObject"],
};

export type FilterMode = "include" | "exclude";
export type BooleanFilterState = "must" | "must-not" | "any";

export function getCity3DSummaryArray<T>(
  collection: StacCollection,
  key: string
): T[] | null {
  const raw = (collection.summaries as Record<string, unknown> | undefined)?.[
    key
  ];
  const values = flattenSummaryValues(raw);
  return values.length > 0 ? (values as T[]) : null;
}

export function getCity3DSummaryBoolean(
  collection: StacCollection,
  key: string
): boolean | null {
  const raw = (collection.summaries as Record<string, unknown> | undefined)?.[
    key
  ];
  if (typeof raw === "boolean") return raw;
  const values = flattenSummaryValues(raw);
  if (values.length === 0) return null;
  return values.includes(true);
}

export function flattenSummaryValues(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(flattenSummaryValues);
  if (typeof value === "object") {
    const range = value as Record<string, unknown>;
    return [
      range.min,
      range.minimum,
      range.max,
      range.maximum,
      range.total,
    ].filter((v) => v != null);
  }
  return [value];
}

export function isCollectionMatchingLods(
  collection: StacCollection,
  selectedLods: Set<number>,
  mode: FilterMode
): boolean {
  if (selectedLods.size === 0) return true;
  const collectionLods = getCity3DSummaryArray<number>(
    collection,
    "city3d:lods"
  );
  if (collectionLods === null) return mode === "exclude";
  const hasMatch = collectionLods.some((lod) => selectedLods.has(Number(lod)));
  return mode === "include" ? hasMatch : !hasMatch;
}

export function isCollectionMatchingCoTypes(
  collection: StacCollection,
  selectedTypes: Set<string>,
  mode: FilterMode
): boolean {
  if (selectedTypes.size === 0) return true;
  const collectionTypes = getCity3DSummaryArray<string>(
    collection,
    "city3d:co_types"
  );
  if (collectionTypes === null) return mode === "exclude";
  const hasMatch = collectionTypes.some((type) => selectedTypes.has(type));
  return mode === "include" ? hasMatch : !hasMatch;
}

export function isCollectionMatchingBooleanSummary(
  collection: StacCollection,
  key: "city3d:semantic_surfaces" | "city3d:textures" | "city3d:materials",
  state: BooleanFilterState
): boolean {
  if (state === "any") return true;
  const hasTrue = getCity3DSummaryBoolean(collection, key);
  if (hasTrue === null) return state === "must-not";
  return state === "must" ? hasTrue : !hasTrue;
}
