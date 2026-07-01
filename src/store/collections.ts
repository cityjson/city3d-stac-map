import { getSelfHref } from "@/utils/stac";
import type { StacCollection } from "stac-ts";
import type { StateCreator } from "zustand";
import type { State } from ".";

export interface CollectionsState {
  collections: StacCollection[] | null;
  setCollections: (collections: StacCollection[] | null) => void;
  addCollection: (collection: StacCollection) => void;
  hoveredCollection: StacCollection | null;
  setHoveredCollection: (collection: StacCollection | null) => void;
  filteredCollections: StacCollection[] | null;
  setFilteredCollections: (collections: StacCollection[] | null) => void;
  collectionFreeTextSearch: string | null;
  setCollectionFreeTextSearch: (q: string | null) => void;
  selectedCollectionId: string | null;
  selectedCollectionHref: string | null;
  selectCollection: (collection: StacCollection) => void;
  selectCollectionFromId: (id: string) => void;
  clearSelectedCollection: () => void;
  setHoveredCollectionFromId: (id: string) => void;
  visualizeCollections: boolean;
  setVisualizeCollections: (visualize: boolean) => void;
}

export const createCollectionsSlice: StateCreator<
  State,
  [],
  [],
  CollectionsState
> = (set, get) => ({
  collections: null,
  setCollections: (collections) =>
    set({ collections, filteredCollections: null }),
  addCollection: (collection) => {
    const collections = get().collections;
    if (!collections?.find((c) => c.id == collection.id))
      set({ collections: [...(collections || []), collection] });
  },
  hoveredCollection: null,
  setHoveredCollection: (collection) => set({ hoveredCollection: collection }),
  filteredCollections: null,
  setFilteredCollections: (collections) => {
    set({ filteredCollections: collections });
    const hoveredCollection = get().hoveredCollection;
    if (
      hoveredCollection &&
      !collections?.find((collection) => collection.id === hoveredCollection.id)
    )
      get().setHoveredCollection(null);
  },
  collectionFreeTextSearch: null,
  setCollectionFreeTextSearch: (q) => set({ collectionFreeTextSearch: q }),
  selectedCollectionId: null,
  selectedCollectionHref: null,
  selectCollection: (collection) => {
    const href = getSelfHref(collection);
    if (href)
      set({
        selectedCollectionId: collection.id,
        selectedCollectionHref: href,
        pickedItem: null,
        staticItems: null,
        searchedItems: null,
        stacGeoparquetTable: null,
        stacGeoparquetHref: null,
        stacGeoparquetItemId: null,
      });
  },
  selectCollectionFromId: (id: string) => {
    const collection = get().collections?.find((c) => c.id === id);
    if (collection) get().selectCollection(collection);
  },
  clearSelectedCollection: () =>
    set({
      selectedCollectionId: null,
      selectedCollectionHref: null,
      staticItems: null,
      searchedItems: null,
      stacGeoparquetTable: null,
      stacGeoparquetHref: null,
      stacGeoparquetItemId: null,
    }),
  setHoveredCollectionFromId: (id: string) => {
    const collection = get().collections?.find((c) => c.id === id);
    if (collection) {
      const href = getSelfHref(collection);
      if (href) get().setHoveredCollection(collection);
    }
  },
  visualizeCollections: true,
  setVisualizeCollections: (visualizeCollections) => {
    set({ visualizeCollections });
  },
});
