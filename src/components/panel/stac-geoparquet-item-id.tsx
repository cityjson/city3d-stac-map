import { HStack, SkeletonText, Spinner } from "@chakra-ui/react";
import { AsyncDuckDBConnection } from "@duckdb/duckdb-wasm";
import { useEffect, useMemo } from "react";
import { LuBird } from "react-icons/lu";
import type { StacItem } from "stac-ts";
import { useStacGeoparquetItem } from "../../hooks/stac";
import { useStore } from "../../store";
import { makeHrefsAbsolute } from "../../utils/stac";
import { ErrorAlert } from "../ui/error-alert";
import { BasePanel } from "./base";

export default function StacGeoparquetItemIdPanel({ id }: { id: string }) {
  return (
    <BasePanel
      header={
        <HStack>
          <Spinner size={"sm"} />
          <LuBird />
          Loading {id} with DuckDB...
        </HStack>
      }
    >
      <Body id={id} />
    </BasePanel>
  );
}

function Body({ id }: { id: string }) {
  const stacGeoparquetHref = useStore((store) => store.stacGeoparquetHref);
  const href = useStore((store) => store.href);
  const parquetHref = stacGeoparquetHref || href;
  const connection = useStore((store) => store.connection);

  return (
    <>
      <SkeletonText />
      {parquetHref && connection && (
        <Loader
          id={id}
          href={parquetHref}
          collectionHref={href}
          connection={connection}
        />
      )}
    </>
  );
}

function Loader({
  id,
  href,
  collectionHref,
  connection,
}: {
  id: string;
  href: string;
  collectionHref: string | null;
  connection: AsyncDuckDBConnection;
}) {
  const setPickedItem = useStore((store) => store.setPickedItem);
  const hivePartitioning = useStore((store) => store.hivePartitioning);
  const result = useStacGeoparquetItem({
    id,
    href,
    connection,
    hivePartitioning,
  });

  const resolvedItem = useMemo(() => {
    if (!result.data) return null;
    const item = makeHrefsAbsolute(result.data, href);
    // For collection-mirror parquet, item links are relative to the item's
    // original location (e.g. items/foo.json), not the parquet file.
    // Fix collection/parent links to point to the known collection URL.
    if (collectionHref) {
      fixRelLink(item, "collection", collectionHref);
      fixRelLink(item, "parent", collectionHref);
    }
    return item;
  }, [result.data, href, collectionHref]);

  useEffect(() => {
    setPickedItem(resolvedItem);
  }, [resolvedItem, setPickedItem]);

  if (result.error)
    return (
      <ErrorAlert
        title="Error while fetching stac-geoparquet item"
        error={result.error}
      />
    );
}

function fixRelLink(item: StacItem, rel: string, href: string) {
  const link = item.links?.find((l) => l.rel === rel);
  if (link) link.href = href;
}
