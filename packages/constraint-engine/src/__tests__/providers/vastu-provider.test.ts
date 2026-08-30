import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { VastuRuleProvider } from '../../providers/vastu-provider';
import { resolveConfig } from '../../config';
import { buildEvaluationContext } from '../../context';
import type { Building } from '@ai-floor-planner/core';

const FIXTURES_DIR = path.resolve(__dirname, '../../../../../tests/fixtures');

function loadFixture(name: string): Building {
  const json = fs.readFileSync(path.join(FIXTURES_DIR, `${name}.json`), 'utf-8');
  return JSON.parse(json) as Building;
}

describe('VastuRuleProvider', () => {
  it('returns constraints when enableVastu is true', () => {
    const provider = new VastuRuleProvider();
    const config = resolveConfig({ enableVastu: true });
    const constraints = provider.getConstraints(config);
    expect(constraints.length).toBe(8);
  });

  it('returns empty array when enableVastu is false', () => {
    const provider = new VastuRuleProvider();
    const config = resolveConfig({ enableVastu: false });
    const constraints = provider.getConstraints(config);
    expect(constraints).toHaveLength(0);
  });

  it('evaluates high score on quality-vastu-good fixture', () => {
    const building = loadFixture('quality-vastu-good');
    const provider = new VastuRuleProvider();
    const config = resolveConfig({ enableVastu: true, vastuStrictness: 'moderate' }, building);
    const constraints = provider.getConstraints(config);
    const ctx = buildEvaluationContext(building, config);

    let earned = 0;
    let max = 0;
    for (const c of constraints) {
      const res = c.evaluate(ctx);
      for (const r of res) {
        earned += r.score;
        max += r.maxScore;
      }
    }
    const ratio = earned / max;
    expect(ratio).toBeGreaterThan(0.3);
  });

  it('evaluates low score on quality-vastu-bad fixture', () => {
    const building = loadFixture('quality-vastu-bad');
    const provider = new VastuRuleProvider();
    const config = resolveConfig({ enableVastu: true, vastuStrictness: 'strict' }, building);
    const constraints = provider.getConstraints(config);
    const ctx = buildEvaluationContext(building, config);

    let toiletNEPass = true;
    for (const c of constraints) {
      if (c.id === 'SC-VASTU-008') {
        const res = c.evaluate(ctx);
        toiletNEPass = res.every(r => r.passed);
      }
    }
    // Toilet in NE corner should fail in quality-vastu-bad fixture
    expect(toiletNEPass).toBe(false);
  });
});
