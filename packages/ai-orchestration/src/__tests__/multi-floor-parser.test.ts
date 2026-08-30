import { describe, expect, it } from 'vitest';
import { RuleBasedRequirementParser } from '../providers/rule-based';

describe('rule-based multi-floor parsing', () => {
  it.each([
    ['30x50 G+1 3BHK', 2],
    ['30x50 g + 2 4BHK', 3],
    ['40x60 G+3 5BHK', 4],
    ['36x55 G+4 5BHK', 5],
    ['40x60 6 floors 6BHK', 6],
  ])('parses %s as %i total floors', (prompt, expected) => {
    const specification = new RuleBasedRequirementParser().parse(prompt);
    expect(specification.hard.floorsCount).toBe(expected);
    expect(specification.hard.staircaseRequired).toBe(true);
  });

  it('clamps unsupported G+N input to the schema maximum', () => {
    expect(new RuleBasedRequirementParser().parse('40x60 G+25 8BHK').hard.floorsCount).toBe(10);
  });
});
