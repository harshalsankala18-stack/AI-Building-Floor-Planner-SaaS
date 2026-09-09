# AI Building SaaS — Current V1 Delivery Roadmap

## Scope and delivery discipline

V1 targets high-quality editable residential architectural 2D, canonical-model-driven Blender architectural 3D, and architectural elevations/presentation. This is a delivery target, not current professional validation or construction readiness.

The canonical Building Model remains authoritative: requirements → AI interpretation/fallback → structured intent → deterministic architectural planner/geometry → architectural validation/evidence/ranking → 2D rendering/editing → reviewed/finalized canonical design → professional exports and reproducible Blender projection. Neither Blender meshes nor AI-generated images become independent geometric truth.

Audit anchor: e968720 (access-path evidence), following 16f4dbf (candidate evidence). Current source and verification override this snapshot. Original scaffolding/Phase 1–4 specifications are historical; see [the archived foundation sequence](specs/IMPLEMENTATION_ORDER.md).

IMPLEMENTED_FOUNDATION means supporting code exists, not completed professional acceptance. IN_PROGRESS means acceptance remains incomplete; PLANNED means a V1 target; DEFERRED means outside V1. Split every phase into small, verified and reviewed checkpoints—not twelve giant implementation passes.

Structural analysis, BM/SF/stress/deflection, RCC/steel/load-bearing structural-system engineering, beam/column/slab/member/footing/foundation design, geotechnical engineering, reinforcement, structural 3D, BOQ and cost estimation are DEFERRED_POST_V1. Architectural slabs/floor plates and existing column data do not imply engineering design. Preserve future extensibility without adding premature systems.

## Phase 1 — Architectural Evidence & Acceptance

- **Goal:** Architectural Evidence & Acceptance within the architectural V1 boundary.
- **Current state: IN_PROGRESS.** Required floors, explicit bath ownership, validated direct/reviewed private-indirect paths, shared/unresolved/not-evaluated states, wet coverage and outdoor/residual observations plus evidence UI exist. Program-only Dressing is not newly generated.
- **Main deliverables:** Building plus reviewed-Program evidence freshness; broader architectural acceptance; review/finalization status contract.
- **Exit criteria:** Changed intent or geometry invalidates stale evidence; private and shared/ambiguous cases have tests; missing information never implies approval. Phase 7 completes the finalization workflow.
- **Dependencies:** Existing core/planning/frontend evidence foundations. Immediate next bounded pass: evidence freshness.

## Phase 2 — Architectural Placement Quality

- **Goal:** Architectural Placement Quality within the architectural V1 boundary.
- **Current state: IN_PROGRESS.** Deterministic generation, floor/owner handling and repair exist; weak architectural relationships remain.
- **Main deliverables:** Better initial placement, privacy, bathroom access, kitchen/dining/service organization, circulation, useful proportions/furnishability and exterior exposure opportunity. Distinguish unusable residual space from intentional transitions/outdoor space.
- **Exit criteria:** Same-Program/seed before-and-after geometry demonstrates specific improvements without hard-requirement regressions. A score change alone is insufficient; representative output needs professional review.
- **Dependencies:** Phase 1 measurement contracts and existing planner/geometry/constraint engines.

## Phase 3 — Meaningful Alternatives

- **Goal:** Meaningful Alternatives within the architectural V1 boundary.
- **Current state: IMPLEMENTED_FOUNDATION.** Multiple strategies and ranking exist; meaningful diversity acceptance remains incomplete.
- **Main deliverables:** Genuine zoning, circulation, cluster, feasible core, site-response and outdoor-relationship differences; understandable comparison UI.
- **Exit criteria:** Options meet the same hard brief and differ in documented planning organization, not coordinate jitter. Report fewer feasible options honestly.
- **Dependencies:** Phases 1–2.

## Phase 4 — Multi-Floor + Site Coordination

- **Goal:** Multi-Floor + Site Coordination within the architectural V1 boundary.
- **Current state: IMPLEMENTED_FOUNDATION.** Site/footprint workflows and multi-floor planning exist; comprehensive architectural coordination remains incomplete.
- **Main deliverables:** One Building for G+3 (Ground/First/Second/Third); stair and applicable lift continuity, floor requirements, terraces/balconies, voids, non-identical upper plates, frontage/access, applicable parking and exposure opportunity.
- **Exit criteria:** Whole-building fixtures verify continuity, access, floor intent and outdoor/void semantics. Missing inputs remain explicit; no plumbing or structural safety claim.
- **Dependencies:** Phases 1–3 and canonical site/floor semantics.

## Phase 5 — Professional 2D Semantics

- **Goal:** Professional 2D Semantics within the architectural V1 boundary.
- **Current state: IMPLEMENTED_FOUNDATION.** Canonical rooms/walls/openings, SVG rendering and annotation foundations exist.
- **Main deliverables:** External/internal walls and thickness; doors/swings; windows/ventilators; stairs/lift; dimensions/labels; balconies/terraces/voids; site boundary, roads/access/parking; supplied north/reference data; printable sheets.
- **Exit criteria:** Geometry and symbols match canonical data at supported scales/orientations and floor shapes; unsupported details are not fabricated.
- **Dependencies:** Phase 4 and existing core/geometry/renderer.

## Phase 6 — Professional Interactive Editor

- **Goal:** Professional Interactive Editor within the architectural V1 boundary.
- **Current state: IMPLEMENTED_FOUNDATION.** Commands, selection, inspectors, undo/redo and workspace controls exist.
- **Main deliverables:** Reliable room/wall/opening position and size editing, validation feedback, floor navigation, persistence and undo/redo parity.
- **Exit criteria:** Representative browser editing workflows preserve canonical geometry, invalidate dependent evidence and survive save/reload and undo/redo.
- **Dependencies:** Phases 1 and 5; preserve multi-floor semantics.

## Phase 7 — Architectural Review & Finalization

- **Goal:** Architectural Review & Finalization within the architectural V1 boundary.
- **Current state: PLANNED.** Project persistence and validation foundations exist; complete scoped finalization is not established.
- **Main deliverables:** Generate → Compare → Select → Edit → Validate → Finalize; findings and an exact reviewed revision for exports/3D.
- **Exit criteria:** Finalization binds canonical revision and reviewed intent. Later edits supersede/invalidate it. User review is not statutory or structural certification.
- **Dependencies:** Phase 1 acceptance contract and Phases 2–6.

## Phase 8 — Professional Exports

- **Goal:** Professional Exports within the architectural V1 boundary.
- **Current state: IMPLEMENTED_FOUNDATION.** SVG/PDF/JSON code exists. PDF uses fit-to-page scaling and simplified room/opening drawing; professional fidelity remains incomplete.
- **Main deliverables:** Verified native SVG; professional PDF sheets/scales/annotations; true interoperable DXF; genuine DWG conversion where proper external tooling/licensing supports it. JSON remains model interchange.
- **Exit criteria:** Geometry, dimensions, openings, floor selection and sheet scale match the finalized design; external interoperability verified. Document DWG dependencies; never rename another format to DWG.
- **Dependencies:** Phases 5–7.

## Phase 9 — Canonical Building → Blender Bridge

- **Goal:** Canonical Building → Blender Bridge within the architectural V1 boundary.
- **Current state: PLANNED.** Canonical browser 3D projection exists. The prior JSON-wall Blender experiment is outside the primary repository, not integrated product functionality.
- **Main deliverables:** Finalized canonical Building → adapter → reproducible Blender model; units/axes/levels, stable source IDs and versioned exchange contract.
- **Exit criteria:** Representative multi-floor dimensions, levels, walls/openings match canonical data; genuine .blend output or reproducible Blender content; 2D edits regenerate consistently; missing input fails clearly.
- **Dependencies:** Stable Phase 5 semantics, Phase 7 revision contract and Phase 4 coordination. Underlying 2D quality comes first.

## Phase 10 — Detailed Blender Architectural Model

- **Goal:** Detailed Blender Architectural Model within the architectural V1 boundary.
- **Current state: PLANNED.** Browser projection includes schematic elements; detailed Blender delivery is not implemented.
- **Main deliverables:** Levels, wall thickness/heights, architectural slabs, openings/doors/windows, stairs/railings, balconies/terraces/parapets, applicable roofs, site/context and appropriate basic furniture.
- **Exit criteria:** Source-linked geometry matches the canonical revision and regenerates reliably. No independent redesign or engineered member-sizing claim.
- **Dependencies:** Phase 9 and explicit supported architectural semantics.

## Phase 11 — Elevation / Materials / Presentation

- **Goal:** Elevation / Materials / Presentation within the architectural V1 boundary.
- **Current state: PLANNED.** Browser viewing and a future elevation-dataset contract are foundations, not finished elevation production.
- **Main deliverables:** Front and useful side/rear elevations; perspectives, facade detail/materials, cameras, lighting/shadows and site context.
- **Exit criteria:** Views depict the same finalized architecture with correct levels/openings and reviewed visual quality. AI imagery cannot replace geometric authority.
- **Dependencies:** Phase 10. A historical-image dataset is not required for geometry-driven elevations.

## Phase 12 — Professional Validation + V1 Release

- **Goal:** Professional Validation + V1 Release within the architectural V1 boundary.
- **Current state: PLANNED.** Internal tests exist; complete professional/deployment acceptance is not established.
- **Main deliverables:** Representative residential/RBEA-derived cases, professional review, browser/export/Blender end-to-end QA, performance/recovery, secure deployment and honest limitations.
- **Exit criteria:** Supported workflows pass documented automated and professional review criteria; production build/release checks actually pass. Environment-blocked checks stay blocked. Public builds must not expose developer AI keys.
- **Dependencies:** Relevant gates from Phases 1–11. Infrastructure only as required by release mode; full billing/organizations are not local architectural prerequisites.

## Infrastructure and professional references

Fastify, PostgreSQL, Redis, authentication, billing and hosted services are PLANNED_INFRASTRUCTURE, not established running components. Browser local persistence and development-only frontend provider configuration exist. Secure server-side AI credentials are required before public release; choose the smallest service boundary needed rather than requiring every proposed SaaS component before architectural development.

RBEA-001/002/003 are redacted relationship/topology evidence, not coordinate templates. Preserve VERIFIED_FROM_SOURCE, ASSERTED_FROM_BRIEF and AMBIGUOUS provenance. Do not memorize historical layouts, infer ownership from proximity or expose client PII. Professional acceptance of a reference does not validate generated output.

## Post-V1 — DEFERRED

Future engineering may follow: structural model → validated loads/load combinations → validated solver → reactions → BM/SF/stress/deflection → member design → geotechnical input → foundation design → reinforcement → structural 3D. These require validated inputs and professional review.

Later measurement may follow: quantity take-off → BOQ → costing. None is a current V1 priority. Preserve clean floors, walls, openings, rooms, stairs, levels, site and existing support/grid data; do not add speculative structural grids.

## Scheduling and gates

No whole-product completion date or inherited 19-week promise is supported. Use phase acceptance criteria and dependency-based sequencing. Scope each pass, record actual verification, review its checkpoint and then proceed. Code completion, architectural quality, professional review and public-release readiness are distinct. Historical estimates in archived foundation documents are not current commitments.
