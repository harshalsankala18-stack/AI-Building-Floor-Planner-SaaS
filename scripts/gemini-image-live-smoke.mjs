// scripts/src/gemini-image-live-smoke.ts
import fs from "node:fs";
import path from "node:path";

// packages/ai-orchestration/src/providers/base.ts
var BaseAIProvider = class {
};
var AISafetyError = class extends Error {
  constructor(message, rawOutput) {
    super(`[AISafetyError] ${message}`);
    this.rawOutput = rawOutput;
    this.name = "AISafetyError";
  }
};

// packages/core/dist/types/enums.js
var RoomType;
(function(RoomType3) {
  RoomType3["ServiceShaft"] = "service_shaft";
  RoomType3["Bedroom"] = "bedroom";
  RoomType3["Bathroom"] = "bathroom";
  RoomType3["Kitchen"] = "kitchen";
  RoomType3["Living"] = "living";
  RoomType3["Dining"] = "dining";
  RoomType3["Utility"] = "utility";
  RoomType3["Balcony"] = "balcony";
  RoomType3["Staircase"] = "staircase";
  RoomType3["Lift"] = "lift";
  RoomType3["Parking"] = "parking";
  RoomType3["Pooja"] = "pooja";
  RoomType3["Storage"] = "storage";
  RoomType3["Corridor"] = "corridor";
  RoomType3["Foyer"] = "foyer";
  RoomType3["Study"] = "study";
  RoomType3["ServantQuarter"] = "servant_quarter";
  RoomType3["Drawing"] = "drawing";
  RoomType3["FamilyLiving"] = "family_living";
  RoomType3["Terrace"] = "terrace";
  RoomType3["Garden"] = "garden";
  RoomType3["OTS"] = "ots";
  RoomType3["Porch"] = "porch";
  RoomType3["Dressing"] = "dressing";
  RoomType3["Custom"] = "custom";
})(RoomType || (RoomType = {}));
var Direction;
(function(Direction4) {
  Direction4["North"] = "north";
  Direction4["South"] = "south";
  Direction4["East"] = "east";
  Direction4["West"] = "west";
})(Direction || (Direction = {}));
var DaylightLevel;
(function(DaylightLevel3) {
  DaylightLevel3["None"] = "none";
  DaylightLevel3["Low"] = "low";
  DaylightLevel3["Medium"] = "medium";
  DaylightLevel3["High"] = "high";
})(DaylightLevel || (DaylightLevel = {}));
var PrivacyLevel;
(function(PrivacyLevel3) {
  PrivacyLevel3["None"] = "none";
  PrivacyLevel3["Low"] = "low";
  PrivacyLevel3["Medium"] = "medium";
  PrivacyLevel3["High"] = "high";
})(PrivacyLevel || (PrivacyLevel = {}));
var PreferenceLevel;
(function(PreferenceLevel3) {
  PreferenceLevel3["None"] = "none";
  PreferenceLevel3["Low"] = "low";
  PreferenceLevel3["Medium"] = "medium";
  PreferenceLevel3["High"] = "high";
})(PreferenceLevel || (PreferenceLevel = {}));
var AdjacencyStrength;
(function(AdjacencyStrength3) {
  AdjacencyStrength3["Required"] = "required";
  AdjacencyStrength3["Preferred"] = "preferred";
  AdjacencyStrength3["Avoid"] = "avoid";
})(AdjacencyStrength || (AdjacencyStrength = {}));
var WallType;
(function(WallType3) {
  WallType3["External"] = "external";
  WallType3["Internal"] = "internal";
  WallType3["Partition"] = "partition";
})(WallType || (WallType = {}));
var DoorType;
(function(DoorType3) {
  DoorType3["OpenPassage"] = "open_passage";
  DoorType3["Single"] = "single";
  DoorType3["Double"] = "double";
  DoorType3["Sliding"] = "sliding";
  DoorType3["Folding"] = "folding";
})(DoorType || (DoorType = {}));
var SwingDirection;
(function(SwingDirection3) {
  SwingDirection3["Inward"] = "inward";
  SwingDirection3["Outward"] = "outward";
  SwingDirection3["Left"] = "left";
  SwingDirection3["Right"] = "right";
})(SwingDirection || (SwingDirection = {}));
var WindowType;
(function(WindowType3) {
  WindowType3["Fixed"] = "fixed";
  WindowType3["Sliding"] = "sliding";
  WindowType3["Casement"] = "casement";
  WindowType3["Ventilator"] = "ventilator";
})(WindowType || (WindowType = {}));
var StairType;
(function(StairType3) {
  StairType3["Straight"] = "straight";
  StairType3["LShaped"] = "L_shaped";
  StairType3["UShaped"] = "U_shaped";
  StairType3["Spiral"] = "spiral";
})(StairType || (StairType = {}));
var ColumnShape;
(function(ColumnShape3) {
  ColumnShape3["Rectangular"] = "rectangular";
  ColumnShape3["Circular"] = "circular";
})(ColumnShape || (ColumnShape = {}));
var ProjectStatus;
(function(ProjectStatus3) {
  ProjectStatus3["Draft"] = "draft";
  ProjectStatus3["Active"] = "active";
  ProjectStatus3["Completed"] = "completed";
  ProjectStatus3["Archived"] = "archived";
})(ProjectStatus || (ProjectStatus = {}));
var ChangeSource;
(function(ChangeSource3) {
  ChangeSource3["Manual"] = "manual";
  ChangeSource3["AIEdit"] = "ai_edit";
  ChangeSource3["Generation"] = "generation";
})(ChangeSource || (ChangeSource = {}));
var PlotShape;
(function(PlotShape3) {
  PlotShape3["Rectangular"] = "rectangular";
  PlotShape3["LShaped"] = "L_shaped";
  PlotShape3["Irregular"] = "irregular";
})(PlotShape || (PlotShape = {}));
var AITaskType;
(function(AITaskType3) {
  AITaskType3["RequirementExtraction"] = "requirement_extraction";
  AITaskType3["PlanExplanation"] = "plan_explanation";
  AITaskType3["DesignCritique"] = "design_critique";
  AITaskType3["NaturalLanguageEdit"] = "natural_language_edit";
  AITaskType3["RoomNaming"] = "room_naming";
  AITaskType3["VastuAnalysis"] = "vastu_analysis";
  AITaskType3["ImageUnderstanding"] = "image_understanding";
  AITaskType3["ComplexReasoning"] = "complex_reasoning";
})(AITaskType || (AITaskType = {}));

// packages/core/dist/types/rendering.js
var RenderLayer;
(function(RenderLayer3) {
  RenderLayer3["Grid"] = "grid";
  RenderLayer3["Plot"] = "plot";
  RenderLayer3["SiteZones"] = "site_zones";
  RenderLayer3["Floor"] = "floor";
  RenderLayer3["Rooms"] = "rooms";
  RenderLayer3["Walls"] = "walls";
  RenderLayer3["Openings"] = "openings";
  RenderLayer3["Stairs"] = "stairs";
  RenderLayer3["Columns"] = "columns";
  RenderLayer3["Furniture"] = "furniture";
  RenderLayer3["Annotations"] = "annotations";
  RenderLayer3["Selection"] = "selection";
  RenderLayer3["Guides"] = "guides";
})(RenderLayer || (RenderLayer = {}));

// packages/core/dist/types/design-intelligence.js
var FunctionalZone;
(function(FunctionalZone3) {
  FunctionalZone3["Public"] = "public";
  FunctionalZone3["SemiPublic"] = "semi_public";
  FunctionalZone3["Private"] = "private";
  FunctionalZone3["Service"] = "service";
  FunctionalZone3["Circulation"] = "circulation";
  FunctionalZone3["Outdoor"] = "outdoor";
})(FunctionalZone || (FunctionalZone = {}));
var AdjacencyRelationType;
(function(AdjacencyRelationType3) {
  AdjacencyRelationType3["RequiredAdjacency"] = "required_adjacency";
  AdjacencyRelationType3["PreferredAdjacency"] = "preferred_adjacency";
  AdjacencyRelationType3["RequiredSeparation"] = "required_separation";
  AdjacencyRelationType3["PrivacyBoundary"] = "privacy_boundary";
  AdjacencyRelationType3["AccessRequired"] = "access_required";
})(AdjacencyRelationType || (AdjacencyRelationType = {}));
var HumanVerificationStatus;
(function(HumanVerificationStatus3) {
  HumanVerificationStatus3["Unverified"] = "unverified";
  HumanVerificationStatus3["VerifiedArchitect"] = "verified_architect";
  HumanVerificationStatus3["VerifiedStructural"] = "verified_structural";
  HumanVerificationStatus3["ApprovedCanonical"] = "approved_canonical";
  HumanVerificationStatus3["Rejected"] = "rejected";
})(HumanVerificationStatus || (HumanVerificationStatus = {}));

// packages/core/dist/models/id.js
var seed = null;
var counter = 0;
function generateId() {
  if (seed !== null) {
    counter++;
    const hex = (seed * 1e6 + counter).toString(16).padStart(12, "0");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4000-8000-${hex.padStart(12, "0").slice(0, 12)}`;
  }
  return crypto.randomUUID();
}

// packages/core/dist/models/errors.js
var DomainError = class extends Error {
  code;
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "DomainError";
  }
};
var InvalidDimensionError = class extends DomainError {
  constructor(field, value) {
    super(`Invalid dimension for "${field}": ${value}. Must be > 0.`, "INVALID_DIMENSION");
    this.name = "InvalidDimensionError";
  }
};
var InvalidCoordinateError = class extends DomainError {
  constructor(field, value) {
    super(`Invalid coordinate for "${field}": ${value}. Must be finite.`, "INVALID_COORDINATE");
    this.name = "InvalidCoordinateError";
  }
};

// packages/core/dist/constants.js
var DEFAULTS = {
  WALL_THICKNESS_EXTERNAL: 230,
  // mm
  WALL_THICKNESS_INTERNAL: 150,
  // mm
  WALL_THICKNESS_PARTITION: 100,
  // mm
  FLOOR_HEIGHT: 3e3,
  // mm (floor-to-floor)
  DOOR_WIDTH: 900,
  // mm
  DOOR_HEIGHT: 2100,
  // mm
  WINDOW_WIDTH: 1200,
  // mm
  WINDOW_HEIGHT: 1200,
  // mm
  WINDOW_SILL_HEIGHT: 900,
  // mm
  COLUMN_WIDTH: 300,
  // mm
  COLUMN_DEPTH: 300,
  // mm
  RISER_HEIGHT: 175,
  // mm
  TREAD_DEPTH: 250,
  // mm
  STAIR_WIDTH: 1e3
  // mm
};
var TOLERANCES = {
  LINEAR: 1,
  // mm — minimum meaningful distance
  AREA: 1,
  // sq mm — minimum meaningful area
  ANGULAR: 0.01,
  // degrees
  ADJACENCY: 5,
  // mm — gap below this = adjacent
  OVERLAP: 100
  // sq mm — overlap below this = rounding artifact
};
var MINIMUM_ROOM_AREAS = {
  bedroom: 95e5,
  // 9.5 sq m
  bedroom_master: 12e6,
  // 12 sq m
  kitchen: 5e6,
  // 5 sq m
  bathroom: 25e5,
  // 2.5 sq m
  living: 12e6,
  // 12 sq m
  dining: 9e6,
  // 9 sq m
  utility: 3e6,
  // 3 sq m
  dressing: 3e6,
  // 3 sq m
  foyer: 35e5,
  // 3.5 sq m
  porch: 4e6,
  // 4 sq m
  ots: 1e6
  // 1 sq m (Open to Sky shaft)
};
var MINIMUM_DIMENSIONS = {
  bedroom: 2700,
  bedroom_master: 3e3,
  kitchen: 2100,
  bathroom: 1200,
  living: 3e3,
  dining: 2700,
  utility: 1200,
  dressing: 1500,
  foyer: 1500,
  porch: 1800,
  ots: 900,
  corridor: 900,
  staircase: 900
};

// packages/core/dist/models/factory.js
function assertFinite(field, value) {
  if (!Number.isFinite(value)) {
    throw new InvalidCoordinateError(field, value);
  }
}
function assertPositive(field, value) {
  assertFinite(field, value);
  if (value <= 0) {
    throw new InvalidDimensionError(field, value);
  }
}
function rectToPolygon(x, y, width, height) {
  return {
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ]
  };
}
function defaultRoomName(type) {
  const names = {
    [RoomType.ServiceShaft]: "Service Shaft",
    [RoomType.Bedroom]: "Bedroom",
    [RoomType.Bathroom]: "Bathroom",
    [RoomType.Kitchen]: "Kitchen",
    [RoomType.Living]: "Living Room",
    [RoomType.Dining]: "Dining Room",
    [RoomType.Utility]: "Utility",
    [RoomType.Balcony]: "Balcony",
    [RoomType.Staircase]: "Staircase",
    [RoomType.Lift]: "Lift",
    [RoomType.Parking]: "Parking",
    [RoomType.Pooja]: "Pooja Room",
    [RoomType.Storage]: "Storage",
    [RoomType.Corridor]: "Corridor",
    [RoomType.Foyer]: "Foyer",
    [RoomType.Study]: "Study",
    [RoomType.ServantQuarter]: "Servant Quarter",
    [RoomType.Drawing]: "Drawing Room",
    [RoomType.FamilyLiving]: "Family Living",
    [RoomType.Terrace]: "Terrace",
    [RoomType.Garden]: "Garden",
    [RoomType.OTS]: "Open to Sky (OTS)",
    [RoomType.Porch]: "Entrance Porch",
    [RoomType.Dressing]: "Dressing Room",
    [RoomType.Custom]: "Room"
  };
  return names[type];
}
function createSite(params) {
  assertPositive("plotWidth", params.plotWidth);
  assertPositive("plotDepth", params.plotDepth);
  const setbacks = {
    front: params.setbacks?.front ?? 0,
    rear: params.setbacks?.rear ?? 0,
    left: params.setbacks?.left ?? 0,
    right: params.setbacks?.right ?? 0
  };
  const accessPoints = (params.accessPoints ?? []).map((ap) => ({
    ...ap,
    id: generateId()
  }));
  return {
    id: generateId(),
    plotBoundary: rectToPolygon(0, 0, params.plotWidth, params.plotDepth),
    plotWidth: params.plotWidth,
    plotDepth: params.plotDepth,
    plotArea: params.plotWidth * params.plotDepth,
    plotShape: params.plotShape ?? PlotShape.Rectangular,
    orientation: params.orientation ?? 0,
    setbacks,
    accessPoints,
    roadFacing: params.roadFacing ?? Direction.North,
    plannedFloorCount: params.plannedFloorCount,
    roadWidth: params.roadWidth,
    cornerPlot: params.cornerPlot ?? false,
    secondaryRoadFacing: params.secondaryRoadFacing,
    developmentControls: params.developmentControls,
    unitSystem: params.unitSystem ?? "metric",
    siteZones: params.siteZones
  };
}
function createBuilding(params) {
  const site = createSite(params.site);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const buildingId = generateId();
  const floors = (params.floors ?? []).map((fp) => createFloor({ ...fp, buildingId }));
  return {
    id: buildingId,
    projectId: params.projectId,
    name: params.name,
    site,
    floors,
    metadata: {
      projectId: params.metadata?.projectId ?? params.projectId,
      clientName: params.metadata?.clientName,
      description: params.metadata?.description,
      tags: params.metadata?.tags
    },
    version: 1,
    createdAt: now,
    updatedAt: now
  };
}
function createFloor(params) {
  return {
    id: generateId(),
    buildingId: params.buildingId,
    level: params.level,
    name: params.name ?? `Floor ${params.level}`,
    floorHeight: params.floorHeight ?? DEFAULTS.FLOOR_HEIGHT,
    boundary: params.boundary ?? { points: [] },
    rooms: [],
    walls: [],
    doors: [],
    windows: [],
    stairs: [],
    columns: []
  };
}
function createRoom(params) {
  assertFinite("x", params.x);
  assertFinite("y", params.y);
  assertPositive("width", params.width);
  assertPositive("height", params.height);
  const area2 = params.width * params.height;
  const boundary = rectToPolygon(params.x, params.y, params.width, params.height);
  return {
    id: generateId(),
    floorId: params.floorId,
    type: params.type,
    name: params.name ?? defaultRoomName(params.type),
    boundary,
    x: params.x,
    y: params.y,
    width: params.width,
    height: params.height,
    rotation: params.rotation ?? 0,
    area: area2,
    priority: params.priority ?? 5,
    tags: params.tags ?? [],
    adjacencyRequirements: params.adjacencyRequirements ?? [],
    daylightRequirement: params.daylightRequirement ?? DaylightLevel.Medium,
    privacyRequirement: params.privacyRequirement ?? PrivacyLevel.None,
    ventilationRequired: params.ventilationRequired ?? false,
    isFixed: params.isFixed ?? false
  };
}

// packages/core/dist/models/validation.js
var VALID_ROOM_TYPES = new Set(Object.values(RoomType));

// packages/core/dist/models/requirements-normalization.js
var ROOM_TYPES = new Set(Object.values(RoomType));
var DIRECTIONS = new Set(Object.values(Direction));
var PLOT_SHAPES = new Set(Object.values(PlotShape));
var PREFERENCE_LEVELS = new Set(Object.values(PreferenceLevel));

// packages/core/dist/capabilities.js
var BUILDING_CAPABILITIES = Object.freeze({
  minimumFloorCount: 1,
  maximumFloorCount: 10
});
var SUPPORTED_FLOOR_COUNTS = Object.freeze(Array.from({ length: BUILDING_CAPABILITIES.maximumFloorCount }, (_, index) => index + BUILDING_CAPABILITIES.minimumFloorCount));

// packages/core/dist/models/space-catalog.js
var M2 = 1e6;
var R = ["residential", "mixed_use"];
var C = ["commercial", "mixed_use"];
var E = ["educational"];
function definition(id, displayName, categories, group, zone, minimumM2, preferredM2, options = {}) {
  const occupancy = options.occupancy ?? (categories[0] === "educational" ? "educational" : categories[0] === "commercial" ? "commercial" : "residential");
  return {
    id,
    displayName,
    categories,
    group,
    zone,
    occupancy,
    canonicalType: options.canonicalType,
    synonyms: options.synonyms ?? [],
    defaultQuantity: options.quantity ?? 1,
    minimumAreaMm2: minimumM2 * M2,
    preferredAreaMm2: preferredM2 * M2,
    maximumAreaMm2: options.max ? options.max * M2 : void 0,
    defaultPriority: options.priority ?? "preferred",
    defaultFloorPreference: options.floor ?? "any",
    generatorSupport: options.support ?? "program_only",
    tags: options.tags ?? [],
    relationships: options.relationships
  };
}
var residential = [
  definition("primary_bedroom", "Primary Bedroom", R, "private", FunctionalZone.Private, 12, 16, { max: 22, canonicalType: RoomType.Bedroom, support: "supported", priority: "required", floor: "upper_preferred", synonyms: ["master bedroom", "owner bedroom"] }),
  definition("bedroom", "Bedroom", R, "private", FunctionalZone.Private, 9.5, 13, { max: 18, canonicalType: RoomType.Bedroom, support: "supported", quantity: 2, priority: "required", floor: "upper_preferred", synonyms: ["bed room", "kids room"] }),
  definition("guest_bedroom", "Guest Bedroom", R, "private", FunctionalZone.Private, 9.5, 13, { max: 18, canonicalType: RoomType.Bedroom, support: "supported", floor: "ground_preferred", synonyms: ["guest room"] }),
  definition("children_bedroom", "Children Bedroom", R, "private", FunctionalZone.Private, 9.5, 12, { max: 16, canonicalType: RoomType.Bedroom, support: "supported", floor: "upper_preferred", synonyms: ["child room", "kids bedroom"] }),
  definition("study", "Study / Home Office", R, "private", FunctionalZone.Private, 6, 9, { max: 14, canonicalType: RoomType.Study, support: "supported", synonyms: ["office", "home office"] }),
  definition("dressing", "Dressing / Walk-in Closet", R, "private", FunctionalZone.Private, 3, 5, { max: 8, synonyms: ["closet", "wardrobe"] }),
  definition("primary_bathroom", "Primary Bathroom", R, "baths", FunctionalZone.Service, 3, 4.5, { max: 7, canonicalType: RoomType.Bathroom, support: "supported", priority: "required", floor: "upper_preferred", synonyms: ["master bath", "ensuite"] }),
  definition("attached_bathroom", "Attached Bathroom", R, "baths", FunctionalZone.Service, 2.5, 4, { max: 6, canonicalType: RoomType.Bathroom, support: "supported", synonyms: ["ensuite bathroom"] }),
  definition("common_bathroom", "Common Bathroom", R, "baths", FunctionalZone.Service, 2.5, 4, { max: 6, canonicalType: RoomType.Bathroom, support: "supported", priority: "required", synonyms: ["washroom", "toilet"] }),
  definition("powder_room", "Powder Room", R, "baths", FunctionalZone.Service, 1.8, 2.5, { max: 4, canonicalType: RoomType.Bathroom, support: "supported", synonyms: ["guest toilet", "half bath"] }),
  definition("living", "Living Room", R, "living", FunctionalZone.Public, 12, 18, { max: 26, canonicalType: RoomType.Living, support: "supported", priority: "required", floor: "ground_required", synonyms: ["lounge", "drawing room"] }),
  definition("family_lounge", "Family Lounge", R, "living", FunctionalZone.SemiPublic, 10, 15, { max: 22, canonicalType: RoomType.FamilyLiving, support: "program_only", floor: "upper_preferred", synonyms: ["family living"] }),
  definition("dining", "Dining", R, "living", FunctionalZone.SemiPublic, 8, 12, { max: 18, canonicalType: RoomType.Dining, support: "supported", priority: "required", floor: "ground_preferred", relationships: [{ targetDefinitionId: "kitchen", strength: AdjacencyStrength.Preferred, reason: "Short food-service path" }] }),
  definition("breakfast", "Breakfast / Informal Dining", R, "living", FunctionalZone.SemiPublic, 5, 8, { max: 12, synonyms: ["breakfast nook"] }),
  definition("kitchen", "Kitchen", R, "service", FunctionalZone.Service, 5.5, 9, { max: 14, canonicalType: RoomType.Kitchen, support: "supported", priority: "required", floor: "ground_preferred", relationships: [{ targetDefinitionId: "dining", strength: AdjacencyStrength.Preferred, reason: "Short food-service path" }, { targetDefinitionId: "utility", strength: AdjacencyStrength.Preferred, reason: "Connected service workflow" }] }),
  definition("pantry", "Pantry", R, "service", FunctionalZone.Service, 2, 3.5, { max: 6, synonyms: ["food store"] }),
  definition("utility", "Utility", R, "service", FunctionalZone.Service, 3, 5, { max: 8, canonicalType: RoomType.Utility, support: "supported", floor: "ground_preferred" }),
  definition("store", "Store", R, "service", FunctionalZone.Service, 2, 4, { max: 7, canonicalType: RoomType.Storage, support: "program_only", synonyms: ["storage"] }),
  definition("laundry", "Laundry", R, "service", FunctionalZone.Service, 3, 5, { max: 8 }),
  definition("pooja", "Pooja Room", R, "special", FunctionalZone.Private, 2, 3.5, { max: 6, canonicalType: RoomType.Pooja, support: "supported", synonyms: ["prayer room", "puja"] }),
  definition("foyer", "Entrance / Foyer", R, "circulation", FunctionalZone.Public, 3, 5, { max: 9, canonicalType: RoomType.Foyer, support: "program_only", floor: "ground_required", synonyms: ["entry", "entrance"] }),
  definition("corridor", "Hall / Passage", R, "circulation", FunctionalZone.Circulation, 3, 6, { max: 12, canonicalType: RoomType.Corridor, support: "program_only", synonyms: ["hallway"] }),
  definition("staircase", "Staircase", R, "circulation", FunctionalZone.Circulation, 5, 7.5, { max: 12, canonicalType: RoomType.Staircase, support: "supported", priority: "required", floor: "ground_required", synonyms: ["stairs"] }),
  definition("lift", "Lift", R, "circulation", FunctionalZone.Circulation, 4, 5, { max: 7, canonicalType: RoomType.Lift, support: "supported", synonyms: ["elevator"] }),
  definition("balcony", "Balcony", R, "outdoor", FunctionalZone.Outdoor, 3, 5, { max: 9, canonicalType: RoomType.Balcony, support: "supported", floor: "upper_preferred" }),
  definition("terrace", "Terrace", R, "outdoor", FunctionalZone.Outdoor, 8, 14, { max: 30, canonicalType: RoomType.Terrace, support: "program_only", floor: "top_preferred", synonyms: ["roof terrace"] }),
  definition("sit_out", "Sit-out", R, "outdoor", FunctionalZone.Outdoor, 4, 7, { max: 12, synonyms: ["veranda"] }),
  definition("porch", "Porch", R, "outdoor", FunctionalZone.Outdoor, 5, 8, { max: 14, floor: "ground_required" }),
  definition("car_parking", "Car Parking", R, "vehicle", FunctionalZone.Outdoor, 14, 15, { max: 20, canonicalType: RoomType.Parking, support: "supported", priority: "required", floor: "ground_required", synonyms: ["car", "parking bay"] }),
  definition("two_wheeler_parking", "Two-Wheeler Parking", R, "vehicle", FunctionalZone.Outdoor, 3, 5, { max: 8, synonyms: ["bike parking", "scooter parking"] }),
  definition("garage", "Garage", R, "vehicle", FunctionalZone.Outdoor, 16, 20, { max: 28, canonicalType: RoomType.Parking, support: "supported", floor: "ground_required" })
];
var commercial = [
  definition("reception", "Reception", C, "work", FunctionalZone.Public, 8, 14, { occupancy: "commercial", priority: "required", floor: "ground_required", synonyms: ["front desk"] }),
  definition("retail", "Retail Area", C, "work", FunctionalZone.Public, 25, 45, { occupancy: "commercial", floor: "ground_required", synonyms: ["shop", "storefront"] }),
  definition("open_office", "Open Office", C, "work", FunctionalZone.SemiPublic, 30, 55, { occupancy: "commercial", priority: "required", synonyms: ["workstations", "office floor"] }),
  definition("private_cabin", "Private Cabin", C, "work", FunctionalZone.Private, 8, 12, { occupancy: "commercial", quantity: 2, synonyms: ["office cabin"] }),
  definition("manager_cabin", "Manager Cabin", C, "work", FunctionalZone.Private, 10, 15, { occupancy: "commercial" }),
  definition("conference", "Conference Room", C, "work", FunctionalZone.SemiPublic, 15, 24, { occupancy: "commercial", synonyms: ["board room"] }),
  definition("meeting", "Meeting Room", C, "work", FunctionalZone.SemiPublic, 8, 14, { occupancy: "commercial" }),
  definition("waiting", "Waiting Area", C, "living", FunctionalZone.Public, 8, 15, { occupancy: "commercial" }),
  definition("commercial_pantry", "Pantry", C, "service", FunctionalZone.Service, 4, 7, { occupancy: "commercial" }),
  definition("staff_dining", "Staff Dining", C, "service", FunctionalZone.SemiPublic, 12, 20, { occupancy: "commercial" }),
  definition("commercial_storage", "Storage", C, "service", FunctionalZone.Service, 5, 9, { occupancy: "commercial", synonyms: ["store"] }),
  definition("server_room", "Server / IT Room", C, "technical", FunctionalZone.Service, 6, 10, { occupancy: "commercial", synonyms: ["it room"] }),
  definition("electrical_room", "Electrical Room", C, "technical", FunctionalZone.Service, 5, 8, { occupancy: "commercial" }),
  definition("male_toilet", "Male Toilet", [...C, ...E], "baths", FunctionalZone.Service, 6, 10, { occupancy: "shared", priority: "required", synonyms: ["washroom", "men toilet"] }),
  definition("female_toilet", "Female Toilet", [...C, ...E], "baths", FunctionalZone.Service, 6, 10, { occupancy: "shared", priority: "required", synonyms: ["washroom", "women toilet"] }),
  definition("accessible_toilet", "Accessible Toilet", [...C, ...E], "baths", FunctionalZone.Service, 4, 5.5, { occupancy: "shared", priority: "required", synonyms: ["disabled toilet", "wheelchair toilet"] }),
  definition("commercial_lift", "Lift", C, "circulation", FunctionalZone.Circulation, 4, 6, { occupancy: "commercial", priority: "required", floor: "ground_required", synonyms: ["elevator"] }),
  definition("commercial_stair", "Staircase", C, "circulation", FunctionalZone.Circulation, 8, 12, { occupancy: "commercial", priority: "required", floor: "ground_required", synonyms: ["stairs"] }),
  definition("fire_stair", "Fire Stair", C, "circulation", FunctionalZone.Circulation, 8, 12, { occupancy: "commercial", priority: "required" }),
  definition("service_shaft", "Service Shaft", C, "technical", FunctionalZone.Service, 3, 5, { occupancy: "commercial" }),
  definition("commercial_parking", "Parking", C, "vehicle", FunctionalZone.Outdoor, 14, 15, { occupancy: "commercial", quantity: 4, priority: "required", floor: "ground_required", synonyms: ["car parking"] }),
  definition("loading", "Loading / Service Area", C, "vehicle", FunctionalZone.Service, 25, 40, { occupancy: "commercial", floor: "ground_required" })
];
var educational = [
  definition("classroom", "Classroom", E, "learning", FunctionalZone.SemiPublic, 35, 48, { occupancy: "educational", quantity: 4, priority: "required", synonyms: ["class", "teaching room"] }),
  definition("laboratory", "Laboratory", E, "learning", FunctionalZone.SemiPublic, 45, 65, { occupancy: "educational", quantity: 2, synonyms: ["lab", "science lab"] }),
  definition("computer_lab", "Computer Lab", E, "learning", FunctionalZone.SemiPublic, 45, 60, { occupancy: "educational", synonyms: ["computer room"] }),
  definition("library", "Library", E, "learning", FunctionalZone.SemiPublic, 55, 90, { occupancy: "educational", priority: "required" }),
  definition("staff_room", "Staff Room", E, "work", FunctionalZone.Private, 20, 35, { occupancy: "educational" }),
  definition("principal_office", "Principal / Head Office", E, "work", FunctionalZone.Private, 12, 18, { occupancy: "educational", synonyms: ["head office"] }),
  definition("administration", "Administration", E, "work", FunctionalZone.SemiPublic, 20, 35, { occupancy: "educational", priority: "required", synonyms: ["admin"] }),
  definition("education_reception", "Reception", E, "work", FunctionalZone.Public, 10, 16, { occupancy: "educational", floor: "ground_required" }),
  definition("education_meeting", "Meeting Room", E, "work", FunctionalZone.SemiPublic, 10, 16, { occupancy: "educational" }),
  definition("multipurpose", "Multipurpose Room", E, "learning", FunctionalZone.SemiPublic, 60, 100, { occupancy: "educational" }),
  definition("auditorium", "Auditorium", E, "learning", FunctionalZone.Public, 120, 220, { occupancy: "educational", floor: "ground_preferred" }),
  definition("education_store", "Store", E, "service", FunctionalZone.Service, 6, 10, { occupancy: "educational", synonyms: ["storage"] }),
  definition("education_stair", "Staircase", E, "circulation", FunctionalZone.Circulation, 10, 15, { occupancy: "educational", quantity: 2, priority: "required", floor: "ground_required", synonyms: ["stairs"] }),
  definition("education_lift", "Lift", E, "circulation", FunctionalZone.Circulation, 5, 7, { occupancy: "educational", priority: "required", floor: "ground_required", synonyms: ["elevator"] }),
  definition("education_corridor", "Corridor", E, "circulation", FunctionalZone.Circulation, 30, 55, { occupancy: "educational", priority: "required", synonyms: ["passage"] }),
  definition("playground", "Playground / Outdoor Area", E, "outdoor", FunctionalZone.Outdoor, 300, 600, { occupancy: "educational", synonyms: ["outdoor", "play area"] }),
  definition("education_parking", "Parking", E, "vehicle", FunctionalZone.Outdoor, 70, 100, { occupancy: "educational", floor: "ground_required", synonyms: ["car parking"] })
];
var SPACE_CATALOG = Object.freeze([...residential, ...commercial, ...educational]);
var SPACE_PROGRAM_PRESETS = Object.freeze([
  { id: "residential_1bhk", name: "1BHK", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "primary_bedroom" },
    { definitionId: "common_bathroom" },
    { definitionId: "car_parking" }
  ] },
  { id: "residential_2bhk", name: "2BHK", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "primary_bedroom" },
    { definitionId: "bedroom", quantity: 1 },
    { definitionId: "primary_bathroom" },
    { definitionId: "common_bathroom" },
    { definitionId: "utility" },
    { definitionId: "car_parking" },
    { definitionId: "staircase" }
  ] },
  { id: "residential_3bhk", name: "3BHK", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "primary_bedroom" },
    { definitionId: "bedroom", quantity: 2 },
    { definitionId: "primary_bathroom" },
    { definitionId: "common_bathroom", quantity: 2 },
    { definitionId: "utility" },
    { definitionId: "pooja", priority: "preferred" },
    { definitionId: "car_parking" },
    { definitionId: "staircase" },
    { definitionId: "balcony" }
  ] },
  { id: "residential_duplex", name: "Duplex", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "guest_bedroom", floorPreference: { kind: "ground_preferred" } },
    { definitionId: "primary_bedroom", floorPreference: { kind: "upper_preferred" } },
    { definitionId: "bedroom", quantity: 2, floorPreference: { kind: "upper_preferred" } },
    { definitionId: "common_bathroom", quantity: 3 },
    { definitionId: "staircase" },
    { definitionId: "balcony" }
  ] },
  { id: "commercial_small_office", name: "Small Office", category: "commercial", items: [
    { definitionId: "reception" },
    { definitionId: "open_office" },
    { definitionId: "private_cabin", quantity: 2 },
    { definitionId: "meeting" },
    { definitionId: "commercial_pantry" },
    { definitionId: "male_toilet" },
    { definitionId: "female_toilet" },
    { definitionId: "accessible_toilet" },
    { definitionId: "commercial_stair" },
    { definitionId: "commercial_parking", quantity: 2 }
  ] },
  { id: "educational_classroom_wing", name: "Classroom Wing", category: "educational", items: [
    { definitionId: "classroom", quantity: 6 },
    { definitionId: "laboratory", quantity: 2 },
    { definitionId: "library" },
    { definitionId: "staff_room" },
    { definitionId: "administration" },
    { definitionId: "male_toilet" },
    { definitionId: "female_toilet" },
    { definitionId: "accessible_toilet" },
    { definitionId: "education_stair", quantity: 2 },
    { definitionId: "education_lift" }
  ] }
]);

// packages/core/dist/models/space-program.js
var CIRCULATION_RESERVE_RATIO = 0.12;
var VERTICAL_CORE_RESERVE_RATIO = 0.04;
var WALL_SERVICE_RESERVE_RATIO = 0.06;
var TOTAL_RESERVE_RATIO = CIRCULATION_RESERVE_RATIO + VERTICAL_CORE_RESERVE_RATIO + WALL_SERVICE_RESERVE_RATIO;
var DERIVATION_MAP = {
  [RoomType.Living]: "living",
  [RoomType.Dining]: "dining",
  [RoomType.Kitchen]: "kitchen",
  [RoomType.Bedroom]: "bedroom",
  [RoomType.Bathroom]: "common_bathroom",
  [RoomType.Utility]: "utility",
  [RoomType.Pooja]: "pooja",
  [RoomType.Study]: "study",
  [RoomType.Staircase]: "staircase",
  [RoomType.Lift]: "lift",
  [RoomType.Parking]: "car_parking",
  [RoomType.Balcony]: "balcony",
  [RoomType.Storage]: "store",
  [RoomType.Corridor]: "corridor",
  [RoomType.Foyer]: "foyer",
  [RoomType.FamilyLiving]: "family_lounge",
  [RoomType.Terrace]: "terrace"
};

// packages/core/dist/models/footprint.js
var CIRCULATION_RATIO = 0.12;
var CORE_RATIO = 0.04;
var WALL_SERVICE_RATIO = 0.06;
var USABLE_RATIO = 1 - CIRCULATION_RATIO - CORE_RATIO - WALL_SERVICE_RATIO;
var FOOTPRINT_SHAPES = Object.freeze([
  { id: "rectangle", name: "Rectangle", description: "Efficient universal floor plate", recommendedCategories: ["residential", "commercial", "mixed_use"] },
  { id: "l_shape", name: "L Shape", description: "Two wings around an open edge", recommendedCategories: ["residential", "commercial", "educational", "mixed_use"] },
  { id: "u_shape", name: "U Shape", description: "Three-sided court or arrival space", recommendedCategories: ["educational", "commercial"] },
  { id: "t_shape", name: "T Shape", description: "Primary bar with a central wing", recommendedCategories: ["educational", "commercial"] },
  { id: "courtyard", name: "Courtyard", description: "Limited perimeter plate with an access slot; not polygon-hole topology", recommendedCategories: ["residential", "commercial", "educational"], customSupport: "limited" },
  { id: "linear", name: "Linear", description: "Shallow elongated building plate", recommendedCategories: ["commercial", "educational"] },
  { id: "custom", name: "Custom", description: "Preserved existing or imported polygon", recommendedCategories: [], customSupport: "limited" }
]);

// packages/ai-orchestration/src/requirements/schema.ts
var REQUIREMENT_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    schemaVersion: { type: "integer", enum: [1] },
    projectName: { type: "string" },
    plotShape: { type: "string", enum: Object.values(PlotShape) },
    orientationDegrees: { type: "number", minimum: 0, maximum: 359 },
    hard: {
      type: "object",
      additionalProperties: false,
      properties: {
        plotWidthMm: { type: "number", minimum: 3e3, maximum: 2e5 },
        plotDepthMm: { type: "number", minimum: 3e3, maximum: 2e5 },
        roadFacing: { type: "string", enum: Object.values(Direction) },
        floorsCount: {
          type: "integer",
          minimum: BUILDING_CAPABILITIES.minimumFloorCount,
          maximum: BUILDING_CAPABILITIES.maximumFloorCount
        },
        bedroomCount: { type: "integer", minimum: 1, maximum: 20 },
        bathroomCount: { type: "integer", minimum: 1, maximum: 20 },
        kitchenRequired: { type: "boolean" },
        livingRoomRequired: { type: "boolean" },
        diningRoomRequired: { type: "boolean" },
        staircaseRequired: { type: "boolean" },
        parkingRequired: { type: "boolean" },
        parkingSpacesCount: { type: "integer", minimum: 0, maximum: 20 },
        liftRequired: { type: "boolean" },
        customRooms: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: Object.values(RoomType) },
              count: { type: "integer", minimum: 1, maximum: 20 },
              name: { type: "string" }
            },
            required: ["type", "count", "name"]
          }
        }
      },
      required: [
        "plotWidthMm",
        "plotDepthMm",
        "roadFacing",
        "floorsCount",
        "bedroomCount",
        "bathroomCount",
        "kitchenRequired",
        "livingRoomRequired",
        "diningRoomRequired",
        "staircaseRequired",
        "parkingRequired",
        "parkingSpacesCount",
        "liftRequired",
        "customRooms"
      ]
    },
    soft: {
      type: "object",
      additionalProperties: false,
      properties: {
        vastuCompliance: { type: "boolean" },
        naturalLightPreference: { type: "string", enum: Object.values(PreferenceLevel) },
        privacyPreference: { type: "string", enum: Object.values(PreferenceLevel) },
        circulationEfficiency: { type: "string", enum: Object.values(PreferenceLevel) },
        gardenPreference: { type: "boolean" },
        servantQuarter: { type: "boolean" },
        poojaRoom: { type: "boolean" },
        studyRoom: { type: "boolean" },
        balconyPreferred: { type: "boolean" },
        openKitchen: { type: "boolean" },
        attachedBathroomsCount: { type: "integer", minimum: 0, maximum: 20 }
      },
      required: [
        "vastuCompliance",
        "naturalLightPreference",
        "privacyPreference",
        "circulationEfficiency",
        "gardenPreference",
        "servantQuarter",
        "poojaRoom",
        "studyRoom",
        "balconyPreferred",
        "openKitchen",
        "attachedBathroomsCount"
      ]
    }
  },
  required: ["schemaVersion", "projectName", "plotShape", "orientationDegrees", "hard", "soft"]
};

// packages/ai-orchestration/src/providers/http.ts
function asRecord(value) {
  return value !== null && typeof value === "object" ? value : {};
}
function parseJsonContent(content) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Expected an object.");
    }
    return parsed;
  } catch {
    const firstBrace = content.indexOf("{");
    const lastBrace = content.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        const sub = content.slice(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(sub);
        if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
      }
    }
    try {
      const repaired = repairTruncatedJson(cleaned);
      const parsed = JSON.parse(repaired);
      if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
    }
    throw new AISafetyError("Provider returned invalid structured JSON.");
  }
}
function repairTruncatedJson(str2) {
  let trimmed = str2.trim().replace(/,\s*$/, "").replace(/:\s*$/, "");
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
    } else {
      if (ch === '"') inString = true;
      else if (ch === "{") stack.push("{");
      else if (ch === "[") stack.push("[");
      else if (ch === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{") stack.pop();
      } else if (ch === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[") stack.pop();
      }
    }
  }
  if (inString) trimmed += '"';
  trimmed = trimmed.replace(/,\s*$/, "");
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === "{") trimmed += "}";
    else if (top === "[") trimmed += "]";
  }
  return trimmed;
}
function usage(promptTokens, completionTokens, totalTokens) {
  const prompt = typeof promptTokens === "number" ? promptTokens : 0;
  const completion = typeof completionTokens === "number" ? completionTokens : 0;
  return {
    promptTokens: prompt,
    completionTokens: completion,
    totalTokens: typeof totalTokens === "number" ? totalTokens : prompt + completion
  };
}
var HttpProviderError = class extends Error {
  status;
  detail;
  retryAfterMs;
  isTransient;
  constructor(status, message, detail, retryAfterMs) {
    super(message);
    this.name = "HttpProviderError";
    this.status = status;
    this.detail = detail;
    this.retryAfterMs = retryAfterMs;
    this.isTransient = status === 503 || status === 429 || status === 408 || status >= 500 && status < 600;
  }
};
async function postJson(options, headers, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  const startedAt = Date.now();
  try {
    const response3 = await options.fetchImplementation(options.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response3.ok) {
      let detail = "";
      try {
        const errText = await response3.text();
        detail = errText.slice(0, 500);
      } catch {
      }
      let retryAfterMs;
      const retryHeader = response3.headers.get("retry-after");
      if (retryHeader) {
        const parsedSec = Number.parseFloat(retryHeader);
        if (Number.isFinite(parsedSec) && parsedSec > 0) {
          retryAfterMs = Math.round(parsedSec * 1e3);
        } else {
          const parsedDate = Date.parse(retryHeader);
          if (Number.isFinite(parsedDate) && parsedDate > Date.now()) {
            retryAfterMs = parsedDate - Date.now();
          }
        }
      }
      throw new HttpProviderError(
        response3.status,
        `Provider request failed with HTTP ${response3.status}.${detail ? " " + detail : ""}`.trim(),
        detail,
        retryAfterMs
      );
    }
    const parsed = await response3.json();
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new AISafetyError("Provider returned a non-object response envelope.");
    }
    return { body: parsed, latencyMs: Date.now() - startedAt };
  } catch (error) {
    if (error instanceof AISafetyError || error instanceof HttpProviderError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new Error("Provider request timed out.");
    throw error instanceof Error ? error : new Error("Provider request failed.");
  } finally {
    clearTimeout(timeout);
  }
}
function response(content, parsed, responseUsage, model, latencyMs) {
  return { content, ...parsed ? { parsed } : {}, usage: responseUsage, model, latencyMs };
}

// packages/ai-orchestration/src/providers/gemini.ts
var DEFAULT_GEMINI_RETRY_POLICY = {
  maxRetries: 3,
  initialDelayMs: 1e3,
  maxDelayMs: 8e3,
  backoffFactor: 2,
  jitterRatio: 0.2
  // +/- 20% random jitter
};
function extractHttpStatus(error) {
  if (error instanceof HttpProviderError) return error.status;
  if (error instanceof Error) {
    const match = error.message.match(/HTTP (\d{3})/i);
    if (match && match[1]) {
      const code = parseInt(match[1], 10);
      if (!isNaN(code)) return code;
    }
  }
  return null;
}
function isTransientHttpError(status) {
  if (status === null) return false;
  return status === 503 || status === 429 || status === 408 || status >= 500 && status < 600;
}
function isAuthHttpError(status) {
  if (status === null) return false;
  return status === 401 || status === 403;
}
function calculateDelayWithJitter(attempt, policy, retryAfterMs) {
  if (typeof retryAfterMs === "number" && retryAfterMs > 0) {
    return Math.min(policy.maxDelayMs, Math.max(50, Math.round(retryAfterMs)));
  }
  const exponential = policy.initialDelayMs * Math.pow(policy.backoffFactor, Math.max(0, attempt - 1));
  const bounded = Math.min(policy.maxDelayMs, exponential);
  const jitter = bounded * policy.jitterRatio * (Math.random() * 2 - 1);
  return Math.max(50, Math.round(bounded + jitter));
}
var GeminiProvider = class extends BaseAIProvider {
  name = "gemini";
  options;
  endpointBase;
  retryPolicy;
  sleepFn;
  constructor(options) {
    super();
    const model = options.model ?? "gemini-3.6-flash";
    const endpointBase = options.endpointBase ?? "https://generativelanguage.googleapis.com/v1beta/models";
    this.endpointBase = endpointBase;
    this.options = {
      apiKey: options.apiKey,
      model,
      fallbackModel: options.fallbackModel,
      timeoutMs: options.timeoutMs ?? 45e3,
      fetchImplementation: options.fetchImplementation ?? fetch
    };
    this.retryPolicy = {
      ...DEFAULT_GEMINI_RETRY_POLICY,
      ...options.retryPolicy ?? {}
    };
    this.sleepFn = options.sleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }
  async complete(request) {
    if (!this.options.apiKey.trim()) throw new Error("Gemini API key is not configured.");
    const wantsJson = request.responseFormat === "json";
    const extractsRequirements = request.taskType === AITaskType.RequirementExtraction;
    const rawSchema = request.responseSchema ?? (extractsRequirements ? REQUIREMENT_RESPONSE_SCHEMA : void 0);
    const responseSchema = wantsJson && rawSchema ? cleanGeminiSchema(rawSchema) : void 0;
    const parts = buildGeminiParts(request);
    const payload = {
      systemInstruction: { parts: [{ text: request.systemPrompt }] },
      contents: [{ role: "user", parts }],
      generationConfig: {
        ...request.maxTokens ? { maxOutputTokens: request.maxTokens } : {},
        ...wantsJson ? {
          responseMimeType: "application/json",
          ...responseSchema ? { responseSchema } : {}
        } : {}
      }
    };
    const primaryModel = this.options.model;
    const fallbackModel = this.options.fallbackModel && this.options.fallbackModel !== primaryModel ? this.options.fallbackModel : void 0;
    const modelsToExecute = [primaryModel];
    if (fallbackModel) {
      modelsToExecute.push(fallbackModel);
    }
    let lastError;
    for (let mIdx = 0; mIdx < modelsToExecute.length; mIdx++) {
      const currentModel = modelsToExecute[mIdx];
      const isFallback = mIdx > 0;
      let nextDelayMs;
      for (let attempt = 0; attempt <= this.retryPolicy.maxRetries; attempt++) {
        if (attempt > 0) {
          const delayMs = nextDelayMs ?? calculateDelayWithJitter(attempt, this.retryPolicy);
          console.warn(
            `[GeminiProvider] Transient error on model "${currentModel}" (attempt ${attempt}/${this.retryPolicy.maxRetries}). Retrying in ${delayMs}ms with exponential backoff & jitter...`
          );
          await this.sleepFn(delayMs);
          nextDelayMs = void 0;
        }
        try {
          const endpoint = `${this.endpointBase}/${encodeURIComponent(currentModel)}:generateContent`;
          const result = await postJson(
            {
              apiKey: this.options.apiKey,
              model: currentModel,
              endpoint,
              timeoutMs: this.options.timeoutMs,
              fetchImplementation: this.options.fetchImplementation
            },
            { "x-goog-api-key": this.options.apiKey },
            payload
          );
          const content = this.extractOutputText(result.body);
          const parsed = wantsJson ? parseJsonContent(content) : void 0;
          const rawUsage = asRecord(result.body.usageMetadata);
          return response(
            content,
            parsed,
            usage(rawUsage.promptTokenCount, rawUsage.candidatesTokenCount, rawUsage.totalTokenCount),
            currentModel,
            result.latencyMs
          );
        } catch (err) {
          lastError = err;
          const status = extractHttpStatus(err);
          if (isAuthHttpError(status)) {
            throw err;
          }
          if (status === 400 || status === 404) {
            throw err;
          }
          const isTimeout = err instanceof Error && (err.message.includes("timed out") || err.name === "AbortError");
          const isTransient = isTransientHttpError(status);
          const isSafetyOrParseError = err instanceof AISafetyError;
          if (!isTransient && !isTimeout && !isSafetyOrParseError) {
            throw err;
          }
          const retryAfterMs = err instanceof HttpProviderError ? err.retryAfterMs : void 0;
          nextDelayMs = calculateDelayWithJitter(attempt + 1, this.retryPolicy, retryAfterMs);
          if (attempt < this.retryPolicy.maxRetries) {
            continue;
          }
          console.warn(
            `[GeminiProvider] Retries exhausted for model "${currentModel}" on transient error (status ${status ?? "parse/safety"}).`
          );
          break;
        }
      }
      if (fallbackModel && !isFallback) {
        console.warn(
          `[GeminiProvider] Primary model "${primaryModel}" temporarily unavailable (503/transient). Falling back to "${fallbackModel}"...`
        );
      }
    }
    throw lastError ?? new Error("Gemini completion failed across all models.");
  }
  async *stream(request) {
    const completed = await this.complete(request);
    yield { content: completed.content, isComplete: true };
  }
  async isAvailable() {
    return this.options.apiKey.trim().length > 0;
  }
  getModelInfo() {
    return { provider: this.name, model: this.options.model, contextWindow: 1e6, supportsJson: true, supportsStreaming: false };
  }
  extractOutputText(envelope) {
    const candidates = Array.isArray(envelope.candidates) ? envelope.candidates : [];
    for (const candidate of candidates) {
      const parts = asRecord(asRecord(candidate).content).parts;
      const arr = Array.isArray(parts) ? parts : [];
      const answerParts = arr.map((p) => asRecord(p)).filter((p) => !p.thought && typeof p.text === "string" && p.text.trim());
      if (answerParts.length > 0) {
        return answerParts.map((p) => p.text).join("\n");
      }
      for (const part of arr) {
        const text = asRecord(part).text;
        if (typeof text === "string" && text.trim()) return text;
      }
    }
    throw new AISafetyError("Gemini response contained no output text.");
  }
};
function cleanGeminiSchema(schema) {
  if (schema === null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(cleanGeminiSchema);
  const out = {};
  const record = schema;
  const unsupportedKeys = /* @__PURE__ */ new Set([
    "additionalProperties",
    "exclusiveMinimum",
    "exclusiveMaximum",
    "minimum",
    "maximum",
    "minItems",
    "maxItems",
    "$schema",
    "$id"
  ]);
  for (const [k, v] of Object.entries(record)) {
    if (unsupportedKeys.has(k)) continue;
    if (k === "enum" && Array.isArray(v)) {
      if (record.type === "integer" || record.type === "number") {
        continue;
      }
      out[k] = v.map((item) => String(item));
      continue;
    }
    out[k] = cleanGeminiSchema(v);
  }
  return out;
}
var GEMINI_SUPPORTED_IMAGE_MIME_TYPES = /* @__PURE__ */ new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif"
]);
function buildGeminiParts(request) {
  const parts = [{ text: request.userPrompt }];
  for (const [index, image] of (request.images ?? []).entries()) {
    const mimeType = image.mimeType.trim().toLowerCase();
    if (!GEMINI_SUPPORTED_IMAGE_MIME_TYPES.has(mimeType)) {
      throw new AISafetyError(`Image part ${index} has unsupported media type "${image.mimeType}" for Gemini.`);
    }
    if (image.data.startsWith("data:")) {
      throw new AISafetyError(`Image part ${index} must be raw base64, not a data URL.`);
    }
    const data = image.data.replace(/\s+/g, "");
    if (data.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data)) {
      throw new AISafetyError(`Image part ${index} is not valid base64 image data.`);
    }
    parts.push({ inlineData: { mimeType, data } });
  }
  return parts;
}

// packages/ai-orchestration/src/editing/target-resolver.ts
var TYPE_ALIASES = [
  [RoomType.ServantQuarter, ["servant quarter", "maid room"]],
  [RoomType.FamilyLiving, ["family living", "family lounge"]],
  [RoomType.Living, ["living room", "living"]],
  [RoomType.Bedroom, ["master bedroom", "guest bedroom", "bedroom", "bed room"]],
  [RoomType.Bathroom, ["bathroom", "bath room", "toilet"]],
  [RoomType.Kitchen, ["kitchen"]],
  [RoomType.Dining, ["dining room", "dining"]],
  [RoomType.Study, ["study room", "study", "office"]],
  [RoomType.Pooja, ["pooja room", "puja room", "prayer room", "pooja"]],
  [RoomType.Utility, ["utility room", "utility"]],
  [RoomType.Storage, ["storage room", "store room", "storage"]],
  [RoomType.Balcony, ["balcony"]],
  [RoomType.Parking, ["parking", "garage"]],
  [RoomType.Corridor, ["corridor", "passage"]],
  [RoomType.Foyer, ["foyer", "entry"]]
];

// packages/planning-engine/dist/requirements/validator.js
var MIN_ROOM_AREAS_MM2 = {
  [RoomType.Living]: 12e6,
  [RoomType.Dining]: 8e6,
  [RoomType.Kitchen]: 55e5,
  [RoomType.Bedroom]: 95e5,
  [RoomType.Bathroom]: 25e5,
  [RoomType.Staircase]: 6e6,
  [RoomType.Lift]: 45e5,
  [RoomType.Parking]: 14e6,
  [RoomType.Pooja]: 2e6,
  [RoomType.Study]: 6e6,
  [RoomType.Balcony]: 3e6,
  [RoomType.Utility]: 3e6,
  [RoomType.ServantQuarter]: 95e5,
  [RoomType.Garden]: 8e6,
  [RoomType.Custom]: 6e6
};

// packages/geometry-engine/dist/point.js
function distance(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
function closestPointOnSegment(point, segment) {
  const dx = segment.end.x - segment.start.x;
  const dy = segment.end.y - segment.start.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) {
    return { x: segment.start.x, y: segment.start.y };
  }
  let t = ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return {
    x: segment.start.x + t * dx,
    y: segment.start.y + t * dy
  };
}
function pointToSegmentDistanceDirect(point, segment) {
  const closest = closestPointOnSegment(point, segment);
  return distance(point, closest);
}
function pointOnSegment(point, segment, tolerance = TOLERANCES.LINEAR) {
  return pointToSegmentDistanceDirect(point, segment) <= tolerance;
}
function pointInPolygon(point, polygon) {
  const pts = polygon.points;
  const n = pts.length;
  if (n < 3)
    return false;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const pi = pts[i];
    const pj = pts[j];
    const seg = { start: pi, end: pj };
    if (pointOnSegment(point, seg, TOLERANCES.LINEAR))
      return true;
    if (pi.y > point.y !== pj.y > point.y && point.x < (pj.x - pi.x) * (point.y - pi.y) / (pj.y - pi.y) + pi.x) {
      inside = !inside;
    }
  }
  return inside;
}
function pointsEqual(a, b, tolerance = TOLERANCES.LINEAR) {
  return Math.abs(a.x - b.x) <= tolerance && Math.abs(a.y - b.y) <= tolerance;
}

// packages/geometry-engine/dist/polygon.js
function polygonSignedArea(polygon) {
  const pts = polygon.points;
  const n = pts.length;
  if (n < 3)
    return 0;
  let area2 = 0;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    area2 += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  }
  return area2 / 2;
}
function polygonArea2(polygon) {
  return Math.abs(polygonSignedArea(polygon));
}
function polygonBoundingBox(polygon) {
  const pts = polygon.points;
  if (pts.length === 0)
    return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX)
      minX = p.x;
    if (p.y < minY)
      minY = p.y;
    if (p.x > maxX)
      maxX = p.x;
    if (p.y > maxY)
      maxY = p.y;
  }
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}
function containsPolygon(outer, inner) {
  for (const p of inner.points) {
    if (!pointInPolygon(p, outer)) {
      return false;
    }
  }
  return true;
}
function polygonIntersectionArea(a, b) {
  const clipped = sutherlandHodgmanClip(a.points.slice(), b.points.slice());
  if (clipped.length < 3)
    return 0;
  return polygonArea2({ points: clipped });
}
function sutherlandHodgmanClip(subject, clip) {
  let output = subject;
  for (let i = 0; i < clip.length; i++) {
    if (output.length === 0)
      return [];
    const input = output;
    output = [];
    const edgeStart = clip[i];
    const edgeEnd = clip[(i + 1) % clip.length];
    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const previous = input[(j - 1 + input.length) % input.length];
      const currInside = isInsideEdge(current, edgeStart, edgeEnd);
      const prevInside = isInsideEdge(previous, edgeStart, edgeEnd);
      if (currInside) {
        if (!prevInside) {
          const inter = lineIntersection(previous, current, edgeStart, edgeEnd);
          if (inter)
            output.push(inter);
        }
        output.push(current);
      } else if (prevInside) {
        const inter = lineIntersection(previous, current, edgeStart, edgeEnd);
        if (inter)
          output.push(inter);
      }
    }
  }
  return output;
}
function isInsideEdge(point, edgeStart, edgeEnd) {
  return (edgeEnd.x - edgeStart.x) * (point.y - edgeStart.y) - (edgeEnd.y - edgeStart.y) * (point.x - edgeStart.x) >= -1e-7;
}
function lineIntersection(p1, p2, p3, p4) {
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-10)
    return null;
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / denom;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y)
  };
}
function polygonsAdjacent(a, b, tolerance = TOLERANCES.ADJACENCY) {
  return sharedEdge(a, b, tolerance) !== null;
}
function sharedEdge(a, b, tolerance = TOLERANCES.ADJACENCY) {
  const aEdges = polygonEdges(a);
  const bEdges = polygonEdges(b);
  for (const ea of aEdges) {
    for (const eb of bEdges) {
      if (edgesOverlap(ea, eb, tolerance)) {
        return ea;
      }
    }
  }
  return null;
}
function polygonEdges(polygon) {
  const pts = polygon.points;
  const edges = [];
  for (let i = 0; i < pts.length; i++) {
    edges.push({ start: pts[i], end: pts[(i + 1) % pts.length] });
  }
  return edges;
}
function edgesOverlap(a, b, tolerance) {
  const isHorizontalA = Math.abs(a.start.y - a.end.y) <= tolerance;
  const isHorizontalB = Math.abs(b.start.y - b.end.y) <= tolerance;
  const isVerticalA = Math.abs(a.start.x - a.end.x) <= tolerance;
  const isVerticalB = Math.abs(b.start.x - b.end.x) <= tolerance;
  if (isHorizontalA && isHorizontalB) {
    if (Math.abs(a.start.y - b.start.y) > tolerance)
      return false;
    const aMinX = Math.min(a.start.x, a.end.x);
    const aMaxX = Math.max(a.start.x, a.end.x);
    const bMinX = Math.min(b.start.x, b.end.x);
    const bMaxX = Math.max(b.start.x, b.end.x);
    return aMinX < bMaxX - tolerance && bMinX < aMaxX - tolerance;
  }
  if (isVerticalA && isVerticalB) {
    if (Math.abs(a.start.x - b.start.x) > tolerance)
      return false;
    const aMinY = Math.min(a.start.y, a.end.y);
    const aMaxY = Math.max(a.start.y, a.end.y);
    const bMinY = Math.min(b.start.y, b.end.y);
    const bMaxY = Math.max(b.start.y, b.end.y);
    return aMinY < bMaxY - tolerance && bMinY < aMaxY - tolerance;
  }
  return pointsEqual(a.start, b.start, tolerance) && pointsEqual(a.end, b.end, tolerance) || pointsEqual(a.start, b.end, tolerance) && pointsEqual(a.end, b.start, tolerance);
}

// packages/geometry-engine/dist/walls.js
var DEFAULT_WALL_CONFIG = {
  externalThickness: DEFAULTS.WALL_THICKNESS_EXTERNAL,
  internalThickness: DEFAULTS.WALL_THICKNESS_INTERNAL
};

// packages/geometry-engine/dist/collision.js
function detectEntityCollision(polyA, idA, polyB, idB) {
  const overlapArea3 = polygonIntersectionArea(polyA, polyB);
  if (overlapArea3 > TOLERANCES.OVERLAP) {
    const clippedPoints = sutherlandHodgmanClip(polyA.points.slice(), polyB.points.slice());
    return {
      entityA: idA,
      entityB: idB,
      overlapArea: overlapArea3,
      overlapRegion: { points: clippedPoints }
    };
  }
  return null;
}
function detectRoomCollisions(room, otherRooms) {
  const results = [];
  for (const other of otherRooms) {
    if (other.id === room.id)
      continue;
    const collision = detectEntityCollision(room.boundary, room.id, other.boundary, other.id);
    if (collision) {
      results.push(collision);
    }
  }
  return results;
}

// packages/planning-engine/dist/graph/scorer.js
function sourceProgramItemId(itemId) {
  return itemId.replace(/_floor_\d+$/, "");
}
function roomProgramTag(room) {
  const tag = room.tags.find((value) => value.startsWith("program:"));
  return tag ? sourceProgramItemId(tag.slice("program:".length)) : void 0;
}
function centroidDistance(a, b) {
  const ax = a.x + a.width / 2;
  const ay = a.y + a.height / 2;
  const bx = b.x + b.width / 2;
  const by = b.y + b.height / 2;
  return Math.hypot(ax - bx, ay - by);
}
function directlyConnected(building, a, b) {
  return building.floors.some((floor) => floor.doors.some((door) => {
    const [from, to] = door.connectsRooms;
    return from === a.id && to === b.id || from === b.id && to === a.id;
  }));
}
function positiveRelationshipScore(building, a, b) {
  if (a.floorId !== b.floorId)
    return 0;
  if (directlyConnected(building, a, b))
    return 1;
  if (polygonsAdjacent(a.boundary, b.boundary))
    return 0.9;
  return Math.max(0, 1 - centroidDistance(a, b) / 1e4) * 0.5;
}
function separationScore(a, b) {
  if (a.floorId !== b.floorId)
    return 1;
  if (polygonsAdjacent(a.boundary, b.boundary))
    return 0;
  return Math.min(1, centroidDistance(a, b) / 6e3);
}
function evaluateInstanceGraph(building, graph) {
  if (graph.edges.length === 0) {
    return { score: 100, satisfiedEdgeIds: [], unsatisfiedEdgeIds: [] };
  }
  const roomsByProgramId = /* @__PURE__ */ new Map();
  for (const room of building.floors.flatMap((floor) => floor.rooms)) {
    const programId = roomProgramTag(room);
    if (!programId)
      continue;
    const rooms = roomsByProgramId.get(programId) ?? [];
    rooms.push(room);
    roomsByProgramId.set(programId, rooms);
  }
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  let earned = 0;
  let possible = 0;
  const satisfiedEdgeIds = [];
  const unsatisfiedEdgeIds = [];
  for (const edge of graph.edges) {
    const sourceNode = nodeById.get(edge.sourceNodeId);
    const targetNode = nodeById.get(edge.targetNodeId);
    const sources = sourceNode ? roomsByProgramId.get(sourceNode.programItemId) ?? [] : [];
    const targets = targetNode ? roomsByProgramId.get(targetNode.programItemId) ?? [] : [];
    possible += edge.weight;
    let satisfaction = 0;
    for (const source of sources) {
      for (const target of targets) {
        const pairScore = edge.relation === AdjacencyRelationType.RequiredSeparation || edge.relation === AdjacencyRelationType.PrivacyBoundary ? separationScore(source, target) : positiveRelationshipScore(building, source, target);
        satisfaction = Math.max(satisfaction, pairScore);
      }
    }
    earned += satisfaction * edge.weight;
    if (satisfaction >= 0.75)
      satisfiedEdgeIds.push(edge.id);
    else
      unsatisfiedEdgeIds.push(edge.id);
  }
  return {
    score: possible > 0 ? Math.round(earned / possible * 100) : 100,
    satisfiedEdgeIds,
    unsatisfiedEdgeIds
  };
}

// packages/planning-engine/dist/evidence/architectural-closeout.js
var COMMON = /* @__PURE__ */ new Set([
  RoomType.Living,
  RoomType.FamilyLiving,
  RoomType.Drawing,
  RoomType.Dining,
  RoomType.Corridor,
  RoomType.Foyer,
  RoomType.Staircase,
  RoomType.Lift
]);
var TRANSITION = /* @__PURE__ */ new Set([RoomType.Corridor, RoomType.Foyer, RoomType.Staircase, RoomType.Lift]);
var EXPOSURE = /* @__PURE__ */ new Set([
  RoomType.Bedroom,
  RoomType.Living,
  RoomType.FamilyLiving,
  RoomType.Drawing,
  RoomType.Kitchen,
  RoomType.Bathroom,
  RoomType.Utility,
  RoomType.Storage
]);

// packages/planning-engine/dist/evidence/architectural-evidence.js
var WET_TYPES = /* @__PURE__ */ new Set([RoomType.Bathroom, RoomType.Kitchen, RoomType.Utility]);
var OUTDOOR_TYPES = /* @__PURE__ */ new Set([RoomType.Balcony, RoomType.Terrace, RoomType.Garden]);
var ACCESS_TYPES = /* @__PURE__ */ new Set([RoomType.Storage, RoomType.Custom, RoomType.Corridor, RoomType.Foyer]);
var COMMON_TYPES = /* @__PURE__ */ new Set([
  RoomType.Living,
  RoomType.FamilyLiving,
  RoomType.Drawing,
  RoomType.Dining,
  RoomType.Kitchen,
  RoomType.Corridor,
  RoomType.Foyer,
  RoomType.Staircase,
  RoomType.Lift
]);

// packages/planning-engine/dist/multi-floor/planner.js
var CORE_TYPES = /* @__PURE__ */ new Set([RoomType.Staircase, RoomType.Lift]);
var GROUND_ANCHOR_TYPES = /* @__PURE__ */ new Set([
  RoomType.Living,
  RoomType.Dining,
  RoomType.Kitchen,
  RoomType.Foyer,
  RoomType.Parking,
  RoomType.Garden
]);
function roomProgramId(room) {
  const tag = room.tags.find((value) => value.startsWith("program:"));
  return tag ? sourceProgramItemId(tag.slice("program:".length)) : void 0;
}
function footprintOverlapRatio(a, b) {
  const width = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const height = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return width * height / Math.max(1, Math.min(a.area, b.area));
}
function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
function evaluateMultiFloorPlanning(building) {
  const orderedFloors = [...building.floors].sort((a, b) => a.level - b.level);
  const allocations = orderedFloors.map((floor) => {
    const availableAreaMm2 = polygonArea2(floor.boundary);
    const assignedRoomAreaMm2 = floor.rooms.reduce((sum2, room) => sum2 + room.area, 0);
    const intentionalOpenSpaceAreaMm2 = 0;
    const unusedSpaceAreaMm2 = Math.max(0, availableAreaMm2 - assignedRoomAreaMm2);
    return {
      level: floor.level,
      roomCount: floor.rooms.length,
      bedroomCount: floor.rooms.filter((room) => room.type === RoomType.Bedroom).length,
      bathroomCount: floor.rooms.filter((room) => room.type === RoomType.Bathroom).length,
      programItemIds: floor.rooms.map(roomProgramId).filter((id) => id !== void 0).sort(),
      availableAreaMm2,
      assignedRoomAreaMm2,
      intentionalOpenSpaceAreaMm2,
      unusedSpaceAreaMm2,
      utilizationRatio: availableAreaMm2 > 0 ? assignedRoomAreaMm2 / availableAreaMm2 : 0,
      unusedSpaceRatio: availableAreaMm2 > 0 ? unusedSpaceAreaMm2 / availableAreaMm2 : 1,
      nonCoreRoomCount: floor.rooms.filter((room) => !CORE_TYPES.has(room.type)).length
    };
  });
  const coreTypes = [RoomType.Staircase, RoomType.Lift];
  const verticalCoreAligned = coreTypes.every((type) => {
    const cores = orderedFloors.flatMap((floor) => floor.rooms.filter((room) => room.type === type));
    if (cores.length === 0)
      return true;
    if (cores.length !== orderedFloors.length)
      return false;
    const anchor = cores[0];
    return cores.every((room) => room.x === anchor.x && room.y === anchor.y && room.width === anchor.width && room.height === anchor.height);
  });
  const bedrooms = orderedFloors.flatMap((floor) => floor.rooms.filter((room) => room.type === RoomType.Bedroom));
  const bedroomsPaired = bedrooms.filter((bedroom) => {
    const floor = orderedFloors.find((candidate) => candidate.id === bedroom.floorId);
    return floor.rooms.some((room) => room.type === RoomType.Bathroom);
  }).length;
  const wetTypes = /* @__PURE__ */ new Set([RoomType.Bathroom, RoomType.Kitchen, RoomType.Utility]);
  const stackScores = [];
  for (let index = 0; index < orderedFloors.length - 1; index++) {
    const lowerWet = orderedFloors[index].rooms.filter((room) => wetTypes.has(room.type));
    const upperWet = orderedFloors[index + 1].rooms.filter((room) => wetTypes.has(room.type));
    if (lowerWet.length === 0 || upperWet.length === 0)
      continue;
    const best = lowerWet.reduce((score, lower) => Math.max(score, ...upperWet.map((upper) => footprintOverlapRatio(lower, upper))), 0);
    stackScores.push(best);
  }
  const requiredAdjacentFloorPairs = Math.max(0, orderedFloors.length - 1);
  const coveredPairs = /* @__PURE__ */ new Set();
  for (const stair of orderedFloors.flatMap((floor) => floor.stairs)) {
    const levels = [...stair.connectsFloors].sort((a, b) => a - b);
    if (levels.length < 2)
      continue;
    const from = levels[0];
    const to = levels[levels.length - 1];
    if (to - from === 1)
      coveredPairs.add(`${from}:${to}`);
  }
  const adjacentFloorPairsCovered = Array.from({ length: requiredAdjacentFloorPairs }, (_, level) => `${level}:${level + 1}`).filter((pair) => coveredPairs.has(pair)).length;
  const averageFloorUtilization = allocations.length > 0 ? allocations.reduce((sum2, allocation) => sum2 + allocation.utilizationRatio, 0) / allocations.length : 0;
  const maximumUnusedSpaceRatio = allocations.reduce((maximum, allocation) => Math.max(maximum, allocation.unusedSpaceRatio), 0);
  const floorUtilizationScore = clampScore(100 - Math.abs(0.78 - averageFloorUtilization) * 170);
  const unusedSpaceScore = clampScore(100 - Math.max(0, maximumUnusedSpaceRatio - 0.15) * 220);
  const nonCoreCounts = allocations.map((allocation) => allocation.nonCoreRoomCount);
  const roomDistributionScore = nonCoreCounts.length === 0 || nonCoreCounts.some((count) => count === 0) ? 0 : clampScore(Math.min(...nonCoreCounts) / Math.max(...nonCoreCounts) * 100);
  const coverageScore = requiredAdjacentFloorPairs === 0 ? 100 : adjacentFloorPairsCovered / requiredAdjacentFloorPairs * 100;
  const hasStairOnEveryFloor = orderedFloors.length <= 1 || orderedFloors.every((floor) => floor.rooms.some((room) => room.type === RoomType.Staircase) && floor.stairs.length > 0);
  const verticalContinuityScore = clampScore(coverageScore * 0.5 + (verticalCoreAligned ? 35 : 0) + (hasStairOnEveryFloor ? 15 : 0));
  const buildingLevelScore = clampScore(floorUtilizationScore * 0.3 + unusedSpaceScore * 0.25 + roomDistributionScore * 0.2 + verticalContinuityScore * 0.25);
  return {
    floorCount: orderedFloors.length,
    allocations,
    verticalCoreAligned,
    bedroomBathroomPairingScore: bedrooms.length > 0 ? Math.round(bedroomsPaired / bedrooms.length * 100) : 100,
    wetAreaStackScore: stackScores.length > 0 ? Math.round(stackScores.reduce((sum2, score) => sum2 + score, 0) / stackScores.length * 100) : null,
    wetAreaStackPairs: stackScores.length,
    adjacentFloorPairsCovered,
    requiredAdjacentFloorPairs,
    averageFloorUtilization,
    maximumUnusedSpaceRatio,
    floorUtilizationScore,
    unusedSpaceScore,
    roomDistributionScore,
    verticalContinuityScore,
    buildingLevelScore
  };
}

// packages/planning-engine/dist/diagnostics/design-evaluator.js
function evaluateDesign(building, options = {}) {
  const warnings = [];
  const observations = [];
  let geometryHealthy = true;
  const allRooms = building.floors.flatMap((floor) => floor.rooms);
  const carpetArea2 = allRooms.reduce((sum2, r) => sum2 + r.area, 0);
  for (const floor of building.floors) {
    const hasBoundary = floor.boundary && floor.boundary.points.length >= 3;
    for (let i = 0; i < floor.rooms.length; i++) {
      const room = floor.rooms[i];
      if (!Number.isFinite(room.x) || !Number.isFinite(room.y) || !Number.isFinite(room.width) || !Number.isFinite(room.height) || room.width <= 0 || room.height <= 0 || room.area <= 0) {
        geometryHealthy = false;
        warnings.push({
          code: "GEOMETRY_INVALID_DIMENSIONS",
          message: `Room "${room.name}" has invalid or non-finite dimensions.`,
          severity: "error",
          affectedEntityIds: [room.id]
        });
      }
      if (hasBoundary && !containsPolygon(floor.boundary, room.boundary)) {
        geometryHealthy = false;
        warnings.push({
          code: "GEOMETRY_OUT_OF_BOUNDS",
          message: `Room "${room.name}" extends beyond the floor boundary.`,
          severity: "error",
          affectedEntityIds: [room.id]
        });
      }
      const minArea = MINIMUM_ROOM_AREAS[room.type];
      if (minArea !== void 0 && room.area < minArea) {
        geometryHealthy = false;
        warnings.push({
          code: "GEOMETRY_SUB_MINIMUM_SIZE",
          message: `Room "${room.name}" (${room.type}) area ${room.area} is below minimum ${minArea}.`,
          severity: "error",
          affectedEntityIds: [room.id]
        });
      }
      const minDim = MINIMUM_DIMENSIONS[room.type];
      if (minDim !== void 0 && Math.min(room.width, room.height) < minDim) {
        geometryHealthy = false;
        warnings.push({
          code: "GEOMETRY_SUB_MINIMUM_DIMENSION",
          message: `Room "${room.name}" dimension is below minimum ${minDim}.`,
          severity: "error",
          affectedEntityIds: [room.id]
        });
      }
      const collisions = detectRoomCollisions(room, [...floor.rooms]);
      if (collisions.length > 0) {
        const significant = collisions.filter((c) => c.overlapArea > 5e4);
        if (significant.length > 0) {
          geometryHealthy = false;
          warnings.push({
            code: "GEOMETRY_ROOM_COLLISION",
            message: `Room "${room.name}" overlaps with another room on Level ${floor.level}.`,
            severity: "error",
            affectedEntityIds: [room.id, ...significant.map((c) => c.entityB)]
          });
        }
      }
    }
  }
  if (options.requiredRoomTypes && options.requiredRoomTypes.length > 0) {
    const presentTypes = new Set(allRooms.map((r) => r.type));
    const siteZoneKinds = new Set(building.site?.siteZones?.map((z) => z.kind) ?? []);
    for (const req of options.requiredRoomTypes) {
      const fulfilledOnSite = req === RoomType.Parking && siteZoneKinds.has("parking") || req === RoomType.Garden && siteZoneKinds.has("garden");
      if (!presentTypes.has(req) && !fulfilledOnSite) {
        geometryHealthy = false;
        warnings.push({
          code: "MISSING_REQUIRED_ROOM_TYPE",
          message: `Required room type "${req}" is missing from the plan.`,
          severity: "error"
        });
      }
    }
  }
  const totalFloorArea = building.floors.reduce((sum2, floor) => {
    return floor.boundary && floor.boundary.points.length >= 3 ? sum2 + polygonArea2(floor.boundary) : sum2;
  }, 0);
  const areaEfficiencyScore = totalFloorArea > 0 ? Math.max(0, Math.min(100, Math.round(carpetArea2 / totalFloorArea * 100))) : 75;
  if (areaEfficiencyScore >= 70) {
    observations.push({
      category: "strength",
      title: "High Spatial Efficiency",
      description: `Carpet area accounts for ${areaEfficiencyScore}% of floor plate with minimal wasted circulation.`,
      scoreImpact: 10
    });
  } else if (areaEfficiencyScore < 50) {
    observations.push({
      category: "opportunity",
      title: "Underutilized Floor Plate",
      description: `Carpet area is currently ${areaEfficiencyScore}% of the footprint. Room envelopes can be expanded.`,
      scoreImpact: -5
    });
  }
  if (options.program && totalFloorArea > 0) {
    if (options.program.totalMinAreaMm2 > totalFloorArea) {
      warnings.push({
        code: "FEASIBILITY_CONFLICT_AREA",
        message: `Requested program minimum area (${Math.round(options.program.totalMinAreaMm2 / 1e6)} m\xB2) exceeds usable floor footprint (${Math.round(totalFloorArea / 1e6)} m\xB2).`,
        severity: "warning"
      });
      observations.push({
        category: "opportunity",
        title: "Space Program Exceeds Footprint",
        description: "The combined minimum sizes of requested spaces exceed the buildable envelope. Consider adding a floor or reducing room counts.",
        scoreImpact: -10
      });
    }
  }
  let adjacencyScore = 75;
  if (options.designGraph) {
    const graphEval = evaluateInstanceGraph(building, options.designGraph);
    adjacencyScore = graphEval.score;
  }
  const kitchen = allRooms.find((r) => r.type === RoomType.Kitchen);
  const dining = allRooms.find((r) => r.type === RoomType.Dining);
  const living = allRooms.find((r) => r.type === RoomType.Living);
  if (kitchen && dining) {
    const dist = Math.hypot(kitchen.x - dining.x, kitchen.y - dining.y);
    if (dist < 8e3) {
      observations.push({
        category: "strength",
        title: "Direct Kitchen-Dining Relationship",
        description: "Kitchen is conveniently positioned adjacent to the dining area.",
        scoreImpact: 10,
        affectedEntityIds: [kitchen.id, dining.id]
      });
    } else {
      observations.push({
        category: "opportunity",
        title: "Separated Kitchen and Dining",
        description: "Kitchen is distant from dining area. Consider closer placement for smoother service flow.",
        scoreImpact: -5,
        affectedEntityIds: [kitchen.id, dining.id]
      });
    }
  }
  let privacyScore = 80;
  const bedrooms = allRooms.filter((r) => r.type === RoomType.Bedroom);
  const bathrooms = allRooms.filter((r) => r.type === RoomType.Bathroom);
  if (living && bedrooms.length > 0) {
    const isolatedBedrooms = bedrooms.filter((b) => {
      const dist = Math.hypot(b.x - living.x, b.y - living.y);
      return dist > 4e3;
    });
    if (isolatedBedrooms.length >= Math.ceil(bedrooms.length / 2)) {
      observations.push({
        category: "strength",
        title: "Good Public/Private Separation",
        description: "Sleeping areas are well buffered from main living and entertaining zones.",
        scoreImpact: 10,
        affectedEntityIds: isolatedBedrooms.map((b) => b.id)
      });
      privacyScore = 90;
    } else {
      observations.push({
        category: "opportunity",
        title: "Bedrooms Close to Public Living",
        description: "One or more bedrooms are directly adjacent to public living spaces without a privacy buffer.",
        scoreImpact: -5,
        affectedEntityIds: bedrooms.filter((b) => !isolatedBedrooms.includes(b)).map((b) => b.id)
      });
      privacyScore = 65;
    }
  }
  if (bathrooms.length > 0 && living) {
    const directToLiving = bathrooms.filter((b) => Math.hypot(b.x - living.x, b.y - living.y) < 2e3);
    if (directToLiving.length > 0) {
      observations.push({
        category: "opportunity",
        title: "Bathroom Adjacent to Living Area",
        description: "Consider screening or vestibule entry for bathrooms positioned close to primary social areas.",
        scoreImpact: -5,
        affectedEntityIds: directToLiving.map((b) => b.id)
      });
    }
  }
  let daylightScore = 85;
  for (const floor of building.floors) {
    const floorBedrooms = floor.rooms.filter((r) => r.type === RoomType.Bedroom || r.type === RoomType.Living);
    if (floor.boundary && floor.boundary.points.length >= 3) {
      for (const room of floorBedrooms) {
        const onPerimeter = floor.walls.some((w) => w.roomIds.includes(room.id) && w.roomIds.length === 1);
        if (!onPerimeter) {
          daylightScore = Math.max(50, daylightScore - 10);
          observations.push({
            category: "opportunity",
            title: `${room.name} Lacks Direct Exterior Wall`,
            description: `Room is landlocked away from the perimeter. Opening a wall to the outside improves natural light.`,
            scoreImpact: -5,
            affectedEntityIds: [room.id]
          });
        }
      }
    }
  }
  if (daylightScore >= 80) {
    observations.push({
      category: "strength",
      title: "Strong Natural Lighting Exposure",
      description: "Habitable living and sleeping rooms have direct access to exterior perimeter walls.",
      scoreImpact: 10
    });
  }
  let circulationScore = 80;
  const doors = building.floors.flatMap((f) => f.doors);
  if (doors.length >= allRooms.length - 1) {
    observations.push({
      category: "strength",
      title: "Clear Circulation Paths",
      description: "Rooms have dedicated doorway transitions supporting logical movement across levels.",
      scoreImpact: 5
    });
  } else if (allRooms.length > 3 && doors.length < allRooms.length / 2) {
    circulationScore = 60;
    observations.push({
      category: "opportunity",
      title: "Incomplete Door Connections",
      description: "Some rooms require additional internal doorway connections.",
      scoreImpact: -10
    });
  }
  for (const floor of building.floors) {
    for (const room of floor.rooms) {
      if (room.type === RoomType.Bedroom) {
        const connectedDoors = floor.doors.filter((d) => d.connectsRooms.includes(room.id));
        const otherRoomIds = connectedDoors.flatMap((d) => d.connectsRooms.filter((id) => id !== room.id && id !== "__outside__" && id !== "outside"));
        const nonBathOtherRooms = otherRoomIds.map((id) => floor.rooms.find((r) => r.id === id)).filter((r) => r && r.type !== RoomType.Bathroom);
        if (nonBathOtherRooms.length > 1) {
          observations.push({
            category: "opportunity",
            title: `Private Transit Through ${room.name}`,
            description: `${room.name} functions as a thoroughfare to other rooms, reducing privacy and circulation quality.`,
            scoreImpact: -10,
            affectedEntityIds: [room.id]
          });
        }
      }
    }
  }
  let zoningScore = 80;
  const entranceDoor = building.floors[0]?.doors.find((d) => d.connectsRooms.includes("__outside__") || d.connectsRooms.includes("outside"));
  if (entranceDoor) {
    const enteredRoomId = entranceDoor.connectsRooms.find((id) => id !== "__outside__" && id !== "outside");
    const enteredRoom = allRooms.find((r) => r.id === enteredRoomId);
    if (enteredRoom) {
      if (enteredRoom.type === RoomType.Living || enteredRoom.type === RoomType.Foyer || enteredRoom.type === RoomType.Corridor) {
        zoningScore += 10;
        observations.push({
          category: "strength",
          title: "Direct Public Entrance Flow",
          description: `Main entrance transitions directly into public ${enteredRoom.name}.`,
          scoreImpact: 5,
          affectedEntityIds: [enteredRoom.id]
        });
      } else if (enteredRoom.type === RoomType.Bedroom || enteredRoom.type === RoomType.Bathroom) {
        zoningScore -= 25;
        observations.push({
          category: "opportunity",
          title: "Private Room Entrance Conflict",
          description: `Main entrance connects directly into ${enteredRoom.name} (${enteredRoom.type}). Entrance should lead to public or distribution space.`,
          scoreImpact: -15,
          affectedEntityIds: [enteredRoom.id]
        });
      }
    }
  }
  if (bedrooms.length > 1) {
    let totalPairDist = 0;
    let pairs = 0;
    for (let i = 0; i < bedrooms.length; i++) {
      for (let j = i + 1; j < bedrooms.length; j++) {
        if (bedrooms[i].floorId === bedrooms[j].floorId) {
          totalPairDist += Math.hypot(bedrooms[i].x - bedrooms[j].x, bedrooms[i].y - bedrooms[j].y);
          pairs++;
        }
      }
    }
    const avgDist = pairs > 0 ? totalPairDist / pairs : 0;
    if (avgDist > 0 && avgDist < 1e4) {
      zoningScore += 10;
    }
  }
  zoningScore = Math.max(20, Math.min(100, zoningScore));
  if (zoningScore >= 85) {
    observations.push({
      category: "strength",
      title: "Logical Functional Zoning",
      description: "Clear segregation between public social areas, kitchen services, and private sleeping quarters.",
      scoreImpact: 10
    });
  }
  let shapeScore = 100;
  const occupiableRooms = allRooms.filter((r) => r.type !== RoomType.Corridor && r.type !== RoomType.Staircase && r.type !== RoomType.Lift);
  if (occupiableRooms.length > 0) {
    let totalShapePoints = 0;
    const elongatedRooms = [];
    for (const room of occupiableRooms) {
      const minDim = Math.min(room.width, room.height);
      const maxDim = Math.max(room.width, room.height);
      const ratio = minDim > 0 ? maxDim / minDim : 3;
      if (ratio <= 1.6) {
        totalShapePoints += 100;
      } else if (ratio <= 2) {
        totalShapePoints += 85;
      } else if (ratio <= 2.5) {
        totalShapePoints += 55;
        elongatedRooms.push(room);
      } else {
        totalShapePoints += 25;
        elongatedRooms.push(room);
      }
    }
    shapeScore = Math.round(totalShapePoints / occupiableRooms.length);
    if (shapeScore >= 85) {
      observations.push({
        category: "strength",
        title: "Harmonious Room Proportions",
        description: "Rooms maintain functional, well-proportioned rectangular geometries without narrow slivers.",
        scoreImpact: 5
      });
    } else if (elongatedRooms.length > 0) {
      observations.push({
        category: "opportunity",
        title: "Elongated Room Geometry",
        description: `${elongatedRooms.map((r) => r.name).slice(0, 2).join(", ")} exceed 2:1 aspect ratio, which may constrain functional furniture layouts.`,
        scoreImpact: -5,
        affectedEntityIds: elongatedRooms.map((r) => r.id)
      });
    }
  }
  let vastuScore;
  const vastuDetails = [];
  if (options.vastuEnabled) {
    let vastuPoints = 0;
    let vastuMax = 0;
    const orientation = building.site.orientation ?? 0;
    const firstFloor = building.floors[0];
    const bounds = firstFloor?.boundary && firstFloor.boundary.points.length >= 3 ? polygonBoundingBox(firstFloor.boundary) : { x: 0, y: 0, width: building.site.plotWidth, height: building.site.plotDepth };
    if (kitchen) {
      vastuMax += 15;
      const center = { x: kitchen.x + kitchen.width / 2, y: kitchen.y + kitchen.height / 2 };
      const q = getQuadrant(center, bounds, orientation);
      const match = quadrantMatches(q, "SE");
      const pts = match.matches ? 15 : match.partial ? 8 : 0;
      vastuPoints += pts;
      vastuDetails.push({
        factor: "SC-VASTU-001",
        points: pts,
        maxPoints: 15,
        description: match.matches ? "Kitchen in Southeast quadrant" : `Kitchen in ${q} (Vastu recommends SE)`
      });
      observations.push({
        category: "preference",
        title: "Vastu: Kitchen in Southeast (Agni)",
        description: match.matches ? "Kitchen is aligned with the auspicious Southeast quadrant for fire and cooking." : "Kitchen could be positioned in the Southeast (Agni) quadrant for optimal Vastu alignment.",
        scoreImpact: match.matches ? 5 : 0,
        affectedEntityIds: [kitchen.id]
      });
    }
    const master = bedrooms.length > 0 ? bedrooms.reduce((a, b) => a.area > b.area ? a : b) : void 0;
    if (master) {
      vastuMax += 15;
      const center = { x: master.x + master.width / 2, y: master.y + master.height / 2 };
      const q = getQuadrant(center, bounds, orientation);
      const match = quadrantMatches(q, "SW");
      const pts = match.matches ? 15 : match.partial ? 8 : 0;
      vastuPoints += pts;
      vastuDetails.push({
        factor: "SC-VASTU-002",
        points: pts,
        maxPoints: 15,
        description: match.matches ? "Master bedroom in Southwest quadrant" : `Master bedroom in ${q} (Vastu recommends SW)`
      });
      observations.push({
        category: "preference",
        title: "Vastu: Master Bedroom in Southwest (Nairutya)",
        description: match.matches ? "Master bedroom is aligned with the Southwest quadrant for stability." : "Master bedroom is recommended in the Southwest quadrant for stability.",
        scoreImpact: match.matches ? 5 : 0,
        affectedEntityIds: [master.id]
      });
    }
    if (living) {
      vastuMax += 10;
      const center = { x: living.x + living.width / 2, y: living.y + living.height / 2 };
      const inNorth = isInNorth(center, bounds, orientation);
      const pts = inNorth ? 10 : 0;
      vastuPoints += pts;
      vastuDetails.push({
        factor: "SC-VASTU-004",
        points: pts,
        maxPoints: 10,
        description: inNorth ? "Living room in North zone" : "Living room outside North zone"
      });
      observations.push({
        category: "preference",
        title: "Vastu: Living Room in North/East Quadrant",
        description: inNorth ? "Living room receives morning daylight and positive entry energy." : "Living room orientation could be aligned towards North or East.",
        scoreImpact: inNorth ? 5 : 0,
        affectedEntityIds: [living.id]
      });
    }
    const pooja = allRooms.find((r) => r.type === RoomType.Pooja);
    if (pooja) {
      vastuMax += 15;
      const center = { x: pooja.x + pooja.width / 2, y: pooja.y + pooja.height / 2 };
      const q = getQuadrant(center, bounds, orientation);
      const match = quadrantMatches(q, "NE");
      const pts = match.matches ? 15 : match.partial ? 8 : 0;
      vastuPoints += pts;
      vastuDetails.push({
        factor: "SC-VASTU-003",
        points: pts,
        maxPoints: 15,
        description: match.matches ? "Pooja room in Northeast quadrant" : `Pooja room in ${q} (Vastu recommends NE)`
      });
      observations.push({
        category: "preference",
        title: "Vastu: Pooja Room in Northeast (Ishanya)",
        description: match.matches ? "Pooja room placed in the sacred Northeast zone." : "Pooja room is recommended in the Northeast zone.",
        scoreImpact: match.matches ? 5 : 0,
        affectedEntityIds: [pooja.id]
      });
    }
    if (bathrooms.length > 0) {
      vastuMax += 10;
      const center = { x: bathrooms[0].x + bathrooms[0].width / 2, y: bathrooms[0].y + bathrooms[0].height / 2 };
      const inWest = isInWest(center, bounds, orientation);
      const pts = inWest ? 10 : 0;
      vastuPoints += pts;
      vastuDetails.push({
        factor: "SC-VASTU-005",
        points: pts,
        maxPoints: 10,
        description: inWest ? "Bathroom in West zone" : "Bathroom outside West zone"
      });
    }
    const road = building.site.roadFacing;
    if (road) {
      vastuMax += 15;
      const favorable = road === "north" || road === "east";
      const pts = favorable ? 15 : 0;
      vastuPoints += pts;
      vastuDetails.push({
        factor: "SC-VASTU-006",
        points: pts,
        maxPoints: 15,
        description: favorable ? `Entrance faces ${road}` : `Entrance faces ${road} (Vastu recommends North or East)`
      });
    }
    if (bathrooms.length > 0) {
      vastuMax += 10;
      const toiletInNE = bathrooms.some((b) => {
        const center = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
        return getQuadrant(center, bounds, orientation) === "NE";
      });
      const pts = toiletInNE ? 0 : 10;
      vastuPoints += pts;
      vastuDetails.push({
        factor: "SC-VASTU-008",
        points: pts,
        maxPoints: 10,
        description: toiletInNE ? "Bathroom in Northeast corner" : "No bathroom in Northeast corner"
      });
    }
    vastuScore = vastuMax > 0 ? Math.round(vastuPoints / vastuMax * 100) : 75;
  }
  const multiFloor = evaluateMultiFloorPlanning(building);
  const multiFloorScore = multiFloor.buildingLevelScore;
  const overall = options.vastuEnabled && vastuScore !== void 0 ? Math.round(areaEfficiencyScore * 0.2 + adjacencyScore * 0.2 + circulationScore * 0.15 + privacyScore * 0.15 + daylightScore * 0.15 + vastuScore * 0.15) : Math.round(areaEfficiencyScore * 0.25 + adjacencyScore * 0.25 + circulationScore * 0.2 + privacyScore * 0.15 + daylightScore * 0.15);
  return {
    geometryHealthy,
    overallScore: overall,
    warnings,
    observations,
    scores: {
      overall,
      areaEfficiency: areaEfficiencyScore,
      circulation: circulationScore,
      privacy: privacyScore,
      daylight: daylightScore,
      adjacency: adjacencyScore,
      zoning: zoningScore,
      shape: shapeScore,
      vastu: vastuScore,
      multiFloor: multiFloorScore
    },
    vastuDetails
  };
}
function getQuadrant(point, bounds, orientation) {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const rad = -orientation * Math.PI / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  const isNorth = ry < 0;
  const isEast = rx > 0;
  if (isNorth && isEast)
    return "NE";
  if (isNorth && !isEast)
    return "NW";
  if (!isNorth && isEast)
    return "SE";
  return "SW";
}
function quadrantMatches(actual, target) {
  if (actual === target)
    return { matches: true, partial: false };
  const isAdjacent = actual[0] === target[0] || actual[1] === target[1];
  return { matches: false, partial: isAdjacent };
}
function isInNorth(point, bounds, orientation) {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const rad = -orientation * Math.PI / 180;
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  return ry < 0;
}
function isInWest(point, bounds, orientation) {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  const dx = point.x - cx;
  const dy = point.y - cy;
  const rad = -orientation * Math.PI / 180;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  return rx < 0;
}

// packages/planning-engine/dist/repair/engine.js
var NON_REASSIGNABLE_TYPES = /* @__PURE__ */ new Set([
  RoomType.Staircase,
  RoomType.Lift,
  RoomType.Parking,
  RoomType.Garden,
  RoomType.Balcony,
  RoomType.Corridor
]);

// packages/planning-engine/dist/vastu/optimizer.js
var EXCLUDED_TYPES = /* @__PURE__ */ new Set([
  RoomType.Staircase,
  RoomType.Lift,
  RoomType.Parking,
  RoomType.Garden,
  RoomType.Balcony
]);

// packages/planning-engine/dist/generator/structured-layout.js
var LAYOUT_STRATEGIES = [
  {
    strategy: "compact_zoning",
    name: "Compact Space-Efficient",
    description: "Balanced two-zone layout with short, fully connected circulation paths.",
    columnRatio: 0.5,
    priority: {
      [RoomType.Living]: 1,
      [RoomType.Dining]: 2,
      [RoomType.Kitchen]: 3,
      [RoomType.Bedroom]: 4,
      [RoomType.Bathroom]: 5
    }
  },
  {
    strategy: "open_circulation",
    name: "Open Cross-Ventilated",
    description: "Public rooms lead the circulation chain while private spaces retain external light.",
    columnRatio: 0.52,
    priority: {
      [RoomType.Living]: 1,
      [RoomType.Dining]: 2,
      [RoomType.Bedroom]: 3,
      [RoomType.Kitchen]: 4,
      [RoomType.Bathroom]: 5
    }
  },
  {
    strategy: "vastu_aligned",
    name: "Vastu-Oriented",
    description: "Directional ordering favors public space, kitchen, and private-room separation.",
    columnRatio: 0.48,
    priority: {
      [RoomType.Living]: 1,
      [RoomType.Pooja]: 2,
      [RoomType.Dining]: 3,
      [RoomType.Kitchen]: 4,
      [RoomType.Bedroom]: 5,
      [RoomType.Bathroom]: 6
    }
  }
];

// packages/planning-engine/dist/generator/polygon-layout.js
var CORE_TYPES2 = /* @__PURE__ */ new Set([RoomType.Staircase, RoomType.Lift]);

// packages/planning-engine/dist/evidence/candidate-diversity.js
var FUNCTIONAL = /* @__PURE__ */ new Set([
  RoomType.Living,
  RoomType.FamilyLiving,
  RoomType.Drawing,
  RoomType.Dining,
  RoomType.Kitchen,
  RoomType.Utility,
  RoomType.Storage,
  RoomType.OTS,
  RoomType.Dressing
]);
var DISTRIBUTION = /* @__PURE__ */ new Set([RoomType.Corridor, RoomType.Foyer, RoomType.Staircase, RoomType.Lift, RoomType.Porch]);

// packages/planning-engine/dist/generation/workflow.js
var GENERATION_STAGES = Object.freeze([
  { id: "validate_inputs", label: "Validate approved inputs", detail: "Checks Site, Program, Footprint, category and engine compatibility." },
  { id: "prepare_program", label: "Prepare room instances", detail: "Preserves reviewed quantities and room-area targets." },
  { id: "generate_candidates", label: "Generate and repair options", detail: "Runs deterministic allocation, geometry, repair and quality evaluation." },
  { id: "validate_candidates", label: "Validate against footprint", detail: "Rechecks every room against its approved per-floor boundary." },
  { id: "rank_options", label: "Rank design options", detail: "Orders candidates using calculated architectural, graph and multi-floor evidence." }
]);

// packages/planning-engine/dist/interpretation/extraction-analysis.js
function normalizationScales(metadata, site) {
  if (metadata.imageWidePixels <= 0 || metadata.imageTallPixels <= 0)
    return null;
  if (site.plotWidth <= 0 || site.plotDepth <= 0)
    return null;
  return {
    scaleX: site.plotWidth / metadata.imageWidePixels,
    scaleY: site.plotDepth / metadata.imageTallPixels
  };
}
function normalizeExtractedPlan(extracted, site) {
  const scales = normalizationScales(extracted.metadata, site);
  if (!scales) {
    return {
      normalized: null,
      diagnostics: [{
        code: "NORMALIZATION_FAILED_ZERO_DIMENSIONS",
        severity: "error",
        message: "The source image or plot dimensions are invalid, so image coordinates cannot be mapped to real-world millimetres."
      }]
    };
  }
  const imageAspect = extracted.metadata.imageWidePixels / extracted.metadata.imageTallPixels;
  const plotAspect = site.plotWidth / site.plotDepth;
  const aspectMismatchRatio = Math.abs(imageAspect - plotAspect) / plotAspect;
  const diagnostics = [];
  if (aspectMismatchRatio > 0.05) {
    diagnostics.push({
      code: "NORMALIZATION_ASPECT_MISMATCH",
      severity: "warning",
      message: `The source image aspect ratio ${imageAspect.toFixed(3)} does not match the plot aspect ratio ${plotAspect.toFixed(3)}. Extracted geometry may be distorted and requires review.`
    });
  }
  return {
    normalized: {
      ...extracted,
      metadata: {
        ...extracted.metadata,
        aspectMismatchRatio,
        orientationDegrees: site.orientation,
        roadFacing: site.roadFacing,
        normalizedAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    },
    diagnostics
  };
}
function imageRectToMillimetres(rect, metadata, site) {
  const scales = normalizationScales(metadata, site);
  if (!scales)
    return null;
  return {
    x: rect.imageX * scales.scaleX,
    y: rect.imageY * scales.scaleY,
    width: rect.imageWidth * scales.scaleX,
    height: rect.imageHeight * scales.scaleY
  };
}
function extractedRoomType(typeName) {
  const name = typeName.trim().toLowerCase();
  if (name.includes("bedroom") || name.includes("bed"))
    return "bedroom";
  if (name.includes("bath") || name.includes("wash") || name.includes("toilet") || name.includes("wc") || name.includes("ensuite"))
    return "bathroom";
  if (name.includes("kitchen"))
    return "kitchen";
  if (name.includes("living") || name.includes("drawing") || name.includes("family") || name.includes("sitting") || name.includes("parlor"))
    return "living";
  if (name.includes("dining"))
    return "dining";
  if (name.includes("hall") && !name.includes("stair") && !name.includes("toilet") && !name.includes("bath"))
    return "living";
  if (name.includes("stair"))
    return "staircase";
  if (name.includes("stair"))
    return "staircase";
  if (name.includes("parking") || name.includes("car") || name.includes("garage") || name.includes("bay"))
    return "parking";
  if (name.includes("porch") || name.includes("verandah") || name.includes("entry") || name.includes("foyer"))
    return "foyer";
  if (name.includes("roof") || name.includes("terrace") || name.includes("balcon") || name.includes("open"))
    return "balcony";
  if (name.includes("pooja") || name.includes("puja") || name.includes("prayer") || name.includes("meditation"))
    return "pooja";
  if (name.includes("study") || name.includes("office") || name.includes("work"))
    return "study";
  if (name.includes("utility") || name.includes("store"))
    return "utility";
  if (name.includes("courtyard") || name.includes("court") || name.includes("garden"))
    return "garden";
  return "living";
}
function inspectExtractionStructure(plan) {
  const issues = [];
  if (plan.boundary.points.length < 3) {
    issues.push({ code: "EXTRACTION_BOUNDARY_DEGENERATE", severity: "error", message: "The image interpretation produced no usable building boundary." });
  }
  for (const room of plan.rooms) {
    if (room.imageWidth <= 0 || room.imageHeight <= 0) {
      issues.push({ code: "EXTRACTION_ROOM_DEGENERATE", severity: "error", message: `Room "${room.name}" has a degenerate image-extracted rectangle.` });
    }
  }
  for (const door of plan.doors) {
    if (!plan.rooms.some((room) => room.id === door.adjacentRoomId)) {
      issues.push({ code: "EXTRACTION_DOOR_NO_ROOM", severity: "warning", message: `Door "${door.id}" references an adjacent room that was not detected in the image.` });
    }
  }
  return issues;
}

// packages/planning-engine/dist/interpretation/extraction-building.js
var DOOR_TYPE = {
  open_passage: "open_passage",
  double: "double",
  sliding: "sliding",
  single: "single",
  unknown: "single"
};
function extractPlanToBuilding(extracted, site, projectId, name) {
  const diagnostics = [];
  const siteRect = { plotWidth: site.plotWidth, plotDepth: site.plotDepth };
  const wide = extracted.metadata.imageWidePixels;
  const tall = extracted.metadata.imageTallPixels;
  const boundaryPolygon = {
    points: extracted.boundary.points.map((point) => ({
      x: point.x / wide * site.plotWidth,
      y: point.y / tall * site.plotDepth
    }))
  };
  if (boundaryPolygon.points.length < 3) {
    return {
      building: null,
      diagnostics: [{
        code: "EXTRACTION_BOUNDARY_DEGENERATE",
        severity: "error",
        message: "The extracted boundary has fewer than three points and cannot define a building."
      }]
    };
  }
  const base = createBuilding({
    projectId,
    name,
    site: {
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      plotShape: PlotShape.Rectangular,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      setbacks: {
        front: site.frontSetback,
        rear: site.rearSetback,
        left: site.leftSetback,
        right: site.rightSetback
      }
    },
    floors: [{ buildingId: "floor-extracted", level: 0, name: "Ground Floor", boundary: boundaryPolygon }]
  });
  const floorId = base.floors[0].id;
  let building = base;
  const appendRoom = (id, roomName, type, rect, fixed) => {
    const real = imageRectToMillimetres(rect, extracted.metadata, siteRect);
    if (!real)
      return;
    const minArea = MINIMUM_ROOM_AREAS[type];
    const minDimension = MINIMUM_DIMENSIONS[type];
    const privacy = type === "bedroom" || type === "bathroom" ? "high" : "low";
    building = {
      ...building,
      floors: building.floors.map((floor) => floor.level === 0 ? {
        ...floor,
        rooms: [
          ...floor.rooms,
          createRoom({
            floorId,
            name: roomName,
            type,
            x: real.x,
            y: real.y,
            width: real.width,
            height: real.height,
            tags: [`extracted:${id}`],
            ...minArea !== void 0 ? { minArea } : {},
            ...minDimension !== void 0 ? { minWidthMm: minDimension, minHeightMm: minDimension } : {},
            daylightRequirement: "medium",
            privacyRequirement: privacy,
            isFixed: fixed
          })
        ]
      } : floor)
    };
  };
  for (const room of extracted.rooms) {
    appendRoom(room.id, room.name, extractedRoomType(room.type || room.name), room, false);
  }
  for (const stair of extracted.stairs) {
    appendRoom(stair.id, stair.name, "staircase", stair, true);
  }
  for (const park of extracted.parking) {
    appendRoom(park.id, park.name, "parking", park, false);
  }
  return { building, diagnostics };
}
function attachExtractedOpenings(building, extracted, site) {
  const diagnostics = [];
  const floorId = building.floors[0].id;
  let next = building;
  for (const door of extracted.doors) {
    const adjacent = next.floors[0].rooms.find((room) => room.tags.includes(`extracted:${door.adjacentRoomId}`));
    const real = imageRectToMillimetres(door, extracted.metadata, site);
    if (!adjacent || !real) {
      if (!adjacent) {
        diagnostics.push({
          code: "EXTRACTION_DOOR_SKIPPED",
          severity: "warning",
          message: `Door "${door.id}" was not attached because its adjacent room was not extracted from the image.`
        });
      }
      continue;
    }
    next = {
      ...next,
      floors: next.floors.map((floor) => floor.level === 0 ? {
        ...floor,
        doors: [
          ...floor.doors,
          {
            id: door.id,
            floorId,
            wallId: "__extracted__",
            position: { x: real.x, y: real.y },
            width: real.width,
            height: 2100,
            type: DOOR_TYPE[door.type] ?? "single",
            swingDirection: door.swingDirection === "outward" ? "outward" : door.swingDirection === "left" ? "left" : door.swingDirection === "right" ? "right" : "inward",
            connectsRooms: [adjacent.id, "__outside__"]
          }
        ]
      } : floor)
    };
  }
  for (const window of extracted.windows) {
    const adjacent = next.floors[0].rooms.find((room) => room.tags.includes(`extracted:${window.adjacentRoomId}`));
    const real = imageRectToMillimetres(window, extracted.metadata, site);
    if (!adjacent || !real)
      continue;
    next = {
      ...next,
      floors: next.floors.map((floor) => floor.level === 0 ? {
        ...floor,
        windows: [
          ...floor.windows,
          {
            id: window.id,
            floorId,
            wallId: "__extracted__",
            position: { x: real.x, y: real.y },
            width: real.width,
            height: Math.max(600, real.height),
            sillHeight: 900,
            type: "sliding",
            roomId: adjacent.id
          }
        ]
      } : floor)
    };
  }
  return { building: next, diagnostics };
}

// packages/planning-engine/dist/interpretation/extraction-validation.js
function validateExtractedPlan(building, extracted, requirements) {
  const diagnostics = evaluateDesign(building, { requiredRoomTypes: ["living", "bedroom"] });
  const issues = [];
  if (!diagnostics.geometryHealthy) {
    issues.push({
      code: "EXTRACTION_GEOMETRY_UNHEALTHY",
      severity: "error",
      message: "The extracted plan fails the deterministic geometry health check. It cannot be installed as a canonical 2D plan."
    });
  }
  for (const warning of diagnostics.warnings) {
    if (warning.severity === "error") {
      issues.push({ code: "EXTRACTION_GEOMETRY_ERROR", severity: "error", message: warning.message });
    }
  }
  const allRooms = building.floors.flatMap((floor) => floor.rooms);
  const collisions = allRooms.flatMap((room) => detectRoomCollisions(room, allRooms));
  if (collisions.length > 0) {
    const sample = collisions.slice(0, 5).map((collision) => [collision.entityA, collision.entityB].join(", ")).join("; ");
    issues.push({
      code: "EXTRACTION_ROOM_COLLISIONS",
      severity: "error",
      message: `Detected ${collisions.length} room collision(s): ${sample}${collisions.length > 5 ? " ..." : ""}.`
    });
  }
  const extractedCounts = {};
  for (const room of extracted.rooms) {
    const type = extractedRoomType(room.type || room.name);
    extractedCounts[type] = (extractedCounts[type] ?? 0) + 1;
  }
  const requiredFields = [
    ["bedroom", requirements.hard.bedroomCount],
    ["bathroom", requirements.hard.bathroomCount],
    ["living", requirements.hard.livingRoomRequired ? 1 : 0],
    ["kitchen", requirements.hard.kitchenRequired ? 1 : 0],
    ["dining", requirements.hard.diningRoomRequired ? 1 : 0],
    ["parking", requirements.hard.parkingSpacesCount]
  ];
  for (const [type, required] of requiredFields) {
    const extractedCount = extractedCounts[type] ?? 0;
    if (required > 0 && extractedCount < required) {
      issues.push({
        code: "EXTRACTION_MISSING_REQUIRED_ROOMS",
        severity: "error",
        message: `The extracted plan has ${extractedCount} ${type} room(s) but the requirements requested ${required}. The request was not relaxed.`
      });
    }
  }
  const outOfBounds = building.floors.flatMap((currentFloor) => currentFloor.rooms).filter((room) => !building.floors.some((floor) => floor.rooms.includes(room) && containsPolygon(floor.boundary, room.boundary)));
  if (outOfBounds.length > 0) {
    issues.push({
      code: "EXTRACTION_ROOMS_OUT_OF_BOUNDS",
      severity: "error",
      message: `${outOfBounds.length} room(s) fall outside their floor boundary.`
    });
  }
  const isValid = issues.length === 0 && diagnostics.geometryHealthy && outOfBounds.length === 0;
  const recommendedForEditing = isValid && allRooms.some((room) => room.type === "bedroom");
  return {
    isValid,
    recommendedForEditing,
    geometryHealthy: diagnostics.geometryHealthy,
    overallScore: diagnostics.overallScore,
    verificationIssues: issues
  };
}

// packages/planning-engine/dist/interpretation/extraction-parser.js
function asRecord2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function num(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function str(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}
function pointList(value) {
  if (!Array.isArray(value) || value.length < 3)
    return null;
  const points = [];
  for (const entry of value) {
    const record = asRecord2(entry);
    const x = record ? num(record.x) : null;
    const y = record ? num(record.y) : null;
    if (x === null || y === null)
      return null;
    points.push({ x, y });
  }
  return { points };
}
var DOOR_TYPES = /* @__PURE__ */ new Set(["single", "double", "sliding", "open_passage", "unknown"]);
var SWINGS = /* @__PURE__ */ new Set(["inward", "outward", "left", "right", "unknown"]);
function createExtractionMetadata(params) {
  const imageAspectRatio = params.imageTallPixels > 0 ? params.imageWidePixels / params.imageTallPixels : 0;
  const plotAspectRatio = params.plotDepth > 0 ? params.plotWidth / params.plotDepth : 0;
  return {
    imageWidePixels: params.imageWidePixels,
    imageTallPixels: params.imageTallPixels,
    imageAspectRatio,
    plotAspectRatio,
    aspectMismatchRatio: plotAspectRatio > 0 ? Math.abs(imageAspectRatio - plotAspectRatio) / plotAspectRatio : 0,
    orientationDegrees: params.orientation,
    roadFacing: params.roadFacing,
    extractionSource: params.extractionSource,
    confidence: params.confidence,
    normalizedAt: ""
  };
}
function parseExtractionPayload(payload, metadata, planId) {
  const diagnostics = [];
  const source = asRecord2(payload);
  if (!source) {
    return { plan: null, diagnostics: [{ code: "EXTRACTION_PAYLOAD_INVALID", severity: "error", message: "The vision response was not a JSON object." }] };
  }
  const boundary = pointList(asRecord2(source.boundary)?.points);
  if (!boundary) {
    return { plan: null, diagnostics: [{ code: "EXTRACTION_PAYLOAD_BOUNDARY_INVALID", severity: "error", message: "The vision response did not contain a valid building boundary polygon." }] };
  }
  const rooms = [];
  for (const entry of Array.isArray(source.rooms) ? source.rooms : []) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const id = str(record.id);
    const name = str(record.name);
    const type = str(record.type) ?? name;
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || !name || !type || x === null || y === null || width === null || height === null) {
      diagnostics.push({ code: "EXTRACTION_ROOM_SKIPPED", severity: "warning", message: `Room "${name ?? id ?? "unknown"}" was skipped because its geometry was incomplete.` });
      continue;
    }
    if (width <= 0 || height <= 0) {
      diagnostics.push({ code: "EXTRACTION_ROOM_SKIPPED", severity: "warning", message: `Room "${name}" was skipped because its extracted size was not positive.` });
      continue;
    }
    const flatId = str(record.flatId);
    rooms.push({
      id,
      name,
      type,
      imageX: x,
      imageY: y,
      imageWidth: width,
      imageHeight: height,
      imageArea: width * height,
      imageMinWidth: width,
      imageMinHeight: height,
      ...flatId ? { flatId } : {}
    });
  }
  if (rooms.length === 0) {
    return { plan: null, diagnostics: [...diagnostics, { code: "EXTRACTION_NO_ROOMS", severity: "error", message: "The vision response contained no usable rooms." }] };
  }
  const doors = [];
  for (const entry of Array.isArray(source.doors) ? source.doors : []) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const id = str(record.id);
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    const adjacentRoomId = str(record.adjacentRoomId);
    if (!id || x === null || y === null || width === null || height === null || !adjacentRoomId)
      continue;
    const rawType = str(record.type) ?? "unknown";
    const rawSwing = str(record.swingDirection) ?? "unknown";
    doors.push({
      id,
      imageX: x,
      imageY: y,
      imageWidth: width,
      imageHeight: height,
      type: DOOR_TYPES.has(rawType) ? rawType : "unknown",
      swingDirection: SWINGS.has(rawSwing) ? rawSwing : "unknown",
      connectsRooms: [adjacentRoomId],
      adjacentRoomId
    });
  }
  const windows = [];
  for (const entry of Array.isArray(source.windows) ? source.windows : []) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const id = str(record.id);
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    const adjacentRoomId = str(record.adjacentRoomId);
    if (!id || x === null || y === null || width === null || height === null || !adjacentRoomId)
      continue;
    windows.push({ id, imageX: x, imageY: y, imageWidth: width, imageHeight: height, adjacentRoomId });
  }
  const stairs = [];
  for (const entry of Array.isArray(source.stairs) ? source.stairs : []) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const id = str(record.id);
    const name = str(record.name) ?? "Staircase";
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || x === null || y === null || width === null || height === null)
      continue;
    const flatId = str(record.flatId);
    stairs.push({ id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height, ...flatId ? { flatId } : {} });
  }
  const parking = [];
  for (const entry of Array.isArray(source.parking) ? source.parking : []) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const id = str(record.id);
    const name = str(record.name) ?? "Parking";
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || x === null || y === null || width === null || height === null)
      continue;
    parking.push({ id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height });
  }
  const apartment = Array.isArray(source.flats) ? {
    flats: parseFlats(source.flats, diagnostics),
    lifts: parseCoreElements(source.lifts, "Lift", diagnostics),
    lobbies: parseCoreElements(source.lobbies, "Lobby", diagnostics),
    corridors: parseCoreElements(source.corridors, "Corridor", diagnostics),
    shafts: parseCoreElements(source.shafts, "Shaft", diagnostics)
  } : {};
  return {
    plan: { id: planId, boundary, rooms, doors, windows, stairs, parking, ...apartment, metadata },
    diagnostics
  };
}
function parseFlats(value, diagnostics) {
  const flats = [];
  for (const entry of Array.isArray(value) ? value : []) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const id = str(record.id);
    const label = str(record.label) ?? id;
    const unitType = str(record.unitType);
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || !label || x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
      diagnostics.push({ code: "EXTRACTION_FLAT_SKIPPED", severity: "warning", message: `Flat "${label ?? id ?? "unknown"}" was skipped because its boundary was incomplete.` });
      continue;
    }
    flats.push({ id, label, unitType: unitType ?? "", imageX: x, imageY: y, imageWidth: width, imageHeight: height });
  }
  return flats;
}
function parseCoreElements(value, fallbackName, diagnostics) {
  const elements = [];
  for (const entry of Array.isArray(value) ? value : []) {
    const record = asRecord2(entry);
    if (!record)
      continue;
    const id = str(record.id);
    const name = str(record.name) ?? fallbackName;
    const x = num(record.x);
    const y = num(record.y);
    const width = num(record.width);
    const height = num(record.height);
    if (!id || x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
      diagnostics.push({ code: "EXTRACTION_CORE_ELEMENT_SKIPPED", severity: "warning", message: `${fallbackName} "${name}" was skipped because its geometry was incomplete.` });
      continue;
    }
    const flatId = str(record.flatId);
    elements.push({ id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height, ...flatId ? { flatId } : {} });
  }
  return elements;
}

// packages/planning-engine/dist/interpretation/apartment-plan.js
var APARTMENT_COMMON_FLAT_ID = "COMMON";
var CORE_ROLES = /* @__PURE__ */ new Set(["lift", "stair", "lobby", "corridor"]);
function apartmentRoomRoles(label) {
  const n = ` ${label.toLowerCase().replace(/[_/&,.()-]+/g, " ").replace(/\s+/g, " ").trim()} `;
  const has = (...words) => words.some((w) => n.includes(w));
  if (has(" lift", "elevator"))
    return ["lift"];
  if (has("stair"))
    return ["stair"];
  if (has("passage", "hallway", "private lobby", "private corridor", "internal corridor"))
    return ["passage"];
  if (has("lobby"))
    return ["lobby"];
  if (has("corridor"))
    return ["corridor"];
  if (has("duct", "shaft", " ots ", " ots", "vent", "void"))
    return ["shaft"];
  if (has("toilet", "bath", " wc", "powder", "ensuite", "en suite", "washroom", "lavatory"))
    return ["bathroom"];
  if (has("bed", "guest room"))
    return ["bedroom"];
  const roles = [];
  if (has("living", "drawing", " hall "))
    roles.push("living");
  if (has("dining"))
    roles.push("dining");
  if (roles.length > 0)
    return roles;
  if (has("kitchen"))
    return ["kitchen"];
  if (has("utility", "wash", "dry balc", "service balc", "ser bal"))
    return ["utility"];
  if (has("balcon", "sit out", "sitout", "terrace", "deck"))
    return ["balcony"];
  if (has("foyer", "entry", "entrance"))
    return ["foyer"];
  if (has("pooja", "puja", "prayer"))
    return ["pooja"];
  if (has("study", "office"))
    return ["study"];
  if (has("store", "storage"))
    return ["storage"];
  return ["other"];
}
var ROLE_ROOM_TYPE = {
  bedroom: RoomType.Bedroom,
  bathroom: RoomType.Bathroom,
  living: RoomType.Living,
  dining: RoomType.Dining,
  kitchen: RoomType.Kitchen,
  utility: RoomType.Utility,
  balcony: RoomType.Balcony,
  foyer: RoomType.Foyer,
  pooja: RoomType.Pooja,
  study: RoomType.Study,
  storage: RoomType.Storage,
  passage: RoomType.Corridor,
  lift: RoomType.Lift,
  stair: RoomType.Staircase,
  lobby: RoomType.Corridor,
  corridor: RoomType.Corridor,
  shaft: RoomType.ServiceShaft,
  other: RoomType.Custom
};
function normalizeApartmentUnitType(value) {
  return value.toUpperCase().replace(/[\s_-]+/g, "");
}
function bhkBedrooms(unitType) {
  const match = /^(\d+)BHK$/.exec(normalizeApartmentUnitType(unitType));
  return match ? Number(match[1]) : null;
}
function area(r) {
  return Math.max(0, r.width) * Math.max(0, r.height);
}
function overlapArea(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}
var FLAT_OVERLAP_TOLERANCE = 0.01;
var ROOM_CONTAINMENT_MIN = 0.95;
var CORE_INSIDE_FLAT_TOLERANCE = 0.1;
function extractedPlanToApartmentStructure(plan, site, frame) {
  if (!plan.flats) {
    return {
      structure: null,
      diagnostics: [{
        code: "APARTMENT_INTERPRETATION_STRUCTURE_MISSING",
        severity: "error",
        message: "The interpretation has no apartment structure (flats/core); it cannot be validated as an apartment plan."
      }]
    };
  }
  if (frame.width <= 0 || frame.height <= 0 || site.plotWidth <= 0 || site.plotDepth <= 0) {
    return {
      structure: null,
      diagnostics: [{ code: "NORMALIZATION_FAILED_ZERO_DIMENSIONS", severity: "error", message: "Image frame or plot dimensions are invalid." }]
    };
  }
  const sx = site.plotWidth / frame.width;
  const sy = site.plotDepth / frame.height;
  const toMm = (r) => ({
    x: r.imageX * sx,
    y: r.imageY * sy,
    width: r.imageWidth * sx,
    height: r.imageHeight * sy
  });
  const element = (e) => ({
    id: e.id,
    name: e.name,
    rect: toMm(e),
    assignedFlatId: e.flatId && e.flatId !== APARTMENT_COMMON_FLAT_ID ? e.flatId : null
  });
  const flatIds = new Set(plan.flats.map((f) => f.id));
  const roomsByFlat = /* @__PURE__ */ new Map();
  const commonRooms = [];
  const ungroupedRooms = [];
  for (const room of plan.rooms) {
    const mapped = { id: room.id, name: room.name, type: room.type || room.name, rect: toMm(room) };
    if (room.flatId === APARTMENT_COMMON_FLAT_ID)
      commonRooms.push(mapped);
    else if (room.flatId && flatIds.has(room.flatId)) {
      roomsByFlat.set(room.flatId, [...roomsByFlat.get(room.flatId) ?? [], mapped]);
    } else
      ungroupedRooms.push({ room: mapped, flatId: room.flatId ?? null });
  }
  return {
    structure: {
      source: "IMAGE_INTERPRETATION",
      boundary: plan.boundary.points.map((p) => ({ x: p.x * sx, y: p.y * sy })),
      flats: plan.flats.map((f) => ({
        id: f.id,
        label: f.label,
        unitType: f.unitType,
        rect: toMm(f),
        rooms: roomsByFlat.get(f.id) ?? []
      })),
      commonRooms,
      ungroupedRooms,
      lifts: (plan.lifts ?? []).map(element),
      stairs: plan.stairs.map(element),
      lobbies: (plan.lobbies ?? []).map(element),
      corridors: (plan.corridors ?? []).map(element),
      shafts: (plan.shafts ?? []).map(element),
      openings: [
        ...plan.doors.map((d) => ({
          id: d.id,
          kind: "door",
          rect: toMm(d),
          adjacentRoomId: d.adjacentRoomId,
          doorType: d.type,
          swingDirection: d.swingDirection
        })),
        ...plan.windows.map((w) => ({ id: w.id, kind: "window", rect: toMm(w), adjacentRoomId: w.adjacentRoomId }))
      ]
    },
    diagnostics: []
  };
}
var DAY_ROLES = /* @__PURE__ */ new Set(["living", "dining", "kitchen"]);
function roomRoles(room) {
  const byType = apartmentRoomRoles(room.type);
  if (byType[0] === "other")
    return apartmentRoomRoles(room.name);
  if (byType.every((r) => DAY_ROLES.has(r))) {
    const extra = apartmentRoomRoles(room.name).filter((r) => (r === "living" || r === "dining") && !byType.includes(r));
    return [...byType, ...extra];
  }
  return byType;
}
function roleCounts(rooms) {
  const counts = {};
  for (const room of rooms)
    for (const role of roomRoles(room))
      counts[role] = (counts[role] ?? 0) + 1;
  return counts;
}
function validateApartmentStructure(structure, expectation) {
  const completeness = [];
  const manifest = [];
  const structural = [];
  const err = (bucket, code, message) => bucket.push({ code, severity: "error", message });
  if (structure.boundary.length < 3)
    err(completeness, "APARTMENT_BOUNDARY_MISSING", "No usable building boundary polygon.");
  if (structure.flats.length === 0)
    err(completeness, "APARTMENT_NO_FLATS", "No apartment units (flats) were identified.");
  const seen = /* @__PURE__ */ new Set();
  for (const flat of structure.flats) {
    if (seen.has(flat.id))
      err(completeness, "APARTMENT_FLAT_ID_DUPLICATE", `Flat id "${flat.id}" appears more than once.`);
    seen.add(flat.id);
    if (!flat.unitType.trim())
      err(completeness, "APARTMENT_FLAT_UNIT_TYPE_MISSING", `${flat.label} has no unit type.`);
    if (area(flat.rect) <= 0)
      err(completeness, "APARTMENT_FLAT_BOUNDARY_DEGENERATE", `${flat.label} has no usable boundary.`);
    if (flat.rooms.length === 0)
      err(completeness, "APARTMENT_FLAT_EMPTY", `${flat.label} has no rooms assigned to it.`);
  }
  for (const { room, flatId } of structure.ungroupedRooms) {
    err(completeness, "APARTMENT_ROOM_UNGROUPED", `Room "${room.name}" is not assigned to a flat or to common space (flatId: ${flatId ?? "missing"}).`);
  }
  if (structure.flats.length !== expectation.flats) {
    err(manifest, "APARTMENT_FLAT_COUNT_MISMATCH", `Requested ${expectation.flats} flat(s), plan has ${structure.flats.length}.`);
  }
  const mix = (types) => {
    const m = /* @__PURE__ */ new Map();
    for (const t of types)
      m.set(normalizeApartmentUnitType(t), (m.get(normalizeApartmentUnitType(t)) ?? 0) + 1);
    return m;
  };
  const expectedMix = mix(expectation.units.map((u) => u.unitType));
  const actualMix = mix(structure.flats.map((f) => f.unitType));
  for (const type of /* @__PURE__ */ new Set([...expectedMix.keys(), ...actualMix.keys()])) {
    const want = expectedMix.get(type) ?? 0;
    const got = actualMix.get(type) ?? 0;
    if (want !== got)
      err(manifest, "APARTMENT_UNIT_MIX_MISMATCH", `Requested ${want} \xD7 ${type}, plan has ${got} \xD7 ${type}.`);
  }
  if (structure.lifts.length !== expectation.lifts) {
    err(manifest, "APARTMENT_LIFT_COUNT_MISMATCH", `Requested ${expectation.lifts} lift(s), plan has ${structure.lifts.length}.`);
  }
  if (structure.stairs.length !== expectation.stairs) {
    err(manifest, "APARTMENT_STAIR_COUNT_MISMATCH", `Requested ${expectation.stairs} stair(s), plan has ${structure.stairs.length}.`);
  }
  if (expectation.commonLobby && structure.lobbies.length === 0) {
    err(manifest, "APARTMENT_COMMON_LOBBY_MISSING", "A common lobby is required but none is present.");
  }
  for (const el of [...structure.lifts, ...structure.stairs]) {
    if (el.assignedFlatId) {
      err(structural, "APARTMENT_CORE_ASSIGNED_TO_UNIT", `Core element "${el.name}" is assigned to flat "${el.assignedFlatId}"; lifts and stairs must be common space.`);
    }
  }
  for (const flat of structure.flats) {
    for (const room of flat.rooms) {
      const roles = roomRoles(room);
      if (roles.some((r) => CORE_ROLES.has(r))) {
        err(structural, "APARTMENT_CORE_ASSIGNED_TO_UNIT", `"${room.name}" is common circulation/core but is assigned to ${flat.label}.`);
      }
      const inside = area(room.rect) > 0 ? overlapArea(room.rect, flat.rect) / area(room.rect) : 0;
      if (inside < ROOM_CONTAINMENT_MIN) {
        err(structural, "APARTMENT_ROOM_OUTSIDE_UNIT", `"${room.name}" lies outside the ${flat.label} boundary (${Math.round(inside * 100)}% inside).`);
      }
    }
  }
  for (let i = 0; i < structure.flats.length; i++) {
    for (let j = i + 1; j < structure.flats.length; j++) {
      const a = structure.flats[i];
      const b = structure.flats[j];
      const smaller = Math.min(area(a.rect), area(b.rect));
      const ov = overlapArea(a.rect, b.rect);
      if (smaller <= 0 || ov / smaller > FLAT_OVERLAP_TOLERANCE) {
        err(structural, "APARTMENT_UNITS_NOT_SEPARATED", `${a.label} and ${b.label} overlap (${smaller > 0 ? Math.round(ov / smaller * 100) : 100}%); no party-wall separation between units.`);
      }
    }
  }
  for (const el of [...structure.lifts, ...structure.stairs, ...structure.lobbies]) {
    for (const flat of structure.flats) {
      const elArea = area(el.rect);
      if (elArea > 0 && overlapArea(el.rect, flat.rect) / elArea > CORE_INSIDE_FLAT_TOLERANCE) {
        err(structural, "APARTMENT_CORE_INSIDE_UNIT", `Common element "${el.name}" lies inside ${flat.label}.`);
      }
    }
  }
  const pool = /* @__PURE__ */ new Map();
  for (const unit of expectation.units) {
    const key = normalizeApartmentUnitType(unit.unitType);
    pool.set(key, [...pool.get(key) ?? [], unit]);
  }
  const bedroomsByFlat = {};
  for (const flat of structure.flats) {
    const counts = roleCounts(flat.rooms);
    const beds = counts.bedroom ?? 0;
    bedroomsByFlat[flat.id] = beds;
    const declared = bhkBedrooms(flat.unitType);
    if (declared !== null && declared !== beds) {
      err(structural, "APARTMENT_UNIT_TYPE_PROGRAM_MISMATCH", `${flat.label} is labelled ${flat.unitType} but has ${beds} bedroom(s).`);
    }
    const expected = pool.get(normalizeApartmentUnitType(flat.unitType))?.shift();
    if (!expected)
      continue;
    if (beds !== expected.bedrooms) {
      err(structural, "APARTMENT_UNIT_BEDROOM_MISMATCH", `${flat.label} (${flat.unitType}) has ${beds} bedroom(s); manifest requires ${expected.bedrooms}.`);
    }
    const minima = [
      ["bathroom", expected.bathrooms, "error"],
      ["living", expected.livingRooms, "error"],
      ["dining", expected.diningRooms, "error"],
      ["kitchen", expected.kitchens, "error"],
      ["utility", expected.utilities, "warning"],
      ["balcony", expected.balconies, "warning"]
    ];
    for (const [role, required, severity] of minima) {
      const got = counts[role] ?? 0;
      if (got < required) {
        structural.push({
          code: severity === "error" ? "APARTMENT_UNIT_ROOM_SHORTFALL" : "APARTMENT_UNIT_OPTIONAL_ROOM_SHORTFALL",
          severity,
          message: `${flat.label} (${flat.unitType}) has ${got} ${role} space(s); manifest lists ${required}.`
        });
      }
    }
  }
  const status = (bucket) => bucket.some((i) => i.severity === "error") ? "FAIL" : "PASS";
  const issues = [...completeness, ...manifest, ...structural];
  return {
    isValid: !issues.some((i) => i.severity === "error"),
    stages: { completeness: status(completeness), manifestMatch: status(manifest), structural: status(structural) },
    counts: {
      flats: structure.flats.length,
      unitTypes: structure.flats.map((f) => normalizeApartmentUnitType(f.unitType)),
      lifts: structure.lifts.length,
      stairs: structure.stairs.length,
      lobbies: structure.lobbies.length,
      bedroomsByFlat
    },
    issues
  };
}
var DOOR_TYPE2 = {
  open_passage: "open_passage",
  double: "double",
  sliding: "sliding",
  single: "single",
  unknown: "single"
};
function apartmentStructureToBuilding(structure, site, projectId, name) {
  const diagnostics = [];
  const base = createBuilding({
    projectId,
    name,
    site: {
      plotWidth: site.plotWidth,
      plotDepth: site.plotDepth,
      plotShape: PlotShape.Rectangular,
      orientation: site.orientation,
      roadFacing: site.roadFacing,
      setbacks: { front: site.frontSetback, rear: site.rearSetback, left: site.leftSetback, right: site.rightSetback }
    },
    floors: [{
      buildingId: "floor-apartment",
      level: 0,
      name: "Typical Residential Floor",
      boundary: { points: structure.boundary.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) })) }
    }]
  });
  const floorId = base.floors[0].id;
  const sourceTag = `source:${structure.source.toLowerCase()}`;
  const rooms = [];
  const add = (id, roomName, type, rect, tags, fixed) => {
    const x = Math.round(rect.x);
    const y = Math.round(rect.y);
    const width = Math.round(rect.x + rect.width) - x;
    const height = Math.round(rect.y + rect.height) - y;
    const minArea = MINIMUM_ROOM_AREAS[type];
    const minDimension = MINIMUM_DIMENSIONS[type];
    rooms.push(createRoom({
      floorId,
      name: roomName,
      type,
      x,
      y,
      width,
      height,
      tags: [`apt-room:${id}`, sourceTag, ...tags],
      ...minArea !== void 0 ? { minArea } : {},
      ...minDimension !== void 0 ? { minWidthMm: minDimension, minHeightMm: minDimension } : {},
      daylightRequirement: "medium",
      privacyRequirement: type === RoomType.Bedroom || type === RoomType.Bathroom ? "high" : "low",
      isFixed: fixed
    }));
  };
  for (const flat of structure.flats) {
    const unitTag = `unit-type:${normalizeApartmentUnitType(flat.unitType)}`;
    for (const room of flat.rooms) {
      const type = ROLE_ROOM_TYPE[roomRoles(room)[0] ?? "other"];
      add(room.id, `${flat.label} ${room.name}`, type, room.rect, [`flat:${flat.id}`, unitTag], false);
    }
  }
  for (const room of structure.commonRooms) {
    add(room.id, room.name, ROLE_ROOM_TYPE[roomRoles(room)[0] ?? "other"], room.rect, ["common:room"], false);
  }
  for (const el of structure.lifts)
    add(el.id, el.name, RoomType.Lift, el.rect, ["core:lift"], true);
  for (const el of structure.stairs)
    add(el.id, el.name, RoomType.Staircase, el.rect, ["core:stair"], true);
  for (const el of structure.lobbies)
    add(el.id, el.name, RoomType.Corridor, el.rect, ["core:lobby"], true);
  for (const el of structure.corridors)
    add(el.id, el.name, RoomType.Corridor, el.rect, ["core:corridor"], true);
  for (const el of structure.shafts)
    add(el.id, el.name, RoomType.ServiceShaft, el.rect, ["core:shaft"], true);
  const doors = [];
  const windows = [];
  for (const opening of structure.openings) {
    const adjacent = rooms.find((r) => r.tags.includes(`apt-room:${opening.adjacentRoomId}`));
    if (!adjacent) {
      diagnostics.push({
        code: "APARTMENT_OPENING_SKIPPED",
        severity: "warning",
        message: `${opening.kind === "door" ? "Door" : "Window"} "${opening.id}" was not attached: adjacent room "${opening.adjacentRoomId}" is not in the plan.`
      });
      continue;
    }
    const position = { x: Math.round(opening.rect.x), y: Math.round(opening.rect.y) };
    const otherId = opening.connects?.find((id) => id !== opening.adjacentRoomId);
    const other = otherId ? rooms.find((r) => r.tags.includes(`apt-room:${otherId}`)) : void 0;
    if (opening.kind === "door") {
      doors.push({
        id: opening.id,
        floorId,
        wallId: "__extracted__",
        position,
        // The opening's long side is the door width (a door in a vertical wall is tall and thin).
        width: Math.max(1, Math.round(Math.max(opening.rect.width, opening.rect.height))),
        height: 2100,
        type: DOOR_TYPE2[opening.doorType ?? "unknown"] ?? "single",
        swingDirection: ["outward", "left", "right"].includes(opening.swingDirection ?? "") ? opening.swingDirection : "inward",
        connectsRooms: [adjacent.id, other?.id ?? "__outside__"]
      });
    } else {
      windows.push({
        id: opening.id,
        floorId,
        wallId: "__extracted__",
        position,
        width: Math.max(1, Math.round(opening.rect.width)),
        height: Math.max(600, Math.round(opening.rect.height)),
        sillHeight: 900,
        type: "sliding",
        roomId: adjacent.id
      });
    }
  }
  return {
    building: {
      ...base,
      floors: [{ ...base.floors[0], rooms, doors: [...base.floors[0].doors, ...doors], windows: [...base.floors[0].windows, ...windows] }]
    },
    diagnostics
  };
}
function measureApartmentBuilding(building) {
  const rooms = building.floors.flatMap((f) => f.rooms);
  const flats = /* @__PURE__ */ new Set();
  let lifts = 0;
  let stairs = 0;
  let lobbies = 0;
  let bedrooms = 0;
  for (const room of rooms) {
    for (const tag of room.tags) {
      if (tag.startsWith("flat:"))
        flats.add(tag);
      if (tag === "core:lift")
        lifts++;
      if (tag === "core:stair")
        stairs++;
      if (tag === "core:lobby")
        lobbies++;
    }
    if (room.type === RoomType.Bedroom && room.tags.some((t) => t.startsWith("flat:")))
      bedrooms++;
  }
  return { flats: flats.size, lifts, stairs, lobbies, bedrooms };
}
function validateCanonicalApartmentBuilding(building, expectation) {
  const diagnostics = evaluateDesign(building, { requiredRoomTypes: ["living", "bedroom"] });
  const issues = [];
  for (const warning of diagnostics.warnings) {
    if (warning.severity === "error")
      issues.push({ code: `CANONICAL_${warning.code}`, severity: "error", message: warning.message });
  }
  const rooms = building.floors.flatMap((f) => f.rooms);
  const collisions = rooms.flatMap((room) => detectRoomCollisions(room, rooms));
  if (collisions.length > 0) {
    const names = new Map(rooms.map((r) => [r.id, r.name]));
    const sample = collisions.slice(0, 4).map((c) => `${names.get(c.entityA)} \u2194 ${names.get(c.entityB)}`).join("; ");
    issues.push({ code: "CANONICAL_ROOM_COLLISIONS", severity: "error", message: `${collisions.length / 2} room overlap(s): ${sample}.` });
  }
  const floor = building.floors[0];
  const outside = floor ? floor.rooms.filter((r) => !containsPolygon(floor.boundary, r.boundary)) : [];
  if (outside.length > 0) {
    issues.push({ code: "CANONICAL_ROOMS_OUT_OF_BOUNDS", severity: "error", message: `${outside.length} room(s) fall outside the floor boundary.` });
  }
  const measured = measureApartmentBuilding(building);
  const expectedBedrooms = expectation.units.reduce((s, u) => s + u.bedrooms, 0);
  const checks = [
    ["flats", measured.flats, expectation.flats],
    ["lifts", measured.lifts, expectation.lifts],
    ["stairs", measured.stairs, expectation.stairs],
    ["bedrooms", measured.bedrooms, expectedBedrooms]
  ];
  for (const [label, got, want] of checks) {
    if (got !== want) {
      issues.push({ code: "CANONICAL_COUNT_MISMATCH", severity: "error", message: `Canonical plan has ${got} ${label}; manifest requires ${want}.` });
    }
  }
  if (expectation.commonLobby && measured.lobbies === 0) {
    issues.push({ code: "CANONICAL_COUNT_MISMATCH", severity: "error", message: "Canonical plan has no common lobby; manifest requires one." });
  }
  const isValid = issues.length === 0 && diagnostics.geometryHealthy;
  return {
    isValid,
    recommendedForEditing: isValid,
    geometryHealthy: diagnostics.geometryHealthy,
    overallScore: diagnostics.overallScore,
    verificationIssues: issues
  };
}
function runApartmentPlanValidation(input) {
  const structural = validateApartmentStructure(input.structure, input.expectation);
  if (!structural.isValid) {
    return {
      status: "REJECTED",
      source: input.structure.source,
      building: null,
      stages: { ...structural.stages, canonicalGeometry: "SKIPPED", geometryValidation: "SKIPPED" },
      counts: structural.counts,
      validation: {
        isValid: false,
        recommendedForEditing: false,
        geometryHealthy: false,
        overallScore: 0,
        verificationIssues: structural.issues
      },
      diagnostics: structural.issues
    };
  }
  const converted = apartmentStructureToBuilding(input.structure, input.site, input.projectId, input.projectName);
  const canonical = validateCanonicalApartmentBuilding(converted.building, input.expectation);
  const verificationIssues = [...structural.issues, ...canonical.verificationIssues];
  return {
    status: canonical.isValid ? "ACCEPTED" : "REJECTED",
    source: input.structure.source,
    building: canonical.isValid ? converted.building : null,
    stages: {
      ...structural.stages,
      canonicalGeometry: "PASS",
      geometryValidation: canonical.isValid ? "PASS" : "FAIL"
    },
    counts: structural.counts,
    validation: { ...canonical, verificationIssues },
    diagnostics: [...verificationIssues, ...converted.diagnostics]
  };
}

// packages/ai-orchestration/src/apartment/jurisdiction.ts
function calculateMaharashtraParking(units, visitorPercent = 0.1) {
  let residentCars = 0;
  let twoWheelers = 0;
  for (const item of units) {
    const carpetSqM = (item.carpetAreaSqFt || (item.unitType === "3BHK" ? 1100 : item.unitType === "2BHK" ? 750 : 500)) * 0.092903;
    const count = item.count || 1;
    if (carpetSqM <= 45) {
      residentCars += count * 0.5;
      twoWheelers += count * 1;
    } else if (carpetSqM <= 70) {
      residentCars += count * 1;
      twoWheelers += count * 2;
    } else {
      residentCars += count * (carpetSqM > 90 ? 2 : 1.5);
      twoWheelers += count * 2;
    }
  }
  const roundedResidentCars = Math.ceil(residentCars);
  const roundedVisitorCars = Math.ceil(roundedResidentCars * visitorPercent);
  const roundedTwoWheelers = Math.ceil(twoWheelers);
  const bicycleBays = Math.ceil(roundedResidentCars * 0.5);
  return {
    residentCars: roundedResidentCars,
    visitorCars: roundedVisitorCars,
    twoWheelers: roundedTwoWheelers,
    bicycleBays,
    formulaDescription: `Maharashtra UDCPR Table 21: Area-banded (<45m\xB2: 0.5/flat, 45-70m\xB2: 1.0/flat, >70m\xB2: 1.5-2.0/flat) + ${Math.round(visitorPercent * 100)}% visitor parking.`
  };
}
function calculateMumbaiParking(units) {
  let residentCars = 0;
  let twoWheelers = 0;
  for (const item of units) {
    const carpetSqM = (item.carpetAreaSqFt || (item.unitType === "3BHK" ? 1100 : item.unitType === "2BHK" ? 750 : 500)) * 0.092903;
    const count = item.count || 1;
    if (carpetSqM <= 45) {
      residentCars += count * 0.5;
      twoWheelers += count * 1;
    } else if (carpetSqM <= 70) {
      residentCars += count * 1;
      twoWheelers += count * 2;
    } else {
      residentCars += count * 2;
      twoWheelers += count * 2;
    }
  }
  const roundedResidentCars = Math.ceil(residentCars);
  const roundedVisitorCars = Math.ceil(roundedResidentCars * 0.15);
  const roundedTwoWheelers = Math.ceil(twoWheelers);
  const bicycleBays = Math.ceil(roundedResidentCars * 0.5);
  return {
    residentCars: roundedResidentCars,
    visitorCars: roundedVisitorCars,
    twoWheelers: roundedTwoWheelers,
    bicycleBays,
    formulaDescription: "Mumbai DCPR 2034 Table 21: Area-banded (<45m\xB2: 0.5/flat, 45-70m\xB2: 1.0/flat, >70m\xB2: 2.0/flat) + 15% visitor parking."
  };
}
function calculateGenericIndianParking(units) {
  let residentCars = 0;
  let twoWheelers = 0;
  for (const item of units) {
    const count = item.count || 1;
    const is3BhkOrLarger = item.unitType.includes("3") || item.unitType.includes("4");
    residentCars += count * (is3BhkOrLarger ? 1.5 : 1);
    twoWheelers += count * (is3BhkOrLarger ? 2 : 1);
  }
  const roundedResidentCars = Math.ceil(residentCars);
  const roundedVisitorCars = Math.ceil(roundedResidentCars * 0.1);
  const roundedTwoWheelers = Math.ceil(twoWheelers);
  return {
    residentCars: roundedResidentCars,
    visitorCars: roundedVisitorCars,
    twoWheelers: roundedTwoWheelers,
    bicycleBays: Math.ceil(roundedResidentCars * 0.5),
    formulaDescription: "NBC 2016 baseline reference: 1.0 car/2BHK, 1.5 cars/3BHK + 10% visitor parking."
  };
}
function getApartmentRulesProfile(jurisdiction, options = {}) {
  const floorCount = options.floorCount || 4;
  const heightM = options.buildingHeightM ?? floorCount * 3.1;
  const floorPlateArea = options.floorPlateAreaSqM ?? 400;
  let stairWidthM = 1;
  let secondStaircaseRequired = false;
  if (heightM > 24 || floorCount > 7 || floorPlateArea > 500) {
    stairWidthM = 1.5;
    secondStaircaseRequired = true;
  } else if (heightM > 15 || floorCount > 4 || options.tenementsPerFloor && options.tenementsPerFloor > 4) {
    stairWidthM = 1.2;
    secondStaircaseRequired = heightM > 15 && floorPlateArea > 450;
  } else {
    stairWidthM = 1;
  }
  const liftsRequired = heightM > 15 || floorCount > 4 ? floorPlateArea > 400 ? 2 : 1 : 1;
  switch (jurisdiction) {
    case "pune_pmc":
      return {
        jurisdiction: "pune_pmc",
        jurisdictionName: "Pune Municipal Corporation (PMC)",
        authority: "PMC / Urban Development Department Maharashtra",
        document: "Unified Development Control and Promotion Regulations for Maharashtra State (UDCPR-2020)",
        sourceVersion: "UDCPR-2020 updated through 30 January 2025",
        habitableRoomMinimums: {
          masterHabitableRoomMinSqM: 9.5,
          masterHabitableRoomMinWidthM: 2.4,
          otherHabitableRoomMinSqM: 7.5,
          otherHabitableRoomMinWidthM: 2.1
        },
        kitchenMinimums: { minAreaSqM: 5, minWidthM: 1.8 },
        bathroomMinimums: { minAreaSqM: 1.4, minWidthM: 1.2 },
        wcMinimums: { minAreaSqM: 1.1, minWidthM: 0.9 },
        combinedToiletMinimums: { minAreaSqM: 2.4, minWidthM: 1.2 },
        utilityMinimums: { minAreaSqM: 2, minWidthM: 1.2 },
        stairRequirements: {
          minWidthM: stairWidthM,
          maxRiserMm: 160,
          minTreadMm: 280,
          minHeadroomM: 2.2,
          secondStaircaseRequired,
          secondStaircaseThresholdFloors: 5,
          secondStaircaseThresholdAreaSqM: 500,
          secondStaircaseThresholdHeightM: 15,
          fireEscapeStaircaseRequired: heightM > 15
        },
        corridorRequirements: { minWidthM: 1.5 },
        liftRequirements: {
          minPassengerLifts: liftsRequired,
          minHeightForLiftM: 15,
          minFloorsForLift: 4,
          stretcherLiftThresholdHeightM: 24
        },
        calculateParking: (units) => calculateMaharashtraParking(units, 0.1),
        ventilationRequirements: {
          minDuctAreaSqM: 1.5,
          minDuctWidthM: 1.2,
          minInteriorCourtyardChowkSqM: 9,
          exteriorOpeningsRequired: true
        },
        lightRequirements: { minWindowAreaRatio: 0.1 },
        notes: [
          "Governed by UDCPR-2020 (updated through 30 January 2025) for Pune Municipal Corporation jurisdiction.",
          "Staircase width scaled according to building height and tenement density.",
          "Multi-family parking calculated according to UDCPR Schedule Table 21 carpet bands.",
          "Not a statutory building approval certificate; represents algorithmic planning conformity."
        ]
      };
    case "pune_pmrda":
      return {
        jurisdiction: "pune_pmrda",
        jurisdictionName: "Pune Metropolitan Region Development Authority (PMRDA)",
        authority: "PMRDA / Urban Development Department Maharashtra",
        document: "Unified Development Control and Promotion Regulations for Maharashtra State (UDCPR-2020)",
        sourceVersion: "UDCPR-2020 updated through 30 January 2025",
        habitableRoomMinimums: {
          masterHabitableRoomMinSqM: 9.5,
          masterHabitableRoomMinWidthM: 2.4,
          otherHabitableRoomMinSqM: 7.5,
          otherHabitableRoomMinWidthM: 2.1
        },
        kitchenMinimums: { minAreaSqM: 5, minWidthM: 1.8 },
        bathroomMinimums: { minAreaSqM: 1.4, minWidthM: 1.2 },
        wcMinimums: { minAreaSqM: 1.1, minWidthM: 0.9 },
        combinedToiletMinimums: { minAreaSqM: 2.4, minWidthM: 1.2 },
        utilityMinimums: { minAreaSqM: 2, minWidthM: 1.2 },
        stairRequirements: {
          minWidthM: stairWidthM,
          maxRiserMm: 160,
          minTreadMm: 280,
          minHeadroomM: 2.2,
          secondStaircaseRequired,
          secondStaircaseThresholdFloors: 5,
          secondStaircaseThresholdAreaSqM: 500,
          secondStaircaseThresholdHeightM: 15,
          fireEscapeStaircaseRequired: heightM > 15
        },
        corridorRequirements: { minWidthM: 1.5 },
        liftRequirements: {
          minPassengerLifts: liftsRequired,
          minHeightForLiftM: 15,
          minFloorsForLift: 4,
          stretcherLiftThresholdHeightM: 24
        },
        calculateParking: (units) => calculateMaharashtraParking(units, 0.1),
        ventilationRequirements: {
          minDuctAreaSqM: 1.5,
          minDuctWidthM: 1.2,
          minInteriorCourtyardChowkSqM: 9,
          exteriorOpeningsRequired: true
        },
        lightRequirements: { minWindowAreaRatio: 0.1 },
        notes: [
          "Governed by UDCPR-2020 (updated through 30 January 2025) for PMRDA development jurisdiction.",
          "PMRDA mandates external ventilation ducts for multi-unit kitchen/bath clusters."
        ]
      };
    case "mumbai_mcgm":
      return {
        jurisdiction: "mumbai_mcgm",
        jurisdictionName: "Municipal Corporation of Greater Mumbai (MCGM)",
        authority: "MCGM / Municipal Corporation of Greater Mumbai",
        document: "Development Control and Promotion Regulations for Greater Mumbai, 2034 (DCPR 2034)",
        sourceVersion: "DCPR 2034 Part VIII Table 14 & Table 21",
        habitableRoomMinimums: {
          masterHabitableRoomMinSqM: 9.5,
          masterHabitableRoomMinWidthM: 2.4,
          otherHabitableRoomMinSqM: 7.5,
          otherHabitableRoomMinWidthM: 2.4
          // MCGM Table 14 requires 2.4m width for all habitable rooms
        },
        kitchenMinimums: { minAreaSqM: 5.5, minWidthM: 1.8 },
        // MCGM mandates 5.5 m² min for kitchen
        bathroomMinimums: { minAreaSqM: 1.8, minWidthM: 1.2 },
        // MCGM mandates 1.8 m²
        wcMinimums: { minAreaSqM: 1.1, minWidthM: 0.9 },
        combinedToiletMinimums: { minAreaSqM: 2.8, minWidthM: 1.2 },
        // MCGM mandates 2.8 m²
        utilityMinimums: { minAreaSqM: 2.2, minWidthM: 1.2 },
        stairRequirements: {
          minWidthM: Math.max(1.2, stairWidthM),
          // Mumbai minimum residential stair is 1.20m
          maxRiserMm: 150,
          minTreadMm: 300,
          minHeadroomM: 2.4,
          secondStaircaseRequired: secondStaircaseRequired || heightM > 15,
          secondStaircaseThresholdFloors: 5,
          secondStaircaseThresholdAreaSqM: 450,
          secondStaircaseThresholdHeightM: 15,
          fireEscapeStaircaseRequired: heightM > 15
        },
        corridorRequirements: { minWidthM: 1.5 },
        liftRequirements: {
          minPassengerLifts: Math.max(1, liftsRequired),
          minHeightForLiftM: 15,
          minFloorsForLift: 4,
          stretcherLiftThresholdHeightM: 24
        },
        calculateParking: (units) => calculateMumbaiParking(units),
        ventilationRequirements: {
          minDuctAreaSqM: 1.8,
          minDuctWidthM: 1.2,
          minInteriorCourtyardChowkSqM: 12,
          exteriorOpeningsRequired: true
        },
        lightRequirements: { minWindowAreaRatio: 0.125 },
        // 1/8th of floor area
        notes: [
          "Governed by Mumbai DCPR 2034 Part VIII (Table 14 tenement standards & Table 21 parking).",
          "Minimum kitchen area 5.5 m\xB2; minimum bathroom area 1.8 m\xB2; combined toilet 2.8 m\xB2.",
          "High density multi-family parking provisions applied with 15% visitor margin."
        ]
      };
    case "generic_maharashtra":
      return {
        jurisdiction: "generic_maharashtra",
        jurisdictionName: "Generic Maharashtra (UDCPR 2020 Baseline)",
        authority: "Urban Development Department Maharashtra",
        document: "Unified Development Control and Promotion Regulations for Maharashtra State (UDCPR-2020)",
        sourceVersion: "UDCPR-2020 Baseline",
        habitableRoomMinimums: {
          masterHabitableRoomMinSqM: 9.5,
          masterHabitableRoomMinWidthM: 2.4,
          otherHabitableRoomMinSqM: 7.5,
          otherHabitableRoomMinWidthM: 2.1
        },
        kitchenMinimums: { minAreaSqM: 5, minWidthM: 1.8 },
        bathroomMinimums: { minAreaSqM: 1.4, minWidthM: 1.2 },
        wcMinimums: { minAreaSqM: 1.1, minWidthM: 0.9 },
        combinedToiletMinimums: { minAreaSqM: 2.4, minWidthM: 1.2 },
        utilityMinimums: { minAreaSqM: 2, minWidthM: 1.2 },
        stairRequirements: {
          minWidthM: stairWidthM,
          maxRiserMm: 160,
          minTreadMm: 280,
          minHeadroomM: 2.2,
          secondStaircaseRequired,
          secondStaircaseThresholdFloors: 5,
          secondStaircaseThresholdAreaSqM: 500,
          secondStaircaseThresholdHeightM: 15,
          fireEscapeStaircaseRequired: heightM > 15
        },
        corridorRequirements: { minWidthM: 1.5 },
        liftRequirements: {
          minPassengerLifts: liftsRequired,
          minHeightForLiftM: 15,
          minFloorsForLift: 4,
          stretcherLiftThresholdHeightM: 24
        },
        calculateParking: (units) => calculateMaharashtraParking(units, 0.1),
        ventilationRequirements: {
          minDuctAreaSqM: 1.5,
          minDuctWidthM: 1.2,
          minInteriorCourtyardChowkSqM: 9,
          exteriorOpeningsRequired: true
        },
        lightRequirements: { minWindowAreaRatio: 0.1 },
        notes: [
          "Unified Maharashtra State (UDCPR-2020) model regulations.",
          "Applicable across Maharashtra municipalities outside MCGM."
        ]
      };
    case "generic_indian":
    default:
      return {
        jurisdiction: "generic_indian",
        jurisdictionName: "Generic Indian (NBC 2016 Reference Baseline)",
        authority: "Bureau of Indian Standards",
        document: "National Building Code of India 2016 (NBC 2016)",
        sourceVersion: "NBC 2016 Part 3 & Part 4",
        habitableRoomMinimums: {
          masterHabitableRoomMinSqM: 9.5,
          masterHabitableRoomMinWidthM: 2.4,
          otherHabitableRoomMinSqM: 7.5,
          otherHabitableRoomMinWidthM: 2.1
        },
        kitchenMinimums: { minAreaSqM: 5, minWidthM: 1.8 },
        bathroomMinimums: { minAreaSqM: 1.4, minWidthM: 1.2 },
        wcMinimums: { minAreaSqM: 1.1, minWidthM: 0.9 },
        combinedToiletMinimums: { minAreaSqM: 2.4, minWidthM: 1.2 },
        utilityMinimums: { minAreaSqM: 2, minWidthM: 1.2 },
        stairRequirements: {
          minWidthM: Math.max(1, stairWidthM),
          maxRiserMm: 160,
          minTreadMm: 280,
          minHeadroomM: 2.2,
          secondStaircaseRequired,
          secondStaircaseThresholdFloors: 5,
          secondStaircaseThresholdAreaSqM: 500,
          secondStaircaseThresholdHeightM: 15,
          fireEscapeStaircaseRequired: heightM > 15
        },
        corridorRequirements: { minWidthM: 1.5 },
        liftRequirements: {
          minPassengerLifts: liftsRequired,
          minHeightForLiftM: 15,
          minFloorsForLift: 4,
          stretcherLiftThresholdHeightM: 24
        },
        calculateParking: (units) => calculateGenericIndianParking(units),
        ventilationRequirements: {
          minDuctAreaSqM: 1.5,
          minDuctWidthM: 1.2,
          minInteriorCourtyardChowkSqM: 9,
          exteriorOpeningsRequired: true
        },
        lightRequirements: { minWindowAreaRatio: 0.1 },
        notes: [
          "National Building Code of India 2016 model benchmark.",
          "Treated as reference baseline where local competent authority regulations are not specified."
        ]
      };
  }
}

// packages/ai-orchestration/src/apartment/typologies.ts
var TYPOLOGY_2BHK_TEMPLATE = {
  unitType: "2BHK",
  defaultCarpetAreaSqM: 70,
  // ~753 sq ft
  planningSequence: [
    "Entry",
    "Foyer",
    "Living + Dining",
    "Kitchen",
    "Utility / Dry Balcony",
    "Private Corridor",
    "Master Bedroom + Attached Toilet",
    "Bedroom 2",
    "Common Toilet",
    "Living Balcony"
  ],
  roomTemplates: [
    { id: "foyer", name: "Entrance Foyer", type: "foyer", weight: 0.05 },
    { id: "living_dining", name: "Living & Dining Room", type: "living_dining", weight: 0.38, hasBalcony: true },
    { id: "kitchen", name: "Kitchen", type: "kitchen", weight: 0.12 },
    { id: "utility", name: "Dry Balcony / Utility", type: "utility", weight: 0.05 },
    { id: "master_bedroom", name: "Master Bedroom", type: "master_bedroom", weight: 0.2, isEnsuite: true },
    { id: "master_toilet", name: "Master Toilet (En-suite)", type: "master_toilet", weight: 0.04, isEnsuite: true },
    { id: "bedroom_2", name: "Bedroom 2", type: "bedroom", weight: 0.16 },
    { id: "common_toilet", name: "Common Toilet", type: "common_toilet", weight: 0.04 },
    { id: "living_balcony", name: "Sit-out Balcony", type: "balcony", weight: 0.08, hasBalcony: true }
  ]
};
var TYPOLOGY_3BHK_TEMPLATE = {
  unitType: "3BHK",
  defaultCarpetAreaSqM: 105,
  // ~1130 sq ft (substantially larger than 2BHK)
  planningSequence: [
    "Entry",
    "Entrance Foyer",
    "Living + Dining",
    "Kitchen",
    "Dry Balcony / Utility",
    "Private Lobby",
    "Master Suite (Bedroom + En-suite Bath + Balcony)",
    "Bedroom 2 + Attached Bath",
    "Bedroom 3",
    "Common Toilet / Powder Room",
    "Main Balcony"
  ],
  roomTemplates: [
    { id: "foyer", name: "Entrance Foyer", type: "foyer", weight: 0.05 },
    { id: "living_dining", name: "Living & Dining Room", type: "living_dining", weight: 0.34, hasBalcony: true },
    { id: "kitchen", name: "Kitchen", type: "kitchen", weight: 0.11 },
    { id: "utility", name: "Dry Balcony / Utility", type: "utility", weight: 0.05 },
    { id: "master_bedroom", name: "Master Bedroom", type: "master_bedroom", weight: 0.18, isEnsuite: true, hasBalcony: true },
    { id: "master_toilet", name: "Master Toilet (En-suite)", type: "master_toilet", weight: 0.04, isEnsuite: true },
    { id: "bedroom_2", name: "Bedroom 2", type: "bedroom", weight: 0.14, isEnsuite: true },
    { id: "toilet_2", name: "Toilet 2 (Attached)", type: "master_toilet", weight: 0.04, isEnsuite: true },
    { id: "bedroom_3", name: "Bedroom 3 / Guest Room", type: "bedroom", weight: 0.13 },
    { id: "common_toilet", name: "Common Toilet / Powder", type: "common_toilet", weight: 0.03 },
    { id: "living_balcony", name: "Living Balcony", type: "balcony", weight: 0.06, hasBalcony: true },
    { id: "master_balcony", name: "Master Balcony", type: "balcony", weight: 0.04, hasBalcony: true }
  ]
};
var TYPOLOGY_1BHK_TEMPLATE = {
  unitType: "1BHK",
  defaultCarpetAreaSqM: 45,
  // ~484 sq ft
  planningSequence: ["Entry", "Living + Dining", "Kitchen", "Dry Balcony", "Bedroom", "Toilet", "Balcony"],
  roomTemplates: [
    { id: "living_dining", name: "Living & Dining", type: "living_dining", weight: 0.42, hasBalcony: true },
    { id: "kitchen", name: "Kitchen", type: "kitchen", weight: 0.15 },
    { id: "utility", name: "Utility", type: "utility", weight: 0.06 },
    { id: "bedroom", name: "Bedroom", type: "master_bedroom", weight: 0.25 },
    { id: "toilet", name: "Bathroom & WC", type: "common_toilet", weight: 0.06 },
    { id: "balcony", name: "Balcony", type: "balcony", weight: 0.06 }
  ]
};
var TYPOLOGY_4BHK_TEMPLATE = {
  unitType: "4BHK",
  defaultCarpetAreaSqM: 160,
  // ~1722 sq ft
  planningSequence: [
    "Entry",
    "Grand Foyer",
    "Formal Living",
    "Family Dining",
    "Modular Kitchen + Store",
    "Utility",
    "Master Suite (Walk-in Closet + Bath + Balcony)",
    "Bedroom 2 + Attached Bath",
    "Bedroom 3 + Attached Bath",
    "Bedroom 4 / Study",
    "Powder Room",
    "Balconies"
  ],
  roomTemplates: [
    { id: "foyer", name: "Grand Foyer", type: "foyer", weight: 0.06 },
    { id: "living_dining", name: "Living & Dining Hall", type: "living_dining", weight: 0.32, hasBalcony: true },
    { id: "kitchen", name: "Kitchen & Store", type: "kitchen", weight: 0.1 },
    { id: "utility", name: "Utility", type: "utility", weight: 0.04 },
    { id: "master_bedroom", name: "Master Suite", type: "master_bedroom", weight: 0.16, isEnsuite: true, hasBalcony: true },
    { id: "master_toilet", name: "Master Bath (En-suite)", type: "master_toilet", weight: 0.04, isEnsuite: true },
    { id: "bedroom_2", name: "Bedroom 2", type: "bedroom", weight: 0.12, isEnsuite: true },
    { id: "toilet_2", name: "Toilet 2", type: "master_toilet", weight: 0.03, isEnsuite: true },
    { id: "bedroom_3", name: "Bedroom 3", type: "bedroom", weight: 0.11, isEnsuite: true },
    { id: "toilet_3", name: "Toilet 3", type: "master_toilet", weight: 0.03, isEnsuite: true },
    { id: "bedroom_4", name: "Bedroom 4 / Study", type: "bedroom", weight: 0.09 },
    { id: "powder_room", name: "Powder Room", type: "common_toilet", weight: 0.03 },
    { id: "living_balcony", name: "Main Deck Balcony", type: "balcony", weight: 0.08, hasBalcony: true }
  ]
};
var TYPOLOGY_TEMPLATES = {
  "1BHK": TYPOLOGY_1BHK_TEMPLATE,
  "2BHK": TYPOLOGY_2BHK_TEMPLATE,
  "3BHK": TYPOLOGY_3BHK_TEMPLATE,
  "4BHK": TYPOLOGY_4BHK_TEMPLATE
};
function allocateApartmentUnitSpaces(options) {
  const { unitType, flatLabel = "Flat 01", rulesProfile } = options;
  const template = TYPOLOGY_TEMPLATES[unitType] ?? TYPOLOGY_2BHK_TEMPLATE;
  let targetCarpetAreaSqM;
  if (options.targetCarpetAreaSqM && options.targetCarpetAreaSqM > 0) {
    targetCarpetAreaSqM = options.targetCarpetAreaSqM;
  } else if (options.targetCarpetAreaSqFt && options.targetCarpetAreaSqFt > 0) {
    targetCarpetAreaSqM = options.targetCarpetAreaSqFt * 0.092903;
  } else {
    targetCarpetAreaSqM = template.defaultCarpetAreaSqM;
  }
  const targetBuiltUpAreaSqM = targetCarpetAreaSqM * 1.15;
  const targetCarpetAreaSqFt = Math.round(targetCarpetAreaSqM / 0.092903);
  const targetBuiltUpAreaSqFt = Math.round(targetBuiltUpAreaSqM / 0.092903);
  const internalCirculationSqM = targetCarpetAreaSqM * 0.08;
  const internalWallsSqM = targetCarpetAreaSqM * 0.07;
  let totalMandatoryMinimumsSqM = 0;
  const roomBaseMinimums = [];
  for (const rt of template.roomTemplates) {
    let minArea = 1.5;
    let minWidth = 1;
    switch (rt.type) {
      case "master_bedroom":
        minArea = rulesProfile.habitableRoomMinimums.masterHabitableRoomMinSqM;
        minWidth = rulesProfile.habitableRoomMinimums.masterHabitableRoomMinWidthM;
        break;
      case "bedroom":
        minArea = rulesProfile.habitableRoomMinimums.otherHabitableRoomMinSqM;
        minWidth = rulesProfile.habitableRoomMinimums.otherHabitableRoomMinWidthM;
        break;
      case "living_dining":
        minArea = Math.max(12, rulesProfile.habitableRoomMinimums.masterHabitableRoomMinSqM * 1.25);
        minWidth = 3;
        break;
      case "kitchen":
        minArea = rulesProfile.kitchenMinimums.minAreaSqM;
        minWidth = rulesProfile.kitchenMinimums.minWidthM;
        break;
      case "utility":
        minArea = rulesProfile.utilityMinimums.minAreaSqM;
        minWidth = rulesProfile.utilityMinimums.minWidthM;
        break;
      case "master_toilet":
        minArea = rulesProfile.combinedToiletMinimums.minAreaSqM;
        minWidth = rulesProfile.combinedToiletMinimums.minWidthM;
        break;
      case "common_toilet":
        minArea = rulesProfile.combinedToiletMinimums.minAreaSqM;
        minWidth = rulesProfile.combinedToiletMinimums.minWidthM;
        break;
      case "foyer":
        minArea = 2;
        minWidth = 1.2;
        break;
      case "balcony":
        minArea = 2.5;
        minWidth = 1.2;
        break;
      default:
        minArea = 1.5;
        minWidth = 1;
    }
    totalMandatoryMinimumsSqM += minArea;
    roomBaseMinimums.push({ template: rt, minArea, minWidth });
  }
  const usablePlanningBalanceSqM = Math.max(
    0,
    targetCarpetAreaSqM - totalMandatoryMinimumsSqM - internalCirculationSqM - internalWallsSqM
  );
  const totalWeight = template.roomTemplates.reduce((sum2, r) => sum2 + r.weight, 0);
  const rooms = roomBaseMinimums.map(({ template: rt, minArea, minWidth }) => {
    const additionalArea = rt.weight / totalWeight * usablePlanningBalanceSqM;
    const targetAreaSqM = Number((minArea + additionalArea).toFixed(2));
    return {
      id: `${flatLabel.toLowerCase().replace(/\s+/g, "_")}_${rt.id}`,
      name: rt.name,
      type: rt.type,
      minAreaSqM: minArea,
      minWidthM: minWidth,
      targetAreaSqM,
      isEnsuite: rt.isEnsuite,
      hasBalcony: rt.hasBalcony
    };
  });
  return {
    unitType: template.unitType,
    flatLabel,
    targetCarpetAreaSqM: Number(targetCarpetAreaSqM.toFixed(2)),
    targetCarpetAreaSqFt,
    targetBuiltUpAreaSqM: Number(targetBuiltUpAreaSqM.toFixed(2)),
    targetBuiltUpAreaSqFt,
    internalCirculationSqM: Number(internalCirculationSqM.toFixed(2)),
    internalWallsSqM: Number(internalWallsSqM.toFixed(2)),
    usablePlanningBalanceSqM: Number(usablePlanningBalanceSqM.toFixed(2)),
    rooms,
    planningSequence: template.planningSequence
  };
}

// packages/ai-orchestration/src/apartment/site-defaults.ts
var DEFAULT_APARTMENT_SETBACKS_MM = {
  front: 3e3,
  rear: 2e3,
  left: 2e3,
  right: 2e3
};
var DEFAULT_APARTMENT_SETBACKS_M = {
  front: DEFAULT_APARTMENT_SETBACKS_MM.front / 1e3,
  rear: DEFAULT_APARTMENT_SETBACKS_MM.rear / 1e3,
  left: DEFAULT_APARTMENT_SETBACKS_MM.left / 1e3,
  right: DEFAULT_APARTMENT_SETBACKS_MM.right / 1e3
};

// packages/ai-orchestration/src/apartment/manifest.ts
var SQM_TO_SQFT = 10.7639104;
var M_TO_FT = 3.28084;
function buildApartmentGenerationManifest(input) {
  const { site, apartmentConfig, rulesProfile } = input;
  const setbacks = site.setbacksMm ?? DEFAULT_APARTMENT_SETBACKS_MM;
  const plotWidthM = site.plotWidthMm / 1e3;
  const plotDepthM = site.plotDepthMm / 1e3;
  const siteAreaSqM = Number((plotWidthM * plotDepthM).toFixed(2));
  const siteAreaSqFt = Math.round(siteAreaSqM * SQM_TO_SQFT);
  const buildableWidthM = Math.max(0, (site.plotWidthMm - setbacks.left - setbacks.right) / 1e3);
  const buildableDepthM = Math.max(0, (site.plotDepthMm - setbacks.front - setbacks.rear) / 1e3);
  const buildableAreaSqM = Number((buildableWidthM * buildableDepthM).toFixed(2));
  const buildableAreaSqFt = Math.round(buildableAreaSqM * SQM_TO_SQFT);
  const currentFloorPlateSqM = Number((buildableAreaSqM * 0.9).toFixed(2));
  const currentFloorPlateSqFt = Math.round(currentFloorPlateSqM * SQM_TO_SQFT);
  const jurisdictionName = apartmentConfig.jurisdiction ?? "pune_pmc";
  const authorityMap = {
    pune_pmc: {
      authority: "Pune Municipal Corporation (PMC)",
      ruleProfile: "UDCPR 2020 Chapter 6 & Rule 6.2.3"
    },
    pune_pmrda: {
      authority: "Pune Metropolitan Region Development Authority (PMRDA)",
      ruleProfile: "UDCPR 2020 Regional Authority Regulations"
    },
    mumbai_mcgm: {
      authority: "Municipal Corporation of Greater Mumbai (MCGM)",
      ruleProfile: "DCPR 2034 Regulation 41 & Table 21"
    },
    generic_maharashtra: {
      authority: "Maharashtra State Unified DCPR",
      ruleProfile: "UDCPR 2020 Standard Baseline"
    },
    generic_indian: {
      authority: "National Building Code of India (NBC 2016)",
      ruleProfile: "Part 3 (Development Control) & Part 4 (Fire Safety)"
    }
  };
  const jurisdictionInfo = authorityMap[jurisdictionName] ?? {
    authority: "Indian Urban Planning Authority",
    ruleProfile: "National Building Code 2016 Baseline"
  };
  const resolvedRulesProfile = rulesProfile ?? getApartmentRulesProfile(jurisdictionName, {
    floorCount: apartmentConfig.floorCount,
    tenementsPerFloor: apartmentConfig.flatsPerFloor
  });
  const unitsList = [];
  let unitIndex = 0;
  for (const item of apartmentConfig.unitMix) {
    const normType = item.unitType.toUpperCase();
    for (let c = 0; c < item.count; c++) {
      unitIndex++;
      const flatLabel = `FLAT ${unitIndex < 10 ? `0${unitIndex}` : unitIndex}`;
      const allocation = allocateApartmentUnitSpaces({
        unitType: normType,
        targetCarpetAreaSqFt: item.carpetAreaSqFt,
        rulesProfile: resolvedRulesProfile,
        flatLabel
      });
      const targetAreaSqM = allocation.targetCarpetAreaSqM;
      const targetAreaSqFt = Math.round(targetAreaSqM * SQM_TO_SQFT);
      let bedrooms = 0;
      let bathrooms = 0;
      let livingRooms = 0;
      let diningRooms = 0;
      let kitchens = 0;
      let utilities = 0;
      let balconies = 0;
      for (const r of allocation.rooms) {
        if (r.type === "master_bedroom" || r.type === "bedroom") bedrooms++;
        else if (r.type === "master_toilet" || r.type === "common_toilet" || r.type === "powder_room") bathrooms++;
        else if (r.type === "living_dining") {
          livingRooms++;
          diningRooms++;
        } else if (r.type === "kitchen") kitchens++;
        else if (r.type === "utility") utilities++;
        else if (r.type === "balcony") balconies++;
      }
      if (bedrooms === 0) {
        const parsed = parseInt(normType, 10);
        bedrooms = isNaN(parsed) ? 2 : parsed;
        bathrooms = Math.max(1, bedrooms);
        livingRooms = 1;
        diningRooms = 1;
        kitchens = 1;
        utilities = 1;
        balconies = 1;
      }
      unitsList.push({
        id: `unit_${unitIndex}`,
        label: flatLabel,
        type: normType,
        targetAreaSqFt,
        targetAreaSqM,
        bedrooms,
        bathrooms,
        livingRooms,
        diningRooms,
        kitchens,
        utilities,
        balconies
      });
    }
  }
  const roomTotals = {
    bedrooms: unitsList.reduce((acc, u) => acc + u.bedrooms, 0),
    bathrooms: unitsList.reduce((acc, u) => acc + u.bathrooms, 0),
    livingRooms: unitsList.reduce((acc, u) => acc + u.livingRooms, 0),
    diningRooms: unitsList.reduce((acc, u) => acc + u.diningRooms, 0),
    kitchens: unitsList.reduce((acc, u) => acc + u.kitchens, 0),
    utilities: unitsList.reduce((acc, u) => acc + u.utilities, 0),
    balconies: unitsList.reduce((acc, u) => acc + u.balconies, 0)
  };
  const liftsCount = Math.max(1, apartmentConfig.commonCore.passengerLifts + apartmentConfig.commonCore.serviceLifts);
  const stairsCount = Math.max(1, apartmentConfig.commonCore.staircaseCount);
  const commonCoreSqM = Number((liftsCount * 3.6 + stairsCount * 16 + 18).toFixed(2));
  const circulationSqM = Number((currentFloorPlateSqM * 0.12).toFixed(2));
  const servicesSqM = Number((unitsList.length * 2.5 + 5).toFixed(2));
  const netResidentialSqM = Math.max(
    0,
    Number((currentFloorPlateSqM - commonCoreSqM - circulationSqM - servicesSqM).toFixed(2))
  );
  const areaAllocations = {
    siteSqFt: siteAreaSqFt,
    siteSqM: siteAreaSqM,
    buildableEnvelopeSqFt: buildableAreaSqFt,
    buildableEnvelopeSqM: buildableAreaSqM,
    currentFloorPlateSqFt,
    currentFloorPlateSqM,
    commonCoreSqFt: Math.round(commonCoreSqM * SQM_TO_SQFT),
    commonCoreSqM,
    circulationSqFt: Math.round(circulationSqM * SQM_TO_SQFT),
    circulationSqM,
    servicesSqFt: Math.round(servicesSqM * SQM_TO_SQFT),
    servicesSqM,
    netResidentialSqFt: Math.round(netResidentialSqM * SQM_TO_SQFT),
    netResidentialSqM
  };
  const floors = Math.max(1, apartmentConfig.floorCount);
  const currentFloor = input.currentFloorIndex ?? 1;
  const floorType = apartmentConfig.floorStrategy ?? "typical";
  const allAmenities = [
    ...apartmentConfig.amenities?.groundSiteAmenities ?? [],
    ...apartmentConfig.amenities?.buildingAmenities ?? []
  ];
  return {
    jurisdiction: jurisdictionInfo,
    project: {
      type: "apartment",
      floors,
      currentFloor,
      floorType
    },
    site: {
      widthFt: Math.round(plotWidthM * M_TO_FT),
      depthFt: Math.round(plotDepthM * M_TO_FT),
      buildableWidthFt: Math.round(buildableWidthM * M_TO_FT),
      buildableDepthFt: Math.round(buildableDepthM * M_TO_FT),
      buildableAreaSqFt,
      widthM: Number(plotWidthM.toFixed(2)),
      depthM: Number(plotDepthM.toFixed(2)),
      buildableAreaSqM
    },
    units: {
      exactCount: unitsList.length,
      units: unitsList
    },
    roomTotals,
    areaAllocations,
    commonCore: {
      lifts: liftsCount,
      stairs: stairsCount,
      commonLobby: apartmentConfig.commonCore.commonLobby ?? true,
      corridor: true
    },
    services: {
      ducts: Math.max(1, Math.ceil(unitsList.length / 2)),
      shafts: Math.max(1, Math.ceil(unitsList.length / 2)),
      utilityAreas: roomTotals.utilities
    },
    parking: {
      cars: (apartmentConfig.parking.residentParkingCount ?? 0) + (apartmentConfig.parking.visitorParkingCount ?? 0),
      twoWheelers: apartmentConfig.parking.twoWheelerParkingCount ?? unitsList.length * 2,
      visitorSpaces: apartmentConfig.parking.visitorParkingCount ?? 2
    },
    amenities: allAmenities.length > 0 ? allAmenities : ["common_lobby", "society_office"],
    orientation: {
      roadSide: (site.roadFacing ?? "north").toUpperCase(),
      northDirection: site.orientationDegrees ?? 0
    },
    requirements: [
      `Generate EXACTLY ${unitsList.length} separate residential flats on this floor.`,
      `Preserve the exact unit mix: ${apartmentConfig.unitMix.map((u) => `${u.count} x ${u.unitType}`).join(", ")}.`,
      `Generate EXACTLY ${liftsCount} lift(s) and EXACTLY ${stairsCount} staircase(s).`,
      "Include a central common lobby providing direct access to all flat entries.",
      "Flats must have clear boundary walls and independent front doors.",
      "No standalone villas, no single-family houses, no merged units."
    ]
  };
}
function validateSchematicMatchesManifest(schematic, manifest) {
  const discrepancies = [];
  if (schematic.flatCount !== manifest.units.exactCount) {
    discrepancies.push(
      `Schematic flat count (${schematic.flatCount}) does not match manifest flat count (${manifest.units.exactCount}).`
    );
  }
  if (schematic.units.length !== manifest.units.units.length) {
    discrepancies.push(
      `Schematic unit count (${schematic.units.length}) does not match manifest units list (${manifest.units.units.length}).`
    );
  }
  for (let i = 0; i < Math.min(schematic.units.length, manifest.units.units.length); i++) {
    const sUnit = schematic.units[i];
    const mUnit = manifest.units.units[i];
    if (sUnit.unitType.toUpperCase() !== mUnit.type.toUpperCase()) {
      discrepancies.push(
        `Unit ${i + 1} type mismatch: Schematic has "${sUnit.unitType}", but manifest requires "${mUnit.type}".`
      );
    }
  }
  if (schematic.core.lifts.length !== manifest.commonCore.lifts) {
    discrepancies.push(
      `Schematic lift count (${schematic.core.lifts.length}) does not match manifest lift count (${manifest.commonCore.lifts}).`
    );
  }
  if (schematic.core.stairs.length !== manifest.commonCore.stairs) {
    discrepancies.push(
      `Schematic stair count (${schematic.core.stairs.length}) does not match manifest stair count (${manifest.commonCore.stairs}).`
    );
  }
  for (let i = 0; i < Math.min(schematic.units.length, manifest.units.units.length); i++) {
    const sUnit = schematic.units[i];
    const mUnit = manifest.units.units[i];
    const rooms = [...sUnit.rooms, ...sUnit.balconies];
    const bedrooms = rooms.filter((r) => r.type === "master_bedroom" || r.type === "bedroom").length;
    const baths = rooms.filter((r) => r.type === "master_toilet" || r.type === "common_toilet" || r.type === "powder_room").length;
    if (bedrooms !== mUnit.bedrooms) {
      discrepancies.push(`${sUnit.flatLabel} has ${bedrooms} bedroom(s); manifest requires ${mUnit.bedrooms}.`);
    }
    if (baths < mUnit.bathrooms) {
      discrepancies.push(`${sUnit.flatLabel} has ${baths} bath(s); manifest requires ${mUnit.bathrooms}.`);
    }
  }
  const feasibilityFail = schematic.layoutFits === false;
  if (feasibilityFail) {
    discrepancies.push(schematic.areaReport?.floor.message ?? `FEASIBILITY FAIL: ${schematic.layoutIssues.join("; ")}`);
  }
  for (const report of schematic.areaReport?.units ?? []) {
    if (report.status === "FAIL") {
      discrepancies.push(
        `${report.flatLabel} area control failed: ${report.actualCarpetSqM} m\xB2 drawn vs ${report.targetCarpetSqM} m\xB2 target (${report.deviationPct}%).`
      );
    }
  }
  for (const check of schematic.spatialChecks ?? []) {
    if (check.status === "FAIL") discrepancies.push(`Spatial check ${check.code} failed: ${check.message}`);
  }
  return {
    matches: discrepancies.length === 0,
    discrepancies,
    feasibilityFail
  };
}

// packages/ai-orchestration/src/orchestration/aspect-ratio.ts
var MIN_OUTPUT_DIMENSION_PX = 512;
var MAX_OUTPUT_DIMENSION_PX = 1536;
var OUTPUT_DIMENSION_STEP_PX = 64;
var TARGET_PIXEL_BUDGET = 1024 * 1024;
var MIN_ASPECT_RATIO = 0.5;
var MAX_ASPECT_RATIO = 2;
function roundToStep(value, step) {
  return Math.round(value / step) * step;
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function computeAspectAdaptedDimensions(plotWidthM, plotDepthM) {
  const safeWidth = Math.max(0.1, plotWidthM);
  const safeDepth = Math.max(0.1, plotDepthM);
  const rawAspect = safeWidth / safeDepth;
  const aspectRatio = clamp(rawAspect, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO);
  let width = Math.sqrt(TARGET_PIXEL_BUDGET * aspectRatio);
  let height = Math.sqrt(TARGET_PIXEL_BUDGET / aspectRatio);
  width = roundToStep(width, OUTPUT_DIMENSION_STEP_PX);
  height = roundToStep(height, OUTPUT_DIMENSION_STEP_PX);
  width = clamp(width, MIN_OUTPUT_DIMENSION_PX, MAX_OUTPUT_DIMENSION_PX);
  height = clamp(height, MIN_OUTPUT_DIMENSION_PX, MAX_OUTPUT_DIMENSION_PX);
  return { width, height, aspectRatio };
}

// packages/ai-orchestration/src/orchestration/image-prompt-compiler.ts
var FLOOR_PLAN_PROMPT_VERSION = 3;
var APARTMENT_NEGATIVE_PROMPT = "NO VILLA, NO SINGLE FAMILY HOUSE, NO EXTRA FLATS, NO MISSING FLATS, NO MERGED FLATS, NO WRONG UNIT MIX, NO EXTRA BEDROOMS, NO MISSING BEDROOMS, NO EXTRA LIFTS, NO MISSING LIFTS, NO EXTRA STAIRS, NO MISSING STAIRS, NO RANDOM CORE, NO RANDOM AMENITIES, NO RANDOM ROOMS, NO CYRILLIC, NO RUSSIAN, NO NON-LATIN SCRIPT, NO GIBBERISH, NO PSEUDO-TEXT, NO RANDOM NUMBERS, NO WATERMARK, NO LOGO, NO 3D, NO PERSPECTIVE, NO PHOTOREALISTIC INTERIOR, NO HAND DRAWING, NO ARTISTIC RENDERING, NO DISTORTED WALLS, NO OVERLAPPING FLATS, NO FLOATING WALLS";
var APARTMENT_CONCEPT_ROOM_WORDS = ["LIVING", "DINING", "KITCHEN", "BEDROOM", "BATH", "UTILITY", "FOYER"];
var APARTMENT_CONCEPT_CORE_WORDS = ["LIFT", "STAIR", "LOBBY"];
function apartmentConceptLabelVocabulary(manifest) {
  const flats = manifest.units.units.map((u) => u.label.toUpperCase());
  const types = [...new Set(manifest.units.units.map((u) => u.type.toUpperCase()))];
  return [...flats, ...types, ...APARTMENT_CONCEPT_ROOM_WORDS, ...APARTMENT_CONCEPT_CORE_WORDS];
}
function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}
function compileApartmentConceptPrompt(manifest, concept, styleReferenceCount) {
  const flats = manifest.units.units.map((u) => {
    const rooms = [
      plural(u.bedrooms, "bedroom", "bedrooms"),
      plural(u.bathrooms, "bath", "baths"),
      ...u.livingRooms > 0 ? ["living"] : [],
      ...u.diningRooms > 0 ? ["dining"] : [],
      ...u.kitchens > 0 ? ["kitchen"] : [],
      ...u.utilities > 0 ? ["utility"] : []
    ];
    return `${u.label.toUpperCase()} ${u.type.toUpperCase()} = ${rooms.join(", ")}`;
  }).join("; ");
  const refLine = styleReferenceCount === 0 ? [] : [
    `${styleReferenceCount === 1 ? "Input image 2 is a" : `Input images 2-${styleReferenceCount + 1} are`} visual style and planning-language reference${styleReferenceCount === 1 ? "" : "s"} only: never copy their flat count, geometry or text.`
  ];
  return [
    "Generate ONE professional top-down Indian apartment floor plan: clean 2D orthographic drafting, black walls on white.",
    `CONCEPT ${String(concept.candidateNumber).padStart(2, "0")} of ${String(concept.candidateCount).padStart(2, "0")} - ${concept.label}: ${concept.intent}`,
    "Input image 1 is the deterministic layout and the primary structural reference: keep its flat boundaries, core, lifts, stairs, common lobby, room arrangement, doors and proportions.",
    ...refLine,
    "Priority: user requirements > deterministic layout > reference style.",
    `EXACTLY ${manifest.units.exactCount} flats: ${flats}.`,
    `Common core: EXACTLY ${manifest.commonCore.lifts} lifts (square shafts with X), EXACTLY ${manifest.commonCore.stairs} stairs (treads with a centre divider), ONE shaded common lobby touching every flat entrance.`,
    "Entry in every flat: common lobby > entrance door > foyer > living/dining > bedrooms. The lobby never opens into a bedroom or bath.",
    "Keep the architectural form natural: varied room proportions and articulated flat outlines; do not convert the layout into a rigid square grid.",
    `English labels only, short and clear, as in image 1: ${apartmentConceptLabelVocabulary(manifest).join(", ")}. No other text, no dimensions.`,
    "Do not add or remove flats, change the unit mix or the common core, or turn the project into a villa. No 3D, no perspective, no furniture, no watermark, no non-Latin text."
  ].join("\n");
}
function compileApartmentFloorPlanImagePrompt(input) {
  const { site, apartmentConfig, seed: seed3 } = input;
  const aspect = computeAspectAdaptedDimensions(site.plotWidth / 1e3, site.plotDepth / 1e3);
  const width = input.width ?? aspect.width;
  const height = input.height ?? aspect.height;
  const manifest = input.manifest ?? buildApartmentGenerationManifest({
    site: {
      plotWidthMm: site.plotWidth,
      plotDepthMm: site.plotDepth,
      setbacksMm: site.setbacks,
      roadFacing: site.roadFacing,
      orientationDegrees: site.orientation
    },
    apartmentConfig
  });
  const floorsCount = manifest.project.floors;
  const floorStrategy = manifest.project.floorType;
  const unitMixParts = apartmentConfig.unitMix.map((u) => `${u.count} x ${u.unitType}`);
  const unitMixDescription = unitMixParts.join(", ");
  const promptLines = [
    "CREATE ONE PROFESSIONAL 2D INDIAN APARTMENT FLOOR PLAN.",
    "",
    `PROJECT: Multi-unit residential apartment (${floorsCount} floors).`,
    `CURRENT FLOOR: ${floorStrategy.toUpperCase()} RESIDENTIAL FLOOR.`,
    `JURISDICTION: ${manifest.jurisdiction.authority} (${manifest.jurisdiction.ruleProfile}).`,
    `PLOT PROPORTIONS: ${manifest.site.widthM}m width \xD7 ${manifest.site.depthM}m depth.`,
    "",
    "REFERENCE PRIORITY:",
    "1. USER/MANIFEST REQUIREMENTS (authoritative for counts & mix)",
    "2. DETERMINISTIC SCHEMATIC (primary structural reference for layout & core)",
    "3. REFERENCE IMAGE VISUAL STYLE (architectural drafting style only)",
    "",
    "HARD REQUIREMENTS:",
    `1. Generate EXACTLY ${manifest.units.exactCount} separate residential flats (${manifest.units.units.map((u) => `${u.label}: ${u.type}`).join(", ")}).`,
    `2. Exact unit mix: ${unitMixDescription}. Total bedrooms across floor: ${manifest.roomTotals.bedrooms}.`,
    `3. Common core: EXACTLY ${manifest.commonCore.lifts} separate elevator shaft(s) [X], EXACTLY ${manifest.commonCore.stairs} staircase(s), common lobby and corridor.`,
    "4. Clean 2D orthographic technical drafting, crisp black architectural linework on white background.",
    "5. English only: readable English architectural labels only (FLAT, LIVING, BEDROOM, KITCHEN, BATH, BALCONY, LIFT, STAIR, COMMON LOBBY).",
    "",
    "DO NOT GENERATE:",
    "No villa, no single-family house, no extra flats, no missing flats, no merged flats. No 3D, no perspective, no photorealism, no furniture clutter, no Cyrillic or non-Latin script."
  ];
  const styleReferenceCount = (input.referenceImages ?? []).filter((r) => r.id !== "schematic_scaffold").length;
  const prompt = input.concept ? compileApartmentConceptPrompt(manifest, input.concept, styleReferenceCount) : promptLines.join("\n");
  return {
    schemaVersion: 1,
    promptVersion: FLOOR_PLAN_PROMPT_VERSION,
    prompt,
    negativePrompt: APARTMENT_NEGATIVE_PROMPT,
    seed: seed3,
    width,
    height,
    referenceImages: input.referenceImages,
    referenceDiagnostics: input.referenceDiagnostics,
    metadata: {
      projectId: input.projectId,
      projectName: input.projectName ?? "Apartment Building Project",
      plotWidthMm: site.plotWidth,
      plotDepthMm: site.plotDepth,
      floorsCount,
      roadFacing: site.roadFacing,
      projectType: "apartment",
      apartmentConfig,
      manifest,
      referenceDiagnostics: input.referenceDiagnostics
    }
  };
}

// packages/ai-orchestration/src/providers/image-generation.ts
var ImageProviderError = class _ImageProviderError extends Error {
  code;
  status;
  constructor(code, message, status) {
    super(message);
    this.name = "ImageProviderError";
    this.code = code;
    this.status = status;
    Object.setPrototypeOf(this, _ImageProviderError.prototype);
  }
};

// packages/ai-orchestration/src/providers/gemini-image.ts
import crypto3 from "node:crypto";

// packages/ai-orchestration/src/apartment/structural-renderer.ts
import crypto2 from "node:crypto";
import zlib from "node:zlib";
var STRUCTURAL_RENDERER_VERSION = "1.0.0";
var InvalidStructuralPlanError = class extends Error {
  code = "INVALID_STRUCTURAL_PLAN";
  errors;
  constructor(errors) {
    super(`Invalid StructuralPlanRepresentation: ${errors.join("; ")}`);
    this.name = "InvalidStructuralPlanError";
    this.errors = errors;
  }
};
function validateStructuralPlanRepresentation(rep) {
  const errors = [];
  if (!rep) {
    errors.push("StructuralPlanRepresentation is null or undefined.");
    return { valid: false, errors };
  }
  if (rep.version !== 1) {
    errors.push(`Unsupported representation version: ${rep.version}`);
  }
  if (!rep.buildingFootprint || rep.buildingFootprint.width <= 0 || rep.buildingFootprint.height <= 0) {
    errors.push("Invalid or empty buildingFootprint.");
  }
  if (!rep.outerBuildingWalls || rep.outerBuildingWalls.length < 4) {
    errors.push("Outer building walls missing or incomplete (expected at least 4 segments).");
  }
  if (!rep.flatBoundaries || rep.flatBoundaries.length === 0) {
    errors.push("No flat boundaries defined.");
  }
  if (!rep.commonCore || !rep.commonCore.lobby) {
    errors.push("Common core lobby missing.");
  }
  if (!rep.doors || rep.doors.length === 0) {
    errors.push("No doors or openings defined in structural representation.");
  }
  return { valid: errors.length === 0, errors };
}
function computeStructuralBoundingBox(rep) {
  let minX = rep.buildingFootprint.x;
  let minY = rep.buildingFootprint.y;
  let maxX = rep.buildingFootprint.x + rep.buildingFootprint.width;
  let maxY = rep.buildingFootprint.y + rep.buildingFootprint.height;
  for (const b of rep.balconies) {
    minX = Math.min(minX, b.bounds.x);
    minY = Math.min(minY, b.bounds.y);
    maxX = Math.max(maxX, b.bounds.x + b.bounds.width);
    maxY = Math.max(maxY, b.bounds.y + b.bounds.height);
  }
  for (const wall of rep.outerBuildingWalls) {
    minX = Math.min(minX, wall.start.x, wall.end.x);
    minY = Math.min(minY, wall.start.y, wall.end.y);
    maxX = Math.max(maxX, wall.start.x, wall.end.x);
    maxY = Math.max(maxY, wall.start.y, wall.end.y);
  }
  for (const u of rep.flatBoundaries) {
    minX = Math.min(minX, u.bounds.x);
    minY = Math.min(minY, u.bounds.y);
    maxX = Math.max(maxX, u.bounds.x + u.bounds.width);
    maxY = Math.max(maxY, u.bounds.y + u.bounds.height);
  }
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  return { minX, minY, maxX, maxY, width, height };
}
function computeViewTransform(bbox, options = {}) {
  const targetLongSidePx = options.targetLongSidePx ?? 2048;
  const minShortSidePx = options.minShortSidePx ?? 512;
  const marginFraction = options.marginFraction ?? 0.06;
  const aspect = bbox.width / bbox.height;
  let canvasWidth;
  let canvasHeight;
  if (aspect >= 1) {
    canvasWidth = targetLongSidePx;
    canvasHeight = Math.round(targetLongSidePx / aspect);
  } else {
    canvasHeight = targetLongSidePx;
    canvasWidth = Math.round(targetLongSidePx * aspect);
  }
  canvasWidth = Math.max(minShortSidePx, Math.round(canvasWidth / 16) * 16);
  canvasHeight = Math.max(minShortSidePx, Math.round(canvasHeight / 16) * 16);
  const marginX = canvasWidth * marginFraction;
  const marginY = canvasHeight * marginFraction;
  const usableWidth = canvasWidth - 2 * marginX;
  const usableHeight = canvasHeight - 2 * marginY;
  const scale = Math.min(usableWidth / bbox.width, usableHeight / bbox.height);
  const renderedWidth = bbox.width * scale;
  const renderedHeight = bbox.height * scale;
  const offsetX = (canvasWidth - renderedWidth) / 2 - bbox.minX * scale;
  const offsetY = (canvasHeight - renderedHeight) / 2 - bbox.minY * scale;
  return {
    canvasWidth,
    canvasHeight,
    scale,
    offsetX,
    offsetY,
    toScreenX: (worldX) => worldX * scale + offsetX,
    toScreenY: (worldY) => worldY * scale + offsetY
  };
}
var CRC_TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
  }
  CRC_TABLE[i] = c;
}
function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0;
    const lookup = CRC_TABLE[(crc ^ byte) & 255] ?? 0;
    crc = crc >>> 8 ^ lookup;
  }
  return (crc ^ -1) >>> 0;
}
function makePngChunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcPayload = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcPayload), 0);
  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}
var StructuralRasterizer = class {
  width;
  height;
  rowSize;
  raw;
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.rowSize = 1 + width * 4;
    this.raw = Buffer.alloc(height * this.rowSize, 255);
    for (let y = 0; y < height; y++) {
      this.raw[y * this.rowSize] = 0;
    }
  }
  setPixel(x, y, r, g, b) {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || px >= this.width || py < 0 || py >= this.height) return;
    const offset = py * this.rowSize + 1 + px * 4;
    this.raw[offset] = r;
    this.raw[offset + 1] = g;
    this.raw[offset + 2] = b;
    this.raw[offset + 3] = 255;
  }
  fillRect(rx, ry, rw, rh, r, g, b) {
    const x0 = Math.max(0, Math.min(this.width - 1, Math.round(rx)));
    const y0 = Math.max(0, Math.min(this.height - 1, Math.round(ry)));
    const x1 = Math.max(0, Math.min(this.width - 1, Math.round(rx + rw)));
    const y1 = Math.max(0, Math.min(this.height - 1, Math.round(ry + rh)));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        this.setPixel(x, y, r, g, b);
      }
    }
  }
  drawRectOutline(rx, ry, rw, rh, thickness, r, g, b) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);
    this.drawLine(x0, y0, x1, y0, r, g, b, thickness);
    this.drawLine(x1, y0, x1, y1, r, g, b, thickness);
    this.drawLine(x1, y1, x0, y1, r, g, b, thickness);
    this.drawLine(x0, y1, x0, y0, r, g, b, thickness);
  }
  drawLine(x0, y0, x1, y1, r, g, b, thickness = 1) {
    let px0 = Math.round(x0);
    let py0 = Math.round(y0);
    const px1 = Math.round(x1);
    const py1 = Math.round(y1);
    const dx = Math.abs(px1 - px0);
    const dy = Math.abs(py1 - py0);
    const sx = px0 < px1 ? 1 : -1;
    const sy = py0 < py1 ? 1 : -1;
    let err = dx - dy;
    const rad = Math.max(0, Math.floor(thickness / 2));
    while (true) {
      if (thickness <= 1) {
        this.setPixel(px0, py0, r, g, b);
      } else {
        for (let ty = -rad; ty <= rad; ty++) {
          for (let tx = -rad; tx <= rad; tx++) {
            this.setPixel(px0 + tx, py0 + ty, r, g, b);
          }
        }
      }
      if (px0 === px1 && py0 === py1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        px0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        py0 += sy;
      }
    }
  }
  drawCross(rx, ry, rw, rh, r, g, b, thickness = 1) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);
    this.drawLine(x0, y0, x1, y1, r, g, b, thickness);
    this.drawLine(x1, y0, x0, y1, r, g, b, thickness);
  }
  drawArc(cx, cy, radius, startAngleRad, endAngleRad, r, g, b, thickness = 1, dashed = false) {
    const steps = Math.max(20, Math.round(radius * 1.5));
    const angleRange = endAngleRad - startAngleRad;
    for (let i = 0; i <= steps; i++) {
      if (dashed && Math.floor(i / 4) % 2 === 1) continue;
      const angle = startAngleRad + angleRange * i / steps;
      const px = cx + radius * Math.cos(angle);
      const py = cy + radius * Math.sin(angle);
      this.setPixel(px, py, r, g, b);
      if (thickness > 1) {
        const rad = Math.floor(thickness / 2);
        for (let ty = -rad; ty <= rad; ty++) {
          for (let tx = -rad; tx <= rad; tx++) {
            this.setPixel(px + tx, py + ty, r, g, b);
          }
        }
      }
    }
  }
  toPng() {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.width, 0);
    ihdr.writeUInt32BE(this.height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;
    const compressed = zlib.deflateSync(this.raw, { level: 1 });
    return Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      makePngChunk("IHDR", ihdr),
      makePngChunk("IDAT", compressed),
      makePngChunk("IEND", Buffer.alloc(0))
    ]);
  }
};
function renderStructuralPlan(rep, options = {}) {
  const validation = validateStructuralPlanRepresentation(rep);
  if (!validation.valid) {
    throw new InvalidStructuralPlanError(validation.errors);
  }
  const bbox = computeStructuralBoundingBox(rep);
  const vt = computeViewTransform(bbox, options);
  const { canvasWidth, canvasHeight, scale, toScreenX, toScreenY } = vt;
  const baseStroke = Math.max(1, (canvasWidth + canvasHeight) / 1e3);
  const outerWallStroke = Math.max(3, Math.round(baseStroke * 1.6));
  const flatBoundaryStroke = Math.max(2, Math.round(baseStroke * 1.2));
  const partyWallStroke = Math.max(2, Math.round(baseStroke * 1));
  const roomPartitionStroke = Math.max(1, Math.round(baseStroke * 0.7));
  const coreStroke = Math.max(2, Math.round(baseStroke * 0.9));
  const stairTreadStroke = Math.max(1, Math.round(baseStroke * 0.4));
  const doorStroke = Math.max(1, Math.round(baseStroke * 0.7));
  const rasterizer = new StructuralRasterizer(canvasWidth, canvasHeight);
  const COL_CANVAS = { r: 255, g: 255, b: 255 };
  const COL_LOBBY_FILL = { r: 243, g: 244, b: 246 };
  const COL_BALCONY_FILL = { r: 250, g: 250, b: 250 };
  const COL_WALL_OUTER = { r: 17, g: 24, b: 39 };
  const COL_WALL_PARTY = { r: 31, g: 41, b: 55 };
  const COL_WALL_INTERIOR = { r: 55, g: 65, b: 81 };
  const COL_DOOR = { r: 31, g: 41, b: 55 };
  const COL_DOOR_ARC = { r: 107, g: 114, b: 128 };
  const COL_CORE_DETAIL = { r: 75, g: 85, b: 99 };
  const COL_DUCT_HATCH = { r: 156, g: 163, b: 175 };
  const svgElements = [];
  const lobbyB = rep.commonCore.lobby.bounds;
  const lobbySx = toScreenX(lobbyB.x);
  const lobbySy = toScreenY(lobbyB.y);
  const lobbySw = lobbyB.width * scale;
  const lobbySh = lobbyB.height * scale;
  rasterizer.fillRect(lobbySx, lobbySy, lobbySw, lobbySh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
  svgElements.push(
    `<rect class="common-lobby" x="${lobbySx.toFixed(1)}" y="${lobbySy.toFixed(1)}" width="${lobbySw.toFixed(1)}" height="${lobbySh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${coreStroke}" />`
  );
  for (const c of rep.commonCore.circulationBoundaries) {
    const csx = toScreenX(c.bounds.x);
    const csy = toScreenY(c.bounds.y);
    const csw = c.bounds.width * scale;
    const csh = c.bounds.height * scale;
    rasterizer.fillRect(csx, csy, csw, csh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
    svgElements.push(
      `<rect class="common-corridor" x="${csx.toFixed(1)}" y="${csy.toFixed(1)}" width="${csw.toFixed(1)}" height="${csh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${coreStroke}" />`
    );
  }
  for (const bal of rep.balconies) {
    const bsx = toScreenX(bal.bounds.x);
    const bsy = toScreenY(bal.bounds.y);
    const bsw = bal.bounds.width * scale;
    const bsh = bal.bounds.height * scale;
    rasterizer.fillRect(bsx, bsy, bsw, bsh, COL_BALCONY_FILL.r, COL_BALCONY_FILL.g, COL_BALCONY_FILL.b);
    rasterizer.drawRectOutline(bsx, bsy, bsw, bsh, Math.max(1, Math.round(roomPartitionStroke * 0.8)), COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b);
    svgElements.push(
      `<rect class="balcony" x="${bsx.toFixed(1)}" y="${bsy.toFixed(1)}" width="${bsw.toFixed(1)}" height="${bsh.toFixed(1)}" fill="#FAFAFA" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(roomPartitionStroke * 0.8))}" stroke-dasharray="4,2" />`
    );
  }
  for (const room of rep.roomBoundaries) {
    const rsx = toScreenX(room.bounds.x);
    const rsy = toScreenY(room.bounds.y);
    const rsw = room.bounds.width * scale;
    const rsh = room.bounds.height * scale;
    rasterizer.fillRect(rsx, rsy, rsw, rsh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(rsx, rsy, rsw, rsh, roomPartitionStroke, COL_WALL_INTERIOR.r, COL_WALL_INTERIOR.g, COL_WALL_INTERIOR.b);
    svgElements.push(
      `<rect class="room-partition" x="${rsx.toFixed(1)}" y="${rsy.toFixed(1)}" width="${rsw.toFixed(1)}" height="${rsh.toFixed(1)}" fill="#FFFFFF" stroke="#374151" stroke-width="${roomPartitionStroke}" />`
    );
  }
  for (const flat of rep.flatBoundaries) {
    const fsx = toScreenX(flat.bounds.x);
    const fsy = toScreenY(flat.bounds.y);
    const fsw = flat.bounds.width * scale;
    const fsh = flat.bounds.height * scale;
    rasterizer.drawRectOutline(fsx, fsy, fsw, fsh, flatBoundaryStroke, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b);
    svgElements.push(
      `<rect class="flat-boundary" x="${fsx.toFixed(1)}" y="${fsy.toFixed(1)}" width="${fsw.toFixed(1)}" height="${fsh.toFixed(1)}" fill="none" stroke="#1F2937" stroke-width="${flatBoundaryStroke}" />`
    );
  }
  for (const part of rep.majorPartitions) {
    if (part.classification === "party_wall") {
      const x0 = toScreenX(part.start.x);
      const y0 = toScreenY(part.start.y);
      const x1 = toScreenX(part.end.x);
      const y1 = toScreenY(part.end.y);
      rasterizer.drawLine(x0, y0, x1, y1, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, partyWallStroke);
      svgElements.push(
        `<line class="party-wall" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${partyWallStroke}" />`
      );
    }
  }
  for (const s of rep.commonCore.stairs) {
    const sx = toScreenX(s.bounds.x);
    const sy = toScreenY(s.bounds.y);
    const sw = s.bounds.width * scale;
    const sh = s.bounds.height * scale;
    rasterizer.fillRect(sx, sy, sw, sh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(sx, sy, sw, sh, coreStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);
    svgElements.push(
      `<rect class="stair-well" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}" fill="#FFFFFF" stroke="#111827" stroke-width="${coreStroke}" />`
    );
    if (sh >= sw) {
      const midX = sx + sw / 2;
      const landingH = Math.min(sh * 0.22, 1.2 * scale);
      rasterizer.drawLine(midX, sy + landingH, midX, sy + sh, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, coreStroke);
      svgElements.push(
        `<line class="stair-divider" x1="${midX.toFixed(1)}" y1="${(sy + landingH).toFixed(1)}" x2="${midX.toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#1F2937" stroke-width="${coreStroke}" />`
      );
      rasterizer.drawLine(sx, sy + landingH, sx + sw, sy + landingH, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(stairTreadStroke * 1.2)));
      svgElements.push(
        `<line class="stair-landing" x1="${sx.toFixed(1)}" y1="${(sy + landingH).toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${(sy + landingH).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`
      );
      const treadCount = 9;
      const treadStep = (sh - landingH) / (treadCount + 1);
      for (let t = 1; t <= treadCount; t++) {
        const ty = sy + landingH + t * treadStep;
        rasterizer.drawLine(sx, ty, midX - 2, ty, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        rasterizer.drawLine(midX + 2, ty, sx + sw, ty, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        svgElements.push(
          `<line class="stair-tread" x1="${sx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(midX - 2).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
          `<line class="stair-tread" x1="${(midX + 2).toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`
        );
      }
    } else {
      const midY = sy + sh / 2;
      const landingW = Math.min(sw * 0.22, 1.2 * scale);
      rasterizer.drawLine(sx + landingW, midY, sx + sw, midY, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, coreStroke);
      svgElements.push(
        `<line class="stair-divider" x1="${(sx + landingW).toFixed(1)}" y1="${midY.toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${midY.toFixed(1)}" stroke="#1F2937" stroke-width="${coreStroke}" />`
      );
      rasterizer.drawLine(sx + landingW, sy, sx + landingW, sy + sh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(stairTreadStroke * 1.2)));
      svgElements.push(
        `<line class="stair-landing" x1="${(sx + landingW).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + landingW).toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`
      );
      const treadCount = 9;
      const treadStep = (sw - landingW) / (treadCount + 1);
      for (let t = 1; t <= treadCount; t++) {
        const tx = sx + landingW + t * treadStep;
        rasterizer.drawLine(tx, sy, tx, midY - 2, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        rasterizer.drawLine(tx, midY + 2, tx, sy + sh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        svgElements.push(
          `<line class="stair-tread" x1="${tx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(midY - 2).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`,
          `<line class="stair-tread" x1="${tx.toFixed(1)}" y1="${(midY + 2).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`
        );
      }
    }
  }
  for (const l of rep.commonCore.lifts) {
    const lx = toScreenX(l.bounds.x);
    const ly = toScreenY(l.bounds.y);
    const lw = l.bounds.width * scale;
    const lh = l.bounds.height * scale;
    rasterizer.fillRect(lx, ly, lw, lh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(lx, ly, lw, lh, coreStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);
    rasterizer.drawCross(lx, ly, lw, lh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(coreStroke * 0.75)));
    svgElements.push(
      `<rect class="lift-shaft" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${lw.toFixed(1)}" height="${lh.toFixed(1)}" fill="#FFFFFF" stroke="#111827" stroke-width="${coreStroke}" />`,
      `<line class="lift-cross" x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(lx + lw).toFixed(1)}" y2="${(ly + lh).toFixed(1)}" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(coreStroke * 0.75))}" />`,
      `<line class="lift-cross" x1="${(lx + lw).toFixed(1)}" y1="${ly.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(ly + lh).toFixed(1)}" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(coreStroke * 0.75))}" />`
    );
  }
  for (const d of rep.commonCore.ducts) {
    const dx = toScreenX(d.bounds.x);
    const dy = toScreenY(d.bounds.y);
    const dw = d.bounds.width * scale;
    const dh = d.bounds.height * scale;
    rasterizer.fillRect(dx, dy, dw, dh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
    rasterizer.drawRectOutline(dx, dy, dw, dh, Math.max(1, Math.round(coreStroke * 0.7)), COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b);
    rasterizer.drawLine(dx, dy, dx + dw, dy + dh, COL_DUCT_HATCH.r, COL_DUCT_HATCH.g, COL_DUCT_HATCH.b, 1);
    svgElements.push(
      `<rect class="service-duct" x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" width="${dw.toFixed(1)}" height="${dh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${Math.max(1, Math.round(coreStroke * 0.7))}" />`,
      `<line class="duct-slash" x1="${dx.toFixed(1)}" y1="${dy.toFixed(1)}" x2="${(dx + dw).toFixed(1)}" y2="${(dy + dh).toFixed(1)}" stroke="#9CA3AF" stroke-width="1.5" />`
    );
  }
  const fp = rep.buildingFootprint;
  const fpx = toScreenX(fp.x);
  const fpy = toScreenY(fp.y);
  const fpw = fp.width * scale;
  const fph = fp.height * scale;
  rasterizer.drawRectOutline(fpx, fpy, fpw, fph, outerWallStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);
  svgElements.push(
    `<rect class="outer-building-boundary" x="${fpx.toFixed(1)}" y="${fpy.toFixed(1)}" width="${fpw.toFixed(1)}" height="${fph.toFixed(1)}" fill="none" stroke="#111827" stroke-width="${outerWallStroke}" stroke-linejoin="miter" stroke-linecap="square" />`
  );
  for (const door of rep.doors) {
    const cx = toScreenX(door.center.x);
    const cy = toScreenY(door.center.y);
    const dWidthPx = door.widthM * scale;
    const isEntrance = door.kind === "flat_entrance";
    const dStroke = isEntrance ? Math.max(2, Math.round(doorStroke * 1.3)) : doorStroke;
    if (door.wallAxis === "x") {
      const x0 = cx - dWidthPx / 2;
      const x1 = cx + dWidthPx / 2;
      rasterizer.drawLine(x0, cy, x1, cy, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b, outerWallStroke + 2);
      svgElements.push(
        `<line class="door-opening-cut" x1="${x0.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#FFFFFF" stroke-width="${outerWallStroke + 2}" />`
      );
      if (door.doorType === "open_passage") {
        rasterizer.drawLine(x0, cy - 4, x0, cy + 4, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(x1, cy - 4, x1, cy + 4, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="jamb" x1="${x0.toFixed(1)}" y1="${(cy - 4).toFixed(1)}" x2="${x0.toFixed(1)}" y2="${(cy + 4).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="jamb" x1="${x1.toFixed(1)}" y1="${(cy - 4).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(cy + 4).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`
        );
      } else if (door.doorType === "sliding") {
        const half = dWidthPx * 0.55;
        rasterizer.drawLine(x0, cy - 2, x0 + half, cy - 2, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(x1 - half, cy + 2, x1, cy + 2, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="sliding-panel" x1="${x0.toFixed(1)}" y1="${(cy - 2).toFixed(1)}" x2="${(x0 + half).toFixed(1)}" y2="${(cy - 2).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="sliding-panel" x1="${(x1 - half).toFixed(1)}" y1="${(cy + 2).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(cy + 2).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`
        );
      } else {
        const signY = door.swing === "outward" ? -1 : 1;
        const leafTipX = x0;
        const leafTipY = cy + signY * dWidthPx;
        rasterizer.drawLine(x0, cy, leafTipX, leafTipY, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        const startRad = 0;
        const endRad = signY > 0 ? Math.PI / 2 : -Math.PI / 2;
        rasterizer.drawArc(x0, cy, dWidthPx, Math.min(startRad, endRad), Math.max(startRad, endRad), COL_DOOR_ARC.r, COL_DOOR_ARC.g, COL_DOOR_ARC.b, 1, true);
        const sweepFlag = signY > 0 ? 1 : 0;
        svgElements.push(
          `<line class="door-leaf" x1="${x0.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${leafTipX.toFixed(1)}" y2="${leafTipY.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<path class="door-arc" d="M ${x1.toFixed(1)} ${cy.toFixed(1)} A ${dWidthPx.toFixed(1)} ${dWidthPx.toFixed(1)} 0 0 ${sweepFlag} ${leafTipX.toFixed(1)} ${leafTipY.toFixed(1)}" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-dasharray="4,3" />`
        );
      }
    } else {
      const y0 = cy - dWidthPx / 2;
      const y1 = cy + dWidthPx / 2;
      rasterizer.drawLine(cx, y0, cx, y1, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b, outerWallStroke + 2);
      svgElements.push(
        `<line class="door-opening-cut" x1="${cx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#FFFFFF" stroke-width="${outerWallStroke + 2}" />`
      );
      if (door.doorType === "open_passage") {
        rasterizer.drawLine(cx - 4, y0, cx + 4, y0, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(cx - 4, y1, cx + 4, y1, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="jamb" x1="${(cx - 4).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(cx + 4).toFixed(1)}" y2="${y0.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="jamb" x1="${(cx - 4).toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(cx + 4).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`
        );
      } else if (door.doorType === "sliding") {
        const half = dWidthPx * 0.55;
        rasterizer.drawLine(cx - 2, y0, cx - 2, y0 + half, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(cx + 2, y1 - half, cx + 2, y1, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(
          `<line class="sliding-panel" x1="${(cx - 2).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(cx - 2).toFixed(1)}" y2="${(y0 + half).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<line class="sliding-panel" x1="${(cx + 2).toFixed(1)}" y1="${(y1 - half).toFixed(1)}" x2="${(cx + 2).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`
        );
      } else {
        const signX = door.swing === "outward" ? -1 : 1;
        const leafTipX = cx + signX * dWidthPx;
        const leafTipY = y0;
        rasterizer.drawLine(cx, y0, leafTipX, leafTipY, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        const startRad = Math.PI / 2;
        const endRad = signX > 0 ? 0 : Math.PI;
        rasterizer.drawArc(cx, y0, dWidthPx, Math.min(startRad, endRad), Math.max(startRad, endRad), COL_DOOR_ARC.r, COL_DOOR_ARC.g, COL_DOOR_ARC.b, 1, true);
        const sweepFlag = signX > 0 ? 0 : 1;
        svgElements.push(
          `<line class="door-leaf" x1="${cx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${leafTipX.toFixed(1)}" y2="${leafTipY.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`,
          `<path class="door-arc" d="M ${cx.toFixed(1)} ${y1.toFixed(1)} A ${dWidthPx.toFixed(1)} ${dWidthPx.toFixed(1)} 0 0 ${sweepFlag} ${leafTipX.toFixed(1)} ${leafTipY.toFixed(1)}" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-dasharray="4,3" />`
        );
      }
    }
  }
  if (options.debug) {
    const debugSvg = [];
    for (const room of rep.roomBoundaries) {
      const rx = toScreenX(room.bounds.x + room.bounds.width / 2);
      const ry = toScreenY(room.bounds.y + room.bounds.height / 2);
      debugSvg.push(
        `<text x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" font-family="monospace" font-size="12" fill="#DC2626" text-anchor="middle" dominant-baseline="middle">${room.id}</text>`
      );
    }
    for (const flat of rep.flatBoundaries) {
      const fx = toScreenX(flat.bounds.x + 1);
      const fy = toScreenY(flat.bounds.y + 1);
      debugSvg.push(
        `<text x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" font-family="monospace" font-size="14" font-weight="bold" fill="#2563EB">${flat.id}</text>`
      );
    }
    svgElements.push(`<g id="debug-overlay">${debugSvg.join("")}</g>`);
  }
  const svgContent = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="${canvasWidth}" height="${canvasHeight}">`,
    `  <rect width="100%" height="100%" fill="#FFFFFF" />`,
    `  <g id="structural-geometry">`,
    `    ${svgElements.join("\n    ")}`,
    `  </g>`,
    `</svg>`
  ].join("\n");
  const pngBuffer = rasterizer.toPng();
  const hash = crypto2.createHash("sha256").update(pngBuffer).digest("hex");
  return {
    png: pngBuffer,
    svg: svgContent,
    width: canvasWidth,
    height: canvasHeight,
    boundingBox: bbox,
    rendererVersion: STRUCTURAL_RENDERER_VERSION,
    hash,
    sourceRepresentationId: `structural_v${rep.version}`
  };
}

// packages/ai-orchestration/src/providers/gemini-image.ts
var DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3-pro-image";
var DEFAULT_GEMINI_IMAGE_SIZE = "2K";
var GEMINI_IMAGE_PROVIDER_NAME = "gemini";
var GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
function mapDimensionsToGeminiAspectRatio(width, height) {
  if (!width || !height || width <= 0 || height <= 0) {
    return "4:3";
  }
  const ratio = width / height;
  if (ratio >= 1.55) return "16:9";
  if (ratio >= 1.15) return "4:3";
  if (ratio >= 0.87) return "1:1";
  if (ratio >= 0.65) return "3:4";
  return "9:16";
}
function buildGeminiImagePrompt(request, options) {
  const sections = [];
  sections.push(
    "==================================================\nARCHITECTURAL RENDERING DIRECTIVE \u2014 APARTMENT FLOOR PLAN\n=================================================="
  );
  sections.push(
    "PRIMARY MANDATE (IMAGE 1 \u2014 AUTHORITATIVE STRUCTURAL PLAN):\n- Image 1 is the AUTHORITATIVE ARCHITECTURAL STRUCTURAL PLAN.\n- Render the supplied architectural structural plan as a professional Indian apartment floor plan.\n- Treat the supplied structural plan as authoritative.\n- Preserve its geometry exactly.\n- Do not redesign the layout.\n- Do not add or remove apartments.\n- Do not move the core.\n- Do not move lifts or stairs.\n- Do not change flat boundaries.\n- Do not change door/entrance relationships.\n- Do not invent room topology.\n- Treat the supplied structural drawing as a technical architectural underlay."
  );
  if (options.styleReferenceCount > 0) {
    sections.push(
      `STYLE REFERENCES (ADDITIONAL IMAGES):
- The ${options.styleReferenceCount} additional reference image(s) are ARCHITECTURAL STYLE REFERENCES only.
- They illustrate visual presentation, drafting line weight hierarchy, subtle furniture placement, and clean material tones.
- Style references must NEVER override the structural plan.
- Do not copy geometry from style references.
- Do not copy room arrangements or flat counts from style references.
- If a style reference conflicts with the structural plan in any way: THE STRUCTURAL PLAN WINS.`
    );
  }
  sections.push(
    "ARCHITECTURAL STYLE & PRESENTATION:\n- Presentation: Professional Indian apartment architectural floor plan.\n- View: Top-down orthographic 2D floor plan view only.\n- Drafting: Clean architectural drafting, strong dark outer and demising walls, lighter secondary internal partitions.\n- Common Core: Clearly distinguished common lobby, readable staircases with treads, clearly delineated lift shafts.\n- Doors & Openings: Clean door openings with proper 90-degree swing arcs connecting to correct spaces.\n- Balconies: Clean structural cantilever projections with defined railings.\n- Interior Scale: Subtle standard furniture symbols (beds, wardrobes, dining table, living seating) and realistic kitchen/bath fixture placement.\n- Restrained, neutral palette: white background, crisp dark architectural lines, no decorative clutter."
  );
  sections.push(
    "STRICTLY FORBIDDEN:\n- Do NOT generate 3D perspective views, isometric views, or axonometric angles.\n- Do NOT generate exterior building renderings, facades, or street-level views.\n- Do NOT generate aerial views or landscape perspective illustrations.\n- Do NOT generate decorative real-estate marketing posters or watercolor illustrations.\n- Do NOT add people, cars, trees, or exterior landscaping.\n- Do NOT alter apartment boundaries, flat counts, or room counts."
  );
  sections.push(
    "TEXT & TYPOGRAPHY POLICY:\n- Do NOT render authoritative room labels, dimension text, or area figures.\n- Maintain pristine technical drafting clarity without typographic clutter."
  );
  if (request.prompt && request.prompt.trim().length > 0) {
    sections.push(`PROJECT BRIEF CONTEXT:
${request.prompt.trim()}`);
  }
  return sections.join("\n\n");
}
function separateGeminiReferenceImages(referenceImages) {
  if (!referenceImages || referenceImages.length === 0) {
    return { structuralRef: null, styleRefs: [] };
  }
  const structuralIdx = referenceImages.findIndex(
    (r) => r.id === "structural_reference" || r.id === "schematic_scaffold"
  );
  if (structuralIdx >= 0) {
    const structuralRef = referenceImages[structuralIdx] ?? null;
    const styleRefs = referenceImages.filter((_, idx) => idx !== structuralIdx);
    return { structuralRef, styleRefs };
  }
  return {
    structuralRef: referenceImages[0] ?? null,
    styleRefs: referenceImages.slice(1)
  };
}
function buildGeminiImageRequestBody(request, options) {
  const { structuralRef, styleRefs } = separateGeminiReferenceImages(request.referenceImages);
  const aspectRatio = mapDimensionsToGeminiAspectRatio(request.width, request.height);
  const compiledPrompt = buildGeminiImagePrompt(request, {
    hasStructuralPlan: Boolean(structuralRef),
    styleReferenceCount: styleRefs.length
  });
  const parts = [];
  const referenceIdsSent = [];
  if (structuralRef) {
    parts.push({
      inlineData: {
        mimeType: structuralRef.mimeType || "image/png",
        data: structuralRef.base64Data
      }
    });
    referenceIdsSent.push(structuralRef.id);
  }
  for (const styleRef of styleRefs) {
    parts.push({
      inlineData: {
        mimeType: styleRef.mimeType || "image/png",
        data: styleRef.base64Data
      }
    });
    referenceIdsSent.push(styleRef.id);
  }
  parts.push({
    text: compiledPrompt
  });
  const body = {
    contents: [
      {
        role: "user",
        parts
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio,
        imageSize: options.imageSize
      }
    }
  };
  return {
    body,
    structuralRef,
    styleRefs,
    aspectRatio,
    compiledPrompt,
    referenceIdsSent
  };
}
function extractGeminiImageBytes(responseJson) {
  if (!responseJson || typeof responseJson !== "object") {
    throw new ImageProviderError("IMAGE_DECODE_FAILED", "Gemini response was empty or not an object.");
  }
  const res = responseJson;
  if (res.error && typeof res.error === "object") {
    const err = res.error;
    const code = err.code ?? 500;
    const msg = err.message ?? "Unknown Gemini API error";
    if (code === 401 || code === 403) {
      throw new ImageProviderError("GEMINI_AUTH_ERROR", `Gemini authentication failed: ${msg}`, code);
    }
    if (code === 429 || err.status === "RESOURCE_EXHAUSTED") {
      throw new ImageProviderError("GEMINI_RATE_LIMITED", `Gemini quota/rate limit exceeded: ${msg}`, code);
    }
    throw new ImageProviderError("API_ERROR", `Gemini API returned error: ${msg}`, code);
  }
  const textParts = [];
  let foundBase64 = null;
  let foundMime = null;
  if (Array.isArray(res.candidates)) {
    for (const cand of res.candidates) {
      if (!cand || typeof cand !== "object") continue;
      const content = cand.content;
      if (!content || !Array.isArray(content.parts)) continue;
      for (const part of content.parts) {
        if (!part || typeof part !== "object") continue;
        const p = part;
        if (typeof p.text === "string" && p.text.trim().length > 0) {
          textParts.push(p.text);
        }
        const inline = p.inlineData ?? p.inline_data;
        if (inline && typeof inline.data === "string" && inline.data.length > 0) {
          foundBase64 = inline.data;
          foundMime = inline.mimeType ?? inline.mime_type ?? "image/png";
          break;
        }
      }
      if (foundBase64) break;
    }
  }
  if (!foundBase64 && Array.isArray(res.predictions)) {
    for (const pred of res.predictions) {
      if (pred && typeof pred === "object") {
        const p = pred;
        if (typeof p.bytesBase64Encoded === "string" && p.bytesBase64Encoded.length > 0) {
          foundBase64 = p.bytesBase64Encoded;
          foundMime = p.mimeType ?? "image/png";
          break;
        }
      }
    }
  }
  if (!foundBase64) {
    const detail = textParts.length > 0 ? ` Returned text: "${textParts.join(" ").substring(0, 150)}"` : "";
    throw new ImageProviderError("IMAGE_EMPTY", `Gemini response contained no image payload.${detail}`);
  }
  const buffer = Buffer.from(foundBase64, "base64");
  if (buffer.length < 5e3) {
    throw new ImageProviderError("IMAGE_EMPTY", `Decoded image payload is suspiciously small (${buffer.length} bytes).`);
  }
  const isPng = buffer[0] === 137 && buffer[1] === 80 && buffer[2] === 78 && buffer[3] === 71;
  const isJpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  let mimeType = "image/png";
  if (isJpeg || foundMime === "image/jpeg") {
    mimeType = "image/jpeg";
  } else if (!isPng && foundMime !== "image/png") {
    throw new ImageProviderError("IMAGE_DECODE_FAILED", `Unsupported image header (magic: ${buffer.subarray(0, 4).toString("hex")}).`);
  }
  return {
    buffer,
    mimeType,
    textParts: textParts.length > 0 ? textParts : void 0
  };
}
var GeminiImageProvider = class {
  name = GEMINI_IMAGE_PROVIDER_NAME;
  apiKey;
  model;
  endpointBase;
  imageSize;
  timeoutMs;
  fetchImpl;
  constructor(options) {
    this.apiKey = (options.apiKey ?? "").trim();
    this.model = (options.model ?? "").trim() || DEFAULT_GEMINI_IMAGE_MODEL;
    this.endpointBase = (options.endpointBase ?? "").trim() || GEMINI_API_BASE_URL;
    this.imageSize = options.imageSize ?? DEFAULT_GEMINI_IMAGE_SIZE;
    this.timeoutMs = options.timeoutMs ?? 12e4;
    this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }
  isConfigured() {
    return this.apiKey.length > 0;
  }
  async isAvailable() {
    return this.isConfigured();
  }
  getModel() {
    return this.model;
  }
  getImageSize() {
    return this.imageSize;
  }
  async generateFloorPlan(request) {
    if (!this.isConfigured()) {
      throw new ImageProviderError(
        "GEMINI_AUTH_ERROR",
        "Gemini image generation is not configured on the server (GEMINI_API_KEY missing)."
      );
    }
    const {
      body,
      structuralRef,
      styleRefs,
      aspectRatio,
      compiledPrompt,
      referenceIdsSent
    } = buildGeminiImageRequestBody(request, {
      model: this.model,
      imageSize: this.imageSize
    });
    const promptHash = crypto3.createHash("sha256").update(compiledPrompt).digest("hex");
    const structuralImageHash = structuralRef ? crypto3.createHash("sha256").update(structuralRef.base64Data).digest("hex") : void 0;
    const structuralRepHash = request.metadata?.structuralRepresentationHash;
    const referenceHashes = styleRefs.map(
      (r) => crypto3.createHash("sha256").update(r.base64Data).digest("hex")
    );
    const url = `${this.endpointBase}/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const startedAt = Date.now();
    try {
      let response3;
      try {
        response3 = await this.fetchImpl(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } catch (netErr) {
        if (netErr instanceof Error && (netErr.name === "AbortError" || netErr.name === "TimeoutError")) {
          throw new ImageProviderError(
            "IMAGE_PROVIDER_TIMEOUT",
            `Gemini image generation timed out after ${this.timeoutMs} ms.`
          );
        }
        const cause = netErr instanceof Error ? netErr.message : String(netErr);
        throw new ImageProviderError(
          "API_ERROR",
          `Gemini network request failed: ${cause}`
        );
      }
      const latencyMs = Date.now() - startedAt;
      const apiRequestId = response3.headers.get("x-request-id") ?? void 0;
      if (!response3.ok) {
        const errorText = await response3.text().catch(() => "");
        let parsedMessage = errorText;
        let isQuota = false;
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.error?.message) {
            parsedMessage = parsed.error.message;
            if (parsed.error.status === "RESOURCE_EXHAUSTED" || parsed.error.message.includes("quota")) {
              isQuota = true;
            }
          }
        } catch {
        }
        if (response3.status === 401 || response3.status === 403) {
          throw new ImageProviderError(
            "GEMINI_AUTH_ERROR",
            `Gemini API key rejected (HTTP ${response3.status}): ${parsedMessage}`,
            response3.status
          );
        }
        if (response3.status === 429 || isQuota) {
          throw new ImageProviderError(
            "GEMINI_RATE_LIMITED",
            `Gemini quota or rate limit exceeded: ${parsedMessage}`,
            response3.status
          );
        }
        if (response3.status === 408 || response3.status === 504) {
          throw new ImageProviderError(
            "IMAGE_PROVIDER_TIMEOUT",
            `Gemini request timed out with HTTP ${response3.status}: ${parsedMessage}`,
            response3.status
          );
        }
        throw new ImageProviderError(
          "API_ERROR",
          `Gemini API returned HTTP ${response3.status}: ${parsedMessage}`,
          response3.status
        );
      }
      let responseJson;
      try {
        responseJson = await response3.json();
      } catch (jsonErr) {
        throw new ImageProviderError(
          "IMAGE_DECODE_FAILED",
          `Failed to parse Gemini response as JSON: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`
        );
      }
      const { buffer, mimeType } = extractGeminiImageBytes(responseJson);
      const provenance = {
        endpoint: `${this.endpointBase}/${this.model}:generateContent`,
        size: this.imageSize,
        seedSent: false,
        // Gemini generateContent does not accept fixed random seeds
        referenceIdsSent,
        promptHash,
        structuralImageHash,
        structuralRepresentationHash: structuralRepHash,
        referenceHashes,
        rendererVersion: STRUCTURAL_RENDERER_VERSION,
        aspectRatio,
        apiRequestId
      };
      return {
        imageBase64: buffer.toString("base64"),
        mimeType,
        provider: this.name,
        model: this.model,
        seed: request.seed,
        promptVersion: request.promptVersion,
        prompt: compiledPrompt,
        generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        latencyMs,
        referenceDiagnostics: request.referenceDiagnostics,
        providerRequest: provenance
      };
    } finally {
      clearTimeout(timer);
    }
  }
};

// packages/ai-orchestration/src/apartment/layout-planner.ts
var STRATEGY_PARAMS = {
  balanced: {
    serviceBand: 2.4,
    passage: 1.1,
    balconyDepth: 1.5,
    lobbyWidth: 3,
    lobbyMinLength: 3,
    preSuite: "ensuite",
    stagger: 0,
    opposedEntries: false,
    groupLifts: false
  },
  daylight: {
    // 2.2 m: the kitchen sits across the service band and needs > 2.1 m clear.
    serviceBand: 2.2,
    passage: 1,
    balconyDepth: 1.8,
    lobbyWidth: 2.7,
    lobbyMinLength: 2.7,
    preSuite: "ensuite",
    stagger: 0,
    opposedEntries: false,
    groupLifts: false
  },
  privacy: {
    serviceBand: 2.4,
    passage: 1.2,
    balconyDepth: 1.5,
    lobbyWidth: 3,
    lobbyMinLength: 3.6,
    preSuite: "ensuite",
    stagger: 2.4,
    opposedEntries: true,
    groupLifts: false
  },
  circulation: {
    serviceBand: 2.3,
    passage: 1,
    balconyDepth: 1.35,
    lobbyWidth: 2.4,
    lobbyMinLength: 2.4,
    preSuite: "ensuite_or_plain",
    stagger: 0,
    opposedEntries: false,
    groupLifts: true
  }
};
var COMMON_LOBBY_ID = "core_lobby";
var r3 = (v) => Math.round(v * 1e3) / 1e3;
function rectFromEdges(x0, y0, x1, y1) {
  const ax = r3(Math.min(x0, x1));
  const ay = r3(Math.min(y0, y1));
  return { x: ax, y: ay, width: r3(r3(Math.max(x0, x1)) - ax), height: r3(r3(Math.max(y0, y1)) - ay) };
}
var areaOf = (r) => Math.max(0, r.width) * Math.max(0, r.height);
function overlapArea2(a, b) {
  const w = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return w > 1e-6 && h > 1e-6 ? w * h : 0;
}
function unionRect(rects) {
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.width));
  const y1 = Math.max(...rects.map((r) => r.y + r.height));
  return rectFromEdges(x0, y0, x1, y1);
}
function sharedEdgeBetween(a, b, eps = 2e-3) {
  const ax1 = a.x + a.width;
  const ay1 = a.y + a.height;
  const bx1 = b.x + b.width;
  const by1 = b.y + b.height;
  for (const [at, ok] of [[ax1, Math.abs(ax1 - b.x) < eps], [a.x, Math.abs(bx1 - a.x) < eps]]) {
    if (!ok) continue;
    const from = Math.max(a.y, b.y);
    const to = Math.min(ay1, by1);
    if (to - from > eps) return { vertical: true, at, from, to };
  }
  for (const [at, ok] of [[ay1, Math.abs(ay1 - b.y) < eps], [a.y, Math.abs(by1 - a.y) < eps]]) {
    if (!ok) continue;
    const from = Math.max(a.x, b.x);
    const to = Math.min(ax1, bx1);
    if (to - from > eps) return { vertical: false, at, from, to };
  }
  return null;
}
var sum = (xs) => xs.reduce((a, b) => a + b, 0);
var clamp2 = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
var LOBBY_NODE = COMMON_LOBBY_ID;
function zoneForType(type) {
  switch (type) {
    case "foyer":
    case "living_dining":
      return "PUBLIC";
    case "kitchen":
    case "utility":
    case "master_toilet":
    case "common_toilet":
    case "powder_room":
    case "store":
      return "SERVICE";
    case "balcony":
      return "OUTDOOR";
    default:
      return "PRIVATE";
  }
}
function uvRoom(room, band, u0, u1, v0, v1, extra = {}) {
  return {
    id: room.id,
    name: room.name,
    type: room.type,
    zone: zoneForType(room.type),
    band,
    u0,
    u1,
    v0,
    v1,
    targetAreaSqM: room.targetAreaSqM,
    ...room.isEnsuite !== void 0 ? { isEnsuite: room.isEnsuite } : {},
    ...room.hasBalcony !== void 0 ? { hasBalcony: room.hasBalcony } : {},
    ...extra
  };
}
function stackServiceBand(items, v0, v1, s, filler, fillerAt, ensuiteOf) {
  const span = v1 - v0;
  const total = sum(items.map((i) => i.len));
  let lens = items.map((i) => i.len);
  let fillerLen = 0;
  if (items.length === 0 || span - total >= 1) {
    fillerLen = span - total;
  } else if (total > 0) {
    lens = lens.map((l) => l * span / total);
  }
  const rooms = [];
  let fillerRoom = null;
  let cursor = v0;
  const placeFiller = () => {
    if (fillerLen <= 1e-6) return;
    const longFiller = fillerLen > 2.4 && filler.kind === "store";
    const kind = longFiller ? "study" : filler.kind;
    const name = kind === "study" ? "Study" : kind === "dress" ? "Dressing" : "Store";
    fillerRoom = uvRoom({ id: filler.id, name, type: kind, targetAreaSqM: 0 }, "service", 0, s, cursor, cursor + fillerLen);
    cursor += fillerLen;
  };
  if (fillerAt === "start") placeFiller();
  items.forEach((it, i) => {
    const l = lens[i];
    const bedId = ensuiteOf.get(it.room.id);
    rooms.push(uvRoom(it.room, "service", 0, s, cursor, cursor + l, bedId ? { ensuiteOf: bedId } : {}));
    cursor += l;
  });
  if (fillerAt === "end") placeFiller();
  return { rooms, fillerRoom, fillerDoorFrom: fillerRoom ? filler.opensFrom : null };
}
function planUnitUV(flat, p, rules) {
  const fid = flat.flatId;
  const issues = [];
  const all = flat.allocation.rooms;
  const first = (t) => all.find((r2) => r2.type === t) ?? null;
  const synth = (suffix, name, type, area2, minW) => ({
    id: `${fid}_${suffix}`,
    name,
    type,
    minAreaSqM: area2,
    minWidthM: minW,
    targetAreaSqM: area2
  });
  const foyer = first("foyer") ?? synth("foyer", "Entrance Foyer", "foyer", 2.4, 1.2);
  const ld = first("living_dining") ?? synth("living_dining", "Living & Dining Room", "living_dining", 14, 3);
  const kitchen = first("kitchen") ?? synth("kitchen", "Kitchen", "kitchen", 6, 1.8);
  const utility = first("utility");
  const master = first("master_bedroom");
  const others = all.filter((r2) => r2.type === "bedroom");
  const baths = all.filter((r2) => r2.type === "master_toilet" || r2.type === "common_toilet" || r2.type === "powder_room");
  const balconies = all.filter((r2) => r2.type === "balcony");
  const beds = [...master ? [master] : [], ...others];
  const bathOfBed = /* @__PURE__ */ new Map();
  const bedOfBath = /* @__PURE__ */ new Map();
  const common2 = [];
  for (const bath of baths) {
    if (!bath.isEnsuite) {
      common2.push(bath);
      continue;
    }
    let bed;
    if (/_master_toilet$/.test(bath.id) && master) bed = master;
    const m = /_toilet_(\d+)$/.exec(bath.id);
    if (!bed && m) bed = beds.find((b) => b.id.endsWith(`_bedroom_${m[1]}`));
    if (!bed) bed = beds.find((b) => !bathOfBed.has(b.id));
    if (bed && !bathOfBed.has(bed.id)) {
      bathOfBed.set(bed.id, bath);
      bedOfBath.set(bath.id, bed.id);
    } else {
      common2.push(bath);
    }
  }
  const nonMaster = beds.filter((b) => b !== master);
  let pre = null;
  const ensuiteNonMaster = nonMaster.find((b) => bathOfBed.has(b.id));
  if (ensuiteNonMaster) {
    pre = { bed: ensuiteNonMaster, items: [bathOfBed.get(ensuiteNonMaster.id)], ctFromFoyer: false };
  } else if (p.preSuite === "ensuite_or_plain" && nonMaster.length > 0 && common2.length > 0) {
    pre = { bed: nonMaster[0], items: [common2.shift()], ctFromFoyer: true };
  }
  const endBed = master ?? nonMaster[nonMaster.length - 1] ?? null;
  const wBeds = nonMaster.filter((b) => b !== pre?.bed && b !== endBed).sort((a, b) => Number(bathOfBed.has(a.id)) - Number(bathOfBed.has(b.id)));
  const pCommon = wBeds.length === 0 ? common2.splice(0) : [];
  const wCommon = common2;
  const utilityIn = !utility ? null : wBeds.length > 0 ? "W" : endBed ? "S" : "P";
  const s = p.serviceBand;
  const c = p.passage;
  const bd = p.balconyDepth;
  const canon = (key) => ({
    area: (MINIMUM_ROOM_AREAS[key] ?? 0) / 1e6 * 1.04,
    dim: (MINIMUM_DIMENSIONS[key] ?? 0) / 1e3 + (MINIMUM_DIMENSIONS[key] ? 0.05 : 0)
  });
  const len = (area2, width, minLen, canonKey) => {
    const k = canonKey ? canon(canonKey) : { area: 0, dim: 0 };
    return Math.max(minLen, k.dim, area2 / width, k.area / width);
  };
  const minBedLen = (b) => Math.max(
    2.7,
    b.minWidthM,
    b === master ? rules.habitableRoomMinimums.masterHabitableRoomMinWidthM : rules.habitableRoomMinimums.otherHabitableRoomMinWidthM
  );
  const bedLenFor = (b, width) => len(b.targetAreaSqM, width, minBedLen(b), "bedroom");
  const bathLenFor = (b, width) => len(b.targetAreaSqM, width, Math.max(1.5, rules.combinedToiletMinimums.minWidthM), "bathroom");
  const utilLenFor = (u) => len(u.targetAreaSqM, s, Math.max(1.2, rules.utilityMinimums.minWidthM), "utility");
  const fLen = len(foyer.targetAreaSqM, s, Math.max(1.2, foyer.minWidthM), "foyer");
  const ctPLens = pCommon.map((b) => bathLenFor(b, s));
  let kLen = len(kitchen.targetAreaSqM, s, Math.max(1.8, rules.kitchenMinimums.minWidthM), "kitchen");
  const uPLen = utilityIn === "P" && utility ? utilLenFor(utility) : 0;
  const stack = fLen + sum(ctPLens) + kLen + uPLen;
  const rMin = Math.max(2.7, canon("bedroom").dim);
  const w = r3(clamp2(s + ld.targetAreaSqM / stack, s + c + rMin, s + c + 4.8));
  const lp = Math.max(stack, ld.targetAreaSqM / (w - s), canon("living").dim, canon("living").area / (w - s));
  kLen += lp - stack;
  const r = w - s - c;
  const rooms = [];
  const doors = [];
  const door = (a, b, widthM, doorType = "single", kind = "internal") => doors.push({ a, b, widthM, doorType, kind });
  let v = 0;
  if (pre) {
    const bedLen = bedLenFor(pre.bed, w - s);
    const itemLens = pre.items.map((i) => bathLenFor(i, s));
    const segLen = Math.max(bedLen, sum(itemLens));
    rooms.push(uvRoom(pre.bed, "full", s, w, v, v + segLen));
    const stacked = stackServiceBand(
      pre.items.map((room, i) => ({ room, len: itemLens[i] })),
      v,
      v + segLen,
      s,
      { id: `${fid}_dress_1`, kind: "dress", opensFrom: pre.bed.id },
      "start",
      bedOfBath
    );
    rooms.push(...stacked.rooms);
    if (stacked.fillerRoom) {
      rooms.push(stacked.fillerRoom);
      door(stacked.fillerDoorFrom, stacked.fillerRoom.id, 0.75);
    }
    door(ld.id, pre.bed.id, 0.9);
    for (const item of pre.items) {
      if (pre.ctFromFoyer) door(foyer.id, item.id, 0.75);
      else door(pre.bed.id, item.id, 0.75);
    }
    v += segLen;
  }
  const vP0 = v;
  rooms.push(uvRoom(foyer, "service", 0, s, vP0, vP0 + fLen));
  let cursor = vP0 + fLen;
  pCommon.forEach((bath, i) => {
    rooms.push(uvRoom(bath, "service", 0, s, cursor, cursor + ctPLens[i]));
    door(foyer.id, bath.id, 0.75);
    cursor += ctPLens[i];
  });
  rooms.push(uvRoom(kitchen, "service", 0, s, cursor, cursor + kLen));
  cursor += kLen;
  if (utilityIn === "P" && utility) {
    rooms.push(uvRoom(utility, "service", 0, s, cursor, cursor + uPLen));
    door(kitchen.id, utility.id, 0.8);
  }
  rooms.push(uvRoom(ld, "full", s, w, vP0, vP0 + lp));
  door(LOBBY_NODE, foyer.id, 1, "single", "flat_entrance");
  door(foyer.id, ld.id, 1, "open_passage");
  door(ld.id, kitchen.id, 0.9);
  v = vP0 + lp;
  let passageId = null;
  if (wBeds.length > 0) {
    const vW0 = v;
    const segs = wBeds.map((bed) => {
      const bath = bathOfBed.get(bed.id);
      return { bed, bath, bedLen: bedLenFor(bed, r), bathLen: bath ? bathLenFor(bath, r) : 0 };
    });
    const sItems = [
      ...utilityIn === "W" && utility ? [{ room: utility, len: utilLenFor(utility) }] : [],
      ...wCommon.map((room) => ({ room, len: bathLenFor(room, s) }))
    ];
    const wingLen = sum(segs.map((sg) => sg.bedLen + sg.bathLen));
    const need = sum(sItems.map((i) => i.len));
    if (need > wingLen) segs[segs.length - 1].bedLen += need - wingLen;
    for (const sg of segs) {
      rooms.push(uvRoom(sg.bed, "facade", s + c, w, v, v + sg.bedLen));
      if (sg.bath) {
        rooms.push(uvRoom(sg.bath, "facade", s + c, w, v + sg.bedLen, v + sg.bedLen + sg.bathLen, { ensuiteOf: sg.bed.id }));
        door(sg.bed.id, sg.bath.id, 0.75);
      }
      v += sg.bedLen + sg.bathLen;
    }
    const vW1 = v;
    passageId = `${fid}_passage`;
    rooms.push(uvRoom({ id: passageId, name: "Private Passage", type: "passage", targetAreaSqM: 0 }, "passage", s, s + c, vW0, vW1));
    const stacked = stackServiceBand(sItems, vW0, vW1, s, { id: `${fid}_store_1`, kind: "store", opensFrom: passageId }, "end", bedOfBath);
    rooms.push(...stacked.rooms);
    if (stacked.fillerRoom) {
      rooms.push(stacked.fillerRoom);
      door(passageId, stacked.fillerRoom.id, 0.75);
    }
    door(ld.id, passageId, 0.9, "open_passage");
    for (const sg of segs) door(passageId, sg.bed.id, 0.9);
    for (const item of stacked.rooms) {
      if (utility && item.id === utility.id) door(kitchen.id, utility.id, 0.8);
      else door(passageId, item.id, 0.75);
    }
  }
  if (endBed) {
    const bath = bathOfBed.get(endBed.id);
    const bedLen = bedLenFor(endBed, w - s);
    const items = [
      ...utilityIn === "S" && utility ? [{ room: utility, len: utilLenFor(utility) }] : [],
      ...bath ? [{ room: bath, len: bathLenFor(bath, s) }] : []
    ];
    const segLen = Math.max(bedLen, sum(items.map((i) => i.len)));
    rooms.push(uvRoom(endBed, "full", s, w, v, v + segLen));
    const stacked = stackServiceBand(items, v, v + segLen, s, { id: `${fid}_dress_2`, kind: "dress", opensFrom: endBed.id }, "end", bedOfBath);
    rooms.push(...stacked.rooms);
    if (stacked.fillerRoom) {
      rooms.push(stacked.fillerRoom);
      door(endBed.id, stacked.fillerRoom.id, 0.75);
    }
    door(passageId ?? ld.id, endBed.id, 0.9);
    for (const item of stacked.rooms) {
      if (utility && item.id === utility.id) door(kitchen.id, utility.id, 0.8);
      else door(endBed.id, item.id, 0.75);
    }
    v += segLen;
  }
  const h = v;
  const facadeHosts = rooms.filter((rm) => rm.u1 >= w - 1e-6 && (rm.type === "living_dining" || rm.type === "master_bedroom" || rm.type === "bedroom"));
  const usedHosts = /* @__PURE__ */ new Set();
  const outBalconies = [];
  for (const bal of balconies) {
    const preferred = /master/i.test(bal.id) && endBed ? endBed.id : ld.id;
    const host = facadeHosts.find((hr) => hr.id === preferred && !usedHosts.has(hr.id)) ?? facadeHosts.find((hr) => !usedHosts.has(hr.id));
    if (!host) {
      issues.push(`${flat.flatLabel}: no free facade room for ${bal.name}.`);
      continue;
    }
    const hostLen = host.v1 - host.v0;
    const maxLen = hostLen - 0.3;
    const bl = Math.min(maxLen, Math.max(1.5, bal.targetAreaSqM / bd));
    if (bl < 1.2) {
      issues.push(`${flat.flatLabel}: ${host.name} facade too short for ${bal.name}.`);
      continue;
    }
    const mid = (host.v0 + host.v1) / 2;
    usedHosts.add(host.id);
    outBalconies.push(uvRoom(bal, "projection", w, w + bd, mid - bl / 2, mid + bl / 2, { hostRoomId: host.id }));
    door(host.id, bal.id, Math.min(1.5, bl - 0.3), "sliding", "balcony");
  }
  return {
    w,
    h,
    bd,
    rooms,
    balconies: outBalconies,
    doors,
    foyerId: foyer.id,
    foyerV: [vP0, vP0 + fLen],
    issues
  };
}
function buildLocalLayout(input, p) {
  const rules = input.rulesProfile;
  const plans = input.flats.map((f) => planUnitUV(f, p, rules));
  const issues = plans.flatMap((pl) => pl.issues);
  const leftIdx = plans.map((_, i) => i).filter((i) => i % 2 === 0);
  const rightIdx = plans.map((_, i) => i).filter((i) => i % 2 === 1);
  const foyerY = (pu) => pu.dir === "up" ? [pu.y0 + pu.plan.foyerV[0], pu.y0 + pu.plan.foyerV[1]] : [pu.y0 + pu.plan.h - pu.plan.foyerV[1], pu.y0 + pu.plan.h - pu.plan.foyerV[0]];
  const placeColumn = (idxs, side, clusterCentre) => {
    const k = idxs.length;
    let y = 0;
    const out = idxs.map((i, j) => {
      const plan = plans[i];
      const fc = (plan.foyerV[0] + plan.foyerV[1]) / 2;
      const foyerNearStart = fc <= plan.h - fc;
      let dir;
      if (k === 1) dir = p.opposedEntries && side === "right" ? "up" : "down";
      else if (j < (k - 1) / 2) dir = foyerNearStart ? "down" : "up";
      else if (j > (k - 1) / 2) dir = foyerNearStart ? "up" : "down";
      else dir = "down";
      const pu = { idx: i, side, dir, y0: y, plan };
      y += plan.h;
      return pu;
    });
    if (out.length === 0) return out;
    const fys2 = out.map(foyerY);
    const centre = (Math.min(...fys2.map((f) => f[0])) + Math.max(...fys2.map((f) => f[1]))) / 2;
    let cursorY = r3(out[0].y0 + clusterCentre - centre);
    for (const pu of out) {
      pu.y0 = cursorY;
      cursorY = r3(pu.y0 + pu.plan.h);
    }
    return out;
  };
  const left = placeColumn(leftIdx, "left", rightIdx.length > 0 ? p.stagger / 2 : 0);
  const right = placeColumn(rightIdx, "right", -p.stagger / 2);
  const placed = [...left, ...right];
  const fys = placed.map(foyerY);
  let ly0 = Math.min(...fys.map((f) => f[0])) - 0.3;
  let ly1 = Math.max(...fys.map((f) => f[1])) + 0.3;
  if (ly1 - ly0 < p.lobbyMinLength) {
    const extra = p.lobbyMinLength - (ly1 - ly0);
    const unitMin = Math.min(...placed.map((pu) => pu.y0));
    const unitMax = Math.max(...placed.map((pu) => pu.y0 + pu.plan.h));
    if (unitMax - ly1 >= ly0 - unitMin) ly1 += extra;
    else ly0 -= extra;
  }
  const stairW = Math.max(2.4, rules.stairRequirements.minWidthM * 2.2);
  const stairD = 3.6;
  const liftW = 2.1;
  const liftD = 2.1;
  const blocks = { bottom: [], top: [] };
  for (let i = 0; i < input.stairCount; i++) (i % 2 === 0 ? blocks.bottom : blocks.top).push({ kind: "stair", index: i });
  for (let i = 0; i < input.liftCount; i++) {
    (p.groupLifts || i % 2 === 0 ? blocks.bottom : blocks.top).push({ kind: "lift", index: i });
  }
  const itemW = (it) => it.kind === "stair" ? stairW : liftW;
  const blockW = (b) => sum(b.map(itemW));
  const Ws = r3(Math.max(p.lobbyWidth, blockW(blocks.bottom), blockW(blocks.top)));
  ly0 = r3(ly0);
  ly1 = r3(ly1);
  const stairs = new Array(input.stairCount);
  const lifts = new Array(input.liftCount);
  const shafts = [];
  const layBlock = (items, atBottom) => {
    if (items.length === 0) return;
    const depth = items.some((i) => i.kind === "stair") ? stairD : liftD;
    const bw = blockW(items);
    let x = (Ws - bw) / 2;
    const inner = atBottom ? ly0 : ly1;
    const outer = (d) => atBottom ? ly0 - d : ly1 + d;
    for (const it of items) {
      const wItem = itemW(it);
      const d = it.kind === "stair" ? stairD : liftD;
      const rect = rectFromEdges(x, inner, x + wItem, outer(d));
      if (it.kind === "stair") stairs[it.index] = rect;
      else {
        lifts[it.index] = rect;
        if (depth - liftD >= 1) shafts.push(rectFromEdges(x, outer(liftD), x + wItem, outer(depth)));
      }
      x += wItem;
    }
    const spare = (Ws - bw) / 2;
    if (spare >= 0.9 && shafts.length === 0) shafts.push(rectFromEdges(Ws - spare, inner, Ws, outer(depth)));
  };
  layBlock(blocks.bottom, true);
  layBlock(blocks.top, false);
  const lobby = rectFromEdges(0, ly0, Ws, ly1);
  const mapUV = (pu, u0, u1, v0, v1) => {
    const [xa, xb] = pu.side === "left" ? [-u1, -u0] : [Ws + u0, Ws + u1];
    const [ya, yb] = pu.dir === "up" ? [pu.y0 + v0, pu.y0 + v1] : [pu.y0 + pu.plan.h - v1, pu.y0 + pu.plan.h - v0];
    return rectFromEdges(xa, ya, xb, yb);
  };
  const units = [...placed].sort((a, b) => a.idx - b.idx).map((pu) => {
    const rooms = pu.plan.rooms.map((uv) => ({ uv, rect: mapUV(pu, uv.u0, uv.u1, uv.v0, uv.v1) }));
    const balconies = pu.plan.balconies.map((uv) => ({ uv, rect: mapUV(pu, uv.u0, uv.u1, uv.v0, uv.v1) }));
    const body = mapUV(pu, 0, pu.plan.w, 0, pu.plan.h);
    const bounds = unionRect([body, ...balconies.map((b) => b.rect)]);
    return { placed: pu, body, bounds, rooms, balconies };
  });
  const coreParts = [lobby, ...stairs.filter(Boolean), ...lifts.filter(Boolean), ...shafts];
  const coreBounds = unionRect(coreParts);
  const bbox = unionRect([coreBounds, ...units.map((u) => u.bounds)]);
  return { units, lobby, lifts, stairs, shafts, coreBounds, bbox, issues };
}
function compactionLadder(p) {
  const ladder = [{ params: p, note: null }];
  for (let s = r3(p.serviceBand + 0.3); s <= 3 + 1e-6; s = r3(s + 0.3)) {
    ladder.push({ params: { ...p, serviceBand: s }, note: `service band deepened to ${s} m to fit the envelope` });
  }
  const compact = { ...p, serviceBand: 3, passage: 1, lobbyMinLength: 2.4, balconyDepth: Math.min(p.balconyDepth, 1.5) };
  ladder.push({ params: compact, note: "compact variant (3.0 m service band, 1.0 m passage, 2.4 m lobby) to fit the envelope" });
  ladder.push({
    params: { ...compact, preSuite: "ensuite_or_plain", balconyDepth: 1.2 },
    note: "centred-entry compact variant (second bedroom off the living, 1.2 m balconies) to fit the envelope"
  });
  return ladder;
}
function planApartmentLayout(input) {
  const base = STRATEGY_PARAMS[input.strategy] ?? STRATEGY_PARAMS.balanced;
  const b = input.buildable;
  const orient = (l) => {
    const fitsAlongY = l.bbox.width <= b.width + 1e-6 && l.bbox.height <= b.height + 1e-6;
    const fitsAlongX = l.bbox.width <= b.height + 1e-6 && l.bbox.height <= b.width + 1e-6;
    const overflow = (w, h) => Math.max(l.bbox.width - w, 0) + Math.max(l.bbox.height - h, 0);
    const alongX = !fitsAlongY && (fitsAlongX || overflow(b.height, b.width) < overflow(b.width, b.height));
    return { spineAlongX: alongX, fits: alongX ? fitsAlongX : fitsAlongY };
  };
  const ladder = compactionLadder(base);
  let chosen = null;
  for (const step of ladder) {
    const l = buildLocalLayout(input, step.params);
    const o = orient(l);
    if (!chosen) chosen = { local: l, ...o, note: step.note };
    if (o.fits) {
      chosen = { local: l, ...o, note: step.note };
      break;
    }
  }
  const { local, spineAlongX, fits } = chosen;
  const adaptations = fits && chosen.note ? [chosen.note] : [];
  const localEnvelope = spineAlongX ? { x: b.y, y: b.x, width: b.height, height: b.width } : b;
  const dx = r3(localEnvelope.x + (localEnvelope.width - local.bbox.width) / 2 - local.bbox.x);
  const dy = r3(localEnvelope.y + (localEnvelope.height - local.bbox.height) / 2 - local.bbox.y);
  const toGlobal = (r) => {
    const t = rectFromEdges(r.x + dx, r.y + dy, r.x + r.width + dx, r.y + r.height + dy);
    return spineAlongX ? { x: t.y, y: t.x, width: t.height, height: t.width } : t;
  };
  const issues = [...local.issues];
  if (!fits) {
    issues.push(
      `Layout (${r3(local.bbox.width)} m \xD7 ${r3(local.bbox.height)} m) does not fit the buildable envelope (${r3(b.width)} m \xD7 ${r3(b.height)} m) for the ${input.strategy} strategy.`
    );
  }
  const lobby = { id: COMMON_LOBBY_ID, label: "COMMON LOBBY", bounds: toGlobal(local.lobby) };
  const lifts = local.lifts.map((r, i) => ({
    id: `lift_${i + 1}`,
    label: `LIFT ${String(i + 1).padStart(2, "0")}`,
    bounds: toGlobal(r)
  }));
  const stairs = local.stairs.map((r, i) => ({
    id: `stair_${i + 1}`,
    label: i === 0 ? "STAIR 01 (MAIN)" : `STAIR ${String(i + 1).padStart(2, "0")} (FIRE ESCAPE)`,
    bounds: toGlobal(r)
  }));
  const shafts = local.shafts.map((r, i) => ({
    id: `shaft_${i + 1}`,
    label: i === 0 ? "PLUMBING SHAFT" : "SERVICE SHAFT",
    bounds: toGlobal(r)
  }));
  const facadeCoord = (u) => u.placed.side === "left" ? u.body.x : u.body.x + u.body.width;
  const units = [];
  const unitDoorSpecs = [];
  local.units.forEach((lu) => {
    const flat = input.flats[lu.placed.idx];
    const facadeX = facadeCoord(lu);
    const toPlanned = (entry) => {
      const onFacade = entry.uv.band !== "projection" && (lu.placed.side === "left" ? Math.abs(entry.rect.x - facadeX) < 2e-3 : Math.abs(entry.rect.x + entry.rect.width - facadeX) < 2e-3);
      const bounds = toGlobal(entry.rect);
      return {
        id: entry.uv.id,
        name: entry.uv.name,
        type: entry.uv.type,
        zone: entry.uv.zone,
        band: entry.uv.band,
        bounds,
        targetAreaSqM: entry.uv.targetAreaSqM,
        areaSqM: Number(areaOf(bounds).toFixed(2)),
        ...entry.uv.isEnsuite !== void 0 ? { isEnsuite: entry.uv.isEnsuite } : {},
        ...entry.uv.hasBalcony !== void 0 ? { hasBalcony: entry.uv.hasBalcony } : {},
        ...entry.uv.ensuiteOf ? { ensuiteOf: entry.uv.ensuiteOf } : {},
        ...entry.uv.hostRoomId ? { hostRoomId: entry.uv.hostRoomId } : {},
        onFacade
      };
    };
    units.push({
      flatId: flat.flatId,
      flatLabel: flat.flatLabel,
      unitType: flat.unitType,
      allocation: flat.allocation,
      body: toGlobal(lu.body),
      bounds: toGlobal(lu.bounds),
      rooms: lu.rooms.map(toPlanned),
      balconies: lu.balconies.map(toPlanned),
      entranceDoorId: null,
      entrancePoint: { x: 0, y: 0 }
    });
    unitDoorSpecs.push({ flatId: flat.flatId, specs: lu.placed.plan.doors });
  });
  const rectById = /* @__PURE__ */ new Map();
  rectById.set(COMMON_LOBBY_ID, lobby.bounds);
  for (const el of [...lifts, ...stairs]) rectById.set(el.id, el.bounds);
  for (const u of units) for (const rm of [...u.rooms, ...u.balconies]) rectById.set(rm.id, rm.bounds);
  const doors = [];
  const makeDoor = (id, flatId, spec) => {
    const ra = rectById.get(spec.a);
    const rb = rectById.get(spec.b);
    if (!ra || !rb) {
      issues.push(`Door ${id}: unknown space (${!ra ? spec.a : spec.b}).`);
      return null;
    }
    const edge = sharedEdgeBetween(ra, rb);
    if (!edge) {
      issues.push(`Door ${id}: ${spec.a} and ${spec.b} do not share a wall.`);
      return null;
    }
    const overlap = edge.to - edge.from;
    const widthM = r3(Math.min(spec.widthM, overlap - 0.2));
    if (widthM < 0.6) {
      issues.push(`Door ${id}: shared wall between ${spec.a} and ${spec.b} is too short (${r3(overlap)} m).`);
      return null;
    }
    const c = (edge.from + edge.to) / 2;
    const t = 0.075;
    const bounds = edge.vertical ? rectFromEdges(edge.at - t, c - widthM / 2, edge.at + t, c + widthM / 2) : rectFromEdges(c - widthM / 2, edge.at - t, c + widthM / 2, edge.at + t);
    return {
      id,
      flatId,
      connects: [spec.a, spec.b],
      kind: spec.kind,
      doorType: spec.doorType,
      swing: "inward",
      widthM,
      center: edge.vertical ? { x: r3(edge.at), y: r3(c) } : { x: r3(c), y: r3(edge.at) },
      wallAxis: edge.vertical ? "y" : "x",
      bounds
    };
  };
  unitDoorSpecs.forEach(({ flatId, specs }, ui) => {
    specs.forEach((spec, di) => {
      const d = makeDoor(`${flatId}_door_${String(di + 1).padStart(2, "0")}`, flatId, spec);
      if (!d) return;
      doors.push(d);
      if (d.kind === "flat_entrance") {
        const u = units[ui];
        units[ui] = { ...u, entranceDoorId: d.id, entrancePoint: d.center };
      }
    });
  });
  [...stairs, ...lifts].forEach((el, i) => {
    const d = makeDoor(`core_door_${String(i + 1).padStart(2, "0")}`, null, {
      a: COMMON_LOBBY_ID,
      b: el.id,
      kind: "core",
      widthM: el.id.startsWith("lift") ? 1 : 1.2,
      doorType: "single"
    });
    if (d) doors.push(d);
  });
  const coreBounds = toGlobal(local.coreBounds);
  const footprint = toGlobal(local.bbox);
  const graph = buildSpatialGraph(units, lobby, lifts, stairs, shafts, doors);
  const checks = runSpatialChecks(units, lobby, lifts, stairs, shafts, doors);
  const areaReport = buildAreaReport(units, lobby, lifts, stairs, shafts, footprint, b, fits, input.strategy);
  return {
    strategy: input.strategy,
    spineAlongX,
    fits,
    issues,
    adaptations,
    footprint,
    core: { bounds: coreBounds, lobby, lifts, stairs, shafts },
    units,
    doors,
    graph,
    checks,
    areaReport,
    seed: input.seed ?? 42
  };
}
function roleOf(type) {
  switch (type) {
    case "living_dining":
      return "living_dining";
    case "master_bedroom":
    case "bedroom":
      return "bedroom";
    case "master_toilet":
    case "common_toilet":
    case "powder_room":
      return "bath";
    default:
      return type;
  }
}
function buildSpatialGraph(units, lobby, lifts, stairs, shafts, doors) {
  const nodes = [
    { id: lobby.id, flatId: null, role: "lobby", zone: "COMMON", name: lobby.label },
    ...lifts.map((l) => ({ id: l.id, flatId: null, role: "lift", zone: "COMMON", name: l.label })),
    ...stairs.map((s) => ({ id: s.id, flatId: null, role: "stair", zone: "COMMON", name: s.label })),
    ...shafts.map((s) => ({ id: s.id, flatId: null, role: "shaft", zone: "COMMON", name: s.label }))
  ];
  const edges = doors.map((d) => ({ a: d.connects[0], b: d.connects[1], relation: "door", doorId: d.id }));
  const doorPairs = new Set(doors.map((d) => [...d.connects].sort().join("|")));
  for (const u of units) {
    const spaces = [...u.rooms, ...u.balconies];
    for (const rm of spaces) nodes.push({ id: rm.id, flatId: u.flatId, role: roleOf(rm.type), zone: rm.zone, name: rm.name });
    const withLobby = [...spaces, { id: lobby.id, bounds: lobby.bounds }];
    for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < withLobby.length; j++) {
        const a = spaces[i];
        const b = withLobby[j];
        const e = sharedEdgeBetween(a.bounds, b.bounds);
        if (!e || e.to - e.from < 0.3) continue;
        if (doorPairs.has([a.id, b.id].sort().join("|"))) continue;
        edges.push({ a: a.id, b: b.id, relation: "adjacent" });
      }
    }
  }
  return { nodes, edges };
}
function runSpatialChecks(units, lobby, lifts, stairs, shafts, doors) {
  const checks = [];
  const check = (code, flatId, ok, pass, fail) => checks.push({ code, flatId, status: ok ? "PASS" : "FAIL", message: ok ? pass : fail });
  for (const u of units) {
    const spaces = [...u.rooms, ...u.balconies];
    const byId = new Map(spaces.map((r) => [r.id, r]));
    const role = (id) => id === lobby.id ? "lobby" : roleOf(byId.get(id)?.type ?? "other");
    const flatDoors = doors.filter((d) => d.flatId === u.flatId);
    const adj = /* @__PURE__ */ new Map();
    for (const d of flatDoors) {
      const [a, b] = d.connects;
      adj.set(a, [...adj.get(a) ?? [], b]);
      adj.set(b, [...adj.get(b) ?? [], a]);
    }
    const hasDoor = (a, b) => flatDoors.some((d) => d.connects[0] === a && d.connects[1] === b || d.connects[0] === b && d.connects[1] === a);
    const L = u.flatLabel;
    const entrances = flatDoors.filter((d) => d.kind === "flat_entrance");
    check(
      "FLAT_ENTRANCE_SINGLE",
      u.flatId,
      entrances.length === 1,
      `${L}: one entrance door from the common lobby.`,
      `${L}: ${entrances.length} entrance doors (exactly 1 required).`
    );
    const entrance = entrances[0];
    const entryRoom = entrance ? entrance.connects[0] === lobby.id ? entrance.connects[1] : entrance.connects[0] : null;
    check(
      "ENTRANCE_TO_FOYER",
      u.flatId,
      entryRoom !== null && role(entryRoom) === "foyer",
      `${L}: the entrance opens into the foyer.`,
      `${L}: the entrance does not open into a foyer (${entryRoom ? byId.get(entryRoom)?.name : "none"}).`
    );
    const lobbyPrivate = flatDoors.filter((d) => d.connects.includes(lobby.id)).map((d) => d.connects[0] === lobby.id ? d.connects[1] : d.connects[0]).filter((id) => ["bedroom", "bath", "kitchen", "utility"].includes(role(id)));
    check(
      "LOBBY_NOT_INTO_PRIVATE",
      u.flatId,
      lobbyPrivate.length === 0,
      `${L}: the lobby never opens into a bedroom, bath or service room.`,
      `${L}: the lobby opens directly into ${lobbyPrivate.map((id) => byId.get(id)?.name).join(", ")}.`
    );
    const ld = spaces.find((r) => r.type === "living_dining");
    const foyer = spaces.find((r) => r.type === "foyer");
    const kitchen = spaces.find((r) => r.type === "kitchen");
    const utility = spaces.find((r) => r.type === "utility");
    check(
      "FOYER_TO_LIVING",
      u.flatId,
      Boolean(foyer && ld && hasDoor(foyer.id, ld.id)),
      `${L}: foyer opens into living/dining.`,
      `${L}: no opening between foyer and living/dining.`
    );
    check(
      "LIVING_DINING",
      u.flatId,
      Boolean(ld),
      `${L}: living and dining are one combined public room.`,
      `${L}: no living/dining room.`
    );
    check(
      "DINING_KITCHEN",
      u.flatId,
      Boolean(ld && kitchen && hasDoor(ld.id, kitchen.id)),
      `${L}: kitchen opens off the dining.`,
      `${L}: kitchen is not connected to the dining.`
    );
    if (utility) {
      check(
        "KITCHEN_UTILITY",
        u.flatId,
        Boolean(kitchen && hasDoor(kitchen.id, utility.id)),
        `${L}: utility is reached through the kitchen.`,
        `${L}: utility is not connected to the kitchen.`
      );
    }
    for (const bath of spaces.filter((r) => r.ensuiteOf)) {
      const bed = byId.get(bath.ensuiteOf);
      const isMaster = bed?.type === "master_bedroom";
      check(
        isMaster ? "MASTER_ENSUITE" : "BEDROOM_ENSUITE",
        u.flatId,
        Boolean(bed && hasDoor(bed.id, bath.id)),
        `${L}: ${bath.name} opens from ${bed?.name}.`,
        `${L}: ${bath.name} is not attached to ${bed?.name ?? "its bedroom"}.`
      );
    }
    const reach = (throughBedrooms) => {
      const seen = /* @__PURE__ */ new Set();
      if (!entryRoom) return seen;
      const queue = [entryRoom];
      seen.add(entryRoom);
      while (queue.length > 0) {
        const cur = queue.shift();
        if (!throughBedrooms && cur !== entryRoom && role(cur) === "bedroom") continue;
        for (const nxt of adj.get(cur) ?? []) {
          if (nxt === lobby.id || seen.has(nxt)) continue;
          seen.add(nxt);
          queue.push(nxt);
        }
      }
      return seen;
    };
    const noBedTransit = reach(false);
    const everything = reach(true);
    const beds = spaces.filter((r) => roleOf(r.type) === "bedroom");
    const blockedBeds = beds.filter((bd) => !noBedTransit.has(bd.id));
    check(
      "BEDROOM_ACCESS",
      u.flatId,
      blockedBeds.length === 0,
      `${L}: every bedroom is reached without passing through another bedroom.`,
      `${L}: ${blockedBeds.map((bd) => bd.name).join(", ")} only reachable through another bedroom.`
    );
    const commonBaths = spaces.filter((r) => roleOf(r.type) === "bath" && !r.ensuiteOf);
    const blockedBaths = commonBaths.filter((bt) => !noBedTransit.has(bt.id));
    check(
      "COMMON_BATH_ACCESS",
      u.flatId,
      blockedBaths.length === 0,
      `${L}: common bath(s) reached without passing through a bedroom.`,
      `${L}: ${blockedBaths.map((bt) => bt.name).join(", ")} only reachable through a bedroom.`
    );
    const unreachable = spaces.filter((r) => !everything.has(r.id));
    check(
      "ALL_ROOMS_REACHABLE",
      u.flatId,
      unreachable.length === 0,
      `${L}: every room is reachable from the entrance.`,
      `${L}: unreachable: ${unreachable.map((r) => r.name).join(", ")}.`
    );
    const inward = spaces.filter((r) => (r.type === "living_dining" || roleOf(r.type) === "bedroom") && !r.onFacade);
    check(
      "HABITABLE_ON_EXTERNAL_EDGE",
      u.flatId,
      inward.length === 0,
      `${L}: living/dining and every bedroom have an external wall.`,
      `${L}: no external wall for ${inward.map((r) => r.name).join(", ")}.`
    );
    const wet = spaces.filter((r) => ["kitchen", "utility", "bath"].includes(roleOf(r.type)));
    const wetOutsideStack = wet.filter((r) => r.band !== "service" && !r.ensuiteOf);
    check(
      "WET_SERVICE_STACK",
      u.flatId,
      wetOutsideStack.length === 0,
      `${L}: kitchen, utility and common baths are grouped in the service band.`,
      `${L}: wet rooms outside the service stack: ${wetOutsideStack.map((r) => r.name).join(", ")}.`
    );
    const outside = spaces.filter((r) => overlapArea2(r.bounds, u.bounds) < areaOf(r.bounds) - 1e-3);
    check(
      "ROOMS_INSIDE_FLAT",
      u.flatId,
      outside.length === 0,
      `${L}: all rooms lie inside the flat boundary.`,
      `${L}: rooms outside the flat: ${outside.map((r) => r.name).join(", ")}.`
    );
  }
  const served = units.filter((u) => doors.some((d) => d.flatId === u.flatId && d.kind === "flat_entrance" && d.connects.includes(lobby.id)));
  check(
    "LOBBY_SERVES_ALL_FLATS",
    null,
    served.length === units.length,
    `Common lobby gives direct access to all ${units.length} flat entrances.`,
    `Only ${served.length} of ${units.length} flats open onto the common lobby.`
  );
  const coreEls = [...lifts, ...stairs];
  const unlinked = coreEls.filter((el) => !doors.some((d) => d.kind === "core" && d.connects.includes(el.id)));
  check(
    "CORE_OPENS_TO_LOBBY",
    null,
    unlinked.length === 0,
    "Every lift and stair opens onto the common lobby.",
    `Not connected to the lobby: ${unlinked.map((e) => e.label).join(", ")}.`
  );
  const allRects = [
    { id: lobby.id, label: lobby.label, bounds: lobby.bounds },
    ...coreEls.map((e) => ({ id: e.id, label: e.label, bounds: e.bounds })),
    ...shafts.map((e) => ({ id: e.id, label: e.label, bounds: e.bounds })),
    ...units.flatMap((u) => [...u.rooms, ...u.balconies].map((r) => ({ id: r.id, label: `${u.flatLabel} ${r.name}`, bounds: r.bounds })))
  ];
  const overlaps = [];
  for (let i = 0; i < allRects.length; i++) {
    for (let j = i + 1; j < allRects.length; j++) {
      if (overlapArea2(allRects[i].bounds, allRects[j].bounds) > 1e-3) overlaps.push(`${allRects[i].label} \u2194 ${allRects[j].label}`);
    }
  }
  check(
    "NO_OVERLAPS",
    null,
    overlaps.length === 0,
    "No room, flat or core element overlaps another.",
    `Overlaps: ${overlaps.slice(0, 4).join("; ")}.`
  );
  const flatOverlaps = [];
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      if (overlapArea2(units[i].bounds, units[j].bounds) > 1e-3) flatOverlaps.push(`${units[i].flatLabel} \u2194 ${units[j].flatLabel}`);
    }
    for (const el of [lobby, ...coreEls]) {
      if (overlapArea2(units[i].bounds, el.bounds) > 1e-3) flatOverlaps.push(`${units[i].flatLabel} \u2194 ${el.label}`);
    }
  }
  check(
    "FLATS_SEPARATED",
    null,
    flatOverlaps.length === 0,
    "Flats are separate units clear of the common core.",
    `Flat boundaries overlap: ${flatOverlaps.join("; ")}.`
  );
  return checks;
}
function buildAreaReport(units, lobby, lifts, stairs, shafts, footprint, buildable, fits, strategy) {
  const round2 = (v) => Number(v.toFixed(2));
  const dev = (actual, target) => target > 0 ? round2((actual - target) / target * 100) : null;
  const reports = units.map((u) => {
    const spaces = [...u.rooms, ...u.balconies];
    const cat = (pred) => {
      const sel = spaces.filter(pred);
      return { target: sum(sel.map((r) => r.targetAreaSqM)), actual: sum(sel.map((r) => r.areaSqM)) };
    };
    const rows = [
      ["bedrooms", cat((r) => roleOf(r.type) === "bedroom")],
      ["living_dining", cat((r) => r.type === "living_dining")],
      ["kitchen", cat((r) => r.type === "kitchen")],
      ["baths", cat((r) => roleOf(r.type) === "bath")],
      ["utility", cat((r) => r.type === "utility")],
      ["circulation", (() => {
        const cc = cat((r) => r.type === "foyer" || r.type === "passage");
        return { target: cc.target + u.allocation.internalCirculationSqM, actual: cc.actual };
      })()],
      ["balconies", cat((r) => r.type === "balcony")],
      ["storage_dressing_study", cat((r) => r.type === "store" || r.type === "dress" || r.type === "study")]
    ];
    const lines = rows.map(([category, v]) => {
      const d2 = dev(v.actual, v.target);
      const warn = d2 !== null && Math.abs(d2) > 25 && Math.abs(v.actual - v.target) > 1;
      return { category, targetSqM: round2(v.target), actualSqM: round2(v.actual), deviationPct: d2, status: warn ? "WARN" : "OK" };
    });
    const target = u.allocation.targetCarpetAreaSqM;
    const actual = round2(sum(spaces.map((r) => r.areaSqM)));
    const d = dev(actual, target) ?? 0;
    const status = Math.abs(d) > 15 ? "FAIL" : Math.abs(d) > 8 ? "WARN" : "OK";
    return {
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      unitType: u.unitType,
      targetCarpetSqM: target,
      actualCarpetSqM: actual,
      deviationPct: d,
      status,
      lines
    };
  });
  const unitsSqM = round2(sum(units.map((u) => sum([...u.rooms, ...u.balconies].map((r) => r.areaSqM)))));
  const coreSqM = round2(sum([...lifts, ...stairs, ...shafts].map((e) => areaOf(e.bounds))));
  const lobbySqM = round2(areaOf(lobby.bounds));
  const footprintSqM = round2(areaOf(footprint));
  const buildableSqM = round2(areaOf(buildable));
  return {
    units: reports,
    floor: {
      buildableSqM,
      footprintSqM,
      unitsSqM,
      coreSqM,
      lobbySqM,
      openSqM: round2(Math.max(0, footprintSqM - unitsSqM - coreSqM - lobbySqM)),
      fits,
      message: fits ? `${strategy}: ${units.length} flats (${unitsSqM} m\xB2) + core ${coreSqM} m\xB2 + lobby ${lobbySqM} m\xB2 fit the ${buildableSqM} m\xB2 buildable envelope.` : `FEASIBILITY FAIL (${strategy}): flats ${unitsSqM} m\xB2 + core ${coreSqM} m\xB2 + lobby ${lobbySqM} m\xB2 need a ${footprintSqM} m\xB2 footprint that does not fit the ${buildableSqM} m\xB2 buildable envelope.`
    }
  };
}

// packages/ai-orchestration/src/apartment/schematic.ts
function generateDeterministicApartmentSchematic(options) {
  const {
    siteWidthM,
    siteDepthM,
    flatsPerFloor,
    unitMix,
    commonCoreConfig = {},
    floorType = "typical",
    rulesProfile,
    strategy = "balanced"
  } = options;
  const setbacks = options.setbacksM ?? DEFAULT_APARTMENT_SETBACKS_M;
  const buildableWidthM = Math.max(10, siteWidthM - setbacks.left - setbacks.right);
  const buildableDepthM = Math.max(10, siteDepthM - setbacks.front - setbacks.rear);
  const buildable = { x: setbacks.left, y: setbacks.rear, width: buildableWidthM, height: buildableDepthM };
  const flattenedFlats = [];
  let flatIndex = 1;
  for (const mixItem of unitMix) {
    const count = mixItem.count || 1;
    for (let c = 0; c < count; c++) {
      if (flattenedFlats.length < flatsPerFloor) {
        flattenedFlats.push({
          flatLabel: `Flat ${String(flatIndex).padStart(2, "0")}`,
          unitType: mixItem.unitType || "2BHK",
          targetCarpetAreaSqM: mixItem.carpetAreaSqM,
          targetCarpetAreaSqFt: mixItem.carpetAreaSqFt
        });
        flatIndex++;
      }
    }
  }
  while (flattenedFlats.length < flatsPerFloor) {
    flattenedFlats.push({ flatLabel: `Flat ${String(flatIndex).padStart(2, "0")}`, unitType: "2BHK" });
    flatIndex++;
  }
  const finalFlats = flattenedFlats.slice(0, flatsPerFloor);
  const passengerLifts = commonCoreConfig.passengerLifts ?? rulesProfile.liftRequirements.minPassengerLifts;
  const liftCount = Math.max(1, passengerLifts + (commonCoreConfig.serviceLifts ?? 0));
  const stairCount = Math.max(1, commonCoreConfig.staircaseCount ?? (rulesProfile.stairRequirements.secondStaircaseRequired ? 2 : 1));
  const plan = planApartmentLayout({
    buildable,
    flats: finalFlats.map((flat) => ({
      flatId: flat.flatLabel.toLowerCase().replace(/\s+/g, "_"),
      flatLabel: flat.flatLabel,
      unitType: flat.unitType,
      allocation: allocateApartmentUnitSpaces({
        unitType: flat.unitType,
        flatLabel: flat.flatLabel,
        targetCarpetAreaSqM: flat.targetCarpetAreaSqM,
        targetCarpetAreaSqFt: flat.targetCarpetAreaSqFt,
        rulesProfile
      })
    })),
    liftCount,
    stairCount,
    strategy,
    rulesProfile,
    seed: options.seed
  });
  const toRoomItem = (room) => ({
    id: room.id,
    name: room.name,
    type: room.type,
    bounds: room.bounds,
    areaSqM: room.areaSqM,
    targetAreaSqM: room.targetAreaSqM,
    ...room.isEnsuite !== void 0 ? { isEnsuite: room.isEnsuite } : {},
    ...room.hasBalcony !== void 0 ? { hasBalcony: room.hasBalcony } : {},
    zone: room.zone,
    band: room.band,
    onFacade: room.onFacade,
    ...room.ensuiteOf ? { ensuiteOf: room.ensuiteOf } : {},
    ...room.hostRoomId ? { hostRoomId: room.hostRoomId } : {}
  });
  const units = plan.units.map((u) => {
    const report = plan.areaReport.units.find((r) => r.flatId === u.flatId);
    return {
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      unitType: u.unitType,
      carpetAreaSqM: u.allocation.targetCarpetAreaSqM,
      actualCarpetAreaSqM: report?.actualCarpetSqM ?? 0,
      builtUpAreaSqM: u.allocation.targetBuiltUpAreaSqM,
      bounds: u.bounds,
      bodyBounds: u.body,
      entrancePoint: u.entrancePoint,
      entranceDoorId: u.entranceDoorId,
      rooms: u.rooms.map(toRoomItem),
      balconies: u.balconies.map(toRoomItem),
      allocationDetails: u.allocation
    };
  });
  const lifts = plan.core.lifts.map((l, i) => ({
    id: l.id,
    label: l.label,
    type: i < passengerLifts ? "passenger" : "service",
    capacityPersons: 10,
    bounds: l.bounds
  }));
  const stairs = plan.core.stairs.map((s, i) => ({
    id: s.id,
    label: s.label,
    widthM: rulesProfile.stairRequirements.minWidthM,
    type: i === 0 ? "main" : "fire_escape",
    bounds: s.bounds
  }));
  const serviceShafts = plan.core.shafts.map((s) => ({ label: s.label, bounds: s.bounds }));
  const corridors = [];
  const lobbyBounds = plan.core.lobby.bounds;
  const floor = plan.areaReport.floor;
  const totalCoreAreaSqM = Number((floor.coreSqM + floor.lobbySqM).toFixed(2));
  const totalNetResidentialSqM = Number(units.reduce((sum2, u) => sum2 + u.carpetAreaSqM, 0).toFixed(2));
  const unitMixSummary = finalFlats.map((f) => `${f.flatLabel} (${f.unitType})`).join(", ");
  const svgScaffold = generateSchematicSvg({
    siteWidthM,
    siteDepthM,
    buildingFootprint: plan.footprint,
    lifts,
    stairs,
    lobbyBounds,
    serviceShafts,
    units,
    doors: plan.doors,
    flatsPerFloor: finalFlats.length,
    unitMixSummary,
    strategy
  });
  return {
    siteFootprint: { x: 0, y: 0, width: siteWidthM, height: siteDepthM },
    buildingFootprint: plan.footprint,
    setbacks,
    floorType,
    flatCount: finalFlats.length,
    unitMixSummary,
    core: {
      bounds: plan.core.bounds,
      lobby: { bounds: lobbyBounds, label: "COMMON LOBBY" },
      corridors,
      lifts,
      stairs,
      serviceShafts,
      totalCoreAreaSqM
    },
    units,
    totalFloorPlateSqM: Number((floor.unitsSqM + floor.coreSqM + floor.lobbySqM).toFixed(2)),
    totalNetResidentialSqM,
    svgScaffold,
    strategy,
    doors: plan.doors,
    spatialGraph: plan.graph,
    spatialChecks: plan.checks,
    areaReport: plan.areaReport,
    layoutFits: plan.fits,
    layoutIssues: plan.issues,
    layoutAdaptations: plan.adaptations,
    seed: plan.seed
  };
}
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function generateSchematicSvg(data) {
  const scale = 22;
  const svgWidth = Math.ceil(data.siteWidthM * scale);
  const svgHeight = Math.ceil(data.siteDepthM * scale);
  const flatColors = ["#EBF5FB", "#FEF9E7", "#EAFAF1", "#F4ECF7", "#FDEBD0"];
  const R3 = (r) => `x="${(r.x * scale).toFixed(1)}" y="${(r.y * scale).toFixed(1)}" width="${(r.width * scale).toFixed(1)}" height="${(r.height * scale).toFixed(1)}"`;
  const centre = (r) => ({ x: (r.x + r.width / 2) * scale, y: (r.y + r.height / 2) * scale });
  const unitsSvg = data.units.map((unit, idx) => {
    const color = flatColors[idx % flatColors.length];
    const b = unit.bodyBounds;
    const rooms = [...unit.rooms, ...unit.balconies].map((room) => {
      const c = centre(room.bounds);
      const dashed = room.type === "balcony" ? ' stroke-dasharray="3,2"' : "";
      return `
        <rect ${R3(room.bounds)} fill="none" stroke="#64748B" stroke-width="0.9"${dashed}/>
        <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#334155">${esc(room.name)}</text>`;
    }).join("");
    return `
    <g id="${unit.flatId}">
      <rect ${R3(b)} fill="${color}" stroke="#0F172A" stroke-width="2.2" />
      ${rooms}
      <text x="${(b.x * scale + 6).toFixed(1)}" y="${(b.y * scale + 14).toFixed(1)}" font-size="11" font-weight="700" fill="#1E293B">${esc(unit.flatLabel)} \xB7 ${unit.unitType}</text>
      <text x="${(b.x * scale + 6).toFixed(1)}" y="${(b.y * scale + 26).toFixed(1)}" font-size="9" fill="#64748B">Carpet: ${unit.actualCarpetAreaSqM} m\xB2 (target ${unit.carpetAreaSqM} m\xB2)</text>
    </g>`;
  }).join("");
  const doorsSvg = data.doors.map((d) => `<rect ${R3(d.bounds)} fill="#FFFFFF" stroke="${d.kind === "flat_entrance" ? "#DC2626" : "#0EA5E9"}" stroke-width="1"/>`).join("");
  const coreSvg = `
  <rect ${R3(data.lobbyBounds)} fill="#F8FAFC" stroke="#334155" stroke-width="1.5" />
  <text x="${centre(data.lobbyBounds).x.toFixed(1)}" y="${(centre(data.lobbyBounds).y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">COMMON LOBBY</text>
  ${data.lifts.map((lift) => {
    const b = lift.bounds;
    const x0 = b.x * scale;
    const y0 = b.y * scale;
    const x1 = (b.x + b.width) * scale;
    const y1 = (b.y + b.height) * scale;
    const c = centre(b);
    return `
    <rect ${R3(b)} fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#0284C7" stroke-width="0.8" />
    <line x1="${x1}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#0284C7" stroke-width="0.8" />
    <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#0369A1">${lift.label}</text>`;
  }).join("")}
  ${data.stairs.map((stair) => {
    const c = centre(stair.bounds);
    return `
    <rect ${R3(stair.bounds)} fill="url(#stairLines)" stroke="#D97706" stroke-width="1.5" />
    <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#92400E">${stair.label}</text>`;
  }).join("")}
  ${data.serviceShafts.map((s) => `<rect ${R3(s.bounds)} fill="#F1F5F9" stroke="#475569" stroke-width="1" />`).join("")}`;
  const fp = data.buildingFootprint;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="background:#F8F9FA; font-family: Inter, Roboto, sans-serif;">
  <defs>
    <pattern id="grid" width="${scale}" height="${scale}" patternUnits="userSpaceOnUse">
      <path d="M ${scale} 0 L 0 0 0 ${scale}" fill="none" stroke="#E2E8F0" stroke-width="0.5"/>
    </pattern>
    <pattern id="stairLines" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" stroke-width="1.5" />
    </pattern>
  </defs>
  <rect width="${svgWidth}" height="${svgHeight}" fill="url(#grid)" />
  <rect x="2" y="2" width="${svgWidth - 4}" height="${svgHeight - 4}" fill="none" stroke="#64748B" stroke-width="2" stroke-dasharray="4,4" />
  <text x="10" y="20" font-size="11" font-weight="600" fill="#475569">SITE BOUNDARY (${data.siteWidthM}m \xD7 ${data.siteDepthM}m)</text>
  <rect ${R3(fp)} fill="none" stroke="#94A3B8" stroke-width="1" stroke-dasharray="6,3" />
  ${unitsSvg}
  ${coreSvg}
  ${doorsSvg}
  <rect x="10" y="${svgHeight - 34}" width="${svgWidth - 20}" height="24" fill="#0F172A" rx="4" />
  <text x="20" y="${svgHeight - 18}" font-size="10" font-weight="600" fill="#F8FAFC">SCHEMATIC APARTMENT PLAN \xB7 ${data.strategy.toUpperCase()} \xB7 ${data.flatsPerFloor} FLATS/FLOOR \xB7 ${esc(data.unitMixSummary)}</text>
</svg>
`.trim();
}

// packages/ai-orchestration/src/orchestration/vision-interpretation.ts
var roomProps = {
  id: { type: "string" },
  name: { type: "string" },
  type: { type: "string" },
  x: { type: "number" },
  y: { type: "number" },
  width: { type: "number", exclusiveMinimum: 0 },
  height: { type: "number", exclusiveMinimum: 0 }
};
var roomRequired = ["id", "name", "type", "x", "y", "width", "height"];
var doorProps = {
  id: { type: "string" },
  x: { type: "number" },
  y: { type: "number" },
  width: { type: "number" },
  height: { type: "number" },
  type: { type: "string", enum: ["single", "double", "sliding", "open_passage", "unknown"] },
  swingDirection: { type: "string", enum: ["inward", "outward", "left", "right", "unknown"] },
  adjacentRoomId: { type: "string" }
};
var windowProps = {
  id: { type: "string" },
  x: { type: "number" },
  y: { type: "number" },
  width: { type: "number" },
  height: { type: "number" },
  adjacentRoomId: { type: "string" }
};
var IMAGE_INTERPRETATION_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["boundary", "rooms", "doors", "windows", "stairs", "parking"],
  properties: {
    boundary: {
      type: "object",
      additionalProperties: false,
      required: ["points"],
      properties: {
        points: {
          type: "array",
          items: { type: "object", additionalProperties: false, required: ["x", "y"], properties: { x: { type: "number", minimum: 0 }, y: { type: "number", minimum: 0 } } },
          minItems: 3
        }
      }
    },
    rooms: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: roomRequired, properties: roomProps }
    },
    doors: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "x", "y", "width", "height", "type", "adjacentRoomId"], properties: doorProps }
    },
    windows: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "x", "y", "width", "height", "adjacentRoomId"], properties: windowProps }
    },
    stairs: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "name", "x", "y", "width", "height"], properties: roomProps }
    },
    parking: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "name", "x", "y", "width", "height"], properties: roomProps }
    }
  }
};
var COMMON_AREA_FLAT_ID = "COMMON";
var APARTMENT_INTERPRETATION_FRAME = { width: 1e3, height: 1e3 };
var flatIdProp = {
  type: "string",
  description: `Id of the flat (flats[].id) this space belongs to, or "${COMMON_AREA_FLAT_ID}" for shared common space.`
};
var groupedRoomItem = {
  type: "object",
  additionalProperties: false,
  required: [...roomRequired, "flatId"],
  properties: { ...roomProps, flatId: flatIdProp }
};
var coreElementItem = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "x", "y", "width", "height", "flatId"],
  properties: { ...roomProps, flatId: flatIdProp }
};
var commonElementItem = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "x", "y", "width", "height"],
  properties: roomProps
};
var APARTMENT_IMAGE_INTERPRETATION_SCHEMA = {
  ...IMAGE_INTERPRETATION_SCHEMA,
  required: [...IMAGE_INTERPRETATION_SCHEMA.required, "flats", "lifts", "lobbies", "corridors", "shafts"],
  properties: {
    ...IMAGE_INTERPRETATION_SCHEMA.properties,
    rooms: { type: "array", items: groupedRoomItem },
    stairs: { type: "array", items: coreElementItem },
    flats: {
      type: "array",
      description: "Each distinct self-contained apartment unit with its outer boundary box.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "unitType", "x", "y", "width", "height"],
        properties: {
          id: { type: "string" },
          label: { type: "string", description: "Visible flat label, e.g. FLAT 01." },
          unitType: { type: "string", description: "Typology from the bedrooms actually drawn, e.g. 2BHK or 3BHK." },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number", exclusiveMinimum: 0 },
          height: { type: "number", exclusiveMinimum: 0 }
        }
      }
    },
    lifts: { type: "array", items: coreElementItem },
    lobbies: { type: "array", items: commonElementItem },
    corridors: { type: "array", items: commonElementItem },
    shafts: { type: "array", items: commonElementItem }
  }
};
async function interpretPlanImageWithGemini(provider, options) {
  const apartment = options.apartmentContext;
  const frame = APARTMENT_INTERPRETATION_FRAME;
  const systemPrompt = [
    "You are an architectural vision interpreter for a residential floor-planning tool.",
    "Read the supplied floor-plan image and return ONLY the JSON interpretation defined by the schema.",
    "Never invent rooms, walls, doors, windows, stairs, lifts, flats or parking that are not visible.",
    apartment ? `Use normalized coordinates: x and width in 0-${frame.width} across the image width, y and height in 0-${frame.height} down the image height.` : "Use image pixel coordinates.",
    "Return the building boundary as the outermost wall polygon.",
    "Every room must have a stable id, a visible name/label, a canonical type, and a bounding box.",
    ...apartment ? [
      'This is a multi-unit apartment floor plate. List every self-contained flat in "flats" with its outer boundary box and unit type derived from the bedrooms actually drawn.',
      `Assign every room to its flat via flatId. Lifts, staircases, the common lobby, corridors and service shafts are COMMON space (flatId "${COMMON_AREA_FLAT_ID}") and must never be assigned to a flat.`,
      'Put lifts in "lifts", staircases in "stairs", the shared lobby in "lobbies", common passages in "corridors", ducts/OTS/shafts in "shafts".',
      "Boxes must be tight to the drawn walls and distinct spaces must not overlap: the lobby/corridor box covers only open circulation and excludes lifts, stairs and shafts; every room box lies inside its own flat box; flat boxes do not overlap each other or the core.",
      "The brief below is context only: report what the image shows even when it differs from the brief. Do not copy the brief counts."
    ] : [],
    "Do not claim code compliance, structural safety or professional approval."
  ].join(" ");
  const userPrompt = [
    "Interpret the attached floor-plan image into the structured schema.",
    `Plot dimensions: ${options.plotWidthMm} mm x ${options.plotDepthMm} mm.`,
    `Orientation: ${options.orientationDegrees} degrees; road facing ${options.roadFacing}.`,
    options.userPrompt ? `Additional requirements: ${options.userPrompt}` : "",
    apartment ? `Apartment brief (context only): ${JSON.stringify(apartment)}` : "",
    options.requirements ? `Structured requirements (context only): ${JSON.stringify(options.requirements)}` : ""
  ].filter(Boolean).join("\n");
  const apiResponse = await provider.complete({
    taskType: "image_interpretation",
    systemPrompt,
    userPrompt,
    // Explicit typed image part (recovery Phase 4, P8) — never embedded in prompt text.
    images: [{ mimeType: options.imageMimeType, data: options.imageBase64 }],
    responseFormat: "json",
    responseSchema: apartment ? APARTMENT_IMAGE_INTERPRETATION_SCHEMA : IMAGE_INTERPRETATION_SCHEMA,
    maxTokens: apartment ? 16384 : 8192,
    temperature: 0
  });
  const parsed = apiResponse.parsed;
  if (parsed === void 0) {
    throw new AISafetyError("Gemini vision returned no parsed interpretation.");
  }
  return {
    parsed,
    model: apiResponse.model,
    latencyMs: apiResponse.latencyMs,
    usage: apiResponse.usage,
    coordinateFrame: apartment ? { kind: "normalized", width: frame.width, height: frame.height } : { kind: "image_pixels" }
  };
}

// packages/ai-orchestration/src/orchestration/apartment-preflight.ts
var APARTMENT_PREFLIGHT_PROMPT = `
You are an expert architectural plan reviewer evaluating an AI-generated 2D floor-plan image.
Your role is to strictly verify whether the image represents an orthographic multi-unit Indian apartment floor plan conforming to the requested design brief.

INSPECT THE IMAGE CAREFULLY FOR:
1. FLAT COUNT: Count the distinct individual apartment units sharing the floor plate.
2. UNIT MIX: Check the bedrooms in each separate flat:
   - 2BHK: Flat with Living room + 2 Bedrooms + Kitchen.
   - 3BHK: Flat with Living room + 3 Bedrooms + Kitchen.
   Report the detected array in unitMix (e.g. ["2BHK", "3BHK"]).
3. CENTRAL CORE:
   - LIFTS: Look for elevator shafts in the central core/lobby (square or rectangular compartments with diagonal 'X' crosses, elevator doors, or lift symbols). In apartment floor plans, two elevators are frequently shown as a paired dual-elevator bank or two side-by-side lift shafts [X][X]. If a paired dual-elevator bank or two elevator compartments are present in the core, count as 2 lifts.
   - STAIRCASES: Look for stairwells with tread lines and center railings (both main internal stairs and secondary/fire stairs). Count how many distinct staircases exist.
   - COMMON LOBBY: Verify a shared corridor/lobby providing separate entries to all flats.
4. TEXT / LABELS: Verify script. Only classify as Cyrillic/Russian if actual Cyrillic alphabet words appear. If labels are English or stylized Latin letters, report "English".
5. APARTMENT vs VILLA: Confirm that this is a multi-unit apartment building floor plan, NOT a standalone single-family villa or house.
6. TECHNICAL QUALITY: Confirm orthographic top-down 2D view with clear wall thickness, doors, and windows.

Return your exact structured findings following the JSON schema.
`.trim();

// packages/ai-orchestration/src/apartment/schematic-renderer.ts
var table = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
  }
  table[i] = c;
}

// packages/ai-orchestration/src/apartment/adapter.ts
function apartmentExpectationFromManifest(manifest) {
  return {
    flats: manifest.units.exactCount,
    units: manifest.units.units.map((u) => ({
      label: u.label,
      unitType: u.type,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      livingRooms: u.livingRooms,
      diningRooms: u.diningRooms,
      kitchens: u.kitchens,
      utilities: u.utilities,
      balconies: u.balconies
    })),
    lifts: manifest.commonCore.lifts,
    stairs: manifest.commonCore.stairs,
    commonLobby: manifest.commonCore.commonLobby
  };
}
var mm = (r) => ({
  x: Math.round(r.x * 1e3),
  y: Math.round(r.y * 1e3),
  width: Math.round((r.x + r.width) * 1e3) - Math.round(r.x * 1e3),
  height: Math.round((r.y + r.height) * 1e3) - Math.round(r.y * 1e3)
});
var common = (id, name, bounds) => ({
  id,
  name,
  rect: mm(bounds),
  assignedFlatId: null
});
function schematicToApartmentStructure(schematic) {
  const fp = mm(schematic.buildingFootprint);
  const structureId = /* @__PURE__ */ new Map();
  for (const unit of schematic.units) {
    for (const room of [...unit.rooms, ...unit.balconies]) {
      structureId.set(room.id, `${unit.flatId}__${room.id}`);
    }
  }
  const sid = (id) => structureId.get(id) ?? id;
  const openings = (schematic.doors ?? []).map((door) => {
    const a = sid(door.connects[0]);
    const b = sid(door.connects[1]);
    const lobbyId = schematic.core.lobby ? "core_lobby" : null;
    return {
      id: door.id,
      kind: "door",
      rect: mm(door.bounds),
      adjacentRoomId: door.kind === "flat_entrance" && a === lobbyId ? b : a,
      doorType: door.doorType,
      swingDirection: door.swing,
      connects: [a, b],
      isFlatEntrance: door.kind === "flat_entrance"
    };
  });
  return {
    source: "DETERMINISTIC_SCHEMATIC",
    boundary: [
      { x: fp.x, y: fp.y },
      { x: fp.x + fp.width, y: fp.y },
      { x: fp.x + fp.width, y: fp.y + fp.height },
      { x: fp.x, y: fp.y + fp.height }
    ],
    flats: schematic.units.map((unit) => ({
      id: unit.flatId,
      label: unit.flatLabel,
      unitType: unit.unitType,
      rect: mm(unit.bounds),
      rooms: [...unit.rooms, ...unit.balconies].map((room) => ({
        id: `${unit.flatId}__${room.id}`,
        name: room.name,
        type: room.type,
        rect: mm(room.bounds)
      }))
    })),
    commonRooms: [],
    ungroupedRooms: [],
    lifts: schematic.core.lifts.map((l) => common(l.id, l.label, l.bounds)),
    stairs: schematic.core.stairs.map((s) => common(s.id, s.label, s.bounds)),
    lobbies: schematic.core.lobby ? [common("core_lobby", schematic.core.lobby.label, schematic.core.lobby.bounds)] : [],
    corridors: schematic.core.corridors.map((c, i) => common(`corridor_${i + 1}`, c.label, c.bounds)),
    shafts: schematic.core.serviceShafts.map((s, i) => common(`shaft_${i + 1}`, s.label, s.bounds)),
    openings
  };
}
function buildExtractionSite(input) {
  const front = input.setbacksMm?.front ?? 3e3;
  const rear = input.setbacksMm?.rear ?? 2e3;
  const left = input.setbacksMm?.left ?? 2e3;
  const right = input.setbacksMm?.right ?? 2e3;
  return {
    plotWidth: input.plotWidthMm,
    plotDepth: input.plotDepthMm,
    frontSetback: front,
    rearSetback: rear,
    leftSetback: left,
    rightSetback: right,
    roadFacing: (input.roadFacing ?? "north").toString().toLowerCase(),
    orientation: input.orientationDegrees ?? 0
  };
}

// packages/ai-orchestration/src/apartment/structural-representation.ts
function rectToPolygon2(r) {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.width, y: r.y },
    { x: r.x + r.width, y: r.y + r.height },
    { x: r.x, y: r.y + r.height }
  ];
}
function rectToSegments(r, idPrefix, classification, thicknessM, associatedEntityId) {
  const p0 = { x: r.x, y: r.y };
  const p1 = { x: r.x + r.width, y: r.y };
  const p2 = { x: r.x + r.width, y: r.y + r.height };
  const p3 = { x: r.x, y: r.y + r.height };
  return [
    { id: `${idPrefix}_top`, start: p0, end: p1, classification, thicknessM, associatedEntityId },
    { id: `${idPrefix}_right`, start: p1, end: p2, classification, thicknessM, associatedEntityId },
    { id: `${idPrefix}_bottom`, start: p2, end: p3, classification, thicknessM, associatedEntityId },
    { id: `${idPrefix}_left`, start: p3, end: p0, classification, thicknessM, associatedEntityId }
  ];
}
function createStructuralPlanRepresentation(schematic) {
  const fp = schematic.buildingFootprint;
  const site = schematic.siteFootprint;
  const outerBuildingWalls = rectToSegments(fp, "outer_wall", "outer_wall", 0.23);
  const flatBoundaries = schematic.units.map((u) => ({
    id: u.flatId,
    label: u.flatLabel,
    category: "flat",
    flatId: u.flatId,
    bounds: u.bounds,
    polygon: rectToPolygon2(u.bounds),
    isEnclosed: true
  }));
  const lobbyBoundary = {
    id: "core_lobby",
    label: schematic.core.lobby.label,
    category: "lobby",
    flatId: null,
    bounds: schematic.core.lobby.bounds,
    polygon: rectToPolygon2(schematic.core.lobby.bounds),
    isEnclosed: true
  };
  const liftBoundaries = schematic.core.lifts.map((l) => ({
    id: l.id,
    label: l.label,
    category: "lift",
    flatId: null,
    bounds: l.bounds,
    polygon: rectToPolygon2(l.bounds),
    isEnclosed: true
  }));
  const stairBoundaries = schematic.core.stairs.map((s) => ({
    id: s.id,
    label: s.label,
    category: "stair",
    flatId: null,
    bounds: s.bounds,
    polygon: rectToPolygon2(s.bounds),
    isEnclosed: true
  }));
  const ductBoundaries = schematic.core.serviceShafts.map((s, i) => ({
    id: `shaft_${i + 1}`,
    label: s.label,
    category: "shaft",
    flatId: null,
    bounds: s.bounds,
    polygon: rectToPolygon2(s.bounds),
    isEnclosed: true
  }));
  const corridorBoundaries = schematic.core.corridors.map((c, i) => ({
    id: `corridor_${i + 1}`,
    label: c.label,
    category: "passage",
    flatId: null,
    bounds: c.bounds,
    polygon: rectToPolygon2(c.bounds),
    isEnclosed: true
  }));
  const roomBoundaries = [];
  const balconies = [];
  const partitions = [];
  partitions.push(...rectToSegments(schematic.core.lobby.bounds, "core_lobby", "core_wall", 0.2, "core_lobby"));
  for (const l of schematic.core.lifts) {
    partitions.push(...rectToSegments(l.bounds, `core_${l.id}`, "core_wall", 0.2, l.id));
  }
  for (const s of schematic.core.stairs) {
    partitions.push(...rectToSegments(s.bounds, `core_${s.id}`, "core_wall", 0.2, s.id));
  }
  for (const unit of schematic.units) {
    partitions.push(...rectToSegments(unit.bodyBounds, `party_${unit.flatId}`, "party_wall", 0.2, unit.flatId));
    for (const room of unit.rooms) {
      roomBoundaries.push({
        id: `${unit.flatId}__${room.id}`,
        label: room.name,
        category: room.type === "passage" ? "passage" : "room",
        flatId: unit.flatId,
        bounds: room.bounds,
        polygon: rectToPolygon2(room.bounds),
        isEnclosed: true
      });
      partitions.push(
        ...rectToSegments(
          room.bounds,
          `room_${unit.flatId}_${room.id}`,
          "interior_partition",
          0.115,
          `${unit.flatId}__${room.id}`
        )
      );
    }
    for (const bal of unit.balconies) {
      const balBoundary = {
        id: `${unit.flatId}__${bal.id}`,
        label: bal.name,
        category: "balcony",
        flatId: unit.flatId,
        bounds: bal.bounds,
        polygon: rectToPolygon2(bal.bounds),
        isEnclosed: false
      };
      balconies.push(balBoundary);
      partitions.push(
        ...rectToSegments(
          bal.bounds,
          `balcony_${unit.flatId}_${bal.id}`,
          "balcony_railing",
          0.1,
          `${unit.flatId}__${bal.id}`
        )
      );
    }
  }
  const doors = (schematic.doors ?? []).map((d) => ({
    id: d.id,
    kind: d.kind,
    doorType: d.doorType,
    center: d.center,
    widthM: d.widthM,
    wallAxis: d.wallAxis,
    bounds: d.bounds,
    connects: d.connects,
    swing: d.swing
  }));
  const aspect = site.width / Math.max(1, site.height);
  const targetResolutionPx = 2048;
  const minResolutionPx = 1536;
  let widthPx = targetResolutionPx;
  let heightPx = Math.round(targetResolutionPx / aspect);
  if (aspect < 1) {
    heightPx = targetResolutionPx;
    widthPx = Math.round(targetResolutionPx * aspect);
  }
  widthPx = Math.max(minResolutionPx, Math.round(widthPx / 16) * 16);
  heightPx = Math.max(minResolutionPx, Math.round(heightPx / 16) * 16);
  return {
    version: 1,
    unitsOfMeasure: "metres",
    siteBounds: site,
    buildableBounds: {
      x: schematic.setbacks.left,
      y: schematic.setbacks.rear,
      width: Math.max(0, site.width - schematic.setbacks.left - schematic.setbacks.right),
      height: Math.max(0, site.height - schematic.setbacks.front - schematic.setbacks.rear)
    },
    buildingFootprint: fp,
    outerBuildingWalls,
    flatBoundaries,
    commonCore: {
      bounds: schematic.core.bounds,
      lobby: lobbyBoundary,
      circulationBoundaries: corridorBoundaries,
      lifts: liftBoundaries,
      stairs: stairBoundaries,
      ducts: ductBoundaries
    },
    majorPartitions: partitions,
    roomBoundaries,
    doors,
    balconies,
    recommendedRenderResolutions: {
      minResolutionPx,
      targetResolutionPx,
      aspectRatio: Number(aspect.toFixed(3)),
      widthPx,
      heightPx
    }
  };
}

// packages/ai-orchestration/src/apartment/deterministic-planner.ts
function formatPlannerDiagnostics(diagnostics) {
  const lines = [
    "================ DETERMINISTIC ARCHITECTURAL PLANNER DIAGNOSTICS ================",
    `STATUS: ${diagnostics.status} | STRATEGY: ${diagnostics.strategy.toUpperCase()} | SEED: ${diagnostics.seed}`,
    `ENVELOPE: ${diagnostics.buildingEnvelope.widthM}m x ${diagnostics.buildingEnvelope.heightM}m (${diagnostics.buildingEnvelope.areaSqM} m\xB2)`,
    `FLATS: Requested ${diagnostics.flatCount.requested}, Planned ${diagnostics.flatCount.planned} (${diagnostics.unitMix.matches ? "MATCH" : "MISMATCH"})`,
    `CORE: Lifts ${diagnostics.coreCount.liftsPlanned}/${diagnostics.coreCount.liftsRequested}, Stairs ${diagnostics.coreCount.stairsPlanned}/${diagnostics.coreCount.stairsRequested}, Common Lobby: ${diagnostics.coreCount.lobbyPlanned ? "YES" : "NO"}`,
    "",
    "UNIT BREAKDOWN:"
  ];
  for (const u of diagnostics.roomCountsPerFlat) {
    const area2 = diagnostics.areaPerFlat.find((a) => a.flatId === u.flatId);
    lines.push(
      `  - ${u.flatLabel} (${u.unitType}): ${u.bedrooms} Bed, ${u.bathrooms} Bath, ${u.livingDining} Living/Dining, ${u.kitchens} Kitchen, ${u.utilities} Utility, ${u.balconies} Balcony | Area: ${area2?.actualCarpetSqM ?? 0}m\xB2 (Target: ${area2?.targetCarpetSqM ?? 0}m\xB2, Dev: ${area2?.deviationPct ?? 0}%, Status: ${area2?.status ?? "UNKNOWN"})`
    );
  }
  const v = diagnostics.violations;
  const totalViolations = v.adjacencyViolations.length + v.containmentViolations.length + v.overlapViolations.length + v.entryCirculationViolations.length;
  lines.push("", `VIOLATIONS (Total: ${totalViolations}):`);
  if (v.entryCirculationViolations.length > 0) {
    lines.push(`  * Entry/Circulation (${v.entryCirculationViolations.length}):`);
    v.entryCirculationViolations.forEach((m) => lines.push(`      - ${m}`));
  }
  if (v.adjacencyViolations.length > 0) {
    lines.push(`  * Adjacency (${v.adjacencyViolations.length}):`);
    v.adjacencyViolations.forEach((m) => lines.push(`      - ${m}`));
  }
  if (v.containmentViolations.length > 0) {
    lines.push(`  * Containment (${v.containmentViolations.length}):`);
    v.containmentViolations.forEach((m) => lines.push(`      - ${m}`));
  }
  if (v.overlapViolations.length > 0) {
    lines.push(`  * Overlap (${v.overlapViolations.length}):`);
    v.overlapViolations.forEach((m) => lines.push(`      - ${m}`));
  }
  if (diagnostics.reasonCodes.length > 0) {
    lines.push("", `REASON CODES: ${diagnostics.reasonCodes.join(", ")}`);
  }
  lines.push("================================================================================");
  return lines.join("\n");
}
function planDeterministicApartment(input) {
  const seed3 = input.seed ?? 42;
  const strategy = input.strategy ?? "balanced";
  const projectId = input.projectId ?? "proj_apt";
  const projectName = input.projectName ?? "Architectural Apartment Project";
  const floorType = input.floorType ?? "typical";
  const floorCount = input.floorCount ?? 4;
  const setbacks = input.site.setbacksMm ?? DEFAULT_APARTMENT_SETBACKS_MM;
  const siteWidthM = Number((input.site.plotWidthMm / 1e3).toFixed(3));
  const siteDepthM = Number((input.site.plotDepthMm / 1e3).toFixed(3));
  const setbacksM = {
    front: Number((setbacks.front / 1e3).toFixed(3)),
    rear: Number((setbacks.rear / 1e3).toFixed(3)),
    left: Number((setbacks.left / 1e3).toFixed(3)),
    right: Number((setbacks.right / 1e3).toFixed(3))
  };
  const jurisdictionName = input.jurisdiction ?? input.designSpec?.siteContext?.jurisdiction ?? "pune_pmc";
  const rulesProfile = input.rulesProfile ?? getApartmentRulesProfile(jurisdictionName, {
    floorCount,
    buildingHeightM: floorCount * 3.1,
    tenementsPerFloor: input.flatsPerFloor
  });
  const manifest = buildApartmentGenerationManifest({
    site: {
      plotWidthMm: input.site.plotWidthMm,
      plotDepthMm: input.site.plotDepthMm,
      setbacksMm: setbacks,
      roadFacing: input.site.roadFacing ? String(input.site.roadFacing).toLowerCase() : "north",
      orientationDegrees: input.site.orientationDegrees ?? 0
    },
    apartmentConfig: {
      projectType: "apartment",
      jurisdiction: jurisdictionName,
      floorCount,
      flatsPerFloor: input.flatsPerFloor,
      unitMix: input.unitMix.map((u) => ({
        unitType: u.unitType,
        count: u.count,
        carpetAreaSqFt: u.carpetAreaSqFt,
        carpetAreaSqM: u.carpetAreaSqM
      })),
      commonCore: {
        passengerLifts: input.commonCore?.passengerLifts ?? rulesProfile.liftRequirements.minPassengerLifts,
        serviceLifts: input.commonCore?.serviceLifts ?? 0,
        staircaseCount: input.commonCore?.staircaseCount ?? (rulesProfile.stairRequirements.secondStaircaseRequired ? 2 : 1),
        fireStaircaseRequired: rulesProfile.stairRequirements.secondStaircaseRequired,
        commonLobby: input.commonCore?.commonLobby ?? true
      },
      parking: {
        residentParkingCount: input.flatsPerFloor,
        visitorParkingCount: 1
      },
      amenities: { groundSiteAmenities: [], buildingAmenities: [] },
      floorStrategy: floorType
    },
    rulesProfile
  });
  const schematic = generateDeterministicApartmentSchematic({
    siteWidthM,
    siteDepthM,
    setbacksM,
    flatsPerFloor: input.flatsPerFloor,
    unitMix: input.unitMix,
    commonCoreConfig: {
      passengerLifts: manifest.commonCore.lifts,
      staircaseCount: manifest.commonCore.stairs,
      commonLobby: manifest.commonCore.commonLobby
    },
    floorType,
    rulesProfile,
    strategy,
    seed: seed3
  });
  const manifestMatch = validateSchematicMatchesManifest(schematic, manifest);
  const isFeasibilityFail = !schematic.layoutFits || manifestMatch.feasibilityFail;
  let validationResult;
  if (isFeasibilityFail) {
    validationResult = {
      status: "REJECTED",
      source: "DETERMINISTIC_SCHEMATIC",
      building: null,
      stages: {
        completeness: "FAIL",
        manifestMatch: "FAIL",
        structural: "SKIPPED",
        canonicalGeometry: "SKIPPED",
        geometryValidation: "SKIPPED"
      },
      counts: {
        flats: schematic.flatCount,
        unitTypes: schematic.units.map((u) => u.unitType),
        lifts: schematic.core.lifts.length,
        stairs: schematic.core.stairs.length,
        lobbies: schematic.core.lobby ? 1 : 0,
        bedroomsByFlat: {}
      },
      validation: {
        isValid: false,
        recommendedForEditing: false,
        geometryHealthy: false,
        overallScore: 0,
        verificationIssues: [
          ...schematic.layoutIssues.map((msg) => ({
            code: "SITE_INSUFFICIENT_FOR_PROGRAM",
            message: msg,
            severity: "error"
          })),
          ...manifestMatch.discrepancies.map((msg) => ({
            code: "MANIFEST_DISCREPANCY",
            message: msg,
            severity: "error"
          }))
        ]
      },
      diagnostics: [
        ...schematic.layoutIssues.map((msg) => ({
          code: "SITE_INSUFFICIENT_FOR_PROGRAM",
          message: msg,
          severity: "error"
        })),
        ...manifestMatch.discrepancies.map((msg) => ({
          code: "MANIFEST_DISCREPANCY",
          message: msg,
          severity: "error"
        }))
      ]
    };
  } else {
    const structure = schematicToApartmentStructure(schematic);
    const expectation = apartmentExpectationFromManifest(manifest);
    const extractionSite = buildExtractionSite({
      plotWidthMm: input.site.plotWidthMm,
      plotDepthMm: input.site.plotDepthMm,
      setbacksMm: setbacks,
      roadFacing: input.site.roadFacing,
      orientationDegrees: input.site.orientationDegrees
    });
    validationResult = runApartmentPlanValidation({
      structure,
      expectation,
      site: extractionSite,
      projectId,
      projectName
    });
  }
  const structuralRepresentation = createStructuralPlanRepresentation(schematic);
  const adjacencyViolations = [];
  const containmentViolations = [];
  const overlapViolations = [];
  const entryCirculationViolations = [];
  const reasonCodes = /* @__PURE__ */ new Set();
  for (const check of schematic.spatialChecks) {
    if (check.status === "FAIL") {
      reasonCodes.add(check.code);
      if (["FLAT_ENTRANCE_SINGLE", "ENTRANCE_TO_FOYER", "LOBBY_NOT_INTO_PRIVATE", "LOBBY_SERVES_ALL_FLATS", "BEDROOM_ACCESS", "ALL_ROOMS_REACHABLE"].includes(check.code)) {
        entryCirculationViolations.push(check.message);
      } else if (["FOYER_TO_LIVING", "DINING_KITCHEN", "KITCHEN_UTILITY", "MASTER_ENSUITE", "BEDROOM_ENSUITE"].includes(check.code)) {
        adjacencyViolations.push(check.message);
      } else if (["ROOMS_INSIDE_FLAT"].includes(check.code)) {
        containmentViolations.push(check.message);
      } else if (["NO_OVERLAPS", "FLATS_SEPARATED"].includes(check.code)) {
        overlapViolations.push(check.message);
      }
    }
  }
  if (manifestMatch.discrepancies.length > 0) {
    reasonCodes.add("MANIFEST_DISCREPANCY");
  }
  for (const diag of validationResult.diagnostics) {
    if (diag.severity === "error") {
      reasonCodes.add(diag.code);
      if (diag.code.includes("CONTAINMENT") || diag.code.includes("OUT_OF_BOUNDS") || diag.code.includes("OUTSIDE")) {
        containmentViolations.push(diag.message);
      } else if (diag.code.includes("COLLISION") || diag.code.includes("OVERLAP") || diag.code.includes("SEPARATED")) {
        overlapViolations.push(diag.message);
      } else if (diag.code.includes("LOBBY") || diag.code.includes("ENTRANCE") || diag.code.includes("CIRCULATION")) {
        entryCirculationViolations.push(diag.message);
      }
    }
  }
  const allIssues = [
    ...schematic.layoutIssues,
    ...manifestMatch.discrepancies,
    ...validationResult.diagnostics.filter((d) => d.severity === "error").map((d) => d.message)
  ];
  let status = "SUCCESS";
  if (!schematic.layoutFits || manifestMatch.feasibilityFail) {
    status = "FEASIBILITY_FAIL";
    reasonCodes.add("PLANNER_FEASIBILITY_FAIL");
  } else if (!manifestMatch.matches || validationResult.status === "REJECTED" || reasonCodes.size > 0) {
    status = "VALIDATION_FAIL";
    reasonCodes.add("PLANNER_VALIDATION_FAIL");
  }
  const roomCountsPerFlat = schematic.units.map((u) => {
    const spaces = [...u.rooms, ...u.balconies];
    return {
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      unitType: u.unitType,
      bedrooms: spaces.filter((r) => r.type === "bedroom" || r.type === "master_bedroom").length,
      bathrooms: spaces.filter((r) => r.type === "master_toilet" || r.type === "common_toilet" || r.type === "powder_room").length,
      livingDining: spaces.filter((r) => r.type === "living_dining" || r.type === "living").length,
      kitchens: spaces.filter((r) => r.type === "kitchen").length,
      utilities: spaces.filter((r) => r.type === "utility").length,
      balconies: spaces.filter((r) => r.type === "balcony").length
    };
  });
  const areaPerFlat = schematic.areaReport.units.map((r) => ({
    flatId: r.flatId,
    flatLabel: r.flatLabel,
    targetCarpetSqM: r.targetCarpetSqM,
    actualCarpetSqM: r.actualCarpetSqM,
    deviationPct: r.deviationPct,
    status: r.status
  }));
  const requestedUnitTypes = manifest.units.units.map((u) => u.type.toUpperCase());
  const plannedUnitTypes = schematic.units.map((u) => u.unitType.toUpperCase());
  const unitMixMatches = requestedUnitTypes.length === plannedUnitTypes.length && requestedUnitTypes.every((t, i) => t === plannedUnitTypes[i]);
  const diagnostics = {
    status,
    strategy,
    seed: seed3,
    buildingEnvelope: {
      widthM: schematic.buildingFootprint.width,
      heightM: schematic.buildingFootprint.height,
      areaSqM: Number((schematic.buildingFootprint.width * schematic.buildingFootprint.height).toFixed(2))
    },
    flatCount: {
      requested: manifest.units.exactCount,
      planned: schematic.flatCount
    },
    unitMix: {
      requested: requestedUnitTypes,
      planned: plannedUnitTypes,
      matches: unitMixMatches
    },
    coreCount: {
      liftsRequested: manifest.commonCore.lifts,
      liftsPlanned: schematic.core.lifts.length,
      stairsRequested: manifest.commonCore.stairs,
      stairsPlanned: schematic.core.stairs.length,
      lobbyPlanned: schematic.core.lobby !== void 0
    },
    roomCountsPerFlat,
    areaPerFlat,
    violations: {
      adjacencyViolations,
      containmentViolations,
      overlapViolations,
      entryCirculationViolations
    },
    issues: allIssues,
    reasonCodes: [...reasonCodes],
    summaryText: ""
  };
  const fullDiagnostics = {
    ...diagnostics,
    summaryText: formatPlannerDiagnostics(diagnostics)
  };
  return {
    success: status === "SUCCESS",
    status,
    strategy,
    seed: seed3,
    schematic,
    manifest,
    canonicalBuilding: validationResult.building,
    validationResult,
    structuralRepresentation,
    diagnostics: fullDiagnostics,
    reasonCodes: [...reasonCodes]
  };
}

// packages/ai-orchestration/dist/requirements/schema.js
var REQUIREMENT_RESPONSE_SCHEMA2 = {
  type: "object",
  additionalProperties: false,
  properties: {
    schemaVersion: { type: "integer", enum: [1] },
    projectName: { type: "string" },
    plotShape: { type: "string", enum: Object.values(PlotShape) },
    orientationDegrees: { type: "number", minimum: 0, maximum: 359 },
    hard: {
      type: "object",
      additionalProperties: false,
      properties: {
        plotWidthMm: { type: "number", minimum: 3e3, maximum: 2e5 },
        plotDepthMm: { type: "number", minimum: 3e3, maximum: 2e5 },
        roadFacing: { type: "string", enum: Object.values(Direction) },
        floorsCount: {
          type: "integer",
          minimum: BUILDING_CAPABILITIES.minimumFloorCount,
          maximum: BUILDING_CAPABILITIES.maximumFloorCount
        },
        bedroomCount: { type: "integer", minimum: 1, maximum: 20 },
        bathroomCount: { type: "integer", minimum: 1, maximum: 20 },
        kitchenRequired: { type: "boolean" },
        livingRoomRequired: { type: "boolean" },
        diningRoomRequired: { type: "boolean" },
        staircaseRequired: { type: "boolean" },
        parkingRequired: { type: "boolean" },
        parkingSpacesCount: { type: "integer", minimum: 0, maximum: 20 },
        liftRequired: { type: "boolean" },
        customRooms: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              type: { type: "string", enum: Object.values(RoomType) },
              count: { type: "integer", minimum: 1, maximum: 20 },
              name: { type: "string" }
            },
            required: ["type", "count", "name"]
          }
        }
      },
      required: [
        "plotWidthMm",
        "plotDepthMm",
        "roadFacing",
        "floorsCount",
        "bedroomCount",
        "bathroomCount",
        "kitchenRequired",
        "livingRoomRequired",
        "diningRoomRequired",
        "staircaseRequired",
        "parkingRequired",
        "parkingSpacesCount",
        "liftRequired",
        "customRooms"
      ]
    },
    soft: {
      type: "object",
      additionalProperties: false,
      properties: {
        vastuCompliance: { type: "boolean" },
        naturalLightPreference: { type: "string", enum: Object.values(PreferenceLevel) },
        privacyPreference: { type: "string", enum: Object.values(PreferenceLevel) },
        circulationEfficiency: { type: "string", enum: Object.values(PreferenceLevel) },
        gardenPreference: { type: "boolean" },
        servantQuarter: { type: "boolean" },
        poojaRoom: { type: "boolean" },
        studyRoom: { type: "boolean" },
        balconyPreferred: { type: "boolean" },
        openKitchen: { type: "boolean" },
        attachedBathroomsCount: { type: "integer", minimum: 0, maximum: 20 }
      },
      required: [
        "vastuCompliance",
        "naturalLightPreference",
        "privacyPreference",
        "circulationEfficiency",
        "gardenPreference",
        "servantQuarter",
        "poojaRoom",
        "studyRoom",
        "balconyPreferred",
        "openKitchen",
        "attachedBathroomsCount"
      ]
    }
  },
  required: ["schemaVersion", "projectName", "plotShape", "orientationDegrees", "hard", "soft"]
};

// packages/ai-orchestration/dist/editing/target-resolver.js
var TYPE_ALIASES2 = [
  [RoomType.ServantQuarter, ["servant quarter", "maid room"]],
  [RoomType.FamilyLiving, ["family living", "family lounge"]],
  [RoomType.Living, ["living room", "living"]],
  [RoomType.Bedroom, ["master bedroom", "guest bedroom", "bedroom", "bed room"]],
  [RoomType.Bathroom, ["bathroom", "bath room", "toilet"]],
  [RoomType.Kitchen, ["kitchen"]],
  [RoomType.Dining, ["dining room", "dining"]],
  [RoomType.Study, ["study room", "study", "office"]],
  [RoomType.Pooja, ["pooja room", "puja room", "prayer room", "pooja"]],
  [RoomType.Utility, ["utility room", "utility"]],
  [RoomType.Storage, ["storage room", "store room", "storage"]],
  [RoomType.Balcony, ["balcony"]],
  [RoomType.Parking, ["parking", "garage"]],
  [RoomType.Corridor, ["corridor", "passage"]],
  [RoomType.Foyer, ["foyer", "entry"]]
];

// packages/ai-orchestration/dist/apartment/site-defaults.js
var DEFAULT_APARTMENT_SETBACKS_MM2 = {
  front: 3e3,
  rear: 2e3,
  left: 2e3,
  right: 2e3
};
var DEFAULT_APARTMENT_SETBACKS_M2 = {
  front: DEFAULT_APARTMENT_SETBACKS_MM2.front / 1e3,
  rear: DEFAULT_APARTMENT_SETBACKS_MM2.rear / 1e3,
  left: DEFAULT_APARTMENT_SETBACKS_MM2.left / 1e3,
  right: DEFAULT_APARTMENT_SETBACKS_MM2.right / 1e3
};

// packages/ai-orchestration/dist/orchestration/aspect-ratio.js
var TARGET_PIXEL_BUDGET2 = 1024 * 1024;

// packages/ai-orchestration/dist/apartment/structural-renderer.js
var CRC_TABLE2 = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
  }
  CRC_TABLE2[i] = c;
}

// packages/ai-orchestration/dist/orchestration/vision-interpretation.js
var roomProps2 = {
  id: { type: "string" },
  name: { type: "string" },
  type: { type: "string" },
  x: { type: "number" },
  y: { type: "number" },
  width: { type: "number", exclusiveMinimum: 0 },
  height: { type: "number", exclusiveMinimum: 0 }
};
var roomRequired2 = ["id", "name", "type", "x", "y", "width", "height"];
var doorProps2 = {
  id: { type: "string" },
  x: { type: "number" },
  y: { type: "number" },
  width: { type: "number" },
  height: { type: "number" },
  type: { type: "string", enum: ["single", "double", "sliding", "open_passage", "unknown"] },
  swingDirection: { type: "string", enum: ["inward", "outward", "left", "right", "unknown"] },
  adjacentRoomId: { type: "string" }
};
var windowProps2 = {
  id: { type: "string" },
  x: { type: "number" },
  y: { type: "number" },
  width: { type: "number" },
  height: { type: "number" },
  adjacentRoomId: { type: "string" }
};
var IMAGE_INTERPRETATION_SCHEMA2 = {
  type: "object",
  additionalProperties: false,
  required: ["boundary", "rooms", "doors", "windows", "stairs", "parking"],
  properties: {
    boundary: {
      type: "object",
      additionalProperties: false,
      required: ["points"],
      properties: {
        points: {
          type: "array",
          items: { type: "object", additionalProperties: false, required: ["x", "y"], properties: { x: { type: "number", minimum: 0 }, y: { type: "number", minimum: 0 } } },
          minItems: 3
        }
      }
    },
    rooms: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: roomRequired2, properties: roomProps2 }
    },
    doors: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "x", "y", "width", "height", "type", "adjacentRoomId"], properties: doorProps2 }
    },
    windows: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "x", "y", "width", "height", "adjacentRoomId"], properties: windowProps2 }
    },
    stairs: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "name", "x", "y", "width", "height"], properties: roomProps2 }
    },
    parking: {
      type: "array",
      items: { type: "object", additionalProperties: false, required: ["id", "name", "x", "y", "width", "height"], properties: roomProps2 }
    }
  }
};
var COMMON_AREA_FLAT_ID2 = "COMMON";
var flatIdProp2 = {
  type: "string",
  description: `Id of the flat (flats[].id) this space belongs to, or "${COMMON_AREA_FLAT_ID2}" for shared common space.`
};
var groupedRoomItem2 = {
  type: "object",
  additionalProperties: false,
  required: [...roomRequired2, "flatId"],
  properties: { ...roomProps2, flatId: flatIdProp2 }
};
var coreElementItem2 = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "x", "y", "width", "height", "flatId"],
  properties: { ...roomProps2, flatId: flatIdProp2 }
};
var commonElementItem2 = {
  type: "object",
  additionalProperties: false,
  required: ["id", "name", "x", "y", "width", "height"],
  properties: roomProps2
};
var APARTMENT_IMAGE_INTERPRETATION_SCHEMA2 = {
  ...IMAGE_INTERPRETATION_SCHEMA2,
  required: [...IMAGE_INTERPRETATION_SCHEMA2.required, "flats", "lifts", "lobbies", "corridors", "shafts"],
  properties: {
    ...IMAGE_INTERPRETATION_SCHEMA2.properties,
    rooms: { type: "array", items: groupedRoomItem2 },
    stairs: { type: "array", items: coreElementItem2 },
    flats: {
      type: "array",
      description: "Each distinct self-contained apartment unit with its outer boundary box.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "label", "unitType", "x", "y", "width", "height"],
        properties: {
          id: { type: "string" },
          label: { type: "string", description: "Visible flat label, e.g. FLAT 01." },
          unitType: { type: "string", description: "Typology from the bedrooms actually drawn, e.g. 2BHK or 3BHK." },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number", exclusiveMinimum: 0 },
          height: { type: "number", exclusiveMinimum: 0 }
        }
      }
    },
    lifts: { type: "array", items: coreElementItem2 },
    lobbies: { type: "array", items: commonElementItem2 },
    corridors: { type: "array", items: commonElementItem2 },
    shafts: { type: "array", items: commonElementItem2 }
  }
};

// packages/ai-orchestration/dist/orchestration/apartment-preflight.js
var APARTMENT_PREFLIGHT_PROMPT2 = `
You are an expert architectural plan reviewer evaluating an AI-generated 2D floor-plan image.
Your role is to strictly verify whether the image represents an orthographic multi-unit Indian apartment floor plan conforming to the requested design brief.

INSPECT THE IMAGE CAREFULLY FOR:
1. FLAT COUNT: Count the distinct individual apartment units sharing the floor plate.
2. UNIT MIX: Check the bedrooms in each separate flat:
   - 2BHK: Flat with Living room + 2 Bedrooms + Kitchen.
   - 3BHK: Flat with Living room + 3 Bedrooms + Kitchen.
   Report the detected array in unitMix (e.g. ["2BHK", "3BHK"]).
3. CENTRAL CORE:
   - LIFTS: Look for elevator shafts in the central core/lobby (square or rectangular compartments with diagonal 'X' crosses, elevator doors, or lift symbols). In apartment floor plans, two elevators are frequently shown as a paired dual-elevator bank or two side-by-side lift shafts [X][X]. If a paired dual-elevator bank or two elevator compartments are present in the core, count as 2 lifts.
   - STAIRCASES: Look for stairwells with tread lines and center railings (both main internal stairs and secondary/fire stairs). Count how many distinct staircases exist.
   - COMMON LOBBY: Verify a shared corridor/lobby providing separate entries to all flats.
4. TEXT / LABELS: Verify script. Only classify as Cyrillic/Russian if actual Cyrillic alphabet words appear. If labels are English or stylized Latin letters, report "English".
5. APARTMENT vs VILLA: Confirm that this is a multi-unit apartment building floor plan, NOT a standalone single-family villa or house.
6. TECHNICAL QUALITY: Confirm orthographic top-down 2D view with clear wall thickness, doors, and windows.

Return your exact structured findings following the JSON schema.
`.trim();

// packages/ai-orchestration/dist/apartment/schematic-renderer.js
var table2 = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
  }
  table2[i] = c;
}

// packages/ai-orchestration/dist/apartment/adapter.js
function apartmentExpectationFromManifest2(manifest) {
  return {
    flats: manifest.units.exactCount,
    units: manifest.units.units.map((u) => ({
      label: u.label,
      unitType: u.type,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      livingRooms: u.livingRooms,
      diningRooms: u.diningRooms,
      kitchens: u.kitchens,
      utilities: u.utilities,
      balconies: u.balconies
    })),
    lifts: manifest.commonCore.lifts,
    stairs: manifest.commonCore.stairs,
    commonLobby: manifest.commonCore.commonLobby
  };
}
function apartmentInterpretationContextFromManifest2(manifest) {
  const mix = /* @__PURE__ */ new Map();
  for (const u of manifest.units.units)
    mix.set(u.type, (mix.get(u.type) ?? 0) + 1);
  return {
    flatsPerFloor: manifest.units.exactCount,
    unitMix: [...mix.entries()].map(([unitType, count]) => ({ unitType, count })),
    lifts: manifest.commonCore.lifts,
    stairs: manifest.commonCore.stairs,
    commonLobby: manifest.commonCore.commonLobby
  };
}

// packages/backend/src/services/extraction-pipeline.ts
function siteContext(requirements) {
  const hard = requirements.hard;
  return {
    plotWidth: hard.plotWidthMm,
    plotDepth: hard.plotDepthMm,
    orientation: requirements.orientationDegrees,
    roadFacing: hard.roadFacing,
    frontSetback: requirements.setbacksMm?.front ?? 0,
    rearSetback: requirements.setbacksMm?.rear ?? 0,
    leftSetback: requirements.setbacksMm?.left ?? 0,
    rightSetback: requirements.setbacksMm?.right ?? 0
  };
}
function runExtractionPipeline(input) {
  const diagnostics = [];
  const planId = `extract_${input.projectId}_${input.imageWidePixels}x${input.imageTallPixels}`;
  const site = siteContext(input.requirements);
  const metadata = createExtractionMetadata({
    imageWidePixels: input.imageWidePixels,
    imageTallPixels: input.imageTallPixels,
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth,
    orientation: site.orientation,
    roadFacing: site.roadFacing,
    extractionSource: input.extractionSource,
    confidence: input.confidence
  });
  if (input.isApartment && input.apartmentManifest) {
    const parsed2 = parseExtractionPayload(input.payload, metadata, planId);
    diagnostics.push(...parsed2.diagnostics);
    if (!parsed2.plan) return rejected(planId, null, diagnostics, input);
    const frame = input.coordinateFrame ?? { width: input.imageWidePixels, height: input.imageTallPixels };
    const mapped = extractedPlanToApartmentStructure(parsed2.plan, { plotWidth: site.plotWidth, plotDepth: site.plotDepth }, frame);
    diagnostics.push(...mapped.diagnostics);
    if (!mapped.structure) return rejected(planId, parsed2.plan, diagnostics, input);
    const result = runApartmentPlanValidation({
      structure: mapped.structure,
      expectation: apartmentExpectationFromManifest2(input.apartmentManifest),
      site,
      projectId: input.projectId,
      projectName: input.projectName
    });
    diagnostics.push(...result.diagnostics);
    return {
      status: result.status,
      planId,
      extractedPlan: parsed2.plan,
      building: result.building,
      validation: result.validation,
      diagnostics,
      interpretationSource: input.interpretationSource,
      confidence: input.confidence,
      apartmentValidation: { stages: result.stages, counts: result.counts, source: result.source }
    };
  }
  const parsed = parseExtractionPayload(input.payload, metadata, planId);
  diagnostics.push(...parsed.diagnostics);
  if (!parsed.plan) {
    return rejected(planId, null, diagnostics, input);
  }
  const structural = inspectExtractionStructure(parsed.plan);
  diagnostics.push(...structural);
  if (structural.some((issue) => issue.severity === "error")) {
    return rejected(planId, parsed.plan, diagnostics, input);
  }
  const normalized = normalizeExtractedPlan(parsed.plan, {
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth,
    orientation: site.orientation,
    roadFacing: site.roadFacing
  });
  diagnostics.push(...normalized.diagnostics);
  if (!normalized.normalized) {
    return rejected(planId, parsed.plan, diagnostics, input);
  }
  const plan = normalized.normalized;
  const conversion = extractPlanToBuilding(plan, site, input.projectId, input.projectName);
  diagnostics.push(...conversion.diagnostics);
  if (!conversion.building) {
    return rejected(planId, plan, diagnostics, input);
  }
  const withOpenings = attachExtractedOpenings(conversion.building, plan, {
    plotWidth: site.plotWidth,
    plotDepth: site.plotDepth
  });
  diagnostics.push(...withOpenings.diagnostics);
  const validation = validateExtractedPlan(withOpenings.building, plan, input.requirements);
  diagnostics.push(...validation.verificationIssues);
  return {
    status: validation.isValid ? "ACCEPTED" : "REJECTED",
    planId,
    extractedPlan: plan,
    building: validation.isValid ? withOpenings.building : null,
    validation,
    diagnostics,
    interpretationSource: input.interpretationSource,
    confidence: input.confidence
  };
}
function rejected(planId, extractedPlan, diagnostics, input) {
  return {
    status: "REJECTED",
    planId,
    extractedPlan,
    building: null,
    validation: null,
    diagnostics,
    interpretationSource: input.interpretationSource,
    confidence: input.confidence
  };
}

// packages/core/src/types/enums.ts
var RoomType2 = /* @__PURE__ */ ((RoomType3) => {
  RoomType3["ServiceShaft"] = "service_shaft";
  RoomType3["Bedroom"] = "bedroom";
  RoomType3["Bathroom"] = "bathroom";
  RoomType3["Kitchen"] = "kitchen";
  RoomType3["Living"] = "living";
  RoomType3["Dining"] = "dining";
  RoomType3["Utility"] = "utility";
  RoomType3["Balcony"] = "balcony";
  RoomType3["Staircase"] = "staircase";
  RoomType3["Lift"] = "lift";
  RoomType3["Parking"] = "parking";
  RoomType3["Pooja"] = "pooja";
  RoomType3["Storage"] = "storage";
  RoomType3["Corridor"] = "corridor";
  RoomType3["Foyer"] = "foyer";
  RoomType3["Study"] = "study";
  RoomType3["ServantQuarter"] = "servant_quarter";
  RoomType3["Drawing"] = "drawing";
  RoomType3["FamilyLiving"] = "family_living";
  RoomType3["Terrace"] = "terrace";
  RoomType3["Garden"] = "garden";
  RoomType3["OTS"] = "ots";
  RoomType3["Porch"] = "porch";
  RoomType3["Dressing"] = "dressing";
  RoomType3["Custom"] = "custom";
  return RoomType3;
})(RoomType2 || {});
var Direction3 = /* @__PURE__ */ ((Direction4) => {
  Direction4["North"] = "north";
  Direction4["South"] = "south";
  Direction4["East"] = "east";
  Direction4["West"] = "west";
  return Direction4;
})(Direction3 || {});
var PreferenceLevel2 = /* @__PURE__ */ ((PreferenceLevel3) => {
  PreferenceLevel3["None"] = "none";
  PreferenceLevel3["Low"] = "low";
  PreferenceLevel3["Medium"] = "medium";
  PreferenceLevel3["High"] = "high";
  return PreferenceLevel3;
})(PreferenceLevel2 || {});
var PlotShape2 = /* @__PURE__ */ ((PlotShape3) => {
  PlotShape3["Rectangular"] = "rectangular";
  PlotShape3["LShaped"] = "L_shaped";
  PlotShape3["Irregular"] = "irregular";
  return PlotShape3;
})(PlotShape2 || {});

// packages/core/src/models/id.ts
var seed2 = null;
var counter2 = 0;
function generateId2() {
  if (seed2 !== null) {
    counter2++;
    const hex = (seed2 * 1e6 + counter2).toString(16).padStart(12, "0");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4000-8000-${hex.padStart(12, "0").slice(0, 12)}`;
  }
  return crypto.randomUUID();
}

// packages/core/src/models/errors.ts
var DomainError2 = class extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
    this.name = "DomainError";
  }
};
var InvalidDimensionError2 = class extends DomainError2 {
  constructor(field, value) {
    super(
      `Invalid dimension for "${field}": ${value}. Must be > 0.`,
      "INVALID_DIMENSION"
    );
    this.name = "InvalidDimensionError";
  }
};
var InvalidCoordinateError3 = class extends DomainError2 {
  constructor(field, value) {
    super(
      `Invalid coordinate for "${field}": ${value}. Must be finite.`,
      "INVALID_COORDINATE"
    );
    this.name = "InvalidCoordinateError";
  }
};

// packages/core/src/constants.ts
var DEFAULTS2 = {
  WALL_THICKNESS_EXTERNAL: 230,
  // mm
  WALL_THICKNESS_INTERNAL: 150,
  // mm
  WALL_THICKNESS_PARTITION: 100,
  // mm
  FLOOR_HEIGHT: 3e3,
  // mm (floor-to-floor)
  DOOR_WIDTH: 900,
  // mm
  DOOR_HEIGHT: 2100,
  // mm
  WINDOW_WIDTH: 1200,
  // mm
  WINDOW_HEIGHT: 1200,
  // mm
  WINDOW_SILL_HEIGHT: 900,
  // mm
  COLUMN_WIDTH: 300,
  // mm
  COLUMN_DEPTH: 300,
  // mm
  RISER_HEIGHT: 175,
  // mm
  TREAD_DEPTH: 250,
  // mm
  STAIR_WIDTH: 1e3
  // mm
};

// packages/core/src/models/factory.ts
function assertFinite2(field, value) {
  if (!Number.isFinite(value)) {
    throw new InvalidCoordinateError3(field, value);
  }
}
function assertPositive2(field, value) {
  assertFinite2(field, value);
  if (value <= 0) {
    throw new InvalidDimensionError2(field, value);
  }
}
function rectToPolygon3(x, y, width, height) {
  return {
    points: [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ]
  };
}
function createSite2(params) {
  assertPositive2("plotWidth", params.plotWidth);
  assertPositive2("plotDepth", params.plotDepth);
  const setbacks = {
    front: params.setbacks?.front ?? 0,
    rear: params.setbacks?.rear ?? 0,
    left: params.setbacks?.left ?? 0,
    right: params.setbacks?.right ?? 0
  };
  const accessPoints = (params.accessPoints ?? []).map((ap) => ({
    ...ap,
    id: generateId2()
  }));
  return {
    id: generateId2(),
    plotBoundary: rectToPolygon3(0, 0, params.plotWidth, params.plotDepth),
    plotWidth: params.plotWidth,
    plotDepth: params.plotDepth,
    plotArea: params.plotWidth * params.plotDepth,
    plotShape: params.plotShape ?? "rectangular" /* Rectangular */,
    orientation: params.orientation ?? 0,
    setbacks,
    accessPoints,
    roadFacing: params.roadFacing ?? "north" /* North */,
    plannedFloorCount: params.plannedFloorCount,
    roadWidth: params.roadWidth,
    cornerPlot: params.cornerPlot ?? false,
    secondaryRoadFacing: params.secondaryRoadFacing,
    developmentControls: params.developmentControls,
    unitSystem: params.unitSystem ?? "metric",
    siteZones: params.siteZones
  };
}
function createBuilding2(params) {
  const site = createSite2(params.site);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const buildingId = generateId2();
  const floors = (params.floors ?? []).map(
    (fp) => createFloor2({ ...fp, buildingId })
  );
  return {
    id: buildingId,
    projectId: params.projectId,
    name: params.name,
    site,
    floors,
    metadata: {
      projectId: params.metadata?.projectId ?? params.projectId,
      clientName: params.metadata?.clientName,
      description: params.metadata?.description,
      tags: params.metadata?.tags
    },
    version: 1,
    createdAt: now,
    updatedAt: now
  };
}
function createFloor2(params) {
  return {
    id: generateId2(),
    buildingId: params.buildingId,
    level: params.level,
    name: params.name ?? `Floor ${params.level}`,
    floorHeight: params.floorHeight ?? DEFAULTS2.FLOOR_HEIGHT,
    boundary: params.boundary ?? { points: [] },
    rooms: [],
    walls: [],
    doors: [],
    windows: [],
    stairs: [],
    columns: []
  };
}

// packages/core/src/models/validation.ts
var VALID_ROOM_TYPES2 = new Set(Object.values(RoomType2));

// packages/core/src/models/requirements-normalization.ts
var ROOM_TYPES2 = new Set(Object.values(RoomType2));
var DIRECTIONS2 = new Set(Object.values(Direction3));
var PLOT_SHAPES2 = new Set(Object.values(PlotShape2));
var PREFERENCE_LEVELS2 = new Set(Object.values(PreferenceLevel2));
function asRecord4(value) {
  return value !== null && typeof value === "object" ? value : {};
}
function finiteNumber(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function nonNegativeInteger(value, fallback) {
  const numeric = finiteNumber(value, fallback);
  return Math.max(0, Math.round(numeric));
}
function booleanValue(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function stringValue(value, fallback) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}
function enumValue(value, allowed, fallback) {
  return typeof value === "string" && allowed.has(value) ? value : fallback;
}
function directionDegrees(direction) {
  switch (direction) {
    case "east" /* East */:
      return 90;
    case "south" /* South */:
      return 180;
    case "west" /* West */:
      return 270;
    default:
      return 0;
  }
}
function normalizeDesignRequirementSpecification2(input) {
  const source = asRecord4(input);
  const rawHard = asRecord4(source.hard);
  const rawSoft = asRecord4(source.soft);
  const roadFacing = enumValue(rawHard.roadFacing, DIRECTIONS2, "north" /* North */);
  const floorsCount = Math.max(1, nonNegativeInteger(rawHard.floorsCount, 1));
  const bedroomCount = nonNegativeInteger(rawHard.bedroomCount, 2);
  const bathroomCount = nonNegativeInteger(rawHard.bathroomCount, Math.min(2, Math.max(1, bedroomCount)));
  const explicitParkingRequired = booleanValue(rawHard.parkingRequired, false);
  const parkingSpacesCount = nonNegativeInteger(
    rawHard.parkingSpacesCount,
    explicitParkingRequired ? 1 : 0
  );
  const rawCustomRooms = Array.isArray(rawHard.customRooms) ? rawHard.customRooms : [];
  const customRooms = rawCustomRooms.flatMap((entry) => {
    const custom = asRecord4(entry);
    if (typeof custom.type !== "string" || !ROOM_TYPES2.has(custom.type)) return [];
    const count = nonNegativeInteger(custom.count, 0);
    if (count === 0) return [];
    const name = typeof custom.name === "string" && custom.name.trim().length > 0 ? custom.name.trim() : void 0;
    return [{ type: custom.type, count, name }];
  });
  const hard = {
    plotWidthMm: finiteNumber(rawHard.plotWidthMm, 9144),
    plotDepthMm: finiteNumber(rawHard.plotDepthMm, 15240),
    roadFacing,
    floorsCount,
    bedroomCount,
    bathroomCount,
    kitchenRequired: booleanValue(rawHard.kitchenRequired, true),
    livingRoomRequired: booleanValue(rawHard.livingRoomRequired, true),
    diningRoomRequired: booleanValue(rawHard.diningRoomRequired, true),
    staircaseRequired: booleanValue(rawHard.staircaseRequired, false) || floorsCount > 1,
    parkingRequired: explicitParkingRequired || parkingSpacesCount > 0,
    parkingSpacesCount,
    liftRequired: booleanValue(rawHard.liftRequired, false),
    serviceYardRequired: booleanValue(rawHard.serviceYardRequired, false),
    futureExpansionAllowed: booleanValue(rawHard.futureExpansionAllowed, false),
    fullPlotCoverage: booleanValue(rawHard.fullPlotCoverage, false),
    ...customRooms.length > 0 ? { customRooms } : {}
  };
  const soft = {
    vastuCompliance: booleanValue(rawSoft.vastuCompliance, false),
    naturalLightPreference: enumValue(rawSoft.naturalLightPreference, PREFERENCE_LEVELS2, "high" /* High */),
    privacyPreference: enumValue(rawSoft.privacyPreference, PREFERENCE_LEVELS2, "high" /* High */),
    circulationEfficiency: enumValue(rawSoft.circulationEfficiency, PREFERENCE_LEVELS2, "high" /* High */),
    gardenPreference: booleanValue(rawSoft.gardenPreference, false),
    servantQuarter: booleanValue(rawSoft.servantQuarter, false),
    poojaRoom: booleanValue(rawSoft.poojaRoom, false),
    studyRoom: booleanValue(rawSoft.studyRoom, false),
    balconyPreferred: booleanValue(rawSoft.balconyPreferred, false),
    openKitchen: booleanValue(rawSoft.openKitchen, false),
    attachedBathroomsCount: nonNegativeInteger(rawSoft.attachedBathroomsCount, Math.min(1, bathroomCount))
  };
  const rawSetbacks = asRecord4(source.setbacksMm);
  const hasSetbacks = ["front", "rear", "left", "right"].every(
    (key) => typeof rawSetbacks[key] === "number" && Number.isFinite(rawSetbacks[key])
  );
  const rawSiteContext = asRecord4(source.siteContext);
  const location = typeof rawSiteContext.location === "string" ? rawSiteContext.location.trim() : "";
  const jurisdiction = typeof rawSiteContext.jurisdiction === "string" ? rawSiteContext.jurisdiction.trim() : "";
  return {
    schemaVersion: 1,
    ...typeof source.projectId === "string" && source.projectId.trim().length > 0 ? { projectId: source.projectId.trim() } : {},
    projectName: stringValue(
      source.projectName,
      `${bedroomCount}BHK Plan (${Math.round(hard.plotWidthMm / 304.8)}\xD7${Math.round(hard.plotDepthMm / 304.8)} ft)`
    ),
    ...typeof source.rawUserPrompt === "string" ? { rawUserPrompt: source.rawUserPrompt } : {},
    hard,
    soft,
    plotShape: enumValue(source.plotShape, PLOT_SHAPES2, "rectangular" /* Rectangular */),
    orientationDegrees: finiteNumber(source.orientationDegrees, directionDegrees(roadFacing)),
    ...hasSetbacks ? {
      setbacksMm: {
        front: rawSetbacks.front,
        rear: rawSetbacks.rear,
        left: rawSetbacks.left,
        right: rawSetbacks.right
      }
    } : {},
    ...location || jurisdiction ? {
      siteContext: {
        ...location ? { location } : {},
        ...jurisdiction ? { jurisdiction } : {}
      }
    } : {}
  };
}

// packages/core/src/capabilities.ts
var BUILDING_CAPABILITIES2 = Object.freeze({
  minimumFloorCount: 1,
  maximumFloorCount: 10
});
var SUPPORTED_FLOOR_COUNTS2 = Object.freeze(
  Array.from(
    { length: BUILDING_CAPABILITIES2.maximumFloorCount },
    (_, index) => index + BUILDING_CAPABILITIES2.minimumFloorCount
  )
);

// packages/core/src/models/space-catalog.ts
var M22 = 1e6;
var R2 = ["residential", "mixed_use"];
var C2 = ["commercial", "mixed_use"];
var E2 = ["educational"];
function definition2(id, displayName, categories, group, zone, minimumM2, preferredM2, options = {}) {
  const occupancy = options.occupancy ?? (categories[0] === "educational" ? "educational" : categories[0] === "commercial" ? "commercial" : "residential");
  return {
    id,
    displayName,
    categories,
    group,
    zone,
    occupancy,
    canonicalType: options.canonicalType,
    synonyms: options.synonyms ?? [],
    defaultQuantity: options.quantity ?? 1,
    minimumAreaMm2: minimumM2 * M22,
    preferredAreaMm2: preferredM2 * M22,
    maximumAreaMm2: options.max ? options.max * M22 : void 0,
    defaultPriority: options.priority ?? "preferred",
    defaultFloorPreference: options.floor ?? "any",
    generatorSupport: options.support ?? "program_only",
    tags: options.tags ?? [],
    relationships: options.relationships
  };
}
var residential2 = [
  definition2("primary_bedroom", "Primary Bedroom", R2, "private", "private" /* Private */, 12, 16, { max: 22, canonicalType: "bedroom" /* Bedroom */, support: "supported", priority: "required", floor: "upper_preferred", synonyms: ["master bedroom", "owner bedroom"] }),
  definition2("bedroom", "Bedroom", R2, "private", "private" /* Private */, 9.5, 13, { max: 18, canonicalType: "bedroom" /* Bedroom */, support: "supported", quantity: 2, priority: "required", floor: "upper_preferred", synonyms: ["bed room", "kids room"] }),
  definition2("guest_bedroom", "Guest Bedroom", R2, "private", "private" /* Private */, 9.5, 13, { max: 18, canonicalType: "bedroom" /* Bedroom */, support: "supported", floor: "ground_preferred", synonyms: ["guest room"] }),
  definition2("children_bedroom", "Children Bedroom", R2, "private", "private" /* Private */, 9.5, 12, { max: 16, canonicalType: "bedroom" /* Bedroom */, support: "supported", floor: "upper_preferred", synonyms: ["child room", "kids bedroom"] }),
  definition2("study", "Study / Home Office", R2, "private", "private" /* Private */, 6, 9, { max: 14, canonicalType: "study" /* Study */, support: "supported", synonyms: ["office", "home office"] }),
  definition2("dressing", "Dressing / Walk-in Closet", R2, "private", "private" /* Private */, 3, 5, { max: 8, synonyms: ["closet", "wardrobe"] }),
  definition2("primary_bathroom", "Primary Bathroom", R2, "baths", "service" /* Service */, 3, 4.5, { max: 7, canonicalType: "bathroom" /* Bathroom */, support: "supported", priority: "required", floor: "upper_preferred", synonyms: ["master bath", "ensuite"] }),
  definition2("attached_bathroom", "Attached Bathroom", R2, "baths", "service" /* Service */, 2.5, 4, { max: 6, canonicalType: "bathroom" /* Bathroom */, support: "supported", synonyms: ["ensuite bathroom"] }),
  definition2("common_bathroom", "Common Bathroom", R2, "baths", "service" /* Service */, 2.5, 4, { max: 6, canonicalType: "bathroom" /* Bathroom */, support: "supported", priority: "required", synonyms: ["washroom", "toilet"] }),
  definition2("powder_room", "Powder Room", R2, "baths", "service" /* Service */, 1.8, 2.5, { max: 4, canonicalType: "bathroom" /* Bathroom */, support: "supported", synonyms: ["guest toilet", "half bath"] }),
  definition2("living", "Living Room", R2, "living", "public" /* Public */, 12, 18, { max: 26, canonicalType: "living" /* Living */, support: "supported", priority: "required", floor: "ground_required", synonyms: ["lounge", "drawing room"] }),
  definition2("family_lounge", "Family Lounge", R2, "living", "semi_public" /* SemiPublic */, 10, 15, { max: 22, canonicalType: "family_living" /* FamilyLiving */, support: "program_only", floor: "upper_preferred", synonyms: ["family living"] }),
  definition2("dining", "Dining", R2, "living", "semi_public" /* SemiPublic */, 8, 12, { max: 18, canonicalType: "dining" /* Dining */, support: "supported", priority: "required", floor: "ground_preferred", relationships: [{ targetDefinitionId: "kitchen", strength: "preferred" /* Preferred */, reason: "Short food-service path" }] }),
  definition2("breakfast", "Breakfast / Informal Dining", R2, "living", "semi_public" /* SemiPublic */, 5, 8, { max: 12, synonyms: ["breakfast nook"] }),
  definition2("kitchen", "Kitchen", R2, "service", "service" /* Service */, 5.5, 9, { max: 14, canonicalType: "kitchen" /* Kitchen */, support: "supported", priority: "required", floor: "ground_preferred", relationships: [{ targetDefinitionId: "dining", strength: "preferred" /* Preferred */, reason: "Short food-service path" }, { targetDefinitionId: "utility", strength: "preferred" /* Preferred */, reason: "Connected service workflow" }] }),
  definition2("pantry", "Pantry", R2, "service", "service" /* Service */, 2, 3.5, { max: 6, synonyms: ["food store"] }),
  definition2("utility", "Utility", R2, "service", "service" /* Service */, 3, 5, { max: 8, canonicalType: "utility" /* Utility */, support: "supported", floor: "ground_preferred" }),
  definition2("store", "Store", R2, "service", "service" /* Service */, 2, 4, { max: 7, canonicalType: "storage" /* Storage */, support: "program_only", synonyms: ["storage"] }),
  definition2("laundry", "Laundry", R2, "service", "service" /* Service */, 3, 5, { max: 8 }),
  definition2("pooja", "Pooja Room", R2, "special", "private" /* Private */, 2, 3.5, { max: 6, canonicalType: "pooja" /* Pooja */, support: "supported", synonyms: ["prayer room", "puja"] }),
  definition2("foyer", "Entrance / Foyer", R2, "circulation", "public" /* Public */, 3, 5, { max: 9, canonicalType: "foyer" /* Foyer */, support: "program_only", floor: "ground_required", synonyms: ["entry", "entrance"] }),
  definition2("corridor", "Hall / Passage", R2, "circulation", "circulation" /* Circulation */, 3, 6, { max: 12, canonicalType: "corridor" /* Corridor */, support: "program_only", synonyms: ["hallway"] }),
  definition2("staircase", "Staircase", R2, "circulation", "circulation" /* Circulation */, 5, 7.5, { max: 12, canonicalType: "staircase" /* Staircase */, support: "supported", priority: "required", floor: "ground_required", synonyms: ["stairs"] }),
  definition2("lift", "Lift", R2, "circulation", "circulation" /* Circulation */, 4, 5, { max: 7, canonicalType: "lift" /* Lift */, support: "supported", synonyms: ["elevator"] }),
  definition2("balcony", "Balcony", R2, "outdoor", "outdoor" /* Outdoor */, 3, 5, { max: 9, canonicalType: "balcony" /* Balcony */, support: "supported", floor: "upper_preferred" }),
  definition2("terrace", "Terrace", R2, "outdoor", "outdoor" /* Outdoor */, 8, 14, { max: 30, canonicalType: "terrace" /* Terrace */, support: "program_only", floor: "top_preferred", synonyms: ["roof terrace"] }),
  definition2("sit_out", "Sit-out", R2, "outdoor", "outdoor" /* Outdoor */, 4, 7, { max: 12, synonyms: ["veranda"] }),
  definition2("porch", "Porch", R2, "outdoor", "outdoor" /* Outdoor */, 5, 8, { max: 14, floor: "ground_required" }),
  definition2("car_parking", "Car Parking", R2, "vehicle", "outdoor" /* Outdoor */, 14, 15, { max: 20, canonicalType: "parking" /* Parking */, support: "supported", priority: "required", floor: "ground_required", synonyms: ["car", "parking bay"] }),
  definition2("two_wheeler_parking", "Two-Wheeler Parking", R2, "vehicle", "outdoor" /* Outdoor */, 3, 5, { max: 8, synonyms: ["bike parking", "scooter parking"] }),
  definition2("garage", "Garage", R2, "vehicle", "outdoor" /* Outdoor */, 16, 20, { max: 28, canonicalType: "parking" /* Parking */, support: "supported", floor: "ground_required" })
];
var commercial2 = [
  definition2("reception", "Reception", C2, "work", "public" /* Public */, 8, 14, { occupancy: "commercial", priority: "required", floor: "ground_required", synonyms: ["front desk"] }),
  definition2("retail", "Retail Area", C2, "work", "public" /* Public */, 25, 45, { occupancy: "commercial", floor: "ground_required", synonyms: ["shop", "storefront"] }),
  definition2("open_office", "Open Office", C2, "work", "semi_public" /* SemiPublic */, 30, 55, { occupancy: "commercial", priority: "required", synonyms: ["workstations", "office floor"] }),
  definition2("private_cabin", "Private Cabin", C2, "work", "private" /* Private */, 8, 12, { occupancy: "commercial", quantity: 2, synonyms: ["office cabin"] }),
  definition2("manager_cabin", "Manager Cabin", C2, "work", "private" /* Private */, 10, 15, { occupancy: "commercial" }),
  definition2("conference", "Conference Room", C2, "work", "semi_public" /* SemiPublic */, 15, 24, { occupancy: "commercial", synonyms: ["board room"] }),
  definition2("meeting", "Meeting Room", C2, "work", "semi_public" /* SemiPublic */, 8, 14, { occupancy: "commercial" }),
  definition2("waiting", "Waiting Area", C2, "living", "public" /* Public */, 8, 15, { occupancy: "commercial" }),
  definition2("commercial_pantry", "Pantry", C2, "service", "service" /* Service */, 4, 7, { occupancy: "commercial" }),
  definition2("staff_dining", "Staff Dining", C2, "service", "semi_public" /* SemiPublic */, 12, 20, { occupancy: "commercial" }),
  definition2("commercial_storage", "Storage", C2, "service", "service" /* Service */, 5, 9, { occupancy: "commercial", synonyms: ["store"] }),
  definition2("server_room", "Server / IT Room", C2, "technical", "service" /* Service */, 6, 10, { occupancy: "commercial", synonyms: ["it room"] }),
  definition2("electrical_room", "Electrical Room", C2, "technical", "service" /* Service */, 5, 8, { occupancy: "commercial" }),
  definition2("male_toilet", "Male Toilet", [...C2, ...E2], "baths", "service" /* Service */, 6, 10, { occupancy: "shared", priority: "required", synonyms: ["washroom", "men toilet"] }),
  definition2("female_toilet", "Female Toilet", [...C2, ...E2], "baths", "service" /* Service */, 6, 10, { occupancy: "shared", priority: "required", synonyms: ["washroom", "women toilet"] }),
  definition2("accessible_toilet", "Accessible Toilet", [...C2, ...E2], "baths", "service" /* Service */, 4, 5.5, { occupancy: "shared", priority: "required", synonyms: ["disabled toilet", "wheelchair toilet"] }),
  definition2("commercial_lift", "Lift", C2, "circulation", "circulation" /* Circulation */, 4, 6, { occupancy: "commercial", priority: "required", floor: "ground_required", synonyms: ["elevator"] }),
  definition2("commercial_stair", "Staircase", C2, "circulation", "circulation" /* Circulation */, 8, 12, { occupancy: "commercial", priority: "required", floor: "ground_required", synonyms: ["stairs"] }),
  definition2("fire_stair", "Fire Stair", C2, "circulation", "circulation" /* Circulation */, 8, 12, { occupancy: "commercial", priority: "required" }),
  definition2("service_shaft", "Service Shaft", C2, "technical", "service" /* Service */, 3, 5, { occupancy: "commercial" }),
  definition2("commercial_parking", "Parking", C2, "vehicle", "outdoor" /* Outdoor */, 14, 15, { occupancy: "commercial", quantity: 4, priority: "required", floor: "ground_required", synonyms: ["car parking"] }),
  definition2("loading", "Loading / Service Area", C2, "vehicle", "service" /* Service */, 25, 40, { occupancy: "commercial", floor: "ground_required" })
];
var educational2 = [
  definition2("classroom", "Classroom", E2, "learning", "semi_public" /* SemiPublic */, 35, 48, { occupancy: "educational", quantity: 4, priority: "required", synonyms: ["class", "teaching room"] }),
  definition2("laboratory", "Laboratory", E2, "learning", "semi_public" /* SemiPublic */, 45, 65, { occupancy: "educational", quantity: 2, synonyms: ["lab", "science lab"] }),
  definition2("computer_lab", "Computer Lab", E2, "learning", "semi_public" /* SemiPublic */, 45, 60, { occupancy: "educational", synonyms: ["computer room"] }),
  definition2("library", "Library", E2, "learning", "semi_public" /* SemiPublic */, 55, 90, { occupancy: "educational", priority: "required" }),
  definition2("staff_room", "Staff Room", E2, "work", "private" /* Private */, 20, 35, { occupancy: "educational" }),
  definition2("principal_office", "Principal / Head Office", E2, "work", "private" /* Private */, 12, 18, { occupancy: "educational", synonyms: ["head office"] }),
  definition2("administration", "Administration", E2, "work", "semi_public" /* SemiPublic */, 20, 35, { occupancy: "educational", priority: "required", synonyms: ["admin"] }),
  definition2("education_reception", "Reception", E2, "work", "public" /* Public */, 10, 16, { occupancy: "educational", floor: "ground_required" }),
  definition2("education_meeting", "Meeting Room", E2, "work", "semi_public" /* SemiPublic */, 10, 16, { occupancy: "educational" }),
  definition2("multipurpose", "Multipurpose Room", E2, "learning", "semi_public" /* SemiPublic */, 60, 100, { occupancy: "educational" }),
  definition2("auditorium", "Auditorium", E2, "learning", "public" /* Public */, 120, 220, { occupancy: "educational", floor: "ground_preferred" }),
  definition2("education_store", "Store", E2, "service", "service" /* Service */, 6, 10, { occupancy: "educational", synonyms: ["storage"] }),
  definition2("education_stair", "Staircase", E2, "circulation", "circulation" /* Circulation */, 10, 15, { occupancy: "educational", quantity: 2, priority: "required", floor: "ground_required", synonyms: ["stairs"] }),
  definition2("education_lift", "Lift", E2, "circulation", "circulation" /* Circulation */, 5, 7, { occupancy: "educational", priority: "required", floor: "ground_required", synonyms: ["elevator"] }),
  definition2("education_corridor", "Corridor", E2, "circulation", "circulation" /* Circulation */, 30, 55, { occupancy: "educational", priority: "required", synonyms: ["passage"] }),
  definition2("playground", "Playground / Outdoor Area", E2, "outdoor", "outdoor" /* Outdoor */, 300, 600, { occupancy: "educational", synonyms: ["outdoor", "play area"] }),
  definition2("education_parking", "Parking", E2, "vehicle", "outdoor" /* Outdoor */, 70, 100, { occupancy: "educational", floor: "ground_required", synonyms: ["car parking"] })
];
var SPACE_CATALOG2 = Object.freeze([...residential2, ...commercial2, ...educational2]);
var SPACE_PROGRAM_PRESETS2 = Object.freeze([
  { id: "residential_1bhk", name: "1BHK", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "primary_bedroom" },
    { definitionId: "common_bathroom" },
    { definitionId: "car_parking" }
  ] },
  { id: "residential_2bhk", name: "2BHK", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "primary_bedroom" },
    { definitionId: "bedroom", quantity: 1 },
    { definitionId: "primary_bathroom" },
    { definitionId: "common_bathroom" },
    { definitionId: "utility" },
    { definitionId: "car_parking" },
    { definitionId: "staircase" }
  ] },
  { id: "residential_3bhk", name: "3BHK", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "primary_bedroom" },
    { definitionId: "bedroom", quantity: 2 },
    { definitionId: "primary_bathroom" },
    { definitionId: "common_bathroom", quantity: 2 },
    { definitionId: "utility" },
    { definitionId: "pooja", priority: "preferred" },
    { definitionId: "car_parking" },
    { definitionId: "staircase" },
    { definitionId: "balcony" }
  ] },
  { id: "residential_duplex", name: "Duplex", category: "residential", items: [
    { definitionId: "living" },
    { definitionId: "dining" },
    { definitionId: "kitchen" },
    { definitionId: "guest_bedroom", floorPreference: { kind: "ground_preferred" } },
    { definitionId: "primary_bedroom", floorPreference: { kind: "upper_preferred" } },
    { definitionId: "bedroom", quantity: 2, floorPreference: { kind: "upper_preferred" } },
    { definitionId: "common_bathroom", quantity: 3 },
    { definitionId: "staircase" },
    { definitionId: "balcony" }
  ] },
  { id: "commercial_small_office", name: "Small Office", category: "commercial", items: [
    { definitionId: "reception" },
    { definitionId: "open_office" },
    { definitionId: "private_cabin", quantity: 2 },
    { definitionId: "meeting" },
    { definitionId: "commercial_pantry" },
    { definitionId: "male_toilet" },
    { definitionId: "female_toilet" },
    { definitionId: "accessible_toilet" },
    { definitionId: "commercial_stair" },
    { definitionId: "commercial_parking", quantity: 2 }
  ] },
  { id: "educational_classroom_wing", name: "Classroom Wing", category: "educational", items: [
    { definitionId: "classroom", quantity: 6 },
    { definitionId: "laboratory", quantity: 2 },
    { definitionId: "library" },
    { definitionId: "staff_room" },
    { definitionId: "administration" },
    { definitionId: "male_toilet" },
    { definitionId: "female_toilet" },
    { definitionId: "accessible_toilet" },
    { definitionId: "education_stair", quantity: 2 },
    { definitionId: "education_lift" }
  ] }
]);

// packages/core/src/models/space-program.ts
var CIRCULATION_RESERVE_RATIO2 = 0.12;
var VERTICAL_CORE_RESERVE_RATIO2 = 0.04;
var WALL_SERVICE_RESERVE_RATIO2 = 0.06;
var TOTAL_RESERVE_RATIO2 = CIRCULATION_RESERVE_RATIO2 + VERTICAL_CORE_RESERVE_RATIO2 + WALL_SERVICE_RESERVE_RATIO2;
var DERIVATION_MAP2 = {
  ["living" /* Living */]: "living",
  ["dining" /* Dining */]: "dining",
  ["kitchen" /* Kitchen */]: "kitchen",
  ["bedroom" /* Bedroom */]: "bedroom",
  ["bathroom" /* Bathroom */]: "common_bathroom",
  ["utility" /* Utility */]: "utility",
  ["pooja" /* Pooja */]: "pooja",
  ["study" /* Study */]: "study",
  ["staircase" /* Staircase */]: "staircase",
  ["lift" /* Lift */]: "lift",
  ["parking" /* Parking */]: "car_parking",
  ["balcony" /* Balcony */]: "balcony",
  ["storage" /* Storage */]: "store",
  ["corridor" /* Corridor */]: "corridor",
  ["foyer" /* Foyer */]: "foyer",
  ["family_living" /* FamilyLiving */]: "family_lounge",
  ["terrace" /* Terrace */]: "terrace"
};

// packages/core/src/models/footprint.ts
var CIRCULATION_RATIO2 = 0.12;
var CORE_RATIO2 = 0.04;
var WALL_SERVICE_RATIO2 = 0.06;
var USABLE_RATIO2 = 1 - CIRCULATION_RATIO2 - CORE_RATIO2 - WALL_SERVICE_RATIO2;
var FOOTPRINT_SHAPES2 = Object.freeze([
  { id: "rectangle", name: "Rectangle", description: "Efficient universal floor plate", recommendedCategories: ["residential", "commercial", "mixed_use"] },
  { id: "l_shape", name: "L Shape", description: "Two wings around an open edge", recommendedCategories: ["residential", "commercial", "educational", "mixed_use"] },
  { id: "u_shape", name: "U Shape", description: "Three-sided court or arrival space", recommendedCategories: ["educational", "commercial"] },
  { id: "t_shape", name: "T Shape", description: "Primary bar with a central wing", recommendedCategories: ["educational", "commercial"] },
  { id: "courtyard", name: "Courtyard", description: "Limited perimeter plate with an access slot; not polygon-hole topology", recommendedCategories: ["residential", "commercial", "educational"], customSupport: "limited" },
  { id: "linear", name: "Linear", description: "Shallow elongated building plate", recommendedCategories: ["commercial", "educational"] },
  { id: "custom", name: "Custom", description: "Preserved existing or imported polygon", recommendedCategories: [], customSupport: "limited" }
]);

// scripts/src/gemini-image-live-smoke.ts
function loadEnv() {
  const envCandidates = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "packages/backend/.env")
  ];
  for (const envPath of envCandidates) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}
loadEnv();
async function main() {
  console.log("================================================================");
  console.log("GEMINI 3 PRO IMAGE: LIVE ACCEPTANCE & SMOKE TEST");
  console.log("================================================================\n");
  const apiKey = (process.env.GEMINI_API_KEY ?? "").trim();
  const imageModel = (process.env.GEMINI_IMAGE_MODEL ?? "").trim() || DEFAULT_GEMINI_IMAGE_MODEL;
  const imageSize = (process.env.GEMINI_IMAGE_SIZE ?? "").trim() || DEFAULT_GEMINI_IMAGE_SIZE;
  const outDir = path.resolve(process.cwd(), "scripts", "gemini_live_output");
  fs.mkdirSync(outDir, { recursive: true });
  console.log(`Configuration:`);
  console.log(`- API Key configured: ${Boolean(apiKey)}`);
  console.log(`- Model: ${imageModel}`);
  console.log(`- Output Resolution Target: ${imageSize}`);
  console.log(`- Output Directory: ${outDir}
`);
  if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is not configured in process.env or packages/backend/.env.");
    process.exit(1);
  }
  console.log("[Step 1/8] Generating deterministic 2-flat mixed 2BHK + 3BHK layout...");
  const siteConfig = {
    plotWidthMm: 35e3,
    plotDepthMm: 3e4,
    setbacksMm: { front: 4e3, rear: 3e3, left: 3e3, right: 3e3 },
    roadFacing: "north"
  };
  const planned = planDeterministicApartment({
    site: siteConfig,
    flatsPerFloor: 2,
    unitMix: [
      { unitType: "2BHK", count: 1, carpetAreaSqFt: 850 },
      { unitType: "3BHK", count: 1, carpetAreaSqFt: 1200 }
    ],
    commonCore: {
      passengerLifts: 2,
      staircaseCount: 2,
      commonLobby: true
    },
    strategy: "balanced",
    seed: 42
  });
  if (!planned.success || !planned.structuralRepresentation) {
    console.error("FAILED: Deterministic planner failed to generate layout.");
    process.exit(1);
  }
  console.log(`\u2713 Deterministic layout generated successfully.`);
  console.log(`  Flats: ${planned.schematic.units.length}, Core bounds: ${JSON.stringify(planned.structuralRepresentation.commonCore.bounds)}`);
  console.log("\n[Step 2/8] Constructing authoritative ApartmentGenerationManifest...");
  const rulesProfile = getApartmentRulesProfile("pune_pmc", {
    floorCount: 1,
    buildingHeightM: 3.1,
    tenementsPerFloor: 2
  });
  const manifest = buildApartmentGenerationManifest({
    site: siteConfig,
    apartmentConfig: {
      projectType: "apartment",
      jurisdiction: "pune_pmc",
      floorCount: 1,
      flatsPerFloor: 2,
      unitMix: [
        { unitType: "2BHK", count: 1, carpetAreaSqFt: 850 },
        { unitType: "3BHK", count: 1, carpetAreaSqFt: 1200 }
      ],
      commonCore: {
        passengerLifts: 2,
        serviceLifts: 0,
        staircaseCount: 2,
        fireStaircaseRequired: true,
        commonLobby: true
      },
      parking: {
        residentParkingCount: 4,
        visitorParkingCount: 2
      },
      amenities: {
        groundSiteAmenities: [],
        buildingAmenities: []
      }
    },
    rulesProfile,
    currentFloorIndex: 1
  });
  console.log(`\u2713 Manifest built: exact unit count = ${manifest.units.exactCount}`);
  console.log("\n[Step 3/8] Rendering high-resolution structural reference PNG via renderStructuralPlan...");
  const structuralRender = renderStructuralPlan(planned.structuralRepresentation, {
    targetLongSidePx: 2048,
    minShortSidePx: 1536
  });
  const structuralPngPath = path.join(outDir, "structural_reference.png");
  const structuralSvgPath = path.join(outDir, "structural_reference.svg");
  fs.writeFileSync(structuralPngPath, structuralRender.png);
  fs.writeFileSync(structuralSvgPath, structuralRender.svg, "utf8");
  console.log(`\u2713 High-resolution structural reference rendered:`);
  console.log(`  Dimensions: ${structuralRender.width} x ${structuralRender.height}`);
  console.log(`  PNG Size: ${structuralRender.png.length} bytes`);
  console.log(`  SHA-256 Hash: ${structuralRender.hash}`);
  console.log(`  Saved to: ${structuralPngPath}`);
  console.log("\n[Step 4/8] Loading available genuine style references...");
  const refBucketDir = path.resolve(process.cwd(), "packages/backend/data/reference-images/buckets/flats_2/normalized_512");
  const genuineRefs = [];
  if (fs.existsSync(refBucketDir)) {
    const files = fs.readdirSync(refBucketDir).filter((f) => f.endsWith(".png")).sort();
    for (const f of files.slice(0, 2)) {
      const buf = fs.readFileSync(path.join(refBucketDir, f));
      genuineRefs.push({
        id: `ref_${f.replace(/\.[^/.]+$/, "")}`,
        name: f,
        base64Data: buf.toString("base64"),
        mimeType: "image/png"
      });
    }
  }
  console.log(`\u2713 Loaded ${genuineRefs.length} genuine style references (no duplication).`);
  const allReferences = [
    {
      id: "structural_reference",
      name: "structural_reference.png",
      base64Data: structuralRender.png.toString("base64"),
      mimeType: "image/png"
    },
    ...genuineRefs
  ];
  console.log("\n[Step 5/8] Compiling Gemini FloorPlanImagePromptRequest...");
  const buildingSite = createBuilding2({
    projectId: "gemini_smoke_proj",
    name: "Gemini Smoke Test",
    site: {
      plotWidth: siteConfig.plotWidthMm,
      plotDepth: siteConfig.plotDepthMm,
      plannedFloorCount: 1,
      roadFacing: "north",
      setbacks: siteConfig.setbacksMm,
      orientation: 0
    },
    floors: [{ buildingId: "gemini_smoke_proj", level: 0 }]
  }).site;
  const promptRequest = compileApartmentFloorPlanImagePrompt({
    projectId: "gemini_smoke_proj",
    projectName: "Gemini Smoke Project",
    site: buildingSite,
    apartmentConfig: {
      projectType: "apartment",
      jurisdiction: "pune_pmc",
      flatsPerFloor: 2,
      floorCount: 1,
      unitMix: [
        { unitType: "2BHK", count: 1, carpetAreaSqFt: 850 },
        { unitType: "3BHK", count: 1, carpetAreaSqFt: 1200 }
      ],
      commonCore: {
        passengerLifts: 2,
        serviceLifts: 0,
        staircaseCount: 2,
        fireStaircaseRequired: true,
        commonLobby: true
      },
      parking: {
        residentParkingCount: 4,
        visitorParkingCount: 2
      },
      amenities: {
        groundSiteAmenities: [],
        buildingAmenities: []
      }
    },
    manifest,
    seed: 42,
    referenceImages: allReferences
  });
  console.log("\n[Step 6/8] Executing Gemini 3 Pro Image generation...");
  const imageProvider = new GeminiImageProvider({
    apiKey,
    model: imageModel,
    imageSize,
    timeoutMs: 12e4
  });
  let generatedImageBytes = null;
  let generatedMimeType = "image/png";
  let apiSuccess = false;
  let apiFailureReason;
  const t0 = Date.now();
  try {
    const result = await imageProvider.generateFloorPlan(promptRequest);
    const latency = ((Date.now() - t0) / 1e3).toFixed(2);
    apiSuccess = true;
    generatedImageBytes = Buffer.from(result.imageBase64, "base64");
    generatedMimeType = result.mimeType;
    const candidateImagePath = path.join(outDir, "gemini_3_pro_image_candidate.png");
    fs.writeFileSync(candidateImagePath, generatedImageBytes);
    console.log(`\u2713 Gemini Image Generation SUCCEEDED in ${latency}s!`);
    console.log(`  Saved generated candidate to: ${candidateImagePath}`);
    console.log(`  Payload size: ${generatedImageBytes.length} bytes`);
  } catch (err) {
    const latency = ((Date.now() - t0) / 1e3).toFixed(2);
    apiFailureReason = err.message || String(err);
    console.warn(`! Gemini Image API Call returned in ${latency}s:`);
    console.warn(`  Code: ${err.code ?? "ERROR"}`);
    console.warn(`  Detail: ${apiFailureReason}`);
  }
  console.log("\n[Step 7/8] Running Gemini Vision Plan Interpretation...");
  const visionProvider = new GeminiProvider({
    apiKey,
    model: "gemini-3.6-flash",
    timeoutMs: 3e4
  });
  const imageToInterpret = generatedImageBytes ?? structuralRender.png;
  const imageSourceLabel = generatedImageBytes ? "Gemini Generated Candidate" : "Structural Reference Baseline";
  console.log(`Interpreting image (${imageSourceLabel}, ${imageToInterpret.length} bytes)...`);
  let visionResult = null;
  let interpretationSuccess = false;
  let interpretationError;
  try {
    visionResult = await interpretPlanImageWithGemini(visionProvider, {
      plotWidthMm: siteConfig.plotWidthMm,
      plotDepthMm: siteConfig.plotDepthMm,
      roadFacing: "north",
      orientationDegrees: 0,
      userPrompt: "2-flat apartment floor plan",
      imageBase64: imageToInterpret.toString("base64"),
      imageMimeType: generatedMimeType,
      apartmentContext: apartmentInterpretationContextFromManifest2(manifest),
      requirements: {
        plotWidthMm: siteConfig.plotWidthMm,
        plotDepthMm: siteConfig.plotDepthMm,
        roadFacing: "north",
        unitMix: [
          { unitType: "2BHK", count: 1 },
          { unitType: "3BHK", count: 1 }
        ]
      }
    });
    interpretationSuccess = true;
    console.log(`\u2713 Gemini Vision Interpretation SUCCEEDED!`);
    console.log(`  Detected units: ${Array.isArray(visionResult.parsed?.units) ? visionResult.parsed.units.length : "unknown"}`);
    console.log(`  Detected rooms: ${Array.isArray(visionResult.parsed?.rooms) ? visionResult.parsed.rooms.length : "unknown"}`);
  } catch (err) {
    interpretationError = err.message || String(err);
    console.warn(`! Vision Interpretation error: ${interpretationError}`);
  }
  console.log("\n[Step 8/8] Executing Deterministic Hard Validation...");
  let hardValidationResult = null;
  let hardValidationPassed = false;
  if (visionResult?.parsed) {
    const spec = normalizeDesignRequirementSpecification2({
      hard: {
        plotWidthMm: siteConfig.plotWidthMm,
        plotDepthMm: siteConfig.plotDepthMm,
        bedroomCount: 5,
        // 2BHK (2) + 3BHK (3) = 5 bedrooms
        bathroomCount: 4,
        roadFacing: "north",
        floorsCount: 1
      },
      soft: {},
      rawUserPrompt: "2-flat apartment layout"
    });
    hardValidationResult = await runExtractionPipeline({
      projectId: "gemini_smoke_proj",
      projectName: "Gemini Smoke Project",
      requirements: spec,
      imageWidePixels: structuralRender.width,
      imageTallPixels: structuralRender.height,
      payload: visionResult.parsed,
      extractionSource: "gemini_vision",
      confidence: "high",
      interpretationSource: "provider",
      isApartment: true,
      apartmentManifest: manifest,
      coordinateFrame: visionResult.coordinateFrame.kind === "normalized" ? { width: visionResult.coordinateFrame.width, height: visionResult.coordinateFrame.height } : void 0
    });
    hardValidationPassed = hardValidationResult.status === "ACCEPTED" && hardValidationResult.building !== null;
    console.log(`\u2713 Extraction pipeline status: ${hardValidationResult.status}`);
    if (hardValidationResult.validation) {
      console.log(`  Validation isValid: ${hardValidationResult.validation.isValid}`);
      console.log(`  Issues count: ${hardValidationResult.validation.verificationIssues.length}`);
    }
  } else {
    console.log(`- Hard validation skipped because vision interpretation was unavailable.`);
  }
  console.log("\n================================================================");
  console.log("CRITICAL ACCEPTANCE REPORT SUMMARY");
  console.log("================================================================");
  console.log(`- API Success: ${apiSuccess ? "PASS" : "FAIL / QUOTA LIMIT"}`);
  if (apiFailureReason) console.log(`  API Error Detail: ${apiFailureReason}`);
  console.log(`- Image Decode Success: ${Boolean(generatedImageBytes)}`);
  console.log(`- Interpretation Success: ${interpretationSuccess ? "PASS" : "FAIL"}`);
  if (interpretationError) console.log(`  Interpretation Error: ${interpretationError}`);
  console.log(`- Hard Validation Result: ${hardValidationPassed ? "ACCEPTED" : "REJECTED"}`);
  console.log(`- Model Used: ${imageModel}`);
  console.log(`- Resolution: ${imageSize} (Structural Reference: ${structuralRender.width}x${structuralRender.height})`);
  console.log(`- Structural SHA-256 Hash: ${structuralRender.hash}`);
  console.log(`- References Attached: ${allReferences.length} (1 Structural + ${genuineRefs.length} Style)`);
  console.log(`- Structural Reference Path: ${structuralPngPath}`);
  console.log("================================================================\n");
  const summaryData = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    apiSuccess,
    apiFailureReason: apiFailureReason ?? null,
    imageDecodeSuccess: Boolean(generatedImageBytes),
    interpretationSuccess,
    interpretationError: interpretationError ?? null,
    hardValidationPassed,
    model: imageModel,
    resolution: imageSize,
    structuralHash: structuralRender.hash,
    referencesAttached: allReferences.map((r) => r.id),
    structuralReferencePath: structuralPngPath
  };
  fs.writeFileSync(
    path.join(outDir, "gemini_smoke_summary.json"),
    JSON.stringify(summaryData, null, 2),
    "utf8"
  );
}
main().catch((err) => {
  console.error("Fatal execution error:", err);
  process.exit(1);
});
