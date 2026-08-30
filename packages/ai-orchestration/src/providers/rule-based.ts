/**
 * Deterministic Rule-Based Natural Language Requirement Parser.
 *
 * Runs locally with 0 network latency, 0 token costs, and 100% reproducibility.
 * Extracts architectural entities, plot sizes, room counts, and preferences from text.
 */

import type {
  DesignRequirementSpecification,
} from '@ai-floor-planner/core';
import {
  BUILDING_CAPABILITIES,
  Direction,
  PlotShape,
  PreferenceLevel,
  normalizeDesignRequirementSpecification,
} from '@ai-floor-planner/core';

export class RuleBasedRequirementParser {
  /**
   * Parse a natural language prompt into a structured DesignRequirementSpecification.
   */
  parse(text: string): DesignRequirementSpecification {
    const lower = text.toLowerCase();

    // 1. Extract Plot Dimensions (e.g. "30x50", "30 x 50", "40*60", "30ft by 50ft", "9m x 15m")
    let widthMm = 9144;  // Default 30 ft
    let depthMm = 15240; // Default 50 ft

    const dimMatch = lower.match(/(\d+(?:\.\d+)?)\s*(ft|feet|m|meter|meters|mm)?\s*(?:x|\*|by|×)\s*(\d+(?:\.\d+)?)\s*(ft|feet|m|meter|meters|mm)?/);
    if (dimMatch) {
      const val1 = parseFloat(dimMatch[1]!);
      const unit1 = dimMatch[2];
      const val2 = parseFloat(dimMatch[3]!);
      const unit2 = dimMatch[4];
      const unit = (unit1 || unit2 || 'ft').toLowerCase();

      if (unit.startsWith('m') && !unit.startsWith('mm')) {
        widthMm = Math.round(val1 * 1000);
        depthMm = Math.round(val2 * 1000);
      } else if (unit === 'mm') {
        widthMm = Math.round(val1);
        depthMm = Math.round(val2);
      } else {
        // Feet to mm (1 ft = 304.8 mm)
        widthMm = Math.round(val1 * 304.8);
        depthMm = Math.round(val2 * 304.8);
      }
    }

    // 2. Extract Bedroom Count (e.g. "3bhk", "2 bhk", "3 bedrooms", "4 bed")
    let bedroomCount = 2;
    const bhkMatch = lower.match(/(\d+)\s*(?:bhk|bed|bedroom|bedrooms)/);
    if (bhkMatch) {
      bedroomCount = Math.max(0, parseInt(bhkMatch[1]!, 10));
    } else if (lower.includes('1bhk') || lower.includes('1-bhk')) {
      bedroomCount = 1;
    } else if (lower.includes('2bhk') || lower.includes('2-bhk')) {
      bedroomCount = 2;
    } else if (lower.includes('3bhk') || lower.includes('3-bhk')) {
      bedroomCount = 3;
    } else if (lower.includes('4bhk') || lower.includes('4-bhk')) {
      bedroomCount = 4;
    }

    // 3. Extract Bathroom Count (e.g. "2 bathrooms", "3 bath", "2 toilets")
    let bathroomCount = Math.max(1, Math.min(bedroomCount, 2));
    const bathMatch = lower.match(/(\d+)\s*(?:bath|bathroom|bathrooms|toilet|toilets)/);
    if (bathMatch) {
      bathroomCount = Math.max(0, parseInt(bathMatch[1]!, 10));
    }

    // 4. Extract Road Facing / Orientation
    let roadFacing = Direction.North;
    let orientationDegrees = 0;

    if (lower.includes('east road') || lower.includes('facing east') || lower.includes('east facing') || lower.includes('road on east')) {
      roadFacing = Direction.East;
      orientationDegrees = 90;
    } else if (lower.includes('south road') || lower.includes('facing south') || lower.includes('south facing') || lower.includes('road on south')) {
      roadFacing = Direction.South;
      orientationDegrees = 180;
    } else if (lower.includes('west road') || lower.includes('facing west') || lower.includes('west facing') || lower.includes('road on west')) {
      roadFacing = Direction.West;
      orientationDegrees = 270;
    } else {
      roadFacing = Direction.North;
      orientationDegrees = 0;
    }

    // 5. Extract Floors
    let floorsCount = 1;
    const gPlusMatch = lower.match(/\bg\s*\+\s*(\d+)\b/i);
    const numericFloorsMatch = lower.match(/\b(\d+)\s*(?:floors?|storeys?|stories?)\b/i);
    if (gPlusMatch) {
      floorsCount = Math.min(BUILDING_CAPABILITIES.maximumFloorCount, Math.max(1, parseInt(gPlusMatch[1]!, 10) + 1));
    } else if (numericFloorsMatch) {
      floorsCount = Math.min(BUILDING_CAPABILITIES.maximumFloorCount, Math.max(1, parseInt(numericFloorsMatch[1]!, 10)));
    } else if (lower.includes('duplex') || lower.includes('two floors')) {
      floorsCount = 2;
    } else if (lower.includes('three floors')) {
      floorsCount = 3;
    }

    // 6. Amenities & Preferences
    const parkingNegated = /\b(?:no|without)\s+(?:car\s+)?parking\b/.test(lower);
    const parkingRequired = !parkingNegated && (lower.includes('parking') || lower.includes('garage'));
    const parkingCountMatch = lower.match(/(\d+)\s*(?:car|cars|vehicle|vehicles)(?:\s+parking)?/);
    const parkingSpacesCount = parkingRequired
      ? Math.max(1, parkingCountMatch ? parseInt(parkingCountMatch[1]!, 10) : 1)
      : 0;
    const staircaseRequired = floorsCount > 1 || lower.includes('stair') || lower.includes('staircase');
    const liftRequired = /\b(?:lift|elevator)\b/.test(lower) && !/\b(?:no|without)\s+(?:lift|elevator)\b/.test(lower);
    const poojaRoom = /\b(?:pooja|puja|prayer|temple)\b/.test(lower) && !/\b(?:no|without)\s+(?:pooja|puja|prayer|temple)\b/.test(lower);
    const studyRoom = /\b(?:study|office|workspace|home office)\b/.test(lower) && !/\b(?:no|without)\s+(?:study|office|workspace|home office)\b/.test(lower);
    const gardenPreference = /\b(?:garden|lawn|courtyard)\b/.test(lower) && !/\b(?:no|without)\s+(?:garden|lawn|courtyard)\b/.test(lower);
    const vastuCompliance = /\b(?:vastu|vaastu)\b/.test(lower) && !/\b(?:no|without)\s+(?:vastu|vaastu)\b/.test(lower);
    const openKitchen = /\b(?:open kitchen|american kitchen)\b/.test(lower) && !/\b(?:no|without|closed)\s+(?:open\s+)?kitchen\b/.test(lower);
    const servantQuarter = /\b(?:servant|maid)\b/.test(lower) && !/\b(?:no|without)\s+(?:servant|maid)\b/.test(lower);
    const balconyPreferred = /\b(?:balcony|balconies)\b/.test(lower) && !/\b(?:no|without)\s+(?:balcony|balconies)\b/.test(lower);
    const attachedBathMatch = lower.match(/(\d+)\s*attached\s*(?:bath|bathroom|bathrooms|toilet|toilets)/);
    const attachedBathroomsCount = attachedBathMatch
      ? Math.max(0, parseInt(attachedBathMatch[1]!, 10))
      : Math.min(1, bathroomCount);

    return normalizeDesignRequirementSpecification({
      schemaVersion: 1,
      projectName: `${bedroomCount}BHK Plan (${Math.round(widthMm / 304.8)}×${Math.round(depthMm / 304.8)} ft)`,
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
        liftRequired,
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
        attachedBathroomsCount,
      },
    });
  }
}
