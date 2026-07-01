import { Section } from "@/components/section";
import { useStacJson } from "@/hooks/stac";
import { useItems } from "@/hooks/store";
import { useStore } from "@/store";
import {
  getCollectionDatetimes,
  getLinkHref,
  getStacValueTitle,
} from "@/utils/stac";
import {
  Box,
  Breadcrumb,
  Button,
  CloseButton,
  HStack,
  IconButton,
  Popover,
  Portal,
  SkeletonText,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import {
  LuEye,
  LuEyeClosed,
  LuFilter,
  LuFolderOpen,
  LuFolderPlus,
} from "react-icons/lu";
import type { StacAsset, StacCollection, StacItem } from "stac-ts";
import { StacGeoparquetItemIdLoader } from "../panel/stac-geoparquet-item-id";
import { ErrorAlert } from "../ui/error-alert";
import Assets from "../value/assets";
import Buttons from "../value/buttons";
import City3D from "../value/city3d";
import Description from "../value/description";
import Items from "../value/items";
import Links from "../value/links";
import Properties from "../value/properties";
import RootHref from "../value/root-href";
import StacGeoparquetHref from "../value/stac-geoparquet-href";
import Filter from "./filter";
import CollectionsHref from "./href";
import CollectionList from "./list";
import Search from "./search";

export default function Collections({
  href,
  showSearch,
  collections,
}: {
  href: string | undefined;
  showSearch: boolean;
  collections: StacCollection[] | null;
}) {
  const filteredCollections = useStore((store) => store.filteredCollections);
  const setDatetimeBounds = useStore((store) => store.setDatetimeBounds);
  const visualizeCollections = useStore((store) => store.visualizeCollections);
  const setVisualizeCollections = useStore(
    (store) => store.setVisualizeCollections
  );
  const selectedCollectionHref = useStore(
    (store) => store.selectedCollectionHref
  );
  const pickedItem = useStore((store) => store.pickedItem);
  const connection = useStore((store) => store.connection);
  const stacGeoparquetHref = useStore((store) => store.stacGeoparquetHref);
  const stacGeoparquetItemId = useStore(
    (store) => store.stacGeoparquetItemId
  );
  const items = useItems();
  const hasItems = items && items.length > 0;
  const [filterOpen, setFilterOpen] = useState(false);
  const stacGeoparquetCollectionHref = useMemo(() => {
    return (
      selectedCollectionHref ||
      (pickedItem
        ? getLinkHref(pickedItem, "collection") ||
          getLinkHref(pickedItem, "parent")
        : null) ||
      null
    );
  }, [selectedCollectionHref, pickedItem]);

  const { collectionsToShow, title } = useMemo(() => {
    if (!collections) {
      return { collectionsToShow: null, title: "Collections" };
    }
    return {
      collectionsToShow: filteredCollections || collections,
      title: filteredCollections
        ? `Collections (${filteredCollections.length}/${collections.length})`
        : `Collections (${collections.length})`,
    };
  }, [filteredCollections, collections]);

  useEffect(() => {
    if (!collections) return;
    const bounds = collections.reduce(
      (acc, collection) => {
        const { start, end } = getCollectionDatetimes(collection);
        return {
          start: start
            ? acc.start
              ? Math.min(acc.start, start.getTime())
              : start.getTime()
            : acc.start,
          end: end
            ? acc.end
              ? Math.max(acc.end, end.getTime())
              : end.getTime()
            : acc.end,
        };
      },
      { start: null as number | null, end: null as number | null }
    );
    setDatetimeBounds({
      start: bounds.start ? new Date(bounds.start) : null,
      end: bounds.end ? new Date(bounds.end) : null,
    });
  }, [collections, setDatetimeBounds]);

  const headerAction = hasItems ? (
    <IconButton
      size="2xs"
      variant="ghost"
      aria-label={
        visualizeCollections
          ? "Hide collections on map"
          : "Show collections on map"
      }
      onClick={(e) => {
        e.stopPropagation();
        setVisualizeCollections(!visualizeCollections);
      }}
    >
      {visualizeCollections ? <LuEye /> : <LuEyeClosed />}
    </IconButton>
  ) : undefined;

  return (
    <Section
      icon={<LuFolderPlus />}
      title={title}
      headerAction={collections ? headerAction : undefined}
    >
      {(listOrCard) => (
        <Stack gap={4}>
          {showSearch && <Search />}
          {href && <CollectionsHref href={href} />}
          {pickedItem ? (
            <SelectedItemDetails item={pickedItem} />
          ) : selectedCollectionHref ? (
            <SelectedCollectionDetails href={selectedCollectionHref} />
          ) : null}
          {stacGeoparquetHref && connection && stacGeoparquetItemId && (
            <StacGeoparquetItemIdLoader
              id={stacGeoparquetItemId}
              href={stacGeoparquetHref}
              collectionHref={stacGeoparquetCollectionHref}
              connection={connection}
            />
          )}
          {collections && collectionsToShow && (
            <>
              {collections.length > 1 && (
                <Popover.Root
                  open={filterOpen}
                  onOpenChange={(e) => setFilterOpen(e.open)}
                  closeOnInteractOutside={false}
                  positioning={{ placement: "right-start" }}
                >
                  <Popover.Trigger asChild>
                    <Button variant="outline" size="sm">
                      <LuFilter /> Filter
                    </Button>
                  </Popover.Trigger>
                  <Portal>
                    <Popover.Positioner>
                      <Popover.Content
                        maxH="80vh"
                        overflowY="auto"
                        minW="400px"
                        css={{ opacity: 1 }}
                      >
                        <Popover.Arrow />
                        <Popover.Body>
                          <Filter
                            collections={collections}
                            onClose={() => setFilterOpen(false)}
                          />
                        </Popover.Body>
                      </Popover.Content>
                    </Popover.Positioner>
                  </Portal>
                </Popover.Root>
              )}
              <CollectionList
                collections={collectionsToShow}
                listOrCard={listOrCard}
              />
            </>
          )}
        </Stack>
      )}
    </Section>
  );
}

function SelectedItemDetails({ item }: { item: StacItem }) {
  const clearPickedItem = useStore((store) => store.clearPickedItem);
  const description = item.description as string | undefined;

  return (
    <Box
      borderWidth={1}
      borderColor="border"
      borderRadius="md"
      bg="bg.subtle"
      p={3}
    >
      <HStack mb={3}>
        <Text fontWeight="semibold" flex={1}>
          Selected item
        </Text>
        <CloseButton size="2xs" onClick={() => clearPickedItem()} />
      </HStack>
      <Stack gap={4}>
        {description && <Description description={description} />}
        <Buttons value={item} />
        <City3D
          properties={item.properties}
          assets={item.assets as Record<string, Record<string, unknown>>}
        />
        <Properties properties={item.properties} />
        {item.assets && (
          <Assets assets={item.assets as Record<string, StacAsset>} />
        )}
        {item.links && <Links links={item.links} />}
      </Stack>
    </Box>
  );
}

function SelectedCollectionDetails({ href }: { href: string }) {
  const clearSelectedCollection = useStore(
    (store) => store.clearSelectedCollection
  );
  const connection = useStore((store) => store.connection);
  const items = useItems();
  const result = useStacJson({ href });
  const collection =
    result.data?.type === "Collection" ? (result.data as StacCollection) : null;
  const description = collection?.description as string | undefined;
  const rootHref = collection ? getLinkHref(collection, "root") : undefined;
  const collectionMirrorHref = useMemo(() => {
    if (!collection?.assets) return null;
    for (const asset of Object.values(collection.assets)) {
      if (
        asset.type === "application/vnd.apache.parquet" &&
        asset.roles?.includes("collection-mirror")
      ) {
        return asset.href;
      }
    }
    return null;
  }, [collection]);

  return (
    <Box
      borderWidth={1}
      borderColor="border"
      borderRadius="md"
      bg="bg.subtle"
      p={3}
    >
      <HStack mb={3}>
        <LuFolderOpen />
        <Text fontWeight="semibold" flex={1}>
          Selected collection
        </Text>
        <CloseButton size="2xs" onClick={() => clearSelectedCollection()} />
      </HStack>
      {result.error ? (
        <ErrorAlert title={result.error.name} error={result.error} />
      ) : !collection ? (
        <SkeletonText />
      ) : (
        <Stack gap={4}>
          <SelectedCollectionBreadcrumb
            collection={collection}
            onCatalogClick={clearSelectedCollection}
          />
          {description && <Description description={description} />}
          <Buttons value={collection} />
          <City3D
            summaries={collection.summaries}
            assets={
              collection.assets as
                | Record<string, Record<string, unknown>>
                | undefined
            }
          />
          {collection.assets && (
            <Assets assets={collection.assets as Record<string, StacAsset>} />
          )}
          {collectionMirrorHref && connection && (
            <StacGeoparquetHref
              href={collectionMirrorHref}
              connection={connection}
            />
          )}
          {!collectionMirrorHref && rootHref && (
            <RootHref value={collection} href={rootHref} />
          )}
          {items && items.length > 0 && (
            <Items items={items} value={collection} />
          )}
          {collection.links && <Links links={collection.links} />}
        </Stack>
      )}
    </Box>
  );
}

function SelectedCollectionBreadcrumb({
  collection,
  onCatalogClick,
}: {
  collection: StacCollection;
  onCatalogClick: () => void;
}) {
  const rootHref = getLinkHref(collection, "root");
  const rootResult = useStacJson({ href: rootHref || "", enabled: !!rootHref });
  const catalogTitle = rootResult.data
    ? getStacValueTitle(rootResult.data)
    : "Catalog";

  return (
    <Breadcrumb.Root size="sm">
      <Breadcrumb.List flexWrap="wrap">
        <Breadcrumb.Item>
          <Button
            size="2xs"
            variant="plain"
            onClick={(e) => {
              e.stopPropagation();
              onCatalogClick();
            }}
          >
            {catalogTitle}
          </Button>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
          <Breadcrumb.CurrentLink>
            {getStacValueTitle(collection)}
          </Breadcrumb.CurrentLink>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}
