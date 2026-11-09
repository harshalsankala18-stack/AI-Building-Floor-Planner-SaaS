import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { planDeterministicApartment } from '../index';
import { compileBuildingWithArchLang, compileBuildingToDxf } from '../apartment/archlang-compiler';
import { Building, RoomType, WallType } from '@ai-floor-planner/core';

describe('Generate ArchLang Production Verification Artifacts', () => {
  const artifactsDir = path.resolve(__dirname, '../../../../artifacts/archlang-verification');

  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  it('Case A: generates and verifies 2BHK apartment artifacts (arch, svg, dxf, pdf, png, parity.json)', async () => {
    const caseABuilding: Building = {
      id: 'bldg-case-a-2bhk',
      name: 'Contemporary 2BHK Residence',
      version: 1,
      site: {
        id: 'site-a',
        plotWidth: 16000,
        plotDepth: 16000,
        orientation: 0,
        setbacks: { front: 2000, rear: 2000, left: 2000, right: 2000 },
        plotBoundary: { points: [{ x: 0, y: 0 }, { x: 16000, y: 0 }, { x: 16000, y: 16000 }, { x: 0, y: 16000 }] },
        plotArea: 256000000,
        plotShape: 'rectangular',
        accessPoints: [],
        roadFacing: 'north',
      },
      floors: [
        {
          id: 'f-case-a-0',
          level: 0,
          name: 'Ground Floor',
          boundary: { points: [{ x: 0, y: 0 }, { x: 12000, y: 0 }, { x: 12000, y: 10000 }, { x: 0, y: 10000 }] },
          rooms: [
            // Entrance
            {
              id: 'r-foyer',
              floorId: 'f-case-a-0',
              name: 'Entrance Foyer',
              type: RoomType.Foyer,
              x: 0,
              y: 0,
              width: 2500,
              height: 2000,
              area: 5000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'entry'],
            },
            // Living & Dining
            {
              id: 'r-living',
              floorId: 'f-case-a-0',
              name: 'Living Room',
              type: RoomType.Living,
              x: 2500,
              y: 0,
              width: 5500,
              height: 4000,
              area: 22000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'unit-type:2BHK', 'living'],
            },
            {
              id: 'r-dining',
              floorId: 'f-case-a-0',
              name: 'Dining Space',
              type: RoomType.Dining,
              x: 8000,
              y: 0,
              width: 4000,
              height: 4000,
              area: 16000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'unit-type:2BHK', 'dining'],
            },
            // Kitchen & Utility
            {
              id: 'r-kitchen',
              floorId: 'f-case-a-0',
              name: 'Kitchen',
              type: RoomType.Kitchen,
              x: 8000,
              y: 4000,
              width: 4000,
              height: 3000,
              area: 12000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'unit-type:2BHK', 'kitchen'],
            },
            // Master Bedroom + Ensuite
            {
              id: 'r-master-bed',
              floorId: 'f-case-a-0',
              name: 'Master Bedroom',
              type: RoomType.Bedroom,
              x: 0,
              y: 4000,
              width: 4000,
              height: 4000,
              area: 16000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'unit-type:2BHK', 'bedroom', 'master'],
            },
            {
              id: 'r-master-bath',
              floorId: 'f-case-a-0',
              name: 'Master Ensuite',
              type: RoomType.Bathroom,
              x: 0,
              y: 8000,
              width: 2500,
              height: 2000,
              area: 5000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'unit-type:2BHK', 'bath'],
            },
            // Second Bedroom + Common Bath
            {
              id: 'r-bed-2',
              floorId: 'f-case-a-0',
              name: 'Second Bedroom',
              type: RoomType.Bedroom,
              x: 4000,
              y: 4000,
              width: 4000,
              height: 4000,
              area: 16000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'unit-type:2BHK', 'bedroom'],
            },
            {
              id: 'r-common-bath',
              floorId: 'f-case-a-0',
              name: 'Common Bathroom',
              type: RoomType.Bathroom,
              x: 4000,
              y: 8000,
              width: 2500,
              height: 2000,
              area: 5000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'unit-type:2BHK', 'bath'],
            },
            // Balcony
            {
              id: 'r-balcony',
              floorId: 'f-case-a-0',
              name: 'Living Balcony',
              type: RoomType.Balcony,
              x: 2500,
              y: 8000,
              width: 1500,
              height: 2000,
              area: 3000000,
              boundary: { points: [] },
              rotation: 0,
              priority: 1,
              tags: ['flat:101', 'balcony'],
            },
          ],
          walls: [
            {
              id: 'w-ext-north',
              floorId: 'f-case-a-0',
              startPoint: { x: 0, y: 0 },
              endPoint: { x: 12000, y: 0 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: true,
              loadBearing: true,
            },
            {
              id: 'w-ext-east',
              floorId: 'f-case-a-0',
              startPoint: { x: 12000, y: 0 },
              endPoint: { x: 12000, y: 10000 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: true,
              loadBearing: true,
            },
            {
              id: 'w-ext-south',
              floorId: 'f-case-a-0',
              startPoint: { x: 12000, y: 10000 },
              endPoint: { x: 0, y: 10000 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: true,
              loadBearing: true,
            },
            {
              id: 'w-ext-west',
              floorId: 'f-case-a-0',
              startPoint: { x: 0, y: 10000 },
              endPoint: { x: 0, y: 0 },
              thickness: 200,
              type: WallType.External,
              roomIds: [],
              hasOpening: true,
              loadBearing: true,
            },
          ],
          doors: [
            {
              id: 'd-entry',
              floorId: 'f-case-a-0',
              wallId: 'w-ext-north',
              position: { x: 1000, y: 0 },
              width: 1000,
              direction: 'inward',
              hingeSide: 'left',
              type: 'single',
              roomIds: ['r-foyer'],
            },
          ],
          windows: [
            {
              id: 'win-living',
              floorId: 'f-case-a-0',
              wallId: 'w-ext-north',
              position: { x: 4500, y: 0 },
              width: 2000,
              height: 1400,
              sillHeight: 800,
              type: 'casement',
              roomId: 'r-living',
            },
            {
              id: 'win-master',
              floorId: 'f-case-a-0',
              wallId: 'w-ext-west',
              position: { x: 0, y: 5500 },
              width: 1500,
              height: 1200,
              sillHeight: 900,
              type: 'casement',
              roomId: 'r-master-bed',
            },
          ],
          stairs: [],
          columns: [],
        },
      ],
      metadata: { projectId: 'project-case-a' },
    } as unknown as Building;

    const resA = await compileBuildingWithArchLang(caseABuilding, {
      generateDxf: true,
      generatePdf: true,
      generatePng: true,
    });

    expect(resA.success).toBe(true);
    expect(resA.status).toBe('ACCEPTED');
    expect(resA.parityReport?.passed).toBe(true);

    const archPath = path.join(artifactsDir, '2bhk.arch');
    const svgPath = path.join(artifactsDir, '2bhk.svg');
    const dxfPath = path.join(artifactsDir, '2bhk.dxf');
    const pdfPath = path.join(artifactsDir, '2bhk.pdf');
    const pngPath = path.join(artifactsDir, '2bhk.png');
    const parityPath = path.join(artifactsDir, '2bhk.parity.json');

    fs.writeFileSync(archPath, resA.source || '');
    fs.writeFileSync(svgPath, resA.svg || '');
    fs.writeFileSync(dxfPath, resA.dxf || '');
    fs.writeFileSync(pdfPath, Buffer.from(resA.pdf!));
    fs.writeFileSync(pngPath, Buffer.from(resA.png!));
    fs.writeFileSync(parityPath, JSON.stringify(resA.parityReport, null, 2));

    expect(fs.statSync(archPath).size).toBeGreaterThan(0);
    expect(fs.statSync(svgPath).size).toBeGreaterThan(0);
    expect(fs.statSync(dxfPath).size).toBeGreaterThan(0);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);
    expect(fs.statSync(pngPath).size).toBeGreaterThan(0);
    expect(fs.statSync(parityPath).size).toBeGreaterThan(0);

    // Verify file contents
    const dxfContent = fs.readFileSync(dxfPath, 'utf8');
    expect(dxfContent).toContain('SECTION');
    expect(dxfContent).toContain('EOF');

    const svgContent = fs.readFileSync(svgPath, 'utf8');
    expect(svgContent).toContain('<svg');
  }, 30000);

  const largeSite = {
    plotWidthMm: 70000,
    plotDepthMm: 70000,
    setbacksMm: { front: 5000, rear: 4000, left: 4000, right: 4000 },
    roadFacing: 'north' as const,
    orientationDegrees: 0,
  };

  it('Case B: generates and verifies 4-flat floor with common core artifacts', async () => {
    const plannedB = planDeterministicApartment({
      site: largeSite,
      flatsPerFloor: 4,
      unitMix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1050 },
      ],
      commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, commonLobby: true },
      strategy: 'balanced',
      seed: 404,
    });

    expect(plannedB.success).toBe(true);
    expect(plannedB.canonicalBuilding).toBeDefined();

    const resB = await compileBuildingWithArchLang(plannedB.canonicalBuilding!, {
      generateDxf: true,
      generatePdf: true,
      generatePng: true,
    });

    expect(resB.success).toBe(true);
    expect(resB.status).toBe('ACCEPTED');
    expect(resB.parityReport?.passed).toBe(true);

    const archPath = path.join(artifactsDir, 'four-flat.arch');
    const svgPath = path.join(artifactsDir, 'four-flat.svg');
    const dxfPath = path.join(artifactsDir, 'four-flat.dxf');
    const pdfPath = path.join(artifactsDir, 'four-flat.pdf');
    const pngPath = path.join(artifactsDir, 'four-flat.png');
    const parityPath = path.join(artifactsDir, 'four-flat.parity.json');

    fs.writeFileSync(archPath, resB.source || '');
    fs.writeFileSync(svgPath, resB.svg || '');
    fs.writeFileSync(dxfPath, resB.dxf || '');
    fs.writeFileSync(pdfPath, Buffer.from(resB.pdf!));
    fs.writeFileSync(pngPath, Buffer.from(resB.png!));
    fs.writeFileSync(parityPath, JSON.stringify(resB.parityReport, null, 2));

    expect(fs.statSync(archPath).size).toBeGreaterThan(0);
    expect(fs.statSync(svgPath).size).toBeGreaterThan(0);
    expect(fs.statSync(dxfPath).size).toBeGreaterThan(0);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);
    expect(fs.statSync(pngPath).size).toBeGreaterThan(0);
    expect(fs.statSync(parityPath).size).toBeGreaterThan(0);

    const dxfContent = fs.readFileSync(dxfPath, 'utf8');
    expect(dxfContent).toContain('SECTION');
    expect(dxfContent).toContain('EOF');
  }, 30000);

  it('Case C: generates and verifies multi-storey apartment artifacts', async () => {
    const plannedB = planDeterministicApartment({
      site: largeSite,
      flatsPerFloor: 4,
      unitMix: [
        { unitType: '2BHK', count: 2, carpetAreaSqFt: 750 },
        { unitType: '3BHK', count: 2, carpetAreaSqFt: 1050 },
      ],
      commonCore: { passengerLifts: 2, serviceLifts: 0, staircaseCount: 2, commonLobby: true },
      strategy: 'balanced',
      seed: 404,
    });

    const groundFloorB = plannedB.canonicalBuilding!.floors[0]!;
    const multiStoreyBuilding: Building = {
      ...plannedB.canonicalBuilding!,
      id: 'bldg-case-c-multistorey',
      name: 'Multi-Storey Residential Tower',
      floors: [
        groundFloorB,
        {
          ...groundFloorB,
          id: `${groundFloorB.id}_lvl1`,
          buildingId: plannedB.canonicalBuilding!.id,
          level: 1,
          name: 'First Floor',
          rooms: groundFloorB.rooms.map(r => ({
            ...r,
            id: `${r.id}_l1`,
            floorId: `${groundFloorB.id}_lvl1`,
            tags: (r.tags ?? []).map(t => (t.startsWith('flat:') ? `${t}_l1` : t)),
          })),
          walls: groundFloorB.walls.map(w => ({ ...w, id: `${w.id}_l1`, floorId: `${groundFloorB.id}_lvl1` })),
          doors: groundFloorB.doors.map(d => ({ ...d, id: `${d.id}_l1`, floorId: `${groundFloorB.id}_lvl1`, wallId: d.wallId ? `${d.wallId}_l1` : d.wallId })),
          windows: groundFloorB.windows.map(w => ({ ...w, id: `${w.id}_l1`, floorId: `${groundFloorB.id}_lvl1`, wallId: w.wallId ? `${w.wallId}_l1` : w.wallId })),
          stairs: groundFloorB.stairs.map(s => ({ ...s, id: `${s.id}_l1`, floorId: `${groundFloorB.id}_lvl1` })),
        },
      ],
    };

    const resC = await compileBuildingWithArchLang(multiStoreyBuilding, {
      generateDxf: true,
      generatePdf: true,
      generatePng: true,
    });

    expect(resC.success).toBe(true);
    expect(resC.status).toBe('ACCEPTED');
    expect(resC.parityReport?.passed).toBe(true);
    expect(resC.pages).toHaveLength(2);

    const archPath = path.join(artifactsDir, 'multistorey.arch');
    const svgLvl0Path = path.join(artifactsDir, 'multistorey-lvl0.svg');
    const svgLvl1Path = path.join(artifactsDir, 'multistorey-lvl1.svg');
    const dxfLvl0Path = path.join(artifactsDir, 'multistorey-lvl0.dxf');
    const dxfLvl1Path = path.join(artifactsDir, 'multistorey-lvl1.dxf');
    const pdfPath = path.join(artifactsDir, 'multistorey.pdf');
    const pngPath = path.join(artifactsDir, 'multistorey.png');
    const parityPath = path.join(artifactsDir, 'multistorey.parity.json');

    fs.writeFileSync(archPath, resC.source || '');
    fs.writeFileSync(svgLvl0Path, resC.pages![0]!.svg);
    fs.writeFileSync(svgLvl1Path, resC.pages![1]!.svg);

    const floor0Building = { ...multiStoreyBuilding, floors: [multiStoreyBuilding.floors[0]!] } as unknown as Building;
    const floor1Building = { ...multiStoreyBuilding, floors: [multiStoreyBuilding.floors[1]!] } as unknown as Building;
    fs.writeFileSync(dxfLvl0Path, compileBuildingToDxf(floor0Building));
    fs.writeFileSync(dxfLvl1Path, compileBuildingToDxf(floor1Building));

    fs.writeFileSync(pdfPath, Buffer.from(resC.pdf!));
    fs.writeFileSync(pngPath, Buffer.from(resC.png!));
    fs.writeFileSync(parityPath, JSON.stringify(resC.parityReport, null, 2));

    expect(fs.statSync(archPath).size).toBeGreaterThan(0);
    expect(fs.statSync(svgLvl0Path).size).toBeGreaterThan(0);
    expect(fs.statSync(svgLvl1Path).size).toBeGreaterThan(0);
    expect(fs.statSync(dxfLvl0Path).size).toBeGreaterThan(0);
    expect(fs.statSync(dxfLvl1Path).size).toBeGreaterThan(0);
    expect(fs.statSync(pdfPath).size).toBeGreaterThan(0);
    expect(fs.statSync(pngPath).size).toBeGreaterThan(0);
    expect(fs.statSync(parityPath).size).toBeGreaterThan(0);
  }, 30000);
});
