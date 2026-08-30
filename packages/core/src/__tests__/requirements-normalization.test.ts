import { describe, expect, it } from 'vitest';
import {
  Direction,
  PlotShape,
  PreferenceLevel,
  RoomType,
  normalizeDesignRequirementSpecification,
} from '../index';

describe('canonical requirement normalization', () => {
  it('preserves the complete supported requirement set', () => {
    const spec = normalizeDesignRequirementSpecification({
      projectId: 'project-1',
      projectName: 'Complex residence',
      rawUserPrompt: 'G+1 4BHK with two-car parking, lift, pooja and study',
      plotShape: PlotShape.Rectangular,
      orientationDegrees: 90,
      setbacksMm: { front: 1500, rear: 1000, left: 900, right: 900 },
      siteContext: { location: 'Bengaluru', jurisdiction: 'BBMP' },
      hard: {
        plotWidthMm: 12192,
        plotDepthMm: 18288,
        roadFacing: Direction.East,
        floorsCount: 2,
        bedroomCount: 4,
        bathroomCount: 3,
        kitchenRequired: true,
        livingRoomRequired: true,
        diningRoomRequired: true,
        staircaseRequired: true,
        parkingRequired: true,
        parkingSpacesCount: 2,
        liftRequired: true,
        customRooms: [{ type: RoomType.Utility, count: 2, name: 'Laundry' }],
      },
      soft: {
        vastuCompliance: true,
        naturalLightPreference: PreferenceLevel.High,
        privacyPreference: PreferenceLevel.Medium,
        circulationEfficiency: PreferenceLevel.High,
        gardenPreference: true,
        servantQuarter: true,
        poojaRoom: true,
        studyRoom: true,
        balconyPreferred: true,
        openKitchen: true,
        attachedBathroomsCount: 2,
      },
    });

    expect(spec.schemaVersion).toBe(1);
    expect(spec.hard.floorsCount).toBe(2);
    expect(spec.hard.parkingSpacesCount).toBe(2);
    expect(spec.hard.liftRequired).toBe(true);
    expect(spec.hard.customRooms).toEqual([{ type: RoomType.Utility, count: 2, name: 'Laundry' }]);
    expect(spec.soft.poojaRoom).toBe(true);
    expect(spec.soft.studyRoom).toBe(true);
    expect(spec.siteContext).toEqual({ location: 'Bengaluru', jurisdiction: 'BBMP' });
  });

  it('enforces canonical multi-floor and parking invariants', () => {
    const spec = normalizeDesignRequirementSpecification({
      hard: {
        floorsCount: 3,
        staircaseRequired: false,
        parkingRequired: false,
        parkingSpacesCount: 2,
      },
    });

    expect(spec.hard.staircaseRequired).toBe(true);
    expect(spec.hard.parkingRequired).toBe(true);
    expect(spec.hard.parkingSpacesCount).toBe(2);
  });

  it('preserves impossible-but-safe counts for feasibility reporting', () => {
    const spec = normalizeDesignRequirementSpecification({
      hard: { bedroomCount: 12, bathroomCount: 0 },
    });

    expect(spec.hard.bedroomCount).toBe(12);
    expect(spec.hard.bathroomCount).toBe(0);
  });

  it('returns a finite, complete specification for malformed input', () => {
    const spec = normalizeDesignRequirementSpecification({
      hard: { plotWidthMm: Number.NaN, floorsCount: -10 },
      soft: { naturalLightPreference: 'invalid' },
    });

    expect(spec.hard.plotWidthMm).toBe(9144);
    expect(spec.hard.floorsCount).toBe(1);
    expect(spec.soft.naturalLightPreference).toBe(PreferenceLevel.High);
  });
});

