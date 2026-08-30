import { describe, it, expect, beforeEach } from 'vitest';
import { ConstraintRegistry } from '../registry';
import { createDefaultRegistry } from '../constraints/index';
import { ConstraintCategory, ConstraintSeverity } from '../types';
import type { Constraint } from '../types';

describe('ConstraintRegistry', () => {
  let registry: ConstraintRegistry;

  beforeEach(() => {
    registry = new ConstraintRegistry();
  });

  it('registers a constraint and retrieves by ID', () => {
    const constraint: Constraint = {
      id: 'TEST-001',
      name: 'Test Rule',
      description: 'Test Description',
      category: ConstraintCategory.GEOMETRY,
      severity: ConstraintSeverity.HARD,
      enabled: true,
      evaluate: () => [],
    };
    registry.register(constraint);
    expect(registry.get('TEST-001')).toBe(constraint);
    expect(registry.has('TEST-001')).toBe(true);
    expect(registry.size).toBe(1);
  });

  it('throws an error when registering a duplicate constraint ID', () => {
    const c1: Constraint = {
      id: 'DUP-001',
      name: 'First',
      description: '',
      category: ConstraintCategory.GEOMETRY,
      severity: ConstraintSeverity.HARD,
      enabled: true,
      evaluate: () => [],
    };
    const c2: Constraint = {
      id: 'DUP-001',
      name: 'Second',
      description: '',
      category: ConstraintCategory.DAYLIGHT,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate: () => [],
    };
    registry.register(c1);
    expect(() => registry.register(c2)).toThrow(/already registered/);
  });

  it('registers multiple constraints with registerAll', () => {
    const c1: Constraint = {
      id: 'ALL-1',
      name: '1',
      description: '',
      category: ConstraintCategory.GEOMETRY,
      severity: ConstraintSeverity.HARD,
      enabled: true,
      evaluate: () => [],
    };
    const c2: Constraint = {
      id: 'ALL-2',
      name: '2',
      description: '',
      category: ConstraintCategory.DAYLIGHT,
      severity: ConstraintSeverity.SOFT,
      enabled: true,
      evaluate: () => [],
    };
    registry.registerAll([c1, c2]);
    expect(registry.size).toBe(2);
    expect(registry.getAll()).toEqual([c1, c2]);
  });

  it('filters constraints by category', () => {
    const c1: Constraint = { id: 'G1', name: 'G1', description: '', category: ConstraintCategory.GEOMETRY, severity: ConstraintSeverity.HARD, enabled: true, evaluate: () => [] };
    const c2: Constraint = { id: 'D1', name: 'D1', description: '', category: ConstraintCategory.DAYLIGHT, severity: ConstraintSeverity.SOFT, enabled: true, evaluate: () => [] };
    const c3: Constraint = { id: 'G2', name: 'G2', description: '', category: ConstraintCategory.GEOMETRY, severity: ConstraintSeverity.SOFT, enabled: true, evaluate: () => [] };
    registry.registerAll([c1, c2, c3]);

    const geo = registry.getByCategory(ConstraintCategory.GEOMETRY);
    expect(geo).toHaveLength(2);
    expect(geo.map(c => c.id)).toEqual(['G1', 'G2']);

    const day = registry.getByCategory(ConstraintCategory.DAYLIGHT);
    expect(day).toHaveLength(1);
    expect(day[0]!.id).toBe('D1');
  });

  it('filters constraints by severity', () => {
    const c1: Constraint = { id: 'H1', name: 'H1', description: '', category: ConstraintCategory.GEOMETRY, severity: ConstraintSeverity.HARD, enabled: true, evaluate: () => [] };
    const c2: Constraint = { id: 'S1', name: 'S1', description: '', category: ConstraintCategory.DAYLIGHT, severity: ConstraintSeverity.SOFT, enabled: true, evaluate: () => [] };
    const c3: Constraint = { id: 'W1', name: 'W1', description: '', category: ConstraintCategory.STRUCTURAL, severity: ConstraintSeverity.WARNING, enabled: true, evaluate: () => [] };
    registry.registerAll([c1, c2, c3]);

    expect(registry.getBySeverity(ConstraintSeverity.HARD)).toHaveLength(1);
    expect(registry.getBySeverity(ConstraintSeverity.SOFT)).toHaveLength(1);
    expect(registry.getBySeverity(ConstraintSeverity.WARNING)).toHaveLength(1);
    expect(registry.getBySeverity(ConstraintSeverity.INFORMATIONAL)).toHaveLength(0);
  });

  it('enables and disables constraints dynamically', () => {
    const c1: Constraint = { id: 'TOGGLE-1', name: 'T1', description: '', category: ConstraintCategory.GEOMETRY, severity: ConstraintSeverity.HARD, enabled: true, evaluate: () => [] };
    registry.register(c1);
    expect(registry.get('TOGGLE-1')!.enabled).toBe(true);

    registry.setEnabled('TOGGLE-1', false);
    expect(registry.get('TOGGLE-1')!.enabled).toBe(false);

    registry.setEnabled('TOGGLE-1', true);
    expect(registry.get('TOGGLE-1')!.enabled).toBe(true);
  });

  it('unregisters constraints by ID', () => {
    const c1: Constraint = { id: 'DEL-1', name: 'D1', description: '', category: ConstraintCategory.GEOMETRY, severity: ConstraintSeverity.HARD, enabled: true, evaluate: () => [] };
    registry.register(c1);
    expect(registry.has('DEL-1')).toBe(true);

    registry.unregister('DEL-1');
    expect(registry.has('DEL-1')).toBe(false);
    expect(registry.get('DEL-1')).toBeUndefined();
    expect(registry.size).toBe(0);
  });

  it('default registry contains all hard, soft, and provider constraints', () => {
    const defaultRegistry = createDefaultRegistry();
    expect(defaultRegistry.size).toBeGreaterThanOrEqual(40);
    expect(defaultRegistry.get('HC-001')).toBeDefined();
    expect(defaultRegistry.get('HC-003')).toBeDefined();
    expect(defaultRegistry.get('SC-ADJ-001')).toBeDefined();
    expect(defaultRegistry.get('SC-DAY-001')).toBeDefined();
    expect(defaultRegistry.get('SC-VASTU-001')).toBeDefined();
  });
});
