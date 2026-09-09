import { describe, expect, it } from 'vitest';
import { adaptSpaceProgramToPlannerProgram, createEmptySpaceProgram, createProgramItem, getSpaceDefinition, validateSpaceProgram } from '../index';

function program() {
  return { ...createEmptySpaceProgram('residential'), items: [
    createProgramItem(getSpaceDefinition('primary_bedroom')!, 'owner', { quantity: 1, floorPreference: { kind: 'ground_required' } }),
    createProgramItem(getSpaceDefinition('attached_bathroom')!, 'bath', { quantity: 1, name: 'Ensuite', attachedToRoomId: 'owner' }),
  ] };
}

describe('reviewed Program intent adaptation', () => {
  it('retains reviewed dressing identity without enabling program-only geometry', () => {
    const value = program();
    const before = adaptSpaceProgramToPlannerProgram(value, 2);
    value.items.push(createProgramItem(getSpaceDefinition('dressing')!, 'dress', {
      privateSuiteAccess: { ownerProgramItemId: 'owner', role: 'dressing' },
    }));
    const result = adaptSpaceProgramToPlannerProgram(value, 2);
    expect(result.items).toEqual(before.items);
    expect(result.totalTargetAreaMm2).toBe(before.totalTargetAreaMm2);
    expect(result.reviewedAccessSpaces).toEqual([{ programItemId: 'dress_1', ownerProgramItemId: 'owner_1', role: 'dressing' }]);
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
  it('never derives a private intermediate from the dressing catalog name alone', () => {
    const value = program();
    value.items.push(createProgramItem(getSpaceDefinition('dressing')!, 'dress'));
    expect(adaptSpaceProgramToPlannerProgram(value, 2).reviewedAccessSpaces).toEqual([]);
  });
  it('maps reviewed access quantities to explicit owner instances', () => {
    const value = program();
    value.items = value.items.map(item => ({ ...item, quantity: 2 }));
    value.items.push(createProgramItem(getSpaceDefinition('dressing')!, 'dress', { quantity: 2,
      privateSuiteAccess: { ownerProgramItemId: 'owner', role: 'dressing' } }));
    expect(adaptSpaceProgramToPlannerProgram(value, 2).reviewedAccessSpaces?.map(item => item.ownerProgramItemId)).toEqual(['owner_1', 'owner_2']);
    value.items[2] = { ...value.items[2]!, quantity: 3 };
    expect(() => adaptSpaceProgramToPlannerProgram(value, 2)).toThrow(/Ambiguous private access quantities/);
  });
  it.each(['missing', 'bath'])('rejects a reviewed intermediate with invalid owner %s', ownerProgramItemId => {
    const value = program();
    value.items.push(createProgramItem(getSpaceDefinition('dressing')!, 'dress', {
      privateSuiteAccess: { ownerProgramItemId, role: 'dressing' } }));
    expect(validateSpaceProgram(value, 2).status).toBe('INVALID');
  });
  it('rejects unrelated bedrooms masquerading as private intermediates', () => {
    const value = program();
    value.items.push(createProgramItem(getSpaceDefinition('bedroom')!, 'other', {
      privateSuiteAccess: { ownerProgramItemId: 'owner', role: 'private_access' } }));
    expect(validateSpaceProgram(value, 2).status).toBe('INVALID');
  });
  it('preserves explicit common-bath use independently of display name', () => {
    const value = program();
    value.items.push(createProgramItem(getSpaceDefinition('common_bathroom')!, 'common', { name: 'Washroom' }));
    expect(adaptSpaceProgramToPlannerProgram(value, 2).items.find(item => item.id === 'common_1')?.bathroomUse).toBe('common');
  });
  it('preserves required Ground and explicit owner instance without name inference', () => {
    const result = adaptSpaceProgramToPlannerProgram(program(), 2);
    expect(result.items[0]!.floorPreference).toEqual({ kind: 'ground_required' });
    expect(result.items[1]!.attachedToRoomId).toBe('owner_1');
  });
  it('preserves specific floor zero rather than treating it as unspecified', () => {
    const value = program();
    value.items[0] = { ...value.items[0]!, floorPreference: { kind: 'specific', specificFloor: 0 } };
    expect(adaptSpaceProgramToPlannerProgram(value, 2).items[0]!.floorPreference).toEqual({ kind: 'specific', specificFloor: 0 });
  });
  it('maps equal quantities to distinct owner instances', () => {
    const value = program();
    value.items = value.items.map(item => ({ ...item, quantity: 2 }));
    expect(adaptSpaceProgramToPlannerProgram(value, 2).items.filter(item => item.attachedToRoomId).map(item => item.attachedToRoomId))
      .toEqual(['owner_1', 'owner_2']);
  });
  it('permits multiple bathrooms assigned to a single owner', () => {
    const value = program();
    value.items[1] = { ...value.items[1]!, quantity: 2 };
    expect(adaptSpaceProgramToPlannerProgram(value, 2).items.filter(item => item.attachedToRoomId).map(item => item.attachedToRoomId))
      .toEqual(['owner_1', 'owner_1']);
  });
  it('rejects ambiguous quantity mappings', () => {
    const value = program();
    value.items[0] = { ...value.items[0]!, quantity: 2 };
    expect(() => adaptSpaceProgramToPlannerProgram(value, 2)).toThrow(/Ambiguous suite quantities/);
  });
  it.each(['missing', 'bath'])('rejects invalid owner %s', owner => {
    const value = program();
    value.items[1] = { ...value.items[1]!, attachedToRoomId: owner };
    expect(validateSpaceProgram(value, 2).status).toBe('INVALID');
    expect(() => adaptSpaceProgramToPlannerProgram(value, 2)).toThrow(/existing supported bedroom/);
  });
  it('rejects conflicting required floors', () => {
    const value = program();
    value.items[1] = { ...value.items[1]!, floorPreference: { kind: 'specific', specificFloor: 1 } };
    expect(() => adaptSpaceProgramToPlannerProgram(value, 2)).toThrow(/conflicting required floors/);
  });
});
