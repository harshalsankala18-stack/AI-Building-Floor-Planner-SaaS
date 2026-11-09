/**
 * ArchLang Compilation Service — Production Architectural Plan Compiler.
 *
 * Invokes the official ArchLang engine (@chanmeng666/archlang v1.57.0) to compile,
 * validate, describe, lint, and render canonical Building Models.
 *
 * Strict Architectural Safety Gate:
 * 1. Generates valid, deterministic .arch DSL from the canonical Building Model.
 * 2. Compiles to vector SVG scene.
 * 3. Extracts semantic scene facts via describe().
 * 4. Runs architectural lint checks via lint().
 * 5. Runs the hard Geometry-Parity Validator.
 * 6. Generates multi-storey pages, DXF, and optional PDF/PNG outputs.
 * 7. Rejects any artifact that fails compiler errors or geometry-parity checks.
 */

import crypto from 'node:crypto';
import type { Building } from '@ai-floor-planner/core';
import * as archlang from '@chanmeng666/archlang';
import {
  buildingModelToArchLangSource,
  type ArchLangAdapterOptions,
  type ArchLangDiagnostic,
  type ArchLangSerializationResult,
  ARCHLANG_ADAPTER_VERSION,
  ARCHLANG_PACKAGE_VERSION,
} from './archlang-adapter';
import {
  validateGeometryParity,
  type GeometryParityReport,
} from './archlang-parity-validator';

// ─── Export & Result Types ────────────────────────────────────────────────────

export interface ArchLangPage {
  readonly level: number;
  readonly name?: string;
  readonly svg: string;
  readonly dxf?: string;
  readonly pdf?: Uint8Array;
  readonly png?: Uint8Array;
}

export interface ArchLangProvenance {
  readonly buildingId: string;
  readonly buildingVersion: number;
  readonly canonicalModelHash: string;
  readonly archlangVersion: string;
  readonly adapterVersion: string;
  readonly sourceHash: string;
  readonly outputHash?: string;
  readonly generatedAt: string;
  readonly exportStatus: 'ACCEPTED' | 'REJECTED';
}

export interface ArchLangExportResult {
  readonly success: boolean;
  readonly status: 'ACCEPTED' | 'REJECTED';
  readonly source: string;
  readonly sourceHash: string;
  readonly svg?: string;
  readonly outputHash?: string;
  readonly pages?: readonly ArchLangPage[];
  readonly diagnostics: readonly ArchLangDiagnostic[];
  readonly semanticSummary?: archlang.SceneSummary;
  readonly lintResults?: readonly archlang.Diagnostic[];
  readonly parityReport?: GeometryParityReport;
  readonly dxf?: string;
  readonly pdf?: Uint8Array;
  readonly png?: Uint8Array;
  readonly provenance: ArchLangProvenance;
}

export interface ArchLangCompileOptions extends ArchLangAdapterOptions {
  /** If true, generates DXF export. Default: true. */
  readonly generateDxf?: boolean;
  /** If true, generates PDF export if pdfkit is available. Default: true. */
  readonly generatePdf?: boolean;
  /** If true, generates PNG export if @resvg/resvg-js is available. Default: true. */
  readonly generatePng?: boolean;
}

function computeSha256(content: string | Buffer | Uint8Array): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ─── Primary Compilation Service ──────────────────────────────────────────────

/**
 * Compiles a canonical Building model with ArchLang, enforcing hard validation,
 * linting, semantic analysis, and geometry parity checks.
 */
export async function compileBuildingWithArchLang(
  building: Building,
  options?: ArchLangCompileOptions,
): Promise<ArchLangExportResult> {
  const generatedAt = new Date().toISOString();
  const canonicalModelHash = computeSha256(JSON.stringify(building));

  // 1. Serialize canonical model to ArchLang DSL source
  const serialization: ArchLangSerializationResult = buildingModelToArchLangSource(building, options);
  const { source, sourceHash } = serialization;
  const diagnostics: ArchLangDiagnostic[] = [...serialization.diagnostics];

  // 2. Invoke ArchLang compiler
  let compileRes: archlang.CompileResult;
  try {
    compileRes = archlang.compile(source, {
      accessible: true,
      noCache: true,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    diagnostics.push({
      stage: 'COMPILER',
      code: 'COMPILER_FATAL_EXCEPTION',
      severity: 'error',
      message: `ArchLang compiler threw an unexpected exception: ${errorMsg}`,
    });

    return {
      success: false,
      status: 'REJECTED',
      source,
      sourceHash,
      diagnostics,
      provenance: {
        buildingId: building.id,
        buildingVersion: building.version ?? 1,
        canonicalModelHash,
        archlangVersion: ARCHLANG_PACKAGE_VERSION,
        adapterVersion: ARCHLANG_ADAPTER_VERSION,
        sourceHash,
        generatedAt,
        exportStatus: 'REJECTED',
      },
    };
  }

  // 3. Collect compiler diagnostics
  for (const err of compileRes.errors) {
    diagnostics.push({
      stage: 'COMPILER',
      code: (err as { code?: string }).code || 'COMPILER_ERROR',
      severity: 'error',
      message: err.message,
      line: err.line,
      col: err.col,
    });
  }

  for (const warn of compileRes.warnings) {
    diagnostics.push({
      stage: 'COMPILER',
      code: (warn as { code?: string }).code || 'COMPILER_WARNING',
      severity: 'warning',
      message: warn.message,
      line: warn.line,
      col: warn.col,
    });
  }

  // Reject on fatal compiler errors
  if (compileRes.errors.length > 0 || !compileRes.svg) {
    return {
      success: false,
      status: 'REJECTED',
      source,
      sourceHash,
      diagnostics,
      provenance: {
        buildingId: building.id,
        buildingVersion: building.version ?? 1,
        canonicalModelHash,
        archlangVersion: ARCHLANG_PACKAGE_VERSION,
        adapterVersion: ARCHLANG_ADAPTER_VERSION,
        sourceHash,
        generatedAt,
        exportStatus: 'REJECTED',
      },
    };
  }

  // 4. Extract semantic summary via describe()
  let summary: archlang.SceneSummary | undefined;
  try {
    summary = archlang.describe(source);
    if (!summary.ok) {
      diagnostics.push({
        stage: 'COMPILER',
        code: 'SCENE_SUMMARY_FAILED',
        severity: 'error',
        message: 'ArchLang describe() failed to extract semantic scene summary.',
      });
    }
  } catch (descErr) {
    diagnostics.push({
      stage: 'COMPILER',
      code: 'DESCRIBE_EXCEPTION',
      severity: 'warning',
      message: `describe() threw: ${descErr instanceof Error ? descErr.message : String(descErr)}`,
    });
  }

  // 5. Run architectural linting
  let lintResults: archlang.Diagnostic[] = [];
  try {
    lintResults = archlang.lint(source);
    for (const l of lintResults) {
      if (l.severity === 'error') {
        diagnostics.push({
          stage: 'LINT',
          code: l.code || 'LINT_ERROR',
          severity: 'error',
          message: l.message,
        });
      }
    }
  } catch (lintErr) {
    diagnostics.push({
      stage: 'LINT',
      code: 'LINT_EXCEPTION',
      severity: 'warning',
      message: `lint() threw: ${lintErr instanceof Error ? lintErr.message : String(lintErr)}`,
    });
  }

  // 6. Run hard Geometry-Parity Validation
  let parityReport: GeometryParityReport | undefined;
  if (summary && summary.ok) {
    try {
      parityReport = validateGeometryParity(building, summary, serialization, {
        scene: compileRes?.scene,
        ast: compileRes?.ast,
      });
      if (!parityReport.passed) {
        diagnostics.push({
          stage: 'PARITY',
          code: 'GEOMETRY_PARITY_FAILED',
          severity: 'error',
          message: `Geometry parity check failed: ${parityReport.failedChecks} out of ${parityReport.totalChecks} checks failed.`,
        });
      }
    } catch (parityErr) {
      diagnostics.push({
        stage: 'PARITY',
        code: 'PARITY_VALIDATOR_EXCEPTION',
        severity: 'error',
        message: `Parity validator exception: ${parityErr instanceof Error ? parityErr.message : String(parityErr)}`,
      });
    }
  } else {
    diagnostics.push({
      stage: 'PARITY',
      code: 'PARITY_SKIPPED_NO_SUMMARY',
      severity: 'error',
      message: 'Geometry parity validation skipped because scene summary was unavailable.',
    });
  }

  // Determine acceptance status
  const hasFatalErrors = diagnostics.some(d => d.severity === 'error');
  const parityPassed = parityReport?.passed ?? false;
  const isAccepted = !hasFatalErrors && parityPassed;

  // If rejected, do not publish outputs
  if (!isAccepted) {
    return {
      success: false,
      status: 'REJECTED',
      source,
      sourceHash,
      diagnostics,
      semanticSummary: summary,
      lintResults,
      parityReport,
      provenance: {
        buildingId: building.id,
        buildingVersion: building.version ?? 1,
        canonicalModelHash,
        archlangVersion: ARCHLANG_PACKAGE_VERSION,
        adapterVersion: ARCHLANG_ADAPTER_VERSION,
        sourceHash,
        generatedAt,
        exportStatus: 'REJECTED',
      },
    };
  }

  // 7. Multi-page and multi-format rendering for accepted artifacts
  const wantDxf = options?.generateDxf ?? true;
  const wantPdf = options?.generatePdf ?? true;
  const wantPng = options?.generatePng ?? true;

  const pages: ArchLangPage[] = [];

  if (compileRes.pages && compileRes.pages.length > 0) {
    for (const p of compileRes.pages) {
      let pageDxf: string | undefined;
      let pagePdf: Uint8Array | undefined;
      let pagePng: Uint8Array | undefined;

      if (wantDxf && p.scene) {
        try {
          pageDxf = archlang.toDxf(p.scene);
        } catch {
          // DXF generation advisory
        }
      }

      if (wantPdf && p.scene) {
        try {
          pagePdf = await archlang.toPdf(p.scene);
        } catch {
          // Optional pdfkit missing
        }
      }

      if (wantPng && p.svg) {
        try {
          pagePng = await archlang.renderPngFromSvg(p.svg);
        } catch {
          // Optional resvg missing
        }
      }

      pages.push({
        level: p.level,
        name: p.name,
        svg: p.svg,
        dxf: pageDxf,
        pdf: pagePdf,
        png: pagePng,
      });
    }
  }

  // Primary outputs (page 1 / overall)
  const primarySvg = compileRes.svg;
  const outputHash = computeSha256(primarySvg);

  let primaryDxf: string | undefined;
  if (wantDxf && compileRes.scene) {
    try {
      primaryDxf = archlang.toDxf(compileRes.scene);
    } catch {
      // Ignored if DXF fails
    }
  }

  let primaryPdf: Uint8Array | undefined;
  if (wantPdf && compileRes.scene) {
    try {
      primaryPdf = await archlang.toPdf(compileRes.scene);
    } catch {
      // Ignored if PDF fails
    }
  }

  let primaryPng: Uint8Array | undefined;
  if (wantPng && primarySvg) {
    try {
      primaryPng = await archlang.renderPngFromSvg(primarySvg);
    } catch {
      // Ignored if PNG fails
    }
  }

  return {
    success: true,
    status: 'ACCEPTED',
    source,
    sourceHash,
    svg: primarySvg,
    outputHash,
    pages,
    diagnostics,
    semanticSummary: summary,
    lintResults,
    parityReport,
    dxf: primaryDxf,
    pdf: primaryPdf,
    png: primaryPng,
    provenance: {
      buildingId: building.id,
      buildingVersion: building.version ?? 1,
      canonicalModelHash,
      archlangVersion: ARCHLANG_PACKAGE_VERSION,
      adapterVersion: ARCHLANG_ADAPTER_VERSION,
      sourceHash,
      outputHash,
      generatedAt,
      exportStatus: 'ACCEPTED',
    },
  };
}

// ─── Backward-Compatible Helpers ─────────────────────────────────────────────

/**
 * Serializes a canonical Building into ArchLang DSL (.arch) source.
 */
export function compileBuildingToArchLang(building: Building, options?: ArchLangAdapterOptions): string {
  const result = buildingModelToArchLangSource(building, options);
  return result.source;
}

/**
 * Generates an AutoCAD DXF string for a canonical Building via ArchLang.
 */
export function compileBuildingToDxf(building: Building): string {
  const { source } = buildingModelToArchLangSource(building);
  const compiled = archlang.compile(source, { noCache: true });
  if (compiled.scene) {
    return archlang.toDxf(compiled.scene);
  }
  return '';
}

/**
 * Lints a canonical Building model by compiling with ArchLang and returning issues.
 */
export function lintApartmentCadGeometry(building: Building): { valid: boolean; issues: string[] } {
  const { source } = buildingModelToArchLangSource(building);
  try {
    const lints = archlang.lint(source);
    const issues = lints.map(l => `${l.severity.toUpperCase()}: ${l.message}`);
    return {
      valid: !lints.some(l => l.severity === 'error'),
      issues,
    };
  } catch (err) {
    return {
      valid: false,
      issues: [err instanceof Error ? err.message : String(err)],
    };
  }
}
