# AI Floor Planner — Implementation Roadmap

## Overview

Phased implementation approach. Each phase builds on the previous. No phase begins until the prior phase is stable and tested.

---

## Phase 1: Repository Architecture & Specifications (Current)

**Goal**: Establish architectural foundation and documentation.

**Deliverables**:
- [x] Monorepo directory structure
- [x] Architecture documentation
- [x] Domain model specification
- [x] Geometry engine specification
- [x] Constraint engine specification
- [x] AI orchestration specification
- [x] Rendering specification
- [x] API contracts
- [x] Database schema design
- [x] Testing strategy
- [x] Security architecture
- [x] This roadmap
- [x] TypeScript configuration
- [x] Core domain type definitions

**Exit Criteria**: All specifications reviewed and approved. Core types compile.

---

## Phase 2: Building Domain Model

**Goal**: Implement the canonical Building Model as a TypeScript library.

**Deliverables**:
- Core entity classes/types implemented
- Builder/factory functions for creating entities
- Serialization/deserialization (JSON ↔ model)
- Schema validation
- UUID generation for all entities
- Immutable update helpers
- Unit tests for all model operations

**Exit Criteria**: Building Model can be created, serialized, deserialized, and validated programmatically. All tests pass.

---

## Phase 3: Geometry Engine

**Goal**: Implement deterministic geometry subsystem.

**Deliverables**:
- Point operations
- Line segment operations
- Polygon operations (area, perimeter, centroid, containment)
- Rectangle fast-path operations
- Collision detection
- Wall generation from rooms
- Door/window placement validation
- Staircase geometry
- Snapping and alignment
- All operations tested with fixture data

**Exit Criteria**: Geometry engine passes all unit tests. Performance within targets.

---

## Phase 4: Constraint Engine

**Goal**: Implement plan validation and scoring.

**Deliverables**:
- Hard constraint validators (HC-001 through HC-023)
- Soft constraint scorers (daylight, privacy, vastu, adjacency, circulation)
- Score aggregation with configurable weights
- Validation report generation
- Repair suggestion generation
- Constraint configuration system
- Full test coverage against fixture plans

**Exit Criteria**: Constraint engine correctly validates and scores all fixture plans.

---

## Phase 5: Basic SVG Renderer

**Goal**: Render a Building Model to SVG.

**Deliverables**:
- Coordinate transform (mm → pixels)
- Wall rendering with correct thickness
- Room fill with labels
- Door symbols (swing arcs)
- Window symbols
- Staircase representation
- Dimension annotations
- North arrow
- Room color coding
- Export-quality SVG output
- Fixture plan rendering tests

**Exit Criteria**: All fixture plans render to correct, readable SVG.

---

## Phase 6: Interactive Editor

**Goal**: Browser-based plan editing interface.

**Deliverables**:
- React application shell
- SVG/Canvas interactive layer
- Room selection and highlighting
- Room move (drag)
- Room resize (handles)
- Door/window move along wall
- Undo/redo system
- Property inspector panel
- Zoom and pan
- Snap-to-grid
- Alignment guides
- State management (Zustand)

**Exit Criteria**: User can open a fixture plan, select/move/resize rooms, and undo/redo changes.

---

## Phase 7: Candidate Layout Generation

**Goal**: Generate multiple valid plan layouts from requirements.

**Deliverables**:
- Room placement algorithms
- Space allocation strategies
- Candidate generation pipeline
- Hard constraint filtering
- Candidate ranking by score
- Multiple strategies (e.g., grid-based, zone-based)
- Generate 3+ valid candidates for each fixture requirement set

**Exit Criteria**: Given standard requirements, engine generates 3+ valid candidates with scores > 60.

---

## Phase 8: AI Requirement Parser

**Goal**: Parse natural-language requirements into structured format.

**Deliverables**:
- AI provider abstraction layer
- GeminiProvider implementation
- OpenAIProvider implementation
- Requirement extraction prompts
- Response validation
- Fallback handling
- Unit tests with mock providers

**Exit Criteria**: Natural-language descriptions reliably produce valid UserRequirements objects.

---

## Phase 9: AI Editing

**Goal**: Natural-language plan modification.

**Deliverables**:
- Edit command parser
- Edit operation mapping to model changes
- Context extraction for AI (model summary)
- Operation validation through constraint engine
- Versioning on AI edits
- UI: AI chat panel
- Common edit patterns supported

**Exit Criteria**: Common edit commands ("make bedroom larger", "move kitchen") produce valid model changes.

---

## Phase 10: Validation & Scoring UI

**Goal**: Display plan quality to users.

**Deliverables**:
- Validation panel in editor
- Score visualization (radar chart / bar chart)
- Hard constraint violation highlighting
- Repair suggestions display
- Re-validate on changes
- Score comparison between candidates

**Exit Criteria**: Users can see plan quality scores and understand constraint violations.

---

## Phase 11: Export

**Goal**: Export plans in useful formats.

**Deliverables**:
- SVG export (print-quality)
- PDF export (with title block)
- JSON export (full Building Model)
- Export options (scale, annotations, layers)
- Download UI

**Exit Criteria**: All export formats produce valid, complete output.

---

## Phase 12: Authentication, Projects, Billing

**Goal**: Multi-user SaaS infrastructure.

**Deliverables**:
- User registration and login
- JWT authentication
- Project CRUD
- Plan version management
- Database persistence (PostgreSQL)
- API implementation
- Organization management
- Billing integration (Stripe)
- Usage tracking

**Exit Criteria**: Multiple users can create accounts, manage projects, and persist plans.

---

## Future Phases (Not V1)

- Phase 13: Multi-floor coordination
- Phase 14: Elevations and 3D preview
- Phase 15: Structural planning (columns, beams)
- Phase 16: BOQ and cost estimation
- Phase 17: DXF/DWG export
- Phase 18: Real-time collaboration
- Phase 19: Mobile app
- Phase 20: BIM integration

---

## Timeline Estimates

| Phase | Estimated Duration |
|-------|-------------------|
| Phase 1 | 1 week |
| Phase 2 | 1 week |
| Phase 3 | 2 weeks |
| Phase 4 | 1.5 weeks |
| Phase 5 | 1.5 weeks |
| Phase 6 | 2.5 weeks |
| Phase 7 | 2 weeks |
| Phase 8 | 1 week |
| Phase 9 | 1.5 weeks |
| Phase 10 | 1 week |
| Phase 11 | 1 week |
| Phase 12 | 2.5 weeks |

**Total V1 MVP**: ~19 weeks

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| AI parsing unreliable | Medium | Structured fallbacks, form-based input |
| Geometry edge cases | High | Extensive testing, tolerance handling |
| Performance at scale | Medium | Pure computation, parallelizable |
| AI cost overruns | Medium | Rate limiting, caching, model routing |
| Scope creep | High | Strict phase gates, no premature features |
| Layout quality | High | Multiple strategies, AI critique loop |
