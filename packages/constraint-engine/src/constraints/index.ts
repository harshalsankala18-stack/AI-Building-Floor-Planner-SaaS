/**
 * All built-in constraints registration.
 * Creates a default registry populated with all hard + soft constraints + providers.
 */

import { ConstraintRegistry } from '../registry';
import type { IConstraintRegistry, ResolvedConstraintConfig } from '../types';
import { ALL_HARD_CONSTRAINTS } from './hard/index';
import { ALL_SOFT_CONSTRAINTS } from './soft/index';
import { VastuRuleProvider } from '../providers/vastu-provider';
import { resolveConfig } from '../config';

/**
 * Create a registry pre-populated with all built-in constraints.
 */
export function createDefaultRegistry(config?: ResolvedConstraintConfig): IConstraintRegistry {
  const registry = new ConstraintRegistry();

  // Register all hard constraints
  registry.registerAll(ALL_HARD_CONSTRAINTS);

  // Register all soft constraints
  registry.registerAll(ALL_SOFT_CONSTRAINTS);

  // Register Vastu provider constraints
  const resolvedConfig = config ?? resolveConfig();
  const vastuProvider = new VastuRuleProvider();
  const vastuConstraints = vastuProvider.getConstraints(resolvedConfig);
  registry.registerAll(vastuConstraints);

  return registry;
}

export { ALL_HARD_CONSTRAINTS } from './hard/index';
export { ALL_SOFT_CONSTRAINTS } from './soft/index';
