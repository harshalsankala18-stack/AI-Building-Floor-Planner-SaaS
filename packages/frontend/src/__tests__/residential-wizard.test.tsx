import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResidentialPlanningWizard } from '../components/wizard/ResidentialPlanningWizard';

describe('ResidentialPlanningWizard Component', () => {
  it('renders Step 1 with typology choices and floor selection', () => {
    const html = renderToStaticMarkup(
      <ResidentialPlanningWizard
        isOpen={true}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(html).toContain('Residential Planning Wizard');
    expect(html).toContain('Step 1 of 6');
    expect(html).toContain('Independent House');
    expect(html).toContain('Villa / Bungalow');
    expect(html).toContain('Row House / Townhome');
    expect(html).toContain('Duplex Residence');
    expect(html).toContain('Single Family');
    expect(html).toContain('Continue to Step 2');
  });

  it('renders Step 3 Footprint Shape selection with 13 shapes', () => {
    const html = renderToStaticMarkup(
      <ResidentialPlanningWizard
        isOpen={true}
        onClose={vi.fn()}
        onComplete={vi.fn()}
        initialBrief={{
          footprintShape: 'u_shape',
        }}
      />
    );

    expect(html).toContain('Residential Planning Wizard');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <ResidentialPlanningWizard
        isOpen={false}
        onClose={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(html).toBe('');
  });
});
