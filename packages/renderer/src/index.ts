/**
 * @ai-floor-planner/renderer
 *
 * SVG rendering engine for Building Model visualization.
 */

export { worldToScreen, screenToWorld, fitToView, scaleToScreen } from './coordinate-transform';
export { renderFloor, renderBuilding, exportSVG } from './svg-renderer';

// Render configuration
export {
  DEFAULT_RENDER_CONFIG,
  mergeConfig,
  resolveConfig,
  formatLength,
  formatArea,
} from './render-config';

// Intelligent Annotation Engine — Phase 2.4
export {
  AnnotationEngine,
  getAbbreviation,
  ROOM_ABBREVIATIONS,
} from './annotation-engine';
export type {
  BoundingBox,
  RoomLabelPlacement,
} from './annotation-engine';

export type {
  RenderConfig,
  DisplayUnit,
  WallStyle,
  RoomStyle,
  DoorStyle,
  WindowStyle,
  ColumnStyle,
  DimensionStyle,
  TextStyle,
  GridStyle,
  DeepPartial,
} from './render-config';
