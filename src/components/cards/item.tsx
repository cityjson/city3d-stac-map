import { useStore } from "@/store";
import type { StacItem } from "stac-ts";
import ValueCard from "./value";

export default function ItemCard({ item }: { item: StacItem }) {
  const hoveredItem = useStore((store) => store.hoveredItem);
  const setHoveredItem = useStore((store) => store.setHoveredItem);
  const setPickedItem = useStore((store) => store.setPickedItem);
  const numberOfAssets = Object.keys(item.assets).length;

  return (
    <ValueCard
      value={item}
      isHovered={item.id === hoveredItem?.id}
      onMouseEnter={() => setHoveredItem(item)}
      onMouseLeave={() => {
        if (hoveredItem?.id === item.id) setHoveredItem(null);
      }}
      onClick={() => setPickedItem(item)}
      footer={numberOfAssets + " asset" + (numberOfAssets !== 1 && "s")}
    />
  );
}
