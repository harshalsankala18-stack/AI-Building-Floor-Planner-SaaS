/**
 * Immutable Image Artifact Store — Master PRD Phase 2 / §17.
 *
 * Persists the ORIGINAL generated floor-plan image together with the full
 * reproduction metadata (generation id, project id, seed, model, provider,
 * prompt version, original prompt, timestamp). Regeneration always produces a
 * NEW generation id and a NEW artifact — an existing artifact is never
 * modified or deleted through this API (PRD §17 "Do not overwrite the original
 * image" and §24 "Immutable image rule").
 */

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, access } from 'node:fs/promises';
import path from 'path';
import type { GeneratedPlanImage, GeneratedPlanImageRequestProvenance } from '@ai-floor-planner/ai-orchestration';
import type { FloorPlanImagePromptRequest } from '@ai-floor-planner/ai-orchestration';

/** Reproduction metadata persisted beside every original image (PRD §17). */
export interface StoredImageArtifactMetadata {
  readonly generationId: string;
  readonly projectId: string;
  readonly seed: number;
  readonly model: string;
  readonly provider: string;
  readonly promptVersion: number;
  readonly originalPrompt: string;
  readonly negativePrompt: string;
  /**
   * The image's ACTUAL decoded pixel size, read from the returned bytes.
   * Image providers may ignore the requested size (aspect-ratio-only APIs do),
   * so the request's width/height are kept separately as `requestedWidth`/
   * `requestedHeight` and must never be used as the raster's real dimensions.
   */
  readonly width: number;
  readonly height: number;
  readonly requestedWidth: number;
  readonly requestedHeight: number;
  readonly mimeType: string;
  readonly generatedAt: string;
  readonly latencyMs: number;
  /** What the provider actually sent (endpoint, size, seed honoured, input images), when reported. */
  readonly providerRequest?: GeneratedPlanImageRequestProvenance;
}

export interface StoredImageArtifact extends StoredImageArtifactMetadata {
  readonly imageBase64: string;
}

export class ImageArtifactImmutabilityError extends Error {
  constructor(generationId: string) {
    super(`Image artifact ${generationId} already exists and can never be overwritten.`);
    this.name = 'ImageArtifactImmutabilityError';
    Object.setPrototypeOf(this, ImageArtifactImmutabilityError.prototype);
  }
}

/**
 * Read a raster's real pixel size from its own bytes (PNG IHDR / JPEG SOFn).
 * Returns null when the header cannot be parsed; callers then fall back to the
 * requested size and the mismatch stays visible rather than silently assumed.
 */
export function decodeImageDimensions(bytes: Buffer): { width: number; height: number } | null {
  // PNG: 8-byte signature, then IHDR length/type, then width/height big-endian.
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  ) {
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  // JPEG: walk the marker segments to the first Start-Of-Frame.
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1]!;
      // Standalone markers carry no length payload.
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
        offset += 2;
        continue;
      }
      const segmentLength = bytes.readUInt16BE(offset + 2);
      const isStartOfFrame =
        marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (isStartOfFrame) {
        const height = bytes.readUInt16BE(offset + 5);
        const width = bytes.readUInt16BE(offset + 7);
        return width > 0 && height > 0 ? { width, height } : null;
      }
      if (segmentLength < 2) return null;
      offset += 2 + segmentLength;
    }
  }

  return null;
}

export class ImageArtifactStore {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  /** New unique generation id per attempt; regeneration never reuses one. */
  private newGenerationId(seed: number): string {
    return `gen_${seed}_${Date.now().toString(36)}_${randomUUID().slice(0, 8)}`;
  }

  private metadataPath(generationId: string): string {
    return path.join(this.baseDir, `${generationId}.json`);
  }

  private imagePath(generationId: string, extension: string): string {
    return path.join(this.baseDir, `${generationId}.${extension}`);
  }

  async save(projectId: string, image: GeneratedPlanImage, request: FloorPlanImagePromptRequest): Promise<StoredImageArtifact> {
    await mkdir(this.baseDir, { recursive: true });
    const generationId = this.newGenerationId(image.seed);
    const metadataPath = this.metadataPath(generationId);

    // Paranoid immutability guard (defense in depth — ids are unique per call).
    try {
      await access(metadataPath);
      throw new ImageArtifactImmutabilityError(generationId);
    } catch (error) {
      if (error instanceof ImageArtifactImmutabilityError) throw error;
      // ENOENT — path is free, continue.
    }

    const extension = image.mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const imageBytes = Buffer.from(image.imageBase64, 'base64');
    // Record what the provider actually returned, not what we asked for.
    const decoded = decodeImageDimensions(imageBytes);
    const artifact: StoredImageArtifact = {
      generationId,
      projectId,
      seed: image.seed,
      model: image.model,
      provider: image.provider,
      promptVersion: request.promptVersion,
      originalPrompt: image.prompt,
      negativePrompt: request.negativePrompt,
      width: decoded?.width ?? request.width,
      height: decoded?.height ?? request.height,
      requestedWidth: request.width,
      requestedHeight: request.height,
      mimeType: image.mimeType,
      generatedAt: image.generatedAt,
      latencyMs: image.latencyMs,
      ...(image.providerRequest ? { providerRequest: image.providerRequest } : {}),
      imageBase64: image.imageBase64,
    };

    const { imageBase64, ...metadata } = artifact;
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    await writeFile(this.imagePath(generationId, extension), imageBytes);
    return artifact;
  }

  async get(generationId: string): Promise<StoredImageArtifact | null> {
    let raw: string;
    try {
      raw = await readFile(this.metadataPath(generationId), 'utf8');
    } catch {
      return null;
    }
    const metadata = JSON.parse(raw) as StoredImageArtifactMetadata;
    const extension = metadata.mimeType === 'image/jpeg' ? 'jpg' : 'png';
    const imageBytes = await readFile(this.imagePath(generationId, extension));
    // Legacy artifacts recorded the REQUESTED size as width/height. Correct it
    // from the stored bytes so downstream image→mm mapping uses real pixels.
    const decoded = decodeImageDimensions(imageBytes);
    return {
      ...metadata,
      requestedWidth: metadata.requestedWidth ?? metadata.width,
      requestedHeight: metadata.requestedHeight ?? metadata.height,
      ...(decoded ? { width: decoded.width, height: decoded.height } : {}),
      imageBase64: imageBytes.toString('base64'),
    };
  }

  async listByProject(projectId: string): Promise<StoredImageArtifactMetadata[]> {
    let entries: string[];
    try {
      entries = await readdir(this.baseDir);
    } catch {
      return [];
    }
    const matches = entries
      .filter(name => name.endsWith('.json'))
      .map(async name => {
        try {
          const raw = await readFile(path.join(this.baseDir, name), 'utf8');
          return JSON.parse(raw) as StoredImageArtifactMetadata;
        } catch {
          return null;
        }
      });
    return (await Promise.all(matches))
      .filter((item): item is StoredImageArtifactMetadata => item !== null)
      .filter(item => item.projectId === projectId)
      .sort((a, b) => (b.generatedAt > a.generatedAt ? 1 : -1));
  }
}
