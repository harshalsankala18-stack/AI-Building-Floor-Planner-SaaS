import { describe, expect, it } from 'vitest';
import { createBuilding, createDefaultFootprintIntent, applyFootprintToBuilding,
  createEmptySpaceProgram, createProgramItem, getSpaceDefinition, adaptSpaceProgramToPlannerProgram,
  adaptSpaceProgramToResidentialRequirements, RoomType } from '@ai-floor-planner/core';
import { PolygonLayoutGenerator } from '../generator/polygon-layout';
import { LAYOUT_STRATEGIES } from '../generator/structured-layout';
import { DesignGraphBuilder } from '../graph/builder';
import { evaluateArchitecturalEvidence } from '../evidence/architectural-evidence';

describe('suite-aware initial polygon placement, before repair', () => {
  it.each(LAYOUT_STRATEGIES)('$strategy gives requested suites their own initial door edges', profile => {
    const program = { ...createEmptySpaceProgram('residential'), items: [
      ...['living', 'dining', 'kitchen', 'utility', 'staircase'].map(type => createProgramItem(getSpaceDefinition(type)!, type, { quantity: 1 })),
      createProgramItem(getSpaceDefinition('bedroom')!, 'owner-a', { quantity: 1, floorPreference: { kind: 'ground_required' } }),
      createProgramItem(getSpaceDefinition('bedroom')!, 'owner-b', { quantity: 1, floorPreference: { kind: 'specific', specificFloor: 1 } }),
      createProgramItem(getSpaceDefinition('attached_bathroom')!, 'bath-a', { quantity: 1, attachedToRoomId: 'owner-a' }),
      createProgramItem(getSpaceDefinition('attached_bathroom')!, 'bath-b', { quantity: 1, attachedToRoomId: 'owner-b' }),
    ] };
    const source = createBuilding({ projectId: 'initial-suites', name: 'Initial suites',
      site: { plotWidth: 20000, plotDepth: 24000, plannedFloorCount: 2 }, floors: [{ buildingId: '', level: 0 }] });
    const approved = applyFootprintToBuilding(source, createDefaultFootprintIntent(source));
    const intent = adaptSpaceProgramToPlannerProgram(program, 2);
    const graph = new DesignGraphBuilder().buildInstanceGraph(intent);
    const spec = adaptSpaceProgramToResidentialRequirements(program, source).requirements!;
    const before = JSON.stringify({ approved, intent });
    const building = new PolygonLayoutGenerator().generate(spec, intent, profile, graph, approved);
    const evidence = evaluateArchitecturalEvidence(building, intent);
    expect(evidence.suites).toHaveLength(2);
    expect(evidence.suites.every(suite => suite.access?.status === 'PRIVATE_DIRECT')).toBe(true);
    expect(evidence.requiredFloors.filter(item => item.programItemId !== 'staircase_1').every(item => item.passed)).toBe(true);
    // Existing evidence expects one match for a required floor; repeated stair
    // cores are currently reported false despite physical Ground+First presence.
    // Check the actual core instead; do not alter Phase 1 scoring/evidence here.
    expect(building.floors.filter(floor => floor.rooms.some(room => room.type === RoomType.Staircase)).map(floor => floor.level)).toEqual([0, 1]);
    expect(building.floors.every(floor => floor.rooms.some(room => room.type === RoomType.Corridor))).toBe(true);
    expect(JSON.stringify({ approved, intent })).toBe(before);
  });
});
