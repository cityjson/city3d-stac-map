import DatetimeSlider from "@/components/ui/datetime-slider";
import { useStore } from "@/store";
import {
  type BooleanFilterState,
  CO_TYPE_GROUPS,
  type FilterMode,
  KNOWN_LODS,
  isCollectionMatchingBooleanSummary,
  isCollectionMatchingCoTypes,
  isCollectionMatchingLods,
} from "@/utils/city3d-filter";
import { isCollectionInBbox, isCollectionInDatetimes } from "@/utils/stac";
import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  HStack,
  Input,
  InputGroup,
  SegmentGroup,
  Separator,
  Span,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { LuCheck, LuFilter } from "react-icons/lu";
import type { StacCollection } from "stac-ts";

interface City3DFilterState {
  selectedLods: Set<number>;
  lodMode: FilterMode;
  selectedCoTypes: Set<string>;
  coTypeMode: FilterMode;
  semanticSurfaces: BooleanFilterState;
  textures: BooleanFilterState;
  materials: BooleanFilterState;
}

const DEFAULT_CITY3D_FILTER: City3DFilterState = {
  selectedLods: new Set(),
  lodMode: "include",
  selectedCoTypes: new Set(),
  coTypeMode: "include",
  semanticSurfaces: "any",
  textures: "any",
  materials: "any",
};

function isCity3DFilterActive(f: City3DFilterState): boolean {
  return (
    f.selectedLods.size > 0 ||
    f.selectedCoTypes.size > 0 ||
    f.semanticSurfaces !== "any" ||
    f.textures !== "any" ||
    f.materials !== "any"
  );
}

function city3dFiltersEqual(a: City3DFilterState, b: City3DFilterState): boolean {
  return (
    setsEqual(a.selectedLods, b.selectedLods) &&
    a.lodMode === b.lodMode &&
    setsEqual(a.selectedCoTypes, b.selectedCoTypes) &&
    a.coTypeMode === b.coTypeMode &&
    a.semanticSurfaces === b.semanticSurfaces &&
    a.textures === b.textures &&
    a.materials === b.materials
  );
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export default function Filter({
  collections,
}: {
  collections: StacCollection[];
}) {
  const bbox = useStore((store) => store.bbox);
  const zoom = useStore((store) => store.zoom);
  const datetimeFilter = useStore((store) => store.datetimeFilter);
  const datetimeBounds = useStore((store) => store.datetimeBounds);
  const setFilteredCollections = useStore(
    (store) => store.setFilteredCollections
  );
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [includeGlobalCollections, setIncludeGlobalCollections] =
    useState(true);
  const [searchValue, setSearchValue] = useState("");

  // Pending = what the user is editing; Applied = what the filter uses
  const [pending, setPending] = useState<City3DFilterState>(DEFAULT_CITY3D_FILTER);
  const [applied, setApplied] = useState<City3DFilterState>(DEFAULT_CITY3D_FILTER);

  const hasPendingChanges = !city3dFiltersEqual(pending, applied);
  const hasAppliedFilters = isCity3DFilterActive(applied);

  const applyFilters = useCallback(() => {
    setApplied(pending);
  }, [pending]);

  function resetCity3DFilters() {
    setPending(DEFAULT_CITY3D_FILTER);
    setApplied(DEFAULT_CITY3D_FILTER);
  }

  useEffect(() => {
    setFilteredCollections(
      collections?.filter(
        (collection) =>
          matchesFilter(collection, searchValue) &&
          (!bbox ||
            isCollectionInBbox(
              collection,
              bbox,
              includeGlobalCollections,
              zoom
            )) &&
          (!datetimeFilter ||
            isCollectionInDatetimes(
              collection,
              datetimeFilter.start,
              datetimeFilter.end
            )) &&
          isCollectionMatchingLods(
            collection,
            applied.selectedLods,
            applied.lodMode
          ) &&
          isCollectionMatchingCoTypes(
            collection,
            applied.selectedCoTypes,
            applied.coTypeMode
          ) &&
          isCollectionMatchingBooleanSummary(
            collection,
            "city3d:semantic_surfaces",
            applied.semanticSurfaces
          ) &&
          isCollectionMatchingBooleanSummary(
            collection,
            "city3d:textures",
            applied.textures
          ) &&
          isCollectionMatchingBooleanSummary(
            collection,
            "city3d:materials",
            applied.materials
          )
      ) || null
    );
  }, [
    collections,
    setFilteredCollections,
    searchValue,
    bbox,
    zoom,
    datetimeFilter,
    includeGlobalCollections,
    applied,
  ]);

  return (
    <Stack gap={4}>
      <InputGroup
        startElement={<LuFilter />}
        endElement={
          searchValue && (
            <CloseButton
              size={"xs"}
              me="-2"
              onClick={() => {
                setSearchValue("");
                inputRef.current?.focus();
              }}
            />
          )
        }
      >
        <Input
          placeholder="Filter collections by id or title"
          ref={inputRef}
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
        />
      </InputGroup>
      {datetimeBounds?.start && datetimeBounds?.end && (
        <DatetimeSlider start={datetimeBounds.start} end={datetimeBounds.end} />
      )}
      <Checkbox.Root
        onCheckedChange={(e) => setIncludeGlobalCollections(!!e.checked)}
        checked={includeGlobalCollections}
        size={"sm"}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Label>Include global collections</Checkbox.Label>
        <Checkbox.Control />
      </Checkbox.Root>

      <Separator borderColor="border" />

      {/* City3D Filters */}
      <Stack gap={3}>
        <HStack justify="space-between">
          <Text
            fontSize="xs"
            fontWeight="semibold"
            textTransform="uppercase"
            letterSpacing="wider"
            color="fg.muted"
          >
            3D City Model Filters
          </Text>
          {hasAppliedFilters && (
            <Button
              size="2xs"
              variant="ghost"
              onClick={resetCity3DFilters}
              color="fg.muted"
            >
              Reset
            </Button>
          )}
        </HStack>

        <Box maxH="320px" overflowY="auto" pr={1}>
          <Stack gap={4}>
            {/* LoD Filter */}
            <Stack gap={2}>
              <HStack justify="space-between">
                <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                  Levels of Detail
                </Text>
                {pending.selectedLods.size > 0 && (
                  <ModeToggle
                    mode={pending.lodMode}
                    onChange={(lodMode) =>
                      setPending((prev) => ({ ...prev, lodMode }))
                    }
                  />
                )}
              </HStack>
              <HStack flexWrap="wrap" gap={2}>
                {KNOWN_LODS.map((lod) => (
                  <Checkbox.Root
                    key={lod}
                    size="sm"
                    checked={pending.selectedLods.has(lod)}
                    onCheckedChange={() =>
                      setPending((prev) => ({
                        ...prev,
                        selectedLods: toggleSetItem(prev.selectedLods, lod),
                      }))
                    }
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label>
                      <Span fontFamily="mono" fontSize="xs">
                        {lod}
                      </Span>
                    </Checkbox.Label>
                  </Checkbox.Root>
                ))}
              </HStack>
            </Stack>

            <Separator borderColor="border.subtle" />

            {/* City Object Types Filter */}
            <Stack gap={2}>
              <HStack justify="space-between">
                <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                  City Object Types
                </Text>
                {pending.selectedCoTypes.size > 0 && (
                  <ModeToggle
                    mode={pending.coTypeMode}
                    onChange={(coTypeMode) =>
                      setPending((prev) => ({ ...prev, coTypeMode }))
                    }
                  />
                )}
              </HStack>
              <Stack gap={3}>
                {Object.entries(CO_TYPE_GROUPS).map(([group, types]) => (
                  <Stack key={group} gap={1}>
                    <Text fontSize="xs" color="fg.subtle" fontWeight="medium">
                      {group}
                    </Text>
                    <HStack flexWrap="wrap" gap={2}>
                      {types.map((type) => (
                        <Checkbox.Root
                          key={type}
                          size="sm"
                          checked={pending.selectedCoTypes.has(type)}
                          onCheckedChange={() =>
                            setPending((prev) => ({
                              ...prev,
                              selectedCoTypes: toggleSetItem(
                                prev.selectedCoTypes,
                                type
                              ),
                            }))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>
                            <Span fontSize="xs">{type}</Span>
                          </Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </HStack>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Separator borderColor="border.subtle" />

            {/* Boolean Filters */}
            <Stack gap={2}>
              <Text fontSize="xs" color="fg.muted" fontWeight="medium">
                Features
              </Text>
              <TriStateToggle
                label="Semantic Surfaces"
                value={pending.semanticSurfaces}
                onChange={(semanticSurfaces) =>
                  setPending((prev) => ({ ...prev, semanticSurfaces }))
                }
              />
              <TriStateToggle
                label="Textures"
                value={pending.textures}
                onChange={(textures) =>
                  setPending((prev) => ({ ...prev, textures }))
                }
              />
              <TriStateToggle
                label="Materials"
                value={pending.materials}
                onChange={(materials) =>
                  setPending((prev) => ({ ...prev, materials }))
                }
              />
            </Stack>
          </Stack>
        </Box>

        {/* Apply / Applied indicator */}
        <Box
          position="sticky"
          bottom={0}
          bg="bg.panel"
          pt={2}
          pb={1}
          zIndex={1}
        >
          {hasPendingChanges ? (
            <Button
              size="sm"
              colorPalette="orange"
              onClick={applyFilters}
              width="full"
            >
              <LuCheck />
              Apply Filters
            </Button>
          ) : hasAppliedFilters ? (
            <Text
              fontSize="xs"
              color="fg.subtle"
              textAlign="center"
              fontStyle="italic"
            >
              Filters applied
            </Text>
          ) : null}
        </Box>
      </Stack>
    </Stack>
  );
}

function matchesFilter(collection: StacCollection, filter: string) {
  const lowerCaseFilter = filter.toLowerCase();
  return (
    collection.id.toLowerCase().includes(lowerCaseFilter) ||
    collection.title?.toLowerCase().includes(lowerCaseFilter)
  );
}

function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: FilterMode;
  onChange: (mode: FilterMode) => void;
}) {
  return (
    <SegmentGroup.Root
      value={mode}
      onValueChange={(e) => onChange(e.value as FilterMode)}
      size="xs"
    >
      <SegmentGroup.Indicator />
      <SegmentGroup.Item value="include">
        <SegmentGroup.ItemText>Include</SegmentGroup.ItemText>
        <SegmentGroup.ItemHiddenInput />
      </SegmentGroup.Item>
      <SegmentGroup.Item value="exclude">
        <SegmentGroup.ItemText>Exclude</SegmentGroup.ItemText>
        <SegmentGroup.ItemHiddenInput />
      </SegmentGroup.Item>
    </SegmentGroup.Root>
  );
}

function TriStateToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: BooleanFilterState;
  onChange: (value: BooleanFilterState) => void;
}) {
  return (
    <HStack justify="space-between">
      <Text fontSize="xs">{label}</Text>
      <SegmentGroup.Root
        value={value}
        onValueChange={(e) => onChange(e.value as BooleanFilterState)}
        size="xs"
      >
        <SegmentGroup.Indicator />
        <SegmentGroup.Item value="must">
          <SegmentGroup.ItemText>Has</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
        <SegmentGroup.Item value="any">
          <SegmentGroup.ItemText>Any</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
        <SegmentGroup.Item value="must-not">
          <SegmentGroup.ItemText>No</SegmentGroup.ItemText>
          <SegmentGroup.ItemHiddenInput />
        </SegmentGroup.Item>
      </SegmentGroup.Root>
    </HStack>
  );
}
