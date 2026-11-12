import { describe, expect, it } from 'vitest';
import { createCanonical30x50_2BHK } from '../services/storage';
import {
  createExportArtifact,
  DEFAULT_ADVANCED_EXPORT_SETTINGS,
  validateExportSettings,
  type AdvancedExportSettings,
} from '../services/advanced-export';

function settings(overrides: Partial<AdvancedExportSettings> = {}): AdvancedExportSettings {
  const building = createCanonical30x50_2BHK();
  return {
    ...DEFAULT_ADVANCED_EXPORT_SETTINGS,
    floorId: building.floors[0]?.id,
    ...overrides,
  };
}

describe('Phase 11 advanced export', () => {
  it('creates a self-contained SVG with selected layers and title metadata', () => {
    const building = createCanonical30x50_2BHK();
    const artifact = createExportArtifact(building, settings({
      format: 'svg',
      includeGrid: false,
      includeDimensions: false,
      includeNorthArrow: false,
      includeTitleBlock: true,
      drawnBy: 'Architecture Team',
    }));

    expect(artifact.mimeType).toBe('image/svg+xml');
    expect(artifact.filename).toMatch(/\.svg$/);
    expect(artifact.content).toContain('<svg');
    expect(artifact.content).not.toContain('layer-grid');
    expect(artifact.content).not.toContain('layer-annotations');
    expect(artifact.content).not.toContain('north-arrow');
    expect(artifact.content).toContain('title-block');
    expect(artifact.content).toContain('Architecture Team');
  });

  it('creates a valid single-page PDF structure with vector drawing content', () => {
    const building = createCanonical30x50_2BHK();
    const artifact = createExportArtifact(building, settings({ format: 'pdf' }));
    const content = typeof artifact.content === 'string' ? artifact.content : new TextDecoder().decode(artifact.content);

    expect(artifact.mimeType).toBe('application/pdf');
    expect(content.startsWith('%PDF-1.4')).toBe(true);
    expect(content).toContain('/Type /Page');
    expect(content).toContain('xref');
    expect(content).toContain('startxref');
    expect(content.endsWith('%%EOF')).toBe(true);
    expect(artifact.byteSize).toBeGreaterThan(1000);

    const xrefOffset = Number(content.match(/startxref\n(\d+)/)?.[1]);
    expect(content.slice(xrefOffset, xrefOffset + 4)).toBe('xref');
    const objectOffsets = content
      .split('xref\n')[1]!
      .split('trailer')[0]!
      .split('\n')
      .slice(2)
      .filter((line: string) => line.endsWith(' n '))
      .map((line: string) => Number(line.slice(0, 10)));
    objectOffsets.forEach((offset: number, index: number) => {
      expect(content.slice(offset)).toMatch(new RegExp(`^${index + 1} 0 obj`));
    });
  });

  it('exports the canonical model with a revision manifest as JSON', () => {
    const building = createCanonical30x50_2BHK();
    const artifact = createExportArtifact(building, settings({
      format: 'json',
      revision: '07',
      projectNumber: 'HOUSE-2026',
    }));
    const content = typeof artifact.content === 'string' ? artifact.content : new TextDecoder().decode(artifact.content);
    const parsed = JSON.parse(content);

    expect(parsed.exportManifest.revision).toBe('07');
    expect(parsed.exportManifest.projectNumber).toBe('HOUSE-2026');
    expect(parsed.building.id).toBe(building.id);
    expect(parsed.building.floors).toHaveLength(building.floors.length);
  });

  it('rejects malformed scale and incomplete title metadata', () => {
    expect(validateExportSettings(settings({ scale: 'large', drawnBy: '', revision: '' })))
      .toHaveLength(3);
  });
});
