/** Product capabilities shared by parsing, planning, and presentation layers. */
export const BUILDING_CAPABILITIES = Object.freeze({
  minimumFloorCount: 1,
  maximumFloorCount: 10,
});

export const SUPPORTED_FLOOR_COUNTS = Object.freeze(
  Array.from(
    { length: BUILDING_CAPABILITIES.maximumFloorCount },
    (_, index) => index + BUILDING_CAPABILITIES.minimumFloorCount,
  ),
);

export function formatBuildingFloorCount(floorCount: number): string {
  return floorCount <= 1 ? 'Ground only' : `G+${floorCount - 1}`;
}
