/**
 * Regulatory Rule Provider — STUB.
 *
 * This is an architectural placeholder for future jurisdiction-specific building codes.
 * No rules are implemented in Phase 4.
 *
 * Future jurisdictions may include:
 * - India / Maharashtra / Pune
 * - India / Karnataka / Bangalore
 * - India / Tamil Nadu / Chennai
 * etc.
 */

import type { Constraint, ResolvedConstraintConfig, RuleProvider } from '../types';

export class RegulatoryRuleProvider implements RuleProvider {
  readonly name: string;
  readonly jurisdiction: string;
  readonly version: string;

  constructor(jurisdiction: string = 'generic', version: string = '0.0.0') {
    this.name = `regulatory-${jurisdiction}`;
    this.jurisdiction = jurisdiction;
    this.version = version;
  }

  /**
   * Returns constraints for this jurisdiction.
   * Currently returns empty — no regulatory rules implemented in Phase 4.
   */
  getConstraints(_config: ResolvedConstraintConfig): Constraint[] {
    // Phase 4: No jurisdiction-specific rules.
    // Future phases will populate this based on local building codes.
    return [];
  }
}
