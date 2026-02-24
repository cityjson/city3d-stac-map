import {
  Badge,
  Box,
  HStack,
  Link,
  Separator,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { City3DProperties } from "@/types/stac";
import { Section } from "../section";
import {
  LuBuilding,
  LuBuilding2,
  LuFileJson,
  LuGlobe,
  LuLayers,
  LuMap,
  LuPackage,
  LuPalette,
  LuScanLine,
  LuBox,
  LuTag,
  LuText,
  LuTreeDeciduous,
  LuWaves,
} from "react-icons/lu";

interface City3DProps {
  properties: Record<string, unknown>;
}

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
const MEDIA_TYPE_INFO: Record<string, { icon: React.ReactElement; label: string }> = {
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

export default function City3D({ properties }: City3DProps) {
  const city3dProps = extractCity3DProperties(properties);

  // Only render if we have at least one city3d property or projection info
  const hasCity3DData =
    city3dProps.version ||
    city3dProps.cityObjects ||
    city3dProps.lods?.length ||
    city3dProps.coTypes?.length ||
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
        {city3dProps.version && (
          <HStack>
            <Text color="fg.muted" fontSize="sm" fontWeight="medium">
              Version:
            </Text>
            <Span fontFamily="mono" fontSize="sm">
              {city3dProps.version}
            </Span>
          </HStack>
        )}

        {city3dProps.projCode && (
          <HStack>
            <LuGlobe color="fg.muted" boxSize={4} />
            <Text fontSize="sm">
              <Span color="fg.muted">Projection:</Span>{" "}
              <Link
                href={`https://epsg.io/${city3dProps.projCode.replace(
                  "EPSG:",
                  ""
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {city3dProps.projCode}
              </Link>
            </Text>
          </HStack>
        )}

        {city3dProps.mediaType && (
          <HStack>
            {MEDIA_TYPE_INFO[city3dProps.mediaType]?.icon || <LuFileJson />}
            <Text fontSize="sm">
              <Span color="fg.muted">Format:</Span>{" "}
              {MEDIA_TYPE_INFO[city3dProps.mediaType]?.label ||
                city3dProps.mediaType}
            </Text>
          </HStack>
        )}

        {city3dProps.cityObjects !== undefined && (
          <HStack>
            <LuTag color="fg.muted" boxSize={4} />
            <Text fontSize="sm">
              <Span color="fg.muted">City Objects:</Span>{" "}
              {typeof city3dProps.cityObjects === "number" ? (
                city3dProps.cityObjects.toLocaleString()
              ) : (
                <CityObjectsStats stats={city3dProps.cityObjects} />
              )}
            </Text>
          </HStack>
        )}

        {city3dProps.lods && city3dProps.lods.length > 0 && (
          <Box>
            <Text color="fg.muted" fontSize="sm" fontWeight="medium" mb={2}>
              Levels of Detail:
            </Text>
            <HStack flexWrap="wrap" gap={2}>
              {city3dProps.lods.map((lod) => (
                <Badge
                  key={lod}
                  variant="surface"
                  size="sm"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  <LuLayers boxSize={3} />
                  LoD {lod}
                </Badge>
              ))}
            </HStack>
          </Box>
        )}

        {city3dProps.coTypes && city3dProps.coTypes.length > 0 && (
          <Box>
            <Text color="fg.muted" fontSize="sm" fontWeight="medium" mb={2}>
              City Object Types:
            </Text>
            <CityObjectTypesList types={city3dProps.coTypes} />
          </Box>
        )}

        {(city3dProps.semanticSurfaces !== undefined ||
          city3dProps.textures !== undefined ||
          city3dProps.materials !== undefined) && (
          <>
            <Separator />
            <Box>
              <Text color="fg.muted" fontSize="sm" fontWeight="medium" mb={2}>
                Appearance Features:
              </Text>
              <Stack gap={2}>
                {city3dProps.semanticSurfaces !== undefined && (
                  <FeatureBadge
                    icon={<LuScanLine boxSize={3} />}
                    label="Semantic Surfaces"
                    value={city3dProps.semanticSurfaces}
                  />
                )}
                {city3dProps.textures !== undefined && (
                  <FeatureBadge
                    icon={<LuText boxSize={3} />}
                    label="Textures"
                    value={city3dProps.textures}
                  />
                )}
                {city3dProps.materials !== undefined && (
                  <FeatureBadge
                    icon={<LuPalette boxSize={3} />}
                    label="Materials"
                    value={city3dProps.materials}
                  />
                )}
              </Stack>
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
  return <Span fontSize="xs">{parts.join(", ")}</Span>;
}

function CityObjectTypesList({ types }: { types: string[] }) {
  // Group types by category
  const building = types.filter((t) =>
    ["Building", "BuildingPart", "BuildingInstallation", "BuildingStorey", "BuildingRoom"].includes(t)
  );
  const infrastructure = types.filter((t) =>
    ["Bridge", "BridgePart", "Road", "Railway", "Tunnel", "TunnelPart", "TransportSquare"].includes(t)
  );
  const environment = types.filter((t) =>
    ["WaterBody", "WaterSurface", "PlantCover", "SolitaryVegetationObject", "TINRelief", "LandUse"].includes(t)
  );
  const other = types.filter(
    (t) =>
      !building.includes(t) &&
      !infrastructure.includes(t) &&
      !environment.includes(t)
  );

  return (
    <Stack gap={3}>
      {building.length > 0 && (
        <ObjectTypeGroup label="Buildings" types={building} />
      )}
      {infrastructure.length > 0 && (
        <ObjectTypeGroup label="Infrastructure" types={infrastructure} />
      )}
      {environment.length > 0 && (
        <ObjectTypeGroup label="Environment" types={environment} />
      )}
      {other.length > 0 && <ObjectTypeGroup label="Other" types={other} />}
    </Stack>
  );
}

function ObjectTypeGroup({ label, types }: { label: string; types: string[] }) {
  return (
    <Box>
      <Text fontSize="xs" color="fg.muted" mb={1}>
        {label}
      </Text>
      <HStack flexWrap="wrap" gap={1}>
        {types.map((type) => (
          <Badge
            key={type}
            variant="outline"
            size="sm"
            display="flex"
            alignItems="center"
            gap={1}
            title={type}
          >
            {CITY_OBJECT_ICONS[type] || <LuPackage boxSize={3} />}
            <Span fontSize="xs">{formatObjectType(type)}</Span>
          </Badge>
        ))}
      </HStack>
    </Box>
  );
}

function formatObjectType(type: string): string {
  // Format long type names for display
  if (type.startsWith("+")) {
    return type.substring(1);
  }
  // Remove common prefixes for cleaner display
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
    <HStack>
      <Badge
        variant={value ? "solid" : "outline"}
        colorPalette={value ? "green" : "gray"}
        size="sm"
        display="flex"
        alignItems="center"
        gap={1}
      >
        {icon}
        {label}
      </Badge>
      <Span fontSize="xs" color={value ? "fg.muted" : "fg.subtle"}>
        {value ? "Included" : "Not included"}
      </Span>
    </HStack>
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
    attributes: properties["city3d:attributes"] as
      | Array<{
          name: string;
          type: string;
          description?: string;
          required?: boolean;
        }>
      | undefined,
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
