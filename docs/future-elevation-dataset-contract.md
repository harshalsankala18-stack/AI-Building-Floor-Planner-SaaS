# Future Elevation Intelligence Dataset Contract

This is a boundary contract only. The current 2D/3D milestone does not ingest, train on, retrieve, or generate from real-project assets.

Each future matched-example record must contain a stable project ID, building category, floor count, one or more canonical 2D plan asset IDs, corresponding elevation-image asset IDs, verification status, and provenance. It may contain orientation in degrees, known dimensions in millimetres, facade style, and known materials.

Verification values are `UNVERIFIED`, `HUMAN_VERIFIED`, or `SOURCE_VERIFIED`. Provenance must identify the lawful source and usage rights. Plan/elevation correspondence must be verified before a record is eligible for model evaluation or retrieval. Missing dimensions or orientation must remain absent; ingestion must never infer and store them as facts.

The TypeScript boundary is exported as `FutureElevationDatasetRecord` from `@ai-floor-planner/projection-3d`. Binary assets remain outside the canonical `Building`; future services will resolve asset IDs under an explicit access and retention policy.
