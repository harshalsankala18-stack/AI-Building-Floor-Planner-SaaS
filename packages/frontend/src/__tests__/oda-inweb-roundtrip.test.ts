import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseDxfToDrawingModel,
  OdaInwebCadSession,
  syncDxfToCanonicalBuilding,
  ODA_INWEB_EVALUATION,
} from '../services/oda-inweb-adapter';
import { generateArchitecturalDxf } from '../services/export-system';
import { Building3DProjector } from '@ai-floor-planner/projection-3d';
import {
  LocalStorageProjectStorage,
  type ProjectEnvelope,
  type FloorPlanImageRevision,
  CURRENT_PROJECT_SCHEMA_VERSION,
  createCanonical30x50_2BHK,
} from '../services/storage';

describe('ODA Drawings inWEB™ Technical Proof of Concept — Round-Trip Verification', () => {
  let baseBuilding = createCanonical30x50_2BHK();
  let generatedDxf = '';

  beforeEach(() => {
    // Provide in-memory localStorage polyfill if run in node environment
    if (typeof globalThis.localStorage === 'undefined') {
      const store = new Map<string, string>();
      (globalThis as any).localStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, String(v)),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
        get length() { return store.size; },
        key: (i: number) => Array.from(store.keys())[i] ?? null,
      };
    } else {
      localStorage.clear();
    }

    baseBuilding = createCanonical30x50_2BHK();
    generatedDxf = generateArchitecturalDxf(baseBuilding);
  });

  // 1. Load a DXF generated from the existing canonical Building model
  it('Criterion 1: loads and parses DXF generated from canonical Building model', () => {
    expect(generatedDxf).toContain('SECTION');
    expect(generatedDxf).toContain('AC1009');
    expect(generatedDxf).toContain('WALLS');
    expect(generatedDxf).toContain('ROOMS');

    const model = parseDxfToDrawingModel(generatedDxf);
    expect(model.layers.size).toBeGreaterThanOrEqual(10);
    expect(model.entities.length).toBeGreaterThan(0);

    const wallLines = model.entities.filter(e => e.entityType === 'LINE' && (e.layer === 'WALLS' || e.layer === 'INTERNAL_WALLS'));
    const roomPolys = model.entities.filter(e => e.entityType === 'POLYLINE' && e.layer === 'ROOMS');

    expect(wallLines.length).toBeGreaterThanOrEqual(baseBuilding.floors[0]!.walls.length);
    expect(roomPolys.length).toBeGreaterThanOrEqual(baseBuilding.floors[0]!.rooms.length);
  });

  // 2. Display in React application (model structure and layer table verified)
  it('Criterion 2: creates valid CAD model data structure ready for React canvas display', () => {
    const session = new OdaInwebCadSession(generatedDxf);
    const model = session.getModel();

    expect(model.layers.has('WALLS')).toBe(true);
    expect(model.layers.has('ROOMS')).toBe(true);
    expect(model.layers.has('DIMENSIONS')).toBe(true);
    expect(model.layers.get('WALLS')?.visible).toBe(true);

    const livingRoomPoly = model.entities.find(e =>
      e.entityType === 'POLYLINE' && e.metadata?.roomName?.toLowerCase().includes('living')
    );
    expect(livingRoomPoly).toBeDefined();
  });

  // 3. Select and edit an existing wall
  it('Criterion 3: selects and edits an existing wall geometry and attributes', () => {
    const session = new OdaInwebCadSession(generatedDxf);
    const model = session.getModel();
    const targetWall = model.entities.find(e => e.entityType === 'LINE' && e.layer === 'WALLS');
    expect(targetWall).toBeDefined();

    session.selectEntity(targetWall!.id);
    expect(session.getSelectedEntity()?.id).toBe(targetWall!.id);

    const oldStartX = (targetWall as any).start.x;
    const newStartX = oldStartX + 500;

    const ok = session.updateWall(targetWall!.id, {
      start: { x: newStartX, y: (targetWall as any).start.y },
      thickness: 230,
      layer: 'INTERNAL_WALLS',
    });
    expect(ok).toBe(true);

    const updatedWall = session.getModel().entities.find(e => e.id === targetWall!.id) as any;
    expect(updatedWall.start.x).toBe(newStartX);
    expect(updatedWall.thickness).toBe(230);
    expect(updatedWall.layer).toBe('INTERNAL_WALLS');
  });

  // 4. Resize or move a room's corresponding geometry
  it('Criterion 4: resizes and moves a room corresponding geometry', () => {
    const session = new OdaInwebCadSession(generatedDxf);
    const model = session.getModel();
    const targetRoom = model.entities.find(e => e.entityType === 'POLYLINE' && e.layer === 'ROOMS');
    expect(targetRoom).toBeDefined();

    const ok = session.resizeRoom(targetRoom!.id, {
      newWidth: 4500,
      newHeight: 5200,
      dx: 200,
      dy: 100,
    });
    expect(ok).toBe(true);

    const updatedPoly = session.getModel().entities.find(e => e.id === targetRoom!.id) as any;
    const xs = updatedPoly.vertices.map((v: any) => v.x);
    const ys = updatedPoly.vertices.map((v: any) => v.y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    expect(width).toBe(4500);
    expect(height).toBe(5200);
  });

  // 5. Edit dimensions and layers
  it('Criterion 5: edits layer visibility and dimension annotations', () => {
    const session = new OdaInwebCadSession(generatedDxf);

    // Toggle layer visibility
    expect(session.getModel().layers.get('DIMENSIONS')?.visible).toBe(true);
    session.toggleLayerVisibility('DIMENSIONS');
    expect(session.getModel().layers.get('DIMENSIONS')?.visible).toBe(false);

    // Change layer color
    session.setLayerColor('WALLS', 3); // Green
    expect(session.getModel().layers.get('WALLS')?.color).toBe(3);

    // Edit dimension text
    const dimEntity = session.getModel().entities.find(e => e.entityType === 'TEXT' && e.layer === 'DIMENSIONS');
    if (dimEntity) {
      session.editDimensionText(dimEntity.id, '4.50m x 5.20m (CUSTOM)');
      const updatedDim = session.getModel().entities.find(e => e.id === dimEntity.id) as any;
      expect(updatedDim.text).toBe('4.50m x 5.20m (CUSTOM)');
    }
  });

  // 6. Use undo and redo
  it('Criterion 6: supports multi-level undo and redo', () => {
    const session = new OdaInwebCadSession(generatedDxf);
    const targetWall = session.getModel().entities.find(e => e.entityType === 'LINE' && e.layer === 'WALLS')!;
    const originalStart = { ...(targetWall as any).start };

    expect(session.getCanUndo()).toBe(false);

    // Perform Edit 1
    session.updateWall(targetWall.id, { start: { x: originalStart.x + 400, y: originalStart.y } });
    expect(session.getCanUndo()).toBe(true);
    expect(session.getUndoCount()).toBe(1);

    // Perform Edit 2
    session.toggleLayerVisibility('WALLS');
    expect(session.getUndoCount()).toBe(2);

    // Undo Edit 2
    session.undo();
    expect(session.getModel().layers.get('WALLS')?.visible).toBe(true);
    expect(session.getCanRedo()).toBe(true);

    // Undo Edit 1
    session.undo();
    const wallAfterDoubleUndo = session.getModel().entities.find(e => e.id === targetWall.id) as any;
    expect(wallAfterDoubleUndo.start.x).toBe(originalStart.x);
    expect(session.getCanUndo()).toBe(false);

    // Redo Edit 1
    session.redo();
    const wallAfterRedo = session.getModel().entities.find(e => e.id === targetWall.id) as any;
    expect(wallAfterRedo.start.x).toBe(originalStart.x + 400);

    // Redo Edit 2
    session.redo();
    expect(session.getModel().layers.get('WALLS')?.visible).toBe(false);
  });

  // 7. Save the modified drawing
  it('Criterion 7: serializes modified CAD model back to valid standard DXF', () => {
    const session = new OdaInwebCadSession(generatedDxf);
    const targetRoom = session.getModel().entities.find(e => e.entityType === 'POLYLINE' && e.layer === 'ROOMS')!;
    session.resizeRoom(targetRoom.id, { newWidth: 4800, newHeight: 5000 });

    const savedDxf = session.saveModifiedDxf();
    expect(savedDxf).toContain('SECTION');
    expect(savedDxf).toContain('AC1009');
    expect(savedDxf).toContain('4.80m x 5.00m');
    expect(savedDxf).toContain('EOF');

    // Re-parse saved DXF to verify syntax round-trip integrity
    const reParsed = parseDxfToDrawingModel(savedDxf);
    expect(reParsed.entities.length).toBeGreaterThan(0);
  });

  // 8. Critical Acceptance Test: Read modified drawing back into canonical Building model
  it('Criterion 8: reads modified DXF back into canonical Building model', () => {
    const session = new OdaInwebCadSession(generatedDxf);
    const origRoom = baseBuilding.floors[0]!.rooms[0]!;

    // Resize this room in the ODA CAD session
    const matchedPoly = session.getModel().entities.find(e =>
      e.entityType === 'POLYLINE' && e.metadata?.roomName?.toLowerCase() === origRoom.name.toLowerCase()
    )!;
    expect(matchedPoly).toBeDefined();

    const targetW = 4200;
    const targetH = 4600;
    session.resizeRoom(matchedPoly.id, { newWidth: targetW, newHeight: targetH });

    // Also edit a wall
    const matchedWall = session.getModel().entities.find(e => e.entityType === 'LINE' && e.layer === 'WALLS')!;
    session.updateWall(matchedWall.id, {
      start: { x: (matchedWall as any).start.x + 150, y: (matchedWall as any).start.y },
    });

    const modifiedDxf = session.saveModifiedDxf();

    // Execute critical sync round-trip
    const syncRes = syncDxfToCanonicalBuilding(modifiedDxf, baseBuilding);
    expect(syncRes.modifiedRoomsCount).toBeGreaterThan(0);
    expect(syncRes.updatedBuilding.version).toBe(baseBuilding.version + 1);

    const updatedRoom = syncRes.updatedBuilding.floors[0]!.rooms.find(r => r.id === origRoom.id)!;
    expect(updatedRoom.width).toBe(targetW);
    expect(updatedRoom.height).toBe(targetH);
    expect(updatedRoom.area).toBe(targetW * targetH);
    expect(updatedRoom.boundary.points.length).toBe(4);
  });

  // 9. Verify that all corresponding edits appear in the existing Three.js 3D model
  it('Criterion 9: synchronizes modified canonical building into 3D projection model', () => {
    const session = new OdaInwebCadSession(generatedDxf);
    const origRoom = baseBuilding.floors[0]!.rooms[0]!;

    const matchedPoly = session.getModel().entities.find(e =>
      e.entityType === 'POLYLINE' && e.metadata?.roomName?.toLowerCase() === origRoom.name.toLowerCase()
    )!;
    session.resizeRoom(matchedPoly.id, { newWidth: 5000, newHeight: 5500 });

    const modifiedDxf = session.saveModifiedDxf();
    const { updatedBuilding } = syncDxfToCanonicalBuilding(modifiedDxf, baseBuilding);

    // Project canonical building into 3D using existing Building3DProjector
    const projector = new Building3DProjector();
    const projection = projector.project(updatedBuilding);

    expect(projection.levels.length).toBe(updatedBuilding.floors.length);
    expect(projection.rooms.length).toBe(updatedBuilding.floors[0]!.rooms.length);
    expect(projection.walls.length).toBeGreaterThan(0);

    const projectedRoom = projection.rooms.find(r => r.sourceEntityId === origRoom.id)!;
    expect(projectedRoom).toBeDefined();

    const xs = projectedRoom.boundary.points.map(p => p.x);
    const ys = projectedRoom.boundary.points.map(p => p.y);
    const projW = Math.max(...xs) - Math.min(...xs);
    const projH = Math.max(...ys) - Math.min(...ys);
    expect(projW).toBe(5000);
    expect(projH).toBe(5500);
  });

  // 10. Confirm that project persistence and revision history remain functional
  it('Criterion 10: confirms project storage persistence and revision history integrity', () => {
    const storage = new LocalStorageProjectStorage();
    const session = new OdaInwebCadSession(generatedDxf);
    const origRoom = baseBuilding.floors[0]!.rooms[0]!;

    const matchedPoly = session.getModel().entities.find(e =>
      e.entityType === 'POLYLINE' && e.metadata?.roomName?.toLowerCase() === origRoom.name.toLowerCase()
    )!;
    session.resizeRoom(matchedPoly.id, { newWidth: 4400, newHeight: 4800 });

    const { updatedBuilding } = syncDxfToCanonicalBuilding(session.saveModifiedDxf(), baseBuilding);

    const rev: FloorPlanImageRevision = {
      schemaVersion: 1,
      revisionNumber: 1,
      revisionId: 'rev_oda_01',
      generationId: 'gen_oda_sync',
      seed: 42,
      attempt: 1,
      generatedAt: new Date().toISOString(),
      promptVersion: 1,
      model: 'oda-inweb-sync',
      provider: 'oda',
      mimeType: 'image/jpeg',
      imageBase64: 'BASE64',
      request: {} as any,
      contextSignature: 'oda-cad-sync',
      editInstruction: 'Synced CAD modifications from ODA inWEB Proof-of-Concept',
    };

    const envelope: ProjectEnvelope = {
      schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
      projectId: updatedBuilding.projectId,
      name: updatedBuilding.name,
      createdAt: updatedBuilding.createdAt,
      updatedAt: updatedBuilding.updatedAt,
      building: updatedBuilding,
      imageRevisions: [rev],
    };

    // Save to storage
    storage.save(envelope);

    // Load from storage and verify
    const loaded = storage.load(updatedBuilding.projectId);
    expect(loaded).toBeDefined();
    expect(loaded?.building.version).toBe(updatedBuilding.version);
    expect(loaded?.building.floors[0]!.rooms.find(r => r.id === origRoom.id)?.width).toBe(4400);
    expect(loaded?.imageRevisions?.length).toBe(1);
    expect(loaded?.imageRevisions?.[0]?.revisionId).toBe('rev_oda_01');
  });

  // Evaluation metadata check
  it('verifies ODA inWEB licensing, readiness, documentation, and pricing metrics', () => {
    expect(ODA_INWEB_EVALUATION.estimatedAnnualCostUsd).toBe(7500);
    expect(ODA_INWEB_EVALUATION.licensingTierRequired).toContain('Sustaining');
    expect(ODA_INWEB_EVALUATION.productionReadinessScore).toBeGreaterThan(70);
    expect(ODA_INWEB_EVALUATION.memoryFootprintMb.wasmBundleCompressedMb).toBeGreaterThan(30);
  });
});
