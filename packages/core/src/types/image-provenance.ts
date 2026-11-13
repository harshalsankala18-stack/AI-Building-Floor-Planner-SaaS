/**
 * Image-to-CAD provenance — Phase 2.7.
 *
 * Every entity reconstructed from an accepted master image carries the trace
 * back to that image, so a later edit can never make image-derived geometry
 * indistinguishable from a deterministic template.
 */

/** Region of the source image an entity was read from, in the interpretation's own frame. */
export interface SourceImageRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Coordinate frame the numbers above are expressed in. */
  readonly frameWidth: number;
  readonly frameHeight: number;
}

/** Per-entity traceability back to the image it was reconstructed from. */
export interface EntityImageProvenance {
  readonly sourceImageArtifactId: string;
  readonly sourceImageHash: string;
  readonly sourceGenerationRevision: number;
  readonly sourceProjectFingerprint: string;
  readonly conversionJobId: string;
  readonly geometryRevisionId: string;
  readonly sourceImageRegion?: SourceImageRegion;
  /** 0..1 — how confidently this entity was read from the image. */
  readonly extractionConfidence: number;
  /** The vision entity id this was reconstructed from. */
  readonly sourceEntityId?: string;
}

/** Per-floor coordinate frame and footprint provenance. */
export interface FloorImageProvenance {
  readonly level: number;
  readonly floorName: string;
  readonly sourceImageRegion?: SourceImageRegion;
  readonly scaleMmPerUnitX: number;
  readonly scaleMmPerUnitY: number;
  readonly footprintVertexCount: number;
  readonly footprintSource: 'stated_floor_boundary' | 'stated_plan_boundary' | 'polygonal_room_contour';
}

/** Building-level record of the image→CAD conversion that produced the geometry. */
export interface BuildingImageProvenance {
  readonly sourceImageArtifactId: string;
  readonly sourceImageHash: string;
  readonly sourceGenerationRevision: number;
  readonly sourceProjectFingerprint: string;
  readonly conversionJobId: string;
  readonly geometryRevisionId: string;
  readonly convertedAt: string;
  readonly visionModel?: string;
  readonly interpretationSource: string;
  /** Frame the interpretation coordinates were expressed in. */
  readonly frameWidth: number;
  readonly frameHeight: number;
  /** Actual decoded pixel size of the source raster. */
  readonly imageWidePixels: number;
  readonly imageTallPixels: number;
  /** Per-floor independent coordinate frame and footprint provenance. */
  readonly floors?: readonly FloorImageProvenance[];
  /**
   * Geometric adjustments the solver applied to the image-read geometry, each
   * traceable and explainable. An empty list means nothing was moved.
   */
  readonly adjustments: readonly GeometryAdjustment[];
  /** Architectural features the image showed but conversion could not place. */
  readonly unplacedFeatures: readonly string[];
}

/** One traceable change the normalizer made to image-read geometry. */
export interface GeometryAdjustment {
  readonly entityId: string;
  readonly entityName: string;
  readonly kind:
    | 'snap_to_grid'
    | 'clamp_to_envelope'
    | 'resolve_overlap'
    | 'enlarge_to_minimum'
    | 'floor_assignment'
    | 'calibrate_footprint';
  readonly description: string;
  /** True when the change is large enough to alter the original design intent. */
  readonly material: boolean;
  readonly deltaMm?: number;
}

/** Tag prefix marking geometry whose origin is a reconstructed master image. */
export const IMAGE_DERIVED_TAG = 'source:image_reconstruction' as const;

/** Tag marking geometry produced by a deterministic template, not an image. */
export const DETERMINISTIC_TEMPLATE_TAG = 'source:deterministic_template' as const;
