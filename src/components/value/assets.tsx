import { usePlanetaryComputerToken } from "@/hooks/planetary-computer";
import { useStore } from "@/store";
import type { AzureBlobStorageContainer } from "@/types/planetary-computer";
import type { AssetWithAlternates } from "@/types/stac";
import {
  parsePlanetaryComputerContainer,
  signPlanetaryComputerHref,
} from "@/utils/planetary-computer";
import {
  getAssetScore,
  getBestAssetFromSortedList,
  sortAssets,
} from "@/utils/stac";
import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Card,
  Clipboard,
  HStack,
  IconButton,
  List,
  Menu,
  Portal,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo } from "react";
import {
  LuChevronDown,
  LuDownload,
  LuEye,
  LuEyeClosed,
  LuEyeOff,
  LuFileImage,
} from "react-icons/lu";
import type { StacAsset } from "stac-ts";
import { Section } from "../section";

interface StacAssets {
  [k: string]: StacAsset;
}

type SortedAssets = [string, StacAsset][];

export default function Assets({ assets }: { assets: StacAssets }) {
  const setAsset = useStore((store) => store.setAsset);
  const sortedAssets = sortAssets(assets);
  const [bestAssetKey, bestAsset] = getBestAssetFromSortedList(sortedAssets);

  useEffect(() => {
    if (bestAssetKey) setAsset(bestAssetKey, bestAsset);
  }, [bestAssetKey, bestAsset, setAsset]);

  return (
    <Section
      icon={<LuFileImage />}
      title="Assets"
      defaultListOrCard={Object.keys(assets).length > 3 ? "list" : "card"}
    >
      {(listOrCard) =>
        listOrCard === "list" ? (
          <AssetsList assets={sortedAssets} />
        ) : (
          <AssetCards assets={sortedAssets} />
        )
      }
    </Section>
  );
}

function AssetsList({ assets }: { assets: SortedAssets }) {
  return (
    <List.Root variant={"plain"}>
      {assets.map(([key, asset]) => (
        <AssetListItem key={key + asset.href} assetKey={key} asset={asset} />
      ))}
    </List.Root>
  );
}

function AssetListItem({
  assetKey,
  asset,
}: {
  assetKey: string;
  asset: StacAsset;
}) {
  const scheme = asset.href.split(":").at(0);
  const fileSize = formatFileSize(getAssetFileSize(asset));
  return (
    <List.Item display={"block"}>
      <HStack>
        <Text truncate>{asset.title || assetKey}</Text>
        {fileSize && <Badge variant="surface">{fileSize}</Badge>}
        {isDataAsset(assetKey, asset) && (
          <Badge colorPalette="blue" variant="surface">
            data
          </Badge>
        )}
        <Span flex={1} />
        <AssetActions assetKey={assetKey} asset={asset} scheme={scheme} />
        <AssetVisibility asset={asset} assetKey={assetKey} />
      </HStack>
    </List.Item>
  );
}

function AssetCards({ assets }: { assets: SortedAssets }) {
  return (
    <Stack>
      {assets.map(([key, asset]) => (
        <AssetCard key={key + asset.href} assetKey={key} asset={asset} />
      ))}
    </Stack>
  );
}

function AssetCard({
  assetKey,
  asset,
}: {
  assetKey: string;
  asset: StacAsset;
}) {
  const scheme = asset.href.split(":").at(0);
  const fileSize = formatFileSize(getAssetFileSize(asset));

  return (
    <Card.Root size={"sm"} variant={"subtle"}>
      <Card.Body gap={4}>
        <Card.Title>{asset.title || assetKey}</Card.Title>
        <Box>
          {scheme && <Badge>{scheme}</Badge>}
          {asset.roles?.map((role) => (
            <Badge key={role}>{role}</Badge>
          ))}
          {asset.type && <Badge>{asset.type}</Badge>}
          {fileSize && <Badge variant="surface">{fileSize}</Badge>}
          {isDataAsset(assetKey, asset) && (
            <Badge colorPalette="blue" variant="surface">
              data
            </Badge>
          )}
        </Box>
      </Card.Body>
      <Card.Footer>
        <AssetActions assetKey={assetKey} asset={asset} scheme={scheme} />
        <Span flex={1} />
        <AssetVisibility assetKey={assetKey} asset={asset} />
      </Card.Footer>
    </Card.Root>
  );
}

function AssetActions({
  assetKey,
  asset,
  scheme,
}: {
  assetKey: string;
  asset: AssetWithAlternates;
  scheme: string | undefined;
}) {
  const alternates = asset.alternate ? Object.entries(asset.alternate) : [];
  const prominentDownload = isDataAsset(assetKey, asset);

  const planetaryComputerContainer = useMemo(() => {
    return parsePlanetaryComputerContainer(asset.href);
  }, [asset.href]);

  return (
    <ButtonGroup size="xs" variant="plain" attached>
      <Clipboard.Root value={asset.href}>
        <Clipboard.Trigger asChild>
          <IconButton>
            <Clipboard.Indicator />
          </IconButton>
        </Clipboard.Trigger>
      </Clipboard.Root>
      {scheme?.startsWith("http") &&
        (planetaryComputerContainer ? (
          <PlanetaryComputerDownload
            container={planetaryComputerContainer}
            href={asset.href}
            prominent={prominentDownload}
          />
        ) : prominentDownload ? (
          <Button asChild colorPalette="blue" variant="solid">
            <a href={asset.href} target="_blank" rel="noopener noreferrer">
              <LuDownload />
              Download data
            </a>
          </Button>
        ) : (
          <IconButton asChild>
            <a href={asset.href} target="_blank" rel="noopener noreferrer">
              <LuDownload />
            </a>
          </IconButton>
        ))}
      {alternates.length > 0 && (
        <Menu.Root>
          <Menu.Trigger asChild>
            <Button size="xs" variant="plain">
              Alternates
              <LuChevronDown />
            </Button>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <Menu.Content>
                {alternates.map(([key, alternate]) => {
                  const altScheme = alternate.href.split(":").at(0);
                  return (
                    <Menu.Item key={key} value={key} asChild>
                      <a
                        href={alternate.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {alternate.title || key}
                        {altScheme && <Badge ml={2}>{altScheme}</Badge>}
                      </a>
                    </Menu.Item>
                  );
                })}
              </Menu.Content>
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
      )}
    </ButtonGroup>
  );
}

function AssetVisibility({
  asset,
  assetKey,
}: {
  asset: StacAsset;
  assetKey: string;
}) {
  const storeAssetKey = useStore((store) => store.assetKey);
  const setAsset = useStore((store) => store.setAsset);
  const isVisible = storeAssetKey === assetKey;
  const score = useMemo(() => {
    return getAssetScore(asset);
  }, [asset]);

  return (
    <IconButton
      size={"xs"}
      variant={"plain"}
      disabled={score === 0}
      onClick={() => {
        if (isVisible) setAsset(null, null);
        else setAsset(assetKey, asset);
      }}
    >
      {score === 0 ? <LuEyeOff /> : isVisible ? <LuEye /> : <LuEyeClosed />}
    </IconButton>
  );
}

function PlanetaryComputerDownload({
  container,
  href,
  prominent = false,
}: {
  container: AzureBlobStorageContainer;
  href: string;
  prominent?: boolean;
}) {
  const { data: token } = usePlanetaryComputerToken({ container });
  const signedHref = token && signPlanetaryComputerHref(href, token);

  return prominent ? (
    <Button asChild disabled={!token} colorPalette="blue" variant="solid">
      <a href={signedHref} target="_blank" rel="noopener noreferrer">
        <LuDownload />
        Download data
      </a>
    </Button>
  ) : (
    <IconButton asChild disabled={!token}>
      <a href={signedHref} target="_blank" rel="noopener noreferrer">
        <LuDownload />
      </a>
    </IconButton>
  );
}

const CITY3D_MEDIA_TYPES = new Set([
  "application/json",
  "application/json+cityjson",
  "application/cityjson",
  "application/gml+xml",
  "application/citygml+xml",
  "application/x-cityjson-seq",
  "application/x-flatcitybuf",
  "application/vnd.citygml+xml",
  "model/obj",
]);

function isDataAsset(assetKey: string, asset: StacAsset) {
  return (
    assetKey === "data" ||
    asset.roles?.includes("data") ||
    (asset.type ? CITY3D_MEDIA_TYPES.has(asset.type) : false)
  );
}

function getAssetFileSize(asset: StacAsset) {
  const size = (asset as Record<string, unknown>)["file:size"];
  return typeof size === "number" ? size : null;
}

function formatFileSize(size: number | null) {
  if (size == null) return null;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  const decimals = value >= 10 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}
