import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { OdaInwebPocWorkspace } from '../components/studio/OdaInwebPocWorkspace';

const mockStore: Record<string, string> = {};
beforeEach(() => {
  for (const key of Object.keys(mockStore)) delete mockStore[key];
  globalThis.localStorage = {
    getItem: (key: string) => mockStore[key] ?? null,
    setItem: (key: string, value: string) => { mockStore[key] = value; },
    removeItem: (key: string) => { delete mockStore[key]; },
    clear: () => { for (const key of Object.keys(mockStore)) delete mockStore[key]; },
    key: (index: number) => Object.keys(mockStore)[index] ?? null,
    length: 0,
  } as Storage;
});

describe('ODA Drawings inWEB™ React Workspace Component', () => {
  it('renders the ODA inWEB POC workspace layout with 10/10 criteria status', () => {
    const html = renderToStaticMarkup(createElement(OdaInwebPocWorkspace, {}));

    expect(html).toContain('ODA DRAWINGS INWEB™ POC');
    expect(html).toContain('10/10 CRITERIA VERIFIED');
    expect(html).toContain('Sync to Canonical Building &amp; 3D');
    expect(html).toContain('Export DXF');
    expect(html).toContain('data-testid="oda-cad-svg-canvas"');
  });

  it('renders CAD mutation controls for Wall Editing, Room Resizing and Layers', () => {
    const html = renderToStaticMarkup(createElement(OdaInwebPocWorkspace, {}));

    expect(html).toContain('Criterion 3: Wall Position &amp; Dimension Editor');
    expect(html).toContain('Criterion 4: Room Geometry Resizer');
    expect(html).toContain('Criterion 5: CAD Layer Table &amp; Visibility');
    expect(html).toContain('Offset X (mm):');
    expect(html).toContain('New Width (mm):');
    expect(html).toContain('Update Text');
  });

  it('renders SVG canvas elements with layer geometry', () => {
    const html = renderToStaticMarkup(createElement(OdaInwebPocWorkspace, {}));

    expect(html).toContain('<svg');
    expect(html).toContain('<line');
    expect(html).toContain('<polygon');
    expect(html).toContain('<text');
  });
});
