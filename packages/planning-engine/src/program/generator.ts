/**
 * Room Program Generator.
 *
 * Converts a validated DesignRequirementSpecification into a concrete,
 * architecturally balanced RoomProgram specifying areas, dimensions,
 * daylight requirements, and functional zones.
 */

import type {
  DesignRequirementSpecification,
  RoomProgram,
  RoomProgramItem,
} from '@ai-floor-planner/core';
import {
  RoomType,
  FunctionalZone,
  DaylightLevel,
  PrivacyLevel,
} from '@ai-floor-planner/core';

export class RoomProgramGenerator {
  /**
   * Generate architectural room program from requirements.
   */
  generateProgram(spec: DesignRequirementSpecification): RoomProgram {
    const items: RoomProgramItem[] = [];
    const { hard, soft } = spec;

    let totalTargetArea = 0;
    let totalMinArea = 0;
    let totalMaxArea = 0;

    const addItem = (item: Omit<RoomProgramItem, 'id'>) => {
      const fullItem: RoomProgramItem = {
        id: `prog_item_${items.length + 1}`,
        ...item,
      };
      items.push(fullItem);
      totalTargetArea += fullItem.targetAreaMm2;
      totalMinArea += fullItem.minAreaMm2;
      totalMaxArea += fullItem.maxAreaMm2;
    };

    // 1. Living Room (Public Zone)
    if (hard.livingRoomRequired) {
      addItem({
        type: RoomType.Living,
        name: 'Living Room',
        zone: FunctionalZone.Public,
        floorLevel: 0,
        targetAreaMm2: 18_000_000,   // ~18.0 sq m (4.5m x 4.0m)
        minAreaMm2: 12_000_000,
        maxAreaMm2: 26_000_000,
        minWidthMm: 3200,
        minHeightMm: 3600,
        daylight: DaylightLevel.High,
        privacy: PrivacyLevel.None,
        ventilationRequired: true,
      });
    }

    // 2. Dining Room (Semi-Public Zone)
    if (hard.diningRoomRequired) {
      addItem({
        type: RoomType.Dining,
        name: 'Dining Hall',
        zone: FunctionalZone.SemiPublic,
        floorLevel: 0,
        targetAreaMm2: 12_000_000,   // ~12.0 sq m (3.8m x 3.2m)
        minAreaMm2: 8_000_000,
        maxAreaMm2: 18_000_000,
        minWidthMm: 2800,
        minHeightMm: 3000,
        daylight: DaylightLevel.Medium,
        privacy: PrivacyLevel.Low,
        ventilationRequired: true,
      });
    }

    // 3. Kitchen (Service Zone)
    if (hard.kitchenRequired) {
      addItem({
        type: RoomType.Kitchen,
        name: 'Kitchen',
        zone: FunctionalZone.Service,
        floorLevel: 0,
        targetAreaMm2: 9_000_000,    // ~9.0 sq m (3.0m x 3.0m)
        minAreaMm2: 5_500_000,
        maxAreaMm2: 14_000_000,
        minWidthMm: 2400,
        minHeightMm: 2400,
        daylight: DaylightLevel.Medium,
        privacy: PrivacyLevel.Low,
        ventilationRequired: true,
      });
    }

    // 4. Master Bedroom (Private Zone)
    if (hard.bedroomCount >= 1) {
      addItem({
        type: RoomType.Bedroom,
        name: 'Master Bedroom',
        zone: FunctionalZone.Private,
        floorLevel: 0,
        targetAreaMm2: 16_000_000,   // ~16.0 sq m (4.0m x 4.0m)
        minAreaMm2: 12_000_000,
        maxAreaMm2: 24_000_000,
        minWidthMm: 3400,
        minHeightMm: 3600,
        daylight: DaylightLevel.High,
        privacy: PrivacyLevel.High,
        ventilationRequired: true,
      });
    }

    // 5. Additional Bedrooms
    for (let i = 2; i <= hard.bedroomCount; i++) {
      addItem({
        type: RoomType.Bedroom,
        name: `Bedroom ${i}`,
        zone: FunctionalZone.Private,
        floorLevel: 0,
        targetAreaMm2: 13_000_000,   // ~13.0 sq m (3.6m x 3.6m)
        minAreaMm2: 9_500_000,
        maxAreaMm2: 18_000_000,
        minWidthMm: 3000,
        minHeightMm: 3200,
        daylight: DaylightLevel.High,
        privacy: PrivacyLevel.Medium,
        ventilationRequired: true,
      });
    }

    // 6. Bathrooms
    const attachedCount = Math.min(soft.attachedBathroomsCount, hard.bathroomCount);
    const bedroomItems = items.filter(item => item.type === RoomType.Bedroom);
    for (let b = 1; b <= hard.bathroomCount; b++) {
      const isAttached = b <= attachedCount;
      addItem({
        type: RoomType.Bathroom,
        name: isAttached ? `Attached Bath ${b}` : `Common Bath ${b}`,
        zone: FunctionalZone.Service,
        floorLevel: 0,
        targetAreaMm2: 4_500_000,    // ~4.5 sq m (2.2m x 2.0m)
        minAreaMm2: 2_500_000,
        maxAreaMm2: 7_000_000,
        minWidthMm: 1500,
        minHeightMm: 1800,
        daylight: DaylightLevel.Low,
        privacy: PrivacyLevel.High,
        ventilationRequired: true,
        attachedToRoomId: isAttached ? bedroomItems[b - 1]?.id : undefined,
      });
    }

    // 7. Staircase (Circulation Zone)
    if (hard.staircaseRequired) {
      addItem({
        type: RoomType.Staircase,
        name: 'Staircase',
        zone: FunctionalZone.Circulation,
        floorLevel: 0,
        targetAreaMm2: 7_500_000,    // ~7.5 sq m (2.4m x 3.1m)
        minAreaMm2: 5_000_000,
        maxAreaMm2: 12_000_000,
        minWidthMm: 2000,
        minHeightMm: 2800,
        daylight: DaylightLevel.Medium,
        privacy: PrivacyLevel.None,
        ventilationRequired: true,
        isFixed: true,
      });
    }

    // 8. Pooja Room (Optional Soft Requirement)
    if (soft.poojaRoom) {
      addItem({
        type: RoomType.Pooja,
        name: 'Pooja Room',
        zone: FunctionalZone.Private,
        floorLevel: 0,
        targetAreaMm2: 3_500_000,
        minAreaMm2: 2_000_000,
        maxAreaMm2: 6_000_000,
        minWidthMm: 1500,
        minHeightMm: 1800,
        daylight: DaylightLevel.Medium,
        privacy: PrivacyLevel.Medium,
        ventilationRequired: false,
      });
    }

    // 9. Study Room (Optional Soft Requirement)
    if (soft.studyRoom) {
      addItem({
        type: RoomType.Study,
        name: 'Study / Home Office',
        zone: FunctionalZone.Private,
        floorLevel: 0,
        targetAreaMm2: 9_000_000,
        minAreaMm2: 6_000_000,
        maxAreaMm2: 14_000_000,
        minWidthMm: 2600,
        minHeightMm: 2800,
        daylight: DaylightLevel.High,
        privacy: PrivacyLevel.High,
        ventilationRequired: true,
      });
    }

    // 10. Lift shaft (vertical circulation)
    if (hard.liftRequired) {
      addItem({
        type: RoomType.Lift,
        name: 'Lift',
        zone: FunctionalZone.Circulation,
        floorLevel: 0,
        targetAreaMm2: 5_000_000,
        minAreaMm2: 4_000_000,
        maxAreaMm2: 7_000_000,
        minWidthMm: 1600,
        minHeightMm: 1600,
        daylight: DaylightLevel.None,
        privacy: PrivacyLevel.None,
        ventilationRequired: false,
        isFixed: true,
      });
    }

    // 11. Exact parking-space instances
    for (let parking = 1; parking <= hard.parkingSpacesCount; parking++) {
      addItem({
        type: RoomType.Parking,
        name: `Car Parking ${parking}`,
        zone: FunctionalZone.Outdoor,
        floorLevel: 0,
        targetAreaMm2: 15_000_000,
        minAreaMm2: 14_000_000,
        maxAreaMm2: 20_000_000,
        minWidthMm: 2500,
        minHeightMm: 5000,
        daylight: DaylightLevel.None,
        privacy: PrivacyLevel.None,
        ventilationRequired: true,
      });
    }

    // 12. Additional requested lifestyle spaces
    if (soft.servantQuarter) {
      addItem({
        type: RoomType.ServantQuarter,
        name: 'Servant Quarter',
        zone: FunctionalZone.Service,
        floorLevel: 0,
        targetAreaMm2: 11_000_000,
        minAreaMm2: 9_500_000,
        maxAreaMm2: 15_000_000,
        minWidthMm: 2800,
        minHeightMm: 3000,
        daylight: DaylightLevel.Medium,
        privacy: PrivacyLevel.High,
        ventilationRequired: true,
      });
    }

    if (soft.balconyPreferred) {
      addItem({
        type: RoomType.Balcony,
        name: 'Balcony',
        zone: FunctionalZone.Outdoor,
        floorLevel: Math.max(0, hard.floorsCount - 1),
        targetAreaMm2: 5_000_000,
        minAreaMm2: 3_000_000,
        maxAreaMm2: 9_000_000,
        minWidthMm: 1200,
        minHeightMm: 2500,
        daylight: DaylightLevel.High,
        privacy: PrivacyLevel.Medium,
        ventilationRequired: true,
      });
    }

    if (soft.gardenPreference) {
      addItem({
        type: RoomType.Garden,
        name: 'Garden / Courtyard',
        zone: FunctionalZone.Outdoor,
        floorLevel: 0,
        targetAreaMm2: 12_000_000,
        minAreaMm2: 8_000_000,
        maxAreaMm2: 30_000_000,
        minWidthMm: 2400,
        minHeightMm: 3000,
        daylight: DaylightLevel.High,
        privacy: PrivacyLevel.Low,
        ventilationRequired: true,
      });
    }

    // 13. Explicit custom-room counts are never silently discarded.
    for (const custom of hard.customRooms ?? []) {
      for (let index = 1; index <= custom.count; index++) {
        addItem({
          type: custom.type,
          name: custom.count > 1
            ? `${custom.name ?? custom.type} ${index}`
            : custom.name ?? custom.type,
          zone: FunctionalZone.SemiPublic,
          floorLevel: 0,
          targetAreaMm2: 8_000_000,
          minAreaMm2: 6_000_000,
          maxAreaMm2: 14_000_000,
          minWidthMm: 2400,
          minHeightMm: 2400,
          daylight: DaylightLevel.Medium,
          privacy: PrivacyLevel.Medium,
          ventilationRequired: true,
        });
      }
    }

    return {
      items,
      totalTargetAreaMm2: totalTargetArea,
      totalMinAreaMm2: totalMinArea,
      totalMaxAreaMm2: totalMaxArea,
    };
  }
}
