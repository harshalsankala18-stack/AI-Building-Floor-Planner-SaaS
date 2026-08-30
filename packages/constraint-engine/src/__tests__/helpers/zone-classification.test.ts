import { describe, it, expect } from 'vitest';
import {
  Zone,
  getRoomZone,
  classifyRooms,
  getPublicRooms,
  getPrivateRooms,
  getServiceRooms,
} from '../../helpers/zone-classification';
import { RoomType, DaylightLevel, PrivacyLevel } from '@ai-floor-planner/core';
import type { Room } from '@ai-floor-planner/core';

function mockRoom(type: RoomType, id: string): Room {
  return {
    id,
    floorId: 'f1',
    type,
    name: id,
    boundary: { points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 1000 }] },
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
    rotation: 0,
    area: 1000000,
    priority: 5,
    tags: [],
    adjacencyRequirements: [],
    daylightRequirement: DaylightLevel.Medium,
    privacyRequirement: PrivacyLevel.Medium,
    ventilationRequired: false,
    isFixed: false,
  };
}

describe('Zone Classification Helper', () => {
  it('correctly maps room types to zones', () => {
    expect(getRoomZone(RoomType.Living)).toBe(Zone.PUBLIC);
    expect(getRoomZone(RoomType.Dining)).toBe(Zone.PUBLIC);
    expect(getRoomZone(RoomType.Foyer)).toBe(Zone.PUBLIC);

    expect(getRoomZone(RoomType.Bedroom)).toBe(Zone.PRIVATE);
    expect(getRoomZone(RoomType.Pooja)).toBe(Zone.PRIVATE);
    expect(getRoomZone(RoomType.Study)).toBe(Zone.PRIVATE);

    expect(getRoomZone(RoomType.Kitchen)).toBe(Zone.SERVICE);
    expect(getRoomZone(RoomType.Bathroom)).toBe(Zone.PRIVATE);
    expect(getRoomZone(RoomType.Utility)).toBe(Zone.SERVICE);

    expect(getRoomZone(RoomType.Corridor)).toBe(Zone.CIRCULATION);
  });

  it('classifies a list of rooms by zone', () => {
    const rooms = [
      mockRoom(RoomType.Living, 'r1'),
      mockRoom(RoomType.Bedroom, 'r2'),
      mockRoom(RoomType.Kitchen, 'r3'),
    ];

    const classified = classifyRooms(rooms);
    expect(classified[Zone.PUBLIC]).toHaveLength(1);
    expect(classified[Zone.PRIVATE]).toHaveLength(1);
    expect(classified[Zone.SERVICE]).toHaveLength(1);
  });

  it('filters public, private, and service rooms directly', () => {
    const rooms = [
      mockRoom(RoomType.Living, 'r1'),
      mockRoom(RoomType.Bedroom, 'r2'),
      mockRoom(RoomType.Kitchen, 'r3'),
    ];

    expect(getPublicRooms(rooms).map(r => r.id)).toEqual(['r1']);
    expect(getPrivateRooms(rooms).map(r => r.id)).toEqual(['r2']);
    expect(getServiceRooms(rooms).map(r => r.id)).toEqual(['r3']);
  });
});
