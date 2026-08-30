import {
  BUILDING_CAPABILITIES,
  Direction,
  PlotShape,
  PreferenceLevel,
  RoomType,
} from '@ai-floor-planner/core';

/** Provider-facing schema. Every field is explicit so untrusted output cannot
 * silently inherit architectural defaults. */
export const REQUIREMENT_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    schemaVersion: { type: 'integer', enum: [1] },
    projectName: { type: 'string' },
    plotShape: { type: 'string', enum: Object.values(PlotShape) },
    orientationDegrees: { type: 'number', minimum: 0, maximum: 359 },
    hard: {
      type: 'object',
      additionalProperties: false,
      properties: {
        plotWidthMm: { type: 'number', minimum: 3000, maximum: 200000 },
        plotDepthMm: { type: 'number', minimum: 3000, maximum: 200000 },
        roadFacing: { type: 'string', enum: Object.values(Direction) },
        floorsCount: {
          type: 'integer',
          minimum: BUILDING_CAPABILITIES.minimumFloorCount,
          maximum: BUILDING_CAPABILITIES.maximumFloorCount,
        },
        bedroomCount: { type: 'integer', minimum: 1, maximum: 20 },
        bathroomCount: { type: 'integer', minimum: 1, maximum: 20 },
        kitchenRequired: { type: 'boolean' },
        livingRoomRequired: { type: 'boolean' },
        diningRoomRequired: { type: 'boolean' },
        staircaseRequired: { type: 'boolean' },
        parkingRequired: { type: 'boolean' },
        parkingSpacesCount: { type: 'integer', minimum: 0, maximum: 20 },
        liftRequired: { type: 'boolean' },
        customRooms: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              type: { type: 'string', enum: Object.values(RoomType) },
              count: { type: 'integer', minimum: 1, maximum: 20 },
              name: { type: 'string' },
            },
            required: ['type', 'count', 'name'],
          },
        },
      },
      required: [
        'plotWidthMm', 'plotDepthMm', 'roadFacing', 'floorsCount',
        'bedroomCount', 'bathroomCount', 'kitchenRequired',
        'livingRoomRequired', 'diningRoomRequired', 'staircaseRequired',
        'parkingRequired', 'parkingSpacesCount', 'liftRequired', 'customRooms',
      ],
    },
    soft: {
      type: 'object',
      additionalProperties: false,
      properties: {
        vastuCompliance: { type: 'boolean' },
        naturalLightPreference: { type: 'string', enum: Object.values(PreferenceLevel) },
        privacyPreference: { type: 'string', enum: Object.values(PreferenceLevel) },
        circulationEfficiency: { type: 'string', enum: Object.values(PreferenceLevel) },
        gardenPreference: { type: 'boolean' },
        servantQuarter: { type: 'boolean' },
        poojaRoom: { type: 'boolean' },
        studyRoom: { type: 'boolean' },
        balconyPreferred: { type: 'boolean' },
        openKitchen: { type: 'boolean' },
        attachedBathroomsCount: { type: 'integer', minimum: 0, maximum: 20 },
      },
      required: [
        'vastuCompliance', 'naturalLightPreference', 'privacyPreference',
        'circulationEfficiency', 'gardenPreference', 'servantQuarter',
        'poojaRoom', 'studyRoom', 'balconyPreferred', 'openKitchen',
        'attachedBathroomsCount',
      ],
    },
  },
  required: ['schemaVersion', 'projectName', 'plotShape', 'orientationDegrees', 'hard', 'soft'],
} as const;

export const REQUIREMENT_EXTRACTION_PROMPT = `You extract residential building requirements.
Return only the supplied schema. Convert all plot dimensions to millimetres.
Treat stated necessities as hard requirements and lifestyle choices as soft preferences.
Respect explicit negations such as "no parking" or "without Vastu".
Use orientation degrees 0=north, 90=east, 180=south, and 270=west.
Use an empty customRooms array when no additional supported room is requested.
Never invent a site location, regulation, approval, or structural claim.`;
