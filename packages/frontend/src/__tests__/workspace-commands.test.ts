import { describe, expect, it, vi } from 'vitest';
import { calculateFloorPlatePercentage, filterWorkspaceCommands, floorSearchKeywords, hasOpeningPositionChanged, isEditableKeyboardTarget, type WorkspaceCommand } from '../services/workspace-commands';

function commands(): WorkspaceCommand[] {
  return [
    { id: 'wall', label: 'Draw wall', group: 'Tools', keywords: ['wall'], disabled: true, disabledReason: 'Derived topology', run: vi.fn() },
    { id: 'window', label: 'Add window', group: 'Tools', keywords: ['opening'], shortcut: 'N', run: vi.fn() },
    { id: 'floor-2', label: 'Go to Second Floor', group: 'Floors', keywords: ['floor', '2'], run: vi.fn() },
    { id: 'fit', label: 'Fit active floor to view', group: 'Views', keywords: ['zoom', 'center'], shortcut: 'F', run: vi.fn() },
    { id: 'lock', label: 'Lock selected rooms for generation', group: 'Selection', keywords: ['protect'], run: vi.fn() },
    { id: 'export', label: 'Open export studio', group: 'Project', keywords: ['pdf', 'svg'], run: vi.fn() },
  ];
}

describe('workspace command discovery', () => {
  it.each([['wall', 'wall'], ['window', 'window'], ['second floor', 'floor-2'], ['fit', 'fit'], ['protect', 'lock'], ['pdf', 'export']] as const)('finds %s', (query, id) => {
    expect(filterWorkspaceCommands(commands(), query).map(command => command.id)).toContain(id);
  });

  it('returns every command for an empty query and no imaginary results', () => {
    expect(filterWorkspaceCommands(commands(), '')).toHaveLength(6);
    expect(filterWorkspaceCommands(commands(), 'structural solver')).toEqual([]);
  });

  it('preserves truthful disabled command metadata', () => {
    expect(filterWorkspaceCommands(commands(), 'wall')[0]).toMatchObject({ disabled: true, disabledReason: 'Derived topology' });
  });

  it('protects text-entry controls from single-key workspace shortcuts', () => {
    expect(isEditableKeyboardTarget({ tagName: 'INPUT', isContentEditable: false } as HTMLElement)).toBe(true);
    expect(isEditableKeyboardTarget({ tagName: 'DIV', isContentEditable: true } as HTMLElement)).toBe(true);
    expect(isEditableKeyboardTarget({ tagName: 'BUTTON', isContentEditable: false } as HTMLElement)).toBe(false);
  });

  it('maps numeric floor levels to natural-language ordinal search terms', () => {
    expect(floorSearchKeywords(0)).toContain('ground');
    expect(floorSearchKeywords(2)).toContain('second');
    expect(floorSearchKeywords(8)).toContain('eighth');
  });

  it('does not record a no-op opening click as movement', () => {
    expect(hasOpeningPositionChanged({ x: 100, y: 200 }, { x: 100, y: 200 })).toBe(false);
    expect(hasOpeningPositionChanged({ x: 100, y: 200 }, { x: 150, y: 200 })).toBe(true);
  });

  it('reports exact reduced floor plate percentages', () => {
    expect(calculateFloorPlatePercentage(100_000_000, 100_000_000)).toBe(100);
    expect(calculateFloorPlatePercentage(100_000_000, 85_000_000)).toBe(85);
    expect(calculateFloorPlatePercentage(100_000_000, 65_000_000)).toBe(65);
  });
});
