/**
 * Conceptual Structural Coordination Engine — Phase 2.4.
 *
 * Implements preliminary architectural-structural coordination:
 * - Structural grid derivation from major wall alignments and room boundaries
 * - Candidate column footprint placement (230x380mm / 230x230mm) at wall junctions
 * - Floor-to-floor vertical continuity and alignment checks
 * - Clash avoidance with door swings, windows, and circulation
 * - Conceptual framing beams connecting structural columns
 * - Diagnostic checks: excessive spans, cantilevers, vertical misalignment
 *
 * MANDATORY DISCLAIMER:
 * CONCEPTUAL STRUCTURAL COORDINATION — ENGINEER REVIEW REQUIRED.
 * All structural grids, column locations, and beam spans are preliminary geometric
 * coordination overlays only. They do not constitute certified structural engineering,
 * reinforcement detailing, or load-bearing calculations.
 */

import {
  type Building,
  type Column,
  type Floor,
  type Point,
  ColumnShape,
} from '@ai-floor-planner/core';
import { pointInPolygon } from '@ai-floor-planner/geometry-engine';

export const STRUCTURAL_COORDINATION_DISCLAIMER =
  'CONCEPTUAL STRUCTURAL COORDINATION — ENGINEER REVIEW REQUIRED. ' +
  'All structural grids, column locations, and beam spans are preliminary geometric ' +
  'coordination overlays only. They do not constitute certified structural engineering, ' +
  'reinforcement detailing, or load-bearing calculations.';

export interface StructuralGridLine {
  readonly id: string;
  readonly axis: 'X' | 'Y';
  readonly coordinate: number;
  readonly label: string;
}

export interface ConceptualBeam {
  readonly id: string;
  readonly floorId: string;
  readonly startColumnId: string;
  readonly endColumnId: string;
  readonly startPoint: Point;
  readonly endPoint: Point;
  readonly spanMm: number;
  readonly widthMm: number;
  readonly depthMm: number;
  readonly isPrimary: boolean;
  readonly gridReference?: string;
}

export interface StructuralClash {
  readonly id: string;
  readonly type: 'DOOR_INTERSECTION' | 'WINDOW_INTERSECTION' | 'CIRCULATION_BLOCK' | 'STAIR_CLEARANCE';
  readonly columnId: string;
  readonly targetEntityId: string;
  readonly description: string;
  readonly severity: 'ERROR' | 'WARNING';
}

export interface StructuralDiagnostic {
  readonly id: string;
  readonly code:
    | 'EXCESSIVE_SPAN'
    | 'UNSUPPORTED_BEAM_END'
    | 'DISCONTINUOUS_VERTICAL_SUPPORT'
    | 'COLUMN_OUTSIDE_FOOTPRINT'
    | 'STRUCTURAL_CLASH';
  readonly severity: 'WARNING' | 'NOTICE';
  readonly message: string;
  readonly explanation: string;
  readonly affectedEntities: readonly string[];
}

export interface ConceptualStructuralSystem {
  readonly floorId: string;
  readonly level: number;
  readonly columns: readonly Column[];
  readonly beams: readonly ConceptualBeam[];
  readonly xGridLines: readonly StructuralGridLine[];
  readonly yGridLines: readonly StructuralGridLine[];
  readonly clashes: readonly StructuralClash[];
  readonly diagnostics: readonly StructuralDiagnostic[];
  readonly notice: string;
}

export interface BuildingStructuralCoordination {
  readonly buildingId: string;
  readonly building: Building;
  readonly systems: readonly ConceptualStructuralSystem[];
  readonly allColumns: readonly Column[];
  readonly allBeams: readonly ConceptualBeam[];
  readonly globalDiagnostics: readonly StructuralDiagnostic[];
  readonly disclaimer: string;
}

const CLUSTER_TOLERANCE_MM = 350; // Align walls/points within 350mm into one structural grid line
const MAX_RECOMMENDED_SPAN_MM = 5500; // 5.5 meters max standard residential span without heavy beams
const STANDARD_COLUMN_WIDTH_MM = 230;
const STANDARD_COLUMN_DEPTH_MM = 380;

function clusterCoordinates(coords: number[], tolerance: number): number[] {
  if (coords.length === 0) return [];
  const sorted = [...coords].sort((a, b) => a - b);
  const clusters: number[][] = [];
  let currentCluster = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const val = sorted[i]!;
    const clusterAvg = currentCluster.reduce((s, v) => s + v, 0) / currentCluster.length;
    if (Math.abs(val - clusterAvg) <= tolerance) {
      currentCluster.push(val);
    } else {
      clusters.push(currentCluster);
      currentCluster = [val];
    }
  }
  clusters.push(currentCluster);

  return clusters.map(c => Math.round(c.reduce((s, v) => s + v, 0) / c.length));
}

function letterForIndex(idx: number): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (idx < letters.length) return letters[idx]!;
  return `A${letters[idx % letters.length]}`;
}

function distToSegment(p: Point, v: Point, w: Point): number {
  const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

export class StructuralCoordinationEngine {
  /**
   * Static convenience method
   */
  public static coordinateBuilding(building: Building): BuildingStructuralCoordination {
    return new StructuralCoordinationEngine().coordinateBuilding(building);
  }

  /**
   * Coordinate structural grid, columns, beams and diagnostics for a building.
   * Returns enriched building with coordinated columns and structural reports.
   */
  coordinateBuilding(building: Building): BuildingStructuralCoordination {
    if (building.floors.length === 0) {
      return {
        buildingId: building.id,
        building,
        systems: [],
        allColumns: [],
        allBeams: [],
        globalDiagnostics: [],
        disclaimer: STRUCTURAL_COORDINATION_DISCLAIMER,
      };
    }

    // 1. Derive global building structural grid from ground floor & major perimeter alignments
    const groundFloor = building.floors[0]!;
    const allFloorPoints: Point[] = [];

    building.floors.forEach(floor => {
      floor.rooms.forEach(room => {
        allFloorPoints.push({ x: room.x, y: room.y });
        allFloorPoints.push({ x: room.x + room.width, y: room.y });
        allFloorPoints.push({ x: room.x, y: room.y + room.height });
        allFloorPoints.push({ x: room.x + room.width, y: room.y + room.height });
        if (room.boundary && room.boundary.points) {
          allFloorPoints.push(...room.boundary.points);
        }
      });
      floor.walls.forEach(wall => {
        allFloorPoints.push(wall.startPoint);
        allFloorPoints.push(wall.endPoint);
      });
      if (floor.boundary && floor.boundary.points) {
        allFloorPoints.push(...floor.boundary.points);
      }
    });

    const xCoords = clusterCoordinates(allFloorPoints.map(p => p.x), CLUSTER_TOLERANCE_MM);
    const yCoords = clusterCoordinates(allFloorPoints.map(p => p.y), CLUSTER_TOLERANCE_MM);

    const xGridLines: StructuralGridLine[] = xCoords.map((x, idx) => ({
      id: `grid-x-${idx + 1}`,
      axis: 'X',
      coordinate: x,
      label: String(idx + 1),
    }));

    const yGridLines: StructuralGridLine[] = yCoords.map((y, idx) => ({
      id: `grid-y-${idx + 1}`,
      axis: 'Y',
      coordinate: y,
      label: letterForIndex(idx),
    }));

    // 2. Candidate Column Placement on Ground Floor
    // Candidate column points: grid intersections that align with load-bearing walls / corners
    const candidateJunctions: { point: Point; gridRef: string; priority: number }[] = [];

    xGridLines.forEach(xLine => {
      yGridLines.forEach(yLine => {
        const pt: Point = { x: xLine.coordinate, y: yLine.coordinate };
        const gridRef = `${yLine.label}-${xLine.label}`;

        let wallMatchCount = 0;
        let isPerimeterCorner = false;
        let isRoomCorner = false;
        let isOnWall = false;

        // Check if pt aligns with any wall on ground floor
        groundFloor.walls.forEach(wall => {
          const dStart = Math.hypot(wall.startPoint.x - pt.x, wall.startPoint.y - pt.y);
          const dEnd = Math.hypot(wall.endPoint.x - pt.x, wall.endPoint.y - pt.y);
          if (dStart <= CLUSTER_TOLERANCE_MM || dEnd <= CLUSTER_TOLERANCE_MM) {
            wallMatchCount++;
          }
          if (distToSegment(pt, wall.startPoint, wall.endPoint) <= CLUSTER_TOLERANCE_MM) {
            isOnWall = true;
          }
        });

        // Check room corners
        groundFloor.rooms.forEach(room => {
          const corners: Point[] = [
            { x: room.x, y: room.y },
            { x: room.x + room.width, y: room.y },
            { x: room.x + room.width, y: room.y + room.height },
            { x: room.x, y: room.y + room.height },
          ];
          if (room.boundary && room.boundary.points) {
            corners.push(...room.boundary.points);
          }
          if (corners.some(c => Math.hypot(c.x - pt.x, c.y - pt.y) <= CLUSTER_TOLERANCE_MM)) {
            isRoomCorner = true;
          }
        });

        // Check building boundary corners
        if (groundFloor.boundary && groundFloor.boundary.points) {
          const isCorner = groundFloor.boundary.points.some(
            bp => Math.hypot(bp.x - pt.x, bp.y - pt.y) <= CLUSTER_TOLERANCE_MM
          );
          if (isCorner) isPerimeterCorner = true;
        }

        if (isPerimeterCorner || isRoomCorner || wallMatchCount >= 1 || isOnWall) {
          let priority = 20;
          if (isPerimeterCorner) priority += 50;
          if (isRoomCorner) priority += 40;
          if (wallMatchCount >= 2) priority += 30;
          else if (wallMatchCount === 1) priority += 20;
          if (isOnWall) priority += 10;

          candidateJunctions.push({
            point: pt,
            gridRef,
            priority,
          });
        }
      });
    });

    // Filter out candidate columns that are too close (< 2.2m)
    const filteredPoints: { point: Point; gridRef: string }[] = [];
    candidateJunctions.sort((a, b) => b.priority - a.priority);

    for (const cand of candidateJunctions) {
      const tooClose = filteredPoints.some(
        existing => Math.hypot(existing.point.x - cand.point.x, existing.point.y - cand.point.y) < 2200
      );
      if (!tooClose) {
        filteredPoints.push(cand);
      }
    }

    // Sort columns deterministically by Y then X
    filteredPoints.sort((a, b) => a.point.y !== b.point.y ? a.point.y - b.point.y : a.point.x - b.point.x);

    // 3. Synthesize Columns per Floor (Enforcing Vertical Continuity)
    const systems: ConceptualStructuralSystem[] = [];
    const allColumns: Column[] = [];
    const allBeams: ConceptualBeam[] = [];
    const globalDiagnostics: StructuralDiagnostic[] = [];

    // Keep map of column ID per floor to verify vertical support
    const columnsByLevel = new Map<number, Column[]>();

    const updatedFloors: Floor[] = building.floors.map(floor => {
      const floorColumns: Column[] = [];
      const floorClashes: StructuralClash[] = [];
      const floorDiagnostics: StructuralDiagnostic[] = [];

      filteredPoints.forEach((cand, idx) => {
        const colId = `col-${floor.level}-${idx + 1}`;
        const colPos = { ...cand.point };

        // Test boundary containment
        const inBoundary = floor.boundary && floor.boundary.points.length >= 3
          ? pointInPolygon(colPos, floor.boundary)
          : true;

        if (!inBoundary) {
          floorDiagnostics.push({
            id: `diag-outside-${colId}`,
            code: 'COLUMN_OUTSIDE_FOOTPRINT',
            severity: 'WARNING',
            message: `Column ${colId} at ${cand.gridRef} falls outside floor ${floor.level} boundary.`,
            explanation: 'Columns must be enclosed within the building footprint boundary plate.',
            affectedEntities: [colId],
          });
          return; // Do not place column outside envelope
        }

        // Test clash with doors
        floor.doors.forEach(door => {
          const dist = Math.hypot(door.position.x - colPos.x, door.position.y - colPos.y);
          if (dist < door.width * 0.8) {
            floorClashes.push({
              id: `clash-${colId}-${door.id}`,
              type: 'DOOR_INTERSECTION',
              columnId: colId,
              targetEntityId: door.id,
              description: `Column ${cand.gridRef} encroaches on door opening ${door.id}.`,
              severity: 'WARNING',
            });
          }
        });

        // Test clash with windows
        floor.windows.forEach(win => {
          const dist = Math.hypot(win.position.x - colPos.x, win.position.y - colPos.y);
          if (dist < win.width * 0.5) {
            floorClashes.push({
              id: `clash-${colId}-${win.id}`,
              type: 'WINDOW_INTERSECTION',
              columnId: colId,
              targetEntityId: win.id,
              description: `Column ${cand.gridRef} interferes with glazed window opening ${win.id}.`,
              severity: 'WARNING',
            });
          }
        });

        // Test clash with stairs
        floor.stairs.forEach(stair => {
          const insideStair = stair.boundary && stair.boundary.points.length >= 3
            ? pointInPolygon(colPos, stair.boundary)
            : (colPos.x >= stair.x && colPos.x <= stair.x + stair.width &&
               colPos.y >= stair.y && colPos.y <= stair.y + stair.length);

          if (insideStair) {
            floorClashes.push({
              id: `clash-${colId}-${stair.id}`,
              type: 'STAIR_CLEARANCE',
              columnId: colId,
              targetEntityId: stair.id,
              description: `Column ${cand.gridRef} penetrates staircase flight clearance ${stair.id}.`,
              severity: 'ERROR',
            });
          }
        });

        const column: Column = {
          id: colId,
          floorId: floor.id,
          position: colPos,
          width: STANDARD_COLUMN_WIDTH_MM,
          depth: STANDARD_COLUMN_DEPTH_MM,
          shape: ColumnShape.Rectangular,
          isStructural: true,
          gridReference: cand.gridRef,
        };

        floorColumns.push(column);
      });

      // 4. Generate Conceptual Beams between adjacent columns
      const floorBeams: ConceptualBeam[] = [];
      for (let i = 0; i < floorColumns.length; i++) {
        for (let j = i + 1; j < floorColumns.length; j++) {
          const c1 = floorColumns[i]!;
          const c2 = floorColumns[j]!;
          const span = Math.hypot(c2.position.x - c1.position.x, c2.position.y - c1.position.y);

          // Connect if columns share X or Y grid line and span is reasonable (< 9.5m)
          const isAlignedX = Math.abs(c1.position.x - c2.position.x) <= CLUSTER_TOLERANCE_MM;
          const isAlignedY = Math.abs(c1.position.y - c2.position.y) <= CLUSTER_TOLERANCE_MM;

          if ((isAlignedX || isAlignedY) && span <= 9500) {
            // Check if there is an intermediate column between them on the same axis
            const hasIntermediate = floorColumns.some(other => {
              if (other.id === c1.id || other.id === c2.id) return false;
              if (isAlignedX && Math.abs(other.position.x - c1.position.x) <= CLUSTER_TOLERANCE_MM) {
                const minY = Math.min(c1.position.y, c2.position.y);
                const maxY = Math.max(c1.position.y, c2.position.y);
                return other.position.y > minY + 200 && other.position.y < maxY - 200;
              }
              if (isAlignedY && Math.abs(other.position.y - c1.position.y) <= CLUSTER_TOLERANCE_MM) {
                const minX = Math.min(c1.position.x, c2.position.x);
                const maxX = Math.max(c1.position.x, c2.position.x);
                return other.position.x > minX + 200 && other.position.x < maxX - 200;
              }
              return false;
            });

            if (!hasIntermediate) {
              const beamId = `beam-${floor.level}-${c1.id}-${c2.id}`;
              const isExcessiveSpan = span > MAX_RECOMMENDED_SPAN_MM;

              if (isExcessiveSpan) {
                floorDiagnostics.push({
                  id: `diag-span-${beamId}`,
                  code: 'EXCESSIVE_SPAN',
                  severity: 'WARNING',
                  message: `Beam span of ${(span / 1000).toFixed(1)}m between ${c1.gridReference} and ${c2.gridReference} exceeds 5.5m limit.`,
                  explanation: 'Excessive spans in residential RCC construction require deep beam sections or intermediate transfer columns.',
                  affectedEntities: [c1.id, c2.id],
                });
              }

              floorBeams.push({
                id: beamId,
                floorId: floor.id,
                startColumnId: c1.id,
                endColumnId: c2.id,
                startPoint: c1.position,
                endPoint: c2.position,
                spanMm: Math.round(span),
                widthMm: STANDARD_COLUMN_WIDTH_MM,
                depthMm: Math.max(350, Math.round(span / 12)), // L/12 preliminary depth estimate
                isPrimary: true,
                gridReference: `${c1.gridReference} → ${c2.gridReference}`,
              });
            }
          }
        }
      }

      columnsByLevel.set(floor.level, floorColumns);
      allColumns.push(...floorColumns);
      allBeams.push(...floorBeams);

      const system: ConceptualStructuralSystem = {
        floorId: floor.id,
        level: floor.level,
        columns: floorColumns,
        beams: floorBeams,
        xGridLines,
        yGridLines,
        clashes: floorClashes,
        diagnostics: floorDiagnostics,
        notice: STRUCTURAL_COORDINATION_DISCLAIMER,
      };
      systems.push(system);

      return {
        ...floor,
        columns: floorColumns,
      };
    });

    // 5. Check Floor-to-Floor Vertical Support Continuity
    for (let lvl = 1; lvl < building.floors.length; lvl++) {
      const upperCols = columnsByLevel.get(lvl) ?? [];
      const lowerCols = columnsByLevel.get(lvl - 1) ?? [];

      upperCols.forEach(upCol => {
        const supported = lowerCols.some(
          lowCol => Math.hypot(lowCol.position.x - upCol.position.x, lowCol.position.y - upCol.position.y) <= 300
        );
        if (!supported) {
          globalDiagnostics.push({
            id: `diag-vertical-${upCol.id}`,
            code: 'DISCONTINUOUS_VERTICAL_SUPPORT',
            severity: 'WARNING',
            message: `Upper level column ${upCol.id} (${upCol.gridReference}) has no aligned support column on level ${lvl - 1}.`,
            explanation: 'Discontinuous columns induce severe bending moments in floor slabs and require heavy transfer girders.',
            affectedEntities: [upCol.id],
          });
        }
      });
    }

    const updatedBuilding: Building = {
      ...building,
      floors: updatedFloors,
    };

    return {
      buildingId: building.id,
      building: updatedBuilding,
      systems,
      allColumns,
      allBeams,
      globalDiagnostics,
      disclaimer: STRUCTURAL_COORDINATION_DISCLAIMER,
    };
  }
}
