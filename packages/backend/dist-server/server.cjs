"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../ai-orchestration/dist/providers/base.js
var BaseAIProvider, AISafetyError;
var init_base = __esm({
  "../ai-orchestration/dist/providers/base.js"() {
    "use strict";
    BaseAIProvider = class {
    };
    AISafetyError = class extends Error {
      rawOutput;
      constructor(message, rawOutput) {
        super(`[AISafetyError] ${message}`);
        this.rawOutput = rawOutput;
        this.name = "AISafetyError";
      }
    };
  }
});

// ../core/dist/types/enums.js
var RoomType, Direction, DaylightLevel, PrivacyLevel, PreferenceLevel, AdjacencyStrength, WallType, DoorType, SwingDirection, WindowType, StairType, ColumnShape, ProjectStatus, ChangeSource, PlotShape, AITaskType;
var init_enums = __esm({
  "../core/dist/types/enums.js"() {
    "use strict";
    (function(RoomType2) {
      RoomType2["ServiceShaft"] = "service_shaft";
      RoomType2["Bedroom"] = "bedroom";
      RoomType2["Bathroom"] = "bathroom";
      RoomType2["Kitchen"] = "kitchen";
      RoomType2["Living"] = "living";
      RoomType2["Dining"] = "dining";
      RoomType2["Utility"] = "utility";
      RoomType2["Balcony"] = "balcony";
      RoomType2["Staircase"] = "staircase";
      RoomType2["Lift"] = "lift";
      RoomType2["Parking"] = "parking";
      RoomType2["Pooja"] = "pooja";
      RoomType2["Storage"] = "storage";
      RoomType2["Corridor"] = "corridor";
      RoomType2["Foyer"] = "foyer";
      RoomType2["Study"] = "study";
      RoomType2["ServantQuarter"] = "servant_quarter";
      RoomType2["Drawing"] = "drawing";
      RoomType2["FamilyLiving"] = "family_living";
      RoomType2["Terrace"] = "terrace";
      RoomType2["Garden"] = "garden";
      RoomType2["OTS"] = "ots";
      RoomType2["Porch"] = "porch";
      RoomType2["Dressing"] = "dressing";
      RoomType2["Custom"] = "custom";
    })(RoomType || (RoomType = {}));
    (function(Direction2) {
      Direction2["North"] = "north";
      Direction2["South"] = "south";
      Direction2["East"] = "east";
      Direction2["West"] = "west";
    })(Direction || (Direction = {}));
    (function(DaylightLevel2) {
      DaylightLevel2["None"] = "none";
      DaylightLevel2["Low"] = "low";
      DaylightLevel2["Medium"] = "medium";
      DaylightLevel2["High"] = "high";
    })(DaylightLevel || (DaylightLevel = {}));
    (function(PrivacyLevel2) {
      PrivacyLevel2["None"] = "none";
      PrivacyLevel2["Low"] = "low";
      PrivacyLevel2["Medium"] = "medium";
      PrivacyLevel2["High"] = "high";
    })(PrivacyLevel || (PrivacyLevel = {}));
    (function(PreferenceLevel2) {
      PreferenceLevel2["None"] = "none";
      PreferenceLevel2["Low"] = "low";
      PreferenceLevel2["Medium"] = "medium";
      PreferenceLevel2["High"] = "high";
    })(PreferenceLevel || (PreferenceLevel = {}));
    (function(AdjacencyStrength2) {
      AdjacencyStrength2["Required"] = "required";
      AdjacencyStrength2["Preferred"] = "preferred";
      AdjacencyStrength2["Avoid"] = "avoid";
    })(AdjacencyStrength || (AdjacencyStrength = {}));
    (function(WallType2) {
      WallType2["External"] = "external";
      WallType2["Internal"] = "internal";
      WallType2["Partition"] = "partition";
    })(WallType || (WallType = {}));
    (function(DoorType2) {
      DoorType2["OpenPassage"] = "open_passage";
      DoorType2["Single"] = "single";
      DoorType2["Double"] = "double";
      DoorType2["Sliding"] = "sliding";
      DoorType2["Folding"] = "folding";
    })(DoorType || (DoorType = {}));
    (function(SwingDirection2) {
      SwingDirection2["Inward"] = "inward";
      SwingDirection2["Outward"] = "outward";
      SwingDirection2["Left"] = "left";
      SwingDirection2["Right"] = "right";
    })(SwingDirection || (SwingDirection = {}));
    (function(WindowType2) {
      WindowType2["Fixed"] = "fixed";
      WindowType2["Sliding"] = "sliding";
      WindowType2["Casement"] = "casement";
      WindowType2["Ventilator"] = "ventilator";
    })(WindowType || (WindowType = {}));
    (function(StairType2) {
      StairType2["Straight"] = "straight";
      StairType2["LShaped"] = "L_shaped";
      StairType2["UShaped"] = "U_shaped";
      StairType2["Spiral"] = "spiral";
    })(StairType || (StairType = {}));
    (function(ColumnShape2) {
      ColumnShape2["Rectangular"] = "rectangular";
      ColumnShape2["Circular"] = "circular";
    })(ColumnShape || (ColumnShape = {}));
    (function(ProjectStatus2) {
      ProjectStatus2["Draft"] = "draft";
      ProjectStatus2["Active"] = "active";
      ProjectStatus2["Completed"] = "completed";
      ProjectStatus2["Archived"] = "archived";
    })(ProjectStatus || (ProjectStatus = {}));
    (function(ChangeSource2) {
      ChangeSource2["Manual"] = "manual";
      ChangeSource2["AIEdit"] = "ai_edit";
      ChangeSource2["Generation"] = "generation";
    })(ChangeSource || (ChangeSource = {}));
    (function(PlotShape2) {
      PlotShape2["Rectangular"] = "rectangular";
      PlotShape2["LShaped"] = "L_shaped";
      PlotShape2["Irregular"] = "irregular";
    })(PlotShape || (PlotShape = {}));
    (function(AITaskType2) {
      AITaskType2["RequirementExtraction"] = "requirement_extraction";
      AITaskType2["PlanExplanation"] = "plan_explanation";
      AITaskType2["DesignCritique"] = "design_critique";
      AITaskType2["NaturalLanguageEdit"] = "natural_language_edit";
      AITaskType2["RoomNaming"] = "room_naming";
      AITaskType2["VastuAnalysis"] = "vastu_analysis";
      AITaskType2["ImageUnderstanding"] = "image_understanding";
      AITaskType2["ComplexReasoning"] = "complex_reasoning";
    })(AITaskType || (AITaskType = {}));
  }
});

// ../core/dist/types/rendering.js
var RenderLayer;
var init_rendering = __esm({
  "../core/dist/types/rendering.js"() {
    "use strict";
    (function(RenderLayer2) {
      RenderLayer2["Grid"] = "grid";
      RenderLayer2["Plot"] = "plot";
      RenderLayer2["SiteZones"] = "site_zones";
      RenderLayer2["Floor"] = "floor";
      RenderLayer2["Rooms"] = "rooms";
      RenderLayer2["Walls"] = "walls";
      RenderLayer2["Openings"] = "openings";
      RenderLayer2["Stairs"] = "stairs";
      RenderLayer2["Columns"] = "columns";
      RenderLayer2["Furniture"] = "furniture";
      RenderLayer2["Annotations"] = "annotations";
      RenderLayer2["Selection"] = "selection";
      RenderLayer2["Guides"] = "guides";
    })(RenderLayer || (RenderLayer = {}));
  }
});

// ../core/dist/types/design-intelligence.js
var FunctionalZone, AdjacencyRelationType, HumanVerificationStatus;
var init_design_intelligence = __esm({
  "../core/dist/types/design-intelligence.js"() {
    "use strict";
    (function(FunctionalZone2) {
      FunctionalZone2["Public"] = "public";
      FunctionalZone2["SemiPublic"] = "semi_public";
      FunctionalZone2["Private"] = "private";
      FunctionalZone2["Service"] = "service";
      FunctionalZone2["Circulation"] = "circulation";
      FunctionalZone2["Outdoor"] = "outdoor";
    })(FunctionalZone || (FunctionalZone = {}));
    (function(AdjacencyRelationType2) {
      AdjacencyRelationType2["RequiredAdjacency"] = "required_adjacency";
      AdjacencyRelationType2["PreferredAdjacency"] = "preferred_adjacency";
      AdjacencyRelationType2["RequiredSeparation"] = "required_separation";
      AdjacencyRelationType2["PrivacyBoundary"] = "privacy_boundary";
      AdjacencyRelationType2["AccessRequired"] = "access_required";
    })(AdjacencyRelationType || (AdjacencyRelationType = {}));
    (function(HumanVerificationStatus2) {
      HumanVerificationStatus2["Unverified"] = "unverified";
      HumanVerificationStatus2["VerifiedArchitect"] = "verified_architect";
      HumanVerificationStatus2["VerifiedStructural"] = "verified_structural";
      HumanVerificationStatus2["ApprovedCanonical"] = "approved_canonical";
      HumanVerificationStatus2["Rejected"] = "rejected";
    })(HumanVerificationStatus || (HumanVerificationStatus = {}));
  }
});

// ../core/dist/types/index.js
var init_types = __esm({
  "../core/dist/types/index.js"() {
    "use strict";
    init_enums();
    init_rendering();
    init_design_intelligence();
  }
});

// ../core/dist/models/id.js
function generateId() {
  if (seed !== null) {
    counter++;
    const hex = (seed * 1e6 + counter).toString(16).padStart(12, "0");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4000-8000-${hex.padStart(12, "0").slice(0, 12)}`;
  }
  return crypto.randomUUID();
}
var seed, counter;
var init_id = __esm({
  "../core/dist/models/id.js"() {
    "use strict";
    seed = null;
    counter = 0;
  }
});

// ../core/dist/models/errors.js
var DomainError, InvalidDimensionError, InvalidCoordinateError;
var init_errors = __esm({
  "../core/dist/models/errors.js"() {
    "use strict";
    DomainError = class extends Error {
      code;
      constructor(message, code) {
        super(message);
        this.code = code;
        this.name = "DomainError";
      }
    };
    InvalidDimensionError = class extends DomainError {
      constructor(field, value) {
        super(`Invalid dimension for "${field}": ${value}. Must be > 0.`, "INVALID_DIMENSION");
        this.name = "InvalidDimensionError";
      }
    };
    InvalidCoordinateError = class extends DomainError {
      constructor(field, value) {
        super(`Invalid coordinate for "${field}": ${value}. Must be finite.`, "INVALID_COORDINATE");
        this.name = "InvalidCoordinateError";
      }
    };
  }
});

// ../core/dist/constants.js
var DEFAULTS, TOLERANCES, MINIMUM_ROOM_AREAS, MINIMUM_DIMENSIONS;
var init_constants = __esm({
  "../core/dist/constants.js"() {
    "use strict";
    DEFAULTS = {
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
    TOLERANCES = {
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
    MINIMUM_ROOM_AREAS = {
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
    MINIMUM_DIMENSIONS = {
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
  }
});

// ../core/dist/models/factory.js
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
function createWall(params) {
  assertFinite("startPoint.x", params.startPoint.x);
  assertFinite("startPoint.y", params.startPoint.y);
  assertFinite("endPoint.x", params.endPoint.x);
  assertFinite("endPoint.y", params.endPoint.y);
  const wallType = params.type ?? WallType.Internal;
  const defaultThickness = wallType === WallType.External ? DEFAULTS.WALL_THICKNESS_EXTERNAL : wallType === WallType.Partition ? DEFAULTS.WALL_THICKNESS_PARTITION : DEFAULTS.WALL_THICKNESS_INTERNAL;
  return {
    id: generateId(),
    floorId: params.floorId,
    startPoint: params.startPoint,
    endPoint: params.endPoint,
    thickness: params.thickness ?? defaultThickness,
    type: wallType,
    material: params.material,
    roomIds: params.roomIds ?? [],
    hasOpening: false,
    loadBearing: params.loadBearing ?? false
  };
}
function createStair(params) {
  assertFinite("x", params.x);
  assertFinite("y", params.y);
  assertPositive("width", params.width);
  assertPositive("length", params.length);
  const riserHeight = params.riserHeight ?? DEFAULTS.RISER_HEIGHT;
  const riserCount = params.riserCount ?? Math.round(DEFAULTS.FLOOR_HEIGHT / riserHeight);
  return {
    id: generateId(),
    floorId: params.floorId,
    type: params.type ?? StairType.Straight,
    boundary: rectToPolygon(params.x, params.y, params.width, params.length),
    x: params.x,
    y: params.y,
    width: params.width,
    length: params.length,
    direction: params.direction ?? Direction.North,
    riserCount,
    riserHeight,
    treadDepth: params.treadDepth ?? DEFAULTS.TREAD_DEPTH,
    landingWidth: params.width,
    connectsFloors: params.connectsFloors,
    verticalCoreId: params.verticalCoreId
  };
}
var init_factory = __esm({
  "../core/dist/models/factory.js"() {
    "use strict";
    init_types();
    init_constants();
    init_id();
    init_errors();
  }
});

// ../core/dist/models/updaters.js
var init_updaters = __esm({
  "../core/dist/models/updaters.js"() {
    "use strict";
    init_errors();
    init_factory();
  }
});

// ../core/dist/models/validation.js
var VALID_ROOM_TYPES;
var init_validation = __esm({
  "../core/dist/models/validation.js"() {
    "use strict";
    init_types();
    VALID_ROOM_TYPES = new Set(Object.values(RoomType));
  }
});

// ../core/dist/models/serialization.js
var init_serialization = __esm({
  "../core/dist/models/serialization.js"() {
    "use strict";
    init_validation();
    init_errors();
  }
});

// ../core/dist/models/versioning.js
var init_versioning = __esm({
  "../core/dist/models/versioning.js"() {
    "use strict";
    init_id();
    init_serialization();
  }
});

// ../core/dist/models/requirements-normalization.js
function asRecord(value) {
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
    case Direction.East:
      return 90;
    case Direction.South:
      return 180;
    case Direction.West:
      return 270;
    default:
      return 0;
  }
}
function normalizeDesignRequirementSpecification(input) {
  const source = asRecord(input);
  const rawHard = asRecord(source.hard);
  const rawSoft = asRecord(source.soft);
  const roadFacing = enumValue(rawHard.roadFacing, DIRECTIONS, Direction.North);
  const floorsCount = Math.max(1, nonNegativeInteger(rawHard.floorsCount, 1));
  const bedroomCount = nonNegativeInteger(rawHard.bedroomCount, 2);
  const bathroomCount = nonNegativeInteger(rawHard.bathroomCount, Math.min(2, Math.max(1, bedroomCount)));
  const explicitParkingRequired = booleanValue(rawHard.parkingRequired, false);
  const parkingSpacesCount = nonNegativeInteger(rawHard.parkingSpacesCount, explicitParkingRequired ? 1 : 0);
  const rawCustomRooms = Array.isArray(rawHard.customRooms) ? rawHard.customRooms : [];
  const customRooms = rawCustomRooms.flatMap((entry) => {
    const custom = asRecord(entry);
    if (typeof custom.type !== "string" || !ROOM_TYPES.has(custom.type))
      return [];
    const count = nonNegativeInteger(custom.count, 0);
    if (count === 0)
      return [];
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
    naturalLightPreference: enumValue(rawSoft.naturalLightPreference, PREFERENCE_LEVELS, PreferenceLevel.High),
    privacyPreference: enumValue(rawSoft.privacyPreference, PREFERENCE_LEVELS, PreferenceLevel.High),
    circulationEfficiency: enumValue(rawSoft.circulationEfficiency, PREFERENCE_LEVELS, PreferenceLevel.High),
    gardenPreference: booleanValue(rawSoft.gardenPreference, false),
    servantQuarter: booleanValue(rawSoft.servantQuarter, false),
    poojaRoom: booleanValue(rawSoft.poojaRoom, false),
    studyRoom: booleanValue(rawSoft.studyRoom, false),
    balconyPreferred: booleanValue(rawSoft.balconyPreferred, false),
    openKitchen: booleanValue(rawSoft.openKitchen, false),
    attachedBathroomsCount: nonNegativeInteger(rawSoft.attachedBathroomsCount, Math.min(1, bathroomCount))
  };
  const rawSetbacks = asRecord(source.setbacksMm);
  const hasSetbacks = ["front", "rear", "left", "right"].every((key) => typeof rawSetbacks[key] === "number" && Number.isFinite(rawSetbacks[key]));
  const rawSiteContext = asRecord(source.siteContext);
  const location = typeof rawSiteContext.location === "string" ? rawSiteContext.location.trim() : "";
  const jurisdiction = typeof rawSiteContext.jurisdiction === "string" ? rawSiteContext.jurisdiction.trim() : "";
  return {
    schemaVersion: 1,
    ...typeof source.projectId === "string" && source.projectId.trim().length > 0 ? { projectId: source.projectId.trim() } : {},
    projectName: stringValue(source.projectName, `${bedroomCount}BHK Plan (${Math.round(hard.plotWidthMm / 304.8)}\xD7${Math.round(hard.plotDepthMm / 304.8)} ft)`),
    ...typeof source.rawUserPrompt === "string" ? { rawUserPrompt: source.rawUserPrompt } : {},
    hard,
    soft,
    plotShape: enumValue(source.plotShape, PLOT_SHAPES, PlotShape.Rectangular),
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
var ROOM_TYPES, DIRECTIONS, PLOT_SHAPES, PREFERENCE_LEVELS;
var init_requirements_normalization = __esm({
  "../core/dist/models/requirements-normalization.js"() {
    "use strict";
    init_enums();
    ROOM_TYPES = new Set(Object.values(RoomType));
    DIRECTIONS = new Set(Object.values(Direction));
    PLOT_SHAPES = new Set(Object.values(PlotShape));
    PREFERENCE_LEVELS = new Set(Object.values(PreferenceLevel));
  }
});

// ../core/dist/capabilities.js
var BUILDING_CAPABILITIES, SUPPORTED_FLOOR_COUNTS;
var init_capabilities = __esm({
  "../core/dist/capabilities.js"() {
    "use strict";
    BUILDING_CAPABILITIES = Object.freeze({
      minimumFloorCount: 1,
      maximumFloorCount: 10
    });
    SUPPORTED_FLOOR_COUNTS = Object.freeze(Array.from({ length: BUILDING_CAPABILITIES.maximumFloorCount }, (_, index) => index + BUILDING_CAPABILITIES.minimumFloorCount));
  }
});

// ../core/dist/models/site-intelligence.js
var init_site_intelligence = __esm({
  "../core/dist/models/site-intelligence.js"() {
    "use strict";
    init_capabilities();
    init_types();
  }
});

// ../core/dist/models/space-catalog.js
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
var M2, R, C, E, residential, commercial, educational, SPACE_CATALOG, SPACE_PROGRAM_PRESETS;
var init_space_catalog = __esm({
  "../core/dist/models/space-catalog.js"() {
    "use strict";
    init_types();
    M2 = 1e6;
    R = ["residential", "mixed_use"];
    C = ["commercial", "mixed_use"];
    E = ["educational"];
    residential = [
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
    commercial = [
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
    educational = [
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
    SPACE_CATALOG = Object.freeze([...residential, ...commercial, ...educational]);
    SPACE_PROGRAM_PRESETS = Object.freeze([
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
  }
});

// ../core/dist/models/space-program.js
var CIRCULATION_RESERVE_RATIO, VERTICAL_CORE_RESERVE_RATIO, WALL_SERVICE_RESERVE_RATIO, TOTAL_RESERVE_RATIO, DERIVATION_MAP;
var init_space_program = __esm({
  "../core/dist/models/space-program.js"() {
    "use strict";
    init_types();
    init_site_intelligence();
    init_space_catalog();
    CIRCULATION_RESERVE_RATIO = 0.12;
    VERTICAL_CORE_RESERVE_RATIO = 0.04;
    WALL_SERVICE_RESERVE_RATIO = 0.06;
    TOTAL_RESERVE_RATIO = CIRCULATION_RESERVE_RATIO + VERTICAL_CORE_RESERVE_RATIO + WALL_SERVICE_RESERVE_RATIO;
    DERIVATION_MAP = {
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
  }
});

// ../core/dist/models/footprint.js
var CIRCULATION_RATIO, CORE_RATIO, WALL_SERVICE_RATIO, USABLE_RATIO, FOOTPRINT_SHAPES;
var init_footprint = __esm({
  "../core/dist/models/footprint.js"() {
    "use strict";
    init_factory();
    init_site_intelligence();
    CIRCULATION_RATIO = 0.12;
    CORE_RATIO = 0.04;
    WALL_SERVICE_RATIO = 0.06;
    USABLE_RATIO = 1 - CIRCULATION_RATIO - CORE_RATIO - WALL_SERVICE_RATIO;
    FOOTPRINT_SHAPES = Object.freeze([
      { id: "rectangle", name: "Rectangle", description: "Efficient universal floor plate", recommendedCategories: ["residential", "commercial", "mixed_use"] },
      { id: "l_shape", name: "L Shape", description: "Two wings around an open edge", recommendedCategories: ["residential", "commercial", "educational", "mixed_use"] },
      { id: "u_shape", name: "U Shape", description: "Three-sided court or arrival space", recommendedCategories: ["educational", "commercial"] },
      { id: "t_shape", name: "T Shape", description: "Primary bar with a central wing", recommendedCategories: ["educational", "commercial"] },
      { id: "courtyard", name: "Courtyard", description: "Limited perimeter plate with an access slot; not polygon-hole topology", recommendedCategories: ["residential", "commercial", "educational"], customSupport: "limited" },
      { id: "linear", name: "Linear", description: "Shallow elongated building plate", recommendedCategories: ["commercial", "educational"] },
      { id: "custom", name: "Custom", description: "Preserved existing or imported polygon", recommendedCategories: [], customSupport: "limited" }
    ]);
  }
});

// ../core/dist/models/generation-control.js
var init_generation_control = __esm({
  "../core/dist/models/generation-control.js"() {
    "use strict";
  }
});

// ../core/dist/models/index.js
var init_models = __esm({
  "../core/dist/models/index.js"() {
    "use strict";
    init_id();
    init_errors();
    init_factory();
    init_updaters();
    init_serialization();
    init_validation();
    init_versioning();
    init_requirements_normalization();
    init_site_intelligence();
    init_space_catalog();
    init_space_program();
    init_footprint();
    init_generation_control();
  }
});

// ../core/dist/editor/types.js
var init_types2 = __esm({
  "../core/dist/editor/types.js"() {
    "use strict";
  }
});

// ../core/dist/editor/history.js
var init_history = __esm({
  "../core/dist/editor/history.js"() {
    "use strict";
  }
});

// ../core/dist/editor/commands/selection-commands.js
var init_selection_commands = __esm({
  "../core/dist/editor/commands/selection-commands.js"() {
    "use strict";
    init_id();
  }
});

// ../core/dist/editor/commands/room-commands.js
var init_room_commands = __esm({
  "../core/dist/editor/commands/room-commands.js"() {
    "use strict";
    init_id();
    init_updaters();
  }
});

// ../core/dist/editor/commands/door-commands.js
var init_door_commands = __esm({
  "../core/dist/editor/commands/door-commands.js"() {
    "use strict";
    init_id();
    init_updaters();
  }
});

// ../core/dist/editor/commands/window-commands.js
var init_window_commands = __esm({
  "../core/dist/editor/commands/window-commands.js"() {
    "use strict";
    init_id();
    init_updaters();
  }
});

// ../core/dist/editor/commands/delete-commands.js
var init_delete_commands = __esm({
  "../core/dist/editor/commands/delete-commands.js"() {
    "use strict";
    init_id();
    init_updaters();
  }
});

// ../core/dist/editor/commands/batch-command.js
var init_batch_command = __esm({
  "../core/dist/editor/commands/batch-command.js"() {
    "use strict";
    init_id();
  }
});

// ../core/dist/editor/commands/replace-building-command.js
var init_replace_building_command = __esm({
  "../core/dist/editor/commands/replace-building-command.js"() {
    "use strict";
    init_id();
  }
});

// ../core/dist/editor/commands/update-site-command.js
var init_update_site_command = __esm({
  "../core/dist/editor/commands/update-site-command.js"() {
    "use strict";
    init_factory();
    init_id();
  }
});

// ../core/dist/editor/commands/floor-commands.js
var init_floor_commands = __esm({
  "../core/dist/editor/commands/floor-commands.js"() {
    "use strict";
    init_id();
    init_updaters();
  }
});

// ../core/dist/editor/commands/index.js
var init_commands = __esm({
  "../core/dist/editor/commands/index.js"() {
    "use strict";
    init_selection_commands();
    init_room_commands();
    init_door_commands();
    init_window_commands();
    init_delete_commands();
    init_batch_command();
    init_replace_building_command();
    init_update_site_command();
    init_floor_commands();
  }
});

// ../core/dist/editor/engine.js
var init_engine = __esm({
  "../core/dist/editor/engine.js"() {
    "use strict";
    init_types2();
    init_history();
    init_floor_commands();
  }
});

// ../core/dist/editor/index.js
var init_editor = __esm({
  "../core/dist/editor/index.js"() {
    "use strict";
    init_types2();
    init_history();
    init_commands();
    init_engine();
  }
});

// ../core/dist/architectural-review.js
var init_architectural_review = __esm({
  "../core/dist/architectural-review.js"() {
    "use strict";
  }
});

// ../core/dist/types/building-budget.js
var init_building_budget = __esm({
  "../core/dist/types/building-budget.js"() {
    "use strict";
  }
});

// ../core/dist/models/building-budget.js
var init_building_budget2 = __esm({
  "../core/dist/models/building-budget.js"() {
    "use strict";
    init_space_program();
    init_site_intelligence();
  }
});

// ../core/dist/models/reviewed-generation.js
var init_reviewed_generation = __esm({
  "../core/dist/models/reviewed-generation.js"() {
    "use strict";
    init_building_budget2();
    init_space_program();
    init_space_catalog();
  }
});

// ../core/dist/index.js
var init_dist = __esm({
  "../core/dist/index.js"() {
    "use strict";
    init_types();
    init_models();
    init_editor();
    init_constants();
    init_capabilities();
    init_architectural_review();
    init_building_budget();
    init_building_budget2();
    init_reviewed_generation();
  }
});

// ../ai-orchestration/dist/requirements/schema.js
var REQUIREMENT_RESPONSE_SCHEMA, REQUIREMENT_EXTRACTION_PROMPT;
var init_schema = __esm({
  "../ai-orchestration/dist/requirements/schema.js"() {
    "use strict";
    init_dist();
    REQUIREMENT_RESPONSE_SCHEMA = {
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
    REQUIREMENT_EXTRACTION_PROMPT = `You extract residential building requirements.
Return only the supplied schema. Convert all plot dimensions to millimetres.
Treat stated necessities as hard requirements and lifestyle choices as soft preferences.
Respect explicit negations such as "no parking" or "without Vastu".
Use orientation degrees 0=north, 90=east, 180=south, and 270=west.
Use an empty customRooms array when no additional supported room is requested.
Never invent a site location, regulation, approval, or structural claim.`;
  }
});

// ../ai-orchestration/dist/providers/http.js
function asRecord2(value) {
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
      if (escaped)
        escaped = false;
      else if (ch === "\\")
        escaped = true;
      else if (ch === '"')
        inString = false;
    } else {
      if (ch === '"')
        inString = true;
      else if (ch === "{")
        stack.push("{");
      else if (ch === "[")
        stack.push("[");
      else if (ch === "}") {
        if (stack.length > 0 && stack[stack.length - 1] === "{")
          stack.pop();
      } else if (ch === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === "[")
          stack.pop();
      }
    }
  }
  if (inString)
    trimmed += '"';
  trimmed = trimmed.replace(/,\s*$/, "");
  while (stack.length > 0) {
    const top = stack.pop();
    if (top === "{")
      trimmed += "}";
    else if (top === "[")
      trimmed += "]";
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
async function postJson(options, headers, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  const startedAt = Date.now();
  try {
    const response2 = await options.fetchImplementation(options.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    if (!response2.ok) {
      let detail = "";
      try {
        const errText = await response2.text();
        detail = errText.slice(0, 500);
      } catch {
      }
      let retryAfterMs;
      const retryHeader = response2.headers.get("retry-after");
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
      throw new HttpProviderError(response2.status, `Provider request failed with HTTP ${response2.status}.${detail ? " " + detail : ""}`.trim(), detail, retryAfterMs);
    }
    const parsed = await response2.json();
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new AISafetyError("Provider returned a non-object response envelope.");
    }
    return { body: parsed, latencyMs: Date.now() - startedAt };
  } catch (error) {
    if (error instanceof AISafetyError || error instanceof HttpProviderError)
      throw error;
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("Provider request timed out.");
    throw error instanceof Error ? error : new Error("Provider request failed.");
  } finally {
    clearTimeout(timeout);
  }
}
function response(content, parsed, responseUsage, model, latencyMs) {
  return { content, ...parsed ? { parsed } : {}, usage: responseUsage, model, latencyMs };
}
var HttpProviderError;
var init_http = __esm({
  "../ai-orchestration/dist/providers/http.js"() {
    "use strict";
    init_base();
    HttpProviderError = class extends Error {
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
  }
});

// ../ai-orchestration/dist/providers/openai.js
var init_openai = __esm({
  "../ai-orchestration/dist/providers/openai.js"() {
    "use strict";
    init_dist();
    init_base();
    init_schema();
    init_http();
  }
});

// ../ai-orchestration/dist/providers/gemini.js
function extractHttpStatus(error) {
  if (error instanceof HttpProviderError)
    return error.status;
  if (error instanceof Error) {
    const match = error.message.match(/HTTP (\d{3})/i);
    if (match && match[1]) {
      const code = parseInt(match[1], 10);
      if (!isNaN(code))
        return code;
    }
  }
  return null;
}
function isTransientHttpError(status) {
  if (status === null)
    return false;
  return status === 503 || status === 429 || status === 408 || status >= 500 && status < 600;
}
function isAuthHttpError(status) {
  if (status === null)
    return false;
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
function cleanGeminiSchema(schema) {
  if (schema === null || typeof schema !== "object")
    return schema;
  if (Array.isArray(schema))
    return schema.map(cleanGeminiSchema);
  const out = {};
  const record3 = schema;
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
  for (const [k, v] of Object.entries(record3)) {
    if (unsupportedKeys.has(k))
      continue;
    if (k === "enum" && Array.isArray(v)) {
      if (record3.type === "integer" || record3.type === "number") {
        continue;
      }
      out[k] = v.map((item) => String(item));
      continue;
    }
    out[k] = cleanGeminiSchema(v);
  }
  return out;
}
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
var DEFAULT_GEMINI_RETRY_POLICY, GeminiProvider, GEMINI_SUPPORTED_IMAGE_MIME_TYPES;
var init_gemini = __esm({
  "../ai-orchestration/dist/providers/gemini.js"() {
    "use strict";
    init_dist();
    init_base();
    init_schema();
    init_http();
    DEFAULT_GEMINI_RETRY_POLICY = {
      maxRetries: 3,
      initialDelayMs: 1e3,
      maxDelayMs: 8e3,
      backoffFactor: 2,
      jitterRatio: 0.2
      // +/- 20% random jitter
    };
    GeminiProvider = class extends BaseAIProvider {
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
        if (!this.options.apiKey.trim())
          throw new Error("Gemini API key is not configured.");
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
              console.warn(`[GeminiProvider] Transient error on model "${currentModel}" (attempt ${attempt}/${this.retryPolicy.maxRetries}). Retrying in ${delayMs}ms with exponential backoff & jitter...`);
              await this.sleepFn(delayMs);
              nextDelayMs = void 0;
            }
            try {
              const endpoint = `${this.endpointBase}/${encodeURIComponent(currentModel)}:generateContent`;
              const result = await postJson({
                apiKey: this.options.apiKey,
                model: currentModel,
                endpoint,
                timeoutMs: this.options.timeoutMs,
                fetchImplementation: this.options.fetchImplementation
              }, { "x-goog-api-key": this.options.apiKey }, payload);
              const content = this.extractOutputText(result.body);
              const parsed = wantsJson ? parseJsonContent(content) : void 0;
              const rawUsage = asRecord2(result.body.usageMetadata);
              return response(content, parsed, usage(rawUsage.promptTokenCount, rawUsage.candidatesTokenCount, rawUsage.totalTokenCount), currentModel, result.latencyMs);
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
              console.warn(`[GeminiProvider] Retries exhausted for model "${currentModel}" on transient error (status ${status ?? "parse/safety"}).`);
              break;
            }
          }
          if (fallbackModel && !isFallback) {
            console.warn(`[GeminiProvider] Primary model "${primaryModel}" temporarily unavailable (503/transient). Falling back to "${fallbackModel}"...`);
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
          const parts = asRecord2(asRecord2(candidate).content).parts;
          const arr = Array.isArray(parts) ? parts : [];
          const answerParts = arr.map((p) => asRecord2(p)).filter((p) => !p.thought && typeof p.text === "string" && p.text.trim());
          if (answerParts.length > 0) {
            return answerParts.map((p) => p.text).join("\n");
          }
          for (const part of arr) {
            const text = asRecord2(part).text;
            if (typeof text === "string" && text.trim())
              return text;
          }
        }
        throw new AISafetyError("Gemini response contained no output text.");
      }
    };
    GEMINI_SUPPORTED_IMAGE_MIME_TYPES = /* @__PURE__ */ new Set([
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/heic",
      "image/heif"
    ]);
  }
});

// ../ai-orchestration/dist/providers/rule-based.js
var RuleBasedRequirementParser;
var init_rule_based = __esm({
  "../ai-orchestration/dist/providers/rule-based.js"() {
    "use strict";
    init_dist();
    RuleBasedRequirementParser = class {
      /**
       * Parse a natural language prompt into a structured DesignRequirementSpecification.
       */
      parse(text) {
        const lower = text.toLowerCase();
        let widthMm = 9144;
        let depthMm = 15240;
        const dimMatch = lower.match(/(\d+(?:\.\d+)?)\s*(ft|feet|m|meter|meters|mm)?\s*(?:x|\*|by|×)\s*(\d+(?:\.\d+)?)\s*(ft|feet|m|meter|meters|mm)?/);
        if (dimMatch) {
          const val1 = parseFloat(dimMatch[1]);
          const unit1 = dimMatch[2];
          const val2 = parseFloat(dimMatch[3]);
          const unit2 = dimMatch[4];
          const unit = (unit1 || unit2 || "ft").toLowerCase();
          if (unit.startsWith("m") && !unit.startsWith("mm")) {
            widthMm = Math.round(val1 * 1e3);
            depthMm = Math.round(val2 * 1e3);
          } else if (unit === "mm") {
            widthMm = Math.round(val1);
            depthMm = Math.round(val2);
          } else {
            widthMm = Math.round(val1 * 304.8);
            depthMm = Math.round(val2 * 304.8);
          }
        }
        let bedroomCount = 2;
        const bhkMatch = lower.match(/(\d+)\s*(?:bhk|bed|bedroom|bedrooms)/);
        if (bhkMatch) {
          bedroomCount = Math.max(0, parseInt(bhkMatch[1], 10));
        } else if (lower.includes("1bhk") || lower.includes("1-bhk")) {
          bedroomCount = 1;
        } else if (lower.includes("2bhk") || lower.includes("2-bhk")) {
          bedroomCount = 2;
        } else if (lower.includes("3bhk") || lower.includes("3-bhk")) {
          bedroomCount = 3;
        } else if (lower.includes("4bhk") || lower.includes("4-bhk")) {
          bedroomCount = 4;
        }
        let bathroomCount = Math.max(1, Math.min(bedroomCount, 2));
        const bathMatch = lower.match(/(\d+)\s*(?:bath|bathroom|bathrooms|toilet|toilets)/);
        if (bathMatch) {
          bathroomCount = Math.max(0, parseInt(bathMatch[1], 10));
        }
        let roadFacing = Direction.North;
        let orientationDegrees = 0;
        if (lower.includes("east road") || lower.includes("facing east") || lower.includes("east facing") || lower.includes("road on east")) {
          roadFacing = Direction.East;
          orientationDegrees = 90;
        } else if (lower.includes("south road") || lower.includes("facing south") || lower.includes("south facing") || lower.includes("road on south")) {
          roadFacing = Direction.South;
          orientationDegrees = 180;
        } else if (lower.includes("west road") || lower.includes("facing west") || lower.includes("west facing") || lower.includes("road on west")) {
          roadFacing = Direction.West;
          orientationDegrees = 270;
        } else {
          roadFacing = Direction.North;
          orientationDegrees = 0;
        }
        let floorsCount = 1;
        const gPlusMatch = lower.match(/\bg\s*\+\s*(\d+)\b/i);
        const numericFloorsMatch = lower.match(/\b(\d+)\s*(?:floors?|storeys?|stories?)\b/i);
        if (gPlusMatch) {
          floorsCount = Math.min(BUILDING_CAPABILITIES.maximumFloorCount, Math.max(1, parseInt(gPlusMatch[1], 10) + 1));
        } else if (numericFloorsMatch) {
          floorsCount = Math.min(BUILDING_CAPABILITIES.maximumFloorCount, Math.max(1, parseInt(numericFloorsMatch[1], 10)));
        } else if (lower.includes("duplex") || lower.includes("two floors")) {
          floorsCount = 2;
        } else if (lower.includes("three floors")) {
          floorsCount = 3;
        }
        const parkingNegated = /\b(?:no|without)\s+(?:car\s+)?parking\b/.test(lower);
        const parkingRequired = !parkingNegated && (lower.includes("parking") || lower.includes("garage"));
        const parkingCountMatch = lower.match(/(\d+)\s*(?:car|cars|vehicle|vehicles)(?:\s+parking)?/);
        const parkingSpacesCount = parkingRequired ? Math.max(1, parkingCountMatch ? parseInt(parkingCountMatch[1], 10) : 1) : 0;
        const staircaseRequired = floorsCount > 1 || lower.includes("stair") || lower.includes("staircase");
        const liftRequired = /\b(?:lift|elevator)\b/.test(lower) && !/\b(?:no|without)\s+(?:lift|elevator)\b/.test(lower);
        const poojaRoom = /\b(?:pooja|puja|prayer|temple)\b/.test(lower) && !/\b(?:no|without)\s+(?:pooja|puja|prayer|temple)\b/.test(lower);
        const studyRoom = /\b(?:study|office|workspace|home office)\b/.test(lower) && !/\b(?:no|without)\s+(?:study|office|workspace|home office)\b/.test(lower);
        const gardenPreference = /\b(?:garden|lawn|courtyard)\b/.test(lower) && !/\b(?:no|without)\s+(?:garden|lawn|courtyard)\b/.test(lower);
        const vastuCompliance = /\b(?:vastu|vaastu)\b/.test(lower) && !/\b(?:no|without)\s+(?:vastu|vaastu)\b/.test(lower);
        const openKitchen = /\b(?:open kitchen|american kitchen)\b/.test(lower) && !/\b(?:no|without|closed)\s+(?:open\s+)?kitchen\b/.test(lower);
        const servantQuarter = /\b(?:servant|maid)\b/.test(lower) && !/\b(?:no|without)\s+(?:servant|maid)\b/.test(lower);
        const balconyPreferred = /\b(?:balcony|balconies)\b/.test(lower) && !/\b(?:no|without)\s+(?:balcony|balconies)\b/.test(lower);
        const attachedBathMatch = lower.match(/(\d+)\s*attached\s*(?:bath|bathroom|bathrooms|toilet|toilets)/);
        const attachedBathroomsCount = attachedBathMatch ? Math.max(0, parseInt(attachedBathMatch[1], 10)) : Math.min(1, bathroomCount);
        return normalizeDesignRequirementSpecification({
          schemaVersion: 1,
          projectName: `${bedroomCount}BHK Plan (${Math.round(widthMm / 304.8)}\xD7${Math.round(depthMm / 304.8)} ft)`,
          rawUserPrompt: text,
          plotShape: PlotShape.Rectangular,
          orientationDegrees,
          hard: {
            plotWidthMm: widthMm,
            plotDepthMm: depthMm,
            roadFacing,
            floorsCount,
            bedroomCount,
            bathroomCount,
            kitchenRequired: true,
            livingRoomRequired: true,
            diningRoomRequired: true,
            staircaseRequired,
            parkingRequired,
            parkingSpacesCount,
            liftRequired
          },
          soft: {
            vastuCompliance,
            naturalLightPreference: PreferenceLevel.High,
            privacyPreference: PreferenceLevel.High,
            circulationEfficiency: PreferenceLevel.High,
            gardenPreference,
            servantQuarter,
            poojaRoom,
            studyRoom,
            balconyPreferred,
            openKitchen,
            attachedBathroomsCount
          }
        });
      }
    };
  }
});

// ../ai-orchestration/dist/requirements/validation.js
function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function finiteInRange(value, min, max, integer = false) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value));
}
function hasFields(source, fields, type) {
  return fields.every((field) => typeof source[field] === type);
}
function validateRequirementPayload(payload, rawPrompt) {
  const errors = [];
  const source = record(payload);
  const hard = source ? record(source.hard) : null;
  const soft = source ? record(source.soft) : null;
  if (!source || !hard || !soft) {
    return { valid: false, errors: ["Provider response must contain hard and soft requirement objects."] };
  }
  if (source.schemaVersion !== 1)
    errors.push("schemaVersion must be 1.");
  if (typeof source.projectName !== "string" || source.projectName.trim().length === 0)
    errors.push("projectName is required.");
  if (!Object.values(PlotShape).includes(source.plotShape))
    errors.push("plotShape is invalid.");
  if (!finiteInRange(source.orientationDegrees, 0, 359))
    errors.push("orientationDegrees must be between 0 and 359.");
  if (!finiteInRange(hard.plotWidthMm, 3e3, 2e5))
    errors.push("plotWidthMm is outside the supported range.");
  if (!finiteInRange(hard.plotDepthMm, 3e3, 2e5))
    errors.push("plotDepthMm is outside the supported range.");
  if (!Object.values(Direction).includes(hard.roadFacing))
    errors.push("roadFacing is invalid.");
  if (!finiteInRange(hard.floorsCount, BUILDING_CAPABILITIES.minimumFloorCount, BUILDING_CAPABILITIES.maximumFloorCount, true)) {
    errors.push(`floorsCount must be an integer from ${BUILDING_CAPABILITIES.minimumFloorCount} to ${BUILDING_CAPABILITIES.maximumFloorCount}.`);
  }
  if (!finiteInRange(hard.bedroomCount, 1, 20, true))
    errors.push("bedroomCount must be an integer from 1 to 20.");
  if (!finiteInRange(hard.bathroomCount, 1, 20, true))
    errors.push("bathroomCount must be an integer from 1 to 20.");
  if (!finiteInRange(hard.parkingSpacesCount, 0, 20, true))
    errors.push("parkingSpacesCount must be an integer from 0 to 20.");
  if (!hasFields(hard, [
    "kitchenRequired",
    "livingRoomRequired",
    "diningRoomRequired",
    "staircaseRequired",
    "parkingRequired",
    "liftRequired"
  ], "boolean"))
    errors.push("All hard requirement flags must be booleans.");
  if (typeof hard.parkingRequired === "boolean" && typeof hard.parkingSpacesCount === "number" && hard.parkingRequired !== hard.parkingSpacesCount > 0) {
    errors.push("parkingRequired must agree with parkingSpacesCount.");
  }
  if (typeof hard.floorsCount === "number" && hard.floorsCount > 1 && hard.staircaseRequired !== true) {
    errors.push("Multi-floor requirements must include a staircase.");
  }
  if (hard.customRooms !== void 0) {
    if (!Array.isArray(hard.customRooms)) {
      errors.push("customRooms must be an array.");
    } else {
      for (const entry of hard.customRooms) {
        const custom = record(entry);
        if (!custom || !Object.values(RoomType).includes(custom.type) || !finiteInRange(custom.count, 1, 20, true) || typeof custom.name !== "string") {
          errors.push("Each custom room must have a supported type, count, and name.");
          break;
        }
      }
    }
  }
  if (!hasFields(soft, [
    "vastuCompliance",
    "gardenPreference",
    "servantQuarter",
    "poojaRoom",
    "studyRoom",
    "balconyPreferred",
    "openKitchen"
  ], "boolean"))
    errors.push("All soft preference flags must be booleans.");
  for (const field of ["naturalLightPreference", "privacyPreference", "circulationEfficiency"]) {
    if (!Object.values(PreferenceLevel).includes(soft[field]))
      errors.push(`${field} is invalid.`);
  }
  if (!finiteInRange(soft.attachedBathroomsCount, 0, 20, true))
    errors.push("attachedBathroomsCount must be an integer from 0 to 20.");
  if (typeof soft.attachedBathroomsCount === "number" && typeof hard.bathroomCount === "number" && soft.attachedBathroomsCount > hard.bathroomCount) {
    errors.push("attachedBathroomsCount cannot exceed bathroomCount.");
  }
  if (errors.length > 0)
    return { valid: false, errors };
  return {
    valid: true,
    requirements: normalizeDesignRequirementSpecification({
      ...source,
      rawUserPrompt: rawPrompt
    }),
    errors: []
  };
}
var init_validation2 = __esm({
  "../ai-orchestration/dist/requirements/validation.js"() {
    "use strict";
    init_dist();
  }
});

// ../ai-orchestration/dist/editing/context.js
function extractAIEditContext(building, activeFloorId, selectedRoomId) {
  const resolvedFloorId = activeFloorId && building.floors.some((floor) => floor.id === activeFloorId) ? activeFloorId : building.floors[0]?.id ?? "";
  const rooms = building.floors.flatMap((floor) => floor.rooms.map((room) => ({
    id: room.id,
    floorId: floor.id,
    floorLevel: floor.level,
    name: room.name,
    type: room.type,
    x: Math.round(room.x),
    y: Math.round(room.y),
    width: Math.round(room.width),
    height: Math.round(room.height),
    isFixed: room.isFixed,
    selected: room.id === selectedRoomId
  })));
  const compact = rooms.map((room) => `${room.id}|L${room.floorLevel}|${room.name}|${room.type}|${room.x},${room.y}|${room.width}x${room.height}${room.selected ? "|selected" : ""}${room.isFixed ? "|fixed" : ""}`).join("\n");
  return {
    buildingId: building.id,
    buildingVersion: building.version,
    plotWidthMm: building.site.plotWidth,
    plotDepthMm: building.site.plotDepth,
    activeFloorId: resolvedFloorId,
    selectedRoomId: selectedRoomId ?? null,
    rooms,
    promptSummary: `Building ${building.id} v${building.version}; plot ${building.site.plotWidth}x${building.site.plotDepth} mm; active floor ${resolvedFloorId}.
Rooms:
${compact}`
  };
}
var init_context = __esm({
  "../ai-orchestration/dist/editing/context.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/editing/target-resolver.js
function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function sortedRooms(building, activeFloorId) {
  return building.floors.flatMap((floor) => floor.rooms.map((room) => ({ room, floor }))).sort((a, b) => {
    const activeDelta = Number(b.floor.id === activeFloorId) - Number(a.floor.id === activeFloorId);
    return activeDelta || a.floor.level - b.floor.level || a.room.name.localeCompare(b.room.name) || a.room.id.localeCompare(b.room.id);
  }).map((entry) => entry.room);
}
function ordinalFrom(query) {
  const wordMap = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
  for (const [word, value] of Object.entries(wordMap))
    if (new RegExp(`\\b${word}\\b`).test(query))
      return value;
  const match = query.match(/\b(\d+)(?:st|nd|rd|th)?\b/);
  return match ? Math.max(1, Number(match[1])) : null;
}
function resolveRoomTarget(building, query, activeFloorId, selectedRoomId) {
  const rooms = sortedRooms(building, activeFloorId);
  const normalizedQuery = normalize(query);
  if (/\b(selected|this room|current room)\b/.test(normalizedQuery)) {
    const selected = rooms.find((room) => room.id === selectedRoomId) ?? null;
    return selected ? { room: selected, matches: [selected] } : { room: null, matches: [], message: "Select a room before using a selected-room instruction." };
  }
  const exactId = rooms.find((room) => room.id === query);
  if (exactId)
    return { room: exactId, matches: [exactId] };
  const exactName = rooms.filter((room) => normalize(room.name) === normalizedQuery);
  if (exactName.length === 1)
    return { room: exactName[0], matches: exactName };
  const mentionedNames = rooms.filter((room) => normalizedQuery.includes(normalize(room.name)));
  if (mentionedNames.length === 1)
    return { room: mentionedNames[0], matches: mentionedNames };
  let resolvedType = null;
  for (const [type, aliases] of TYPE_ALIASES) {
    if (aliases.some((alias) => normalizedQuery.includes(alias))) {
      resolvedType = type;
      break;
    }
  }
  if (!resolvedType)
    return { room: null, matches: [], message: `No room matches \u201C${query}\u201D.` };
  let matches = rooms.filter((room) => room.type === resolvedType);
  if (normalizedQuery.includes("master")) {
    matches = matches.filter((room) => normalize(room.name).includes("master") || room.tags.some((tag) => normalize(tag).includes("master")));
  }
  const ordinal = ordinalFrom(normalizedQuery);
  if (ordinal !== null && matches[ordinal - 1])
    return { room: matches[ordinal - 1], matches };
  if (matches.length === 1)
    return { room: matches[0], matches };
  if (matches.length > 1) {
    return {
      room: null,
      matches,
      message: `\u201C${query}\u201D matches ${matches.length} rooms (${matches.map((room) => room.name).join(", ")}). Select one or use its exact name.`
    };
  }
  return { room: null, matches: [], message: `No room matches \u201C${query}\u201D.` };
}
var TYPE_ALIASES;
var init_target_resolver = __esm({
  "../ai-orchestration/dist/editing/target-resolver.js"() {
    "use strict";
    init_dist();
    TYPE_ALIASES = [
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
  }
});

// ../ai-orchestration/dist/editing/parser.js
function unitToMm(value, unit) {
  if (unit?.startsWith("m") && unit !== "mm")
    return Math.round(value * 1e3);
  if (unit === "ft" || unit === "feet" || unit === "foot")
    return Math.round(value * 304.8);
  return Math.round(value);
}
function targetQueryFrom(command, building, options) {
  const lower = command.toLowerCase();
  if (/\b(selected|this room|current room)\b/.test(lower))
    return "selected room";
  const roomsByName = building.floors.flatMap((floor) => floor.rooms).sort((a, b) => b.name.length - a.name.length);
  const named = roomsByName.find((room) => lower.includes(room.name.toLowerCase()));
  if (named)
    return named.name;
  const aliases = [
    "master bedroom",
    "guest bedroom",
    "living room",
    "family living",
    "family lounge",
    "servant quarter",
    "pooja room",
    "prayer room",
    "study room",
    "utility room",
    "bathroom",
    "bedroom",
    "kitchen",
    "dining",
    "study",
    "office",
    "balcony",
    "parking",
    "garage",
    "corridor",
    "foyer"
  ];
  const alias = aliases.find((value) => lower.includes(value));
  if (alias) {
    const ordinal = lower.match(/\b(first|second|third|fourth|fifth|sixth|\d+(?:st|nd|rd|th)?)\s+(?:master\s+|guest\s+)?(?:bedroom|bathroom)\b/);
    return ordinal ? ordinal[0] : alias;
  }
  return options.selectedRoomId ? "selected room" : null;
}
var RuleBasedEditParser;
var init_parser = __esm({
  "../ai-orchestration/dist/editing/parser.js"() {
    "use strict";
    init_target_resolver();
    RuleBasedEditParser = class {
      parse(command, building, options = {}) {
        const text = command.trim();
        const lower = text.toLowerCase();
        if (!text)
          return { intent: null, message: "Enter an edit instruction." };
        const targetQuery = targetQueryFrom(text, building, options);
        if (!targetQuery)
          return { intent: null, message: "Name or select the room to edit." };
        const target = resolveRoomTarget(building, targetQuery, options.activeFloorId, options.selectedRoomId);
        const resolvedQuery = target.room?.id ?? targetQuery;
        const rename = text.match(/^rename\s+.+?\s+to\s+["']?(.+?)["']?$/i);
        if (rename) {
          const newName = rename[1]?.trim().slice(0, 80);
          return newName ? { intent: { action: "rename_room", targetQuery: resolvedQuery, newName, reasoning: `Rename ${targetQuery} to ${newName}.` } } : { intent: null, message: "Provide a non-empty room name." };
        }
        if (/\b(move|shift|place|relocate)\b/.test(lower)) {
          const direction = /\b(north|up)\b/.test(lower) ? "north" : /\b(south|down)\b/.test(lower) ? "south" : /\b(east|right)\b/.test(lower) ? "east" : /\b(west|left)\b/.test(lower) ? "west" : "auto";
          const distance2 = lower.match(/(?:by\s+)?(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)\b/);
          const distanceMm = distance2 ? unitToMm(Number(distance2[1]), distance2[2]) : 500;
          return {
            intent: {
              action: "move_room",
              targetQuery: resolvedQuery,
              direction,
              distanceMm,
              reasoning: direction === "auto" ? `Find a nearby valid position for ${targetQuery}.` : `Move ${targetQuery} ${direction} by ${distanceMm} mm.`
            }
          };
        }
        if (/\b(resize|larger|bigger|increase|expand|smaller|decrease|shrink|reduce|wide|wider)\b/.test(lower)) {
          const dimensions = lower.match(/(?:to|at)?\s*(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)?\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)?/);
          if (dimensions) {
            const unit = dimensions[2] ?? dimensions[4] ?? "mm";
            return {
              intent: {
                action: "resize_room",
                targetQuery: resolvedQuery,
                widthMm: unitToMm(Number(dimensions[1]), unit),
                heightMm: unitToMm(Number(dimensions[3]), unit),
                reasoning: `Resize ${targetQuery} to the requested dimensions.`
              }
            };
          }
          const percent = lower.match(/(\d+(?:\.\d+)?)\s*%/);
          const shrink = /\b(smaller|decrease|shrink|reduce)\b/.test(lower);
          const delta = lower.match(/(?:by\s+)(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)\b/);
          if (delta) {
            const amount = unitToMm(Number(delta[1]), delta[2]);
            return {
              intent: {
                action: "resize_room",
                targetQuery: resolvedQuery,
                dimensionDeltaMm: shrink ? -amount : amount,
                reasoning: `${shrink ? "Reduce" : "Increase"} ${targetQuery} dimensions by ${amount} mm.`
              }
            };
          }
          const scalePercent = (shrink ? -1 : 1) * (percent ? Number(percent[1]) : 10);
          return {
            intent: {
              action: "resize_room",
              targetQuery: resolvedQuery,
              scalePercent,
              reasoning: `${shrink ? "Reduce" : "Increase"} ${targetQuery} area by approximately ${Math.abs(scalePercent)}%.`
            }
          };
        }
        return { intent: null, message: "Supported edits are moving, resizing, or renaming a room." };
      }
    };
  }
});

// ../ai-orchestration/dist/editing/schema.js
var AI_EDIT_RESPONSE_SCHEMA, AI_EDIT_SYSTEM_PROMPT;
var init_schema2 = __esm({
  "../ai-orchestration/dist/editing/schema.js"() {
    "use strict";
    AI_EDIT_RESPONSE_SCHEMA = {
      type: "object",
      additionalProperties: false,
      properties: {
        action: { type: "string", enum: ["resize_room", "move_room", "rename_room"] },
        targetQuery: { type: "string" },
        direction: { type: "string", enum: ["north", "south", "east", "west", "auto"] },
        distanceMm: { type: "number", minimum: 0, maximum: 5e4 },
        widthMm: { type: "number", minimum: 0, maximum: 1e5 },
        heightMm: { type: "number", minimum: 0, maximum: 1e5 },
        scalePercent: { type: "number", minimum: -80, maximum: 200 },
        dimensionDeltaMm: { type: "number", minimum: -1e4, maximum: 1e4 },
        newName: { type: "string" },
        reasoning: { type: "string" }
      },
      required: [
        "action",
        "targetQuery",
        "direction",
        "distanceMm",
        "widthMm",
        "heightMm",
        "scalePercent",
        "dimensionDeltaMm",
        "newName",
        "reasoning"
      ]
    };
    AI_EDIT_SYSTEM_PROMPT = `Convert one floor-plan editing instruction into one safe structured intent.
Use room names or room types from the supplied model context as targetQuery.
Supported actions are resize_room, move_room, and rename_room only.
Use millimetres. Use zero or an empty string for unused fields.
For an unspecified move destination, use direction "auto".
Never claim that the edit is valid; deterministic geometry and constraint engines decide that.`;
  }
});

// ../ai-orchestration/dist/editing/validation.js
function record2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value : null;
}
function optionalNumber(value, min, max) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max && value !== 0 ? value : void 0;
}
function validateAIEditPayload(payload) {
  const source = record2(payload);
  if (!source)
    return { intent: null, errors: ["Edit response must be an object."] };
  const errors = [];
  if (typeof source.action !== "string" || !ACTIONS.has(source.action))
    errors.push("action is unsupported.");
  if (typeof source.targetQuery !== "string" || !source.targetQuery.trim())
    errors.push("targetQuery is required.");
  if (typeof source.direction !== "string" || !DIRECTIONS2.has(source.direction))
    errors.push("direction is invalid.");
  if (typeof source.reasoning !== "string")
    errors.push("reasoning is required.");
  if (errors.length)
    return { intent: null, errors };
  const action = source.action;
  const intent = {
    action,
    targetQuery: source.targetQuery.trim(),
    direction: source.direction,
    ...optionalNumber(source.distanceMm, 0, 5e4) !== void 0 ? { distanceMm: optionalNumber(source.distanceMm, 0, 5e4) } : {},
    ...optionalNumber(source.widthMm, 0, 1e5) !== void 0 ? { widthMm: optionalNumber(source.widthMm, 0, 1e5) } : {},
    ...optionalNumber(source.heightMm, 0, 1e5) !== void 0 ? { heightMm: optionalNumber(source.heightMm, 0, 1e5) } : {},
    ...optionalNumber(source.scalePercent, -80, 200) !== void 0 ? { scalePercent: optionalNumber(source.scalePercent, -80, 200) } : {},
    ...optionalNumber(source.dimensionDeltaMm, -1e4, 1e4) !== void 0 ? { dimensionDeltaMm: optionalNumber(source.dimensionDeltaMm, -1e4, 1e4) } : {},
    ...typeof source.newName === "string" && source.newName.trim() ? { newName: source.newName.trim().slice(0, 80) } : {},
    reasoning: source.reasoning.trim() || "Parsed provider edit intent."
  };
  if (action === "resize_room" && intent.widthMm === void 0 && intent.heightMm === void 0 && intent.scalePercent === void 0 && intent.dimensionDeltaMm === void 0) {
    errors.push("Resize intent requires dimensions, a percentage, or a dimension delta.");
  }
  if (action === "rename_room" && !intent.newName)
    errors.push("Rename intent requires newName.");
  return { intent: errors.length ? null : intent, errors };
}
var ACTIONS, DIRECTIONS2;
var init_validation3 = __esm({
  "../ai-orchestration/dist/editing/validation.js"() {
    "use strict";
    ACTIONS = /* @__PURE__ */ new Set(["resize_room", "move_room", "rename_room"]);
    DIRECTIONS2 = /* @__PURE__ */ new Set(["north", "south", "east", "west", "auto"]);
  }
});

// ../ai-orchestration/dist/orchestration/service.js
var AIOrchestrationService;
var init_service = __esm({
  "../ai-orchestration/dist/orchestration/service.js"() {
    "use strict";
    init_dist();
    init_rule_based();
    init_schema();
    init_validation2();
    init_context();
    init_parser();
    init_schema2();
    init_validation3();
    AIOrchestrationService = class {
      provider;
      ruleParser = new RuleBasedRequirementParser();
      editParser = new RuleBasedEditParser();
      timeoutMs;
      maxPromptLength;
      constructor(provider, options = {}) {
        this.provider = provider;
        this.timeoutMs = options.providerTimeoutMs ?? 16e3;
        this.maxPromptLength = options.maxPromptLength ?? 5e3;
      }
      /** Backwards-compatible API consumed by Phases 1-7. */
      async parseRequirements(prompt) {
        return (await this.parseRequirementsDetailed(prompt)).requirements;
      }
      /** Parse with auditable provider/fallback provenance for Phase 8 UI and logs. */
      async parseRequirementsDetailed(prompt) {
        const startedAt = Date.now();
        const diagnostics = [];
        const trimmed = prompt.trim();
        const safePrompt = (trimmed || "30x50 2BHK").slice(0, this.maxPromptLength);
        if (!trimmed) {
          diagnostics.push({ code: "EMPTY_PROMPT", severity: "info", message: "An empty description was replaced with the safe 30\xD750 2BHK baseline." });
        }
        if (trimmed.length > this.maxPromptLength) {
          diagnostics.push({ code: "PROMPT_TRUNCATED", severity: "warning", message: `Input was limited to ${this.maxPromptLength} characters before parsing.` });
        }
        if (!this.provider) {
          return this.localResult(safePrompt, "rule_based", diagnostics, startedAt);
        }
        const providerName = this.provider.name;
        const model = this.provider.getModelInfo().model;
        try {
          if (!await this.provider.isAvailable()) {
            diagnostics.push({ code: "PROVIDER_UNAVAILABLE", severity: "warning", message: `${providerName} is not configured; deterministic parsing was used.` });
            return this.localResult(safePrompt, "rule_based_fallback", diagnostics, startedAt, providerName, model);
          }
          const providerResponse = await this.withTimeout(this.provider.complete({
            taskType: AITaskType.RequirementExtraction,
            systemPrompt: REQUIREMENT_EXTRACTION_PROMPT,
            userPrompt: safePrompt,
            responseFormat: "json",
            temperature: 0,
            maxTokens: 1800
          }));
          const validation = validateRequirementPayload(providerResponse.parsed, safePrompt);
          if (!validation.valid || !validation.requirements) {
            diagnostics.push({
              code: "INVALID_PROVIDER_OUTPUT",
              severity: "warning",
              message: `Provider output failed ${validation.errors.length} validation check${validation.errors.length === 1 ? "" : "s"}; deterministic parsing was used.`
            });
            return this.localResult(safePrompt, "rule_based_fallback", diagnostics, startedAt, providerName, providerResponse.model);
          }
          return {
            requirements: validation.requirements,
            source: "provider",
            providerName,
            model: providerResponse.model,
            usedFallback: false,
            diagnostics,
            latencyMs: Date.now() - startedAt
          };
        } catch (error) {
          const timedOut = error instanceof Error && error.message === "AI requirement provider timed out.";
          diagnostics.push({
            code: timedOut ? "PROVIDER_TIMEOUT" : "PROVIDER_ERROR",
            severity: "warning",
            message: timedOut ? `${providerName} exceeded the parsing time limit; deterministic parsing was used.` : `${providerName} could not safely parse this description; deterministic parsing was used.`
          });
          return this.localResult(safePrompt, "rule_based_fallback", diagnostics, startedAt, providerName, model);
        }
      }
      /** Backwards-compatible core orchestration contract for Phase 9. */
      async parseEditCommand(command, context) {
        const parsed = await this.parseEditCommandDetailed(command, context);
        if (!parsed.intent)
          return [];
        const operationType = parsed.intent.action === "resize_room" ? "resize" : parsed.intent.action === "move_room" ? "move" : "modify";
        return [{
          type: operationType,
          changes: { ...parsed.intent },
          reasoning: parsed.intent.reasoning
        }];
      }
      async parseEditCommandDetailed(command, building, options = {}) {
        const startedAt = Date.now();
        const diagnostics = [];
        const safeCommand = command.trim().slice(0, 1e3);
        if (!safeCommand) {
          diagnostics.push({ code: "EMPTY_COMMAND", severity: "info", message: "Enter an edit instruction." });
          return this.localEditResult("", building, options, "rule_based", diagnostics, startedAt);
        }
        if (!this.provider)
          return this.localEditResult(safeCommand, building, options, "rule_based", diagnostics, startedAt);
        const providerName = this.provider.name;
        const model = this.provider.getModelInfo().model;
        try {
          if (!await this.provider.isAvailable()) {
            diagnostics.push({ code: "PROVIDER_UNAVAILABLE", severity: "warning", message: `${providerName} is not configured; deterministic edit parsing was used.` });
            return this.localEditResult(safeCommand, building, options, "rule_based_fallback", diagnostics, startedAt, providerName, model);
          }
          const context = extractAIEditContext(building, options.activeFloorId, options.selectedRoomId);
          const response2 = await this.withTimeout(this.provider.complete({
            taskType: AITaskType.NaturalLanguageEdit,
            systemPrompt: AI_EDIT_SYSTEM_PROMPT,
            userPrompt: `Instruction: ${safeCommand}

${context.promptSummary}`,
            responseFormat: "json",
            responseSchema: AI_EDIT_RESPONSE_SCHEMA,
            responseSchemaName: "floor_plan_edit",
            temperature: 0,
            maxTokens: 800
          }), "AI edit provider timed out.");
          const validated = validateAIEditPayload(response2.parsed);
          if (!validated.intent) {
            diagnostics.push({ code: "INVALID_PROVIDER_OUTPUT", severity: "warning", message: `Provider edit failed ${validated.errors.length} validation check${validated.errors.length === 1 ? "" : "s"}; deterministic parsing was used.` });
            return this.localEditResult(safeCommand, building, options, "rule_based_fallback", diagnostics, startedAt, providerName, response2.model);
          }
          return {
            intent: validated.intent,
            source: "provider",
            providerName,
            model: response2.model,
            usedFallback: false,
            diagnostics,
            latencyMs: Date.now() - startedAt
          };
        } catch (error) {
          const timedOut = error instanceof Error && error.message === "AI edit provider timed out.";
          diagnostics.push({
            code: timedOut ? "PROVIDER_TIMEOUT" : "PROVIDER_ERROR",
            severity: "warning",
            message: timedOut ? `${providerName} exceeded the edit parsing time limit; deterministic parsing was used.` : `${providerName} could not safely parse this edit; deterministic parsing was used.`
          });
          return this.localEditResult(safeCommand, building, options, "rule_based_fallback", diagnostics, startedAt, providerName, model);
        }
      }
      localResult(prompt, source, diagnostics, startedAt, providerName = null, model = null) {
        return {
          requirements: this.ruleParser.parse(prompt),
          source,
          providerName,
          model,
          usedFallback: source === "rule_based_fallback",
          diagnostics,
          latencyMs: Date.now() - startedAt
        };
      }
      localEditResult(command, building, options, source, diagnostics, startedAt, providerName = null, model = null) {
        const parsed = this.editParser.parse(command, building, options);
        if (!parsed.intent && parsed.message && !diagnostics.some((diagnostic) => diagnostic.code === "EMPTY_COMMAND")) {
          diagnostics.push({ code: "UNSUPPORTED_COMMAND", severity: "info", message: parsed.message });
        }
        return {
          intent: parsed.intent,
          source,
          providerName,
          model,
          usedFallback: source === "rule_based_fallback",
          diagnostics,
          latencyMs: Date.now() - startedAt
        };
      }
      async withTimeout(operation, timeoutMessage = "AI requirement provider timed out.") {
        let timeoutHandle;
        const timeout = new Promise((_, reject) => {
          timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), this.timeoutMs);
        });
        try {
          return await Promise.race([operation, timeout]);
        } finally {
          if (timeoutHandle)
            clearTimeout(timeoutHandle);
        }
      }
    };
  }
});

// ../ai-orchestration/dist/editing/command.js
var init_command = __esm({
  "../ai-orchestration/dist/editing/command.js"() {
    "use strict";
    init_dist();
  }
});

// ../planning-engine/dist/requirements/validator.js
function areaFor(type) {
  return MIN_ROOM_AREAS_MM2[type] ?? MIN_ROOM_AREAS_MM2[RoomType.Custom];
}
function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}
var MIN_ROOM_AREAS_MM2, CIRCULATION_AND_WALL_RATIO, RequirementValidator;
var init_validator = __esm({
  "../planning-engine/dist/requirements/validator.js"() {
    "use strict";
    init_dist();
    init_dist();
    MIN_ROOM_AREAS_MM2 = {
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
    CIRCULATION_AND_WALL_RATIO = 0.18;
    RequirementValidator = class {
      validate(spec) {
        const issues = [];
        const { hard, soft } = spec;
        if (!Number.isFinite(hard.plotWidthMm) || !Number.isFinite(hard.plotDepthMm) || hard.plotWidthMm <= 0 || hard.plotDepthMm <= 0) {
          issues.push({
            code: "INVALID_PLOT_DIMENSIONS",
            severity: "error",
            message: `Plot dimensions must be finite and positive. Received ${hard.plotWidthMm} \xD7 ${hard.plotDepthMm} mm.`,
            field: "hard.plotWidthMm",
            suggestion: "Enter the measured plot width and depth as positive values."
          });
        }
        if (hard.plotWidthMm > 0 && hard.plotDepthMm > 0 && (hard.plotWidthMm < 3e3 || hard.plotDepthMm < 3e3)) {
          issues.push({
            code: "PLOT_TOO_NARROW",
            severity: "error",
            message: "At least one plot dimension is below the 3,000 mm minimum supported by the current residential planner.",
            field: "hard.plotWidthMm",
            suggestion: "Use a wider plot or wait for the compact/irregular-site planning module."
          });
        }
        if (!Number.isInteger(hard.floorsCount) || hard.floorsCount < 1) {
          issues.push({
            code: "INVALID_FLOOR_COUNT",
            severity: "error",
            message: `Floor count must be a positive integer. Received ${hard.floorsCount}.`,
            field: "hard.floorsCount"
          });
        } else if (hard.floorsCount > BUILDING_CAPABILITIES.maximumFloorCount) {
          issues.push({
            code: "UNSUPPORTED_FLOOR_COUNT",
            severity: "error",
            message: `${hard.floorsCount} floors exceeds the current low-rise residential planning scope.`,
            field: "hard.floorsCount",
            suggestion: `Limit the request to ${BUILDING_CAPABILITIES.maximumFloorCount} floors or use a future high-rise workflow.`
          });
        }
        const countFields = [
          ["bedroomCount", hard.bedroomCount],
          ["bathroomCount", hard.bathroomCount],
          ["parkingSpacesCount", hard.parkingSpacesCount]
        ];
        for (const [field, value] of countFields) {
          if (!isNonNegativeInteger(value)) {
            issues.push({
              code: "INVALID_REQUIREMENT_COUNT",
              severity: "error",
              message: `${field} must be a non-negative integer. Received ${value}.`,
              field: `hard.${field}`
            });
          }
        }
        if (hard.bedroomCount > 8) {
          issues.push({
            code: "EXCESSIVE_BEDROOM_COUNT",
            severity: "error",
            message: `Requested ${hard.bedroomCount} bedrooms exceeds the current single-family residential scope.`,
            field: "hard.bedroomCount",
            suggestion: "Reduce the bedroom count or use a multi-unit building workflow."
          });
        }
        if (hard.floorsCount > 1 && !hard.staircaseRequired) {
          issues.push({
            code: "MISSING_VERTICAL_CIRCULATION",
            severity: "error",
            message: `${hard.floorsCount} floors require a staircase.`,
            field: "hard.staircaseRequired",
            suggestion: "Enable a staircase for every multi-floor request."
          });
        }
        if (hard.parkingRequired !== hard.parkingSpacesCount > 0) {
          issues.push({
            code: "INCONSISTENT_PARKING_REQUIREMENT",
            severity: "error",
            message: "Parking requirement and parking-space count disagree.",
            field: "hard.parkingSpacesCount",
            suggestion: "Set parking spaces to zero when parking is not required, or at least one when it is required."
          });
        }
        if (hard.bedroomCount > 0 && hard.bathroomCount === 0) {
          issues.push({
            code: "MISSING_BATHROOM",
            severity: "warning",
            message: "The residence has bedrooms but no bathroom.",
            field: "hard.bathroomCount",
            suggestion: "Add at least one bathroom."
          });
        }
        if (soft.attachedBathroomsCount > hard.bathroomCount) {
          issues.push({
            code: "EXCESSIVE_ATTACHED_BATHROOMS",
            severity: "error",
            message: `${soft.attachedBathroomsCount} attached bathrooms cannot be supplied from ${hard.bathroomCount} total bathrooms.`,
            field: "soft.attachedBathroomsCount",
            suggestion: "Increase the total bathroom count or reduce attached bathrooms."
          });
        }
        if (hard.liftRequired && hard.floorsCount === 1) {
          issues.push({
            code: "UNNECESSARY_LIFT",
            severity: "warning",
            message: "A lift was requested for a single-floor building.",
            field: "hard.liftRequired",
            suggestion: "Disable the lift unless it serves a basement, terrace, or accessibility requirement."
          });
        }
        if (spec.plotShape !== PlotShape.Rectangular) {
          issues.push({
            code: "HEURISTIC_NON_RECTANGULAR_FEASIBILITY",
            severity: "warning",
            message: "Area feasibility for non-rectangular plots is preliminary until a plot polygon is provided.",
            field: "plotShape",
            suggestion: "Provide the measured plot polygon before detailed generation."
          });
        }
        const plotWidth = Number.isFinite(hard.plotWidthMm) ? Math.max(0, hard.plotWidthMm) : 0;
        const plotDepth = Number.isFinite(hard.plotDepthMm) ? Math.max(0, hard.plotDepthMm) : 0;
        const plotAreaMm2 = plotWidth * plotDepth;
        const setbacks = spec.setbacksMm ?? {
          front: Math.min(2e3, Math.max(1e3, plotDepth * 0.1)),
          rear: Math.min(1500, Math.max(1e3, plotDepth * 0.08)),
          left: Math.min(1200, Math.max(900, plotWidth * 0.08)),
          right: Math.min(1200, Math.max(900, plotWidth * 0.08))
        };
        for (const [side, value] of Object.entries(setbacks)) {
          if (!Number.isFinite(value) || value < 0) {
            issues.push({
              code: "INVALID_SETBACK",
              severity: "error",
              message: `${side} setback must be a finite, non-negative distance. Received ${value} mm.`,
              field: `setbacksMm.${side}`
            });
          }
        }
        const safeSetback = (value) => Number.isFinite(value) ? Math.max(0, value) : 0;
        const buildableWidthMm = Math.max(0, plotWidth - safeSetback(setbacks.left) - safeSetback(setbacks.right));
        const buildableDepthMm = Math.max(0, plotDepth - safeSetback(setbacks.front) - safeSetback(setbacks.rear));
        const buildableAreaMm2 = buildableWidthMm * buildableDepthMm;
        if (buildableWidthMm < 2e3 || buildableDepthMm < 2e3) {
          issues.push({
            code: "UNBUILDABLE_SETBACKS",
            severity: "error",
            message: `Setbacks leave only ${Math.round(buildableWidthMm)} \xD7 ${Math.round(buildableDepthMm)} mm of buildable footprint.`,
            field: "setbacksMm",
            suggestion: "Verify applicable setbacks or increase the plot dimensions."
          });
        }
        let baseProgramAreaMm2 = 0;
        if (hard.livingRoomRequired)
          baseProgramAreaMm2 += areaFor(RoomType.Living);
        if (hard.diningRoomRequired)
          baseProgramAreaMm2 += areaFor(RoomType.Dining);
        if (hard.kitchenRequired)
          baseProgramAreaMm2 += areaFor(RoomType.Kitchen);
        if (hard.staircaseRequired)
          baseProgramAreaMm2 += areaFor(RoomType.Staircase) * hard.floorsCount;
        if (hard.liftRequired)
          baseProgramAreaMm2 += areaFor(RoomType.Lift) * hard.floorsCount;
        baseProgramAreaMm2 += hard.parkingSpacesCount * areaFor(RoomType.Parking);
        if (soft.poojaRoom)
          baseProgramAreaMm2 += areaFor(RoomType.Pooja);
        if (soft.studyRoom)
          baseProgramAreaMm2 += areaFor(RoomType.Study);
        if (soft.balconyPreferred)
          baseProgramAreaMm2 += areaFor(RoomType.Balcony);
        if (soft.servantQuarter)
          baseProgramAreaMm2 += areaFor(RoomType.ServantQuarter);
        if (soft.gardenPreference)
          baseProgramAreaMm2 += areaFor(RoomType.Garden);
        if (hard.bedroomCount > 0) {
          baseProgramAreaMm2 += 14e6;
          baseProgramAreaMm2 += Math.max(0, hard.bedroomCount - 1) * areaFor(RoomType.Bedroom);
        }
        baseProgramAreaMm2 += hard.bathroomCount * areaFor(RoomType.Bathroom);
        for (const custom of hard.customRooms ?? []) {
          if (!isNonNegativeInteger(custom.count)) {
            issues.push({
              code: "INVALID_CUSTOM_ROOM_COUNT",
              severity: "error",
              message: `Custom room "${custom.name ?? custom.type}" has invalid count ${custom.count}.`,
              field: "hard.customRooms"
            });
          } else {
            baseProgramAreaMm2 += custom.count * areaFor(custom.type);
          }
        }
        const estimatedCirculationAreaMm2 = baseProgramAreaMm2 * CIRCULATION_AND_WALL_RATIO;
        const estimatedRequiredAreaMm2 = baseProgramAreaMm2 + estimatedCirculationAreaMm2;
        const totalAvailableFloorAreaMm2 = buildableAreaMm2 * Math.max(1, hard.floorsCount);
        const utilizationRatio = totalAvailableFloorAreaMm2 > 0 ? estimatedRequiredAreaMm2 / totalAvailableFloorAreaMm2 : 2;
        if (utilizationRatio > 1) {
          issues.push({
            code: "INSUFFICIENT_PLOT_AREA",
            severity: "error",
            message: `The requested program needs approximately ${(estimatedRequiredAreaMm2 / 1e6).toFixed(1)} m\xB2, but only ${(totalAvailableFloorAreaMm2 / 1e6).toFixed(1)} m\xB2 is available across ${hard.floorsCount} floor(s).`,
            suggestion: "Increase the plot or floor count, or reduce the requested program."
          });
        } else if (utilizationRatio > 0.8) {
          issues.push({
            code: "HIGH_SPACE_DENSITY",
            severity: "warning",
            message: `The estimated program uses ${(utilizationRatio * 100).toFixed(0)}% of available floor area. Packing and circulation will be tight.`,
            suggestion: "Allow compact rooms or reduce optional spaces."
          });
        } else {
          issues.push({
            code: "FEASIBLE_FOOTPRINT",
            severity: "info",
            message: `The estimated program uses ${(utilizationRatio * 100).toFixed(0)}% of available floor area.`
          });
        }
        const hasErrors = issues.some((issue) => issue.severity === "error");
        const status = hasErrors ? "infeasible" : utilizationRatio > 0.8 ? "tight" : "feasible";
        const hardRequirementsCount = 5 + Number(hard.kitchenRequired) + Number(hard.livingRoomRequired) + Number(hard.diningRoomRequired) + Number(hard.staircaseRequired) + Number(hard.liftRequired) + Number(hard.parkingRequired) + (hard.customRooms ?? []).reduce((sum2, item) => sum2 + item.count, 0);
        const preferencesCount = Object.values(soft).filter((value) => typeof value === "boolean" ? value : value !== "none" && value !== 0).length;
        return {
          status,
          isFeasible: status !== "infeasible",
          plotAreaMm2,
          buildableAreaMm2,
          buildableWidthMm,
          buildableDepthMm,
          totalAvailableFloorAreaMm2,
          estimatedRequiredAreaMm2,
          estimatedCirculationAreaMm2,
          groundCoverageRatio: Math.min(2, Math.max(0, utilizationRatio)),
          issues,
          hardRequirementsCount,
          preferencesCount
        };
      }
    };
  }
});

// ../planning-engine/dist/program/generator.js
var init_generator = __esm({
  "../planning-engine/dist/program/generator.js"() {
    "use strict";
    init_dist();
  }
});

// ../planning-engine/dist/graph/builder.js
var init_builder = __esm({
  "../planning-engine/dist/graph/builder.js"() {
    "use strict";
    init_dist();
  }
});

// ../geometry-engine/dist/errors.js
var init_errors2 = __esm({
  "../geometry-engine/dist/errors.js"() {
    "use strict";
  }
});

// ../geometry-engine/dist/vector.js
var init_vector = __esm({
  "../geometry-engine/dist/vector.js"() {
    "use strict";
    init_dist();
    init_errors2();
  }
});

// ../geometry-engine/dist/line.js
var init_line = __esm({
  "../geometry-engine/dist/line.js"() {
    "use strict";
    init_dist();
    init_errors2();
  }
});

// ../geometry-engine/dist/point.js
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
var init_point = __esm({
  "../geometry-engine/dist/point.js"() {
    "use strict";
    init_dist();
    init_errors2();
  }
});

// ../geometry-engine/dist/segment.js
var init_segment = __esm({
  "../geometry-engine/dist/segment.js"() {
    "use strict";
    init_dist();
    init_point();
    init_errors2();
  }
});

// ../geometry-engine/dist/rectangle.js
var init_rectangle = __esm({
  "../geometry-engine/dist/rectangle.js"() {
    "use strict";
    init_dist();
    init_errors2();
    init_point();
  }
});

// ../geometry-engine/dist/polygon.js
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
var init_polygon = __esm({
  "../geometry-engine/dist/polygon.js"() {
    "use strict";
    init_dist();
    init_point();
    init_segment();
    init_errors2();
  }
});

// ../geometry-engine/dist/curves.js
var init_curves = __esm({
  "../geometry-engine/dist/curves.js"() {
    "use strict";
    init_dist();
    init_point();
    init_errors2();
  }
});

// ../geometry-engine/dist/room.js
var init_room = __esm({
  "../geometry-engine/dist/room.js"() {
    "use strict";
    init_dist();
    init_polygon();
    init_errors2();
  }
});

// ../geometry-engine/dist/plot.js
var init_plot = __esm({
  "../geometry-engine/dist/plot.js"() {
    "use strict";
    init_dist();
    init_rectangle();
    init_polygon();
    init_errors2();
  }
});

// ../geometry-engine/dist/walls.js
var DEFAULT_WALL_CONFIG;
var init_walls = __esm({
  "../geometry-engine/dist/walls.js"() {
    "use strict";
    init_dist();
    init_polygon();
    init_point();
    init_segment();
    init_errors2();
    DEFAULT_WALL_CONFIG = {
      externalThickness: DEFAULTS.WALL_THICKNESS_EXTERNAL,
      internalThickness: DEFAULTS.WALL_THICKNESS_INTERNAL
    };
  }
});

// ../geometry-engine/dist/doors.js
var init_doors = __esm({
  "../geometry-engine/dist/doors.js"() {
    "use strict";
    init_dist();
    init_point();
    init_segment();
    init_errors2();
    init_polygon();
  }
});

// ../geometry-engine/dist/windows.js
var init_windows = __esm({
  "../geometry-engine/dist/windows.js"() {
    "use strict";
    init_dist();
    init_point();
    init_segment();
    init_errors2();
  }
});

// ../geometry-engine/dist/stairs.js
var init_stairs = __esm({
  "../geometry-engine/dist/stairs.js"() {
    "use strict";
    init_rectangle();
    init_polygon();
    init_dist();
  }
});

// ../geometry-engine/dist/collision.js
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
var init_collision = __esm({
  "../geometry-engine/dist/collision.js"() {
    "use strict";
    init_dist();
    init_polygon();
    init_doors();
    init_stairs();
  }
});

// ../geometry-engine/dist/snapping.js
var init_snapping = __esm({
  "../geometry-engine/dist/snapping.js"() {
    "use strict";
  }
});

// ../geometry-engine/dist/area.js
var init_area = __esm({
  "../geometry-engine/dist/area.js"() {
    "use strict";
    init_polygon();
  }
});

// ../geometry-engine/dist/spatial-index/index.js
var init_spatial_index = __esm({
  "../geometry-engine/dist/spatial-index/index.js"() {
    "use strict";
    init_rectangle();
  }
});

// ../geometry-engine/dist/coordinates.js
var init_coordinates = __esm({
  "../geometry-engine/dist/coordinates.js"() {
    "use strict";
    init_errors2();
  }
});

// ../geometry-engine/dist/floor-bounds.js
var init_floor_bounds = __esm({
  "../geometry-engine/dist/floor-bounds.js"() {
    "use strict";
  }
});

// ../geometry-engine/dist/units.js
var init_units = __esm({
  "../geometry-engine/dist/units.js"() {
    "use strict";
    init_dist();
  }
});

// ../geometry-engine/dist/debug.js
var init_debug = __esm({
  "../geometry-engine/dist/debug.js"() {
    "use strict";
    init_walls();
    init_doors();
    init_polygon();
  }
});

// ../geometry-engine/dist/index.js
var init_dist2 = __esm({
  "../geometry-engine/dist/index.js"() {
    "use strict";
    init_errors2();
    init_vector();
    init_line();
    init_point();
    init_segment();
    init_rectangle();
    init_polygon();
    init_curves();
    init_room();
    init_plot();
    init_walls();
    init_doors();
    init_windows();
    init_stairs();
    init_collision();
    init_snapping();
    init_area();
    init_spatial_index();
    init_coordinates();
    init_floor_bounds();
    init_units();
    init_debug();
  }
});

// ../planning-engine/dist/graph/scorer.js
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
var init_scorer = __esm({
  "../planning-engine/dist/graph/scorer.js"() {
    "use strict";
    init_dist();
    init_dist2();
  }
});

// ../planning-engine/dist/evidence/architectural-closeout.js
var COMMON, TRANSITION, EXPOSURE;
var init_architectural_closeout = __esm({
  "../planning-engine/dist/evidence/architectural-closeout.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_scorer();
    COMMON = /* @__PURE__ */ new Set([
      RoomType.Living,
      RoomType.FamilyLiving,
      RoomType.Drawing,
      RoomType.Dining,
      RoomType.Corridor,
      RoomType.Foyer,
      RoomType.Staircase,
      RoomType.Lift
    ]);
    TRANSITION = /* @__PURE__ */ new Set([RoomType.Corridor, RoomType.Foyer, RoomType.Staircase, RoomType.Lift]);
    EXPOSURE = /* @__PURE__ */ new Set([
      RoomType.Bedroom,
      RoomType.Living,
      RoomType.FamilyLiving,
      RoomType.Drawing,
      RoomType.Kitchen,
      RoomType.Bathroom,
      RoomType.Utility,
      RoomType.Storage
    ]);
  }
});

// ../planning-engine/dist/evidence/architectural-evidence.js
var WET_TYPES, OUTDOOR_TYPES, ACCESS_TYPES, COMMON_TYPES;
var init_architectural_evidence = __esm({
  "../planning-engine/dist/evidence/architectural-evidence.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_scorer();
    init_architectural_closeout();
    WET_TYPES = /* @__PURE__ */ new Set([RoomType.Bathroom, RoomType.Kitchen, RoomType.Utility]);
    OUTDOOR_TYPES = /* @__PURE__ */ new Set([RoomType.Balcony, RoomType.Terrace, RoomType.Garden]);
    ACCESS_TYPES = /* @__PURE__ */ new Set([RoomType.Storage, RoomType.Custom, RoomType.Corridor, RoomType.Foyer]);
    COMMON_TYPES = /* @__PURE__ */ new Set([
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
  }
});

// ../planning-engine/dist/multi-floor/planner.js
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
var CORE_TYPES, GROUND_ANCHOR_TYPES;
var init_planner = __esm({
  "../planning-engine/dist/multi-floor/planner.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_scorer();
    CORE_TYPES = /* @__PURE__ */ new Set([RoomType.Staircase, RoomType.Lift]);
    GROUND_ANCHOR_TYPES = /* @__PURE__ */ new Set([
      RoomType.Living,
      RoomType.Dining,
      RoomType.Kitchen,
      RoomType.Foyer,
      RoomType.Parking,
      RoomType.Garden
    ]);
  }
});

// ../planning-engine/dist/diagnostics/design-evaluator.js
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
var init_design_evaluator = __esm({
  "../planning-engine/dist/diagnostics/design-evaluator.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_scorer();
    init_planner();
  }
});

// ../planning-engine/dist/repair/engine.js
var NON_REASSIGNABLE_TYPES;
var init_engine2 = __esm({
  "../planning-engine/dist/repair/engine.js"() {
    "use strict";
    init_dist();
    init_scorer();
    init_architectural_evidence();
    init_design_evaluator();
    NON_REASSIGNABLE_TYPES = /* @__PURE__ */ new Set([
      RoomType.Staircase,
      RoomType.Lift,
      RoomType.Parking,
      RoomType.Garden,
      RoomType.Balcony,
      RoomType.Corridor
    ]);
  }
});

// ../planning-engine/dist/vastu/optimizer.js
var EXCLUDED_TYPES;
var init_optimizer = __esm({
  "../planning-engine/dist/vastu/optimizer.js"() {
    "use strict";
    init_dist();
    init_scorer();
    init_engine2();
    EXCLUDED_TYPES = /* @__PURE__ */ new Set([
      RoomType.Staircase,
      RoomType.Lift,
      RoomType.Parking,
      RoomType.Garden,
      RoomType.Balcony
    ]);
  }
});

// ../planning-engine/dist/generator/structured-layout.js
var LAYOUT_STRATEGIES;
var init_structured_layout = __esm({
  "../planning-engine/dist/generator/structured-layout.js"() {
    "use strict";
    init_scorer();
    init_planner();
    init_dist();
    LAYOUT_STRATEGIES = [
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
  }
});

// ../planning-engine/dist/regions/orthogonal-decomposition.js
var init_orthogonal_decomposition = __esm({
  "../planning-engine/dist/regions/orthogonal-decomposition.js"() {
    "use strict";
    init_dist2();
  }
});

// ../planning-engine/dist/generator/polygon-layout.js
var CORE_TYPES2;
var init_polygon_layout = __esm({
  "../planning-engine/dist/generator/polygon-layout.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_planner();
    init_orthogonal_decomposition();
    CORE_TYPES2 = /* @__PURE__ */ new Set([RoomType.Staircase, RoomType.Lift]);
  }
});

// ../planning-engine/dist/evidence/candidate-diversity.js
var FUNCTIONAL, DISTRIBUTION;
var init_candidate_diversity = __esm({
  "../planning-engine/dist/evidence/candidate-diversity.js"() {
    "use strict";
    init_dist();
    init_scorer();
    FUNCTIONAL = /* @__PURE__ */ new Set([
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
    DISTRIBUTION = /* @__PURE__ */ new Set([RoomType.Corridor, RoomType.Foyer, RoomType.Staircase, RoomType.Lift, RoomType.Porch]);
  }
});

// ../planning-engine/dist/site/site-planner.js
var init_site_planner = __esm({
  "../planning-engine/dist/site/site-planner.js"() {
    "use strict";
    init_dist();
    init_dist2();
  }
});

// ../planning-engine/dist/site/site-analyzer.js
var init_site_analyzer = __esm({
  "../planning-engine/dist/site/site-analyzer.js"() {
    "use strict";
  }
});

// ../planning-engine/dist/generator/massing-generator.js
var init_massing_generator = __esm({
  "../planning-engine/dist/generator/massing-generator.js"() {
    "use strict";
  }
});

// ../planning-engine/dist/generator/architectural-layout-engine.js
var init_architectural_layout_engine = __esm({
  "../planning-engine/dist/generator/architectural-layout-engine.js"() {
    "use strict";
    init_dist();
    init_planner();
  }
});

// ../planning-engine/dist/strategy/design-strategy.js
var init_design_strategy = __esm({
  "../planning-engine/dist/strategy/design-strategy.js"() {
    "use strict";
  }
});

// ../planning-engine/dist/generator/candidate-generator.js
var init_candidate_generator = __esm({
  "../planning-engine/dist/generator/candidate-generator.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_builder();
    init_scorer();
    init_engine2();
    init_structured_layout();
    init_polygon_layout();
    init_planner();
    init_architectural_evidence();
    init_optimizer();
    init_design_evaluator();
    init_candidate_diversity();
    init_site_planner();
    init_site_analyzer();
    init_massing_generator();
    init_architectural_layout_engine();
    init_design_strategy();
  }
});

// ../planning-engine/dist/generation/workflow.js
var GENERATION_STAGES;
var init_workflow = __esm({
  "../planning-engine/dist/generation/workflow.js"() {
    "use strict";
    init_dist();
    init_design_evaluator();
    init_engine2();
    init_architectural_evidence();
    init_dist2();
    init_candidate_generator();
    init_polygon_layout();
    init_validator();
    GENERATION_STAGES = Object.freeze([
      { id: "validate_inputs", label: "Validate approved inputs", detail: "Checks Site, Program, Footprint, category and engine compatibility." },
      { id: "prepare_program", label: "Prepare room instances", detail: "Preserves reviewed quantities and room-area targets." },
      { id: "generate_candidates", label: "Generate and repair options", detail: "Runs deterministic allocation, geometry, repair and quality evaluation." },
      { id: "validate_candidates", label: "Validate against footprint", detail: "Rechecks every room against its approved per-floor boundary." },
      { id: "rank_options", label: "Rank design options", detail: "Orders candidates using calculated architectural, graph and multi-floor evidence." }
    ]);
  }
});

// ../planning-engine/dist/generation/reviewed-workflow.js
var init_reviewed_workflow = __esm({
  "../planning-engine/dist/generation/reviewed-workflow.js"() {
    "use strict";
    init_dist();
    init_workflow();
  }
});

// ../planning-engine/dist/refinement/targeted-regeneration.js
var init_targeted_regeneration = __esm({
  "../planning-engine/dist/refinement/targeted-regeneration.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_design_evaluator();
    init_engine2();
  }
});

// ../planning-engine/dist/generator/stair-coordination.js
var init_stair_coordination = __esm({
  "../planning-engine/dist/generator/stair-coordination.js"() {
    "use strict";
    init_dist();
    init_dist2();
  }
});

// ../planning-engine/dist/interpretation/extraction-analysis.js
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
var init_extraction_analysis = __esm({
  "../planning-engine/dist/interpretation/extraction-analysis.js"() {
    "use strict";
  }
});

// ../planning-engine/dist/interpretation/extraction-building.js
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
var DOOR_TYPE;
var init_extraction_building = __esm({
  "../planning-engine/dist/interpretation/extraction-building.js"() {
    "use strict";
    init_dist();
    init_dist();
    init_extraction_analysis();
    DOOR_TYPE = {
      open_passage: "open_passage",
      double: "double",
      sliding: "sliding",
      single: "single",
      unknown: "single"
    };
  }
});

// ../planning-engine/dist/interpretation/extraction-validation.js
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
var init_extraction_validation = __esm({
  "../planning-engine/dist/interpretation/extraction-validation.js"() {
    "use strict";
    init_dist2();
    init_design_evaluator();
    init_dist2();
    init_extraction_analysis();
  }
});

// ../planning-engine/dist/interpretation/extraction-parser.js
function asRecord3(value) {
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
    const record3 = asRecord3(entry);
    const x = record3 ? num(record3.x) : null;
    const y = record3 ? num(record3.y) : null;
    if (x === null || y === null)
      return null;
    points.push({ x, y });
  }
  return { points };
}
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
  const source = asRecord3(payload);
  if (!source) {
    return { plan: null, diagnostics: [{ code: "EXTRACTION_PAYLOAD_INVALID", severity: "error", message: "The vision response was not a JSON object." }] };
  }
  const boundary = pointList(asRecord3(source.boundary)?.points);
  if (!boundary) {
    return { plan: null, diagnostics: [{ code: "EXTRACTION_PAYLOAD_BOUNDARY_INVALID", severity: "error", message: "The vision response did not contain a valid building boundary polygon." }] };
  }
  const rooms = [];
  for (const entry of Array.isArray(source.rooms) ? source.rooms : []) {
    const record3 = asRecord3(entry);
    if (!record3)
      continue;
    const id = str(record3.id);
    const name = str(record3.name);
    const type = str(record3.type) ?? name;
    const x = num(record3.x);
    const y = num(record3.y);
    const width = num(record3.width);
    const height = num(record3.height);
    if (!id || !name || !type || x === null || y === null || width === null || height === null) {
      diagnostics.push({ code: "EXTRACTION_ROOM_SKIPPED", severity: "warning", message: `Room "${name ?? id ?? "unknown"}" was skipped because its geometry was incomplete.` });
      continue;
    }
    if (width <= 0 || height <= 0) {
      diagnostics.push({ code: "EXTRACTION_ROOM_SKIPPED", severity: "warning", message: `Room "${name}" was skipped because its extracted size was not positive.` });
      continue;
    }
    const flatId = str(record3.flatId);
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
    const record3 = asRecord3(entry);
    if (!record3)
      continue;
    const id = str(record3.id);
    const x = num(record3.x);
    const y = num(record3.y);
    const width = num(record3.width);
    const height = num(record3.height);
    const adjacentRoomId = str(record3.adjacentRoomId);
    if (!id || x === null || y === null || width === null || height === null || !adjacentRoomId)
      continue;
    const rawType = str(record3.type) ?? "unknown";
    const rawSwing = str(record3.swingDirection) ?? "unknown";
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
    const record3 = asRecord3(entry);
    if (!record3)
      continue;
    const id = str(record3.id);
    const x = num(record3.x);
    const y = num(record3.y);
    const width = num(record3.width);
    const height = num(record3.height);
    const adjacentRoomId = str(record3.adjacentRoomId);
    if (!id || x === null || y === null || width === null || height === null || !adjacentRoomId)
      continue;
    windows.push({ id, imageX: x, imageY: y, imageWidth: width, imageHeight: height, adjacentRoomId });
  }
  const stairs = [];
  for (const entry of Array.isArray(source.stairs) ? source.stairs : []) {
    const record3 = asRecord3(entry);
    if (!record3)
      continue;
    const id = str(record3.id);
    const name = str(record3.name) ?? "Staircase";
    const x = num(record3.x);
    const y = num(record3.y);
    const width = num(record3.width);
    const height = num(record3.height);
    if (!id || x === null || y === null || width === null || height === null)
      continue;
    const flatId = str(record3.flatId);
    stairs.push({ id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height, ...flatId ? { flatId } : {} });
  }
  const parking = [];
  for (const entry of Array.isArray(source.parking) ? source.parking : []) {
    const record3 = asRecord3(entry);
    if (!record3)
      continue;
    const id = str(record3.id);
    const name = str(record3.name) ?? "Parking";
    const x = num(record3.x);
    const y = num(record3.y);
    const width = num(record3.width);
    const height = num(record3.height);
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
    const record3 = asRecord3(entry);
    if (!record3)
      continue;
    const id = str(record3.id);
    const label = str(record3.label) ?? id;
    const unitType = str(record3.unitType);
    const x = num(record3.x);
    const y = num(record3.y);
    const width = num(record3.width);
    const height = num(record3.height);
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
    const record3 = asRecord3(entry);
    if (!record3)
      continue;
    const id = str(record3.id);
    const name = str(record3.name) ?? fallbackName;
    const x = num(record3.x);
    const y = num(record3.y);
    const width = num(record3.width);
    const height = num(record3.height);
    if (!id || x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
      diagnostics.push({ code: "EXTRACTION_CORE_ELEMENT_SKIPPED", severity: "warning", message: `${fallbackName} "${name}" was skipped because its geometry was incomplete.` });
      continue;
    }
    const flatId = str(record3.flatId);
    elements.push({ id, name, imageX: x, imageY: y, imageWidth: width, imageHeight: height, ...flatId ? { flatId } : {} });
  }
  return elements;
}
var DOOR_TYPES, SWINGS;
var init_extraction_parser = __esm({
  "../planning-engine/dist/interpretation/extraction-parser.js"() {
    "use strict";
    DOOR_TYPES = /* @__PURE__ */ new Set(["single", "double", "sliding", "open_passage", "unknown"]);
    SWINGS = /* @__PURE__ */ new Set(["inward", "outward", "left", "right", "unknown"]);
  }
});

// ../planning-engine/dist/interpretation/apartment-plan.js
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
      const span = Math.max(1, Math.round(Math.max(opening.rect.width, opening.rect.height)));
      windows.push({
        id: opening.id,
        floorId,
        wallId: "__extracted__",
        position,
        width: span,
        height: 1200,
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
var APARTMENT_COMMON_FLAT_ID, CORE_ROLES, ROLE_ROOM_TYPE, FLAT_OVERLAP_TOLERANCE, ROOM_CONTAINMENT_MIN, CORE_INSIDE_FLAT_TOLERANCE, DAY_ROLES, DOOR_TYPE2;
var init_apartment_plan = __esm({
  "../planning-engine/dist/interpretation/apartment-plan.js"() {
    "use strict";
    init_dist();
    init_dist2();
    init_design_evaluator();
    APARTMENT_COMMON_FLAT_ID = "COMMON";
    CORE_ROLES = /* @__PURE__ */ new Set(["lift", "stair", "lobby", "corridor"]);
    ROLE_ROOM_TYPE = {
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
    FLAT_OVERLAP_TOLERANCE = 0.01;
    ROOM_CONTAINMENT_MIN = 0.95;
    CORE_INSIDE_FLAT_TOLERANCE = 0.1;
    DAY_ROLES = /* @__PURE__ */ new Set(["living", "dining", "kitchen"]);
    DOOR_TYPE2 = {
      open_passage: "open_passage",
      double: "double",
      sliding: "sliding",
      single: "single",
      unknown: "single"
    };
  }
});

// ../planning-engine/dist/index.js
var init_dist3 = __esm({
  "../planning-engine/dist/index.js"() {
    "use strict";
    init_validator();
    init_generator();
    init_builder();
    init_scorer();
    init_engine2();
    init_planner();
    init_optimizer();
    init_candidate_generator();
    init_orthogonal_decomposition();
    init_workflow();
    init_reviewed_workflow();
    init_targeted_regeneration();
    init_stair_coordination();
    init_design_evaluator();
    init_engine2();
    init_site_planner();
    init_site_analyzer();
    init_extraction_analysis();
    init_extraction_building();
    init_extraction_validation();
    init_extraction_parser();
    init_apartment_plan();
    init_massing_generator();
    init_architectural_layout_engine();
    init_design_strategy();
  }
});

// ../ai-orchestration/dist/editing/planner.js
var init_planner2 = __esm({
  "../ai-orchestration/dist/editing/planner.js"() {
    "use strict";
    init_dist();
    init_dist3();
    init_command();
    init_target_resolver();
  }
});

// ../ai-orchestration/dist/research/architectural-research-agent.js
var init_architectural_research_agent = __esm({
  "../ai-orchestration/dist/research/architectural-research-agent.js"() {
    "use strict";
    init_dist();
    init_dist();
  }
});

// ../ai-orchestration/dist/apartment/jurisdiction.js
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
var init_jurisdiction = __esm({
  "../ai-orchestration/dist/apartment/jurisdiction.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/apartment/typologies.js
function allocateApartmentUnitSpaces(options) {
  const { unitType, flatLabel = "Flat 01", rulesProfile } = options;
  const normalizedType = String(unitType || "").trim().toUpperCase();
  const template = TYPOLOGY_TEMPLATES[normalizedType] ?? TYPOLOGY_TEMPLATES[unitType] ?? TYPOLOGY_2BHK_TEMPLATE;
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
      case "common_toilet":
        minArea = rulesProfile.combinedToiletMinimums.minAreaSqM;
        minWidth = rulesProfile.combinedToiletMinimums.minWidthM;
        break;
      case "foyer":
        minArea = 2;
        minWidth = 1.2;
        break;
      case "puja":
        minArea = 1.2;
        minWidth = 0.9;
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
  const usablePlanningBalanceSqM = Math.max(0, targetCarpetAreaSqM - totalMandatoryMinimumsSqM - internalCirculationSqM - internalWallsSqM);
  const totalWeight = template.roomTemplates.reduce((sum2, r) => sum2 + r.weight, 0);
  const rooms = roomBaseMinimums.map(({ template: rt, minArea, minWidth }) => {
    const additionalArea = rt.weight / totalWeight * usablePlanningBalanceSqM;
    const targetAreaSqM = Number((minArea + additionalArea).toFixed(2));
    return {
      id: `${flatLabel.toLowerCase().replace(/\s+/g, "_")}_${rt.id}`,
      name: rt.name,
      type: rt.type,
      tier: rt.tier,
      minAreaSqM: minArea,
      minWidthM: minWidth,
      targetAreaSqM,
      isEnsuite: rt.isEnsuite,
      hasBalcony: rt.hasBalcony,
      vastuZone: rt.vastuZone
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
var TYPOLOGY_2BHK_TEMPLATE, TYPOLOGY_3BHK_TEMPLATE, TYPOLOGY_TEMPLATES;
var init_typologies = __esm({
  "../ai-orchestration/dist/apartment/typologies.js"() {
    "use strict";
    TYPOLOGY_2BHK_TEMPLATE = {
      unitType: "2BHK",
      defaultCarpetAreaSqM: 70,
      planningSequence: [
        "Main Entrance Door",
        "Entrance Foyer (1.2m x 1.5m)",
        "Living & Dining Room (Brahmasthana Spine)",
        "Sit-Out Balcony (Open Facade)",
        "Puja Alcove (NE Zone)",
        "Kitchen",
        "Dry Utility Balcony (1.2m x 1.8m)",
        "Private Passage (min 1.0m wide)",
        "Master Bedroom (SW Zone) + Attached Bath + 600mm Wardrobe",
        "Bedroom 2",
        "Common Toilet (Clustered on OTS Shaft)"
      ],
      roomTemplates: [
        { id: "foyer", name: "Entrance Foyer", type: "foyer", tier: "PUBLIC", weight: 0.04 },
        { id: "living_dining", name: "Living & Dining Room", type: "living_dining", tier: "PUBLIC", weight: 0.35, hasBalcony: true },
        { id: "puja", name: "Puja Alcove", type: "puja", tier: "PUBLIC", weight: 0.03, vastuZone: "NE" },
        { id: "kitchen", name: "Kitchen", type: "kitchen", tier: "SEMI_PRIVATE", weight: 0.12, vastuZone: "SE" },
        { id: "utility", name: "Dry Utility Balcony", type: "utility", tier: "SEMI_PRIVATE", weight: 0.05 },
        { id: "master_bedroom", name: "Master Bedroom", type: "master_bedroom", tier: "PRIVATE", weight: 0.2, isEnsuite: true, vastuZone: "SW" },
        { id: "master_toilet", name: "Master Toilet (En-suite)", type: "master_toilet", tier: "PRIVATE", weight: 0.04, isEnsuite: true },
        { id: "bedroom_2", name: "Bedroom 2", type: "bedroom", tier: "PRIVATE", weight: 0.13 },
        { id: "common_toilet", name: "Common Toilet", type: "common_toilet", tier: "PRIVATE", weight: 0.04, vastuZone: "NW" },
        { id: "living_balcony", name: "Sit-out Balcony", type: "balcony", tier: "PUBLIC", weight: 0, hasBalcony: true }
      ]
    };
    TYPOLOGY_3BHK_TEMPLATE = {
      unitType: "3BHK",
      defaultCarpetAreaSqM: 105,
      planningSequence: [
        "Main Entrance Door",
        "Entrance Foyer (1.2m x 1.5m)",
        "Living & Dining Room (Brahmasthana Spine)",
        "Sit-Out Balcony (Open Facade)",
        "Puja Room (NE Zone)",
        "Kitchen",
        "Dry Utility Balcony (1.2m x 1.8m)",
        "Private Passage (min 1.0m wide)",
        "Master Suite (SW Zone) + Attached Bath + Walk-in Wardrobe",
        "Bedroom 2 + Attached Bath",
        "Bedroom 3",
        "Common Toilet / Powder Room"
      ],
      roomTemplates: [
        { id: "foyer", name: "Entrance Foyer", type: "foyer", tier: "PUBLIC", weight: 0.04 },
        { id: "living_dining", name: "Living & Dining Room", type: "living_dining", tier: "PUBLIC", weight: 0.32, hasBalcony: true },
        { id: "puja", name: "Puja Room", type: "puja", tier: "PUBLIC", weight: 0.03, vastuZone: "NE" },
        { id: "kitchen", name: "Kitchen", type: "kitchen", tier: "SEMI_PRIVATE", weight: 0.11, vastuZone: "SE" },
        { id: "utility", name: "Dry Utility Balcony", type: "utility", tier: "SEMI_PRIVATE", weight: 0.05 },
        { id: "master_bedroom", name: "Master Bedroom", type: "master_bedroom", tier: "PRIVATE", weight: 0.18, isEnsuite: true, hasBalcony: true, vastuZone: "SW" },
        { id: "master_toilet", name: "Master Toilet (En-suite)", type: "master_toilet", tier: "PRIVATE", weight: 0.04, isEnsuite: true },
        { id: "bedroom_2", name: "Bedroom 2", type: "bedroom", tier: "PRIVATE", weight: 0.13, isEnsuite: true },
        { id: "toilet_2", name: "Toilet 2 (Attached)", type: "master_toilet", tier: "PRIVATE", weight: 0.03, isEnsuite: true },
        { id: "bedroom_3", name: "Bedroom 3 / Guest Room", type: "bedroom", tier: "PRIVATE", weight: 0.12 },
        { id: "common_toilet", name: "Common Toilet / Powder", type: "common_toilet", tier: "PRIVATE", weight: 0.03, vastuZone: "NW" },
        { id: "living_balcony", name: "Living Sit-Out Balcony", type: "balcony", tier: "PUBLIC", weight: 0.02, hasBalcony: true }
      ]
    };
    TYPOLOGY_TEMPLATES = {
      "1BHK": TYPOLOGY_2BHK_TEMPLATE,
      // fallback
      "2BHK": TYPOLOGY_2BHK_TEMPLATE,
      "3BHK": TYPOLOGY_3BHK_TEMPLATE,
      "4BHK": TYPOLOGY_3BHK_TEMPLATE,
      // fallback
      "1bhk": TYPOLOGY_2BHK_TEMPLATE,
      "2bhk": TYPOLOGY_2BHK_TEMPLATE,
      "3bhk": TYPOLOGY_3BHK_TEMPLATE,
      "4bhk": TYPOLOGY_3BHK_TEMPLATE
    };
  }
});

// ../ai-orchestration/dist/apartment/site-defaults.js
var DEFAULT_APARTMENT_SETBACKS_MM, DEFAULT_APARTMENT_SETBACKS_M;
var init_site_defaults = __esm({
  "../ai-orchestration/dist/apartment/site-defaults.js"() {
    "use strict";
    DEFAULT_APARTMENT_SETBACKS_MM = {
      front: 3e3,
      rear: 2e3,
      left: 2e3,
      right: 2e3
    };
    DEFAULT_APARTMENT_SETBACKS_M = {
      front: DEFAULT_APARTMENT_SETBACKS_MM.front / 1e3,
      rear: DEFAULT_APARTMENT_SETBACKS_MM.rear / 1e3,
      left: DEFAULT_APARTMENT_SETBACKS_MM.left / 1e3,
      right: DEFAULT_APARTMENT_SETBACKS_MM.right / 1e3
    };
  }
});

// ../ai-orchestration/dist/apartment/manifest.js
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
        if (r.type === "master_bedroom" || r.type === "bedroom")
          bedrooms++;
        else if (r.type === "master_toilet" || r.type === "common_toilet" || r.type === "powder_room")
          bathrooms++;
        else if (r.type === "living_dining") {
          livingRooms++;
          diningRooms++;
        } else if (r.type === "kitchen")
          kitchens++;
        else if (r.type === "utility")
          utilities++;
        else if (r.type === "balcony")
          balconies++;
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
  const netResidentialSqM = Math.max(0, Number((currentFloorPlateSqM - commonCoreSqM - circulationSqM - servicesSqM).toFixed(2)));
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
      cars: (apartmentConfig.parking?.residentParkingCount ?? 0) + (apartmentConfig.parking?.visitorParkingCount ?? 0),
      twoWheelers: apartmentConfig.parking?.twoWheelerParkingCount ?? unitsList.length * 2,
      visitorSpaces: apartmentConfig.parking?.visitorParkingCount ?? 2
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
    discrepancies.push(`Schematic flat count (${schematic.flatCount}) does not match manifest flat count (${manifest.units.exactCount}).`);
  }
  if (schematic.units.length !== manifest.units.units.length) {
    discrepancies.push(`Schematic unit count (${schematic.units.length}) does not match manifest units list (${manifest.units.units.length}).`);
  }
  for (let i = 0; i < Math.min(schematic.units.length, manifest.units.units.length); i++) {
    const sUnit = schematic.units[i];
    const mUnit = manifest.units.units[i];
    if (sUnit.unitType.toUpperCase() !== mUnit.type.toUpperCase()) {
      discrepancies.push(`Unit ${i + 1} type mismatch: Schematic has "${sUnit.unitType}", but manifest requires "${mUnit.type}".`);
    }
  }
  if (schematic.core.lifts.length !== manifest.commonCore.lifts) {
    discrepancies.push(`Schematic lift count (${schematic.core.lifts.length}) does not match manifest lift count (${manifest.commonCore.lifts}).`);
  }
  if (schematic.core.stairs.length !== manifest.commonCore.stairs) {
    discrepancies.push(`Schematic stair count (${schematic.core.stairs.length}) does not match manifest stair count (${manifest.commonCore.stairs}).`);
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
      discrepancies.push(`${report.flatLabel} area control failed: ${report.actualCarpetSqM} m\xB2 drawn vs ${report.targetCarpetSqM} m\xB2 target (${report.deviationPct}%).`);
    }
  }
  for (const check of schematic.spatialChecks ?? []) {
    if (check.status === "FAIL")
      discrepancies.push(`Spatial check ${check.code} failed: ${check.message}`);
  }
  return {
    matches: discrepancies.length === 0,
    discrepancies,
    feasibilityFail
  };
}
var SQM_TO_SQFT, M_TO_FT;
var init_manifest = __esm({
  "../ai-orchestration/dist/apartment/manifest.js"() {
    "use strict";
    init_jurisdiction();
    init_typologies();
    init_site_defaults();
    SQM_TO_SQFT = 10.7639104;
    M_TO_FT = 3.28084;
  }
});

// ../ai-orchestration/dist/orchestration/aspect-ratio.js
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
var MIN_OUTPUT_DIMENSION_PX, MAX_OUTPUT_DIMENSION_PX, OUTPUT_DIMENSION_STEP_PX, TARGET_PIXEL_BUDGET, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO;
var init_aspect_ratio = __esm({
  "../ai-orchestration/dist/orchestration/aspect-ratio.js"() {
    "use strict";
    MIN_OUTPUT_DIMENSION_PX = 512;
    MAX_OUTPUT_DIMENSION_PX = 1536;
    OUTPUT_DIMENSION_STEP_PX = 64;
    TARGET_PIXEL_BUDGET = 1024 * 1024;
    MIN_ASPECT_RATIO = 0.5;
    MAX_ASPECT_RATIO = 2;
  }
});

// ../ai-orchestration/dist/orchestration/image-prompt-compiler.js
function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function buildRoomSchedule(input) {
  const { requirements, program } = input;
  const hard = requirements.hard;
  const soft = requirements.soft;
  if (program && program.items.length > 0) {
    const parts2 = program.items.filter((item) => item.quantity > 0).map((item) => {
      const m2 = (item.preferredAreaMm2 / 1e6).toFixed(1);
      return item.quantity > 1 ? `${item.quantity} x ${item.name} (~${m2} m2 each)` : `${item.name} (~${m2} m2)`;
    });
    if (parts2.length > 0)
      return parts2.join(", ");
  }
  const parts = [];
  if (hard.bedroomCount > 0)
    parts.push(`${hard.bedroomCount} bedroom(s)`);
  if (hard.bathroomCount > 0)
    parts.push(`${hard.bathroomCount} bathroom(s)`);
  if (hard.livingRoomRequired)
    parts.push("living room");
  if (hard.kitchenRequired)
    parts.push(soft.openKitchen ? "open kitchen" : "kitchen");
  if (hard.diningRoomRequired)
    parts.push("dining room");
  if (hard.staircaseRequired)
    parts.push("staircase");
  if (hard.liftRequired)
    parts.push("lift");
  if (soft.poojaRoom)
    parts.push("pooja room");
  if (soft.studyRoom)
    parts.push("study");
  if (soft.servantQuarter)
    parts.push("servant quarter");
  for (const custom of hard.customRooms ?? []) {
    parts.push(`${custom.count} x ${custom.name ?? String(custom.type)}`);
  }
  return parts.join(", ");
}
function compileFloorPlanImagePrompt(input) {
  const { requirements, site } = input;
  const { hard } = requirements;
  const { setbacks } = site;
  const aspect = computeAspectAdaptedDimensions(site.plotWidth / 1e3, site.plotDepth / 1e3);
  const width = input.width ?? aspect.width;
  const height = input.height ?? aspect.height;
  const seed2 = input.seed;
  const plotWidthM = (site.plotWidth / 1e3).toFixed(2);
  const plotDepthM = (site.plotDepth / 1e3).toFixed(2);
  const floors = Math.max(1, hard.floorsCount);
  const floorLabel = floors === 1 ? "single-storey ground floor" : `${floors}-storey`;
  const brief = (input.additionalPrompt ?? requirements.rawUserPrompt ?? "").trim();
  const roomSchedule = buildRoomSchedule(input);
  const directiveLines = [
    "Generate ONE professional top-down 2D residential floor plan (single-family villa / independent residence).",
    "",
    `PROJECT: ${requirements.projectName}, ${floorLabel}.`,
    `PLOT PROPORTIONS: ${plotWidthM}m (width) x ${plotDepthM}m (depth), road facing ${titleCase(site.roadFacing)}.`,
    `SETBACKS: front ${setbacks.front}mm, rear ${setbacks.rear}mm, left ${setbacks.left}mm, right ${setbacks.right}mm.`,
    `ROOM PROGRAM: ${roomSchedule || "standard residential layout"}.`,
    ...hard.parkingRequired && hard.parkingSpacesCount > 0 ? [`PARKING: dedicated parking for ${hard.parkingSpacesCount} car(s).`] : [],
    ...brief.length > 0 ? [`ADDITIONAL BRIEF: ${brief}`] : [],
    "",
    "MANDATORY DIRECTIVES:",
    "- Top-down orthographic 2D architectural drafting, crisp black linework on pure white background.",
    "- Clear room separation, proper wall thicknesses, door swings, and window openings.",
    "- English architectural labels only (LIVING, DINING, KITCHEN, BEDROOM, BATH, FOYER, PARKING).",
    ...input.referenceImages && input.referenceImages.length > 0 ? ["- Use the supplied reference images for visual drafting style. Current project requirements always override references."] : [],
    "",
    "STRICT PROHIBITIONS:",
    "Do not use 3D, perspective, shadows, photorealism, furniture clutter, artistic textures, or non-Latin text."
  ];
  const prompt = directiveLines.join("\n");
  return {
    schemaVersion: 1,
    promptVersion: FLOOR_PLAN_PROMPT_VERSION,
    prompt,
    negativePrompt: NEGATIVE_PROMPT,
    seed: seed2,
    width,
    height,
    referenceImages: input.referenceImages,
    referenceDiagnostics: input.referenceDiagnostics,
    metadata: {
      ...requirements.projectId ? { projectId: requirements.projectId } : {},
      projectName: requirements.projectName,
      plotWidthMm: site.plotWidth,
      plotDepthMm: site.plotDepth,
      floorsCount: floors,
      roadFacing: site.roadFacing,
      projectType: "residential_independent",
      referenceDiagnostics: input.referenceDiagnostics
    }
  };
}
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
  const { site, apartmentConfig, seed: seed2 } = input;
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
    seed: seed2,
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
var FLOOR_PLAN_PROMPT_VERSION, NEGATIVE_PROMPT, APARTMENT_NEGATIVE_PROMPT, APARTMENT_CONCEPT_ROOM_WORDS, APARTMENT_CONCEPT_CORE_WORDS;
var init_image_prompt_compiler = __esm({
  "../ai-orchestration/dist/orchestration/image-prompt-compiler.js"() {
    "use strict";
    init_manifest();
    init_aspect_ratio();
    FLOOR_PLAN_PROMPT_VERSION = 3;
    NEGATIVE_PROMPT = "perspective, 3d render, photorealistic, isometric, furniture, landscaping, people, cars, textures, shadows, artistic, watercolor, decorative, blurry, colored photo";
    APARTMENT_NEGATIVE_PROMPT = "NO VILLA, NO SINGLE FAMILY HOUSE, NO EXTRA FLATS, NO MISSING FLATS, NO MERGED FLATS, NO WRONG UNIT MIX, NO EXTRA BEDROOMS, NO MISSING BEDROOMS, NO EXTRA LIFTS, NO MISSING LIFTS, NO EXTRA STAIRS, NO MISSING STAIRS, NO RANDOM CORE, NO RANDOM AMENITIES, NO RANDOM ROOMS, NO CYRILLIC, NO RUSSIAN, NO NON-LATIN SCRIPT, NO GIBBERISH, NO PSEUDO-TEXT, NO RANDOM NUMBERS, NO WATERMARK, NO LOGO, NO 3D, NO PERSPECTIVE, NO PHOTOREALISTIC INTERIOR, NO HAND DRAWING, NO ARTISTIC RENDERING, NO DISTORTED WALLS, NO OVERLAPPING FLATS, NO FLOATING WALLS";
    APARTMENT_CONCEPT_ROOM_WORDS = ["LIVING", "DINING", "KITCHEN", "BEDROOM", "BATH", "UTILITY", "FOYER"];
    APARTMENT_CONCEPT_CORE_WORDS = ["LIFT", "STAIR", "LOBBY"];
  }
});

// ../ai-orchestration/dist/providers/image-generation.js
function logTransportDiagnostic(stage, details) {
  const errorSummary = details.error instanceof Error ? `${details.error.name}: ${details.error.message}` : details.error !== void 0 ? String(details.error) : void 0;
  console.warn("[CloudflareImageProvider][flux_transport]", JSON.stringify({
    stage,
    model: details.model,
    hasReferences: details.hasReferences,
    fieldsSent: details.fieldsSent,
    status: details.status,
    ok: details.ok,
    contentType: details.contentType,
    detail: details.detail,
    retryAfterReferenceRejection: details.retryAfterReferenceRejection,
    error: errorSummary
  }));
}
function buildCloudflareImageRequestBody(request, options = {}) {
  const body = {
    prompt: request.prompt,
    seed: request.seed
  };
  if ((options.includeSteps ?? false) && options.steps !== void 0) {
    body.steps = options.steps;
  }
  if ((options.includeNegativePrompt ?? false) && request.negativePrompt.trim().length > 0) {
    body.negative_prompt = request.negativePrompt;
  }
  if (options.includeDimensions ?? true) {
    body.width = request.width;
    body.height = request.height;
  }
  return body;
}
function buildCloudflareFormData(body, referenceImages) {
  const form = new FormData();
  for (const [key, value] of Object.entries(body)) {
    if (value !== void 0 && value !== null) {
      form.append(key, String(value));
    }
  }
  if (referenceImages && referenceImages.length > 0) {
    referenceImages.slice(0, 4).forEach((ref, index) => {
      try {
        const buffer = Buffer.from(ref.base64Data, "base64");
        const blob = new Blob([buffer], { type: ref.mimeType || "image/png" });
        form.append(`input_image_${index}`, blob, `${ref.name || `ref_${index}.png`}`);
      } catch (err) {
        console.warn(`[CloudflareImageProvider] Could not append reference image ${index}:`, err);
      }
    });
  }
  return form;
}
function formatCloudflareErrors(errors) {
  if (!Array.isArray(errors))
    return "unknown error";
  return errors.map((err) => {
    if (typeof err === "string")
      return err;
    if (err && typeof err === "object") {
      const obj = err;
      return typeof obj.message === "string" ? obj.message : JSON.stringify(err);
    }
    return String(err);
  }).join("; ");
}
function contentTypeOf(envelope) {
  const contentType = envelope.contentType;
  return typeof contentType === "string" ? contentType : void 0;
}
var ImageProviderError, DEFAULT_FLUX_MODEL, CloudflareImageProvider;
var init_image_generation = __esm({
  "../ai-orchestration/dist/providers/image-generation.js"() {
    "use strict";
    ImageProviderError = class _ImageProviderError extends Error {
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
    DEFAULT_FLUX_MODEL = "@cf/black-forest-labs/flux-2-klein-4b";
    CloudflareImageProvider = class {
      name = "cloudflare-workers-ai";
      accountId;
      apiToken;
      model;
      steps;
      includeSteps;
      timeoutMs;
      endpoint;
      fetchImpl;
      includeNegativePrompt;
      includeDimensions;
      constructor(options) {
        this.accountId = options.accountId.trim();
        this.apiToken = options.apiToken.trim();
        this.model = options.model?.trim() || DEFAULT_FLUX_MODEL;
        this.steps = options.steps ?? 4;
        this.includeSteps = options.includeSteps ?? false;
        this.timeoutMs = options.timeoutMs ?? 6e4;
        this.includeNegativePrompt = options.includeNegativePrompt ?? false;
        this.includeDimensions = options.includeDimensions ?? true;
        this.fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
        const sanitizedModel = this.model.replace(/^\/+/, "");
        this.endpoint = options.endpointOverride ?? (this.isConfigured() ? `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(this.accountId)}/ai/run/${sanitizedModel}` : null);
      }
      isConfigured() {
        return this.accountId.length > 0 && this.apiToken.length > 0;
      }
      async isAvailable() {
        return this.isConfigured();
      }
      getModel() {
        return this.model;
      }
      async generateFloorPlan(request) {
        if (!this.isConfigured() || !this.endpoint) {
          throw new ImageProviderError("IMAGE_PROVIDER_NOT_CONFIGURED", "Cloudflare image generation is not configured on the server (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN missing).");
        }
        let hasReferences = false;
        let body;
        let formData;
        try {
          hasReferences = Boolean(request.referenceImages && request.referenceImages.length > 0);
          body = buildCloudflareImageRequestBody(request, {
            steps: this.steps,
            includeSteps: this.includeSteps,
            includeNegativePrompt: this.includeNegativePrompt,
            includeDimensions: this.includeDimensions
          });
        } catch (err) {
          logTransportDiagnostic("request_construction_failure", { model: this.model, error: err });
          throw new ImageProviderError("IMAGE_PROVIDER_INVALID_RESPONSE", `Failed to construct Cloudflare FLUX request body: ${err instanceof Error ? err.message : String(err)}`);
        }
        try {
          formData = buildCloudflareFormData(body, request.referenceImages);
        } catch (err) {
          logTransportDiagnostic("reference_preparation_failure", { model: this.model, hasReferences, error: err });
          throw new ImageProviderError("REFERENCE_RESIZE_ERROR", `Failed to prepare reference images for Cloudflare FLUX request: ${err instanceof Error ? err.message : String(err)}`);
        }
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        const startedAt = Date.now();
        try {
          let response2;
          try {
            response2 = await this.fetchImpl(this.endpoint, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${this.apiToken}`,
                "Accept": "image/png, application/json"
              },
              body: formData,
              signal: controller.signal
            });
          } catch (fetchErr) {
            logTransportDiagnostic("network_fetch_failure", {
              model: this.model,
              hasReferences,
              fieldsSent: Object.keys(body),
              error: fetchErr
            });
            throw fetchErr;
          }
          logTransportDiagnostic("http_response", {
            model: this.model,
            hasReferences,
            fieldsSent: Object.keys(body),
            status: response2.status,
            ok: response2.ok,
            contentType: response2.headers.get("content-type") ?? void 0
          });
          let referencesWereDropped = false;
          if (!response2.ok && response2.status === 400 && hasReferences) {
            referencesWereDropped = true;
            console.warn("[CloudflareImageProvider] Multi-reference image input not accepted by endpoint. Falling back to detailed textual architectural reference specification...");
            const plainFormData = buildCloudflareFormData(body);
            try {
              response2 = await this.fetchImpl(this.endpoint, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${this.apiToken}`,
                  "Accept": "image/png, application/json"
                },
                body: plainFormData,
                signal: controller.signal
              });
            } catch (fetchErr) {
              logTransportDiagnostic("network_fetch_failure", {
                model: this.model,
                hasReferences: false,
                fieldsSent: Object.keys(body),
                error: fetchErr,
                retryAfterReferenceRejection: true
              });
              throw fetchErr;
            }
            logTransportDiagnostic("http_response", {
              model: this.model,
              hasReferences: false,
              fieldsSent: Object.keys(body),
              status: response2.status,
              ok: response2.ok,
              contentType: response2.headers.get("content-type") ?? void 0,
              retryAfterReferenceRejection: true
            });
          }
          if (!response2.ok) {
            const detail = await this.describeError(response2);
            logTransportDiagnostic("http_error", { model: this.model, status: response2.status, detail });
            if (response2.status === 401 || response2.status === 403) {
              throw new ImageProviderError("CLOUDFLARE_AUTH_ERROR", `Cloudflare authentication failed (HTTP ${response2.status}). Verify credentials configuration.`, response2.status);
            }
            if (response2.status === 408 || response2.status === 504) {
              throw new ImageProviderError("CLOUDFLARE_TIMEOUT", `Cloudflare image generation timed out at gateway (HTTP ${response2.status}).`, response2.status);
            }
            throw new ImageProviderError("CLOUDFLARE_HTTP_ERROR", `Cloudflare image generation failed with HTTP ${response2.status}. ${detail}`.trim(), response2.status);
          }
          let finalRefDiagnostics = request.referenceDiagnostics;
          if (referencesWereDropped) {
            finalRefDiagnostics = {
              bucket: request.referenceDiagnostics?.bucket ?? null,
              requestedReferenceIds: request.referenceDiagnostics?.requestedReferenceIds ?? [],
              selectedReferenceIds: request.referenceDiagnostics?.selectedReferenceIds ?? [],
              attachedReferenceIds: [],
              drops: [
                ...request.referenceDiagnostics?.drops ?? [],
                {
                  id: "all_references",
                  reason: "Endpoint returned HTTP 400 with multipart references; retried without reference images."
                }
              ],
              status: "DROPPED"
            };
          }
          const contentType = response2.headers.get("content-type") ?? "";
          try {
            if (contentType.startsWith("image/")) {
              return await this.fromBytes(response2, request, contentType, startedAt, finalRefDiagnostics);
            }
            return await this.fromJson(response2, request, startedAt, finalRefDiagnostics);
          } catch (decodeErr) {
            logTransportDiagnostic("response_decode_failure", { model: this.model, contentType, error: decodeErr });
            throw decodeErr;
          }
        } catch (error) {
          if (error instanceof ImageProviderError)
            throw error;
          if (error instanceof Error && error.name === "AbortError") {
            throw new ImageProviderError("CLOUDFLARE_TIMEOUT", "Cloudflare image generation timed out.");
          }
          const causeMsg = error instanceof Error && error.cause ? String(error.cause) : error instanceof Error ? error.message : "Unknown network failure";
          throw new ImageProviderError("CLOUDFLARE_NETWORK_ERROR", `Cloudflare network connection failed: ${causeMsg}`);
        } finally {
          clearTimeout(timeout);
        }
      }
      async fromJson(response2, request, startedAt, referenceDiagnostics) {
        let payload;
        try {
          payload = await response2.json();
        } catch {
          throw new ImageProviderError("CLOUDFLARE_RESPONSE_DECODE_ERROR", "Cloudflare returned malformed JSON.");
        }
        if (payload === null || typeof payload !== "object") {
          throw new ImageProviderError("CLOUDFLARE_RESPONSE_DECODE_ERROR", "Cloudflare returned a non-object envelope.");
        }
        const envelope = payload;
        if (envelope.success === false) {
          const errors = formatCloudflareErrors(envelope.errors);
          throw new ImageProviderError("CLOUDFLARE_HTTP_ERROR", `Cloudflare reported failure: ${errors}`);
        }
        const result = envelope.result;
        const imageBase64 = typeof result === "string" ? result : result !== null && typeof result === "object" ? result.image : void 0;
        if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
          throw new ImageProviderError("CLOUDFLARE_RESPONSE_DECODE_ERROR", "Cloudflare response contained no image payload.");
        }
        let fallbackMime = "image/png";
        if (imageBase64.startsWith("/9j/")) {
          fallbackMime = "image/jpeg";
        }
        return {
          imageBase64,
          mimeType: this.mimeTypeFrom(contentTypeOf(envelope), fallbackMime),
          provider: this.name,
          model: this.model,
          seed: request.seed,
          promptVersion: request.promptVersion,
          prompt: request.prompt,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          latencyMs: Date.now() - startedAt,
          referenceDiagnostics
        };
      }
      async fromBytes(response2, request, contentType, startedAt, referenceDiagnostics) {
        const buffer = await response2.arrayBuffer();
        if (buffer.byteLength === 0) {
          throw new ImageProviderError("CLOUDFLARE_RESPONSE_DECODE_ERROR", "Cloudflare returned an empty image payload.");
        }
        return {
          imageBase64: Buffer.from(buffer).toString("base64"),
          mimeType: this.mimeTypeFrom(contentType, "image/png"),
          provider: this.name,
          model: this.model,
          seed: request.seed,
          promptVersion: request.promptVersion,
          prompt: request.prompt,
          generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
          latencyMs: Date.now() - startedAt,
          referenceDiagnostics
        };
      }
      mimeTypeFrom(contentType, fallback) {
        if (contentType?.includes("jpeg") || contentType?.includes("jpg"))
          return "image/jpeg";
        if (contentType?.includes("png"))
          return "image/png";
        return fallback;
      }
      async describeError(response2) {
        try {
          const payload = await response2.json();
          if (payload !== null && typeof payload === "object") {
            const envelope = payload;
            if (Array.isArray(envelope.errors) && envelope.errors.length > 0)
              return formatCloudflareErrors(envelope.errors);
            if (typeof envelope.message === "string")
              return envelope.message;
          }
        } catch {
        }
        return "";
      }
    };
  }
});

// ../ai-orchestration/dist/providers/pollinations-image.js
function parsePollinationsModelCapabilities(catalog, model) {
  const list = Array.isArray(catalog) ? catalog : catalog && typeof catalog === "object" && Array.isArray(catalog.data) ? catalog.data : [];
  const entry = list.find((item) => {
    if (!item || typeof item !== "object")
      return false;
    const m = item;
    return m.name === model || Array.isArray(m.aliases) && m.aliases.includes(model);
  });
  if (!entry) {
    return {
      model,
      found: false,
      acceptsImageInput: false,
      supportsEdits: false,
      supportsGenerations: false,
      maxReferenceImages: 0,
      paidOnly: null,
      source: "CATALOG",
      detail: `Model ${model} is not listed in the Pollinations image catalog.`
    };
  }
  const inputs = Array.isArray(entry.input_modalities) ? entry.input_modalities : [];
  const endpoints = Array.isArray(entry.supported_endpoints) ? entry.supported_endpoints : [];
  const maxRefs = typeof entry.max_reference_images === "number" && entry.max_reference_images > 0 ? Math.floor(entry.max_reference_images) : 0;
  const acceptsImageInput = inputs.includes("image");
  const supportsEdits = endpoints.includes(POLLINATIONS_EDITS_PATH);
  return {
    model,
    found: true,
    acceptsImageInput,
    supportsEdits,
    supportsGenerations: endpoints.includes(POLLINATIONS_GENERATIONS_PATH),
    maxReferenceImages: acceptsImageInput && supportsEdits ? maxRefs : 0,
    paidOnly: typeof entry.paid_only === "boolean" ? entry.paid_only : null,
    source: "CATALOG"
  };
}
function buildPollinationsImageRequest(request, model, references) {
  const body = {
    model,
    prompt: request.prompt,
    size: `${request.width}x${request.height}`,
    n: 1,
    response_format: "b64_json"
  };
  if (references.length === 0) {
    return { endpointPath: POLLINATIONS_GENERATIONS_PATH, body, referenceIdsSent: [] };
  }
  body.image = references.map((ref) => ({ image_url: `data:${ref.mimeType || "image/png"};base64,${ref.base64Data}` }));
  return { endpointPath: POLLINATIONS_EDITS_PATH, body, referenceIdsSent: references.map((r) => r.id) };
}
function detectMime(buf) {
  if (buf.length > 8 && buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71)
    return "image/png";
  if (buf.length > 3 && buf[0] === 255 && buf[1] === 216 && buf[2] === 255)
    return "image/jpeg";
  return null;
}
async function describePollinationsError(response2) {
  let text = "";
  try {
    text = await response2.text();
  } catch {
    return "";
  }
  try {
    const json = JSON.parse(text);
    const err = json.error;
    if (typeof err === "string")
      return err.slice(0, 400);
    if (err && typeof err === "object" && typeof err.message === "string")
      return String(err.message).slice(0, 400);
    if (typeof json.message === "string")
      return json.message.slice(0, 400);
  } catch {
  }
  return text.replace(/\s+/g, " ").slice(0, 400);
}
function finalDiagnostics(base, sentIds, drops) {
  if (!base && drops.length === 0)
    return base;
  const attached = sentIds.filter((id) => id !== STRUCTURAL_REFERENCE_ID);
  const baseAttached = base?.attachedReferenceIds ?? [];
  const status = drops.length === 0 ? base?.status ?? "AVAILABLE" : attached.length === 0 ? "DROPPED" : "PARTIAL";
  return {
    bucket: base?.bucket ?? null,
    requestedReferenceIds: base?.requestedReferenceIds ?? [],
    selectedReferenceIds: base?.selectedReferenceIds ?? [],
    attachedReferenceIds: drops.length === 0 ? baseAttached : attached,
    drops: [...base?.drops ?? [], ...drops],
    status,
    ...base?.distinctReferencesAvailable !== void 0 ? { distinctReferencesAvailable: base.distinctReferencesAvailable } : {}
  };
}
var POLLINATIONS_PROVIDER_NAME, POLLINATIONS_BASE_URL, DEFAULT_POLLINATIONS_IMAGE_MODEL, POLLINATIONS_EDITS_PATH, POLLINATIONS_GENERATIONS_PATH, POLLINATIONS_IMAGE_MODELS_PATH, POLLINATIONS_KEY_INFO_PATH, STRUCTURAL_REFERENCE_ID, PollinationsImageProvider;
var init_pollinations_image = __esm({
  "../ai-orchestration/dist/providers/pollinations-image.js"() {
    "use strict";
    init_image_generation();
    POLLINATIONS_PROVIDER_NAME = "pollinations";
    POLLINATIONS_BASE_URL = "https://gen.pollinations.ai";
    DEFAULT_POLLINATIONS_IMAGE_MODEL = "qwen/qwen-image-2.1";
    POLLINATIONS_EDITS_PATH = "/v1/images/edits";
    POLLINATIONS_GENERATIONS_PATH = "/v1/images/generations";
    POLLINATIONS_IMAGE_MODELS_PATH = "/image/models";
    POLLINATIONS_KEY_INFO_PATH = "/account/key";
    STRUCTURAL_REFERENCE_ID = "schematic_scaffold";
    PollinationsImageProvider = class {
      name = POLLINATIONS_PROVIDER_NAME;
      apiKey;
      model;
      baseUrl;
      timeoutMs;
      fetchImpl;
      capabilitiesPromise = null;
      constructor(options) {
        this.apiKey = options.apiKey.trim();
        this.model = options.model?.trim() || DEFAULT_POLLINATIONS_IMAGE_MODEL;
        this.baseUrl = (options.baseUrl?.trim() || POLLINATIONS_BASE_URL).replace(/\/+$/, "");
        this.timeoutMs = options.timeoutMs ?? 18e4;
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
      getBaseUrl() {
        return this.baseUrl;
      }
      /** Credential-safe structured log line (never the key, never image bytes). */
      log(stage, details) {
        const line = JSON.stringify({ stage, provider: this.name, model: this.model, ...details });
        const safe = this.apiKey ? line.split(this.apiKey).join("<redacted>") : line;
        if (stage === "http_error" || stage === "network_failure" || stage === "decode_failure")
          console.warn("[PollinationsImageProvider]", safe);
        else
          console.log("[PollinationsImageProvider]", safe);
      }
      redact(text) {
        return this.apiKey ? text.split(this.apiKey).join("<redacted>") : text;
      }
      /** Reads (and caches on success) the model's capabilities from the public catalog. */
      async getModelCapabilities() {
        if (!this.capabilitiesPromise) {
          this.capabilitiesPromise = this.fetchCapabilities().then((caps) => {
            if (caps.source === "UNAVAILABLE")
              this.capabilitiesPromise = null;
            return caps;
          });
        }
        return this.capabilitiesPromise;
      }
      async fetchCapabilities() {
        const unavailable = (detail) => ({
          model: this.model,
          found: false,
          acceptsImageInput: false,
          supportsEdits: false,
          supportsGenerations: false,
          maxReferenceImages: 0,
          paidOnly: null,
          source: "UNAVAILABLE",
          detail
        });
        try {
          const res = await this.fetchImpl(`${this.baseUrl}${POLLINATIONS_IMAGE_MODELS_PATH}`, { signal: AbortSignal.timeout(2e4) });
          if (!res.ok) {
            const caps2 = unavailable(`Model catalog returned HTTP ${res.status}.`);
            this.log("capabilities", { status: res.status, detail: caps2.detail });
            return caps2;
          }
          const caps = parsePollinationsModelCapabilities(await res.json(), this.model);
          this.log("capabilities", {
            found: caps.found,
            acceptsImageInput: caps.acceptsImageInput,
            supportsEdits: caps.supportsEdits,
            maxReferenceImages: caps.maxReferenceImages,
            paidOnly: caps.paidOnly
          });
          return caps;
        } catch (err) {
          const caps = unavailable(`Model catalog request failed: ${err instanceof Error ? err.message : String(err)}`);
          this.log("capabilities", { detail: caps.detail });
          return caps;
        }
      }
      /** Health check without generating (and without spending): key validity + model catalog. */
      async checkAccess() {
        if (!this.isConfigured())
          return { status: "NOT_CONFIGURED", reachable: false, detail: "POLLINATIONS_API_KEY is not configured" };
        try {
          const res = await this.fetchImpl(`${this.baseUrl}${POLLINATIONS_KEY_INFO_PATH}`, {
            headers: { Authorization: `Bearer ${this.apiKey}` },
            signal: AbortSignal.timeout(8e3)
          });
          if (res.status === 401 || res.status === 403)
            return { status: "AUTH_FAILED", reachable: false, detail: `Pollinations key rejected (HTTP ${res.status})` };
          if (res.status === 429)
            return { status: "RATE_LIMITED", reachable: false, detail: "Pollinations rate limit (HTTP 429)" };
          if (!res.ok)
            return { status: "NETWORK_ERROR", reachable: false, detail: `Pollinations key check returned HTTP ${res.status}` };
          const info = await res.json().catch(() => ({}));
          if (info.valid === false)
            return { status: "AUTH_FAILED", reachable: false, detail: "Pollinations reports the key as invalid" };
          const permitted = info.permissions?.models;
          if (Array.isArray(permitted) && !permitted.includes(this.model)) {
            return { status: "MODEL_UNAVAILABLE", reachable: false, detail: `Key is not permitted to use ${this.model}` };
          }
          const capabilities = await this.getModelCapabilities();
          if (capabilities.source === "CATALOG" && !capabilities.found) {
            return { status: "MODEL_UNAVAILABLE", reachable: false, detail: capabilities.detail, capabilities };
          }
          return { status: "REACHABLE", reachable: true, capabilities, ...capabilities.source === "UNAVAILABLE" ? { detail: capabilities.detail } : {} };
        } catch (err) {
          if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
            return { status: "TIMEOUT", reachable: false, detail: "Pollinations key check timed out" };
          }
          return { status: "NETWORK_ERROR", reachable: false, detail: this.redact(err instanceof Error ? err.message : String(err)) };
        }
      }
      async generateFloorPlan(request) {
        if (!this.isConfigured()) {
          throw new ImageProviderError("IMAGE_PROVIDER_NOT_CONFIGURED", "Pollinations image generation is not configured on the server (POLLINATIONS_API_KEY missing).");
        }
        const requested = request.referenceImages ?? [];
        let sent = [];
        const drops = [];
        let capabilities = null;
        if (requested.length > 0) {
          capabilities = await this.getModelCapabilities();
          const canSendImages = capabilities.acceptsImageInput && capabilities.supportsEdits && capabilities.maxReferenceImages > 0;
          const hasStructural = requested.some((r) => r.id === STRUCTURAL_REFERENCE_ID);
          if (!canSendImages) {
            const why = capabilities.source === "UNAVAILABLE" ? `model metadata unavailable (${capabilities.detail ?? "unknown"})` : `catalog does not confirm image input on ${POLLINATIONS_EDITS_PATH} for ${this.model}`;
            if (hasStructural) {
              this.log("reference_selection", { requested: requested.map((r) => r.id), sent: [], detail: why });
              throw new ImageProviderError("IMAGE_PROVIDER_CAPABILITY_ERROR", `Pollinations ${this.model}: the deterministic layout drawing cannot be sent (${why}). No image was generated.`);
            }
            for (const r of requested)
              drops.push({ id: r.id, reason: `Not sent: ${why}.` });
          } else {
            sent = requested.slice(0, capabilities.maxReferenceImages);
            for (const r of requested.slice(capabilities.maxReferenceImages)) {
              drops.push({ id: r.id, reason: `Not sent: ${this.model} accepts at most ${capabilities.maxReferenceImages} reference image(s).` });
            }
          }
          this.log("reference_selection", { requested: requested.map((r) => r.id), sent: sent.map((r) => r.id), dropped: drops.map((d) => d.id) });
        }
        const built = buildPollinationsImageRequest(request, this.model, sent);
        const url = `${this.baseUrl}${built.endpointPath}`;
        this.log("request", {
          endpoint: built.endpointPath,
          size: built.body.size,
          seed: request.seed,
          seedSent: false,
          referencesSent: built.referenceIdsSent,
          promptChars: request.prompt.length,
          fieldsSent: Object.keys(built.body)
        });
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        const startedAt = Date.now();
        try {
          let response2;
          try {
            response2 = await this.fetchImpl(url, {
              method: "POST",
              headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify(built.body),
              signal: controller.signal
            });
          } catch (err) {
            if (err instanceof Error && err.name === "AbortError") {
              this.log("network_failure", { endpoint: built.endpointPath, latencyMs: Date.now() - startedAt, detail: `timeout after ${this.timeoutMs} ms` });
              throw new ImageProviderError("IMAGE_PROVIDER_TIMEOUT", `Pollinations ${this.model} timed out after ${this.timeoutMs} ms.`);
            }
            const cause = err instanceof Error && err.cause ? String(err.cause) : err instanceof Error ? err.message : String(err);
            this.log("network_failure", { endpoint: built.endpointPath, latencyMs: Date.now() - startedAt, detail: this.redact(cause) });
            throw new ImageProviderError("IMAGE_PROVIDER_NETWORK_ERROR", `Pollinations network request failed: ${this.redact(cause)}`);
          }
          this.log("http_response", { endpoint: built.endpointPath, status: response2.status, ok: response2.ok, contentType: response2.headers.get("content-type") ?? void 0, latencyMs: Date.now() - startedAt });
          if (!response2.ok) {
            const detail = this.redact(await describePollinationsError(response2));
            this.log("http_error", { endpoint: built.endpointPath, status: response2.status, detail });
            const msg = `Pollinations ${this.model} failed with HTTP ${response2.status}${detail ? `: ${detail}` : ""}`;
            if (response2.status === 401 || response2.status === 403)
              throw new ImageProviderError("POLLINATIONS_AUTH_ERROR", msg, response2.status);
            if (response2.status === 402)
              throw new ImageProviderError("POLLINATIONS_PAYMENT_REQUIRED", msg, response2.status);
            if (response2.status === 429)
              throw new ImageProviderError("POLLINATIONS_RATE_LIMITED", msg, response2.status);
            if (response2.status === 408 || response2.status === 504)
              throw new ImageProviderError("IMAGE_PROVIDER_TIMEOUT", msg, response2.status);
            throw new ImageProviderError("IMAGE_PROVIDER_HTTP_ERROR", msg, response2.status);
          }
          let imageBytes;
          try {
            imageBytes = await this.decodeImage(response2, controller.signal);
          } catch (err) {
            const detail = err instanceof Error ? err.message : String(err);
            this.log("decode_failure", { endpoint: built.endpointPath, detail: this.redact(detail) });
            if (err instanceof ImageProviderError)
              throw err;
            throw new ImageProviderError("IMAGE_PROVIDER_INVALID_RESPONSE", `Pollinations response could not be decoded: ${this.redact(detail)}`);
          }
          const mimeType = detectMime(imageBytes);
          if (!mimeType) {
            this.log("decode_failure", { endpoint: built.endpointPath, detail: `unsupported image format (magic ${imageBytes.subarray(0, 4).toString("hex")})` });
            throw new ImageProviderError("IMAGE_PROVIDER_INVALID_RESPONSE", "Pollinations returned an image that is neither PNG nor JPEG.");
          }
          const latencyMs = Date.now() - startedAt;
          this.log("success", { endpoint: built.endpointPath, mimeType, bytes: imageBytes.length, latencyMs, referencesSent: built.referenceIdsSent });
          return {
            imageBase64: imageBytes.toString("base64"),
            mimeType,
            provider: this.name,
            model: this.model,
            seed: request.seed,
            promptVersion: request.promptVersion,
            prompt: request.prompt,
            generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            latencyMs,
            referenceDiagnostics: finalDiagnostics(request.referenceDiagnostics, built.referenceIdsSent, drops),
            providerRequest: {
              endpoint: built.endpointPath,
              size: String(built.body.size),
              seedSent: false,
              referenceIdsSent: built.referenceIdsSent,
              ...capabilities ? { maxReferenceImages: capabilities.maxReferenceImages } : {}
            }
          };
        } finally {
          clearTimeout(timer);
        }
      }
      async decodeImage(response2, signal) {
        const contentType = response2.headers.get("content-type") ?? "";
        if (contentType.startsWith("image/")) {
          const buf = Buffer.from(await response2.arrayBuffer());
          if (buf.length === 0)
            throw new ImageProviderError("IMAGE_PROVIDER_INVALID_RESPONSE", "Pollinations returned an empty image.");
          return buf;
        }
        const payload = await response2.json();
        const first = Array.isArray(payload?.data) ? payload.data[0] : void 0;
        if (first && typeof first.b64_json === "string" && first.b64_json.length > 0) {
          return Buffer.from(first.b64_json.replace(/^data:[^;]+;base64,/, ""), "base64");
        }
        if (first && typeof first.url === "string" && /^https:\/\//.test(first.url)) {
          const media = await this.fetchImpl(first.url, { signal });
          if (!media.ok)
            throw new ImageProviderError("IMAGE_PROVIDER_INVALID_RESPONSE", `Pollinations media URL returned HTTP ${media.status}.`);
          return Buffer.from(await media.arrayBuffer());
        }
        throw new ImageProviderError("IMAGE_PROVIDER_INVALID_RESPONSE", "Pollinations response contained no image data (data[0].b64_json / url).");
      }
    };
  }
});

// ../ai-orchestration/dist/apartment/structural-renderer.js
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
  svgElements.push(`<rect class="common-lobby" x="${lobbySx.toFixed(1)}" y="${lobbySy.toFixed(1)}" width="${lobbySw.toFixed(1)}" height="${lobbySh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${coreStroke}" />`);
  for (const c of rep.commonCore.circulationBoundaries) {
    const csx = toScreenX(c.bounds.x);
    const csy = toScreenY(c.bounds.y);
    const csw = c.bounds.width * scale;
    const csh = c.bounds.height * scale;
    rasterizer.fillRect(csx, csy, csw, csh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
    svgElements.push(`<rect class="common-corridor" x="${csx.toFixed(1)}" y="${csy.toFixed(1)}" width="${csw.toFixed(1)}" height="${csh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${coreStroke}" />`);
  }
  for (const bal of rep.balconies) {
    const bsx = toScreenX(bal.bounds.x);
    const bsy = toScreenY(bal.bounds.y);
    const bsw = bal.bounds.width * scale;
    const bsh = bal.bounds.height * scale;
    rasterizer.fillRect(bsx, bsy, bsw, bsh, COL_BALCONY_FILL.r, COL_BALCONY_FILL.g, COL_BALCONY_FILL.b);
    rasterizer.drawRectOutline(bsx, bsy, bsw, bsh, Math.max(1, Math.round(roomPartitionStroke * 0.8)), COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b);
    svgElements.push(`<rect class="balcony" x="${bsx.toFixed(1)}" y="${bsy.toFixed(1)}" width="${bsw.toFixed(1)}" height="${bsh.toFixed(1)}" fill="#FAFAFA" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(roomPartitionStroke * 0.8))}" stroke-dasharray="4,2" />`);
  }
  for (const room of rep.roomBoundaries) {
    const rsx = toScreenX(room.bounds.x);
    const rsy = toScreenY(room.bounds.y);
    const rsw = room.bounds.width * scale;
    const rsh = room.bounds.height * scale;
    rasterizer.fillRect(rsx, rsy, rsw, rsh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(rsx, rsy, rsw, rsh, roomPartitionStroke, COL_WALL_INTERIOR.r, COL_WALL_INTERIOR.g, COL_WALL_INTERIOR.b);
    svgElements.push(`<rect class="room-partition" x="${rsx.toFixed(1)}" y="${rsy.toFixed(1)}" width="${rsw.toFixed(1)}" height="${rsh.toFixed(1)}" fill="#FFFFFF" stroke="#374151" stroke-width="${roomPartitionStroke}" />`);
  }
  for (const flat of rep.flatBoundaries) {
    const fsx = toScreenX(flat.bounds.x);
    const fsy = toScreenY(flat.bounds.y);
    const fsw = flat.bounds.width * scale;
    const fsh = flat.bounds.height * scale;
    rasterizer.drawRectOutline(fsx, fsy, fsw, fsh, flatBoundaryStroke, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b);
    svgElements.push(`<rect class="flat-boundary" x="${fsx.toFixed(1)}" y="${fsy.toFixed(1)}" width="${fsw.toFixed(1)}" height="${fsh.toFixed(1)}" fill="none" stroke="#1F2937" stroke-width="${flatBoundaryStroke}" />`);
  }
  for (const part of rep.majorPartitions) {
    if (part.classification === "party_wall") {
      const x0 = toScreenX(part.start.x);
      const y0 = toScreenY(part.start.y);
      const x1 = toScreenX(part.end.x);
      const y1 = toScreenY(part.end.y);
      rasterizer.drawLine(x0, y0, x1, y1, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, partyWallStroke);
      svgElements.push(`<line class="party-wall" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${partyWallStroke}" />`);
    }
  }
  for (const s of rep.commonCore.stairs) {
    const sx = toScreenX(s.bounds.x);
    const sy = toScreenY(s.bounds.y);
    const sw = s.bounds.width * scale;
    const sh = s.bounds.height * scale;
    rasterizer.fillRect(sx, sy, sw, sh, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b);
    rasterizer.drawRectOutline(sx, sy, sw, sh, coreStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);
    svgElements.push(`<rect class="stair-well" x="${sx.toFixed(1)}" y="${sy.toFixed(1)}" width="${sw.toFixed(1)}" height="${sh.toFixed(1)}" fill="#FFFFFF" stroke="#111827" stroke-width="${coreStroke}" />`);
    if (sh >= sw) {
      const midX = sx + sw / 2;
      const landingH = Math.min(sh * 0.22, 1.2 * scale);
      rasterizer.drawLine(midX, sy + landingH, midX, sy + sh, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, coreStroke);
      svgElements.push(`<line class="stair-divider" x1="${midX.toFixed(1)}" y1="${(sy + landingH).toFixed(1)}" x2="${midX.toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#1F2937" stroke-width="${coreStroke}" />`);
      rasterizer.drawLine(sx, sy + landingH, sx + sw, sy + landingH, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(stairTreadStroke * 1.2)));
      svgElements.push(`<line class="stair-landing" x1="${sx.toFixed(1)}" y1="${(sy + landingH).toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${(sy + landingH).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`);
      const treadCount = 9;
      const treadStep = (sh - landingH) / (treadCount + 1);
      for (let t = 1; t <= treadCount; t++) {
        const ty = sy + landingH + t * treadStep;
        rasterizer.drawLine(sx, ty, midX - 2, ty, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        rasterizer.drawLine(midX + 2, ty, sx + sw, ty, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        svgElements.push(`<line class="stair-tread" x1="${sx.toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(midX - 2).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`, `<line class="stair-tread" x1="${(midX + 2).toFixed(1)}" y1="${ty.toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${ty.toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`);
      }
    } else {
      const midY = sy + sh / 2;
      const landingW = Math.min(sw * 0.22, 1.2 * scale);
      rasterizer.drawLine(sx + landingW, midY, sx + sw, midY, COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b, coreStroke);
      svgElements.push(`<line class="stair-divider" x1="${(sx + landingW).toFixed(1)}" y1="${midY.toFixed(1)}" x2="${(sx + sw).toFixed(1)}" y2="${midY.toFixed(1)}" stroke="#1F2937" stroke-width="${coreStroke}" />`);
      rasterizer.drawLine(sx + landingW, sy, sx + landingW, sy + sh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, Math.max(1, Math.round(stairTreadStroke * 1.2)));
      svgElements.push(`<line class="stair-landing" x1="${(sx + landingW).toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(sx + landingW).toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`);
      const treadCount = 9;
      const treadStep = (sw - landingW) / (treadCount + 1);
      for (let t = 1; t <= treadCount; t++) {
        const tx = sx + landingW + t * treadStep;
        rasterizer.drawLine(tx, sy, tx, midY - 2, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        rasterizer.drawLine(tx, midY + 2, tx, sy + sh, COL_CORE_DETAIL.r, COL_CORE_DETAIL.g, COL_CORE_DETAIL.b, stairTreadStroke);
        svgElements.push(`<line class="stair-tread" x1="${tx.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(midY - 2).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`, `<line class="stair-tread" x1="${tx.toFixed(1)}" y1="${(midY + 2).toFixed(1)}" x2="${tx.toFixed(1)}" y2="${(sy + sh).toFixed(1)}" stroke="#4B5563" stroke-width="${stairTreadStroke}" />`);
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
    svgElements.push(`<rect class="lift-shaft" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" width="${lw.toFixed(1)}" height="${lh.toFixed(1)}" fill="#FFFFFF" stroke="#111827" stroke-width="${coreStroke}" />`, `<line class="lift-cross" x1="${lx.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(lx + lw).toFixed(1)}" y2="${(ly + lh).toFixed(1)}" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(coreStroke * 0.75))}" />`, `<line class="lift-cross" x1="${(lx + lw).toFixed(1)}" y1="${ly.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(ly + lh).toFixed(1)}" stroke="#4B5563" stroke-width="${Math.max(1, Math.round(coreStroke * 0.75))}" />`);
  }
  for (const d of rep.commonCore.ducts) {
    const dx = toScreenX(d.bounds.x);
    const dy = toScreenY(d.bounds.y);
    const dw = d.bounds.width * scale;
    const dh = d.bounds.height * scale;
    rasterizer.fillRect(dx, dy, dw, dh, COL_LOBBY_FILL.r, COL_LOBBY_FILL.g, COL_LOBBY_FILL.b);
    rasterizer.drawRectOutline(dx, dy, dw, dh, Math.max(1, Math.round(coreStroke * 0.7)), COL_WALL_PARTY.r, COL_WALL_PARTY.g, COL_WALL_PARTY.b);
    rasterizer.drawLine(dx, dy, dx + dw, dy + dh, COL_DUCT_HATCH.r, COL_DUCT_HATCH.g, COL_DUCT_HATCH.b, 1);
    svgElements.push(`<rect class="service-duct" x="${dx.toFixed(1)}" y="${dy.toFixed(1)}" width="${dw.toFixed(1)}" height="${dh.toFixed(1)}" fill="#F3F4F6" stroke="#1F2937" stroke-width="${Math.max(1, Math.round(coreStroke * 0.7))}" />`, `<line class="duct-slash" x1="${dx.toFixed(1)}" y1="${dy.toFixed(1)}" x2="${(dx + dw).toFixed(1)}" y2="${(dy + dh).toFixed(1)}" stroke="#9CA3AF" stroke-width="1.5" />`);
  }
  const fp = rep.buildingFootprint;
  const fpx = toScreenX(fp.x);
  const fpy = toScreenY(fp.y);
  const fpw = fp.width * scale;
  const fph = fp.height * scale;
  rasterizer.drawRectOutline(fpx, fpy, fpw, fph, outerWallStroke, COL_WALL_OUTER.r, COL_WALL_OUTER.g, COL_WALL_OUTER.b);
  svgElements.push(`<rect class="outer-building-boundary" x="${fpx.toFixed(1)}" y="${fpy.toFixed(1)}" width="${fpw.toFixed(1)}" height="${fph.toFixed(1)}" fill="none" stroke="#111827" stroke-width="${outerWallStroke}" stroke-linejoin="miter" stroke-linecap="square" />`);
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
      svgElements.push(`<line class="door-opening-cut" x1="${x0.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${cy.toFixed(1)}" stroke="#FFFFFF" stroke-width="${outerWallStroke + 2}" />`);
      if (door.doorType === "open_passage") {
        rasterizer.drawLine(x0, cy - 4, x0, cy + 4, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(x1, cy - 4, x1, cy + 4, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(`<line class="jamb" x1="${x0.toFixed(1)}" y1="${(cy - 4).toFixed(1)}" x2="${x0.toFixed(1)}" y2="${(cy + 4).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`, `<line class="jamb" x1="${x1.toFixed(1)}" y1="${(cy - 4).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(cy + 4).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`);
      } else if (door.doorType === "sliding") {
        const half = dWidthPx * 0.55;
        rasterizer.drawLine(x0, cy - 2, x0 + half, cy - 2, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(x1 - half, cy + 2, x1, cy + 2, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(`<line class="sliding-panel" x1="${x0.toFixed(1)}" y1="${(cy - 2).toFixed(1)}" x2="${(x0 + half).toFixed(1)}" y2="${(cy - 2).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`, `<line class="sliding-panel" x1="${(x1 - half).toFixed(1)}" y1="${(cy + 2).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(cy + 2).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`);
      } else {
        const signY = door.swing === "outward" ? -1 : 1;
        const leafTipX = x0;
        const leafTipY = cy + signY * dWidthPx;
        rasterizer.drawLine(x0, cy, leafTipX, leafTipY, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        const startRad = 0;
        const endRad = signY > 0 ? Math.PI / 2 : -Math.PI / 2;
        rasterizer.drawArc(x0, cy, dWidthPx, Math.min(startRad, endRad), Math.max(startRad, endRad), COL_DOOR_ARC.r, COL_DOOR_ARC.g, COL_DOOR_ARC.b, 1, true);
        const sweepFlag = signY > 0 ? 1 : 0;
        svgElements.push(`<line class="door-leaf" x1="${x0.toFixed(1)}" y1="${cy.toFixed(1)}" x2="${leafTipX.toFixed(1)}" y2="${leafTipY.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`, `<path class="door-arc" d="M ${x1.toFixed(1)} ${cy.toFixed(1)} A ${dWidthPx.toFixed(1)} ${dWidthPx.toFixed(1)} 0 0 ${sweepFlag} ${leafTipX.toFixed(1)} ${leafTipY.toFixed(1)}" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-dasharray="4,3" />`);
      }
    } else {
      const y0 = cy - dWidthPx / 2;
      const y1 = cy + dWidthPx / 2;
      rasterizer.drawLine(cx, y0, cx, y1, COL_CANVAS.r, COL_CANVAS.g, COL_CANVAS.b, outerWallStroke + 2);
      svgElements.push(`<line class="door-opening-cut" x1="${cx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#FFFFFF" stroke-width="${outerWallStroke + 2}" />`);
      if (door.doorType === "open_passage") {
        rasterizer.drawLine(cx - 4, y0, cx + 4, y0, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(cx - 4, y1, cx + 4, y1, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(`<line class="jamb" x1="${(cx - 4).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(cx + 4).toFixed(1)}" y2="${y0.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`, `<line class="jamb" x1="${(cx - 4).toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(cx + 4).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`);
      } else if (door.doorType === "sliding") {
        const half = dWidthPx * 0.55;
        rasterizer.drawLine(cx - 2, y0, cx - 2, y0 + half, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        rasterizer.drawLine(cx + 2, y1 - half, cx + 2, y1, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        svgElements.push(`<line class="sliding-panel" x1="${(cx - 2).toFixed(1)}" y1="${y0.toFixed(1)}" x2="${(cx - 2).toFixed(1)}" y2="${(y0 + half).toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`, `<line class="sliding-panel" x1="${(cx + 2).toFixed(1)}" y1="${(y1 - half).toFixed(1)}" x2="${(cx + 2).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`);
      } else {
        const signX = door.swing === "outward" ? -1 : 1;
        const leafTipX = cx + signX * dWidthPx;
        const leafTipY = y0;
        rasterizer.drawLine(cx, y0, leafTipX, leafTipY, COL_DOOR.r, COL_DOOR.g, COL_DOOR.b, dStroke);
        const startRad = Math.PI / 2;
        const endRad = signX > 0 ? 0 : Math.PI;
        rasterizer.drawArc(cx, y0, dWidthPx, Math.min(startRad, endRad), Math.max(startRad, endRad), COL_DOOR_ARC.r, COL_DOOR_ARC.g, COL_DOOR_ARC.b, 1, true);
        const sweepFlag = signX > 0 ? 0 : 1;
        svgElements.push(`<line class="door-leaf" x1="${cx.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${leafTipX.toFixed(1)}" y2="${leafTipY.toFixed(1)}" stroke="#1F2937" stroke-width="${dStroke}" />`, `<path class="door-arc" d="M ${cx.toFixed(1)} ${y1.toFixed(1)} A ${dWidthPx.toFixed(1)} ${dWidthPx.toFixed(1)} 0 0 ${sweepFlag} ${leafTipX.toFixed(1)} ${leafTipY.toFixed(1)}" fill="none" stroke="#6B7280" stroke-width="1.5" stroke-dasharray="4,3" />`);
      }
    }
  }
  if (options.debug) {
    const debugSvg = [];
    for (const room of rep.roomBoundaries) {
      const rx = toScreenX(room.bounds.x + room.bounds.width / 2);
      const ry = toScreenY(room.bounds.y + room.bounds.height / 2);
      debugSvg.push(`<text x="${rx.toFixed(1)}" y="${ry.toFixed(1)}" font-family="monospace" font-size="12" fill="#DC2626" text-anchor="middle" dominant-baseline="middle">${room.id}</text>`);
    }
    for (const flat of rep.flatBoundaries) {
      const fx = toScreenX(flat.bounds.x + 1);
      const fy = toScreenY(flat.bounds.y + 1);
      debugSvg.push(`<text x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" font-family="monospace" font-size="14" font-weight="bold" fill="#2563EB">${flat.id}</text>`);
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
  const hash = import_node_crypto.default.createHash("sha256").update(pngBuffer).digest("hex");
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
var import_node_crypto, import_node_zlib, STRUCTURAL_RENDERER_VERSION, InvalidStructuralPlanError, CRC_TABLE, StructuralRasterizer;
var init_structural_renderer = __esm({
  "../ai-orchestration/dist/apartment/structural-renderer.js"() {
    "use strict";
    import_node_crypto = __toESM(require("node:crypto"));
    import_node_zlib = __toESM(require("node:zlib"));
    STRUCTURAL_RENDERER_VERSION = "1.0.0";
    InvalidStructuralPlanError = class extends Error {
      code = "INVALID_STRUCTURAL_PLAN";
      errors;
      constructor(errors) {
        super(`Invalid StructuralPlanRepresentation: ${errors.join("; ")}`);
        this.name = "InvalidStructuralPlanError";
        this.errors = errors;
      }
    };
    CRC_TABLE = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      CRC_TABLE[i] = c;
    }
    StructuralRasterizer = class {
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
        if (px < 0 || px >= this.width || py < 0 || py >= this.height)
          return;
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
          if (px0 === px1 && py0 === py1)
            break;
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
          if (dashed && Math.floor(i / 4) % 2 === 1)
            continue;
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
        const compressed = import_node_zlib.default.deflateSync(this.raw, { level: 1 });
        return Buffer.concat([
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
          makePngChunk("IHDR", ihdr),
          makePngChunk("IDAT", compressed),
          makePngChunk("IEND", Buffer.alloc(0))
        ]);
      }
    };
  }
});

// ../ai-orchestration/dist/providers/gemini-image.js
function mapDimensionsToGeminiAspectRatio(width, height) {
  if (!width || !height || width <= 0 || height <= 0) {
    return "4:3";
  }
  const ratio = width / height;
  if (ratio >= 1.55)
    return "16:9";
  if (ratio >= 1.15)
    return "4:3";
  if (ratio >= 0.87)
    return "1:1";
  if (ratio >= 0.65)
    return "3:4";
  return "9:16";
}
function buildGeminiImagePrompt(request, options) {
  const sections = [];
  sections.push("==================================================\nARCHITECTURAL RENDERING DIRECTIVE \u2014 APARTMENT FLOOR PLAN\n==================================================");
  sections.push("PRIMARY MANDATE (IMAGE 1 \u2014 AUTHORITATIVE STRUCTURAL PLAN):\n- Image 1 is the AUTHORITATIVE ARCHITECTURAL STRUCTURAL PLAN.\n- Render the supplied architectural structural plan as a professional Indian apartment floor plan.\n- Treat the supplied structural plan as authoritative.\n- Preserve its geometry exactly.\n- Do not redesign the layout.\n- Do not add or remove apartments.\n- Do not move the core.\n- Do not move lifts or stairs.\n- Do not change flat boundaries.\n- Do not change door/entrance relationships.\n- Do not invent room topology.\n- Treat the supplied structural drawing as a technical architectural underlay.");
  if (options.styleReferenceCount > 0) {
    sections.push(`STYLE REFERENCES (ADDITIONAL IMAGES):
- The ${options.styleReferenceCount} additional reference image(s) are ARCHITECTURAL STYLE REFERENCES only.
- They illustrate visual presentation, drafting line weight hierarchy, subtle furniture placement, and clean material tones.
- Style references must NEVER override the structural plan.
- Do not copy geometry from style references.
- Do not copy room arrangements or flat counts from style references.
- If a style reference conflicts with the structural plan in any way: THE STRUCTURAL PLAN WINS.`);
  }
  sections.push("ARCHITECTURAL STYLE & PRESENTATION:\n- Presentation: Professional Indian apartment architectural floor plan.\n- View: Top-down orthographic 2D floor plan view only.\n- Drafting: Clean architectural drafting, strong dark outer and demising walls, lighter secondary internal partitions.\n- Common Core: Clearly distinguished common lobby, readable staircases with treads, clearly delineated lift shafts.\n- Doors & Openings: Clean door openings with proper 90-degree swing arcs connecting to correct spaces.\n- Balconies: Clean structural cantilever projections with defined railings.\n- Interior Scale: Subtle standard furniture symbols (beds, wardrobes, dining table, living seating) and realistic kitchen/bath fixture placement.\n- Restrained, neutral palette: white background, crisp dark architectural lines, no decorative clutter.");
  sections.push("STRICTLY FORBIDDEN:\n- Do NOT generate 3D perspective views, isometric views, or axonometric angles.\n- Do NOT generate exterior building renderings, facades, or street-level views.\n- Do NOT generate aerial views or landscape perspective illustrations.\n- Do NOT generate decorative real-estate marketing posters or watercolor illustrations.\n- Do NOT add people, cars, trees, or exterior landscaping.\n- Do NOT alter apartment boundaries, flat counts, or room counts.");
  sections.push("TEXT & TYPOGRAPHY POLICY:\n- Do NOT render authoritative room labels, dimension text, or area figures.\n- Maintain pristine technical drafting clarity without typographic clutter.");
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
  const structuralIdx = referenceImages.findIndex((r) => r.id === "structural_reference" || r.id === "schematic_scaffold");
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
      if (!cand || typeof cand !== "object")
        continue;
      const content = cand.content;
      if (!content || !Array.isArray(content.parts))
        continue;
      for (const part of content.parts) {
        if (!part || typeof part !== "object")
          continue;
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
      if (foundBase64)
        break;
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
var import_node_crypto2, DEFAULT_GEMINI_IMAGE_MODEL, DEFAULT_GEMINI_IMAGE_SIZE, GEMINI_IMAGE_PROVIDER_NAME, GEMINI_API_BASE_URL, GeminiImageProvider;
var init_gemini_image = __esm({
  "../ai-orchestration/dist/providers/gemini-image.js"() {
    "use strict";
    import_node_crypto2 = __toESM(require("node:crypto"));
    init_image_generation();
    init_structural_renderer();
    DEFAULT_GEMINI_IMAGE_MODEL = "gemini-3-pro-image";
    DEFAULT_GEMINI_IMAGE_SIZE = "2K";
    GEMINI_IMAGE_PROVIDER_NAME = "gemini";
    GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
    GeminiImageProvider = class {
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
          throw new ImageProviderError("GEMINI_AUTH_ERROR", "Gemini image generation is not configured on the server (GEMINI_API_KEY missing).");
        }
        const { body, structuralRef, styleRefs, aspectRatio, compiledPrompt, referenceIdsSent } = buildGeminiImageRequestBody(request, {
          model: this.model,
          imageSize: this.imageSize
        });
        const promptHash = import_node_crypto2.default.createHash("sha256").update(compiledPrompt).digest("hex");
        const structuralImageHash = structuralRef ? import_node_crypto2.default.createHash("sha256").update(structuralRef.base64Data).digest("hex") : void 0;
        const structuralRepHash = request.metadata?.structuralRepresentationHash;
        const referenceHashes = styleRefs.map((r) => import_node_crypto2.default.createHash("sha256").update(r.base64Data).digest("hex"));
        const url = `${this.endpointBase}/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        const startedAt = Date.now();
        try {
          let response2;
          try {
            response2 = await this.fetchImpl(url, {
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
              throw new ImageProviderError("IMAGE_PROVIDER_TIMEOUT", `Gemini image generation timed out after ${this.timeoutMs} ms.`);
            }
            const cause = netErr instanceof Error ? netErr.message : String(netErr);
            throw new ImageProviderError("API_ERROR", `Gemini network request failed: ${cause}`);
          }
          const latencyMs = Date.now() - startedAt;
          const apiRequestId = response2.headers.get("x-request-id") ?? void 0;
          if (!response2.ok) {
            const errorText = await response2.text().catch(() => "");
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
            if (response2.status === 401 || response2.status === 403) {
              throw new ImageProviderError("GEMINI_AUTH_ERROR", `Gemini API key rejected (HTTP ${response2.status}): ${parsedMessage}`, response2.status);
            }
            if (response2.status === 429 || isQuota) {
              throw new ImageProviderError("GEMINI_RATE_LIMITED", `Gemini quota or rate limit exceeded: ${parsedMessage}`, response2.status);
            }
            if (response2.status === 408 || response2.status === 504) {
              throw new ImageProviderError("IMAGE_PROVIDER_TIMEOUT", `Gemini request timed out with HTTP ${response2.status}: ${parsedMessage}`, response2.status);
            }
            throw new ImageProviderError("API_ERROR", `Gemini API returned HTTP ${response2.status}: ${parsedMessage}`, response2.status);
          }
          let responseJson;
          try {
            responseJson = await response2.json();
          } catch (jsonErr) {
            throw new ImageProviderError("IMAGE_DECODE_FAILED", `Failed to parse Gemini response as JSON: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`);
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
  }
});

// ../ai-orchestration/dist/orchestration/image-quality-gate.js
function verifyImageQuality(imageBuffer, _expectedWidth = 1024, _expectedHeight = 1024) {
  const byteSize = imageBuffer.length;
  if (byteSize < 5e3) {
    return {
      valid: false,
      reason: `Image payload is suspiciously small (${byteSize} bytes); likely corrupted or empty.`,
      byteSize
    };
  }
  let detectedMime = "application/octet-stream";
  const isPng = imageBuffer[0] === 137 && imageBuffer[1] === 80 && imageBuffer[2] === 78 && imageBuffer[3] === 71;
  const isJpeg = imageBuffer[0] === 255 && imageBuffer[1] === 216 && imageBuffer[2] === 255;
  const isWebp = imageBuffer[0] === 82 && imageBuffer[1] === 73 && imageBuffer[2] === 70 && imageBuffer[3] === 70 && imageBuffer[8] === 87 && imageBuffer[9] === 69 && imageBuffer[10] === 66 && imageBuffer[11] === 80;
  if (isPng)
    detectedMime = "image/png";
  else if (isJpeg)
    detectedMime = "image/jpeg";
  else if (isWebp)
    detectedMime = "image/webp";
  else {
    return {
      valid: false,
      reason: "Image does not match standard image format header (PNG, JPEG, WebP).",
      byteSize
    };
  }
  const headerOffset = Math.min(64, Math.floor(byteSize / 10));
  const payloadBytes = byteSize - headerOffset;
  const sampleStride = Math.max(1, Math.floor(payloadBytes / 500));
  let sum2 = 0;
  let sampleCount = 0;
  const samples = [];
  for (let i = headerOffset; i < byteSize; i += sampleStride) {
    const val = imageBuffer[i];
    samples.push(val);
    sum2 += val;
    sampleCount++;
    if (sampleCount >= 500)
      break;
  }
  const mean = sum2 / sampleCount;
  let variance = 0;
  for (const val of samples) {
    variance += (val - mean) * (val - mean);
  }
  variance = variance / sampleCount;
  if (variance < 10) {
    return {
      valid: false,
      reason: `Image lacks contrast and architectural detail (byte variance ${variance.toFixed(1)}); appears blank or corrupted.`,
      byteSize,
      detectedMime
    };
  }
  return {
    valid: true,
    byteSize,
    detectedMime
  };
}
var init_image_quality_gate = __esm({
  "../ai-orchestration/dist/orchestration/image-quality-gate.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/apartment/floor-configuration.js
var init_floor_configuration = __esm({
  "../ai-orchestration/dist/apartment/floor-configuration.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/apartment/layout-planner.js
function rectFromEdges(x0, y0, x1, y1) {
  const ax = r3(Math.min(x0, x1));
  const ay = r3(Math.min(y0, y1));
  return { x: ax, y: ay, width: r3(r3(Math.max(x0, x1)) - ax), height: r3(r3(Math.max(y0, y1)) - ay) };
}
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
    if (!ok)
      continue;
    const from = Math.max(a.y, b.y);
    const to = Math.min(ay1, by1);
    if (to - from > eps)
      return { vertical: true, at, from, to };
  }
  for (const [at, ok] of [[ay1, Math.abs(ay1 - b.y) < eps], [a.y, Math.abs(by1 - a.y) < eps]]) {
    if (!ok)
      continue;
    const from = Math.max(a.x, b.x);
    const to = Math.min(ax1, bx1);
    if (to - from > eps)
      return { vertical: false, at, from, to };
  }
  return null;
}
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
    if (fillerLen <= 1e-6)
      return;
    const longFiller = fillerLen > 2.4 && filler.kind === "store";
    const kind = longFiller ? "study" : filler.kind;
    const name = kind === "study" ? "Study" : kind === "dress" ? "Dressing" : "Store";
    fillerRoom = uvRoom({ id: filler.id, name, type: kind, targetAreaSqM: 0 }, "service", 0, s, cursor, cursor + fillerLen);
    cursor += fillerLen;
  };
  if (fillerAt === "start")
    placeFiller();
  items.forEach((it, i) => {
    const l = lens[i];
    const bedId = ensuiteOf.get(it.room.id);
    rooms.push(uvRoom(it.room, "service", 0, s, cursor, cursor + l, bedId ? { ensuiteOf: bedId } : {}));
    cursor += l;
  });
  if (fillerAt === "end")
    placeFiller();
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
    tier: "PUBLIC",
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
    if (/_master_toilet$/.test(bath.id) && master)
      bed = master;
    const m = /_toilet_(\d+)$/.exec(bath.id);
    if (!bed && m)
      bed = beds.find((b) => b.id.endsWith(`_bedroom_${m[1]}`));
    if (!bed)
      bed = beds.find((b) => !bathOfBed.has(b.id));
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
  const minBedLen = (b) => Math.max(2.7, b.minWidthM, b === master ? rules.habitableRoomMinimums.masterHabitableRoomMinWidthM : rules.habitableRoomMinimums.otherHabitableRoomMinWidthM);
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
    const stacked = stackServiceBand(pre.items.map((room, i) => ({ room, len: itemLens[i] })), v, v + segLen, s, { id: `${fid}_dress_1`, kind: "dress", opensFrom: pre.bed.id }, "start", bedOfBath);
    rooms.push(...stacked.rooms);
    if (stacked.fillerRoom) {
      rooms.push(stacked.fillerRoom);
      door(stacked.fillerDoorFrom, stacked.fillerRoom.id, 0.75);
    }
    door(ld.id, pre.bed.id, 0.9);
    for (const item of pre.items) {
      if (pre.ctFromFoyer)
        door(foyer.id, item.id, 0.75);
      else
        door(pre.bed.id, item.id, 0.75);
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
    if (need > wingLen)
      segs[segs.length - 1].bedLen += need - wingLen;
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
    for (const sg of segs)
      door(passageId, sg.bed.id, 0.9);
    for (const item of stacked.rooms) {
      if (utility && item.id === utility.id)
        door(kitchen.id, utility.id, 0.8);
      else
        door(passageId, item.id, 0.75);
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
      if (utility && item.id === utility.id)
        door(kitchen.id, utility.id, 0.8);
      else
        door(endBed.id, item.id, 0.75);
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
      if (k === 1)
        dir = p.opposedEntries && side === "right" ? "up" : "down";
      else if (j < (k - 1) / 2)
        dir = foyerNearStart ? "down" : "up";
      else if (j > (k - 1) / 2)
        dir = foyerNearStart ? "up" : "down";
      else
        dir = "down";
      const pu = { idx: i, side, dir, y0: y, plan };
      y += plan.h;
      return pu;
    });
    if (out.length === 0)
      return out;
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
    if (unitMax - ly1 >= ly0 - unitMin)
      ly1 += extra;
    else
      ly0 -= extra;
  }
  const stairW = Math.max(2.4, rules.stairRequirements.minWidthM * 2.2);
  const stairD = 3.6;
  const liftW = 2.1;
  const liftD = 2.1;
  const blocks = { bottom: [], top: [] };
  for (let i = 0; i < input.stairCount; i++)
    (i % 2 === 0 ? blocks.bottom : blocks.top).push({ kind: "stair", index: i });
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
    if (items.length === 0)
      return;
    const depth = items.some((i) => i.kind === "stair") ? stairD : liftD;
    const bw = blockW(items);
    let x = (Ws - bw) / 2;
    const inner = atBottom ? ly0 : ly1;
    const outer = (d) => atBottom ? ly0 - d : ly1 + d;
    for (const it of items) {
      const wItem = itemW(it);
      const d = it.kind === "stair" ? stairD : liftD;
      const rect = rectFromEdges(x, inner, x + wItem, outer(d));
      if (it.kind === "stair")
        stairs[it.index] = rect;
      else {
        lifts[it.index] = rect;
        if (depth - liftD >= 1)
          shafts.push(rectFromEdges(x, outer(liftD), x + wItem, outer(depth)));
      }
      x += wItem;
    }
    const spare = (Ws - bw) / 2;
    if (spare >= 0.9 && shafts.length === 0)
      shafts.push(rectFromEdges(Ws - spare, inner, Ws, outer(depth)));
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
    if (!chosen)
      chosen = { local: l, ...o, note: step.note };
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
    issues.push(`Layout (${r3(local.bbox.width)} m \xD7 ${r3(local.bbox.height)} m) does not fit the buildable envelope (${r3(b.width)} m \xD7 ${r3(b.height)} m) for the ${input.strategy} strategy.`);
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
  for (const el of [...lifts, ...stairs])
    rectById.set(el.id, el.bounds);
  for (const u of units)
    for (const rm of [...u.rooms, ...u.balconies])
      rectById.set(rm.id, rm.bounds);
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
      if (!d)
        return;
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
    if (d)
      doors.push(d);
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
    for (const rm of spaces)
      nodes.push({ id: rm.id, flatId: u.flatId, role: roleOf(rm.type), zone: rm.zone, name: rm.name });
    const withLobby = [...spaces, { id: lobby.id, bounds: lobby.bounds }];
    for (let i = 0; i < spaces.length; i++) {
      for (let j = i + 1; j < withLobby.length; j++) {
        const a = spaces[i];
        const b = withLobby[j];
        const e = sharedEdgeBetween(a.bounds, b.bounds);
        if (!e || e.to - e.from < 0.3)
          continue;
        if (doorPairs.has([a.id, b.id].sort().join("|")))
          continue;
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
    check("FLAT_ENTRANCE_SINGLE", u.flatId, entrances.length === 1, `${L}: one entrance door from the common lobby.`, `${L}: ${entrances.length} entrance doors (exactly 1 required).`);
    const entrance = entrances[0];
    const entryRoom = entrance ? entrance.connects[0] === lobby.id ? entrance.connects[1] : entrance.connects[0] : null;
    check("ENTRANCE_TO_FOYER", u.flatId, entryRoom !== null && role(entryRoom) === "foyer", `${L}: the entrance opens into the foyer.`, `${L}: the entrance does not open into a foyer (${entryRoom ? byId.get(entryRoom)?.name : "none"}).`);
    const lobbyPrivate = flatDoors.filter((d) => d.connects.includes(lobby.id)).map((d) => d.connects[0] === lobby.id ? d.connects[1] : d.connects[0]).filter((id) => ["bedroom", "bath", "kitchen", "utility"].includes(role(id)));
    check("LOBBY_NOT_INTO_PRIVATE", u.flatId, lobbyPrivate.length === 0, `${L}: the lobby never opens into a bedroom, bath or service room.`, `${L}: the lobby opens directly into ${lobbyPrivate.map((id) => byId.get(id)?.name).join(", ")}.`);
    const ld = spaces.find((r) => r.type === "living_dining");
    const foyer = spaces.find((r) => r.type === "foyer");
    const kitchen = spaces.find((r) => r.type === "kitchen");
    const utility = spaces.find((r) => r.type === "utility");
    check("FOYER_TO_LIVING", u.flatId, Boolean(foyer && ld && hasDoor(foyer.id, ld.id)), `${L}: foyer opens into living/dining.`, `${L}: no opening between foyer and living/dining.`);
    check("LIVING_DINING", u.flatId, Boolean(ld), `${L}: living and dining are one combined public room.`, `${L}: no living/dining room.`);
    check("DINING_KITCHEN", u.flatId, Boolean(ld && kitchen && hasDoor(ld.id, kitchen.id)), `${L}: kitchen opens off the dining.`, `${L}: kitchen is not connected to the dining.`);
    if (utility) {
      check("KITCHEN_UTILITY", u.flatId, Boolean(kitchen && hasDoor(kitchen.id, utility.id)), `${L}: utility is reached through the kitchen.`, `${L}: utility is not connected to the kitchen.`);
    }
    for (const bath of spaces.filter((r) => r.ensuiteOf)) {
      const bed = byId.get(bath.ensuiteOf);
      const isMaster = bed?.type === "master_bedroom";
      check(isMaster ? "MASTER_ENSUITE" : "BEDROOM_ENSUITE", u.flatId, Boolean(bed && hasDoor(bed.id, bath.id)), `${L}: ${bath.name} opens from ${bed?.name}.`, `${L}: ${bath.name} is not attached to ${bed?.name ?? "its bedroom"}.`);
    }
    const reach = (throughBedrooms) => {
      const seen = /* @__PURE__ */ new Set();
      if (!entryRoom)
        return seen;
      const queue = [entryRoom];
      seen.add(entryRoom);
      while (queue.length > 0) {
        const cur = queue.shift();
        if (!throughBedrooms && cur !== entryRoom && role(cur) === "bedroom")
          continue;
        for (const nxt of adj.get(cur) ?? []) {
          if (nxt === lobby.id || seen.has(nxt))
            continue;
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
    check("BEDROOM_ACCESS", u.flatId, blockedBeds.length === 0, `${L}: every bedroom is reached without passing through another bedroom.`, `${L}: ${blockedBeds.map((bd) => bd.name).join(", ")} only reachable through another bedroom.`);
    const commonBaths = spaces.filter((r) => roleOf(r.type) === "bath" && !r.ensuiteOf);
    const blockedBaths = commonBaths.filter((bt) => !noBedTransit.has(bt.id));
    check("COMMON_BATH_ACCESS", u.flatId, blockedBaths.length === 0, `${L}: common bath(s) reached without passing through a bedroom.`, `${L}: ${blockedBaths.map((bt) => bt.name).join(", ")} only reachable through a bedroom.`);
    const unreachable = spaces.filter((r) => !everything.has(r.id));
    check("ALL_ROOMS_REACHABLE", u.flatId, unreachable.length === 0, `${L}: every room is reachable from the entrance.`, `${L}: unreachable: ${unreachable.map((r) => r.name).join(", ")}.`);
    const inward = spaces.filter((r) => (r.type === "living_dining" || roleOf(r.type) === "bedroom") && !r.onFacade);
    check("HABITABLE_ON_EXTERNAL_EDGE", u.flatId, inward.length === 0, `${L}: living/dining and every bedroom have an external wall.`, `${L}: no external wall for ${inward.map((r) => r.name).join(", ")}.`);
    const wet = spaces.filter((r) => ["kitchen", "utility", "bath"].includes(roleOf(r.type)));
    const wetOutsideStack = wet.filter((r) => r.band !== "service" && !r.ensuiteOf);
    check("WET_SERVICE_STACK", u.flatId, wetOutsideStack.length === 0, `${L}: kitchen, utility and common baths are grouped in the service band.`, `${L}: wet rooms outside the service stack: ${wetOutsideStack.map((r) => r.name).join(", ")}.`);
    const outside = spaces.filter((r) => overlapArea2(r.bounds, u.bounds) < areaOf(r.bounds) - 1e-3);
    check("ROOMS_INSIDE_FLAT", u.flatId, outside.length === 0, `${L}: all rooms lie inside the flat boundary.`, `${L}: rooms outside the flat: ${outside.map((r) => r.name).join(", ")}.`);
  }
  const served = units.filter((u) => doors.some((d) => d.flatId === u.flatId && d.kind === "flat_entrance" && d.connects.includes(lobby.id)));
  check("LOBBY_SERVES_ALL_FLATS", null, served.length === units.length, `Common lobby gives direct access to all ${units.length} flat entrances.`, `Only ${served.length} of ${units.length} flats open onto the common lobby.`);
  const coreEls = [...lifts, ...stairs];
  const unlinked = coreEls.filter((el) => !doors.some((d) => d.kind === "core" && d.connects.includes(el.id)));
  check("CORE_OPENS_TO_LOBBY", null, unlinked.length === 0, "Every lift and stair opens onto the common lobby.", `Not connected to the lobby: ${unlinked.map((e) => e.label).join(", ")}.`);
  const allRects = [
    { id: lobby.id, label: lobby.label, bounds: lobby.bounds },
    ...coreEls.map((e) => ({ id: e.id, label: e.label, bounds: e.bounds })),
    ...shafts.map((e) => ({ id: e.id, label: e.label, bounds: e.bounds })),
    ...units.flatMap((u) => [...u.rooms, ...u.balconies].map((r) => ({ id: r.id, label: `${u.flatLabel} ${r.name}`, bounds: r.bounds })))
  ];
  const overlaps = [];
  for (let i = 0; i < allRects.length; i++) {
    for (let j = i + 1; j < allRects.length; j++) {
      if (overlapArea2(allRects[i].bounds, allRects[j].bounds) > 1e-3)
        overlaps.push(`${allRects[i].label} \u2194 ${allRects[j].label}`);
    }
  }
  check("NO_OVERLAPS", null, overlaps.length === 0, "No room, flat or core element overlaps another.", `Overlaps: ${overlaps.slice(0, 4).join("; ")}.`);
  const flatOverlaps = [];
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      if (overlapArea2(units[i].bounds, units[j].bounds) > 1e-3)
        flatOverlaps.push(`${units[i].flatLabel} \u2194 ${units[j].flatLabel}`);
    }
    for (const el of [lobby, ...coreEls]) {
      if (overlapArea2(units[i].bounds, el.bounds) > 1e-3)
        flatOverlaps.push(`${units[i].flatLabel} \u2194 ${el.label}`);
    }
  }
  check("FLATS_SEPARATED", null, flatOverlaps.length === 0, "Flats are separate units clear of the common core.", `Flat boundaries overlap: ${flatOverlaps.join("; ")}.`);
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
var APARTMENT_CONCEPT_STRATEGIES, STRATEGY_PARAMS, COMMON_LOBBY_ID, r3, areaOf, sum, clamp2, LOBBY_NODE;
var init_layout_planner = __esm({
  "../ai-orchestration/dist/apartment/layout-planner.js"() {
    "use strict";
    init_dist();
    APARTMENT_CONCEPT_STRATEGIES = [
      {
        id: "balanced",
        code: "SYMMETRIC_CORE",
        candidateNumber: 1,
        label: "Symmetric Core / Balanced",
        intent: "Mirror-symmetric flats either side of a central common lobby; one stair and lift at each end of the lobby."
      },
      {
        id: "daylight",
        code: "STEPPED_L_COURT",
        candidateNumber: 2,
        label: "Stepped L-Court / Daylight",
        intent: "Shallow flats with long facades and stepped orthogonal envelopes; living room and every bedroom on an external wall; deeper balconies."
      },
      {
        id: "privacy",
        code: "VASTU_OPTIMIZED",
        candidateNumber: 3,
        label: "Vastu-Optimized / Privacy",
        intent: "Staggered flats so entrance doors do not face each other; bedrooms grouped in a private wing off a private passage."
      },
      {
        id: "circulation",
        code: "CORRIDOR_HUGGING",
        candidateNumber: 4,
        label: "Corridor-Hugging / Circulation",
        intent: "Compact core with grouped lifts and the shortest common lobby; minimal internal passage."
      }
    ];
    STRATEGY_PARAMS = {
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
      },
      SYMMETRIC_CORE: {
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
      STEPPED_L_COURT: {
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
      VASTU_OPTIMIZED: {
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
      CORRIDOR_HUGGING: {
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
    COMMON_LOBBY_ID = "core_lobby";
    r3 = (v) => Math.round(v * 1e3) / 1e3;
    areaOf = (r) => Math.max(0, r.width) * Math.max(0, r.height);
    sum = (xs) => xs.reduce((a, b) => a + b, 0);
    clamp2 = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    LOBBY_NODE = COMMON_LOBBY_ID;
  }
});

// ../ai-orchestration/dist/apartment/polygon-layout.js
function shoelaceAreaSqM(vertices) {
  let s = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
function simplifyOrthogonal(vertices) {
  if (vertices.length <= 4)
    return vertices;
  let changed = true;
  let pts = [...vertices];
  while (changed && pts.length > 4) {
    changed = false;
    const next = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const prev = pts[(i - 1 + n) % n];
      const curr = pts[i];
      const nxt = pts[(i + 1) % n];
      const collinearX = Math.abs(prev.x - curr.x) < 1e-6 && Math.abs(curr.x - nxt.x) < 1e-6;
      const collinearY = Math.abs(prev.y - curr.y) < 1e-6 && Math.abs(curr.y - nxt.y) < 1e-6;
      if (collinearX || collinearY) {
        changed = true;
        continue;
      }
      next.push(curr);
    }
    if (next.length < pts.length && next.length >= 4)
      pts = next;
    else
      break;
  }
  return pts;
}
function ensureCCW(vertices) {
  let s = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
    s += (b.x - a.x) * (b.y + a.y);
  }
  if (s > 0)
    return [...vertices].reverse();
  return vertices;
}
function buildSteppedPolygon(params) {
  const { flatId, flatLabel, bbox, corridorSide, extraDeadWalls = [] } = params;
  const x0 = bbox.x;
  const y0 = bbox.y;
  const x1 = bbox.x + bbox.width;
  const y1 = bbox.y + bbox.height;
  const insetMm = 1200;
  const splitY = y0 + bbox.height * 0.58;
  let vertices;
  if (corridorSide === "W" || corridorSide === "E") {
    const insetX = corridorSide === "W" ? x1 - insetMm / 1e3 : x0 + insetMm / 1e3;
    if (corridorSide === "W") {
      vertices = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: splitY },
        { x: insetX, y: splitY },
        { x: insetX, y: y1 },
        { x: x0, y: y1 }
      ];
    } else {
      vertices = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: insetX, y: y1 },
        { x: insetX, y: splitY },
        { x: x0, y: splitY }
      ];
    }
  } else {
    const insetY = corridorSide === "N" ? y1 - insetMm / 1e3 : y0 + insetMm / 1e3;
    const splitX = x0 + bbox.width * 0.58;
    if (corridorSide === "N") {
      vertices = [
        { x: x0, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: insetY },
        { x: splitX, y: insetY },
        { x: splitX, y: y1 },
        { x: x0, y: y1 }
      ];
    } else {
      vertices = [
        { x: x0, y: insetY },
        { x: splitX, y: insetY },
        { x: splitX, y: y0 },
        { x: x1, y: y0 },
        { x: x1, y: y1 },
        { x: x0, y: y1 }
      ];
    }
  }
  vertices = simplifyOrthogonal(vertices);
  vertices = ensureCCW(vertices);
  const ots = carveOtsShaft(flatId, bbox, corridorSide);
  const openFacade = corridorSide === "W" ? "E" : corridorSide === "E" ? "W" : corridorSide === "N" ? "S" : "N";
  const balcony = projectSitOutBalcony({
    flatId,
    hostRoomId: `${flatId}_living_dining`,
    bbox,
    openFacade,
    depthMm: 1500
  });
  const deadSet = /* @__PURE__ */ new Set([corridorSide, ...extraDeadWalls]);
  const all = ["N", "S", "E", "W"];
  const deadWalls = [...deadSet];
  const openFacades = all.filter((d) => !deadSet.has(d));
  const grossAreaSqM = Number(shoelaceAreaSqM(vertices).toFixed(2));
  const otsAreaSqM = ots.widthMm * ots.depthMm / 1e6;
  const netCarpetAreaSqM = Number((grossAreaSqM - otsAreaSqM).toFixed(2));
  const bb = bbox;
  return {
    flatId,
    flatLabel,
    vertices: Object.freeze([...vertices]),
    polygon: { points: Object.freeze([...vertices]) },
    boundingBox: bb,
    corridorSide,
    openFacades: Object.freeze([...openFacades]),
    deadWalls: Object.freeze([...deadWalls]),
    otsShafts: Object.freeze([ots]),
    balconies: Object.freeze([balcony]),
    netCarpetAreaSqM,
    grossAreaSqM
  };
}
function carveOtsShaft(flatId, bbox, corridorSide) {
  const wMm = 1200;
  const dMm = 1500;
  const x = corridorSide === "W" ? bbox.x + 0.3 : corridorSide === "E" ? bbox.x + bbox.width - 0.3 - wMm / 1e3 : bbox.x + bbox.width * 0.35;
  const y = bbox.y + bbox.height * 0.42;
  return {
    id: `${flatId}_ots_1`,
    bounds: { x, y, width: wMm / 1e3, height: dMm / 1e3 },
    widthMm: wMm,
    depthMm: dMm,
    center: { x: x + wMm / 2e3, y: y + dMm / 2e3 }
  };
}
function projectSitOutBalcony(params) {
  const { flatId, hostRoomId, bbox, openFacade, depthMm = 1500 } = params;
  const depthM = depthMm / 1e3;
  const widthM = Math.min(bbox.width * 0.5, 3);
  let x, y, w, h;
  if (openFacade === "S") {
    x = bbox.x + (bbox.width - widthM) / 2;
    y = bbox.y + bbox.height;
    w = widthM;
    h = depthM;
  } else if (openFacade === "N") {
    x = bbox.x + (bbox.width - widthM) / 2;
    y = bbox.y - depthM;
    w = widthM;
    h = depthM;
  } else if (openFacade === "E") {
    x = bbox.x + bbox.width;
    y = bbox.y + 0.5;
    w = depthM;
    h = widthM;
  } else {
    x = bbox.x - depthM;
    y = bbox.y + 0.5;
    w = depthM;
    h = widthM;
  }
  return {
    id: `${flatId}_sitout_balcony`,
    hostRoomId,
    bounds: { x, y, width: w, height: h },
    depthMm,
    widthMm: Math.round(widthM * 1e3),
    facade: openFacade
  };
}
var init_polygon_layout2 = __esm({
  "../ai-orchestration/dist/apartment/polygon-layout.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/apartment/schematic.js
function generateDeterministicApartmentSchematic(options) {
  const { siteWidthM, siteDepthM, flatsPerFloor, unitMix, commonCoreConfig = {}, floorType = "typical", rulesProfile, strategy = "balanced" } = options;
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
          unitType: mixItem.unitType?.toUpperCase() || "2BHK",
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
  const units = plan.units.map((u, idx) => {
    const report = plan.areaReport.units.find((r) => r.flatId === u.flatId);
    const corridorSide = idx % 2 === 0 ? "W" : "E";
    const steppedPolygon = buildSteppedPolygon({
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      bbox: u.body,
      corridorSide,
      targetCarpetAreaSqM: u.allocation.targetCarpetAreaSqM
    });
    return {
      flatId: u.flatId,
      flatLabel: u.flatLabel,
      unitType: u.unitType,
      carpetAreaSqM: u.allocation.targetCarpetAreaSqM,
      actualCarpetAreaSqM: report?.actualCarpetSqM ?? 0,
      builtUpAreaSqM: u.allocation.targetBuiltUpAreaSqM,
      bounds: u.bounds,
      bodyBounds: u.body,
      steppedPolygon,
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
function generateSchematicSvg(data) {
  const scale = 22;
  const svgWidth = Math.ceil(data.siteWidthM * scale);
  const svgHeight = Math.ceil(data.siteDepthM * scale);
  const flatColors = ["#EBF5FB", "#FEF9E7", "#EAFAF1", "#F4ECF7", "#FDEBD0"];
  const R2 = (r) => `x="${(r.x * scale).toFixed(1)}" y="${(r.y * scale).toFixed(1)}" width="${(r.width * scale).toFixed(1)}" height="${(r.height * scale).toFixed(1)}"`;
  const centre = (r) => ({ x: (r.x + r.width / 2) * scale, y: (r.y + r.height / 2) * scale });
  const unitsSvg = data.units.map((unit, idx) => {
    const color = flatColors[idx % flatColors.length];
    const poly = unit.steppedPolygon;
    const ptsStr = poly ? poly.vertices.map((p) => `${(p.x * scale).toFixed(1)},${(p.y * scale).toFixed(1)}`).join(" ") : "";
    const otsSvg = poly ? poly.otsShafts.map((ots) => `
        <rect x="${(ots.bounds.x * scale).toFixed(1)}" y="${(ots.bounds.y * scale).toFixed(1)}" width="${(ots.bounds.width * scale).toFixed(1)}" height="${(ots.bounds.height * scale).toFixed(1)}" fill="#94A3B8" stroke="#334155" stroke-width="1" stroke-dasharray="2,2" />
        <text x="${((ots.bounds.x + ots.bounds.width / 2) * scale).toFixed(1)}" y="${((ots.bounds.y + ots.bounds.height / 2 + 3) * scale).toFixed(1)}" text-anchor="middle" font-size="7" fill="#F8FAFC" font-weight="700">OTS</text>
      `).join("") : "";
    const rooms = [...unit.rooms, ...unit.balconies].map((room) => {
      const c = centre(room.bounds);
      const dashed = room.type === "balcony" ? ' stroke-dasharray="3,2"' : "";
      return `
        <rect ${R2(room.bounds)} fill="none" stroke="#64748B" stroke-width="0.9"${dashed}/>
        <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="7.5" fill="#334155">${esc(room.name)}</text>`;
    }).join("");
    return `
    <g id="${unit.flatId}">
      ${ptsStr ? `<polygon points="${ptsStr}" fill="${color}" stroke="#0F172A" stroke-width="3" stroke-linejoin="round" />` : `<rect ${R2(unit.bodyBounds)} fill="${color}" stroke="#0F172A" stroke-width="3" />`}
      ${otsSvg}
      ${rooms}
      <text x="${(unit.bodyBounds.x * scale + 6).toFixed(1)}" y="${(unit.bodyBounds.y * scale + 14).toFixed(1)}" font-size="11" font-weight="700" fill="#1E293B">${esc(unit.flatLabel)} \xB7 ${unit.unitType}</text>
      <text x="${(unit.bodyBounds.x * scale + 6).toFixed(1)}" y="${(unit.bodyBounds.y * scale + 26).toFixed(1)}" font-size="9" fill="#64748B">Net Carpet: ${poly ? poly.netCarpetAreaSqM : unit.actualCarpetAreaSqM} m\xB2</text>
    </g>`;
  }).join("");
  const doorsSvg = data.doors.map((d) => `<rect ${R2(d.bounds)} fill="#FFFFFF" stroke="${d.kind === "flat_entrance" ? "#DC2626" : "#0EA5E9"}" stroke-width="1"/>`).join("");
  const coreSvg = `
  <rect ${R2(data.lobbyBounds)} fill="#F8FAFC" stroke="#334155" stroke-width="1.5" />
  <text x="${centre(data.lobbyBounds).x.toFixed(1)}" y="${(centre(data.lobbyBounds).y + 4).toFixed(1)}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">COMMON LOBBY</text>
  ${data.lifts.map((lift) => {
    const b = lift.bounds;
    const x0 = b.x * scale;
    const y0 = b.y * scale;
    const x1 = (b.x + b.width) * scale;
    const y1 = (b.y + b.height) * scale;
    const c = centre(b);
    return `
    <rect ${R2(b)} fill="#E0F2FE" stroke="#0284C7" stroke-width="1.5" />
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#0284C7" stroke-width="0.8" />
    <line x1="${x1}" y1="${y0}" x2="${x0}" y2="${y1}" stroke="#0284C7" stroke-width="0.8" />
    <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="700" fill="#0369A1">${lift.label}</text>`;
  }).join("")}
  ${data.stairs.map((stair) => {
    const c = centre(stair.bounds);
    return `
    <rect ${R2(stair.bounds)} fill="url(#stairLines)" stroke="#D97706" stroke-width="1.5" />
    <text x="${c.x.toFixed(1)}" y="${(c.y + 3).toFixed(1)}" text-anchor="middle" font-size="8.5" font-weight="700" fill="#92400E">${stair.label}</text>`;
  }).join("")}
  ${data.serviceShafts.map((s) => `<rect ${R2(s.bounds)} fill="#F1F5F9" stroke="#475569" stroke-width="1" />`).join("")}`;
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
  <rect ${R2(fp)} fill="none" stroke="#94A3B8" stroke-width="1" stroke-dasharray="6,3" />
  ${unitsSvg}
  ${coreSvg}
  ${doorsSvg}
  <rect x="10" y="${svgHeight - 34}" width="${svgWidth - 20}" height="24" fill="#0F172A" rx="4" />
  <text x="20" y="${svgHeight - 18}" font-size="10" font-weight="600" fill="#F8FAFC">INDIAN APARTMENT EDITION \xB7 ${data.strategy.toUpperCase()} \xB7 ${data.flatsPerFloor} FLATS/FLOOR \xB7 ${esc(data.unitMixSummary)}</text>
</svg>
`.trim();
}
var esc;
var init_schematic = __esm({
  "../ai-orchestration/dist/apartment/schematic.js"() {
    "use strict";
    init_typologies();
    init_site_defaults();
    init_layout_planner();
    init_polygon_layout2();
    esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
});

// ../ai-orchestration/dist/apartment/feasibility.js
function validateIndianApartmentFeasibility(options) {
  const { site, floorCount, flatsPerFloor, unitMix, commonCore = {}, jurisdiction = "pune_pmc", floorStrategy = "typical" } = options;
  const conflicts = [];
  const plotWidthM = site.plotWidthMm / 1e3;
  const plotDepthM = site.plotDepthMm / 1e3;
  const siteAreaSqM = Number((plotWidthM * plotDepthM).toFixed(2));
  const setbacks = site.setbacksMm ?? DEFAULT_APARTMENT_SETBACKS_MM;
  const frontM = setbacks.front / 1e3;
  const rearM = setbacks.rear / 1e3;
  const leftM = setbacks.left / 1e3;
  const rightM = setbacks.right / 1e3;
  const buildableWidthM = Math.max(0, plotWidthM - leftM - rightM);
  const buildableDepthM = Math.max(0, plotDepthM - frontM - rearM);
  const buildableEnvelopeSqM = Number((buildableWidthM * buildableDepthM).toFixed(2));
  const buildingHeightM = floorCount * 3.1;
  const estimatedFloorPlateSqM = buildableEnvelopeSqM * 0.9;
  const rulesProfile = options.customRulesProfile ?? getApartmentRulesProfile(jurisdiction, {
    buildingHeightM,
    floorCount,
    floorPlateAreaSqM: estimatedFloorPlateSqM,
    tenementsPerFloor: flatsPerFloor
  });
  if (buildableEnvelopeSqM < 65) {
    conflicts.push({
      code: "BUILDABLE_ENVELOPE_TOO_SMALL",
      severity: "error",
      message: `Buildable envelope (${buildableEnvelopeSqM.toFixed(1)} m\xB2) is too small for an apartment floor plate after statutory setbacks.`,
      metric: { required: 65, available: buildableEnvelopeSqM, unit: "m\xB2" }
    });
  }
  const maxFloorPlateSqM = Number((buildableEnvelopeSqM * 0.9).toFixed(2));
  const stairWidth = rulesProfile.stairRequirements.minWidthM;
  const secondStairRequired = rulesProfile.stairRequirements.secondStaircaseRequired || (commonCore.staircaseCount ?? 1) > 1;
  const effectiveStairCount = Math.max(secondStairRequired ? 2 : 1, commonCore.staircaseCount ?? (secondStairRequired ? 2 : 1));
  const effectiveLifts = Math.max(rulesProfile.liftRequirements.minPassengerLifts, commonCore.passengerLifts ?? rulesProfile.liftRequirements.minPassengerLifts);
  const passengerLiftArea = effectiveLifts * 5.5;
  const serviceLiftArea = (commonCore.serviceLifts || 0) * 6.5;
  const stairArea = effectiveStairCount * Math.max(14, stairWidth * 12);
  const lobbyArea = commonCore.commonLobby !== false ? 22 : 14;
  const shaftArea = (commonCore.serviceShaftsCount ?? 4) * 1.8;
  const coreAreaSqM = Number((passengerLiftArea + serviceLiftArea + stairArea + lobbyArea + shaftArea).toFixed(2));
  const circulationSqM = Number((maxFloorPlateSqM * 0.1).toFixed(2));
  const netResidentialAreaSqM = Number(Math.max(0, maxFloorPlateSqM - coreAreaSqM - circulationSqM).toFixed(2));
  const UNIT_AREA_DEFAULTS_SQ_M = {
    Studio: 35,
    "1BHK": 45,
    "2BHK": 70,
    "3BHK": 105,
    "4BHK": 150
  };
  let requestedTotalUnitAreaSqM = 0;
  let totalConfiguredUnits = 0;
  for (const item of unitMix) {
    let unitArea = 0;
    if (item.carpetAreaSqFt && item.carpetAreaSqFt > 0) {
      unitArea = item.carpetAreaSqFt * 0.092903;
    } else if (item.builtUpAreaSqFt && item.builtUpAreaSqFt > 0) {
      unitArea = item.builtUpAreaSqFt * 0.092903 * 0.85;
    } else if (options.targetCarpetAreaSqFtPerUnit && options.targetCarpetAreaSqFtPerUnit > 0) {
      unitArea = options.targetCarpetAreaSqFtPerUnit * 0.092903;
    } else {
      unitArea = UNIT_AREA_DEFAULTS_SQ_M[item.unitType] ?? 75;
    }
    requestedTotalUnitAreaSqM += unitArea * (item.count || 1);
    totalConfiguredUnits += item.count || 1;
  }
  requestedTotalUnitAreaSqM = Number(requestedTotalUnitAreaSqM.toFixed(2));
  if (totalConfiguredUnits !== flatsPerFloor && unitMix.length > 0) {
    conflicts.push({
      code: "UNIT_COUNT_MISMATCH",
      severity: "warning",
      message: `Configured unit mix specifies ${totalConfiguredUnits} flats, but floor plan target is ${flatsPerFloor} flats per floor.`,
      metric: { required: flatsPerFloor, available: totalConfiguredUnits, unit: "flats" }
    });
  }
  if (requestedTotalUnitAreaSqM > netResidentialAreaSqM) {
    conflicts.push({
      code: "UNIT_AREA_EXCEEDS_FLOOR_PLATE",
      severity: "error",
      message: `${flatsPerFloor} flats per floor (${requestedTotalUnitAreaSqM} m\xB2 required carpet) cannot be accommodated within net residential floor plate (${netResidentialAreaSqM} m\xB2 available) under ${rulesProfile.jurisdictionName} setbacks.`,
      metric: {
        required: Math.round(requestedTotalUnitAreaSqM),
        available: Math.round(netResidentialAreaSqM),
        unit: "m\xB2"
      }
    });
  }
  if (coreAreaSqM > maxFloorPlateSqM * 0.42) {
    conflicts.push({
      code: "CORE_AREA_DISPROPORTIONATE",
      severity: "error",
      message: `Common lift/stair core (${coreAreaSqM} m\xB2) consumes ${Math.round(coreAreaSqM / maxFloorPlateSqM * 100)}% of the buildable floor plate, exceeding the 42% spatial viability threshold.`,
      metric: {
        required: Math.round(maxFloorPlateSqM * 0.42),
        available: Math.round(coreAreaSqM),
        unit: "m\xB2"
      }
    });
  }
  const parkingResult = rulesProfile.calculateParking(unitMix.map((u) => ({
    unitType: u.unitType,
    count: (u.count || 1) * floorCount,
    carpetAreaSqFt: u.carpetAreaSqFt
  })));
  const totalCars = parkingResult.residentCars + parkingResult.visitorCars;
  const requiredParkingAreaSqM = Number((totalCars * 22 + parkingResult.twoWheelers * 3).toFixed(2));
  const buildingFootprintSqM = maxFloorPlateSqM;
  const availableGroundOpenSpaceSqM = Number(Math.max(0, siteAreaSqM - buildingFootprintSqM).toFixed(2));
  if (requiredParkingAreaSqM > availableGroundOpenSpaceSqM && totalCars > 4) {
    const exceedsPhysicalMultiLevel = requiredParkingAreaSqM > siteAreaSqM * 2;
    const isLowRiseWithoutStilt = floorCount <= 2;
    conflicts.push({
      code: "PARKING_EXCEEDS_SITE_OPEN_SPACE",
      severity: exceedsPhysicalMultiLevel || isLowRiseWithoutStilt ? "error" : "warning",
      message: `Surface open space (${Math.round(availableGroundOpenSpaceSqM)} m\xB2) cannot accommodate mandatory parking for ${totalCars} cars and ${parkingResult.twoWheelers} two-wheelers (${Math.round(requiredParkingAreaSqM)} m\xB2 required under ${rulesProfile.jurisdictionName} Table 21). Stilt, podium, or basement parking is required.`,
      metric: {
        required: Math.round(requiredParkingAreaSqM),
        available: Math.round(availableGroundOpenSpaceSqM),
        unit: "m\xB2"
      }
    });
  }
  if (buildingHeightM > 15 && (commonCore.passengerLifts ?? 0) === 0 && rulesProfile.liftRequirements.minPassengerLifts > 0) {
    conflicts.push({
      code: "LIFT_MANDATORY_FOR_HEIGHT",
      severity: "warning",
      message: `Building height (${buildingHeightM.toFixed(1)} m / ${floorCount} floors) requires at least ${rulesProfile.liftRequirements.minPassengerLifts} passenger lift(s) under ${rulesProfile.jurisdictionName}.`
    });
  }
  if (secondStairRequired && (commonCore.staircaseCount ?? 1) < 2) {
    conflicts.push({
      code: "SECOND_STAIRCASE_MANDATORY",
      severity: "warning",
      message: `Building scale (${floorCount} floors / ${Math.round(maxFloorPlateSqM)} m\xB2 floor plate) requires 2 fire evacuation staircases under ${rulesProfile.jurisdictionName} fire safety regulations.`
    });
  }
  const isFeasible = conflicts.every((c) => c.severity !== "error");
  return {
    feasible: isFeasible,
    jurisdiction,
    floorType: floorStrategy,
    siteAreaSqM,
    buildableEnvelopeSqM,
    maxFloorPlateSqM,
    coreAreaSqM,
    circulationSqM,
    netResidentialAreaSqM,
    requestedTotalUnitAreaSqM,
    availableGroundOpenSpaceSqM,
    requiredResidentCars: parkingResult.residentCars,
    requiredVisitorCars: parkingResult.visitorCars,
    requiredTwoWheelers: parkingResult.twoWheelers,
    requiredParkingAreaSqM,
    stairWidthRequiredM: stairWidth,
    secondStaircaseRequired: secondStairRequired,
    liftsRequired: effectiveLifts,
    conflicts,
    rulesProfile
  };
}
var init_feasibility = __esm({
  "../ai-orchestration/dist/apartment/feasibility.js"() {
    "use strict";
    init_jurisdiction();
    init_site_defaults();
  }
});

// ../ai-orchestration/dist/apartment/questionnaire.js
function checkApartmentCompleteness(config) {
  const missingFields = [];
  const questions = [];
  if (!config || !config.jurisdiction) {
    missingFields.push("jurisdiction");
    questions.push({
      id: "jurisdiction",
      question: "Which planning jurisdiction and development authority governs this project?",
      description: "Determines applicable statutory minimums (UDCPR 2020 vs Mumbai DCPR 2034 vs NBC 2016).",
      type: "select",
      options: [
        "Pune / PMC (Pune Municipal Corporation)",
        "Pune / PMRDA (Pune Metropolitan Region)",
        "Mumbai / MCGM (Greater Mumbai DCPR 2034)",
        "Generic Maharashtra (UDCPR-2020)",
        "Generic Indian (NBC 2016 Reference)"
      ],
      defaultValue: "Pune / PMC (Pune Municipal Corporation)"
    });
  }
  if (!config || !config.flatsPerFloor || config.flatsPerFloor < 1) {
    missingFields.push("flatsPerFloor");
    questions.push({
      id: "flatsPerFloor",
      question: "How many flats per floor are required?",
      description: "Exact number of residential tenements sharing a central core.",
      type: "select",
      options: ["1 flat / floor", "2 flats / floor", "3 flats / floor", "4 flats / floor", "5 flats / floor", "6 flats / floor"],
      defaultValue: "4 flats / floor"
    });
  }
  if (!config || !config.floorCount || config.floorCount < 1) {
    missingFields.push("floorCount");
    questions.push({
      id: "floorCount",
      question: "How many floors are planned for this apartment building?",
      description: "E.g., Ground + 4 (5 Floors), Ground + 7 (8 Floors). Sets staircase width and lift mandates.",
      type: "select",
      options: ["G+3 (4 Floors)", "G+4 (5 Floors)", "G+5 (6 Floors)", "G+7 (8 Floors)", "G+10 (11 Floors)"],
      defaultValue: "G+4 (5 Floors)"
    });
  }
  const mixTotal = config?.unitMix ? config.unitMix.reduce((sum2, u) => sum2 + (u.count || 0), 0) : 0;
  if (!config?.unitMix || config.unitMix.length === 0 || mixTotal <= 0) {
    missingFields.push("unitMix");
    questions.push({
      id: "unitMix",
      question: "What unit mix is required for this apartment?",
      description: "Specify exact count and typologies (e.g. 2 x 2BHK and 2 x 3BHK).",
      type: "unit_mix",
      defaultValue: [
        { unitType: "2BHK", count: 2 },
        { unitType: "3BHK", count: 2 }
      ]
    });
  }
  if (config && !config.floorStrategy) {
  }
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    questions
  };
}
var init_questionnaire = __esm({
  "../ai-orchestration/dist/apartment/questionnaire.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/types/apartment.js
function validateApartmentFeasibility(site, config) {
  const detailed = validateIndianApartmentFeasibility({
    site,
    floorCount: config.floorCount || 4,
    flatsPerFloor: config.flatsPerFloor || 4,
    unitMix: config.unitMix || [],
    commonCore: config.commonCore,
    jurisdiction: config.jurisdiction || "pune_pmc",
    floorStrategy: config.floorStrategy || "typical",
    targetCarpetAreaSqFtPerUnit: config.targetCarpetAreaSqFtPerUnit
  });
  return {
    feasible: detailed.feasible,
    siteAreaSqM: detailed.siteAreaSqM,
    buildableEnvelopeSqM: detailed.buildableEnvelopeSqM,
    maxFloorPlateSqM: detailed.maxFloorPlateSqM,
    coreAreaSqM: detailed.coreAreaSqM,
    circulationSqM: detailed.circulationSqM,
    netResidentialAreaSqM: detailed.netResidentialAreaSqM,
    requestedTotalUnitAreaSqM: detailed.requestedTotalUnitAreaSqM,
    availableGroundOpenSpaceSqM: detailed.availableGroundOpenSpaceSqM,
    requiredParkingAreaSqM: detailed.requiredParkingAreaSqM,
    conflicts: detailed.conflicts,
    detailedResult: detailed
  };
}
var init_apartment = __esm({
  "../ai-orchestration/dist/types/apartment.js"() {
    "use strict";
    init_jurisdiction();
    init_typologies();
    init_floor_configuration();
    init_schematic();
    init_feasibility();
    init_questionnaire();
  }
});

// ../ai-orchestration/dist/orchestration/vision-interpretation.js
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
var roomProps, roomRequired, doorProps, windowProps, IMAGE_INTERPRETATION_SCHEMA, COMMON_AREA_FLAT_ID, APARTMENT_INTERPRETATION_FRAME, flatIdProp, groupedRoomItem, coreElementItem, commonElementItem, APARTMENT_IMAGE_INTERPRETATION_SCHEMA;
var init_vision_interpretation = __esm({
  "../ai-orchestration/dist/orchestration/vision-interpretation.js"() {
    "use strict";
    init_base();
    roomProps = {
      id: { type: "string" },
      name: { type: "string" },
      type: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      width: { type: "number", exclusiveMinimum: 0 },
      height: { type: "number", exclusiveMinimum: 0 }
    };
    roomRequired = ["id", "name", "type", "x", "y", "width", "height"];
    doorProps = {
      id: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      width: { type: "number" },
      height: { type: "number" },
      type: { type: "string", enum: ["single", "double", "sliding", "open_passage", "unknown"] },
      swingDirection: { type: "string", enum: ["inward", "outward", "left", "right", "unknown"] },
      adjacentRoomId: { type: "string" }
    };
    windowProps = {
      id: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
      width: { type: "number" },
      height: { type: "number" },
      adjacentRoomId: { type: "string" }
    };
    IMAGE_INTERPRETATION_SCHEMA = {
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
    COMMON_AREA_FLAT_ID = "COMMON";
    APARTMENT_INTERPRETATION_FRAME = { width: 1e3, height: 1e3 };
    flatIdProp = {
      type: "string",
      description: `Id of the flat (flats[].id) this space belongs to, or "${COMMON_AREA_FLAT_ID}" for shared common space.`
    };
    groupedRoomItem = {
      type: "object",
      additionalProperties: false,
      required: [...roomRequired, "flatId"],
      properties: { ...roomProps, flatId: flatIdProp }
    };
    coreElementItem = {
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "x", "y", "width", "height", "flatId"],
      properties: { ...roomProps, flatId: flatIdProp }
    };
    commonElementItem = {
      type: "object",
      additionalProperties: false,
      required: ["id", "name", "x", "y", "width", "height"],
      properties: roomProps
    };
    APARTMENT_IMAGE_INTERPRETATION_SCHEMA = {
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
  }
});

// ../ai-orchestration/dist/orchestration/architectural-evaluation.js
async function evaluatePlanArchitecturally(provider, options) {
  const systemPrompt = [
    "You are a senior residential architect reviewing a validated floor plan.",
    "Score each architectural dimension 0-100 and return ONLY the JSON object defined by the schema.",
    "Never claim code compliance, structural safety or professional approval.",
    "Evaluate requirement satisfaction, spatial quality, circulation, adjacency, zoning, privacy, daylight, efficiency, room proportions and orientation separately."
  ].join(" ");
  const userPrompt = [
    "Evaluate this valid floor plan architecturally.",
    `Plan: ${options.buildingSummary}`,
    `Requirements: ${options.requirementsSummary}`
  ].join("\n");
  const apiResponse = await provider.complete({
    taskType: "design_critique",
    systemPrompt,
    userPrompt,
    // Explicit typed image part (recovery Phase 4, P8).
    ...options.imageBase64 ? { images: [{ mimeType: options.imageMimeType ?? "image/png", data: options.imageBase64 }] } : {},
    responseFormat: "json",
    responseSchema: ARCHITECTURAL_EVALUATION_SCHEMA,
    maxTokens: 2e3,
    temperature: 0
  });
  const parsed = apiResponse.parsed;
  if (parsed === void 0) {
    throw new AISafetyError("Gemini architectural evaluation returned no structured score.");
  }
  const record3 = parsed;
  return {
    overallScore: Number(record3.overallScore ?? 0),
    requirementSatisfaction: Number(record3.requirementSatisfaction ?? 0),
    spatialQuality: Number(record3.spatialQuality ?? 0),
    circulation: Number(record3.circulation ?? 0),
    adjacency: Number(record3.adjacency ?? 0),
    zoning: Number(record3.zoning ?? 0),
    privacy: Number(record3.privacy ?? 0),
    daylight: Number(record3.daylight ?? 0),
    efficiency: Number(record3.efficiency ?? 0),
    roomProportions: Number(record3.roomProportions ?? 0),
    orientation: Number(record3.orientation ?? 0),
    strengths: Array.isArray(record3.strengths) ? record3.strengths.map(String) : [],
    concerns: Array.isArray(record3.concerns) ? record3.concerns.map(String) : [],
    rationale: typeof record3.rationale === "string" ? record3.rationale : "",
    model: apiResponse.model,
    latencyMs: apiResponse.latencyMs
  };
}
var ARCHITECTURAL_EVALUATION_SCHEMA;
var init_architectural_evaluation = __esm({
  "../ai-orchestration/dist/orchestration/architectural-evaluation.js"() {
    "use strict";
    init_base();
    ARCHITECTURAL_EVALUATION_SCHEMA = {
      type: "object",
      additionalProperties: false,
      required: ["overallScore", "requirementSatisfaction", "spatialQuality", "circulation", "adjacency", "zoning", "privacy", "daylight", "efficiency", "roomProportions", "orientation", "strengths", "concerns"],
      properties: {
        overallScore: { type: "number", minimum: 0, maximum: 100 },
        requirementSatisfaction: { type: "number", minimum: 0, maximum: 100 },
        spatialQuality: { type: "number", minimum: 0, maximum: 100 },
        circulation: { type: "number", minimum: 0, maximum: 100 },
        adjacency: { type: "number", minimum: 0, maximum: 100 },
        zoning: { type: "number", minimum: 0, maximum: 100 },
        privacy: { type: "number", minimum: 0, maximum: 100 },
        daylight: { type: "number", minimum: 0, maximum: 100 },
        efficiency: { type: "number", minimum: 0, maximum: 100 },
        roomProportions: { type: "number", minimum: 0, maximum: 100 },
        orientation: { type: "number", minimum: 0, maximum: 100 },
        strengths: { type: "array", items: { type: "string" } },
        concerns: { type: "array", items: { type: "string" } },
        rationale: { type: "string" }
      }
    };
  }
});

// ../ai-orchestration/dist/orchestration/apartment-preflight.js
async function runGeminiApartmentPreflight(aiProvider, imageBase64, expected, imageMimeType = "image/png") {
  const unitMixDesc = expected.unitMix && expected.unitMix.length > 0 ? ` (${expected.unitMix.map((u) => `${u.count} x ${u.unitType}`).join(", ")})` : "";
  const userPrompt = `Analyze the attached generated floor-plan image. The brief requires: ${expected.flatsPerFloor} flats per floor${unitMixDesc}, ${expected.liftCount} lift(s), ${expected.stairCount} staircase(s). Return structured JSON according to the schema.`;
  const result = await aiProvider.complete({
    taskType: "image_interpretation",
    systemPrompt: APARTMENT_PREFLIGHT_PROMPT,
    userPrompt,
    // Explicit typed image part (recovery Phase 4, P8) — never embedded in text.
    images: [{ mimeType: imageMimeType, data: imageBase64 }],
    responseFormat: "json",
    responseSchema: APARTMENT_PREFLIGHT_SCHEMA,
    temperature: 0.1,
    maxTokens: 2048
  });
  let parsed = result.parsed;
  if (!parsed && typeof result.content === "string") {
    try {
      parsed = JSON.parse(result.content);
    } catch {
    }
  }
  const features = parsed ?? {};
  return evaluateApartmentPreflight(features, expected);
}
function evaluateApartmentPreflight(detected, expected) {
  const failureReasons = [];
  const flatCount = detected.flatCount ?? 0;
  const liftCount = detected.liftCount ?? 0;
  const stairCount = detected.stairCount ?? 0;
  const commonCore = detected.commonCore ?? false;
  const unitSeparation = detected.unitSeparation ?? false;
  const isApartmentLayout = detected.isApartmentLayout ?? true;
  const labelLanguage = detected.labelLanguage ?? "English";
  const visualQuality = detected.visualQuality ?? 5;
  if (!isApartmentLayout) {
    failureReasons.push("Generated image resembles a standalone single-family villa rather than a multi-unit apartment building.");
  }
  if (flatCount !== expected.flatsPerFloor) {
    failureReasons.push(`Flat count mismatch: Requested ${expected.flatsPerFloor} flats, but image shows ${flatCount} flats.`);
  }
  if (expected.unitMix && expected.unitMix.length > 0 && detected.unitMix && detected.unitMix.length > 0) {
    const expectedMixCounts = /* @__PURE__ */ new Map();
    for (const item of expected.unitMix) {
      const typeNorm = item.unitType.toUpperCase().replace(/\s+/g, "");
      expectedMixCounts.set(typeNorm, (expectedMixCounts.get(typeNorm) ?? 0) + item.count);
    }
    const detectedMixCounts = /* @__PURE__ */ new Map();
    for (const u of detected.unitMix) {
      const typeNorm = u.toUpperCase().replace(/\s+/g, "");
      detectedMixCounts.set(typeNorm, (detectedMixCounts.get(typeNorm) ?? 0) + 1);
    }
    for (const [type, count] of expectedMixCounts.entries()) {
      const detCount = detectedMixCounts.get(type) ?? 0;
      if (detCount !== count) {
        failureReasons.push(`Unit mix mismatch: Expected ${count} x ${type}, but detected ${detCount} x ${type}.`);
      }
    }
  }
  if (expected.commonCoreRequired && !commonCore) {
    failureReasons.push("Common central core (shared lobby/corridor) is missing or illegible.");
  }
  if (expected.flatsPerFloor > 1 && !unitSeparation) {
    failureReasons.push("Flats lack clear separation; boundary walls between units are ambiguous.");
  }
  if (expected.liftCount > 0 && liftCount < expected.liftCount) {
    failureReasons.push(`Lift count insufficient: Requested ${expected.liftCount} lift(s), but detected ${liftCount}.`);
  }
  if (expected.stairCount > 0 && stairCount < expected.stairCount) {
    failureReasons.push(`Staircase count insufficient: Requested ${expected.stairCount} stair(s), but detected ${stairCount}.`);
  }
  const langLower = labelLanguage.toLowerCase();
  if (langLower.includes("cyrillic") || langLower.includes("russian")) {
    failureReasons.push(`Forbidden script detected: Floor plan contains ${labelLanguage} text instead of English.`);
  }
  if (visualQuality < 4) {
    failureReasons.push(`Visual quality score (${visualQuality}/10) is below acceptable architectural threshold.`);
  }
  const pass = failureReasons.length === 0;
  const matchingSummary = pass ? `Visual acceptance PASS: ${flatCount} flats, ${liftCount} lifts, ${stairCount} stairs, English labels, verified central core.` : `Visual acceptance FAIL: ${failureReasons.join("; ")}`;
  const completeDetected = {
    flatCount,
    unitMix: detected.unitMix ?? [],
    liftCount,
    stairCount,
    commonCore,
    unitSeparation,
    majorRooms: detected.majorRooms ?? [],
    balconies: detected.balconies ?? false,
    utilities: detected.utilities ?? false,
    parking: detected.parking ?? false,
    labelLanguage,
    isApartmentLayout,
    visualQuality,
    confidence: detected.confidence ?? 0.8,
    observations: detected.observations ?? ""
  };
  return {
    pass,
    detected: completeDetected,
    failureReasons,
    matchingSummary
  };
}
var APARTMENT_PREFLIGHT_SCHEMA, APARTMENT_PREFLIGHT_PROMPT;
var init_apartment_preflight = __esm({
  "../ai-orchestration/dist/orchestration/apartment-preflight.js"() {
    "use strict";
    APARTMENT_PREFLIGHT_SCHEMA = {
      type: "object",
      properties: {
        flatCount: {
          type: "integer",
          description: "The exact number of distinct self-contained apartment flats/units shown on this floor plate."
        },
        unitMix: {
          type: "array",
          items: { type: "string" },
          description: 'The typologies identified for each flat (e.g. ["2BHK", "3BHK"] or ["2BHK", "2BHK"]).'
        },
        liftCount: {
          type: "integer",
          description: "Number of elevators/lifts visible in the common core."
        },
        stairCount: {
          type: "integer",
          description: "Number of distinct staircase blocks visible (e.g. main stair + fire escape stair)."
        },
        commonCore: {
          type: "boolean",
          description: "True if there is an identifiable central/shared lobby corridor connecting the flats."
        },
        unitSeparation: {
          type: "boolean",
          description: "True if the individual flats have distinct party walls separating them with private entrances."
        },
        majorRooms: {
          type: "array",
          items: { type: "string" },
          description: "List of identifiable room types (Living, Dining, Kitchen, Master Bedroom, Balcony, etc.)."
        },
        balconies: {
          type: "boolean",
          description: "True if balconies or sit-outs are visible on the apartment perimeters."
        },
        utilities: {
          type: "boolean",
          description: "True if utility dry balconies or wet service areas are visible attached to kitchens."
        },
        parking: {
          type: "boolean",
          description: "True if parking bays or vehicle driveways are shown."
        },
        labelLanguage: {
          type: "string",
          enum: ["English", "Cyrillic", "Russian", "Mixed", "Other"],
          description: "Language or script of text labels in the floor plan."
        },
        isApartmentLayout: {
          type: "boolean",
          description: "True if this is an orthographic multi-unit apartment floor plan. False if it is a standalone villa, single-family house, or 3D view."
        },
        visualQuality: {
          type: "integer",
          description: "Visual clarity and technical linework quality score from 1 (unusable) to 10 (pristine architectural CAD)."
        },
        confidence: {
          type: "number",
          description: "Confidence in analysis from 0.0 to 1.0."
        },
        observations: {
          type: "string",
          description: "Concise architectural observations of the floor plate."
        }
      },
      required: [
        "flatCount",
        "unitMix",
        "liftCount",
        "stairCount",
        "commonCore",
        "unitSeparation",
        "labelLanguage",
        "isApartmentLayout",
        "visualQuality",
        "confidence"
      ]
    };
    APARTMENT_PREFLIGHT_PROMPT = `
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
  }
});

// ../ai-orchestration/dist/apartment/schematic-renderer.js
function crc322(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    const byte = buf[i] ?? 0;
    const lookup = table[(crc ^ byte) & 255] ?? 0;
    crc = crc >>> 8 ^ lookup;
  }
  return (crc ^ -1) >>> 0;
}
function makePngChunk2(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crcPayload = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc322(crcPayload), 0);
  return Buffer.concat([lenBuf, crcPayload, crcBuf]);
}
function getRoomAbbreviation(name, type) {
  const norm = `${name} ${type}`.toLowerCase();
  if (norm.includes("bath") || norm.includes("toilet") || norm.includes("powder"))
    return { full: "BATH", short: "WC" };
  if (type === "utility" || norm.includes("utility"))
    return { full: "UTILITY", short: "UTIL" };
  if (type === "passage" || norm.includes("passage"))
    return { full: "PASSAGE", short: "PASS" };
  if (type === "dress" || norm.includes("dressing"))
    return { full: "DRESS", short: "DR" };
  if (type === "store" || norm.includes("store"))
    return { full: "STORE", short: "ST" };
  if (type === "study" || norm.includes("study"))
    return { full: "STUDY", short: "STDY" };
  if (norm.includes("master") && norm.includes("bed"))
    return { full: "MASTER BED", short: "M.BED" };
  if (norm.includes("bed"))
    return { full: "BEDROOM", short: "BED" };
  if (norm.includes("living") && norm.includes("dining"))
    return { full: "LIVING/DINING", short: "LIV/DIN" };
  if (norm.includes("living"))
    return { full: "LIVING", short: "LIV" };
  if (norm.includes("dining"))
    return { full: "DINING", short: "DIN" };
  if (norm.includes("kitchen"))
    return { full: "KITCHEN", short: "KIT" };
  if (norm.includes("balcony") || norm.includes("terrace") || norm.includes("sit-out"))
    return { full: "BALCONY", short: "BALC" };
  if (norm.includes("utility") || norm.includes("wash") || norm.includes("dry"))
    return { full: "UTILITY", short: "UTIL" };
  if (norm.includes("pooja") || norm.includes("puja"))
    return { full: "POOJA", short: "PUJA" };
  if (norm.includes("foyer") || norm.includes("entry"))
    return { full: "FOYER", short: "ENT" };
  if (norm.includes("duct") || norm.includes("shaft") || norm.includes("ots"))
    return { full: "DUCT", short: "DUCT" };
  const fallback = name.toUpperCase().slice(0, 8);
  return { full: fallback, short: fallback.slice(0, 4) };
}
function fluxConceptRoomLabel(name, type) {
  const norm = `${name} ${type}`.toLowerCase();
  if (norm.includes("bath") || norm.includes("toilet") || norm.includes("powder"))
    return { lines: ["BATH"], fallback: ["WC"] };
  if (type === "utility" || norm.includes("utility") || norm.includes("wash"))
    return { lines: ["UTILITY"], fallback: ["UTIL"] };
  if (type === "passage" || norm.includes("passage") || type === "dress" || norm.includes("dress"))
    return null;
  if (type === "store" || norm.includes("store"))
    return null;
  if (norm.includes("balcony") || norm.includes("terrace") || norm.includes("sit-out"))
    return null;
  if (norm.includes("duct") || norm.includes("shaft") || norm.includes("ots"))
    return null;
  if (type === "study" || norm.includes("study"))
    return { lines: ["STUDY"], fallback: null };
  if (norm.includes("pooja") || norm.includes("puja"))
    return { lines: ["POOJA"], fallback: null };
  if (norm.includes("bed"))
    return { lines: ["BEDROOM"], fallback: ["BED"] };
  if (norm.includes("living") && norm.includes("dining"))
    return { lines: ["LIVING", "DINING"], fallback: null };
  if (norm.includes("living"))
    return { lines: ["LIVING"], fallback: null };
  if (norm.includes("dining"))
    return { lines: ["DINING"], fallback: null };
  if (norm.includes("kitchen"))
    return { lines: ["KITCHEN"], fallback: ["KIT"] };
  if (norm.includes("foyer") || norm.includes("entry"))
    return { lines: ["FOYER"], fallback: null };
  return null;
}
function renderSchematicPng512(schematic, options = {}) {
  const width = 512;
  const height = 512;
  const flux = options.mode === "flux_concept";
  const emit = (label) => options.onLabel?.(label);
  const rowSize = 1 + width * 4;
  const raw = Buffer.alloc(height * rowSize, 255);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0;
  }
  function setPixel(x, y, r, g, b) {
    if (x < 0 || x >= width || y < 0 || y >= height)
      return;
    const offset = y * rowSize + 1 + x * 4;
    raw[offset] = r;
    raw[offset + 1] = g;
    raw[offset + 2] = b;
    raw[offset + 3] = 255;
  }
  function fillRect(rx, ry, rw, rh, r, g, b) {
    const x0 = Math.max(0, Math.min(width - 1, Math.round(rx)));
    const y0 = Math.max(0, Math.min(height - 1, Math.round(ry)));
    const x1 = Math.max(0, Math.min(width - 1, Math.round(rx + rw)));
    const y1 = Math.max(0, Math.min(height - 1, Math.round(ry + rh)));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        setPixel(x, y, r, g, b);
      }
    }
  }
  function drawLine(x0, y0, x1, y1, r, g, b, thickness = 1) {
    let px0 = Math.round(x0);
    let py0 = Math.round(y0);
    const px1 = Math.round(x1);
    const py1 = Math.round(y1);
    const dx = Math.abs(px1 - px0);
    const dy = Math.abs(py1 - py0);
    const sx = px0 < px1 ? 1 : -1;
    const sy = py0 < py1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      if (thickness <= 1) {
        setPixel(px0, py0, r, g, b);
      } else {
        const rad = Math.floor(thickness / 2);
        for (let ty = -rad; ty <= rad; ty++) {
          for (let tx = -rad; tx <= rad; tx++) {
            setPixel(px0 + tx, py0 + ty, r, g, b);
          }
        }
      }
      if (px0 === px1 && py0 === py1)
        break;
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
  function drawRectOutline(rx, ry, rw, rh, thickness = 1, r = 0, g = 0, b = 0) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);
    for (let t = 0; t < thickness; t++) {
      drawLine(x0, y0 + t, x1, y0 + t, r, g, b, 1);
      drawLine(x0, y1 - t, x1, y1 - t, r, g, b, 1);
      drawLine(x0 + t, y0, x0 + t, y1, r, g, b, 1);
      drawLine(x1 - t, y0, x1 - t, y1, r, g, b, 1);
    }
  }
  function drawCross(rx, ry, rw, rh, r = 0, g = 0, b = 0, thickness = 1) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);
    drawLine(x0, y0, x1, y1, r, g, b, thickness);
    drawLine(x1, y0, x0, y1, r, g, b, thickness);
  }
  function drawHatch(rx, ry, rw, rh, step = 5, horizontal = true, r = 0, g = 0, b = 0) {
    const x0 = Math.round(rx);
    const y0 = Math.round(ry);
    const x1 = Math.round(rx + rw);
    const y1 = Math.round(ry + rh);
    if (horizontal) {
      for (let y = y0 + step; y < y1; y += step) {
        drawLine(x0, y, x1, y, r, g, b, 1);
      }
    } else {
      for (let x = x0 + step; x < x1; x += step) {
        drawLine(x, y0, x, y1, r, g, b, 1);
      }
    }
  }
  function measureTextWidth(text, scale2 = 1) {
    return text.length * 6 * scale2;
  }
  function drawChar(ch, startX, startY, scale2 = 1, r = 0, g = 0, b = 0) {
    const glyph = FONT_5X7[ch.toUpperCase()] ?? FONT_5X7[" "];
    if (!glyph)
      return;
    for (let col = 0; col < 5; col++) {
      const colByte = glyph[col] ?? 0;
      for (let row = 0; row < 7; row++) {
        if ((colByte & 1 << row) !== 0) {
          if (scale2 === 1) {
            setPixel(startX + col, startY + row, r, g, b);
          } else {
            for (let dy = 0; dy < scale2; dy++) {
              for (let dx = 0; dx < scale2; dx++) {
                setPixel(startX + col * scale2 + dx, startY + row * scale2 + dy, r, g, b);
              }
            }
          }
        }
      }
    }
  }
  function drawText(text, startX, startY, scale2 = 1, r = 0, g = 0, b = 0) {
    let curX = startX;
    for (let i = 0; i < text.length; i++) {
      drawChar(text[i], curX, startY, scale2, r, g, b);
      curX += 6 * scale2;
    }
  }
  function drawTextCentered(text, rx, ry, rw, rh, scale2 = 1, r = 0, g = 0, b = 0, withBackdrop = false) {
    const textW = measureTextWidth(text, scale2);
    const textH = 7 * scale2;
    const cx = Math.round(rx + (rw - textW) / 2);
    const cy = Math.round(ry + (rh - textH) / 2);
    if (withBackdrop) {
      fillRect(cx - 2, cy - 2, textW + 4, textH + 4, 255, 255, 255);
    }
    drawText(text, cx, cy, scale2, r, g, b);
  }
  const boldWidth = (text, s) => measureTextWidth(text, s) + 1;
  function drawBoldCentered(text, rx, ry, rw, rh, s, gray = 0) {
    const textW = boldWidth(text, s);
    const textH = 7 * s;
    const cx = Math.round(rx + (rw - textW) / 2);
    const cy = Math.round(ry + (rh - textH) / 2);
    fillRect(cx - 2, cy - 2, textW + 4, textH + 4, 255, 255, 255);
    drawText(text, cx, cy, s, gray, gray, gray);
    drawText(text, cx + 1, cy, s, gray, gray, gray);
  }
  const LINE_GAP = 3;
  const blockHeight = (lines, s) => lines.length * 7 * s + (lines.length - 1) * LINE_GAP;
  function fitScale(lines, rw, rh, margin = 6, maxScale = 2) {
    for (const s of [2, 1].filter((v) => v <= maxScale)) {
      const w = Math.max(...lines.map((l) => boldWidth(l, s)));
      if (w + margin <= rw && blockHeight(lines, s) + margin <= rh)
        return s;
    }
    return 0;
  }
  function drawBoldLines(lines, rx, top, rw, s) {
    let y = top;
    for (const line of lines) {
      drawBoldCentered(line, rx, y, rw, 7 * s, s);
      y += 7 * s + LINE_GAP;
    }
  }
  const bf = schematic.buildingFootprint ?? { x: 0, y: 0, width: 24, height: 30 };
  const targetCanvasPx = flux ? 460 : 430;
  const scale = targetCanvasPx / Math.max(bf.width, bf.height);
  const offsetX = Math.round((width - bf.width * scale) / 2 - bf.x * scale);
  const offsetY = Math.round((height - bf.height * scale) / 2 - bf.y * scale);
  const toPx = (mX, mY, mW, mH) => ({
    x: offsetX + mX * scale,
    y: offsetY + mY * scale,
    w: mW * scale,
    h: mH * scale
  });
  const spaceRects = /* @__PURE__ */ new Map();
  if (schematic.core?.lobby)
    spaceRects.set("core_lobby", schematic.core.lobby.bounds);
  for (const lift of schematic.core?.lifts ?? [])
    spaceRects.set(lift.id, lift.bounds);
  for (const stair of schematic.core?.stairs ?? [])
    spaceRects.set(stair.id, stair.bounds);
  for (const u of schematic.units ?? [])
    for (const rm of [...u.rooms ?? [], ...u.balconies ?? []])
      spaceRects.set(rm.id, rm.bounds);
  if (flux) {
    renderFluxConceptBody();
  } else {
    if (schematic.core) {
      if (schematic.core.lobby) {
        const lb = schematic.core.lobby.bounds;
        const lbp = toPx(lb.x, lb.y, lb.width, lb.height);
        drawRectOutline(lbp.x, lbp.y, lbp.w, lbp.h, 2, 0, 0, 0);
        const vertical = lbp.h > lbp.w * 1.6;
        const lobbyLabel = measureTextWidth("COMMON LOBBY", 1) + 4 <= lbp.w ? "COMMON LOBBY" : "LOBBY";
        if (vertical && lobbyLabel === "LOBBY" && measureTextWidth("LOBBY", 1) + 4 > lbp.w) {
          drawTextCentered("LBY", lbp.x, lbp.y, lbp.w, lbp.h, 1, 0, 0, 0, true);
          emit({ text: "LBY", kind: "core", spaceId: "core_lobby", scale: 1 });
        } else {
          drawTextCentered(lobbyLabel, lbp.x, lbp.y, lbp.w, lbp.h, 1, 0, 0, 0, true);
          emit({ text: lobbyLabel, kind: "core", spaceId: "core_lobby", scale: 1 });
        }
      }
      (schematic.core.lifts ?? []).forEach((lift, idx) => {
        const lp = toPx(lift.bounds.x, lift.bounds.y, lift.bounds.width, lift.bounds.height);
        fillRect(lp.x, lp.y, lp.w, lp.h, 255, 255, 255);
        drawRectOutline(lp.x, lp.y, lp.w, lp.h, 2, 0, 0, 0);
        drawCross(lp.x, lp.y, lp.w, lp.h, 0, 0, 0, 1);
        const label = lift.label || `LIFT 0${idx + 1}`;
        const liftText = measureTextWidth(label, 1) + 2 <= lp.w ? label : `L${idx + 1}`;
        drawTextCentered(liftText, lp.x, lp.y, lp.w, lp.h, 1, 0, 0, 0, true);
        emit({ text: liftText, kind: "core", spaceId: lift.id, scale: 1 });
      });
      (schematic.core.stairs ?? []).forEach((stair, idx) => {
        const sp = toPx(stair.bounds.x, stair.bounds.y, stair.bounds.width, stair.bounds.height);
        fillRect(sp.x, sp.y, sp.w, sp.h, 255, 255, 255);
        drawRectOutline(sp.x, sp.y, sp.w, sp.h, 2, 0, 0, 0);
        drawHatch(sp.x, sp.y, sp.w, sp.h, 5, sp.w >= sp.h, 60, 60, 60);
        const label = `STAIR ${String(idx + 1).padStart(2, "0")}`;
        const stairText = measureTextWidth(label, 1) + 2 <= sp.w ? label : `ST${idx + 1}`;
        drawTextCentered(stairText, sp.x, sp.y, sp.w, sp.h, 1, 0, 0, 0, true);
        emit({ text: stairText, kind: "core", spaceId: stair.id, scale: 1 });
      });
      (schematic.core.corridors ?? []).forEach((corr) => {
        const crp = toPx(corr.bounds.x, corr.bounds.y, corr.bounds.width, corr.bounds.height);
        drawRectOutline(crp.x, crp.y, crp.w, crp.h, 1, 100, 100, 100);
      });
      (schematic.core.serviceShafts ?? []).forEach((shaft) => {
        const shp = toPx(shaft.bounds.x, shaft.bounds.y, shaft.bounds.width, shaft.bounds.height);
        drawRectOutline(shp.x, shp.y, shp.w, shp.h, 1, 0, 0, 0);
        drawCross(shp.x, shp.y, shp.w, shp.h, 120, 120, 120, 1);
        if (measureTextWidth("DUCT", 1) + 4 <= shp.w && shp.h >= 10) {
          drawTextCentered("DUCT", shp.x, shp.y, shp.w, shp.h, 1, 0, 0, 0, true);
          emit({ text: "DUCT", kind: "core", scale: 1 });
        }
      });
    }
    (schematic.units ?? []).forEach((u) => {
      for (const rm of u.rooms ?? []) {
        const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
        drawRectOutline(rp.x, rp.y, rp.w, rp.h, 1, 40, 40, 40);
      }
      for (const bal of u.balconies ?? []) {
        const bp = toPx(bal.bounds.x, bal.bounds.y, bal.bounds.width, bal.bounds.height);
        drawRectOutline(bp.x, bp.y, bp.w, bp.h, 1, 70, 70, 70);
        drawHatch(bp.x, bp.y, bp.w, bp.h, 6, bp.w < bp.h, 200, 200, 200);
        if (measureTextWidth("BALC", 1) + 4 <= bp.w && bp.h >= 10) {
          drawTextCentered("BALC", bp.x, bp.y, bp.w, bp.h, 1, 40, 40, 40, true);
          emit({ text: "BALC", kind: "room", flatId: u.flatId, spaceId: bal.id, scale: 1 });
        } else if (bp.h >= measureTextWidth("BALC", 1) + 4 && bp.w >= 9) {
          drawTextCentered("B", bp.x, bp.y, bp.w, bp.h, 1, 40, 40, 40, true);
          emit({ text: "B", kind: "room", flatId: u.flatId, spaceId: bal.id, scale: 1 });
        }
      }
      const body = u.bodyBounds ?? u.bounds;
      const bdp = toPx(body.x, body.y, body.width, body.height);
      drawRectOutline(bdp.x, bdp.y, bdp.w, bdp.h, 3, 0, 0, 0);
    });
    for (const door of schematic.doors ?? []) {
      const dp = toPx(door.bounds.x, door.bounds.y, door.bounds.width, door.bounds.height);
      const into = spaceRects.get(door.connects[1]);
      if (door.wallAxis === "y") {
        const cx = dp.x + dp.w / 2;
        fillRect(cx - 2, dp.y + 1, 4, dp.h - 2, 255, 255, 255);
        if (door.doorType !== "open_passage" && into) {
          const dir = (into.x + into.width / 2) * scale + offsetX > cx ? 1 : -1;
          const hingeY = dp.y + 1;
          drawLine(cx, hingeY, cx + dir * (dp.h - 2), hingeY, 0, 0, 0, 1);
          drawLine(cx + dir * (dp.h - 2), hingeY, cx, dp.y + dp.h - 1, 150, 150, 150, 1);
        }
      } else {
        const cy = dp.y + dp.h / 2;
        fillRect(dp.x + 1, cy - 2, dp.w - 2, 4, 255, 255, 255);
        if (door.doorType !== "open_passage" && into) {
          const dir = (into.y + into.height / 2) * scale + offsetY > cy ? 1 : -1;
          const hingeX = dp.x + 1;
          drawLine(hingeX, cy, hingeX, cy + dir * (dp.w - 2), 0, 0, 0, 1);
          drawLine(hingeX, cy + dir * (dp.w - 2), dp.x + dp.w - 1, cy, 150, 150, 150, 1);
        }
      }
    }
    (schematic.units ?? []).forEach((u, i) => {
      const body = u.bodyBounds ?? u.bounds;
      const bdp = toPx(body.x, body.y, body.width, body.height);
      const flatLabel = `FLAT ${String(i + 1).padStart(2, "0")}`;
      const typeLabel = u.unitType ? u.unitType.toUpperCase() : "";
      let flatLabelPlaced = false;
      for (const rm of u.rooms ?? []) {
        const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
        const { full, short } = getRoomAbbreviation(rm.name, rm.type);
        if (rm.type === "living_dining" && rp.h >= 34 && measureTextWidth(flatLabel, 1) + 6 <= rp.w) {
          const flatScale = measureTextWidth(flatLabel, 2) + 8 <= rp.w && rp.h >= 56 ? 2 : 1;
          const roomText = measureTextWidth(full, 1) + 6 <= rp.w ? full : short;
          const blockH = 7 * flatScale + 4 + 7 + 5 + 7;
          const top = rp.y + (rp.h - blockH) / 2;
          drawTextCentered(flatLabel, rp.x, top, rp.w, 7 * flatScale, flatScale, 0, 0, 0, true);
          drawTextCentered(typeLabel, rp.x, top + 7 * flatScale + 4, rp.w, 7, 1, 40, 40, 40, true);
          drawTextCentered(roomText, rp.x, top + 7 * flatScale + 16, rp.w, 7, 1, 20, 20, 20, true);
          emit({ text: flatLabel, kind: "flat", flatId: u.flatId, scale: flatScale });
          emit({ text: typeLabel, kind: "unit_type", flatId: u.flatId, scale: 1 });
          emit({ text: roomText, kind: "room", flatId: u.flatId, spaceId: rm.id, scale: 1 });
          flatLabelPlaced = true;
          continue;
        }
        if (measureTextWidth(full, 1) + 6 <= rp.w && rp.h >= 12) {
          drawTextCentered(full, rp.x, rp.y, rp.w, rp.h, 1, 20, 20, 20, true);
          emit({ text: full, kind: "room", flatId: u.flatId, spaceId: rm.id, scale: 1 });
        } else if (measureTextWidth(short, 1) + 4 <= rp.w && rp.h >= 10) {
          drawTextCentered(short, rp.x, rp.y, rp.w, rp.h, 1, 20, 20, 20, true);
          emit({ text: short, kind: "room", flatId: u.flatId, spaceId: rm.id, scale: 1 });
        }
      }
      if (!flatLabelPlaced) {
        const text = `${flatLabel} ${typeLabel}`.trim();
        drawTextCentered(text, bdp.x, bdp.y + 4, bdp.w, 9, 1, 0, 0, 0, true);
        emit({ text, kind: "flat", flatId: u.flatId, scale: 1 });
      }
    });
  }
  function renderFluxConceptBody() {
    const core = schematic.core;
    if (core?.lobby) {
      const lb = core.lobby.bounds;
      const lbp = toPx(lb.x, lb.y, lb.width, lb.height);
      fillRect(lbp.x, lbp.y, lbp.w, lbp.h, 226, 226, 226);
      drawRectOutline(lbp.x, lbp.y, lbp.w, lbp.h, 3, 0, 0, 0);
    }
    for (const corr of core?.corridors ?? []) {
      const crp = toPx(corr.bounds.x, corr.bounds.y, corr.bounds.width, corr.bounds.height);
      fillRect(crp.x, crp.y, crp.w, crp.h, 226, 226, 226);
      drawRectOutline(crp.x, crp.y, crp.w, crp.h, 1, 100, 100, 100);
    }
    for (const lift of core?.lifts ?? []) {
      const lp = toPx(lift.bounds.x, lift.bounds.y, lift.bounds.width, lift.bounds.height);
      fillRect(lp.x, lp.y, lp.w, lp.h, 255, 255, 255);
      drawRectOutline(lp.x, lp.y, lp.w, lp.h, 3, 0, 0, 0);
      drawCross(lp.x + 2, lp.y + 2, lp.w - 4, lp.h - 4, 0, 0, 0, 2);
    }
    for (const stair of core?.stairs ?? []) {
      const sp = toPx(stair.bounds.x, stair.bounds.y, stair.bounds.width, stair.bounds.height);
      fillRect(sp.x, sp.y, sp.w, sp.h, 255, 255, 255);
      drawRectOutline(sp.x, sp.y, sp.w, sp.h, 3, 0, 0, 0);
      const runVertical = sp.h >= sp.w;
      const run = runVertical ? sp.h : sp.w;
      const landing = Math.max(6, Math.round(run * 0.18));
      if (runVertical) {
        for (let y = sp.y + landing; y < sp.y + sp.h - 3; y += 5)
          drawLine(sp.x + 2, y, sp.x + sp.w - 2, y, 40, 40, 40, 1);
        drawLine(sp.x + sp.w / 2, sp.y + landing, sp.x + sp.w / 2, sp.y + sp.h - 2, 0, 0, 0, 2);
        drawLine(sp.x + 2, sp.y + landing, sp.x + sp.w - 2, sp.y + landing, 0, 0, 0, 1);
      } else {
        for (let x = sp.x + landing; x < sp.x + sp.w - 3; x += 5)
          drawLine(x, sp.y + 2, x, sp.y + sp.h - 2, 40, 40, 40, 1);
        drawLine(sp.x + landing, sp.y + sp.h / 2, sp.x + sp.w - 2, sp.y + sp.h / 2, 0, 0, 0, 2);
        drawLine(sp.x + landing, sp.y + 2, sp.x + landing, sp.y + sp.h - 2, 0, 0, 0, 1);
      }
    }
    for (const shaft of core?.serviceShafts ?? []) {
      const shp = toPx(shaft.bounds.x, shaft.bounds.y, shaft.bounds.width, shaft.bounds.height);
      fillRect(shp.x, shp.y, shp.w, shp.h, 150, 150, 150);
      drawRectOutline(shp.x, shp.y, shp.w, shp.h, 1, 0, 0, 0);
    }
    for (const u of schematic.units ?? []) {
      for (const rm of u.rooms ?? []) {
        const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
        drawRectOutline(rp.x, rp.y, rp.w, rp.h, 1, 0, 0, 0);
      }
      for (const bal of u.balconies ?? []) {
        const bp = toPx(bal.bounds.x, bal.bounds.y, bal.bounds.width, bal.bounds.height);
        drawRectOutline(bp.x, bp.y, bp.w, bp.h, 1, 70, 70, 70);
        drawHatch(bp.x, bp.y, bp.w, bp.h, 4, bp.w < bp.h, 170, 170, 170);
      }
      const body = u.bodyBounds ?? u.bounds;
      const bdp = toPx(body.x, body.y, body.width, body.height);
      drawRectOutline(bdp.x, bdp.y, bdp.w, bdp.h, 4, 0, 0, 0);
    }
    for (const door of schematic.doors ?? []) {
      const dp = toPx(door.bounds.x, door.bounds.y, door.bounds.width, door.bounds.height);
      const into = spaceRects.get(door.connects[1]);
      const leaf = door.kind === "flat_entrance" ? 3 : 1;
      if (door.wallAxis === "y") {
        const cx = dp.x + dp.w / 2;
        fillRect(cx - 3, dp.y + 1, 6, dp.h - 2, 255, 255, 255);
        if (door.doorType !== "open_passage" && into) {
          const dir = (into.x + into.width / 2) * scale + offsetX > cx ? 1 : -1;
          const hingeY = dp.y + 1;
          drawLine(cx, hingeY, cx + dir * (dp.h - 2), hingeY, 0, 0, 0, leaf);
          drawLine(cx + dir * (dp.h - 2), hingeY, cx, dp.y + dp.h - 1, 120, 120, 120, 1);
        }
      } else {
        const cy = dp.y + dp.h / 2;
        fillRect(dp.x + 1, cy - 3, dp.w - 2, 6, 255, 255, 255);
        if (door.doorType !== "open_passage" && into) {
          const dir = (into.y + into.height / 2) * scale + offsetY > cy ? 1 : -1;
          const hingeX = dp.x + 1;
          drawLine(hingeX, cy, hingeX, cy + dir * (dp.w - 2), 0, 0, 0, leaf);
          drawLine(hingeX, cy + dir * (dp.w - 2), dp.x + dp.w - 1, cy, 120, 120, 120, 1);
        }
      }
    }
    if (core?.lobby) {
      const lb = core.lobby.bounds;
      const lbp = toPx(lb.x, lb.y, lb.width, lb.height);
      const s = fitScale(["LOBBY"], lbp.w, lbp.h, 4);
      if (s > 0) {
        drawBoldLines(["LOBBY"], lbp.x, lbp.y + (lbp.h - 7 * s) / 2, lbp.w, s);
        emit({ text: "LOBBY", kind: "core", spaceId: "core_lobby", scale: s });
      }
    }
    for (const lift of core?.lifts ?? []) {
      const lp = toPx(lift.bounds.x, lift.bounds.y, lift.bounds.width, lift.bounds.height);
      const s = fitScale(["LIFT"], lp.w, lp.h, 4);
      if (s > 0) {
        drawBoldLines(["LIFT"], lp.x, lp.y + (lp.h - 7 * s) / 2, lp.w, s);
        emit({ text: "LIFT", kind: "core", spaceId: lift.id, scale: s });
      }
    }
    for (const stair of core?.stairs ?? []) {
      const sp = toPx(stair.bounds.x, stair.bounds.y, stair.bounds.width, stair.bounds.height);
      const s = fitScale(["STAIR"], sp.w, sp.h, 4);
      if (s > 0) {
        drawBoldLines(["STAIR"], sp.x, sp.y + (sp.h - 7 * s) / 2, sp.w, s);
        emit({ text: "STAIR", kind: "core", spaceId: stair.id, scale: s });
      }
    }
    (schematic.units ?? []).forEach((u, i) => {
      const flatLabel = `FLAT ${String(i + 1).padStart(2, "0")}`;
      const typeLabel = u.unitType ? u.unitType.toUpperCase() : "";
      const tagLines = typeLabel ? [flatLabel, typeLabel] : [flatLabel];
      let tagPlaced = false;
      for (const rm of u.rooms ?? []) {
        const rp = toPx(rm.bounds.x, rm.bounds.y, rm.bounds.width, rm.bounds.height);
        const spec = fluxConceptRoomLabel(rm.name, rm.type);
        const isLiving = rm.type === "living_dining" || rm.type === "living";
        if (!tagPlaced && isLiving && spec) {
          const tagScale = fitScale(tagLines, rp.w, rp.h * 0.6);
          const roomScale = fitScale(spec.lines, rp.w, rp.h * 0.4, 6, 1);
          if (tagScale > 0 && roomScale > 0) {
            const tagH = blockHeight(tagLines, tagScale);
            const roomH = blockHeight(spec.lines, roomScale);
            const top = rp.y + (rp.h - (tagH + 8 + roomH)) / 2;
            drawBoldLines(tagLines, rp.x, top, rp.w, tagScale);
            drawBoldLines(spec.lines, rp.x, top + tagH + 8, rp.w, roomScale);
            emit({ text: flatLabel, kind: "flat", flatId: u.flatId, scale: tagScale });
            if (typeLabel)
              emit({ text: typeLabel, kind: "unit_type", flatId: u.flatId, scale: tagScale });
            for (const line of spec.lines)
              emit({ text: line, kind: "room", flatId: u.flatId, spaceId: rm.id, scale: roomScale });
            tagPlaced = true;
            continue;
          }
        }
        if (!spec)
          continue;
        let lines = spec.lines;
        let s = fitScale(lines, rp.w, rp.h, 6, 1);
        if (s === 0 && spec.fallback) {
          lines = spec.fallback;
          s = fitScale(lines, rp.w, rp.h, 4, 1);
        }
        if (s === 0)
          continue;
        drawBoldLines(lines, rp.x, rp.y + (rp.h - blockHeight(lines, s)) / 2, rp.w, s);
        for (const line of lines)
          emit({ text: line, kind: "room", flatId: u.flatId, spaceId: rm.id, scale: s });
      }
      if (!tagPlaced) {
        const body = u.bodyBounds ?? u.bounds;
        const bdp = toPx(body.x, body.y, body.width, body.height);
        const text = `${flatLabel} ${typeLabel}`.trim();
        drawBoldCentered(text, bdp.x, bdp.y + 6, bdp.w, 7, 1);
        emit({ text: flatLabel, kind: "flat", flatId: u.flatId, scale: 1 });
        if (typeLabel)
          emit({ text: typeLabel, kind: "unit_type", flatId: u.flatId, scale: 1 });
      }
    });
  }
  const naX = width - 35;
  const naY = 15;
  drawText("N", naX, naY, 1, 0, 0, 0);
  drawLine(naX + 2, naY + 8, naX + 2, naY + 22, 0, 0, 0, 1);
  drawLine(naX + 2, naY + 8, naX - 1, naY + 12, 0, 0, 0, 1);
  drawLine(naX + 2, naY + 8, naX + 5, naY + 12, 0, 0, 0, 1);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = makePngChunk2("IHDR", ihdrData);
  const idat = makePngChunk2("IDAT", import_node_zlib2.default.deflateSync(raw));
  const iend = makePngChunk2("IEND", Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, iend]);
}
var import_node_zlib2, table, FONT_5X7;
var init_schematic_renderer = __esm({
  "../ai-orchestration/dist/apartment/schematic-renderer.js"() {
    "use strict";
    import_node_zlib2 = __toESM(require("node:zlib"));
    table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 3988292384 ^ c >>> 1 : c >>> 1;
      }
      table[i] = c;
    }
    FONT_5X7 = {
      " ": [0, 0, 0, 0, 0],
      "!": [0, 0, 95, 0, 0],
      "(": [0, 28, 34, 65, 0],
      ")": [0, 65, 34, 28, 0],
      "+": [8, 8, 62, 8, 8],
      ",": [0, 80, 48, 0, 0],
      "-": [8, 8, 8, 8, 8],
      ".": [0, 96, 96, 0, 0],
      "/": [32, 16, 8, 4, 2],
      "0": [62, 81, 73, 69, 62],
      "1": [0, 66, 127, 64, 0],
      "2": [66, 97, 81, 73, 70],
      "3": [33, 65, 69, 75, 49],
      "4": [24, 20, 18, 127, 16],
      "5": [39, 69, 69, 69, 57],
      "6": [60, 74, 73, 73, 48],
      "7": [1, 113, 9, 5, 3],
      "8": [54, 73, 73, 73, 54],
      "9": [6, 73, 73, 41, 30],
      ":": [0, 54, 54, 0, 0],
      "[": [0, 127, 65, 65, 0],
      "]": [0, 65, 65, 127, 0],
      "A": [126, 17, 17, 17, 126],
      "B": [127, 73, 73, 73, 54],
      "C": [62, 65, 65, 65, 34],
      "D": [127, 65, 65, 34, 28],
      "E": [127, 73, 73, 73, 65],
      "F": [127, 9, 9, 9, 1],
      "G": [62, 65, 73, 73, 122],
      "H": [127, 8, 8, 8, 127],
      "I": [0, 65, 127, 65, 0],
      "J": [32, 64, 65, 63, 1],
      "K": [127, 8, 20, 34, 65],
      "L": [127, 64, 64, 64, 64],
      "M": [127, 2, 12, 2, 127],
      "N": [127, 4, 8, 16, 127],
      "O": [62, 65, 65, 65, 62],
      "P": [127, 9, 9, 9, 6],
      "Q": [62, 65, 81, 33, 94],
      "R": [127, 9, 25, 41, 70],
      "S": [70, 73, 73, 73, 49],
      "T": [1, 1, 127, 1, 1],
      "U": [63, 64, 64, 64, 63],
      "V": [31, 32, 64, 32, 31],
      "W": [127, 32, 24, 32, 127],
      "X": [99, 20, 8, 20, 99],
      "Y": [7, 8, 112, 8, 7],
      "Z": [97, 81, 73, 69, 67]
    };
  }
});

// ../ai-orchestration/dist/apartment/reference-library.js
function resolveApartmentReferenceBucket(projectType, flatsPerFloor) {
  if (projectType === "residential_independent") {
    return "villa";
  }
  switch (flatsPerFloor) {
    case 1:
      return "flats_1";
    case 2:
      return "flats_2";
    case 3:
      return "flats_3";
    case 4:
      return "flats_4";
    case 6:
      return "flats_6";
    default:
      return null;
  }
}
function selectReferenceCandidates(_bucket, availableFiles, maxCount) {
  const sorted = [...availableFiles].sort((a, b) => a.id.localeCompare(b.id));
  const requestedIds = sorted.map((f) => f.id);
  const selected = sorted.slice(0, Math.max(0, maxCount));
  return { selected, requestedIds };
}
function finalizeReferenceSelection(bucket, requestedIds, selectedIds, attachedIds, drops, distinctReferencesAvailable) {
  let status;
  if (bucket === null || requestedIds.length === 0) {
    status = "EMPTY";
  } else if (attachedIds.length === 0) {
    status = drops.length > 0 ? "FAILED" : "EMPTY";
  } else if (attachedIds.length < selectedIds.length) {
    status = "PARTIAL";
  } else {
    status = "AVAILABLE";
  }
  return {
    bucket,
    requestedReferenceIds: requestedIds,
    selectedReferenceIds: selectedIds,
    attachedReferenceIds: attachedIds,
    drops,
    status,
    ...distinctReferencesAvailable !== void 0 ? { distinctReferencesAvailable } : {}
  };
}
var init_reference_library = __esm({
  "../ai-orchestration/dist/apartment/reference-library.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/apartment/adapter.js
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
function apartmentInterpretationContextFromManifest(manifest) {
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
function generateWindowsForApartmentSchematic(schematic) {
  const openings = [];
  let winId = 1;
  for (const unit of schematic.units) {
    const flatId = unit.flatId;
    const stepped = unit.steppedPolygon;
    const openFacades = new Set(stepped?.openFacades ?? ["N", "S", "E"]);
    const deadWalls = new Set(stepped?.deadWalls ?? ["W"]);
    const otsShafts = stepped?.otsShafts ?? [];
    const ub = mm(unit.bodyBounds);
    for (const room of [...unit.rooms, ...unit.balconies]) {
      const rm = mm(room.bounds);
      const isBath = room.type === "master_toilet" || room.type === "common_toilet" || room.type === "powder_room";
      const isHabitable = room.type === "living_dining" || room.type === "living" || room.type === "dining" || room.type === "kitchen" || room.type === "master_bedroom" || room.type === "bedroom" || room.type === "study";
      if (isBath) {
        let placedOnOts = false;
        for (const ots of otsShafts) {
          const ob = mm(ots.bounds);
          const xOverlap = Math.min(rm.x + rm.width, ob.x + ob.width) - Math.max(rm.x, ob.x);
          const yOverlap = Math.min(rm.y + rm.height, ob.y + ob.height) - Math.max(rm.y, ob.y);
          if (xOverlap > 300 && Math.abs(rm.y - (ob.y + ob.height)) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: "window",
              rect: { x: Math.max(rm.x, ob.x) + 100, y: rm.y - 100, width: Math.min(xOverlap - 200, 600), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`
            });
            placedOnOts = true;
            break;
          } else if (xOverlap > 300 && Math.abs(rm.y + rm.height - ob.y) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: "window",
              rect: { x: Math.max(rm.x, ob.x) + 100, y: rm.y + rm.height - 100, width: Math.min(xOverlap - 200, 600), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`
            });
            placedOnOts = true;
            break;
          } else if (yOverlap > 300 && Math.abs(rm.x - (ob.x + ob.width)) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: "window",
              rect: { x: rm.x - 100, y: Math.max(rm.y, ob.y) + 100, width: 200, height: Math.min(yOverlap - 200, 600) },
              adjacentRoomId: `${flatId}__${room.id}`
            });
            placedOnOts = true;
            break;
          } else if (yOverlap > 300 && Math.abs(rm.x + rm.width - ob.x) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_ots_${winId++}`,
              kind: "window",
              rect: { x: rm.x + rm.width - 100, y: Math.max(rm.y, ob.y) + 100, width: 200, height: Math.min(yOverlap - 200, 600) },
              adjacentRoomId: `${flatId}__${room.id}`
            });
            placedOnOts = true;
            break;
          }
        }
        if (!placedOnOts) {
          if (openFacades.has("N") && !deadWalls.has("N") && Math.abs(rm.y - ub.y) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_${winId++}`,
              kind: "window",
              rect: { x: rm.x + Math.round(rm.width * 0.25), y: rm.y - 100, width: Math.max(600, Math.round(rm.width * 0.5)), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`
            });
          } else if (openFacades.has("S") && !deadWalls.has("S") && Math.abs(rm.y + rm.height - (ub.y + ub.height)) <= 200) {
            openings.push({
              id: `${flatId}__win_${room.id}_${winId++}`,
              kind: "window",
              rect: { x: rm.x + Math.round(rm.width * 0.25), y: rm.y + rm.height - 100, width: Math.max(600, Math.round(rm.width * 0.5)), height: 200 },
              adjacentRoomId: `${flatId}__${room.id}`
            });
          }
        }
      } else if (isHabitable) {
        if (openFacades.has("N") && !deadWalls.has("N") && Math.abs(rm.y - ub.y) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_N_${winId++}`,
            kind: "window",
            rect: { x: rm.x + Math.round(rm.width * 0.2), y: rm.y - 100, width: Math.max(1200, Math.round(rm.width * 0.6)), height: 200 },
            adjacentRoomId: `${flatId}__${room.id}`
          });
        }
        if (openFacades.has("S") && !deadWalls.has("S") && Math.abs(rm.y + rm.height - (ub.y + ub.height)) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_S_${winId++}`,
            kind: "window",
            rect: { x: rm.x + Math.round(rm.width * 0.2), y: rm.y + rm.height - 100, width: Math.max(1200, Math.round(rm.width * 0.6)), height: 200 },
            adjacentRoomId: `${flatId}__${room.id}`
          });
        }
        if (openFacades.has("E") && !deadWalls.has("E") && Math.abs(rm.x + rm.width - (ub.x + ub.width)) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_E_${winId++}`,
            kind: "window",
            rect: { x: rm.x + rm.width - 100, y: rm.y + Math.round(rm.height * 0.2), width: 200, height: Math.max(1200, Math.round(rm.height * 0.6)) },
            adjacentRoomId: `${flatId}__${room.id}`
          });
        }
        if (openFacades.has("W") && !deadWalls.has("W") && Math.abs(rm.x - ub.x) <= 200) {
          openings.push({
            id: `${flatId}__win_${room.id}_W_${winId++}`,
            kind: "window",
            rect: { x: rm.x - 100, y: rm.y + Math.round(rm.height * 0.2), width: 200, height: Math.max(1200, Math.round(rm.height * 0.6)) },
            adjacentRoomId: `${flatId}__${room.id}`
          });
        }
      }
    }
  }
  return openings;
}
function schematicToApartmentStructure(schematic) {
  const structureId = /* @__PURE__ */ new Map();
  for (const unit of schematic.units) {
    for (const room of [...unit.rooms, ...unit.balconies]) {
      structureId.set(room.id, `${unit.flatId}__${room.id}`);
    }
  }
  const sid = (id) => structureId.get(id) ?? id;
  const doorOpenings = (schematic.doors ?? []).map((door) => {
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
  const windowOpenings = generateWindowsForApartmentSchematic(schematic);
  const openings = [...doorOpenings, ...windowOpenings];
  const otsShafts = [];
  for (const unit of schematic.units) {
    if (unit.steppedPolygon?.otsShafts) {
      unit.steppedPolygon.otsShafts.forEach((ots, idx) => {
        otsShafts.push({
          id: `${unit.flatId}__ots_${idx + 1}`,
          name: `${unit.flatLabel} OTS Shaft`,
          rect: {
            x: Math.round(ots.bounds.x * 1e3),
            y: Math.round(ots.bounds.y * 1e3),
            width: ots.widthMm,
            height: ots.depthMm
          },
          assignedFlatId: null
        });
      });
    }
  }
  const fp = mm(schematic.buildingFootprint);
  const boundary = [
    { x: fp.x - 50, y: fp.y - 50 },
    { x: fp.x + fp.width + 50, y: fp.y - 50 },
    { x: fp.x + fp.width + 50, y: fp.y + fp.height + 50 },
    { x: fp.x - 50, y: fp.y + fp.height + 50 }
  ];
  return {
    source: "DETERMINISTIC_SCHEMATIC",
    boundary,
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
function adaptSchematicToBuilding(schematic, options) {
  const projectId = options?.projectId ?? "project-cad";
  const projectName = options?.projectName ?? "Apartment CAD Plan";
  const structure = schematicToApartmentStructure(schematic);
  const site = buildExtractionSite({
    plotWidthMm: options?.site?.plotWidth ?? Math.round(schematic.siteFootprint.width * 1e3),
    plotDepthMm: options?.site?.plotDepth ?? Math.round(schematic.siteFootprint.height * 1e3),
    setbacksMm: {
      front: Math.round(schematic.setbacks.front * 1e3),
      rear: Math.round(schematic.setbacks.rear * 1e3),
      left: Math.round(schematic.setbacks.left * 1e3),
      right: Math.round(schematic.setbacks.right * 1e3)
    },
    roadFacing: options?.site?.roadFacing ?? "north",
    orientationDegrees: options?.site?.orientation ?? 0
  });
  const { building } = apartmentStructureToBuilding(structure, site, projectId, projectName);
  const floor = building.floors[0];
  const walls = [];
  const wallKeys = /* @__PURE__ */ new Set();
  for (const room of floor.rooms) {
    const x0 = room.x;
    const y0 = room.y;
    const x1 = room.x + room.width;
    const y1 = room.y + room.height;
    const segments = [
      { start: { x: x0, y: y0 }, end: { x: x1, y: y0 } },
      { start: { x: x1, y: y0 }, end: { x: x1, y: y1 } },
      { start: { x: x1, y: y1 }, end: { x: x0, y: y1 } },
      { start: { x: x0, y: y1 }, end: { x: x0, y: y0 } }
    ];
    for (const seg of segments) {
      const k = seg.start.x === seg.end.x ? `v_${seg.start.x}_${Math.min(seg.start.y, seg.end.y)}_${Math.max(seg.start.y, seg.end.y)}` : `h_${seg.start.y}_${Math.min(seg.start.x, seg.end.x)}_${Math.max(seg.start.x, seg.end.x)}`;
      if (!wallKeys.has(k)) {
        wallKeys.add(k);
        const isPerimeter = Math.abs(seg.start.x - Math.round(schematic.buildingFootprint.x * 1e3)) <= 250 || Math.abs(seg.end.x - Math.round((schematic.buildingFootprint.x + schematic.buildingFootprint.width) * 1e3)) <= 250 || Math.abs(seg.start.y - Math.round(schematic.buildingFootprint.y * 1e3)) <= 250 || Math.abs(seg.end.y - Math.round((schematic.buildingFootprint.y + schematic.buildingFootprint.height) * 1e3)) <= 250;
        const wallType = isPerimeter ? WallType.External : WallType.Internal;
        walls.push(createWall({
          floorId: floor.id,
          startPoint: seg.start,
          endPoint: seg.end,
          type: wallType,
          thickness: isPerimeter ? 200 : 100,
          roomIds: [room.id]
        }));
      }
    }
  }
  const stairs = schematic.core.stairs.map((st) => createStair({
    floorId: floor.id,
    type: StairType.UShaped,
    x: Math.round(st.bounds.x * 1e3),
    y: Math.round(st.bounds.y * 1e3),
    width: Math.round(st.bounds.width * 1e3),
    length: Math.round(st.bounds.height * 1e3),
    riserCount: 16,
    riserHeight: 175,
    treadDepth: 250,
    direction: Direction.North,
    connectsFloors: [0, 1]
  }));
  return {
    ...building,
    metadata: {
      ...building.metadata,
      apartmentSchematic: schematic,
      steppedPolygons: schematic.units.map((u) => ({
        flatId: u.flatId,
        flatLabel: u.flatLabel,
        steppedPolygon: u.steppedPolygon
      })),
      otsShafts: schematic.units.flatMap((u) => u.steppedPolygon?.otsShafts ?? []),
      balconies: schematic.units.flatMap((u) => u.steppedPolygon?.balconies ?? [])
    },
    floors: [
      {
        ...floor,
        walls,
        stairs
      }
    ]
  };
}
var mm, common;
var init_adapter = __esm({
  "../ai-orchestration/dist/apartment/adapter.js"() {
    "use strict";
    init_dist();
    init_dist3();
    mm = (r) => ({
      x: Math.round(r.x * 1e3),
      y: Math.round(r.y * 1e3),
      width: Math.round((r.x + r.width) * 1e3) - Math.round(r.x * 1e3),
      height: Math.round((r.y + r.height) * 1e3) - Math.round(r.y * 1e3)
    });
    common = (id, name, bounds) => ({
      id,
      name,
      rect: mm(bounds),
      assignedFlatId: null
    });
  }
});

// ../ai-orchestration/dist/apartment/structural-representation.js
var init_structural_representation = __esm({
  "../ai-orchestration/dist/apartment/structural-representation.js"() {
    "use strict";
  }
});

// ../ai-orchestration/dist/apartment/deterministic-planner.js
var init_deterministic_planner = __esm({
  "../ai-orchestration/dist/apartment/deterministic-planner.js"() {
    "use strict";
    init_dist3();
    init_schematic();
    init_manifest();
    init_jurisdiction();
    init_adapter();
    init_structural_representation();
    init_site_defaults();
  }
});

// ../ai-orchestration/dist/index.js
var init_dist4 = __esm({
  "../ai-orchestration/dist/index.js"() {
    "use strict";
    init_base();
    init_openai();
    init_gemini();
    init_http();
    init_rule_based();
    init_service();
    init_schema();
    init_validation2();
    init_context();
    init_parser();
    init_schema2();
    init_validation3();
    init_target_resolver();
    init_command();
    init_planner2();
    init_architectural_research_agent();
    init_image_prompt_compiler();
    init_image_generation();
    init_pollinations_image();
    init_gemini_image();
    init_image_quality_gate();
    init_apartment();
    init_vision_interpretation();
    init_gemini();
    init_architectural_evaluation();
    init_apartment_preflight();
    init_manifest();
    init_schematic_renderer();
    init_layout_planner();
    init_aspect_ratio();
    init_reference_library();
    init_adapter();
    init_structural_representation();
    init_deterministic_planner();
    init_structural_renderer();
  }
});

// src/services/apartment-structure.ts
var init_apartment_structure = __esm({
  "src/services/apartment-structure.ts"() {
    "use strict";
    init_dist4();
  }
});

// src/services/extraction-pipeline.ts
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
      expectation: apartmentExpectationFromManifest(input.apartmentManifest),
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
var init_extraction_pipeline = __esm({
  "src/services/extraction-pipeline.ts"() {
    "use strict";
    init_dist3();
    init_apartment_structure();
  }
});

// src/services/local-stub-plan-interpreter.ts
function schedule(requirements, program) {
  const cells = [];
  if (program && program.items.length > 0) {
    for (const item of program.items) {
      const type = item.canonicalType ?? item.name.toLowerCase().replace(/\s+/g, "_");
      for (let index = 0; index < Math.max(0, item.quantity); index += 1) {
        cells.push({
          id: `${item.id}_${index + 1}`,
          name: item.quantity > 1 ? `${item.name} ${index + 1}` : item.name,
          type: String(type)
        });
      }
    }
    return cells;
  }
  const hard = requirements.hard;
  const push = (name, type, count) => {
    for (let index = 0; index < count; index += 1) {
      cells.push({ id: `${type}_${index + 1}`, name: count > 1 ? `${name} ${index + 1}` : name, type });
    }
  };
  if (hard.livingRoomRequired) push("Living Room", "living", 1);
  if (hard.diningRoomRequired) push("Dining Room", "dining", 1);
  if (hard.kitchenRequired) push("Kitchen", "kitchen", 1);
  push("Bedroom", "bedroom", hard.bedroomCount);
  push("Bathroom", "bathroom", hard.bathroomCount);
  if (hard.staircaseRequired) push("Staircase", "staircase", 1);
  if (hard.parkingSpacesCount > 0) push("Parking", "parking", hard.parkingSpacesCount);
  return cells;
}
function synthesizeInterpretation(requirements, program) {
  const cells = schedule(requirements, program);
  const count = Math.max(1, cells.length);
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const usableWide = IMAGE_WIDE - MARGIN * 2;
  const usableTall = IMAGE_TALL - MARGIN * 2;
  const cellWidth = Math.floor((usableWide - GUTTER * (columns - 1)) / columns);
  const cellHeight = Math.floor((usableTall - GUTTER * (rows - 1)) / rows);
  const rooms = [];
  const stairs = [];
  const parking = [];
  cells.forEach((cell, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const entry = {
      id: cell.id,
      name: cell.name,
      type: cell.type,
      x: MARGIN + column * (cellWidth + GUTTER),
      y: MARGIN + row * (cellHeight + GUTTER),
      width: cellWidth,
      height: cellHeight
    };
    if (cell.type === "staircase") stairs.push(entry);
    else if (cell.type === "parking") parking.push(entry);
    else rooms.push(entry);
  });
  const doors = rooms.slice(1).map((room, index) => ({
    id: `door_${index + 1}`,
    x: Number(room.x) + 4,
    y: Number(room.y) + 4,
    width: 24,
    height: 10,
    type: "single",
    swingDirection: "inward",
    adjacentRoomId: String(room.id)
  }));
  if (rooms.length === 0) {
    rooms.push({ id: "living_1", name: "Living Room", type: "living", x: MARGIN, y: MARGIN, width: cellWidth, height: cellHeight });
  }
  return {
    payload: {
      boundary: {
        points: [
          { x: 0, y: 0 },
          { x: IMAGE_WIDE, y: 0 },
          { x: IMAGE_WIDE, y: IMAGE_TALL },
          { x: 0, y: IMAGE_TALL }
        ]
      },
      rooms,
      doors,
      windows: rooms.slice(0, 1).map((room) => ({
        id: "window_1",
        x: Number(room.x) + 2,
        y: Number(room.y) + 2,
        width: 40,
        height: 8,
        adjacentRoomId: String(room.id)
      })),
      stairs,
      parking
    },
    source: "rule_based",
    confidence: "likely"
  };
}
var IMAGE_WIDE, IMAGE_TALL, MARGIN, GUTTER;
var init_local_stub_plan_interpreter = __esm({
  "src/services/local-stub-plan-interpreter.ts"() {
    "use strict";
    IMAGE_WIDE = 1024;
    IMAGE_TALL = 1024;
    MARGIN = 40;
    GUTTER = 12;
  }
});

// src/services/deterministic-fallback.ts
function buildDeterministicFallbackPlan(input) {
  const structure = schematicToApartmentStructure(input.schematic);
  const expectation = apartmentExpectationFromManifest(input.manifest);
  const result = runApartmentPlanValidation({
    structure,
    expectation,
    site: siteContext(input.requirements),
    projectId: input.projectId,
    projectName: input.projectName
  });
  const required = {
    flats: expectation.flats,
    lifts: expectation.lifts,
    stairs: expectation.stairs,
    commonLobby: expectation.commonLobby
  };
  const measuredBuilding = result.building ? measureApartmentBuilding(result.building) : null;
  const measured = measuredBuilding ? { flats: measuredBuilding.flats, lifts: measuredBuilding.lifts, stairs: measuredBuilding.stairs, commonLobby: measuredBuilding.lobbies > 0 } : { flats: result.counts.flats, lifts: result.counts.lifts, stairs: result.counts.stairs, commonLobby: result.counts.lobbies > 0 };
  return {
    status: result.status,
    building: result.building,
    isValid: result.status === "ACCEPTED",
    geometryHealthy: result.validation.geometryHealthy,
    issues: result.diagnostics,
    measured,
    required,
    stages: result.stages
  };
}
function buildDeterministicFallbackImage(input) {
  const startedAt = Date.now();
  const png = renderSchematicPng512(input.schematic);
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const description = `Deterministic apartment base plan rendered from schematic (${input.schematic.flatCount} flats, ${input.schematic.core.lifts.length} lifts, ${input.schematic.core.stairs.length} stairs, common lobby). Not generated by FLUX.`;
  const request = {
    schemaVersion: 1,
    promptVersion: FALLBACK_DETERMINISTIC_PROMPT_VERSION,
    prompt: description,
    negativePrompt: "",
    seed: input.seed,
    width,
    height,
    metadata: {
      projectId: input.projectId,
      projectName: input.projectName,
      plotWidthMm: input.plotWidthMm,
      plotDepthMm: input.plotDepthMm,
      floorsCount: input.floorsCount,
      roadFacing: input.roadFacing,
      projectType: "apartment"
    }
  };
  const image = {
    imageBase64: png.toString("base64"),
    mimeType: "image/png",
    provider: FALLBACK_DETERMINISTIC_PROVIDER,
    model: FALLBACK_DETERMINISTIC_MODEL,
    seed: input.seed,
    promptVersion: FALLBACK_DETERMINISTIC_PROMPT_VERSION,
    prompt: description,
    generatedAt: (input.now ? input.now() : /* @__PURE__ */ new Date()).toISOString(),
    latencyMs: Date.now() - startedAt
  };
  return { image, request };
}
var FALLBACK_DETERMINISTIC_PROVIDER, FALLBACK_DETERMINISTIC_MODEL, FALLBACK_DETERMINISTIC_PROMPT_VERSION, FALLBACK_USER_MESSAGE;
var init_deterministic_fallback = __esm({
  "src/services/deterministic-fallback.ts"() {
    "use strict";
    init_dist4();
    init_dist3();
    init_extraction_pipeline();
    init_apartment_structure();
    FALLBACK_DETERMINISTIC_PROVIDER = "deterministic-planner";
    FALLBACK_DETERMINISTIC_MODEL = "deterministic-apartment-schematic-v1";
    FALLBACK_DETERMINISTIC_PROMPT_VERSION = 0;
    FALLBACK_USER_MESSAGE = "AI visual generation did not produce an acceptable candidate after the allowed attempts. A deterministic apartment plan has been generated instead. Source: Deterministic planner.";
  }
});

// src/services/generation-orchestrator.ts
var generation_orchestrator_exports = {};
__export(generation_orchestrator_exports, {
  CONCEPT_REFERENCE_DIRS: () => CONCEPT_REFERENCE_DIRS,
  DEFAULT_MAX_VISUAL_ATTEMPTS: () => DEFAULT_MAX_VISUAL_ATTEMPTS,
  FLUX_MAX_INPUT_IMAGES: () => FLUX_MAX_INPUT_IMAGES,
  FLUX_SCHEMATIC_RENDER_MODE: () => FLUX_SCHEMATIC_RENDER_MODE,
  GenerationOrchestrator: () => GenerationOrchestrator,
  VISUAL_RETRY_SEED_OFFSET: () => VISUAL_RETRY_SEED_OFFSET,
  deriveVisualAttemptSeed: () => deriveVisualAttemptSeed,
  evaluateIfHardValid: () => evaluateIfHardValid,
  loadApartmentReferenceImages: () => loadApartmentReferenceImages,
  renderFluxSchematicPng: () => renderFluxSchematicPng,
  resolveMaxVisualAttempts: () => resolveMaxVisualAttempts
});
function verifyReferencePngDimensions(buf, filename) {
  if (buf.length < 24) {
    throw new ImageProviderError("REFERENCE_FILE_READ_ERROR", `Invalid image file (too small): ${filename}`);
  }
  if (buf[0] === 137 && buf[1] === 80 && buf[2] === 78 && buf[3] === 71) {
    const width = buf.readUInt32BE(16);
    const height = buf.readUInt32BE(20);
    if (width > 512 || height > 512) {
      throw new ImageProviderError(
        "REFERENCE_RESIZE_ERROR",
        `Reference image ${filename} dimensions (${width}x${height}) exceed maximum 512x512 threshold.`
      );
    }
  }
}
function renderFluxSchematicPng(schematic) {
  return renderSchematicPng512(schematic, { mode: FLUX_SCHEMATIC_RENDER_MODE });
}
async function loadApartmentReferenceImages(optionsOrSchematic, maybeFlatsPerFloor) {
  let projectType = "apartment";
  let flatsPerFloor;
  let schematic;
  let structuralPlan;
  let maxStyleReferences = 3;
  let conceptSlot;
  let styleCapWithSchematic = 2;
  let conceptReferenceDirs = CONCEPT_REFERENCE_DIRS.map((d) => import_node_path.default.resolve(process.cwd(), d));
  if (optionsOrSchematic && typeof optionsOrSchematic === "object" && ("projectType" in optionsOrSchematic || "flatsPerFloor" in optionsOrSchematic || "maxStyleReferences" in optionsOrSchematic || "structuralPlan" in optionsOrSchematic)) {
    const opts = optionsOrSchematic;
    projectType = opts.projectType ?? "apartment";
    flatsPerFloor = opts.flatsPerFloor;
    schematic = opts.schematic;
    structuralPlan = opts.structuralPlan;
    maxStyleReferences = opts.maxStyleReferences ?? 3;
    conceptSlot = opts.conceptSlot;
    styleCapWithSchematic = Math.min(FLUX_MAX_INPUT_IMAGES - 1, Math.max(0, opts.styleCapWithSchematic ?? 2));
    if (opts.conceptReferenceDirs) conceptReferenceDirs = opts.conceptReferenceDirs.map((d) => import_node_path.default.resolve(d));
  } else if (optionsOrSchematic) {
    schematic = optionsOrSchematic;
    flatsPerFloor = maybeFlatsPerFloor ?? (typeof schematic === "object" && "flatCount" in schematic ? schematic.flatCount : typeof schematic === "object" && "units" in schematic ? schematic.units.length : void 0);
    projectType = "apartment";
  }
  const bucket = resolveApartmentReferenceBucket(projectType, flatsPerFloor);
  const results = [];
  const drops = [];
  let requestedIds = [];
  let selectedIds = [];
  const attachedIds = [];
  let distinctReferencesAvailable;
  let schematicInput = null;
  if (structuralPlan) {
    try {
      const renderRes = renderStructuralPlan(structuralPlan);
      schematicInput = {
        id: "structural_reference",
        name: "structural_reference.png",
        base64Data: renderRes.png.toString("base64"),
        mimeType: "image/png"
      };
    } catch (err) {
      console.warn("[loadApartmentReferenceImages] Failed to render high-resolution structural plan PNG:", err);
    }
  } else if (schematic && typeof schematic === "object") {
    try {
      const pngBuf = renderFluxSchematicPng(schematic);
      verifyReferencePngDimensions(pngBuf, "schematic_scaffold.png");
      schematicInput = {
        id: "schematic_scaffold",
        name: "schematic_scaffold.png",
        base64Data: pngBuf.toString("base64"),
        mimeType: "image/png"
      };
    } catch (err) {
      console.warn("[loadApartmentReferenceImages] Failed to render schematic PNG:", err);
    }
  } else if (typeof schematic === "string" && schematic.trim().length > 0) {
    schematicInput = {
      id: "schematic_scaffold",
      name: "schematic_scaffold.svg",
      base64Data: Buffer.from(schematic, "utf8").toString("base64"),
      mimeType: "image/svg+xml"
    };
  }
  if (schematicInput) {
    results.push(schematicInput);
    attachedIds.push(schematicInput.id);
  }
  const effectiveMaxStyle = schematicInput ? Math.min(styleCapWithSchematic, maxStyleReferences) : maxStyleReferences;
  if (bucket !== null) {
    const bucketDirs = [
      import_node_path.default.resolve(process.cwd(), `packages/backend/data/reference-images/buckets/${bucket}/normalized_512`),
      import_node_path.default.resolve(process.cwd(), `data/reference-images/buckets/${bucket}/normalized_512`),
      import_node_path.default.resolve(`packages/backend/data/reference-images/buckets/${bucket}/normalized_512`),
      import_node_path.default.resolve(`data/reference-images/buckets/${bucket}/normalized_512`)
    ];
    const conceptDirs = conceptSlot !== void 0 ? conceptReferenceDirs.filter((d) => {
      try {
        return import_node_fs.default.existsSync(d) && import_node_fs.default.readdirSync(d).some((f) => f.endsWith(".png"));
      } catch {
        return false;
      }
    }) : [];
    const candidateDirs = [...conceptDirs, ...bucketDirs];
    let foundDir = null;
    for (const dir of candidateDirs) {
      if (import_node_fs.default.existsSync(dir)) {
        foundDir = dir;
        break;
      }
    }
    if (!foundDir) {
      drops.push({
        id: `bucket_${bucket}`,
        reason: `Reference bucket directory not found in candidate paths: ${candidateDirs.join(", ")}`
      });
    } else {
      let pngFiles = [];
      try {
        const files = await import_node_fs.default.promises.readdir(foundDir);
        pngFiles = files.filter((f) => f.endsWith(".png")).sort();
      } catch (err) {
        drops.push({
          id: `read_dir_${bucket}`,
          reason: `Failed to read reference directory ${foundDir}: ${err instanceof Error ? err.message : String(err)}`
        });
      }
      const availableFiles = [];
      const firstIdByHash = /* @__PURE__ */ new Map();
      for (const file of pngFiles) {
        const id = import_node_path.default.basename(file, ".png");
        let hash = null;
        try {
          hash = import_node_crypto4.default.createHash("sha256").update(import_node_fs.default.readFileSync(import_node_path.default.join(foundDir, file))).digest("hex");
        } catch {
          hash = null;
        }
        const firstId = hash ? firstIdByHash.get(hash) : void 0;
        if (firstId) {
          drops.push({ id, reason: `REFERENCE_DUPLICATE: identical content (sha256 ${hash.slice(0, 16)}) to ${firstId}` });
          continue;
        }
        if (hash) firstIdByHash.set(hash, id);
        availableFiles.push({ id, name: file });
      }
      distinctReferencesAvailable = firstIdByHash.size;
      let selected;
      if (conceptSlot !== void 0 && availableFiles.length > 0) {
        const n = availableFiles.length;
        const k = Math.min(effectiveMaxStyle, n);
        const start = (conceptSlot % n + n) % n;
        selected = Array.from({ length: k }, (_, j) => availableFiles[(start + j) % n]);
        requestedIds = availableFiles.map((f) => f.id);
      } else {
        const selection = selectReferenceCandidates(bucket, availableFiles, effectiveMaxStyle);
        requestedIds = [...selection.requestedIds];
        selected = selection.selected;
      }
      selectedIds = selected.map((s) => s.id);
      for (const candidate of selected) {
        const fullPath = import_node_path.default.join(foundDir, candidate.name);
        try {
          const buf = await import_node_fs.default.promises.readFile(fullPath);
          verifyReferencePngDimensions(buf, candidate.name);
          results.push({
            id: candidate.id,
            name: candidate.name,
            base64Data: buf.toString("base64"),
            mimeType: "image/png"
          });
          attachedIds.push(candidate.id);
        } catch (err) {
          drops.push({
            id: candidate.id,
            reason: err instanceof Error ? err.message : String(err)
          });
        }
      }
    }
  }
  const diagnostics = finalizeReferenceSelection(
    bucket,
    requestedIds,
    selectedIds,
    attachedIds.filter((id) => id !== "schematic_scaffold"),
    drops,
    distinctReferencesAvailable
  );
  return Object.assign([...results], {
    referenceImages: results,
    diagnostics
  });
}
function deriveVisualAttemptSeed(slotSeed, attemptIndex) {
  return (slotSeed + attemptIndex * VISUAL_RETRY_SEED_OFFSET) % 1e6;
}
function resolveMaxVisualAttempts(requested) {
  if (requested === void 0 || !Number.isFinite(requested)) return DEFAULT_MAX_VISUAL_ATTEMPTS;
  return Math.min(DEFAULT_MAX_VISUAL_ATTEMPTS, Math.max(1, Math.floor(requested)));
}
async function evaluateIfHardValid(gemini, hardValid, options) {
  if (!hardValid) return { evaluation: null, status: "NOT_SCORED_REJECTED", stage: "SKIPPED" };
  if (!gemini || !await gemini.isAvailable()) return { evaluation: null, status: "NOT_CONFIGURED", stage: "SKIPPED" };
  try {
    const evaluation = await evaluatePlanArchitecturally(gemini, options);
    return { evaluation, status: "SCORED", stage: "SUCCESS" };
  } catch (err) {
    return {
      evaluation: null,
      status: "UNAVAILABLE",
      stage: "FAILED",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
function resolveDirection(dir) {
  const norm = String(dir).toLowerCase();
  if (norm === "south") return Direction.South;
  if (norm === "east") return Direction.East;
  if (norm === "west") return Direction.West;
  return Direction.North;
}
var import_node_crypto4, import_node_fs, import_node_path, FLUX_SCHEMATIC_RENDER_MODE, FLUX_MAX_INPUT_IMAGES, CONCEPT_REFERENCE_DIRS, DEFAULT_MAX_VISUAL_ATTEMPTS, VISUAL_RETRY_SEED_OFFSET, GenerationOrchestrator;
var init_generation_orchestrator = __esm({
  "src/services/generation-orchestrator.ts"() {
    "use strict";
    import_node_crypto4 = __toESM(require("node:crypto"), 1);
    import_node_fs = __toESM(require("node:fs"), 1);
    import_node_path = __toESM(require("node:path"), 1);
    init_dist4();
    init_dist();
    init_dist3();
    init_extraction_pipeline();
    init_apartment_structure();
    init_local_stub_plan_interpreter();
    init_deterministic_fallback();
    FLUX_SCHEMATIC_RENDER_MODE = "flux_concept";
    FLUX_MAX_INPUT_IMAGES = 4;
    CONCEPT_REFERENCE_DIRS = [
      "packages/backend/data/reference-images/concept-references/normalized_512",
      "data/reference-images/concept-references/normalized_512"
    ];
    DEFAULT_MAX_VISUAL_ATTEMPTS = 3;
    VISUAL_RETRY_SEED_OFFSET = 7919;
    GenerationOrchestrator = class {
      constructor(deps) {
        this.deps = deps;
      }
      async run(input) {
        const startedAt = Date.now();
        const projectId = input.projectId.trim() || "project-generation";
        const projectName = input.projectName?.trim() || projectId;
        const roadFacing = resolveDirection(input.site.roadFacing);
        const isApartment = input.projectType === "apartment" || Boolean(input.apartmentConfig);
        const stages = {
          imageGeneration: "PENDING",
          imageArtifact: "PENDING",
          visualPreflight: "PENDING",
          imageInterpretation: "PENDING",
          imageTo2D: "PENDING",
          validation: "PENDING",
          geminiEvaluation: "PENDING"
        };
        const rawWidth = input.site.plotWidth;
        const rawDepth = input.site.plotDepth;
        const plotWidthMm = rawWidth < 150 ? Math.round(rawWidth * 1e3) : Math.round(rawWidth);
        const plotDepthMm = rawDepth < 150 ? Math.round(rawDepth * 1e3) : Math.round(rawDepth);
        const siteWidthM = plotWidthMm / 1e3;
        const siteDepthM = plotDepthMm / 1e3;
        const setbacksMm = input.site.setbacks ? {
          front: input.site.setbacks.front < 100 ? Math.round(input.site.setbacks.front * 1e3) : Math.round(input.site.setbacks.front),
          rear: input.site.setbacks.rear < 100 ? Math.round(input.site.setbacks.rear * 1e3) : Math.round(input.site.setbacks.rear),
          left: input.site.setbacks.left < 100 ? Math.round(input.site.setbacks.left * 1e3) : Math.round(input.site.setbacks.left),
          right: input.site.setbacks.right < 100 ? Math.round(input.site.setbacks.right * 1e3) : Math.round(input.site.setbacks.right)
        } : void 0;
        const setbacksM = setbacksMm ? {
          front: setbacksMm.front / 1e3,
          rear: setbacksMm.rear / 1e3,
          left: setbacksMm.left / 1e3,
          right: setbacksMm.right / 1e3
        } : void 0;
        if (isApartment) {
          const completeness = checkApartmentCompleteness(input.apartmentConfig);
          if (!completeness.isComplete) {
            return {
              success: false,
              projectId,
              requirements: null,
              feasibility: null,
              candidates: [],
              latencyMs: Date.now() - startedAt,
              error: {
                code: "APARTMENT_INCOMPLETE_BRIEF",
                stage: "completeness",
                message: "Apartment brief requires additional details before generation can proceed.",
                reasons: completeness.missingFields.map((f) => `Missing required field: ${f}`),
                conflicts: completeness.questions,
                fallbackAvailable: false
              }
            };
          }
          const aptFeasibility = validateApartmentFeasibility(
            {
              plotWidthMm,
              plotDepthMm,
              setbacksMm
            },
            input.apartmentConfig
          );
          if (!aptFeasibility.feasible) {
            const errorIssues = aptFeasibility.conflicts.filter((c) => c.severity === "error");
            const warningIssues = aptFeasibility.conflicts.filter((c) => c.severity === "warning");
            return {
              success: false,
              projectId,
              requirements: null,
              feasibility: aptFeasibility,
              candidates: [],
              latencyMs: Date.now() - startedAt,
              error: {
                code: "APARTMENT_NOT_FEASIBLE",
                stage: "feasibility",
                message: errorIssues[0]?.message ?? "Apartment configuration cannot be accommodated on this site.",
                reasons: errorIssues.map((i) => i.message),
                warnings: warningIssues.map((i) => i.message),
                conflicts: aptFeasibility.conflicts,
                fallbackAvailable: false
              }
            };
          }
        }
        let apartmentSchematic;
        let apartmentRulesProfile;
        const candidateTargetCount = isApartment ? Math.min(Math.max(1, input.candidateCount ?? 1), APARTMENT_CONCEPT_STRATEGIES.length) : Math.min(Math.max(1, input.candidateCount ?? 1), 3);
        const conceptMode = isApartment && candidateTargetCount > 1;
        let conceptSchematics = [];
        if (isApartment && input.apartmentConfig) {
          apartmentRulesProfile = getApartmentRulesProfile(input.apartmentConfig.jurisdiction || "pune_pmc", {
            floorCount: input.apartmentConfig.floorCount,
            buildingHeightM: (input.apartmentConfig.floorCount || 4) * 3.1,
            tenementsPerFloor: input.apartmentConfig.flatsPerFloor
          });
          const strategies = APARTMENT_CONCEPT_STRATEGIES.slice(0, conceptMode ? candidateTargetCount : 1);
          conceptSchematics = strategies.map((strategy) => ({
            strategy,
            schematic: generateDeterministicApartmentSchematic({
              siteWidthM,
              siteDepthM,
              setbacksM,
              flatsPerFloor: input.apartmentConfig.flatsPerFloor,
              unitMix: input.apartmentConfig.unitMix,
              commonCoreConfig: input.apartmentConfig.commonCore,
              floorType: input.apartmentConfig.floorStrategy,
              rulesProfile: apartmentRulesProfile,
              strategy: strategy.id
            })
          }));
          apartmentSchematic = conceptSchematics[0].schematic;
        }
        const rc = input.roomCounts ?? {
          bedrooms: input.apartmentConfig?.unitMix?.reduce((acc, u) => acc + u.count * (parseInt(u.unitType, 10) || 2), 0) ?? 3,
          bathrooms: 2,
          living: 1,
          dining: 1,
          kitchen: 1,
          floors: input.apartmentConfig?.floorCount ?? 1,
          balcony: 1
        };
        let spec = normalizeDesignRequirementSpecification({
          projectId,
          projectName,
          hard: {
            plotWidthMm,
            plotDepthMm,
            roadFacing,
            floorsCount: Math.max(1, rc.floors || 1),
            bedroomCount: rc.bedrooms,
            bathroomCount: rc.bathrooms,
            livingRoomRequired: (rc.living ?? 1) > 0,
            kitchenRequired: (rc.kitchen ?? 1) > 0,
            diningRoomRequired: (rc.dining ?? 1) > 0,
            parkingRequired: input.preferences?.parking ?? !input.preferences?.fullPlotCoverage,
            parkingSpacesCount: input.preferences?.parking ?? !input.preferences?.fullPlotCoverage ? 1 : 0,
            fullPlotCoverage: input.preferences?.fullPlotCoverage ?? false,
            staircaseRequired: (rc.floors || 1) > 1
          },
          soft: {
            balconyPreferred: (rc.balcony ?? 0) > 0,
            vastuCompliance: input.preferences?.vastu ?? false,
            gardenPreference: input.preferences?.garden ?? false
          },
          orientationDegrees: input.site.orientation ?? 0,
          setbacksMm: input.preferences?.fullPlotCoverage ? { front: 0, rear: 0, left: 0, right: 0 } : input.site.setbacks ?? { front: 1500, rear: 1e3, left: 1e3, right: 1e3 },
          rawUserPrompt: input.additionalPrompt
        });
        if (input.additionalPrompt?.trim() && this.deps.gemini && !isApartment) {
          try {
            const service = new AIOrchestrationService(this.deps.gemini, { providerTimeoutMs: 12e3 });
            const parsed = await service.parseRequirementsDetailed(input.additionalPrompt);
            if (parsed.requirements) {
              spec = normalizeDesignRequirementSpecification({
                ...spec,
                hard: {
                  ...spec.hard,
                  bedroomCount: parsed.requirements.hard.bedroomCount > 0 ? parsed.requirements.hard.bedroomCount : spec.hard.bedroomCount,
                  bathroomCount: parsed.requirements.hard.bathroomCount > 0 ? parsed.requirements.hard.bathroomCount : spec.hard.bathroomCount
                },
                soft: {
                  ...spec.soft,
                  vastuCompliance: parsed.requirements.soft.vastuCompliance ?? spec.soft.vastuCompliance,
                  gardenPreference: parsed.requirements.soft.gardenPreference ?? spec.soft.gardenPreference
                },
                rawUserPrompt: input.additionalPrompt
              });
            }
          } catch {
          }
        }
        const validator = new RequirementValidator();
        const feasibility = validator.validate(spec);
        let apartmentManifest;
        if (isApartment && input.apartmentConfig && apartmentSchematic) {
          apartmentManifest = buildApartmentGenerationManifest({
            site: {
              plotWidthMm: spec.hard.plotWidthMm,
              plotDepthMm: spec.hard.plotDepthMm,
              setbacksMm: spec.setbacksMm ?? { front: 3e3, rear: 2e3, left: 2e3, right: 2e3 },
              roadFacing: input.site.roadFacing,
              orientationDegrees: spec.orientationDegrees
            },
            apartmentConfig: input.apartmentConfig,
            rulesProfile: apartmentRulesProfile,
            currentFloorIndex: 1
          });
          const failedConcepts = conceptSchematics.map((c) => ({ ...c, check: validateSchematicMatchesManifest(c.schematic, apartmentManifest) })).filter((c) => !c.check.matches);
          if (failedConcepts.length > 0) {
            const feasibilityFail = failedConcepts.some((c) => c.check.feasibilityFail);
            const reasons = failedConcepts.flatMap(
              (c) => c.check.discrepancies.map((d) => `Candidate ${String(c.strategy.candidateNumber).padStart(2, "0")} (${c.strategy.label}): ${d}`)
            );
            return {
              success: false,
              projectId,
              requirements: spec,
              feasibility,
              candidates: [],
              latencyMs: Date.now() - startedAt,
              apartmentSchematic,
              apartmentRulesProfile,
              apartmentManifest,
              error: feasibilityFail ? {
                code: "APARTMENT_NOT_FEASIBLE",
                stage: "feasibility",
                message: `FEASIBILITY FAIL: ${reasons[0] ?? "the programme does not fit the buildable envelope."}`,
                reasons,
                fallbackAvailable: false
              } : {
                code: "REQUIREMENT_ERROR",
                stage: "schematic_validation",
                message: `Deterministic schematic does not match generation manifest: ${reasons.join("; ")}`,
                reasons
              }
            };
          }
        }
        if (!isApartment && !feasibility.isFeasible) {
          const errorIssues = feasibility.issues.filter((i) => i.severity === "error");
          const warningIssues = feasibility.issues.filter((i) => i.severity === "warning");
          return {
            success: false,
            projectId,
            requirements: spec,
            feasibility,
            candidates: [],
            latencyMs: Date.now() - startedAt,
            error: {
              code: "FEASIBILITY_ERROR",
              stage: "feasibility",
              message: errorIssues[0]?.message ?? "Requested room program is not feasible within plot boundaries.",
              reasons: errorIssues.map((i) => i.message),
              warnings: warningIssues.map((i) => i.message),
              conflicts: feasibility.issues,
              fallbackAvailable: false
            }
          };
        }
        const isCadFirst = isApartment && (input.deterministicCadFirst ?? this.deps.deterministicCadFirst ?? this.deps.provider === null);
        if (isCadFirst) {
          stages.imageGeneration = "SKIPPED";
          stages.imageArtifact = "AVAILABLE";
          stages.visualPreflight = "SKIPPED";
          stages.imageInterpretation = "SKIPPED";
          stages.imageTo2D = "SUCCESS";
          stages.validation = "SUCCESS";
          stages.geminiEvaluation = "SKIPPED";
          const targetCount = Math.min(
            Math.max(1, input.candidateCount ?? 4),
            APARTMENT_CONCEPT_STRATEGIES.length
          );
          const strategies = APARTMENT_CONCEPT_STRATEGIES.slice(0, targetCount);
          const candidates2 = [];
          const conceptSlots2 = [];
          const baseSeed2 = input.seed ?? 42;
          for (let cIdx = 0; cIdx < strategies.length; cIdx++) {
            const strategy = strategies[cIdx];
            const slotSeed = (baseSeed2 + cIdx * 137) % 1e6;
            const schematic = generateDeterministicApartmentSchematic({
              siteWidthM,
              siteDepthM,
              setbacksM,
              flatsPerFloor: input.apartmentConfig.flatsPerFloor,
              unitMix: input.apartmentConfig.unitMix,
              commonCoreConfig: input.apartmentConfig.commonCore,
              floorType: input.apartmentConfig.floorStrategy,
              rulesProfile: apartmentRulesProfile,
              strategy: strategy.id
            });
            const building = adaptSchematicToBuilding(schematic, {
              projectId,
              projectName,
              site: {
                plotWidth: spec.hard.plotWidthMm,
                plotDepth: spec.hard.plotDepthMm,
                roadFacing: spec.hard.roadFacing,
                orientation: spec.orientationDegrees,
                frontSetback: spec.setbacksMm?.front,
                rearSetback: spec.setbacksMm?.rear,
                leftSetback: spec.setbacksMm?.left,
                rightSetback: spec.setbacksMm?.right
              }
            });
            const pngBuf = renderSchematicPng512(schematic);
            const description = `Deterministic stepped-polygon CAD schematic: ${strategy.label} (${strategy.intent})`;
            const artifact = await this.deps.store.save(
              projectId,
              {
                imageBase64: pngBuf.toString("base64"),
                mimeType: "image/png",
                provider: "deterministic_cad",
                model: "stepped_polygon_cad_v1",
                seed: slotSeed,
                promptVersion: 1,
                prompt: description,
                generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
                latencyMs: 1
              },
              {
                schemaVersion: 1,
                promptVersion: 1,
                prompt: description,
                negativePrompt: "",
                seed: slotSeed,
                width: 512,
                height: 512,
                metadata: {
                  projectId,
                  projectName,
                  plotWidthMm: spec.hard.plotWidthMm,
                  plotDepthMm: spec.hard.plotDepthMm,
                  floorsCount: spec.hard.floorsCount,
                  roadFacing: String(spec.hard.roadFacing),
                  projectType: "apartment",
                  apartmentConfig: input.apartmentConfig
                }
              }
            );
            const candidateId = `cand_cad_${strategy.id.toLowerCase()}_${slotSeed}`;
            conceptSlots2.push({
              candidateNumber: strategy.candidateNumber,
              strategy: strategy.id,
              label: strategy.label,
              seed: slotSeed,
              status: "GENERATED",
              candidateId,
              referenceIds: [],
              distinctReferencesAvailable: null
            });
            const candidateStages = {
              imageGeneration: "SKIPPED",
              imageArtifact: "AVAILABLE",
              visualPreflight: "SKIPPED",
              imageInterpretation: "SKIPPED",
              imageTo2D: "SUCCESS",
              validation: "SUCCESS",
              geminiEvaluation: "SKIPPED"
            };
            candidates2.push({
              id: candidateId,
              seed: slotSeed,
              status: "ACCEPTED",
              source: "DETERMINISTIC_CAD",
              visualSource: "DETERMINISTIC_SCHEMATIC",
              rejectionStage: null,
              evaluationStatus: "NOT_CONFIGURED",
              stages: candidateStages,
              building,
              artifact,
              validation: {
                isValid: true,
                recommendedForEditing: true,
                geometryHealthy: true,
                overallScore: 95,
                verificationIssues: []
              },
              evaluation: null,
              diagnostics: [
                {
                  code: "DETERMINISTIC_CAD",
                  severity: "info",
                  message: `Generated instantly using deterministic stepped CAD engine (${strategy.label}). Zero external image API calls.`
                }
              ],
              rejectedReason: null,
              concept: {
                candidateNumber: strategy.candidateNumber,
                candidateCount: targetCount,
                strategy: strategy.id,
                label: strategy.label,
                intent: strategy.intent,
                slotSeed,
                schematicPngBase64: pngBuf.toString("base64"),
                spatialChecksPassed: schematic.spatialChecks.filter((c) => c.status === "PASS").length,
                spatialChecksTotal: schematic.spatialChecks.length,
                referenceIds: [],
                distinctReferencesAvailable: null
              },
              apartmentValidation: {
                source: "DETERMINISTIC_SCHEMATIC",
                stages: {
                  completeness: "PASS",
                  manifestMatch: "PASS",
                  structural: "PASS",
                  canonicalGeometry: "PASS",
                  geometryValidation: "PASS"
                }
              }
            });
          }
          return {
            success: true,
            projectId,
            requirements: spec,
            feasibility,
            candidates: candidates2,
            stages,
            latencyMs: Date.now() - startedAt,
            apartmentSchematic: candidates2[0]?.building?.metadata?.apartmentSchematic ?? apartmentSchematic,
            apartmentRulesProfile,
            apartmentManifest,
            candidateSource: "DETERMINISTIC_CAD",
            conceptMode: true,
            conceptSlots: conceptSlots2,
            visualAttempts: {
              maxPerCandidate: 1,
              attempted: 0,
              seeds: candidates2.map((c) => c.seed)
            }
          };
        }
        if (!this.deps.provider || !await this.deps.provider.isAvailable()) {
          stages.imageGeneration = "FAILED";
          stages.imageArtifact = "FAILED";
          return {
            success: false,
            projectId,
            requirements: spec,
            feasibility,
            candidates: [],
            latencyMs: Date.now() - startedAt,
            stages,
            error: {
              code: "CLOUDFLARE_GENERATION_ERROR",
              stage: "image_generation",
              message: "Image generation is not configured on this server (check IMAGE_GENERATION_PROVIDER and its credentials: CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN or POLLINATIONS_API_KEY). Try deterministic planner instead.",
              fallbackAvailable: true
            }
          };
        }
        const baseSeed = input.seed ?? 42;
        const buildingSite = createBuilding({
          projectId,
          name: projectName,
          site: {
            plotWidth: spec.hard.plotWidthMm,
            plotDepth: spec.hard.plotDepthMm,
            plannedFloorCount: spec.hard.floorsCount,
            roadFacing: spec.hard.roadFacing,
            setbacks: spec.setbacksMm ?? { front: 1500, rear: 1e3, left: 1e3, right: 1e3 },
            orientation: spec.orientationDegrees
          },
          floors: [{ buildingId: projectId, level: 0 }]
        }).site;
        const candidates = [];
        const maxVisualAttempts = resolveMaxVisualAttempts(this.deps.maxVisualAttempts);
        const preflightApplies = Boolean(
          isApartment && input.apartmentConfig && this.deps.interpreterKind === "gemini" && this.deps.gemini
        );
        if (!preflightApplies) stages.visualPreflight = "SKIPPED";
        const attemptSeeds = [];
        let preflightUnavailable = false;
        let fluxRetryTransportError;
        const conceptSlots = [];
        slotLoop:
          for (let cIdx = 0; cIdx < candidateTargetCount; cIdx++) {
            const slotSeed = (baseSeed + cIdx * 137) % 1e6;
            const attemptsForSlot = conceptMode ? 1 : preflightApplies ? maxVisualAttempts : 1;
            const slotConcept = conceptMode ? conceptSchematics[cIdx] : void 0;
            const slotSchematic = slotConcept?.schematic ?? apartmentSchematic;
            let slotReferenceIds = [];
            let slotDistinctReferences = null;
            const conceptInfo = () => slotConcept ? {
              candidateNumber: slotConcept.strategy.candidateNumber,
              candidateCount: candidateTargetCount,
              strategy: slotConcept.strategy.id,
              label: slotConcept.strategy.label,
              intent: slotConcept.strategy.intent,
              slotSeed,
              // Exactly the scaffold FLUX received as input image 1.
              schematicPngBase64: renderFluxSchematicPng(slotConcept.schematic).toString("base64"),
              spatialChecksPassed: slotConcept.schematic.spatialChecks.filter((c) => c.status === "PASS").length,
              spatialChecksTotal: slotConcept.schematic.spatialChecks.length,
              referenceIds: slotReferenceIds,
              distinctReferencesAvailable: slotDistinctReferences
            } : void 0;
            const recordSlot = (status, candidateId, error) => {
              if (!slotConcept) return;
              conceptSlots.push({
                candidateNumber: slotConcept.strategy.candidateNumber,
                strategy: slotConcept.strategy.id,
                label: slotConcept.strategy.label,
                seed: slotSeed,
                status,
                candidateId,
                referenceIds: slotReferenceIds,
                distinctReferencesAvailable: slotDistinctReferences,
                ...error !== void 0 ? { error } : {}
              });
            };
            let acceptedAttempt = null;
            for (let attemptIdx = 0; attemptIdx < attemptsForSlot; attemptIdx++) {
              const seed3 = deriveVisualAttemptSeed(slotSeed, attemptIdx);
              const attemptNumber = attemptIdx + 1;
              attemptSeeds.push(seed3);
              let promptRequest2;
              if (isApartment && input.apartmentConfig) {
                let referenceImages = [];
                let refDiagnostics;
                try {
                  const refResult = await loadApartmentReferenceImages({
                    projectType: "apartment",
                    flatsPerFloor: input.apartmentConfig.flatsPerFloor,
                    schematic: slotSchematic,
                    structuralPlan: slotConcept?.structuralPlan ?? slotSchematic?.structuralPlan,
                    ...conceptMode ? { conceptSlot: cIdx, styleCapWithSchematic: FLUX_MAX_INPUT_IMAGES - 1 } : {}
                  });
                  referenceImages = refResult.referenceImages;
                  refDiagnostics = refResult.diagnostics;
                  slotReferenceIds = referenceImages.map((r) => r.id).filter((id) => id !== "schematic_scaffold" && id !== "structural_reference");
                  slotDistinctReferences = refDiagnostics?.distinctReferencesAvailable ?? null;
                } catch (refErr) {
                  if (refErr instanceof ImageProviderError) {
                    return {
                      success: false,
                      projectId,
                      requirements: spec,
                      feasibility,
                      candidates,
                      latencyMs: Date.now() - startedAt,
                      apartmentSchematic,
                      apartmentRulesProfile,
                      apartmentManifest,
                      stages,
                      error: {
                        code: refErr.code || "CLOUDFLARE_GENERATION_ERROR",
                        stage: "reference_preparation",
                        message: `Reference preparation failure: ${refErr.message}`,
                        fallbackAvailable: false
                      }
                    };
                  }
                  throw refErr;
                }
                promptRequest2 = compileApartmentFloorPlanImagePrompt({
                  projectId,
                  projectName,
                  site: buildingSite,
                  apartmentConfig: input.apartmentConfig,
                  manifest: apartmentManifest,
                  additionalPrompt: input.additionalPrompt,
                  seed: seed3,
                  referenceImages: referenceImages.length > 0 ? referenceImages : void 0,
                  referenceDiagnostics: refDiagnostics,
                  ...slotConcept ? {
                    concept: {
                      candidateNumber: slotConcept.strategy.candidateNumber,
                      candidateCount: candidateTargetCount,
                      label: slotConcept.strategy.label,
                      intent: slotConcept.strategy.intent
                    }
                  } : {}
                });
              } else {
                let referenceImages = [];
                let refDiagnostics;
                try {
                  const refResult = await loadApartmentReferenceImages({
                    projectType: "residential_independent"
                  });
                  referenceImages = refResult.referenceImages;
                  refDiagnostics = refResult.diagnostics;
                } catch (refErr) {
                  console.warn("[GenerationOrchestrator] Villa reference loading error:", refErr);
                }
                promptRequest2 = compileFloorPlanImagePrompt({
                  requirements: spec,
                  site: buildingSite,
                  seed: seed3,
                  referenceImages: referenceImages.length > 0 ? referenceImages : void 0,
                  referenceDiagnostics: refDiagnostics
                });
              }
              stages.imageGeneration = "RUNNING";
              let generatedImage2;
              try {
                generatedImage2 = await this.deps.provider.generateFloorPlan(promptRequest2);
                stages.imageGeneration = "SUCCESS";
              } catch (err) {
                if (conceptMode) {
                  const message = err instanceof Error ? err.message : String(err);
                  stages.imageGeneration = "FAILED";
                  console.warn(`[GenerationOrchestrator] Concept ${cIdx + 1} (${slotConcept?.strategy.id}) FLUX call failed: ${message}`);
                  recordSlot("GENERATION_FAILED", null, message);
                  continue slotLoop;
                }
                if (isApartment && apartmentSchematic && apartmentManifest && candidates.length > 0) {
                  fluxRetryTransportError = err instanceof Error ? err.message : String(err);
                  stages.imageGeneration = "FAILED";
                  console.warn(`[GenerationOrchestrator] FLUX retry attempt ${attemptNumber} failed: ${fluxRetryTransportError}. Ending bounded retry.`);
                  break slotLoop;
                }
                stages.imageGeneration = "FAILED";
                stages.imageArtifact = "FAILED";
                if (err instanceof ImageProviderError) {
                  const isRefError = err.code.startsWith("REFERENCE");
                  return {
                    success: false,
                    projectId,
                    requirements: spec,
                    feasibility,
                    candidates,
                    latencyMs: Date.now() - startedAt,
                    stages,
                    error: {
                      code: isRefError ? err.code : "CLOUDFLARE_GENERATION_ERROR",
                      stage: isRefError ? "reference_preparation" : "image_generation",
                      message: isRefError ? `Reference asset error: ${err.message}` : `Image generation (${this.deps.provider?.name ?? "unknown provider"}) failed: ${err.message}`,
                      fallbackAvailable: true
                    }
                  };
                }
                return {
                  success: false,
                  projectId,
                  requirements: spec,
                  feasibility,
                  candidates,
                  latencyMs: Date.now() - startedAt,
                  stages,
                  error: {
                    code: "CLOUDFLARE_GENERATION_ERROR",
                    stage: "image_generation",
                    message: err instanceof Error ? err.message : "Unexpected image generation failure.",
                    fallbackAvailable: true
                  }
                };
              }
              try {
                const imageBytes = Buffer.from(generatedImage2.imageBase64, "base64");
                const quality = verifyImageQuality(imageBytes);
                if (!quality.valid) {
                  console.warn(`[GenerationOrchestrator] Image failed quality gate: ${quality.reason}. Regenerating with seed ${seed3 + 1}...`);
                  const retryPrompt = { ...promptRequest2, seed: seed3 + 1 };
                  generatedImage2 = await this.deps.provider.generateFloorPlan(retryPrompt);
                  promptRequest2 = retryPrompt;
                }
              } catch (qErr) {
                console.warn("[GenerationOrchestrator] Image quality verification warning:", qErr);
              }
              let apartmentPreflightResult2;
              let expectedBrief;
              let preflightError;
              if (preflightApplies && input.apartmentConfig && this.deps.gemini) {
                stages.visualPreflight = "RUNNING";
                try {
                  expectedBrief = apartmentManifest ? {
                    flatsPerFloor: apartmentManifest.units.exactCount,
                    unitMix: input.apartmentConfig.unitMix,
                    liftCount: apartmentManifest.commonCore.lifts,
                    stairCount: apartmentManifest.commonCore.stairs,
                    commonCoreRequired: true
                  } : {
                    flatsPerFloor: input.apartmentConfig.flatsPerFloor,
                    unitMix: input.apartmentConfig.unitMix,
                    liftCount: input.apartmentConfig.commonCore.passengerLifts,
                    stairCount: Math.max(1, input.apartmentConfig.commonCore.staircaseCount),
                    commonCoreRequired: true
                  };
                  apartmentPreflightResult2 = await runGeminiApartmentPreflight(
                    this.deps.gemini,
                    generatedImage2.imageBase64,
                    expectedBrief,
                    generatedImage2.mimeType
                  );
                  if (!apartmentPreflightResult2.pass) {
                    console.warn(`[GenerationOrchestrator] Gemini visual preflight rejection: ${apartmentPreflightResult2.matchingSummary}`);
                  }
                } catch (pfErr) {
                  preflightError = pfErr instanceof Error ? pfErr.message : String(pfErr);
                  console.warn("[GenerationOrchestrator] Visual preflight could not be completed:", preflightError);
                }
              }
              const artifact2 = await this.deps.store.save(projectId, generatedImage2, promptRequest2);
              stages.imageArtifact = "AVAILABLE";
              const preflightRejected = Boolean(apartmentPreflightResult2 && !apartmentPreflightResult2.pass);
              if (preflightRejected || preflightError !== void 0) {
                const reasons = preflightRejected ? [...apartmentPreflightResult2.failureReasons] : [`Visual preflight could not be completed: ${preflightError}`];
                const summary = preflightRejected ? apartmentPreflightResult2.matchingSummary : `Visual preflight unavailable: ${preflightError}`;
                stages.visualPreflight = preflightRejected ? "REJECTED" : "UNAVAILABLE";
                console.warn(
                  `[GenerationOrchestrator] FLUX attempt ${attemptNumber}/${attemptsForSlot} (seed ${seed3}) rejected at visual preflight: ${summary}`
                );
                const preflightRefDiag = generatedImage2.referenceDiagnostics ?? promptRequest2.referenceDiagnostics;
                candidates.push({
                  id: `cand_two_ai_${seed3}_${cIdx}`,
                  seed: seed3,
                  status: "REJECTED",
                  source: "FLUX",
                  visualSource: "FLUX_IMAGE",
                  attempt: attemptNumber,
                  rejectionStage: "VISUAL_PREFLIGHT",
                  // Rejected at the visual gate: nothing after preflight ran for this candidate.
                  evaluationStatus: "NOT_SCORED_REJECTED",
                  stages: {
                    imageGeneration: "SUCCESS",
                    imageArtifact: "AVAILABLE",
                    visualPreflight: preflightRejected ? "REJECTED" : "UNAVAILABLE",
                    imageInterpretation: "SKIPPED",
                    imageTo2D: "SKIPPED",
                    validation: "SKIPPED",
                    geminiEvaluation: "SKIPPED"
                  },
                  building: null,
                  artifact: artifact2,
                  validation: {
                    isValid: false,
                    recommendedForEditing: false,
                    geometryHealthy: false,
                    overallScore: null,
                    verificationIssues: reasons.map((r) => ({ code: "VISUAL_PREFLIGHT_FAIL", severity: "error", message: r }))
                  },
                  evaluation: null,
                  ...apartmentPreflightResult2 ? { preflight: apartmentPreflightResult2 } : {},
                  diagnostics: [
                    {
                      code: preflightRejected ? "VISUAL_PREFLIGHT_FAIL" : "VISUAL_PREFLIGHT_UNAVAILABLE",
                      severity: "error",
                      message: summary
                    },
                    ...preflightRefDiag && preflightRefDiag.drops.length > 0 ? [{
                      code: "REFERENCE_IMAGES_DROPPED",
                      severity: "warning",
                      message: `Reference images dropped: ${preflightRefDiag.drops.map((d) => `${d.id} (${d.reason})`).join(", ")}`
                    }] : []
                  ],
                  rejectedReason: `Rejected at visual preflight: ${reasons.join("; ")}`,
                  referenceDiagnostics: preflightRefDiag,
                  ...slotConcept ? { concept: conceptInfo() } : {}
                });
                recordSlot("GENERATED", `cand_two_ai_${seed3}_${cIdx}`);
                if (!preflightRejected) {
                  preflightUnavailable = true;
                  if (conceptMode) continue slotLoop;
                  break slotLoop;
                }
                continue;
              }
              if (preflightApplies) stages.visualPreflight = "PASSED";
              acceptedAttempt = {
                seed: seed3,
                attempt: attemptNumber,
                promptRequest: promptRequest2,
                generatedImage: generatedImage2,
                artifact: artifact2,
                preflight: apartmentPreflightResult2
              };
              break;
            }
            if (!acceptedAttempt) {
              continue;
            }
            const { seed: seed2, promptRequest, generatedImage, artifact } = acceptedAttempt;
            const apartmentPreflightResult = acceptedAttempt.preflight;
            stages.imageInterpretation = "RUNNING";
            let payload;
            let interpretationSource = "provider";
            let confidence = "likely";
            let interpretationFrame;
            if (this.deps.interpreterKind === "gemini") {
              if (!this.deps.gemini || !await this.deps.gemini.isAvailable()) {
                stages.imageInterpretation = "AUTH_ERROR";
                return {
                  success: false,
                  projectId,
                  requirements: spec,
                  feasibility,
                  candidates,
                  savedArtifact: artifact,
                  stages,
                  latencyMs: Date.now() - startedAt,
                  error: {
                    code: "IMAGE_INTERPRETATION_ERROR",
                    stage: "image_interpretation",
                    message: "Gemini vision is not configured on this server (GEMINI_API_KEY missing).",
                    fallbackAvailable: true,
                    artifactId: artifact.generationId,
                    artifact,
                    isTransient: false
                  }
                };
              }
              try {
                const vision = await interpretPlanImageWithGemini(this.deps.gemini, {
                  plotWidthMm: spec.hard.plotWidthMm,
                  plotDepthMm: spec.hard.plotDepthMm,
                  orientationDegrees: spec.orientationDegrees,
                  roadFacing: spec.hard.roadFacing,
                  userPrompt: spec.rawUserPrompt,
                  imageBase64: artifact.imageBase64,
                  imageMimeType: artifact.mimeType,
                  ...isApartment && apartmentManifest ? {
                    apartmentContext: apartmentInterpretationContextFromManifest(apartmentManifest),
                    requirements: {
                      plotWidthMm: spec.hard.plotWidthMm,
                      plotDepthMm: spec.hard.plotDepthMm,
                      roadFacing: spec.hard.roadFacing,
                      unitMix: input.apartmentConfig?.unitMix ?? []
                    }
                  } : {}
                });
                payload = vision.parsed;
                if (vision.coordinateFrame.kind === "normalized") {
                  interpretationFrame = { width: vision.coordinateFrame.width, height: vision.coordinateFrame.height };
                }
                interpretationSource = "provider";
                stages.imageInterpretation = "SUCCESS";
              } catch (vErr) {
                const status = extractHttpStatus(vErr);
                const isTransient = isTransientHttpError(status);
                const isAuth = isAuthHttpError(status);
                stages.imageInterpretation = isTransient ? "TEMPORARILY_UNAVAILABLE" : isAuth ? "AUTH_ERROR" : "FAILED";
                return {
                  success: false,
                  projectId,
                  requirements: spec,
                  feasibility,
                  candidates,
                  savedArtifact: artifact,
                  stages,
                  latencyMs: Date.now() - startedAt,
                  error: {
                    code: isTransient ? "PROVIDER_UNAVAILABLE" : "IMAGE_INTERPRETATION_ERROR",
                    stage: "image_interpretation",
                    message: vErr instanceof Error ? vErr.message : "Gemini vision interpretation failed.",
                    fallbackAvailable: true,
                    artifactId: artifact.generationId,
                    artifact,
                    isTransient
                  }
                };
              }
            } else {
              const synth = synthesizeInterpretation(spec);
              payload = synth.payload;
              interpretationSource = synth.source;
              confidence = synth.confidence;
              stages.imageInterpretation = "SUCCESS";
            }
            stages.imageTo2D = "RUNNING";
            stages.validation = "RUNNING";
            const imageWidePixels = interpretationSource === "provider" ? artifact.width : 1024;
            const imageTallPixels = interpretationSource === "provider" ? artifact.height : 1024;
            const extraction = runExtractionPipeline({
              projectId,
              projectName,
              requirements: spec,
              imageWidePixels,
              imageTallPixels,
              payload,
              extractionSource: interpretationSource === "provider" ? "gemini_vision" : "local_rule_based",
              confidence,
              interpretationSource,
              isApartment,
              apartmentManifest,
              ...interpretationFrame ? { coordinateFrame: interpretationFrame } : {}
            });
            const isValid = extraction.status === "ACCEPTED" && extraction.building !== null;
            const geometryBuilt = extraction.apartmentValidation ? extraction.apartmentValidation.stages.canonicalGeometry === "PASS" : extraction.building !== null || extraction.validation !== null;
            stages.imageTo2D = isValid ? "SUCCESS" : geometryBuilt ? "FAILED" : "SKIPPED";
            stages.validation = isValid ? "SUCCESS" : "FAILED";
            stages.geminiEvaluation = isValid ? "RUNNING" : "SKIPPED";
            const gated = await evaluateIfHardValid(this.deps.gemini, isValid, {
              buildingSummary: isValid ? `${extraction.building.floors.length} floor(s), ${extraction.building.floors[0]?.rooms.length ?? 0} rooms, plot ${spec.hard.plotWidthMm}x${spec.hard.plotDepthMm}mm, road facing ${spec.hard.roadFacing}` : "",
              requirementsSummary: `${spec.hard.bedroomCount} bedrooms, ${spec.hard.bathroomCount} bathrooms${spec.rawUserPrompt ? `, prompt: ${spec.rawUserPrompt}` : ""}`,
              imageBase64: artifact.imageBase64,
              imageMimeType: artifact.mimeType
            });
            const evaluation = gated.evaluation;
            stages.geminiEvaluation = gated.stage;
            const candidateStatus = extraction.status;
            const candidateAccepted = candidateStatus === "ACCEPTED";
            const candidateRejectedReason = extraction.status === "REJECTED" ? "Candidate rejected by deterministic validation: geometric overlap, boundary violation, or room criteria unmet. Image preserved immutable." : null;
            const candRefDiag = generatedImage.referenceDiagnostics ?? promptRequest.referenceDiagnostics;
            const candidateDiagnostics = [...extraction.diagnostics];
            if (candRefDiag && candRefDiag.drops.length > 0) {
              candidateDiagnostics.push({
                code: "REFERENCE_IMAGES_DROPPED",
                severity: "warning",
                message: `Reference images dropped: ${candRefDiag.drops.map((d) => `${d.id} (${d.reason})`).join(", ")}`
              });
            }
            if (gated.status === "UNAVAILABLE") {
              candidateDiagnostics.push({
                code: "GEMINI_EVALUATION_UNAVAILABLE",
                severity: "warning",
                message: `Gemini evaluation unavailable: ${gated.error ?? "unknown error"}. The plan is hard-valid but NOT SCORED.`
              });
            }
            candidates.push({
              id: `cand_two_ai_${seed2}_${cIdx}`,
              seed: seed2,
              status: candidateStatus,
              source: "FLUX",
              visualSource: "FLUX_IMAGE",
              attempt: acceptedAttempt.attempt,
              rejectionStage: candidateAccepted ? null : "HARD_VALIDATION",
              evaluationStatus: gated.status,
              stages: { ...stages },
              building: extraction.building,
              artifact,
              validation: {
                isValid: extraction.validation?.isValid ?? false,
                recommendedForEditing: extraction.validation?.recommendedForEditing ?? false,
                geometryHealthy: extraction.validation?.geometryHealthy ?? false,
                overallScore: candidateAccepted ? extraction.validation?.overallScore ?? null : null,
                verificationIssues: [...extraction.validation?.verificationIssues ?? []]
              },
              evaluation,
              preflight: apartmentPreflightResult,
              diagnostics: candidateDiagnostics,
              rejectedReason: candidateRejectedReason,
              referenceDiagnostics: candRefDiag,
              ...extraction.apartmentValidation ? { apartmentValidation: { source: extraction.apartmentValidation.source, stages: extraction.apartmentValidation.stages } } : {},
              ...slotConcept ? { concept: conceptInfo() } : {}
            });
            recordSlot("GENERATED", `cand_two_ai_${seed2}_${cIdx}`);
          }
        if (conceptMode && candidates.length === 0) {
          stages.imageGeneration = "FAILED";
          stages.imageArtifact = "FAILED";
          return {
            success: false,
            projectId,
            requirements: spec,
            feasibility,
            candidates,
            latencyMs: Date.now() - startedAt,
            stages,
            apartmentSchematic,
            apartmentRulesProfile,
            apartmentManifest,
            conceptMode: true,
            conceptSlots,
            error: {
              code: "CLOUDFLARE_GENERATION_ERROR",
              stage: "image_generation",
              message: `Image generation (${this.deps.provider?.name ?? "unknown provider"}) failed for all ${conceptSlots.length} concepts: ${conceptSlots[0]?.error ?? "unknown error"}`,
              reasons: conceptSlots.map((s) => `Candidate ${String(s.candidateNumber).padStart(2, "0")} (${s.label}, seed ${s.seed}): ${s.error ?? "failed"}`),
              fallbackAvailable: true
            }
          };
        }
        const anyFluxAccepted = candidates.some((c) => c.status === "ACCEPTED");
        if (anyFluxAccepted && preflightApplies) stages.visualPreflight = "PASSED";
        let fallbackInfo;
        if (!anyFluxAccepted && isApartment && apartmentSchematic && apartmentManifest && candidates.length > 0) {
          const rejectedFlux = [...candidates];
          const allPreflightRejected = rejectedFlux.every((c) => c.rejectionStage === "VISUAL_PREFLIGHT");
          const reason = preflightUnavailable ? "FLUX_PREFLIGHT_UNAVAILABLE" : fluxRetryTransportError !== void 0 ? "FLUX_RETRY_TRANSPORT_FAILED" : allPreflightRejected ? "FLUX_PREFLIGHT_EXHAUSTED" : "FLUX_CANDIDATES_REJECTED";
          const plan = buildDeterministicFallbackPlan({
            schematic: apartmentSchematic,
            manifest: apartmentManifest,
            requirements: spec,
            projectId,
            projectName
          });
          const fallbackVisual = buildDeterministicFallbackImage({
            schematic: apartmentSchematic,
            seed: baseSeed,
            projectId,
            projectName,
            plotWidthMm: spec.hard.plotWidthMm,
            plotDepthMm: spec.hard.plotDepthMm,
            floorsCount: spec.hard.floorsCount,
            roadFacing: String(spec.hard.roadFacing)
          });
          const fallbackArtifact = await this.deps.store.save(projectId, fallbackVisual.image, fallbackVisual.request);
          if (reason === "FLUX_PREFLIGHT_EXHAUSTED") stages.imageGeneration = "EXHAUSTED";
          if (stages.imageInterpretation === "PENDING" || stages.imageInterpretation === "RUNNING") {
            stages.imageInterpretation = "SKIPPED";
          }
          stages.imageTo2D = plan.isValid ? "SUCCESS" : "FAILED";
          stages.validation = plan.isValid ? "SUCCESS" : "FAILED";
          stages.geminiEvaluation = plan.isValid ? "RUNNING" : "SKIPPED";
          const fallbackGated = await evaluateIfHardValid(this.deps.gemini, plan.isValid && plan.building !== null, {
            buildingSummary: `Deterministic apartment base plan (not FLUX-generated): ${plan.measured.flats} flats, ${plan.measured.lifts} lifts, ${plan.measured.stairs} stairs, common lobby ${plan.measured.commonLobby ? "yes" : "no"}, ${plan.building?.floors[0]?.rooms.length ?? 0} rooms, plot ${spec.hard.plotWidthMm}x${spec.hard.plotDepthMm}mm, road facing ${spec.hard.roadFacing}`,
            requirementsSummary: `${apartmentSchematic.unitMixSummary}; ${apartmentManifest.commonCore.lifts} lifts, ${apartmentManifest.commonCore.stairs} stairs, common lobby`,
            imageBase64: fallbackArtifact.imageBase64,
            imageMimeType: fallbackArtifact.mimeType
          });
          const fallbackEvaluation = fallbackGated.evaluation;
          stages.geminiEvaluation = fallbackGated.stage;
          const fallbackStages = {
            imageGeneration: "SKIPPED",
            imageArtifact: "AVAILABLE",
            visualPreflight: "SKIPPED",
            imageInterpretation: "SKIPPED",
            imageTo2D: plan.stages.canonicalGeometry === "PASS" ? plan.isValid ? "SUCCESS" : "FAILED" : "SKIPPED",
            validation: plan.isValid ? "SUCCESS" : "FAILED",
            geminiEvaluation: fallbackGated.stage
          };
          const fallbackCandidateId = `cand_fallback_deterministic_${baseSeed}`;
          candidates.push({
            id: fallbackCandidateId,
            seed: baseSeed,
            status: plan.status,
            source: "FALLBACK_DETERMINISTIC",
            visualSource: "DETERMINISTIC_SCHEMATIC",
            rejectionStage: plan.isValid ? null : "HARD_VALIDATION",
            evaluationStatus: fallbackGated.status,
            stages: fallbackStages,
            building: plan.building,
            artifact: fallbackArtifact,
            validation: {
              isValid: plan.isValid,
              recommendedForEditing: plan.isValid,
              geometryHealthy: plan.geometryHealthy,
              // No fabricated number: only the Gemini evaluation carries a score.
              overallScore: null,
              verificationIssues: plan.issues
            },
            evaluation: fallbackEvaluation,
            diagnostics: [
              { code: "FALLBACK_DETERMINISTIC", severity: "info", message: FALLBACK_USER_MESSAGE },
              ...plan.issues,
              ...fallbackGated.status === "UNAVAILABLE" ? [{ code: "GEMINI_EVALUATION_UNAVAILABLE", severity: "warning", message: `Gemini evaluation unavailable: ${fallbackGated.error ?? "unknown error"}. NOT SCORED.` }] : []
            ],
            rejectedReason: plan.isValid ? null : `Deterministic fallback failed structural verification: ${plan.issues.filter((i) => i.severity === "error").map((i) => i.message).join("; ")}`,
            apartmentValidation: { source: "DETERMINISTIC_SCHEMATIC", stages: plan.stages }
          });
          fallbackInfo = {
            used: true,
            reason,
            message: FALLBACK_USER_MESSAGE,
            fluxAttempts: attemptSeeds.length,
            maxVisualAttemptsPerCandidate: maxVisualAttempts,
            rejectedCandidateIds: rejectedFlux.map((c) => c.id),
            rejectedArtifactIds: rejectedFlux.map((c) => c.artifact.generationId),
            fallbackCandidateId,
            fallbackArtifactId: fallbackArtifact.generationId,
            measured: plan.measured,
            required: plan.required
          };
        }
        const acceptedCandidate = candidates.find((c) => c.status === "ACCEPTED") ?? null;
        const anyAccepted = acceptedCandidate !== null;
        const rejectedAtPreflight = candidates.filter((c) => c.rejectionStage === "VISUAL_PREFLIGHT");
        const onlyPreflightRejections = candidates.length > 0 && rejectedAtPreflight.length === candidates.length;
        return {
          success: anyAccepted,
          projectId,
          requirements: spec,
          feasibility,
          candidates,
          stages,
          latencyMs: Date.now() - startedAt,
          apartmentSchematic,
          apartmentRulesProfile,
          apartmentManifest,
          candidateSource: acceptedCandidate?.source ?? null,
          visualAttempts: {
            maxPerCandidate: conceptMode ? 1 : preflightApplies ? maxVisualAttempts : 1,
            attempted: attemptSeeds.length,
            seeds: attemptSeeds
          },
          ...conceptMode ? { conceptMode: true, conceptSlots } : {},
          ...fallbackInfo ? { fallback: fallbackInfo } : {},
          ...!anyAccepted && candidates.length > 0 ? {
            error: onlyPreflightRejections ? {
              code: "VISUAL_PREFLIGHT_REJECTED",
              stage: "visual_preflight",
              message: `Rejected at visual preflight after ${attemptSeeds.length} attempt(s). Not scored.`,
              reasons: [...new Set(rejectedAtPreflight.flatMap((c) => c.validation.verificationIssues.map((i) => i.message)))],
              fallbackAvailable: true
            } : {
              code: "GEOMETRY_VALIDATION_ERROR",
              stage: "hard_validation",
              message: "Generated candidate(s) failed deterministic architectural validation. Try adjusting setbacks or generating with a different seed.",
              reasons: candidates.flatMap((c) => c.validation.verificationIssues.map((i) => i.message)),
              fallbackAvailable: true
            }
          } : {}
        };
      }
      /**
       * Resumes generation directly from a stored image artifact, running Gemini vision
       * interpretation + deterministic geometry validation + Gemini scoring WITHOUT
       * regenerating the image or calling FLUX (PRD §17 & Urgent Directive §11).
       */
      async resumeFromArtifact(input) {
        const startedAt = Date.now();
        const projectId = input.projectId?.trim() || "project-generation";
        const projectName = input.projectName?.trim() || projectId;
        const spec = input.requirements ?? normalizeDesignRequirementSpecification({
          projectId,
          projectName,
          hard: {
            plotWidthMm: 12e3,
            plotDepthMm: 15e3,
            roadFacing: Direction.North,
            floorsCount: 1,
            bedroomCount: 2,
            bathroomCount: 2,
            livingRoomRequired: true,
            kitchenRequired: true,
            diningRoomRequired: true,
            parkingRequired: true,
            parkingSpacesCount: 1,
            fullPlotCoverage: false,
            staircaseRequired: false
          }
        });
        const feasibility = new RequirementValidator().validate(spec);
        const stages = {
          imageGeneration: "SUCCESS",
          imageArtifact: "AVAILABLE",
          visualPreflight: "SKIPPED",
          imageInterpretation: "RUNNING",
          imageTo2D: "PENDING",
          validation: "PENDING",
          geminiEvaluation: "PENDING"
        };
        const artifact = await this.deps.store.get(input.artifactId);
        if (!artifact) {
          stages.imageArtifact = "FAILED";
          return {
            success: false,
            projectId,
            requirements: spec,
            feasibility,
            candidates: [],
            stages,
            latencyMs: Date.now() - startedAt,
            error: {
              code: "IMAGE_INTERPRETATION_ERROR",
              stage: "image_interpretation",
              message: `Artifact "${input.artifactId}" not found in image store.`,
              isTransient: false
            }
          };
        }
        let payload;
        let interpretationSource = "provider";
        let confidence = "likely";
        if (this.deps.interpreterKind === "gemini") {
          if (!this.deps.gemini || !await this.deps.gemini.isAvailable()) {
            stages.imageInterpretation = "AUTH_ERROR";
            return {
              success: false,
              projectId,
              requirements: spec,
              feasibility,
              candidates: [],
              savedArtifact: artifact,
              stages,
              latencyMs: Date.now() - startedAt,
              error: {
                code: "IMAGE_INTERPRETATION_ERROR",
                stage: "image_interpretation",
                message: "Gemini vision is not configured on this server (GEMINI_API_KEY missing).",
                artifactId: artifact.generationId,
                artifact,
                isTransient: false
              }
            };
          }
          try {
            const vision = await interpretPlanImageWithGemini(this.deps.gemini, {
              plotWidthMm: spec.hard.plotWidthMm,
              plotDepthMm: spec.hard.plotDepthMm,
              orientationDegrees: spec.orientationDegrees,
              roadFacing: spec.hard.roadFacing,
              userPrompt: spec.rawUserPrompt,
              imageBase64: artifact.imageBase64,
              imageMimeType: artifact.mimeType
            });
            payload = vision.parsed;
            interpretationSource = "provider";
            stages.imageInterpretation = "SUCCESS";
          } catch (vErr) {
            const status = extractHttpStatus(vErr);
            const isTransient = isTransientHttpError(status);
            const isAuth = isAuthHttpError(status);
            stages.imageInterpretation = isTransient ? "TEMPORARILY_UNAVAILABLE" : isAuth ? "AUTH_ERROR" : "FAILED";
            return {
              success: false,
              projectId,
              requirements: spec,
              feasibility,
              candidates: [],
              savedArtifact: artifact,
              stages,
              latencyMs: Date.now() - startedAt,
              error: {
                code: isTransient ? "PROVIDER_UNAVAILABLE" : "IMAGE_INTERPRETATION_ERROR",
                stage: "image_interpretation",
                message: vErr instanceof Error ? vErr.message : "Gemini vision interpretation failed.",
                fallbackAvailable: true,
                artifactId: artifact.generationId,
                artifact,
                isTransient
              }
            };
          }
        } else {
          const synth = synthesizeInterpretation(spec);
          payload = synth.payload;
          interpretationSource = synth.source;
          confidence = synth.confidence;
          stages.imageInterpretation = "SUCCESS";
        }
        stages.imageTo2D = "RUNNING";
        stages.validation = "RUNNING";
        const imageWidePixels = interpretationSource === "provider" ? artifact.width : 1024;
        const imageTallPixels = interpretationSource === "provider" ? artifact.height : 1024;
        const extraction = runExtractionPipeline({
          projectId,
          projectName,
          requirements: spec,
          imageWidePixels,
          imageTallPixels,
          payload,
          extractionSource: interpretationSource === "provider" ? "gemini_vision" : "local_rule_based",
          confidence,
          interpretationSource
        });
        const isValid = extraction.status === "ACCEPTED" && extraction.building !== null;
        stages.imageTo2D = isValid ? "SUCCESS" : "FAILED";
        stages.validation = isValid ? "SUCCESS" : "FAILED";
        stages.geminiEvaluation = isValid ? "RUNNING" : "SKIPPED";
        const gated = await evaluateIfHardValid(this.deps.gemini, isValid, {
          buildingSummary: isValid ? `${extraction.building.floors.length} floor(s), ${extraction.building.floors[0]?.rooms.length ?? 0} rooms, plot ${spec.hard.plotWidthMm}x${spec.hard.plotDepthMm}mm, road facing ${spec.hard.roadFacing}` : "",
          requirementsSummary: `${spec.hard.bedroomCount} bedrooms, ${spec.hard.bathroomCount} bathrooms${spec.rawUserPrompt ? `, prompt: ${spec.rawUserPrompt}` : ""}`,
          imageBase64: artifact.imageBase64,
          imageMimeType: artifact.mimeType
        });
        const evaluation = gated.evaluation;
        stages.geminiEvaluation = gated.stage;
        const resumedFromFallback = artifact.provider === FALLBACK_DETERMINISTIC_PROVIDER;
        const candidate = {
          id: `cand_resumed_${artifact.seed}_${Date.now().toString(36)}`,
          seed: artifact.seed,
          status: extraction.status,
          source: resumedFromFallback ? "FALLBACK_DETERMINISTIC" : "FLUX",
          visualSource: resumedFromFallback ? "DETERMINISTIC_SCHEMATIC" : "FLUX_IMAGE",
          rejectionStage: extraction.status === "ACCEPTED" ? null : "HARD_VALIDATION",
          evaluationStatus: gated.status,
          stages: { ...stages },
          building: extraction.building,
          artifact,
          validation: {
            isValid: extraction.validation?.isValid ?? false,
            recommendedForEditing: extraction.validation?.recommendedForEditing ?? false,
            geometryHealthy: extraction.validation?.geometryHealthy ?? false,
            overallScore: extraction.status === "ACCEPTED" ? extraction.validation?.overallScore ?? null : null,
            verificationIssues: extraction.validation?.verificationIssues ?? []
          },
          evaluation,
          diagnostics: extraction.diagnostics,
          rejectedReason: extraction.status === "REJECTED" ? "Candidate rejected by deterministic validation: geometric overlap, boundary violation, or room criteria unmet. Image preserved immutable." : null
        };
        return {
          success: isValid,
          projectId,
          requirements: spec,
          feasibility,
          candidates: [candidate],
          savedArtifact: artifact,
          stages,
          latencyMs: Date.now() - startedAt,
          candidateSource: isValid ? candidate.source : null,
          error: isValid ? void 0 : {
            code: "GEOMETRY_VALIDATION_ERROR",
            stage: "geometry_validation",
            message: "Deterministic geometry validation failed.",
            reasons: extraction.diagnostics.map((d) => `[${d.severity}] ${d.message}`),
            fallbackAvailable: false,
            artifactId: artifact.generationId,
            artifact
          }
        };
      }
    };
  }
});

// src/server.ts
var server_exports = {};
__export(server_exports, {
  GENERATION_REQUEST_TIMEOUT_MS: () => GENERATION_REQUEST_TIMEOUT_MS,
  checkProviderHealth: () => checkProviderHealth,
  createBackendServer: () => createBackendServer,
  createGeminiProvider: () => createGeminiProvider,
  createImageProvider: () => createImageProvider,
  startBackendServer: () => startBackendServer
});
module.exports = __toCommonJS(server_exports);
var import_node_http = require("node:http");
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
init_dist4();

// src/api/image-routes.ts
init_dist4();
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function parseFloorPlanImageRequest(value) {
  if (!isRecord(value)) return null;
  const prompt = value.prompt;
  const negativePrompt = value.negativePrompt;
  const seed2 = value.seed;
  const width = value.width;
  const height = value.height;
  if (typeof prompt !== "string" || prompt.trim().length === 0) return null;
  if (typeof negativePrompt !== "string") return null;
  if (typeof seed2 !== "number" || !Number.isFinite(seed2)) return null;
  if (typeof width !== "number" || !Number.isFinite(width) || width <= 0) return null;
  if (typeof height !== "number" || !Number.isFinite(height) || height <= 0) return null;
  if (value.schemaVersion !== 1 || typeof value.promptVersion !== "number") return null;
  const metadata = value.metadata;
  if (!isRecord(metadata) || typeof metadata.projectName !== "string") return null;
  return value;
}
async function handleFloorPlanGeneration(body, deps) {
  const record3 = isRecord(body) ? body : {};
  const projectId = typeof record3.projectId === "string" && record3.projectId.trim().length > 0 ? record3.projectId.trim() : null;
  const request = parseFloorPlanImageRequest(record3.request);
  if (!projectId || !request) {
    return { status: 400, json: { error: { code: "INVALID_REQUEST", message: "A projectId and a compiled FloorPlanImagePromptRequest are required." } } };
  }
  if (!deps.provider || !await deps.provider.isAvailable()) {
    return {
      status: 503,
      json: { error: { code: "IMAGE_PROVIDER_NOT_CONFIGURED", message: "Floor-plan image generation is not configured on this server." } }
    };
  }
  try {
    const generated = await deps.provider.generateFloorPlan(request);
    const artifact = await deps.store.save(projectId, generated, request);
    return { status: 200, json: { artifact } };
  } catch (error) {
    if (error instanceof ImageProviderError) {
      const status = error.code === "IMAGE_PROVIDER_NOT_CONFIGURED" ? 503 : 502;
      return { status, json: { error: { code: error.code, message: error.message } } };
    }
    return { status: 500, json: { error: { code: "IMAGE_GENERATION_FAILED", message: "Image generation failed unexpectedly." } } };
  }
}
async function handleArtifactGet(generationId, store) {
  if (!/^gen_[0-9a-z_]+$/.test(generationId)) {
    return { status: 400, json: { error: { code: "INVALID_GENERATION_ID", message: "Malformed generation id." } } };
  }
  const artifact = await store.get(generationId);
  if (!artifact) {
    return { status: 404, json: { error: { code: "ARTIFACT_NOT_FOUND", message: "No image artifact exists for this generation id." } } };
  }
  return { status: 200, json: { artifact } };
}

// src/api/interpretation-routes.ts
init_dist();
init_dist4();
init_extraction_pipeline();
init_local_stub_plan_interpreter();
function parseInterpretBody(body) {
  const record3 = isRecord(body) ? body : null;
  if (!record3) return null;
  const projectId = typeof record3.projectId === "string" && record3.projectId.trim() ? record3.projectId.trim() : null;
  const imageBase64 = typeof record3.imageBase64 === "string" && record3.imageBase64.length > 0 ? record3.imageBase64 : null;
  const imageMimeType = typeof record3.imageMimeType === "string" ? record3.imageMimeType : "image/png";
  const imageWidePixels = typeof record3.imageWidePixels === "number" ? record3.imageWidePixels : null;
  const imageTallPixels = typeof record3.imageTallPixels === "number" ? record3.imageTallPixels : null;
  if (!projectId || !imageBase64 || !imageWidePixels || !imageTallPixels) return null;
  const requirements = normalizeDesignRequirementSpecification(record3.requirements);
  return {
    projectId,
    projectName: typeof record3.projectName === "string" && record3.projectName.trim() ? record3.projectName.trim() : projectId,
    requirements,
    ...record3.program && typeof record3.program === "object" ? { program: record3.program } : {},
    imageBase64,
    imageMimeType,
    imageWidePixels,
    imageTallPixels
  };
}
function interpretRouteResult(result) {
  return {
    status: 200,
    json: {
      status: result.status,
      planId: result.planId,
      interpretationSource: result.interpretationSource,
      confidence: result.confidence,
      diagnostics: result.diagnostics,
      validation: result.validation ? {
        isValid: result.validation.isValid,
        recommendedForEditing: result.validation.recommendedForEditing,
        geometryHealthy: result.validation.geometryHealthy,
        overallScore: result.validation.overallScore
      } : null,
      // Geometry is returned ONLY when the deterministic system accepted it (PRD 23).
      building: result.status === "ACCEPTED" ? result.building : null,
      rejectedReason: result.status === "REJECTED" ? "The extracted plan did not pass deterministic validation. The image was not modified and no substitute plan was created." : null
    }
  };
}
async function handleImageInterpretation(body, deps) {
  const parsed = parseInterpretBody(body);
  if (!parsed) {
    return { status: 400, json: { error: { code: "INVALID_REQUEST", message: "projectId, imageBase64 and image dimensions are required." } } };
  }
  let payload;
  let interpretationSource;
  let confidence;
  if (deps.interpreterKind === "gemini") {
    if (!deps.gemini || !await deps.gemini.isAvailable()) {
      return {
        status: 503,
        json: { error: { code: "IMAGE_INTERPRETER_NOT_CONFIGURED", message: "Vision interpretation is not configured on this server (GEMINI_API_KEY missing). The image was not interpreted." } }
      };
    }
    try {
      const vision = await interpretPlanImageWithGemini(deps.gemini, {
        plotWidthMm: parsed.requirements.hard.plotWidthMm,
        plotDepthMm: parsed.requirements.hard.plotDepthMm,
        orientationDegrees: parsed.requirements.orientationDegrees,
        roadFacing: parsed.requirements.hard.roadFacing,
        ...parsed.requirements.rawUserPrompt ? { userPrompt: parsed.requirements.rawUserPrompt } : {},
        imageBase64: parsed.imageBase64,
        imageMimeType: parsed.imageMimeType
      });
      payload = vision.parsed;
      interpretationSource = "provider";
      confidence = "likely";
    } catch (error) {
      return {
        status: 502,
        json: { error: { code: "IMAGE_INTERPRETATION_FAILED", message: error instanceof Error ? error.message : "Vision interpretation failed." } }
      };
    }
  } else {
    const synthesized = synthesizeInterpretation(parsed.requirements, parsed.program);
    payload = synthesized.payload;
    interpretationSource = synthesized.source;
    confidence = synthesized.confidence;
  }
  const result = runExtractionPipeline({
    projectId: parsed.projectId,
    projectName: parsed.projectName,
    requirements: parsed.requirements,
    ...parsed.program ? { program: parsed.program } : {},
    imageWidePixels: parsed.imageWidePixels,
    imageTallPixels: parsed.imageTallPixels,
    payload,
    extractionSource: interpretationSource === "provider" ? "gemini_vision" : "local_rule_based",
    confidence,
    interpretationSource
  });
  return interpretRouteResult(result);
}
async function handleArchitecturalEvaluation(body, deps) {
  const record3 = isRecord(body) ? body : null;
  const buildingSummary = record3 && typeof record3.buildingSummary === "string" ? record3.buildingSummary : null;
  const requirementsSummary = record3 && typeof record3.requirementsSummary === "string" ? record3.requirementsSummary : null;
  if (!record3 || !buildingSummary || !requirementsSummary) {
    return { status: 400, json: { error: { code: "INVALID_REQUEST", message: "buildingSummary and requirementsSummary are required." } } };
  }
  if (!deps.gemini || !await deps.gemini.isAvailable()) {
    return { status: 503, json: { error: { code: "ARCHITECTURAL_EVALUATOR_NOT_CONFIGURED", message: "Architectural evaluation is not configured on this server (GEMINI_API_KEY missing). No score was produced." } } };
  }
  try {
    const evaluation = await evaluatePlanArchitecturally(deps.gemini, {
      buildingSummary,
      requirementsSummary,
      ...typeof record3.imageBase64 === "string" ? { imageBase64: record3.imageBase64 } : {},
      ...typeof record3.imageMimeType === "string" ? { imageMimeType: record3.imageMimeType } : {}
    });
    return { status: 200, json: { evaluation } };
  } catch (error) {
    return { status: 502, json: { error: { code: "ARCHITECTURAL_EVALUATION_FAILED", message: error instanceof Error ? error.message : "Evaluation failed." } } };
  }
}

// src/env.ts
var import_path = __toESM(require("path"), 1);
init_dist4();
function cloudflareConfigured(config) {
  return config.cloudflareAccountId.length > 0 && config.cloudflareApiToken.length > 0;
}
function imageProviderConfigured(config) {
  if (config.imageProviderKind === "local-stub") return true;
  if (config.imageProviderKind === "gemini") return (config.geminiApiKey ?? "").length > 0;
  if (config.imageProviderKind === "pollinations") return (config.pollinationsApiKey ?? "").length > 0;
  return cloudflareConfigured(config);
}
function resolveImageProviderKind(env) {
  const kind = (env.IMAGE_GENERATION_PROVIDER ?? env.IMAGE_PROVIDER ?? "cloudflare").trim().toLowerCase();
  if (kind === "local-stub") return "local-stub";
  if (kind === "gemini") return "gemini";
  if (kind === "pollinations") return "pollinations";
  return "cloudflare";
}
function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function resolveImageServiceConfig(env = process.env) {
  const interpreterKind = (env.IMAGE_INTERPRETER ?? "gemini").trim().toLowerCase();
  const primaryModel = (env.GEMINI_MODEL ?? "").trim() || "gemini-2.5-flash";
  const defaultFallback = primaryModel === "gemini-2.0-flash" ? "gemini-2.5-flash" : "gemini-2.0-flash";
  const fallbackModel = (env.GEMINI_FALLBACK_MODEL ?? "").trim() || defaultFallback;
  return {
    cloudflareAccountId: (env.CLOUDFLARE_ACCOUNT_ID ?? "").trim(),
    cloudflareApiToken: (env.CLOUDFLARE_API_TOKEN ?? "").trim(),
    fluxModel: (env.CLOUDFLARE_IMAGE_MODEL ?? env.CLOUDFLARE_FLUX_MODEL ?? "").trim() || DEFAULT_FLUX_MODEL,
    fluxSteps: positiveInt(env.CLOUDFLARE_FLUX_STEPS, 4),
    providerTimeoutMs: positiveInt(env.CLOUDFLARE_FLUX_TIMEOUT_MS, 6e4),
    imageProviderKind: resolveImageProviderKind(env),
    pollinationsApiKey: (env.POLLINATIONS_API_KEY ?? "").trim(),
    pollinationsImageModel: (env.POLLINATIONS_IMAGE_MODEL ?? "").trim() || DEFAULT_POLLINATIONS_IMAGE_MODEL,
    pollinationsBaseUrl: (env.POLLINATIONS_BASE_URL ?? "").trim() || POLLINATIONS_BASE_URL,
    pollinationsTimeoutMs: positiveInt(env.POLLINATIONS_TIMEOUT_MS, 18e4),
    geminiImageModel: (env.GEMINI_IMAGE_MODEL ?? "").trim() || DEFAULT_GEMINI_IMAGE_MODEL,
    geminiImageSize: (env.GEMINI_IMAGE_SIZE ?? "").trim() || DEFAULT_GEMINI_IMAGE_SIZE,
    imageInterpreterKind: interpreterKind === "local-stub" ? "local-stub" : "gemini",
    geminiApiKey: (env.GEMINI_API_KEY ?? "").trim(),
    geminiModel: primaryModel,
    geminiFallbackModel: fallbackModel,
    port: positiveInt(env.PORT, 4200),
    artifactDir: (env.IMAGE_ARTIFACT_DIR ?? "").trim() || import_path.default.join(process.cwd(), "data", "image-artifacts"),
    deterministicCadFirst: (env.DETERMINISTIC_CAD_FIRST ?? "true").trim().toLowerCase() !== "false" && (env.DETERMINISTIC_CAD_FIRST ?? "true").trim() !== "0"
  };
}

// src/services/image-artifact-store.ts
var import_node_crypto3 = require("node:crypto");
var import_promises = require("node:fs/promises");
var import_path2 = __toESM(require("path"), 1);
var ImageArtifactImmutabilityError = class _ImageArtifactImmutabilityError extends Error {
  constructor(generationId) {
    super(`Image artifact ${generationId} already exists and can never be overwritten.`);
    this.name = "ImageArtifactImmutabilityError";
    Object.setPrototypeOf(this, _ImageArtifactImmutabilityError.prototype);
  }
};
var ImageArtifactStore = class {
  baseDir;
  constructor(baseDir) {
    this.baseDir = baseDir;
  }
  /** New unique generation id per attempt; regeneration never reuses one. */
  newGenerationId(seed2) {
    return `gen_${seed2}_${Date.now().toString(36)}_${(0, import_node_crypto3.randomUUID)().slice(0, 8)}`;
  }
  metadataPath(generationId) {
    return import_path2.default.join(this.baseDir, `${generationId}.json`);
  }
  imagePath(generationId, extension) {
    return import_path2.default.join(this.baseDir, `${generationId}.${extension}`);
  }
  async save(projectId, image, request) {
    await (0, import_promises.mkdir)(this.baseDir, { recursive: true });
    const generationId = this.newGenerationId(image.seed);
    const metadataPath = this.metadataPath(generationId);
    try {
      await (0, import_promises.access)(metadataPath);
      throw new ImageArtifactImmutabilityError(generationId);
    } catch (error) {
      if (error instanceof ImageArtifactImmutabilityError) throw error;
    }
    const extension = image.mimeType === "image/jpeg" ? "jpg" : "png";
    const artifact = {
      generationId,
      projectId,
      seed: image.seed,
      model: image.model,
      provider: image.provider,
      promptVersion: request.promptVersion,
      originalPrompt: image.prompt,
      negativePrompt: request.negativePrompt,
      width: request.width,
      height: request.height,
      mimeType: image.mimeType,
      generatedAt: image.generatedAt,
      latencyMs: image.latencyMs,
      ...image.providerRequest ? { providerRequest: image.providerRequest } : {},
      imageBase64: image.imageBase64
    };
    const { imageBase64, ...metadata } = artifact;
    await (0, import_promises.writeFile)(metadataPath, JSON.stringify(metadata, null, 2), "utf8");
    await (0, import_promises.writeFile)(this.imagePath(generationId, extension), Buffer.from(imageBase64, "base64"));
    return artifact;
  }
  async get(generationId) {
    let raw;
    try {
      raw = await (0, import_promises.readFile)(this.metadataPath(generationId), "utf8");
    } catch {
      return null;
    }
    const metadata = JSON.parse(raw);
    const extension = metadata.mimeType === "image/jpeg" ? "jpg" : "png";
    const imageBytes = await (0, import_promises.readFile)(this.imagePath(generationId, extension));
    return { ...metadata, imageBase64: imageBytes.toString("base64") };
  }
  async listByProject(projectId) {
    let entries;
    try {
      entries = await (0, import_promises.readdir)(this.baseDir);
    } catch {
      return [];
    }
    const matches = entries.filter((name) => name.endsWith(".json")).map(async (name) => {
      try {
        const raw = await (0, import_promises.readFile)(import_path2.default.join(this.baseDir, name), "utf8");
        return JSON.parse(raw);
      } catch {
        return null;
      }
    });
    return (await Promise.all(matches)).filter((item) => item !== null).filter((item) => item.projectId === projectId).sort((a, b) => b.generatedAt > a.generatedAt ? 1 : -1);
  }
};

// src/services/local-stub-image-provider.ts
var import_node_zlib3 = require("node:zlib");
var CRC_TABLE2 = (() => {
  const table2 = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 3988292384 ^ value >>> 1 : value >>> 1;
    table2[index] = value >>> 0;
  }
  return table2;
})();
function crc323(bytes) {
  let crc = 4294967295;
  for (const byte of bytes) crc = CRC_TABLE2[(crc ^ byte) & 255] ^ crc >>> 8;
  return (crc ^ 4294967295) >>> 0;
}
function chunk(type, data) {
  const typeBytes = new TextEncoder().encode(type);
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const out = new Uint8Array(4 + body.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(body, 4);
  view.setUint32(4 + body.length, crc323(body));
  return out;
}
function lcg(seed2) {
  let state = (seed2 % 2147483647 + 2147483647) % 2147483647 || 1;
  return () => {
    state = state * 48271 % 2147483647;
    return state / 2147483647;
  };
}
function renderSchematicPng(request) {
  const width = Math.max(64, Math.min(2048, Math.round(request.width)));
  const height = Math.max(64, Math.min(2048, Math.round(request.height)));
  const pixels = new Uint8Array(width * height * 3).fill(255);
  const random = lcg(request.seed);
  const setPixel = (x, y, value) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const offset = (y * width + x) * 3;
    pixels[offset] = value;
    pixels[offset + 1] = value;
    pixels[offset + 2] = value;
  };
  const rect = (x0, y0, x1, y1, thickness) => {
    for (let t = 0; t < thickness; t += 1) {
      for (let x = x0; x <= x1; x += 1) {
        setPixel(x, y0 + t, 0);
        setPixel(x, y1 - t, 0);
      }
      for (let y = y0; y <= y1; y += 1) {
        setPixel(x0 + t, y, 0);
        setPixel(x1 - t, y, 0);
      }
    }
  };
  const margin = Math.round(Math.min(width, height) * 0.08);
  const scale = Math.max(1, Math.round(Math.min(width, height) / 512));
  rect(margin, margin, width - margin, height - margin, scale * 2);
  const inset = Math.round(Math.min(width, height) * 0.12);
  const bx0 = margin + inset;
  const by0 = margin + inset;
  const bx1 = width - margin - inset;
  const by1 = height - margin - inset;
  rect(bx0, by0, bx1, by1, scale);
  const columns = 2 + Math.floor(random() * 3);
  const rows = 2 + Math.floor(random() * 3);
  const cellWidth = (bx1 - bx0) / columns;
  const cellHeight = (by1 - by0) / rows;
  for (let column = 1; column < columns; column += 1) {
    const jitter = Math.round((random() - 0.5) * cellWidth * 0.4);
    const x = Math.min(bx1 - 1, Math.max(bx0 + 1, Math.round(bx0 + column * cellWidth + jitter)));
    for (let y = by0; y <= by1; y += 1) for (let t = 0; t < scale; t += 1) setPixel(x + t, y, 0);
  }
  for (let row = 1; row < rows; row += 1) {
    const jitter = Math.round((random() - 0.5) * cellHeight * 0.4);
    const y = Math.min(by1 - 1, Math.max(by0 + 1, Math.round(by0 + row * cellHeight + jitter)));
    for (let x = bx0; x <= bx1; x += 1) for (let t = 0; t < scale; t += 1) setPixel(x, y + t, 0);
  }
  const raw = new Uint8Array((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 3 + 1);
    raw[rowStart] = 0;
    raw.set(pixels.subarray(y * width * 3, (y + 1) * width * 3), rowStart + 1);
  }
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.from(chunk("IHDR", ihdr)),
    Buffer.from(chunk("IDAT", new Uint8Array((0, import_node_zlib3.deflateSync)(Buffer.from(raw))))),
    Buffer.from(chunk("IEND", new Uint8Array(0)))
  ]);
}
var LocalStubImageProvider = class {
  name = "local-stub";
  async isAvailable() {
    return true;
  }
  async generateFloorPlan(request) {
    const startedAt = Date.now();
    const png = renderSchematicPng(request);
    return {
      imageBase64: png.toString("base64"),
      mimeType: "image/png",
      provider: this.name,
      model: "schematic-stub",
      seed: request.seed,
      promptVersion: request.promptVersion,
      prompt: request.prompt,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs: Date.now() - startedAt
    };
  }
};

// src/server.ts
if (typeof process.loadEnvFile === "function") {
  for (const candidate of [
    ".env",
    import_node_path2.default.join(process.cwd(), ".env"),
    import_node_path2.default.join(process.cwd(), "packages", "backend", ".env")
  ]) {
    try {
      if (import_node_fs2.default.existsSync(candidate)) {
        process.loadEnvFile(candidate);
        break;
      }
    } catch {
    }
  }
}
var MAX_BODY_BYTES = 2e6;
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
function createImageProvider(config) {
  if (config.imageProviderKind === "local-stub") return new LocalStubImageProvider();
  if (!imageProviderConfigured(config)) return null;
  if (config.imageProviderKind === "gemini") {
    return new GeminiImageProvider({
      apiKey: config.geminiApiKey,
      model: config.geminiImageModel,
      imageSize: config.geminiImageSize,
      timeoutMs: config.providerTimeoutMs
    });
  }
  if (config.imageProviderKind === "pollinations") {
    return new PollinationsImageProvider({
      apiKey: config.pollinationsApiKey,
      model: config.pollinationsImageModel,
      baseUrl: config.pollinationsBaseUrl,
      timeoutMs: config.pollinationsTimeoutMs
    });
  }
  return new CloudflareImageProvider({
    accountId: config.cloudflareAccountId,
    apiToken: config.cloudflareApiToken,
    model: config.fluxModel,
    steps: config.fluxSteps,
    timeoutMs: config.providerTimeoutMs
  });
}
function createGeminiProvider(config) {
  if (config.geminiApiKey.length === 0) return null;
  return new GeminiProvider({
    apiKey: config.geminiApiKey,
    model: config.geminiModel,
    fallbackModel: config.geminiFallbackModel,
    timeoutMs: config.providerTimeoutMs
  });
}
async function checkProviderHealth(config, deps) {
  const isCloudflare = deps.provider && (deps.provider.name === "cloudflare-workers-ai" || deps.provider.name === "cloudflare");
  const isPollinations = deps.provider ? deps.provider.name === POLLINATIONS_PROVIDER_NAME : config.imageProviderKind === "pollinations";
  let cfStatus;
  let imageGeneration = null;
  if (isPollinations) {
    const model = deps.provider instanceof PollinationsImageProvider ? deps.provider.getModel() : config.pollinationsImageModel;
    if (!(deps.provider instanceof PollinationsImageProvider)) {
      imageGeneration = { provider: POLLINATIONS_PROVIDER_NAME, configured: false, reachable: false, status: "NOT_CONFIGURED", model, detail: "POLLINATIONS_API_KEY is not configured" };
    } else {
      const access2 = await deps.provider.checkAccess();
      imageGeneration = {
        provider: POLLINATIONS_PROVIDER_NAME,
        configured: true,
        reachable: access2.reachable,
        status: access2.status,
        model,
        ...access2.detail ? { detail: access2.detail } : {},
        ...access2.capabilities ? { capabilities: { acceptsImageInput: access2.capabilities.acceptsImageInput, maxReferenceImages: access2.capabilities.maxReferenceImages, source: access2.capabilities.source } } : {}
      };
    }
    cfStatus = {
      configured: cloudflareConfigured(config),
      reachable: false,
      status: "INACTIVE",
      model: config.fluxModel,
      detail: `Active image provider: ${POLLINATIONS_PROVIDER_NAME} (${model})`
    };
  } else if (config.imageProviderKind === "local-stub" || deps.provider instanceof LocalStubImageProvider || deps.provider && !isCloudflare) {
    cfStatus = {
      configured: true,
      reachable: true,
      status: "REACHABLE",
      model: deps.provider?.name ?? "local-stub",
      detail: "Local or stub provider active"
    };
  } else if (!cloudflareConfigured(config) || !deps.provider) {
    cfStatus = {
      configured: false,
      reachable: false,
      status: "NOT_CONFIGURED",
      model: config.fluxModel,
      detail: "CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN is not configured"
    };
  } else {
    try {
      const res = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: { Authorization: `Bearer ${config.cloudflareApiToken}` },
        signal: AbortSignal.timeout(5e3)
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          cfStatus = {
            configured: true,
            reachable: false,
            status: "AUTH_FAILED",
            model: config.fluxModel,
            detail: `Cloudflare token is invalid or unauthorized (HTTP ${res.status})`
          };
        } else if (res.status === 429) {
          cfStatus = {
            configured: true,
            reachable: false,
            status: "RATE_LIMITED",
            model: config.fluxModel,
            detail: "Cloudflare rate limit exceeded (HTTP 429)"
          };
        } else {
          cfStatus = {
            configured: true,
            reachable: false,
            status: "NETWORK_ERROR",
            model: config.fluxModel,
            detail: `HTTP ${res.status}`
          };
        }
      } else {
        const body = await res.json().catch(() => ({}));
        if (!body.success) {
          cfStatus = {
            configured: true,
            reachable: false,
            status: "AUTH_FAILED",
            model: config.fluxModel,
            detail: "Cloudflare token verification returned unsuccessful"
          };
        } else {
          try {
            const modelRes = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(config.cloudflareAccountId)}/ai/models/search?search=${encodeURIComponent(config.fluxModel)}`,
              {
                headers: { Authorization: `Bearer ${config.cloudflareApiToken}` },
                signal: AbortSignal.timeout(5e3)
              }
            );
            if (modelRes.ok) {
              const modelData = await modelRes.json().catch(() => ({}));
              const models = modelData.result ?? [];
              const found = models.some((m) => m.name === config.fluxModel);
              if (found || models.length > 0) {
                cfStatus = {
                  configured: true,
                  reachable: true,
                  status: "REACHABLE",
                  model: config.fluxModel
                };
              } else {
                cfStatus = {
                  configured: true,
                  reachable: false,
                  status: "MODEL_UNAVAILABLE",
                  model: config.fluxModel,
                  detail: `Model ${config.fluxModel} not available on account`
                };
              }
            } else if (modelRes.status === 401 || modelRes.status === 403) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: "AUTH_FAILED",
                model: config.fluxModel,
                detail: `Token not authorized for account ${config.cloudflareAccountId} (HTTP ${modelRes.status})`
              };
            } else if (modelRes.status === 404) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: "MODEL_UNAVAILABLE",
                model: config.fluxModel,
                detail: `Model or account endpoint not found (HTTP 404)`
              };
            } else if (modelRes.status === 429) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: "RATE_LIMITED",
                model: config.fluxModel,
                detail: "Cloudflare rate limit on model endpoint"
              };
            } else {
              cfStatus = {
                configured: true,
                reachable: false,
                status: "NETWORK_ERROR",
                model: config.fluxModel,
                detail: `HTTP ${modelRes.status}`
              };
            }
          } catch (modelErr) {
            if (modelErr instanceof Error && (modelErr.name === "AbortError" || modelErr.name === "TimeoutError")) {
              cfStatus = {
                configured: true,
                reachable: false,
                status: "TIMEOUT",
                model: config.fluxModel,
                detail: "Model availability request timed out"
              };
            } else {
              cfStatus = {
                configured: true,
                reachable: false,
                status: "NETWORK_ERROR",
                model: config.fluxModel,
                detail: modelErr instanceof Error ? modelErr.message : "Network error checking model"
              };
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
        cfStatus = {
          configured: true,
          reachable: false,
          status: "TIMEOUT",
          model: config.fluxModel,
          detail: "Cloudflare token verify timed out"
        };
      } else {
        cfStatus = {
          configured: true,
          reachable: false,
          status: "NETWORK_ERROR",
          model: config.fluxModel,
          detail: err instanceof Error ? err.message : "Network unreachable"
        };
      }
    }
  }
  let geminiStatus;
  if (deps.interpreterKind === "local-stub") {
    geminiStatus = {
      configured: true,
      reachable: true,
      status: "REACHABLE",
      model: "local-stub",
      detail: "Local development stub interpreter active"
    };
  } else if (!config.geminiApiKey || !deps.gemini) {
    geminiStatus = {
      configured: false,
      reachable: false,
      status: "NOT_CONFIGURED",
      model: config.geminiModel,
      detail: "GEMINI_API_KEY is not configured"
    };
  } else {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.geminiModel)}?key=${encodeURIComponent(config.geminiApiKey)}`,
        { signal: AbortSignal.timeout(5e3) }
      );
      if (res.ok) {
        geminiStatus = {
          configured: true,
          reachable: true,
          status: "REACHABLE",
          model: config.geminiModel
        };
      } else if (res.status === 401 || res.status === 403) {
        geminiStatus = {
          configured: true,
          reachable: false,
          status: "AUTH_FAILED",
          model: config.geminiModel,
          detail: `Gemini API key is invalid or unauthorized (HTTP ${res.status})`
        };
      } else if (res.status === 429) {
        const bodyText = await res.text().catch(() => "");
        const isQuota = /quota|exhausted/i.test(bodyText);
        geminiStatus = {
          configured: true,
          reachable: false,
          status: isQuota ? "QUOTA_EXCEEDED" : "RATE_LIMITED",
          model: config.geminiModel,
          detail: `Gemini rate limit or quota exceeded (HTTP ${res.status})`
        };
      } else if (res.status === 503 || res.status === 504) {
        geminiStatus = {
          configured: true,
          reachable: false,
          status: "TEMPORARILY_UNAVAILABLE",
          model: config.geminiModel,
          detail: `Gemini service is temporarily unavailable / experiencing high demand (HTTP ${res.status})`
        };
      } else if (res.status === 404) {
        geminiStatus = {
          configured: true,
          reachable: false,
          status: "MODEL_UNAVAILABLE",
          model: config.geminiModel,
          detail: `Model ${config.geminiModel} not found or retired`
        };
      } else {
        geminiStatus = {
          configured: true,
          reachable: false,
          status: "REQUEST_ERROR",
          model: config.geminiModel,
          detail: `HTTP ${res.status}`
        };
      }
    } catch (err) {
      if (err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError")) {
        geminiStatus = {
          configured: true,
          reachable: false,
          status: "TIMEOUT",
          model: config.geminiModel,
          detail: "Gemini health check timed out"
        };
      } else {
        geminiStatus = {
          configured: true,
          reachable: false,
          status: "NETWORK_ERROR",
          model: config.geminiModel,
          detail: err instanceof Error ? err.message : "Network timeout or unreachable"
        };
      }
    }
  }
  const activeImage = imageGeneration ?? {
    provider: deps.provider?.name ?? "cloudflare-workers-ai",
    ...cfStatus
  };
  return {
    status: activeImage.reachable && geminiStatus.reachable ? "ok" : "degraded",
    imageProvider: deps.provider ? "configured" : "not_configured",
    imageGeneration: activeImage,
    cloudflare: cfStatus,
    gemini: geminiStatus
  };
}
var GENERATION_REQUEST_TIMEOUT_MS = 15 * 60 * 1e3;
function createBackendServer(deps) {
  const server = (0, import_node_http.createServer)((request, response2) => {
    void route(request, response2, deps);
  });
  server.requestTimeout = GENERATION_REQUEST_TIMEOUT_MS;
  return server;
}
function sendJson(response2, status, json) {
  response2.writeHead(status, { "Content-Type": "application/json", ...CORS_HEADERS });
  response2.end(JSON.stringify(json));
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on("data", (chunk2) => {
      size += chunk2.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk2);
    });
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}
async function route(request, response2, deps) {
  const url = new URL(request.url ?? "/", "http://localhost");
  const method = request.method ?? "GET";
  if (method === "OPTIONS") {
    response2.writeHead(204, CORS_HEADERS);
    response2.end();
    return;
  }
  try {
    if (method === "GET" && url.pathname === "/api/v1/health") {
      const config = deps.config ?? resolveImageServiceConfig();
      const health = await checkProviderHealth(config, deps);
      sendJson(response2, 200, health);
      return;
    }
    if (method === "POST" && (url.pathname === "/api/v1/generation/run" || url.pathname === "/api/generation/run")) {
      const raw = await readBody(request);
      let body = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        sendJson(response2, 400, { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
        return;
      }
      const { GenerationOrchestrator: GenerationOrchestrator2 } = await Promise.resolve().then(() => (init_generation_orchestrator(), generation_orchestrator_exports));
      const orchestrator = new GenerationOrchestrator2({
        provider: deps.provider,
        store: deps.store,
        gemini: deps.gemini,
        interpreterKind: deps.interpreterKind,
        deterministicCadFirst: deps.config?.deterministicCadFirst ?? true
      });
      const result = await orchestrator.run(body);
      sendJson(response2, 200, result);
      return;
    }
    if (method === "POST" && (url.pathname === "/api/v1/generation/resume" || url.pathname === "/api/generation/resume")) {
      const raw = await readBody(request);
      let body = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        sendJson(response2, 400, { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
        return;
      }
      const { GenerationOrchestrator: GenerationOrchestrator2 } = await Promise.resolve().then(() => (init_generation_orchestrator(), generation_orchestrator_exports));
      const orchestrator = new GenerationOrchestrator2({
        provider: deps.provider,
        store: deps.store,
        gemini: deps.gemini,
        interpreterKind: deps.interpreterKind,
        deterministicCadFirst: deps.config?.deterministicCadFirst ?? true
      });
      const result = await orchestrator.resumeFromArtifact(body);
      sendJson(response2, 200, result);
      return;
    }
    if (method === "POST" && url.pathname === "/api/v1/image/floor-plan") {
      const raw = await readBody(request);
      let body = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        sendJson(response2, 400, { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
        return;
      }
      const result = await handleFloorPlanGeneration(body, deps);
      sendJson(response2, result.status, result.json);
      return;
    }
    if (method === "POST" && url.pathname === "/api/v1/image/interpret") {
      const raw = await readBody(request);
      let body = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        sendJson(response2, 400, { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
        return;
      }
      const result = await handleImageInterpretation(body, deps);
      sendJson(response2, result.status, result.json);
      return;
    }
    if (method === "POST" && url.pathname === "/api/v1/architecture/evaluate") {
      const raw = await readBody(request);
      let body = null;
      try {
        body = raw.length > 0 ? JSON.parse(raw) : null;
      } catch {
        sendJson(response2, 400, { error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } });
        return;
      }
      const result = await handleArchitecturalEvaluation(body, deps);
      sendJson(response2, result.status, result.json);
      return;
    }
    const artifactMatch = url.pathname.match(/^\/api\/v1\/image\/artifacts\/([^/]+)$/);
    if (method === "GET" && artifactMatch) {
      const result = await handleArtifactGet(decodeURIComponent(artifactMatch[1]), deps.store);
      sendJson(response2, result.status, result.json);
      return;
    }
    if (method === "GET" && url.pathname === "/api/v1/image/artifacts") {
      const projectId = url.searchParams.get("projectId") ?? "";
      if (!projectId) {
        sendJson(response2, 400, { error: { code: "INVALID_REQUEST", message: "projectId query parameter is required." } });
        return;
      }
      sendJson(response2, 200, { artifacts: await deps.store.listByProject(projectId) });
      return;
    }
    sendJson(response2, 404, { error: { code: "NOT_FOUND", message: "Unknown endpoint." } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    sendJson(response2, message.includes("too large") ? 413 : 500, { error: { code: "SERVER_ERROR", message } });
  }
}
function startBackendServer(port) {
  const config = resolveImageServiceConfig();
  const gemini = createGeminiProvider(config);
  const deps = {
    provider: createImageProvider(config),
    store: new ImageArtifactStore(config.artifactDir),
    gemini,
    interpreterKind: config.imageInterpreterKind,
    config
  };
  const server = createBackendServer(deps);
  server.listen(port ?? config.port, () => {
    console.log(`AI floor-planner backend listening on port ${port ?? config.port}`);
    const providerModel = config.imageProviderKind === "pollinations" ? config.pollinationsImageModel : config.imageProviderKind === "cloudflare" ? config.fluxModel : "local-stub";
    const missing = config.imageProviderKind === "pollinations" ? "POLLINATIONS_API_KEY" : "CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN";
    console.log(`Image provider: ${deps.provider ? `${deps.provider.name} configured (model ${providerModel})` : `${config.imageProviderKind} NOT CONFIGURED (set ${missing})`}`);
    console.log(`Image interpreter: ${deps.interpreterKind === "gemini" ? gemini ? "gemini configured" : "gemini NOT CONFIGURED (set GEMINI_API_KEY)" : "local-stub (dev)"}`);
    console.log(`Image artifact store: ${config.artifactDir}`);
  });
  return { server, config };
}
function isDirectRun() {
  const entry = (process.argv[1] ?? "").replace(/\\/g, "/");
  return entry.endsWith("server.cjs") || entry.endsWith("server.js");
}
if (isDirectRun()) {
  startBackendServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GENERATION_REQUEST_TIMEOUT_MS,
  checkProviderHealth,
  createBackendServer,
  createGeminiProvider,
  createImageProvider,
  startBackendServer
});
