/**
 * Barrel export for models.
 */

// ID generation
export { generateId, setIdSeed, resetIdGenerator } from './id';

// Error classes
export {
  DomainError,
  EntityNotFoundError,
  InvalidDimensionError,
  InvalidCoordinateError,
  DeserializationError,
} from './errors';

// Factory functions and param types
export {
  createBuilding,
  createFloor,
  createRoom,
  createWall,
  createDoor,
  createWindow,
  createStair,
  createColumn,
  createSite,
  rectToPolygon,
} from './factory';

export type {
  CreateBuildingParams,
  CreateFloorParams,
  CreateRoomParams,
  CreateWallParams,
  CreateDoorParams,
  CreateWindowParams,
  CreateStairParams,
  CreateColumnParams,
  CreateSiteParams,
} from './factory';

// Immutable updaters
export {
  moveRoom,
  resizeRoom,
  addRoom,
  removeRoom,
  moveDoor,
  addDoor,
  removeDoor,
  updateDoor,
  moveWindow,
  addWindow,
  removeWindow,
  updateWindow,
  addColumn,
  removeColumn,
  updateColumn,
  addStair,
  removeStair,
  updateStair,
  addWall,
  removeWall,
  updateWall,
  deleteEntity,
  updateEntity,
} from './updaters';

// Serialization
export {
  serializeBuilding,
  deserializeBuilding,
  cloneBuilding,
} from './serialization';

// Validation
export {
  validateBuildingSchema,
  validateRoomSchema,
  isValidBuilding,
} from './validation';
export type { ValidationError } from './validation';

// Versioning
export {
  createVersion,
  restoreVersion,
  diffBuildings,
} from './versioning';
export type { BuildingDiff } from './versioning';

// Canonical requirement normalization
export { normalizeDesignRequirementSpecification } from './requirements-normalization';
