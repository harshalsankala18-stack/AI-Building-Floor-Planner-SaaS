/**
 * Constraint Registry — holds and manages all constraints.
 */

import {
  type Constraint,
  type IConstraintRegistry,
  ConstraintCategory,
  ConstraintSeverity,
} from './types';

export class ConstraintRegistry implements IConstraintRegistry {
  private constraints: Map<string, Constraint> = new Map();

  get size(): number {
    return this.constraints.size;
  }

  register(constraint: Constraint): void {
    if (this.constraints.has(constraint.id)) {
      throw new Error(`Constraint with id "${constraint.id}" is already registered`);
    }
    this.constraints.set(constraint.id, constraint);
  }

  registerAll(constraints: Constraint[]): void {
    for (const c of constraints) {
      this.register(c);
    }
  }

  get(id: string): Constraint | undefined {
    return this.constraints.get(id);
  }

  getAll(): readonly Constraint[] {
    return [...this.constraints.values()];
  }

  getByCategory(category: ConstraintCategory): readonly Constraint[] {
    return [...this.constraints.values()].filter(c => c.category === category);
  }

  getBySeverity(severity: ConstraintSeverity): readonly Constraint[] {
    return [...this.constraints.values()].filter(c => c.severity === severity);
  }

  setEnabled(id: string, enabled: boolean): void {
    const c = this.constraints.get(id);
    if (c) {
      c.enabled = enabled;
    }
  }

  unregister(id: string): void {
    this.constraints.delete(id);
  }

  has(id: string): boolean {
    return this.constraints.has(id);
  }
}
