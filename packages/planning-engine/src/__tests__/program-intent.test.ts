import { describe, expect, it } from 'vitest';
import { createEmptySpaceProgram, createProgramItem, getSpaceDefinition, adaptSpaceProgramToPlannerProgram, RoomType,
  createBuilding, createDefaultFootprintIntent, Direction, setIdSeed, resetIdGenerator,
  type SpaceFloorPreference, type SpaceProgramItem } from '@ai-floor-planner/core';
import { FloorProgramPlanner } from '../multi-floor/planner';
import { DesignGraphBuilder } from '../graph/builder';
import { runGenerationWorkflow } from '../generation/workflow';

function input() {
  return adaptSpaceProgramToPlannerProgram({ ...createEmptySpaceProgram('residential'), items: [
    createProgramItem(getSpaceDefinition('bedroom')!, 'parents', { quantity: 1, floorPreference: { kind: 'ground_required' } }),
    createProgramItem(getSpaceDefinition('primary_bedroom')!, 'owner', { quantity: 1, floorPreference: { kind: 'specific', specificFloor: 0 } }),
    createProgramItem(getSpaceDefinition('bedroom')!, 'upper', { quantity: 1, floorPreference: { kind: 'specific', specificFloor: 1 } }),
    createProgramItem(getSpaceDefinition('attached_bathroom')!, 'bath', { name: 'Ensuite', attachedToRoomId: 'owner' }),
    createProgramItem(getSpaceDefinition('staircase')!, 'stairs'),
  ] }, 2);
}

describe('floor and suite intent', () => {
  it.each(['upper_private', 'ground_guest', 'top_master'] as const)('honors hard floors and owned suites under %s', distributionStrategy => {
    const floors = new FloorProgramPlanner().allocate(input(), 2, { distributionStrategy });
    expect(floors[0]!.map(item => item.id)).toEqual(expect.arrayContaining(['parents_1_floor_0', 'owner_1_floor_0', 'bath_1_floor_0']));
    expect(floors[1]!.some(item => item.id === 'upper_1_floor_1')).toBe(true);
    expect(floors[0]!.find(item => item.id === 'bath_1_floor_0')!.attachedToRoomId).toBe('owner_1_floor_0');
    expect(floors.flatMap(floor => floor.filter(item => item.type === RoomType.Staircase))).toHaveLength(2);
  });
  it('builds owned access edges independently of order and bathroom display name', () => {
    const value = input();
    const graph = new DesignGraphBuilder().buildInstanceGraph({ ...value, items: [...value.items].reverse() });
    const edge = graph.edges.find(edge => edge.reason === 'Requested attached bathroom access')!;
    expect([edge.sourceNodeId, edge.targetNodeId]).toEqual(['spatial_node_owner_1', 'spatial_node_bath_1']);
  });
  it('moves a flexible owner with a bathroom requiring Ground', () => {
    const value = input();
    const modified = { ...value, items: value.items.map(item => item.id === 'owner_1'
      ? { ...item, floorPreference: { kind: 'any' as const } }
      : item.id === 'bath_1' ? { ...item, floorPreference: { kind: 'ground_required' as const } } : item) };
    const floors = new FloorProgramPlanner().allocate(modified, 2);
    expect(floors[0]!.some(item => item.id === 'owner_1_floor_0')).toBe(true);
  });
  it('rejects conflicting suite floors even for direct planner callers', () => {
    const value = input();
    const modified = { ...value, items: value.items.map(item => item.id === 'bath_1'
      ? { ...item, floorPreference: { kind: 'specific' as const, specificFloor: 1 } } : item) };
    expect(() => new FloorProgramPlanner().allocate(modified, 2)).toThrow(/CONFLICTING_SUITE_FLOORS/);
  });
  it('does not fill an empty upper floor by stealing a required Ground room or its suite', () => {
    const value = input();
    const modified = { ...value, items: value.items.filter(item => item.id !== 'upper_1') };
    expect(() => new FloorProgramPlanner().allocate(modified, 2)).toThrow(/no occupiable room allocation/);
  });
  it('reports infeasibility rather than relocating a required Ground suite to spare upper capacity', () => {
    expect(() => new FloorProgramPlanner().allocate(input(), 2, { availableAreaMm2ByFloor: [10_000_000, 500_000_000] })).toThrow(/INFEASIBLE_PROGRAM/);
  });
  it('rejects unknown explicit owners rather than falling back to item order', () => {
    const value = input();
    const modified = { ...value, items: value.items.map(item => item.id === 'bath_1' ? { ...item, attachedToRoomId: 'missing' } : item) };
    expect(() => new DesignGraphBuilder().buildInstanceGraph(modified)).toThrow(/INVALID_SUITE_OWNER/);
    expect(() => new FloorProgramPlanner().allocate(modified, 2)).toThrow(/INVALID_SUITE_OWNER/);
  });
  it('allocates every explicitly owned bathroom exactly once with its owner', () => {
    const value = input();
    const bath = value.items.find(item => item.id === 'bath_1')!;
    const floors = new FloorProgramPlanner().allocate({ ...value, items: [...value.items, { ...bath, id: 'second-bath' }] }, 2);
    const bathrooms = floors.flat().filter(item => item.type === RoomType.Bathroom);
    expect(bathrooms).toHaveLength(2);
    expect(new Set(bathrooms.map(item => item.id)).size).toBe(2);
    expect(bathrooms.every(item => item.attachedToRoomId === 'owner_1_floor_0')).toBe(true);
  });
  it('rejects out-of-range required floors rather than silently clamping', () => {
    const value = input();
    const modified = { ...value, items: value.items.map(item => item.id === 'owner_1'
      ? { ...item, floorPreference: { kind: 'specific' as const, specificFloor: 2 } } : item) };
    expect(() => new FloorProgramPlanner().allocate(modified, 2)).toThrow(/INVALID_REQUIRED_FLOOR/);
  });
  it('preserves RBEA Ground intent and owned pairs through real generation and repair', async () => {
    setIdSeed(20260904);
    try {
      const item = (definitionId: string, id: string, name: string, floorPreference: SpaceFloorPreference = { kind: 'any' }, extra: Partial<SpaceProgramItem> = {}) =>
        createProgramItem(getSpaceDefinition(definitionId)!, id, { name, quantity: 1, floorPreference, ...extra });
      const owners = { bath1: 'master1', bath2: 'master2', bath3: 'master3', bath4: 'guest' };
      const items = [
        item('living','living','Living'), item('kitchen','kitchen','Kitchen'), item('dining','dining','Dining'), item('utility','utility','Utility'),
        item('bedroom','parents','Parents Bedroom',{kind:'ground_required'}),
        item('primary_bedroom','master1','Master Bedroom 01',{kind:'specific',specificFloor:0}),
        item('primary_bedroom','master2','Master Bedroom 02',{kind:'specific',specificFloor:1}),
        item('primary_bedroom','master3','Master Bedroom 03',{kind:'specific',specificFloor:1}),
        item('guest_bedroom','guest','Guest Bedroom',{kind:'specific',specificFloor:1}),
        ...Object.entries(owners).map(([bath,owner],index) => item('attached_bathroom',bath,`Attached Bath ${['01','02','03','Guest'][index]}`,{kind:'any'},{attachedToRoomId:owner})),
        item('common_bathroom','common','Common Bathroom',{kind:'ground_required'}), item('staircase','stairs','Stair'),
        item('pooja','pooja','Pooja',{kind:'ground_required'}), item('garage','garage','Garage'), item('balcony','balcony','Balcony',{kind:'specific',specificFloor:1}),
      ];
      const program = {...createEmptySpaceProgram('residential'),items};
      const building = createBuilding({projectId:'rbea-001-audit',name:'RBEA-001 relationship benchmark',site:{plotWidth:22000,plotDepth:28000,plannedFloorCount:2,roadFacing:Direction.North,setbacks:{front:1500,rear:1000,left:1000,right:1000}},floors:[{buildingId:'',level:0}]});
      const base = createDefaultFootprintIntent(building);
      const footprint = {...base,parameters:{...base.parameters,width:20000,depth:25500},transform:{...base.transform,x:1000,y:1500},strategy:'custom_per_floor' as const,floorOverrides:[{floorLevel:1,scalePercent:75}]};
      const result = await runGenerationWorkflow({building,program,footprint,category:'residential'});
      expect(result.candidates.length).toBeGreaterThan(1);
      for (const candidate of result.candidates) {
        const find = (id: string) => candidate.building.floors.flatMap(f => f.rooms).find(r => r.tags.some(t => t.startsWith(`program:${id}_1_floor_`)))!;
        const level = (id: string) => candidate.building.floors.find(f => f.id === find(id).floorId)!.level;
        expect(candidate.validation.isValid).toBe(true);
        expect(level('parents')).toBe(0);
        expect(level('master1')).toBe(0);
        expect(level('pooja')).toBe(0);
        for (const [bath,owner] of Object.entries(owners)) {
          expect(find(bath).floorId).toBe(find(owner).floorId);
          expect(candidate.designGraph.edges.some(edge => edge.sourceNodeId === `spatial_node_${owner}_1`
            && edge.targetNodeId === `spatial_node_${bath}_1` && edge.reason === 'Requested attached bathroom access')).toBe(true);
        }
      }
      const best = result.candidates[0]!;
      const rooms = best.building.floors.flatMap(f => f.rooms);
      const find = (id: string) => rooms.find(r => r.tags.some(t => t.startsWith(`program:${id}_1_floor_`)))!;
      const directOwnedPairs = Object.entries(owners).filter(([bath,owner]) => best.building.floors.some(f =>
        f.doors.some(door => door.connectsRooms.includes(find(bath).id) && door.connectsRooms.includes(find(owner).id))));
      // Baseline best candidate: 0/4. This measures real doors, not graph score.
      expect(directOwnedPairs.length).toBeGreaterThanOrEqual(3);
    } finally { resetIdGenerator(); }
  }, 20000);
});
