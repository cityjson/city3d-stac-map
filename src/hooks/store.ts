import { useMemo } from "react";
import { useStore } from "@/store";
import { sanitizeBbox } from "@/utils/bbox";
import { filterVisibleItems } from "@/utils/items";
import { collectionToFeature, getCollectionExtents } from "@/utils/stac";

export function useItems() {
  const staticItems = useStore((store) => store.staticItems);
  const searchedItems = useStore((store) => store.searchedItems);
  const itemSource = useStore((store) => store.itemSource);

  if (itemSource === "static" && staticItems) return staticItems;
  if (itemSource === "searched" && searchedItems)
    return searchedItems.flatMap((items) => items);
  return staticItems || searchedItems?.flatMap((items) => items) || null;
}

export function useCollectionBounds() {
  const collections = useStore((store) => store.collections);
  const filteredCollections = useStore((store) => store.filteredCollections);
  return (filteredCollections || collections)
    ?.filter((collection) => {
      const bbox = sanitizeBbox(getCollectionExtents(collection));
      return bbox && bbox[0] < bbox[2] && bbox[1] < bbox[3];
    })
    .map((collection) => collectionToFeature(collection));
}

export function useVisibleItems() {
  const items = useItems();
  const bbox = useStore((store) => store.bbox);
  const zoom = useStore((store) => store.zoom);

  return useMemo(
    () => filterVisibleItems(items, bbox, zoom),
    [items, bbox, zoom]
  );
}
