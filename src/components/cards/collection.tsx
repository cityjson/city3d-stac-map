import { useStore } from "@/store";
import { getCity3DSummaryArray } from "@/utils/city3d-filter";
import { Badge, HStack, Link, Span, Text, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { LuGlobe, LuLayers } from "react-icons/lu";
import type { StacCollection } from "stac-ts";
import ValueCard from "./value";

export default function CollectionCard({
  collection,
}: {
  collection: StacCollection;
}) {
  const hoveredCollection = useStore((store) => store.hoveredCollection);
  const selectedCollectionId = useStore((store) => store.selectedCollectionId);
  const setHoveredCollection = useStore((store) => store.setHoveredCollection);
  const selectCollection = useStore((store) => store.selectCollection);

  const bbox = collection.extent?.spatial?.bbox?.[0];
  const interval = collection.extent?.temporal?.interval?.[0];

  const formatBbox = (bbox: number[]) => {
    return bbox.map((v) => v.toFixed(2)).join(", ");
  };

  const formatInterval = (interval: (string | null)[]) => {
    const start = interval[0] ? interval[0].split("T")[0] : "..";
    const end = interval[1] ? interval[1].split("T")[0] : "..";
    return `${start} / ${end}`;
  };

  const city3d = useMemo(() => {
    const lods = getCity3DSummaryArray<number>(collection, "city3d:lods");
    const coTypes = getCity3DSummaryArray<string>(
      collection,
      "city3d:co_types"
    );
    const projCode = getCity3DSummaryArray<string>(collection, "proj:code");
    return {
      lods: lods ? [...new Set(lods.map(Number))] : null,
      coTypes: coTypes ? [...new Set(coTypes)] : null,
      projCode: projCode ? [...new Set(projCode)] : null,
    };
  }, [collection]);

  const footer = (
    <VStack align="start" gap={1.5} fontSize="xs" color="fg.muted" width="full">
      {bbox && <Text>Bbox: {formatBbox(bbox)}</Text>}
      {interval && <Text>Temporal: {formatInterval(interval)}</Text>}
      {city3d?.lods && city3d.lods.length > 0 && (
        <HStack flexWrap="wrap" gap={1}>
          <LuLayers style={{ flexShrink: 0, width: 12, height: 12 }} />
          {city3d.lods
            .sort((a, b) => a - b)
            .map((lod) => (
              <Badge
                key={lod}
                size="sm"
                css={{
                  background: "rgba(249, 115, 22, 0.12)",
                  color: "#FB923C",
                  borderWidth: "1px",
                  borderColor: "rgba(249, 115, 22, 0.25)",
                  fontFamily: "var(--chakra-fonts-mono)",
                  fontWeight: 500,
                  fontSize: "0.65rem",
                  px: 1,
                }}
              >
                LoD {lod}
              </Badge>
            ))}
        </HStack>
      )}
      {city3d?.coTypes && city3d.coTypes.length > 0 && (
        <HStack flexWrap="wrap" gap={1}>
          {city3d.coTypes.slice(0, 5).map((type) => (
            <Badge key={type} size="sm" variant="outline" fontSize="0.6rem">
              {type}
            </Badge>
          ))}
          {city3d.coTypes.length > 5 && (
            <Span fontSize="0.6rem" color="fg.subtle">
              +{city3d.coTypes.length - 5}
            </Span>
          )}
        </HStack>
      )}
      {city3d?.projCode && city3d.projCode.length > 0 && (
        <HStack gap={1}>
          <LuGlobe style={{ flexShrink: 0, width: 12, height: 12 }} />
          {city3d.projCode.map((code) => (
            <Link
              key={code}
              href={`https://epsg.io/${code.replace("EPSG:", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              fontFamily="mono"
              fontSize="0.65rem"
              color="#38BDF8"
              onClick={(e) => e.stopPropagation()}
            >
              {code}
            </Link>
          ))}
        </HStack>
      )}
    </VStack>
  );

  return (
    <ValueCard
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
      footer={footer}
      accentColor="59, 130, 246"
    />
  );
}
