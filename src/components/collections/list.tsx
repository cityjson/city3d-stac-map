import CollectionCard from "@/components/cards/collection";
import CollectionListItem from "@/components/list-items/collection";
import type { ListOrCard } from "@/components/section";
import { Box, List } from "@chakra-ui/react";
import type { StacCollection } from "stac-ts";

export default function CollectionList({
  collections,
  listOrCard,
}: {
  collections: StacCollection[];
  listOrCard: ListOrCard;
}) {
  if (listOrCard === "list") {
    return (
      <List.Root variant={"plain"}>
        {collections.map((collection) => (
          <CollectionListItem key={collection.id} collection={collection} />
        ))}
      </List.Root>
    );
  }

  return (
    <Box
      display="grid"
      gap={3}
      gridTemplateColumns="repeat(auto-fit, minmax(min(260px, 100%), 1fr))"
      alignItems="stretch"
    >
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </Box>
  );
}
