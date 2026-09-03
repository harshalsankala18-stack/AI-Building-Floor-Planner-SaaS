/** Projection scene units use metres while the canonical Building always uses millimetres. */
export function millimetersToSceneUnits(millimeters: number): number {
  return millimeters / 1000;
}

export function sceneUnitsToMillimeters(sceneUnits: number): number {
  return sceneUnits * 1000;
}
