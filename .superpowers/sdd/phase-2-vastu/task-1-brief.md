# Phase 2 Vastu Engine — Task 1

**Geometry & Vastu Scoring Engine Implementation**

**Files:**
- Create: `packages/planning-engine/src/vastu/geometry.ts`
- Modify: `packages/constraint-engine/src/providers/vastu-provider.ts`
- Modify: `packages/ai-orchestration/src/apartment/vastu.ts`

**Constraint:** Implementation must use the shoelace centroid formula for RERA area (Polygon - OTS/Balcony). Scoring must map 16 angular zones (22.5 deg wedges) based on `northAngleDeg`. 
- Kitchen (SE/SSE=25, NW/E=18, NE/SW=0)
- Master Bed (SW=25, S/W/SSW/WSW=20, NE/SE=0)
- Bath/OTS (WNW/NW/SSE/W/S=15, NE/NNE/ENE/SW=0)
- Puja (NE/N/E=10)
- Living/Balcony (N/NE/E=15, NW/SE=10)
- Foyer/Brahmasthana (Entrance zone=5, Centroid=5)
