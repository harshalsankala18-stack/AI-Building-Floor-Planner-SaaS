import { describe, it, expect } from 'vitest';
import {
  buildingModelToArchLangSource,
  escapeArchLangString,
  toArchLangId,
  mapRoomTypeToArchLangUse,
  deriveWallsFromFloorRooms,
} from '../apartment/archlang-adapter';
import {
  type Building,
  RoomType,
  WallType,
  DoorType,
  SwingDirection,
} from '@ai-floor-planner/core';

describe('ArchLang Adapter Unit Tests', () => {
  it('escapes user strings safely', () => {
    expect(escapeArchLangString('Living "Master" Room')).toBe('Living \\"Master\\" Room');
    expect(escapeArchLangString('Line 1\nLine 2')).toBe('Line 1 Line 2');
    expect(escapeArchLangString('Test \\ Path')).toBe('Test \\\\ Path');
  });

  it('generates valid, stable ArchLang identifiers', () => {
    expect(toArchLangId('r', 'room-101')).toBe('r_room_101');
    expect(toArchLangId('w', 'wall:ext#1')).toBe('w_wall_ext_1');
    expect(toArchLangId('d', '---')).toBe('d_item');
  });

  it('maps room types to valid ArchLang categories', () => {
    expect(mapRoomTypeToArchLangUse(RoomType.Bedroom)).toBe('bedroom');
    expect(mapRoomTypeToArchLangUse(RoomType.Bathroom)).toBe('bath');
    expect(mapRoomTypeToArchLangUse(RoomType.Living)).toBe('living');
    expect(mapRoomTypeToArchLangUse(RoomType.Kitchen)).toBe('kitchen');
    expect(mapRoomTypeToArchLangUse(RoomType.Study)).toBe('office');
    expect(mapRoomTypeToArchLangUse(RoomType.Foyer)).toBe('entry');
    expect(mapRoomTypeToArchLangUse(RoomType.Corridor)).toBe('circulation');
  });

  it('derives shared wall centerlines topologically when explicit walls are absent', () => {
    const rooms = [
      {
        id: 'r1',
        floorId: 'f1',
        name: 'Room 1',
        type: RoomType.Living,
        x: 0,
        y: 0,
        width: 4000,
        height: 3000,
        boundary: { points: [] },
        rotation: 0,
        area: 12000000,
        tags: [],
        priority: 1,
      },
      {
        id: 'r2',
        floorId: 'f1',
        name: 'Room 2',
        type: RoomType.Bedroom,
        x: 4000,
        y: 0,
        width: 4000,
        height: 3000,
        boundary: { points: [] },
        rotation: 0,
        area: 12000000,
        tags: [],
        priority: 1,
      },
    ];

    const walls = deriveWallsFromFloorRooms(rooms as any);
    expect(walls.length).toBe(7); // 3 external for r1 + 3 external for r2 + 1 shared internal
    const internal = walls.filter(w => !w.isExternal);
    expect(internal).toHaveLength(1);
    expect(internal[0]!.start).toEqual({ x: 4000, y: 0 });
    expect(internal[0]!.end).toEqual({ x: 4000, y: 3000 });
  });

  it('serializes a canonical building model deterministically to valid .arch source', () => {
    const building: Building = {
      id: 'bldg_test_01',
      projectId: 'proj_01',
      name: 'Sample Residence',
      site: {
        id: 'site_01',
        plotWidth: 20000,
        plotDepth: 25000,
        plotArea: 500000000,
        plotShape: 'rectangular' as any,
        plotBoundary: {
          points: [
            { x: 0, y: 0 },
            { x: 20000, y: 0 },
            { x: 20000, y: 25000 },
            { x: 0, y: 25000 },
          ],
        },
        orientation: 0,
        setbacks: { front: 3000, rear: 2000, left: 2000, right: 2000 },
        accessPoints: [],
        roadFacing: 'north' as any,
      },
      floors: [
        {
          id: 'f1',
          buildingId: 'bldg_test_01',
          level: 0,
          name: 'Ground Floor',
          floorHeight: 3000,
          boundary: {
            points: [
              { x: 0, y: 0 },
              { x: 8000, y: 0 },
              { x: 8000, y: 6000 },
              { x: 0, y: 6000 },
            ],
          },
          rooms: [
            {
              id: 'room_liv',
              floorId: 'f1',
              name: 'Living Room',
              type: RoomType.Living,
              x: 0,
              y: 0,
              width: 4000,
              height: 6000,
              boundary: { points: [] },
              rotation: 0,
              area: 24000000,
              tags: ['flat:flat_01', 'unit-type:1BHK'],
              priority: 1,
            } as any,
            {
              id: 'room_bed',
              floorId: 'f1',
              name: 'Master Bedroom',
              type: RoomType.Bedroom,
              x: 4000,
              y: 0,
              width: 4000,
              height: 6000,
              boundary: { points: [] },
              rotation: 0,
              area: 24000000,
              tags: ['flat:flat_01', 'unit-type:1BHK'],
              priority: 1,
            } as any,
          ],
          walls: [
            {
              id: 'w_ext_n',
              floorId: 'f1',
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 8000, y: 0 },
              type: WallType.External,
              thickness: 200,
              roomIds: ['room_liv', 'room_bed'],
              hasOpening: true,
              loadBearing: true,
            },
            {
              id: 'w_party',
              floorId: 'f1',
              startPoint: { x: 4000, y: 0 },
              endPoint: { x: 4000, y: 6000 },
              type: WallType.Partition,
              thickness: 100,
              roomIds: ['room_liv', 'room_bed'],
              hasOpening: true,
              loadBearing: false,
            },
          ],
          doors: [
            {
              id: 'door_bed',
              floorId: 'f1',
              wallId: 'w_party',
              position: { x: 4000, y: 2000 },
              width: 900,
              height: 2100,
              type: DoorType.Single,
              swingDirection: SwingDirection.Inward,
              connectsRooms: ['room_liv', 'room_bed'],
            },
          ],
          windows: [
            {
              id: 'win_liv',
              floorId: 'f1',
              wallId: 'w_ext_n',
              position: { x: 2000, y: 0 },
              width: 1500,
              height: 1200,
              sillHeight: 900,
              type: 'sliding' as any,
              roomId: 'room_liv',
            },
          ],
          stairs: [],
          columns: [],
        },
      ],
      metadata: { projectId: 'proj_01' },
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res1 = buildingModelToArchLangSource(building);
    const res2 = buildingModelToArchLangSource(building);

    // Deterministic: byte-identical output
    expect(res1.source).toBe(res2.source);
    expect(res1.sourceHash).toBe(res2.sourceHash);

    // Language spec checks
    expect(res1.source).toContain('plan "Sample Residence" {');
    expect(res1.source).toContain('units mm');
    expect(res1.source).toContain('level 0 "Ground Floor" height 3000 {');
    expect(res1.source).toContain('zone zone_flat_01 "Flat FLAT_01" {');
    expect(res1.source).toContain('room id=r_room_liv at (0, 0) size 4000x6000 label "Living Room" uses living');
    expect(res1.source).toContain('wall id=w_w_ext_n exterior thickness 200 { (0, 0) (8000, 0) }');
    expect(res1.source).toContain('door id=d_door_bed at (4000, 2000) width 900 wall w_w_party swing in');
    expect(res1.source).toContain('window id=win_win_liv at (2000, 0) width 1500 wall w_w_ext_n');
    expect(res1.source).toContain('title {');
  });
});
