import { describe, expect, it } from 'vitest';
import { adaptSpaceProgramToPlannerProgram, createEmptySpaceProgram, createProgramItem, getSpaceDefinition, validateSpaceProgram } from '../index';

function program() {
  return { ...createEmptySpaceProgram('residential'), items: [
    createProgramItem(getSpaceDefinition('primary_bedroom')!, 'owner', { quantity: 1, floorPreference: { kind: 'ground_required' } }),
    createProgramItem(getSpaceDefinition('attached_bathroom')!, 'bath', { quantity: 1, name: 'Ensuite', attachedToRoomId: 'owner' }),
  ] };
}

describe('reviewed Program intent adaptation', () => {
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
