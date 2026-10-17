import { describe, it, expect } from 'vitest';
import { generateDeterministicApartmentSchematic } from '../apartment/schematic';
import { getApartmentRulesProfile } from '../apartment/jurisdiction';

describe('Phase 3 Live Verification: 16-Zone Flat Vastu & 4 Candidates', () => {
  it('runs candidate strategies and prints detailed scorecard', () => {
    const profile = getApartmentRulesProfile('mumbai_mcgm');
    const strategies = ['balanced', 'daylight', 'VASTU_OPTIMIZED', 'privacy'] as const;

    console.log('\n======================================================================');
    console.log('=== PHASE 3: 16-ZONE ANGULAR CENTROID "FLAT VASTU" ENGINE LIVE CHECK ===');
    console.log('======================================================================\n');

    let vastuOptimizedScore = 0;
    let allPopulated = true;

    for (const strat of strategies) {
      const t0 = performance.now();
      const sch = generateDeterministicApartmentSchematic({
        rulesProfile: profile,
        siteWidthM: 45,
        siteDepthM: 35,
        flatsPerFloor: 4,
        unitMix: [{ unitType: '2BHK', count: 4 }],
        strategy: strat,
        northAngleDeg: 0,
        seed: 12345,
      });
      const latency = (performance.now() - t0).toFixed(2);
      const vr = sch.vastuReport;
      if (!vr) allPopulated = false;

      console.log(`Candidate Strategy: ${strat.padEnd(16)} | Vastu Score: ${String(vr?.overallScore).padStart(3)}/100 (Grade: ${vr?.grade}) | Units: ${sch.units.length} | Latency: ${latency}ms`);
      if (strat === 'VASTU_OPTIMIZED') {
        vastuOptimizedScore = vr?.overallScore ?? 0;
      }

      for (const u of sch.units) {
        if (!u.vastuReport) allPopulated = false;
        console.log(`   -> ${u.flatLabel}: ${u.vastuReport?.overallScore}/100 (${u.vastuReport?.grade}) | Centroid: (${u.vastuReport?.centroid.x.toFixed(2)}, ${u.vastuReport?.centroid.y.toFixed(2)}) | Defects: ${u.vastuReport?.defects.length}`);
      }
      console.log('');
    }

    console.log('======================================================================');
    console.log(`[VERIFICATION RESULT]`);
    console.log(`1. All 4 candidates return populated vastuReport: ${allPopulated ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log(`2. Candidate 3 (VASTU_OPTIMIZED) score >= 85:     ${vastuOptimizedScore >= 85 ? `PASSED (${vastuOptimizedScore}/100) ✓` : `FAILED (${vastuOptimizedScore}/100) ✗`}`);
    console.log('======================================================================\n');

    expect(allPopulated).toBe(true);
    expect(vastuOptimizedScore).toBeGreaterThanOrEqual(85);
  });
});
