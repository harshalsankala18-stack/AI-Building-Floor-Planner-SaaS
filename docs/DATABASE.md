# AI Floor Planner — Database Schema Design

## 1. Overview

The database stores structured architectural entities with relational integrity. PostgreSQL is the primary data store, chosen for its relational capabilities, JSON support for flexible metadata, and PostGIS potential for spatial queries.

---

## 2. Design Principles

1. **Normalized where it matters**: Core entities (users, projects, buildings) are properly normalized.
2. **JSON for complex geometry**: Room boundaries, polygons, and nested structures use JSONB columns rather than deep table hierarchies.
3. **Versioning built-in**: Full building model snapshots stored per version.
4. **Audit trail**: All mutations tracked with timestamps and actors.
5. **Soft deletes**: Critical data is archived, not destroyed.

---

## 3. Schema

### 3.1 Users & Organizations

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(50) DEFAULT 'user',
  organization_id UUID REFERENCES organizations(id),
  avatar_url    VARCHAR(500),
  preferences   JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  slug          VARCHAR(100) UNIQUE NOT NULL,
  plan_tier     VARCHAR(50) DEFAULT 'free',
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id),
  user_id         UUID REFERENCES users(id),
  role            VARCHAR(50) DEFAULT 'member',
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);
```

### 3.2 Projects

```sql
CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  client_name     VARCHAR(255),
  status          VARCHAR(50) DEFAULT 'draft',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_projects_user ON projects(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_org ON projects(organization_id) WHERE deleted_at IS NULL;
```

### 3.3 Sites

```sql
CREATE TABLE sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plot_boundary   JSONB NOT NULL,       -- Polygon points
  plot_width      INTEGER NOT NULL,     -- mm
  plot_depth      INTEGER NOT NULL,     -- mm
  plot_area       BIGINT NOT NULL,      -- sq mm (computed)
  orientation     REAL DEFAULT 0,       -- degrees (north direction)
  road_facing     VARCHAR(20),
  setbacks        JSONB NOT NULL DEFAULT '{"front":0,"rear":0,"left":0,"right":0}',
  access_points   JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Buildings

```sql
CREATE TABLE buildings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  site_id         UUID NOT NULL REFERENCES sites(id),
  name            VARCHAR(255) DEFAULT 'Main Building',
  current_version INTEGER DEFAULT 1,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Floors

```sql
CREATE TABLE floors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  level           INTEGER NOT NULL,     -- 0 = ground
  name            VARCHAR(100),
  floor_height    INTEGER DEFAULT 3000, -- mm
  boundary        JSONB NOT NULL,       -- Polygon
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(building_id, level)
);
```

### 3.6 Rooms

```sql
CREATE TABLE rooms (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  type            VARCHAR(50) NOT NULL,
  name            VARCHAR(100),
  boundary        JSONB NOT NULL,       -- Polygon points
  x               INTEGER NOT NULL,     -- mm
  y               INTEGER NOT NULL,     -- mm
  width           INTEGER NOT NULL,     -- mm
  height          INTEGER NOT NULL,     -- mm
  rotation        REAL DEFAULT 0,
  area            BIGINT NOT NULL,      -- sq mm
  priority        INTEGER DEFAULT 5,
  tags            TEXT[] DEFAULT '{}',
  properties      JSONB DEFAULT '{}',   -- adjacency, daylight, privacy reqs
  is_fixed        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rooms_floor ON rooms(floor_id);
CREATE INDEX idx_rooms_type ON rooms(type);
```

### 3.7 Walls

```sql
CREATE TABLE walls (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  start_x         INTEGER NOT NULL,
  start_y         INTEGER NOT NULL,
  end_x           INTEGER NOT NULL,
  end_y           INTEGER NOT NULL,
  thickness       INTEGER DEFAULT 150,  -- mm
  type            VARCHAR(30) DEFAULT 'internal',
  material        VARCHAR(50),
  load_bearing    BOOLEAN DEFAULT FALSE,
  room_ids        UUID[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_walls_floor ON walls(floor_id);
```

### 3.8 Doors

```sql
CREATE TABLE doors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  wall_id         UUID REFERENCES walls(id),
  position_x      INTEGER NOT NULL,
  position_y      INTEGER NOT NULL,
  width           INTEGER DEFAULT 900,   -- mm
  height          INTEGER DEFAULT 2100,  -- mm
  type            VARCHAR(30) DEFAULT 'single',
  swing_direction VARCHAR(20) DEFAULT 'inward',
  connects_rooms  UUID[] DEFAULT '{}',   -- [roomId1, roomId2]
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doors_floor ON doors(floor_id);
```

### 3.9 Windows

```sql
CREATE TABLE windows (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  wall_id         UUID REFERENCES walls(id),
  position_x      INTEGER NOT NULL,
  position_y      INTEGER NOT NULL,
  width           INTEGER DEFAULT 1200,  -- mm
  height          INTEGER DEFAULT 1200,  -- mm
  sill_height     INTEGER DEFAULT 900,   -- mm
  type            VARCHAR(30) DEFAULT 'sliding',
  room_id         UUID REFERENCES rooms(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_windows_floor ON windows(floor_id);
```

### 3.10 Stairs

```sql
CREATE TABLE stairs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  type            VARCHAR(30) DEFAULT 'straight',
  boundary        JSONB NOT NULL,
  x               INTEGER NOT NULL,
  y               INTEGER NOT NULL,
  width           INTEGER NOT NULL,
  length          INTEGER NOT NULL,
  direction       VARCHAR(20),
  riser_count     INTEGER,
  riser_height    INTEGER,
  tread_depth     INTEGER,
  connects_floors INTEGER[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.11 Columns

```sql
CREATE TABLE columns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id        UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  position_x      INTEGER NOT NULL,
  position_y      INTEGER NOT NULL,
  width           INTEGER DEFAULT 300,
  depth           INTEGER DEFAULT 300,
  shape           VARCHAR(20) DEFAULT 'rectangular',
  is_structural   BOOLEAN DEFAULT TRUE,
  grid_reference  VARCHAR(10),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.12 Plan Versions

```sql
CREATE TABLE plan_versions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id       UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  version_number    INTEGER NOT NULL,
  snapshot          JSONB NOT NULL,           -- Full Building Model JSON
  change_description VARCHAR(500),
  change_source     VARCHAR(30) DEFAULT 'manual',  -- manual, ai_edit, generation
  created_by        UUID REFERENCES users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(building_id, version_number)
);

CREATE INDEX idx_versions_building ON plan_versions(building_id);
```

### 3.13 AI Requests

```sql
CREATE TABLE ai_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id),
  project_id      UUID REFERENCES projects(id),
  task_type       VARCHAR(50) NOT NULL,
  provider        VARCHAR(30) NOT NULL,
  model           VARCHAR(50) NOT NULL,
  input_tokens    INTEGER,
  output_tokens   INTEGER,
  total_tokens    INTEGER,
  latency_ms      INTEGER,
  status          VARCHAR(20) DEFAULT 'completed',
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_requests_user ON ai_requests(user_id);
CREATE INDEX idx_ai_requests_date ON ai_requests(created_at);
```

### 3.14 Exports

```sql
CREATE TABLE exports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id     UUID NOT NULL REFERENCES buildings(id),
  version_id      UUID REFERENCES plan_versions(id),
  format          VARCHAR(20) NOT NULL,    -- svg, pdf, json, dxf
  file_url        VARCHAR(500),
  file_size       BIGINT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Entity Relationship Diagram

```
users ─────────────┐
  │                 │
  │ belongs_to      │ creates
  ▼                 ▼
organizations    projects
                    │
                    │ has
                    ▼
                  sites
                    │
                    │ contains
                    ▼
                buildings ──── plan_versions
                    │
                    │ contains
                    ▼
                  floors
                    │
        ┌───┬───┬──┴──┬────┬────┐
        ▼   ▼   ▼     ▼    ▼    ▼
     rooms walls doors windows stairs columns
```

---

## 5. Data Integrity Rules

1. Deleting a project cascades to all child entities.
2. Deleting a floor cascades to rooms, walls, doors, windows, stairs, columns on that floor.
3. Plan versions are immutable once created (append-only).
4. Users cannot be hard-deleted; only soft-deleted.
5. AI request logs are retained for billing and audit.
6. Building model JSON in plan_versions must pass schema validation.

---

## 6. Migration Strategy

- Use Drizzle ORM for schema definition and migrations.
- All migrations are forward-only in production.
- Schema changes that could lose data require a multi-step migration with backfill.
- Every migration has a corresponding rollback script for staging environments.

---

## 7. Indexing Strategy

- Primary keys: UUID with default generation.
- Foreign keys: indexed for JOIN performance.
- Frequently filtered columns: status, type, floor_id.
- JSONB: GIN indexes on frequently queried JSON paths.
- Soft deletes: partial indexes excluding deleted records.

---

## 8. Backup & Recovery

- Automated daily backups with point-in-time recovery.
- Plan version snapshots provide application-level recovery.
- Transaction log shipping for disaster recovery.
