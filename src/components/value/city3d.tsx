import type { AttributeDefinition, City3DProperties } from "@/types/stac";
import { flattenSummaryValues } from "@/utils/city3d-filter";
import {
  Badge,
  Box,
  HStack,
  Link,
  Separator,
  Span,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import {
  LuBox,
  LuBuilding,
  LuBuilding2,
  LuFileJson,
  LuGlobe,
  LuLayers,
  LuMap,
  LuPackage,
  LuPalette,
  LuScanLine,
  LuTag,
  LuText,
  LuTreeDeciduous,
  LuWaves,
} from "react-icons/lu";
import { Section } from "../section";

interface City3DProps {
  properties?: Record<string, unknown>;
  summaries?: Record<string, unknown>;
  assets?: Record<string, Record<string, unknown>>;
}

// Color scheme for city object type categories
const CATEGORY_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Buildings: {
    bg: "rgba(245, 158, 11, 0.15)",
    color: "#F59E0B",
    border: "rgba(245, 158, 11, 0.3)",
  },
  Infrastructure: {
    bg: "rgba(167, 139, 250, 0.15)",
    color: "#A78BFA",
    border: "rgba(167, 139, 250, 0.3)",
  },
  Water: {
    bg: "rgba(56, 189, 248, 0.15)",
    color: "#38BDF8",
    border: "rgba(56, 189, 248, 0.3)",
  },
  Vegetation: {
    bg: "rgba(52, 211, 153, 0.15)",
    color: "#34D399",
    border: "rgba(52, 211, 153, 0.3)",
  },
  Terrain: {
    bg: "rgba(217, 119, 6, 0.15)",
    color: "#D97706",
    border: "rgba(217, 119, 6, 0.3)",
  },
  Other: {
    bg: "rgba(148, 163, 184, 0.15)",
    color: "#94A3B8",
    border: "rgba(148, 163, 184, 0.3)",
  },
};

// Map each city object type to its category
const TYPE_TO_CATEGORY: Record<string, string> = {
  Building: "Buildings",
  BuildingPart: "Buildings",
  BuildingInstallation: "Buildings",
  BuildingStorey: "Buildings",
  BuildingRoom: "Buildings",
  Bridge: "Infrastructure",
  BridgePart: "Infrastructure",
  Road: "Infrastructure",
  Railway: "Infrastructure",
  Tunnel: "Infrastructure",
  TunnelPart: "Infrastructure",
  TransportSquare: "Infrastructure",
  WaterBody: "Water",
  WaterSurface: "Water",
  PlantCover: "Vegetation",
  SolitaryVegetationObject: "Vegetation",
  TINRelief: "Terrain",
  LandUse: "Terrain",
  CityFurniture: "Other",
  CityObjectGroup: "Other",
  GenericCityObject: "Other",
};

// Icon mapping for different city object types
const CITY_OBJECT_ICONS: Record<string, React.ReactElement> = {
  Building: <LuBuilding />,
  BuildingPart: <LuBuilding2 />,
  BuildingInstallation: <LuBuilding />,
  BuildingStorey: <LuLayers />,
  BuildingRoom: <LuMap />,
  Bridge: <LuMap />,
  BridgePart: <LuMap />,
  Road: <LuMap />,
  Railway: <LuMap />,
  Tunnel: <LuMap />,
  TunnelPart: <LuMap />,
  WaterBody: <LuWaves />,
  WaterSurface: <LuWaves />,
  PlantCover: <LuTreeDeciduous />,
  SolitaryVegetationObject: <LuTreeDeciduous />,
  TINRelief: <LuScanLine />,
  LandUse: <LuMap />,
  CityFurniture: <LuPackage />,
  CityObjectGroup: <LuLayers />,
  GenericCityObject: <LuBox />,
  TransportSquare: <LuMap />,
};

// Media type to icon and label mapping
const MEDIA_TYPE_INFO: Record<
  string,
  { icon: React.ReactElement; label: string }
> = {
  "application/json": { icon: <LuFileJson />, label: "CityJSON" },
  "application/json+cityjson": { icon: <LuFileJson />, label: "CityJSON" },
  "application/cityjson": { icon: <LuFileJson />, label: "CityJSON" },
  "application/gml+xml": { icon: <LuFileJson />, label: "CityGML" },
  "application/citygml+xml": { icon: <LuFileJson />, label: "CityGML" },
  "application/x-cityjson-seq": { icon: <LuFileJson />, label: "CityJSONSeq" },
  "application/x-flatcitybuf": { icon: <LuBox />, label: "FlatCityBuf" },
  "model/obj": { icon: <LuBox />, label: "OBJ" },
  "application/vnd.citygml+xml": { icon: <LuFileJson />, label: "CityGML" },
};

export default function City3D({ properties, summaries, assets }: City3DProps) {
  const source = summaries || properties || {};
  const isCollection = !!summaries;

  const baseCity3dProps = isCollection
    ? extractCity3DSummaries(source)
    : extractCity3DProperties(source);
  const city3dProps = mergeCity3DProperties(
    baseCity3dProps,
    extractCity3DAssetProperties(assets)
  );

  const hasCity3DData =
    city3dProps.version ||
    city3dProps.cityObjects ||
    city3dProps.lods?.length ||
    city3dProps.coTypes?.length ||
    city3dProps.attributes?.length ||
    city3dProps.projCode ||
    city3dProps.mediaType ||
    city3dProps.semanticSurfaces !== undefined ||
    city3dProps.textures !== undefined ||
    city3dProps.materials !== undefined;

  if (!hasCity3DData) {
    return null;
  }

  return (
    <Section title="3D City Model" icon={<LuBuilding3D />} open={true}>
      <Stack gap={4}>
        {/* Metadata row */}
        <HStack flexWrap="wrap" gap={3}>
          {city3dProps.version && (
            <MetadataChip label="Version" value={city3dProps.version} />
          )}
          {city3dProps.projCode && (
            <HStack gap={1.5} fontSize="sm">
              <LuGlobe style={{ color: "#7D8590", flexShrink: 0 }} />
              <Span color="fg.muted">CRS:</Span>
              {typeof city3dProps.projCode === "string" ? (
                <Link
                  href={`https://epsg.io/${city3dProps.projCode.replace("EPSG:", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  fontFamily="mono"
                  fontSize="xs"
                  color="#38BDF8"
                  css={{ "&:hover": { color: "#7DD3FC" } }}
                >
                  {city3dProps.projCode}
                </Link>
              ) : (
                <Span fontFamily="mono" fontSize="xs">
                  {(city3dProps.projCode as unknown as string[]).join(", ")}
                </Span>
              )}
            </HStack>
          )}
          {city3dProps.mediaType && (
            <HStack gap={1.5} fontSize="sm">
              {MEDIA_TYPE_INFO[city3dProps.mediaType]?.icon || <LuFileJson />}
              <Span color="fg.muted">Format:</Span>
              <Span fontWeight="medium">
                {MEDIA_TYPE_INFO[city3dProps.mediaType]?.label ||
                  city3dProps.mediaType}
              </Span>
            </HStack>
          )}
        </HStack>

        {/* City Objects count */}
        {city3dProps.cityObjects !== undefined && (
          <HStack gap={1.5} fontSize="sm">
            <LuTag style={{ color: "#7D8590", flexShrink: 0 }} />
            <Span color="fg.muted">City Objects:</Span>
            {typeof city3dProps.cityObjects === "number" ? (
              <Span fontWeight="semibold" fontFamily="mono">
                {city3dProps.cityObjects.toLocaleString()}
              </Span>
            ) : (
              <CityObjectsStats stats={city3dProps.cityObjects} />
            )}
          </HStack>
        )}

        {/* Levels of Detail */}
        {city3dProps.lods && city3dProps.lods.length > 0 && (
          <Box>
            <Text
              color="fg.muted"
              fontSize="xs"
              fontWeight="medium"
              mb={2}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Levels of Detail
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              {city3dProps.lods.map((lod) => (
                <Badge
                  key={lod}
                  size="sm"
                  display="flex"
                  alignItems="center"
                  gap={1}
                  css={{
                    background: "rgba(249, 115, 22, 0.12)",
                    color: "#FB923C",
                    borderWidth: "1px",
                    borderColor: "rgba(249, 115, 22, 0.25)",
                    fontFamily: "var(--chakra-fonts-mono)",
                    fontWeight: 500,
                  }}
                >
                  <LuLayers style={{ width: 12, height: 12 }} />
                  LoD {lod}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}

        {/* City Object Types */}
        {city3dProps.coTypes && city3dProps.coTypes.length > 0 && (
          <Box>
            <Text
              color="fg.muted"
              fontSize="xs"
              fontWeight="medium"
              mb={2}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              City Object Types
            </Text>
            <CityObjectTypesList types={city3dProps.coTypes} />
          </Box>
        )}

        {city3dProps.attributes && city3dProps.attributes.length > 0 && (
          <Box>
            <Text
              color="fg.muted"
              fontSize="xs"
              fontWeight="medium"
              mb={2}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              Attributes
            </Text>
            <AttributeTable attributes={city3dProps.attributes} />
          </Box>
        )}

        {/* Appearance Features */}
        {(city3dProps.semanticSurfaces !== undefined ||
          city3dProps.textures !== undefined ||
          city3dProps.materials !== undefined) && (
          <>
            <Separator borderColor="border" />
            <Box>
              <Text
                color="fg.muted"
                fontSize="xs"
                fontWeight="medium"
                mb={2}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Appearance
              </Text>
              <HStack flexWrap="wrap" gap={2}>
                {city3dProps.semanticSurfaces !== undefined && (
                  <FeatureBadge
                    icon={<LuScanLine style={{ width: 12, height: 12 }} />}
                    label="Semantic Surfaces"
                    value={city3dProps.semanticSurfaces}
                  />
                )}
                {city3dProps.textures !== undefined && (
                  <FeatureBadge
                    icon={<LuText style={{ width: 12, height: 12 }} />}
                    label="Textures"
                    value={city3dProps.textures}
                  />
                )}
                {city3dProps.materials !== undefined && (
                  <FeatureBadge
                    icon={<LuPalette style={{ width: 12, height: 12 }} />}
                    label="Materials"
                    value={city3dProps.materials}
                  />
                )}
              </HStack>
            </Box>
          </>
        )}
      </Stack>
    </Section>
  );
}

function LuBuilding3D() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 18v-8l8-4 8 4v8" />
      <path d="M12 6v12" />
      <path d="M4 14h16" />
      <path d="M4 10h16" />
    </svg>
  );
}

function MetadataChip({ label, value }: { label: string; value: string }) {
  return (
    <HStack gap={1.5} fontSize="sm">
      <Span color="fg.muted">{label}:</Span>
      <Span fontFamily="mono" fontSize="xs" fontWeight="medium">
        {value}
      </Span>
    </HStack>
  );
}

function CityObjectsStats({
  stats,
}: {
  stats: { min?: number; max?: number; total?: number };
}) {
  const parts: string[] = [];
  if (stats.min !== undefined) parts.push(`min: ${stats.min.toLocaleString()}`);
  if (stats.max !== undefined) parts.push(`max: ${stats.max.toLocaleString()}`);
  if (stats.total !== undefined)
    parts.push(`total: ${stats.total.toLocaleString()}`);
  return (
    <Span fontSize="xs" fontFamily="mono" fontWeight="medium">
      {parts.join(" / ")}
    </Span>
  );
}

function CityObjectTypesList({ types }: { types: string[] }) {
  const building = types.filter((t) =>
    [
      "Building",
      "BuildingPart",
      "BuildingInstallation",
      "BuildingStorey",
      "BuildingRoom",
    ].includes(t)
  );
  const infrastructure = types.filter((t) =>
    [
      "Bridge",
      "BridgePart",
      "Road",
      "Railway",
      "Tunnel",
      "TunnelPart",
      "TransportSquare",
    ].includes(t)
  );
  const water = types.filter((t) => ["WaterBody", "WaterSurface"].includes(t));
  const vegetation = types.filter((t) =>
    ["PlantCover", "SolitaryVegetationObject"].includes(t)
  );
  const terrain = types.filter((t) => ["TINRelief", "LandUse"].includes(t));
  const other = types.filter(
    (t) =>
      !building.includes(t) &&
      !infrastructure.includes(t) &&
      !water.includes(t) &&
      !vegetation.includes(t) &&
      !terrain.includes(t)
  );

  return (
    <Stack gap={3}>
      {building.length > 0 && (
        <ObjectTypeGroup label="Buildings" types={building} />
      )}
      {infrastructure.length > 0 && (
        <ObjectTypeGroup label="Infrastructure" types={infrastructure} />
      )}
      {water.length > 0 && <ObjectTypeGroup label="Water" types={water} />}
      {vegetation.length > 0 && (
        <ObjectTypeGroup label="Vegetation" types={vegetation} />
      )}
      {terrain.length > 0 && (
        <ObjectTypeGroup label="Terrain" types={terrain} />
      )}
      {other.length > 0 && <ObjectTypeGroup label="Other" types={other} />}
    </Stack>
  );
}

function AttributeTable({ attributes }: { attributes: AttributeDefinition[] }) {
  return (
    <Box maxW="100%" overflowX="auto">
      <Table.Root size="sm" variant="outline" minW="520px">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Type</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {attributes.map((attribute) => (
            <Table.Row key={attribute.name}>
              <Table.Cell fontFamily="mono" fontSize="xs">
                {attribute.name}
                {attribute.required && (
                  <Badge ml={2} size="sm" variant="surface">
                    Required
                  </Badge>
                )}
              </Table.Cell>
              <Table.Cell>
                <TypeBadge type={attribute.type} />
              </Table.Cell>
              <Table.Cell color="fg.muted" fontSize="xs">
                {attribute.description || "-"}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

function TypeBadge({ type }: { type: AttributeDefinition["type"] }) {
  const icon = getAttributeTypeIcon(type);
  return (
    <Badge size="sm" variant="subtle" fontFamily="mono">
      {icon} {type}
    </Badge>
  );
}

function getAttributeTypeIcon(type: AttributeDefinition["type"]) {
  switch (type) {
    case "Number":
      return "#";
    case "Boolean":
      return "?";
    case "Date":
      return "d";
    case "Array":
      return "[]";
    case "Object":
      return "{}";
    case "String":
    default:
      return "T";
  }
}

function ObjectTypeGroup({ label, types }: { label: string; types: string[] }) {
  const colors = CATEGORY_COLORS[label] || CATEGORY_COLORS.Other;
  return (
    <Box>
      <Text
        fontSize="xs"
        mb={1.5}
        fontWeight="medium"
        css={{ color: colors.color }}
      >
        {label}
      </Text>
      <HStack flexWrap="wrap" gap={1.5}>
        {types.map((type) => {
          const category = TYPE_TO_CATEGORY[type] || "Other";
          const catColors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
          return (
            <Badge
              key={type}
              size="sm"
              display="flex"
              alignItems="center"
              gap={1}
              title={type}
              css={{
                background: catColors.bg,
                color: catColors.color,
                borderWidth: "1px",
                borderColor: catColors.border,
                fontWeight: 500,
                fontSize: "0.7rem",
                transition: "all 0.15s",
                "&:hover": {
                  background: catColors.border,
                },
              }}
            >
              {CITY_OBJECT_ICONS[type] || (
                <LuPackage style={{ width: 12, height: 12 }} />
              )}
              <Span>{formatObjectType(type)}</Span>
            </Badge>
          );
        })}
      </HStack>
    </Box>
  );
}

function formatObjectType(type: string): string {
  if (type.startsWith("+")) {
    return type.substring(1);
  }
  return type
    .replace("Building", "Bldg")
    .replace("Installation", "Inst.")
    .replace("Vegetation", "Veg.")
    .replace("Solitary", "Sol.")
    .replace("Surface", "Sfc");
}

function FeatureBadge({
  icon,
  label,
  value,
}: {
  icon: React.ReactElement;
  label: string;
  value: boolean;
}) {
  return (
    <Badge
      size="sm"
      display="flex"
      alignItems="center"
      gap={1}
      css={
        value
          ? {
              background: "rgba(52, 211, 153, 0.12)",
              color: "#34D399",
              borderWidth: "1px",
              borderColor: "rgba(52, 211, 153, 0.25)",
            }
          : {
              background: "rgba(148, 163, 184, 0.08)",
              color: "#64748B",
              borderWidth: "1px",
              borderColor: "rgba(148, 163, 184, 0.15)",
            }
      }
    >
      {icon}
      {label}
    </Badge>
  );
}

function extractCity3DProperties(
  properties: Record<string, unknown>
): City3DProperties {
  return {
    version: properties["city3d:version"] as string | undefined,
    cityObjects: properties["city3d:city_objects"] as
      | number
      | { min?: number; max?: number; total?: number }
      | undefined,
    lods: properties["city3d:lods"] as number[] | undefined,
    coTypes: properties["city3d:co_types"] as string[] | undefined,
    attributes: normalizeAttributes(properties["city3d:attributes"]),
    semanticSurfaces: properties["city3d:semantic_surfaces"] as
      | boolean
      | undefined,
    textures: properties["city3d:textures"] as boolean | undefined,
    materials: properties["city3d:materials"] as boolean | undefined,
    projCode: properties["proj:code"] as string | undefined,
    wkt2: properties["proj:wkt2"] as string | undefined,
    projjson: properties["proj:projjson"] as object | undefined,
    mediaType: properties["city3d:media_type"] as string | undefined,
  };
}

/**
 * Extract City3D properties from STAC Collection summaries.
 * Summaries can have different formats:
 * - Arrays of values: { "city3d:lods": [1, 2, 3] }
 * - Range objects: { "city3d:city_objects": { "minimum": 100, "maximum": 5000 } }
 * - Array of arrays (for multi-value fields): { "city3d:lods": [[1, 2], [2, 3]] }
 */
function extractCity3DSummaries(
  summaries: Record<string, unknown>
): City3DProperties {
  const getArrayValue = <T,>(key: string): T[] | undefined => {
    const values = flattenSummaryValues(summaries[key]);
    return values.length > 0 ? (values as T[]) : undefined;
  };

  const getRangeValue = (
    key: string
  ): { min?: number; max?: number; total?: number } | undefined => {
    const value = summaries[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const range = value as { min?: number; max?: number; total?: number };
      return {
        min: range.min ?? (range as { minimum?: number }).minimum,
        max: range.max ?? (range as { maximum?: number }).maximum,
        total: range.total,
      };
    }
    if (Array.isArray(value) && value.length === 2) {
      return {
        min: value[0] as number,
        max: value[1] as number,
      };
    }
    return undefined;
  };

  const getBooleanArray = (key: string): boolean | undefined => {
    const value = summaries[key];
    if (typeof value === "boolean") return value;
    const values = flattenSummaryValues(value);
    return values.length > 0 ? values.includes(true) : undefined;
  };

  const getSingleValue = <T,>(key: string): T | undefined => {
    const values = flattenSummaryValues(summaries[key]);
    if (values.length > 0) {
      const unique = [...new Set(values)];
      return unique.length === 1 ? (unique[0] as T) : (unique as T);
    }
    return undefined;
  };

  return {
    version: getSingleValue<string>("city3d:version"),
    cityObjects: getRangeValue("city3d:city_objects"),
    lods: getArrayValue<number>("city3d:lods"),
    coTypes: getArrayValue<string>("city3d:co_types"),
    attributes: normalizeAttributes(summaries["city3d:attributes"]),
    semanticSurfaces: getBooleanArray("city3d:semantic_surfaces"),
    textures: getBooleanArray("city3d:textures"),
    materials: getBooleanArray("city3d:materials"),
    projCode: getSingleValue<string>("proj:code"),
    wkt2: summaries["proj:wkt2"] as string | undefined,
    projjson: summaries["proj:projjson"] as object | undefined,
    mediaType: getSingleValue<string>("city3d:media_type"),
  };
}

function extractCity3DAssetProperties(
  assets: Record<string, Record<string, unknown>> | undefined
): City3DProperties {
  if (!assets) return {};
  const attributes = Object.values(assets).flatMap(
    (asset) => normalizeAttributes(asset["city3d:attributes"]) || []
  );
  return {
    attributes: uniqueAttributes(attributes),
  };
}

function mergeCity3DProperties(
  base: City3DProperties,
  additional: City3DProperties
): City3DProperties {
  return {
    ...base,
    attributes: uniqueAttributes([
      ...(base.attributes || []),
      ...(additional.attributes || []),
    ]),
  };
}

function normalizeAttributes(
  value: unknown
): AttributeDefinition[] | undefined {
  const attributes = normalizeAttributeList(value);
  return attributes.length > 0 ? uniqueAttributes(attributes) : undefined;
}

function normalizeAttributeList(value: unknown): AttributeDefinition[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.flatMap(normalizeAttributeList);
  if (!isRecord(value)) return [];

  if (isAttributeLike(value)) return [toAttributeDefinition(value)];

  const names = toArray(value.name);
  const types = toArray(value.type);
  if (names.length > 0 && types.length > 0) {
    return names.map((name, index) =>
      toAttributeDefinition({
        name,
        type: types[index] || types[0],
        description: toArray(value.description)[index],
        required: toArray(value.required)[index],
      })
    );
  }

  if (Array.isArray(value.attributes)) {
    return normalizeAttributeList(value.attributes);
  }

  return Object.entries(value).flatMap(([name, definition]) => {
    if (isRecord(definition)) {
      return toAttributeDefinition({ name, ...definition });
    }
    if (typeof definition === "string") {
      return toAttributeDefinition({ name, type: definition });
    }
    return [];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isAttributeLike(value: Record<string, unknown>) {
  return typeof value.name === "string" && typeof value.type === "string";
}

function toAttributeDefinition(
  value: Record<string, unknown>
): AttributeDefinition {
  return {
    name: String(value.name),
    type: String(value.type || "String") as AttributeDefinition["type"],
    description:
      typeof value.description === "string" ? value.description : undefined,
    required: typeof value.required === "boolean" ? value.required : undefined,
  };
}

function toArray(value: unknown): unknown[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function uniqueAttributes(attributes: AttributeDefinition[]) {
  const seen = new Set<string>();
  return attributes.filter((attribute) => {
    const key = `${attribute.name}:${attribute.type}:${attribute.description || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
