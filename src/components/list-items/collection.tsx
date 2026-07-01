import { useStore } from "@/store";
import type { StacCollection } from "stac-ts";
import ValueListItem from "./value";

export default function CollectionListItem({
  collection,
}: {
  collection: StacCollection;
}) {
  const hoveredCollection = useStore((store) => store.hoveredCollection);
  const selectedCollectionId = useStore((store) => store.selectedCollectionId);
  const setHoveredCollection = useStore((store) => store.setHoveredCollection);
  const selectCollection = useStore((store) => store.selectCollection);

  return (
    <ValueListItem
      value={collection}
      isHovered={
        collection.id === hoveredCollection?.id ||
        collection.id === selectedCollectionId
      }
      onMouseEnter={() => setHoveredCollection(collection)}
      onMouseLeave={() => {
        if (hoveredCollection?.id === collection.id) setHoveredCollection(null);
      }}
      onClick={() => selectCollection(collection)}
    />
  );
}
