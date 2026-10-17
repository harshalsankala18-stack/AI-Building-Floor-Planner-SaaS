import { describe, it, expect } from 'vitest';
import { RegulatoryRuleProvider } from '../../providers/regulatory-provider';
import { resolveConfig } from '../../config';

describe('RegulatoryRuleProvider (Stub)', () => {
  it('instantiates with custom jurisdiction and version', () => {
    const provider = new RegulatoryRuleProvider('India/Maharashtra/Pune', '1.0.0');
    expect(provider.name).toBe('regulatory-India/Maharashtra/Pune');
    expect(provider.jurisdiction).toBe('India/Maharashtra/Pune');
    expect(provider.version).toBe('1.0.0');
  });

  it('returns empty constraints array in Phase 4 (no legal claims)', () => {
    const provider = new RegulatoryRuleProvider();
    const config = resolveConfig();
    const constraints = provider.getConstraints(config);
    expect(constraints).toEqual([]);
  });

  it('returns NBC 2016 room dimension constraint for india_nbc_2016 jurisdiction', () => {
    const provider = new RegulatoryRuleProvider('india_nbc_2016', '1.0.0');
    const config = resolveConfig();
    const constraints = provider.getConstraints(config);
    expect(constraints).toHaveLength(1);
    expect(constraints[0]?.id).toBe('NBC-2016-ROOM-DIM');
  });
});
