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

  // Viewport culling: AABB intersection test (skip if bbox not yet available)
  let visible = bbox
    ? items.filter((item) => {
        const b = item.bbox;
        if (!b || b.length < 4) return true;
        return (
          b[0] <= bbox[2] &&
          b[2] >= bbox[0] &&
          b[1] <= bbox[3] &&
          b[3] >= bbox[1]
        );
      })
    : items;

  // Zoom-based thinning: deterministic stride sampling
  // When zoom is null (initial load), use conservative cap to prevent freeze
  const maxItems =
    zoom == null || zoom < ZOOM_LOW
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

  return { visible, total };
}
