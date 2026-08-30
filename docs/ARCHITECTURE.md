# AI Floor Planner — System Architecture

## 1. Overview

AI Floor Planner is a production-grade SaaS platform for architectural floor plan generation and editing. The system separates AI reasoning from deterministic computation, ensuring that all geometric output is mathematically valid and architecturally sound.

### Core Principle

```
User Requirements
→ Requirement Parser (AI)
→ Architectural Reasoning (AI)
→ Structured Building Model (deterministic)
→ Constraint Engine (deterministic)
→ Geometry Engine (deterministic)
→ Validation (deterministic)
→ Optimization (deterministic)
→ SVG/Canvas Rendering (deterministic)
→ Editable Plan
→ Export
```

AI is responsible for: reasoning, interpretation, explanation, and planning intent.

Deterministic software is responsible for: geometry, coordinates, dimensions, room boundaries, wall placement, doors, windows, staircase geometry, collision detection, area calculations, constraint validation, plan consistency.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  App     │ │  Plan    │ │  AI      │ │  Property         │  │
│  │  Shell   │ │  Editor  │ │  Chat    │ │  Inspector        │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              SVG Renderer / Canvas Layer                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP/WS
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (API)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │  Auth    │ │  Project │ │  Plan    │ │  AI               │  │
│  │  Service │ │  Service │ │  Service │ │  Service           │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      CORE ENGINE (Library)                       │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────────────────┐  │
│  │  Geometry    │ │  Constraint    │ │  Planning             │  │
│  │  Engine      │ │  Engine        │ │  Engine               │  │
│  └──────────────┘ └────────────────┘ └───────────────────────┘  │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────────────────┐  │
│  │  Building    │ │  Renderer      │ │  AI Orchestration     │  │
│  │  Model       │ │  (SVG)         │ │  Layer                │  │
│  └──────────────┘ └────────────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│  ┌──────────────┐ ┌────────────────┐ ┌───────────────────────┐  │
│  │  PostgreSQL  │ │  Redis         │ │  Object Storage       │  │
│  │  (primary)   │ │  (cache/queue) │ │  (exports/assets)     │  │
│  └──────────────┘ └────────────────┘ └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Language | TypeScript | Full-stack type safety, shared domain model |
| Frontend Framework | React 18+ | Component architecture, ecosystem, performance |
| State Management | Zustand | Lightweight, TypeScript-first, undo/redo friendly |
| SVG Rendering | Custom SVG + D3 utilities | Precise architectural rendering |
| Backend Runtime | Node.js | Shared language, async I/O |
| API Framework | Fastify | Performance, schema validation, TypeScript |
| Database | PostgreSQL 15+ | Relational integrity, JSON support, spatial extensions |
| Cache | Redis | Session cache, job queues, pub/sub |
| ORM | Drizzle ORM | Type-safe, lightweight, migration-friendly |
| AI Providers | Gemini / OpenAI / Claude | Multi-provider abstraction |
| Testing | Vitest | Fast, TypeScript-native, compatible with workspace |
| Build | Turborepo | Monorepo build orchestration |
| Package Manager | pnpm | Efficient, workspace-native |
| Deployment | Docker + cloud-agnostic | Portability |

---

## 4. Package Architecture (Monorepo)

```
ai-floor-planner/
├── packages/
│   ├── core/                    # Domain model, shared types, utilities
│   │   └── src/
│   │       ├── models/          # Building, Floor, Room, Wall, etc.
│   │       └── types/           # Shared TypeScript interfaces
│   ├── geometry-engine/         # Deterministic geometry operations
│   │   └── src/
│   ├── constraint-engine/       # Hard/soft constraint validation
│   │   └── src/
│   ├── planning-engine/         # Candidate generation & optimization
│   │   └── src/
│   ├── ai-orchestration/        # AI provider abstraction & routing
│   │   └── src/
│   │       └── providers/       # Gemini, OpenAI, Claude adapters
│   ├── renderer/                # SVG generation from Building Model
│   │   └── src/
│   ├── backend/                 # HTTP API, services, database
│   │   └── src/
│   │       ├── api/             # Route handlers
│   │       ├── services/        # Business logic
│   │       └── db/              # Schema, migrations, queries
│   └── frontend/                # React application
│       └── src/
│           ├── components/      # UI components
│           ├── stores/          # State management
│           └── views/           # Page-level views
├── tests/
│   ├── fixtures/                # Test floor plans
│   ├── unit/                    # Unit tests
│   └── integration/             # Integration tests
├── docs/                        # Architecture & specification docs
├── package.json                 # Root workspace config
├── turbo.json                   # Turborepo pipeline
└── tsconfig.base.json           # Shared TypeScript config
```

---

## 5. Data Flow

### Plan Generation Flow

```
1. User submits requirements (rooms, plot, preferences)
2. Backend receives request, validates input
3. AI Orchestration: requirement parser extracts structured intent
4. Planning Engine: generates N candidate room layouts
5. Geometry Engine: computes walls, boundaries, coordinates
6. Constraint Engine: validates hard constraints, scores soft constraints
7. Invalid candidates filtered out
8. Top candidates scored and ranked
9. AI Orchestration: AI critiques candidates, suggests repairs
10. Planning Engine: applies repairs, re-validates
11. Final candidates returned with scores
12. Frontend renders SVG from Building Model
13. User selects preferred candidate
14. Plan version saved to database
```

### AI Edit Flow

```
1. User types natural-language command
2. AI Orchestration: parses command into structured edit intent
3. Edit intent mapped to Building Model operations
4. Geometry Engine: applies geometric changes
5. Constraint Engine: validates result
6. If valid: Building Model updated, new version created
7. If invalid: AI suggests alternatives
8. Renderer updates SVG from new Building Model state
```

---

## 6. Key Design Decisions

### Building Model is the Source of Truth
The rendered SVG/Canvas is a projection of the Building Model. All edits modify the model; the view re-renders from model state.

### AI Safety Boundary
AI never directly writes geometry or bypasses validation. AI proposes structured intents; deterministic engines execute and validate.

### Versioning
Every mutation to a plan creates a version snapshot. Users can revert to any previous version. AI edits are versioned identically to manual edits.

### Deterministic Geometry
All coordinate calculations, collision detection, area computations, and constraint checks are implemented in pure deterministic functions with no AI involvement.

### Multi-Provider AI
The AI layer abstracts over multiple LLM providers. Business logic never couples directly to a specific model API.

---

## 7. Security Boundaries

- AI providers receive only sanitized architectural context, never user credentials or billing data.
- The constraint engine enforces physical validity; AI cannot override hard constraints.
- All plan mutations go through validation before persistence.
- Authentication and authorization are handled at the API gateway level.

---

## 8. Scalability Considerations

- The core engines (geometry, constraint, planning) are pure computation with no I/O dependencies, enabling horizontal scaling and worker-based parallelism.
- Candidate generation can be parallelized across workers.
- The Building Model is serializable, enabling stateless API design.
- Redis provides caching and job queue capabilities for async operations.

---

## 9. Future Extension Points

The architecture is designed to accommodate:
- Elevations and 3D views
- Structural planning (columns, beams)
- BOQ and cost estimation
- DXF/DWG export
- BIM integration
- Multi-user collaboration (via CRDT or OT on the Building Model)

These are NOT implemented in V1 but the architecture does not preclude them.
