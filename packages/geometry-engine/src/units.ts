/**
 * Unit conversions and formatting.
 * Internal canonical unit is ALWAYS millimeters (mm) and square millimeters (mm²).
 * All functions are pure and provide clear conversion boundaries.
 */

import { UNITS } from '@ai-floor-planner/core';

// Indian Real Estate land area units
export const INDIAN_UNITS = {
  SQ_FT_PER_CENT: 435.6,
  SQ_FT_PER_GUNTHA: 1089.0,
  SQ_FT_PER_ACRE: 43560.0,
  SQ_FT_PER_ANKANAM: 72.0,
  SQ_FT_PER_GROUND: 2400.0,
};

// ─── Linear Conversions ──────────────────────────────────────────────────────

export function mmToFeet(mm: number): number {
  return mm / UNITS.MM_PER_FOOT;
}

export function feetToMm(feet: number): number {
  return feet * UNITS.MM_PER_FOOT;
}

export function mmToMeters(mm: number): number {
  return mm / UNITS.MM_PER_METER;
}

export function metersToMm(meters: number): number {
  return meters * UNITS.MM_PER_METER;
}

export function mmToInches(mm: number): number {
  return mm / UNITS.MM_PER_INCH;
}

export function inchesToMm(inches: number): number {
  return inches * UNITS.MM_PER_INCH;
}

export function mmToCm(mm: number): number {
  return mm / 10;
}

export function cmToMm(cm: number): number {
  return cm * 10;
}

export function mmToYards(mm: number): number {
  return mm / (UNITS.MM_PER_FOOT * 3);
}

export function yardsToMm(yards: number): number {
  return yards * UNITS.MM_PER_FOOT * 3;
}

// ─── Area Conversions ────────────────────────────────────────────────────────

export function sqMmToSqFt(sqMm: number): number {
  return sqMm / (UNITS.MM_PER_FOOT * UNITS.MM_PER_FOOT);
}

export function sqFtToSqMm(sqFt: number): number {
  return sqFt * UNITS.MM_PER_FOOT * UNITS.MM_PER_FOOT;
}

export function sqMmToSqM(sqMm: number): number {
  return sqMm / (UNITS.MM_PER_METER * UNITS.MM_PER_METER);
}

export function sqMToSqMm(sqM: number): number {
  return sqM * UNITS.MM_PER_METER * UNITS.MM_PER_METER;
}

export function sqMmToSqYards(sqMm: number): number {
  return sqMm / (UNITS.MM_PER_FOOT * 3 * UNITS.MM_PER_FOOT * 3);
}

export function sqYardsToSqMm(sqYd: number): number {
  return sqYd * (UNITS.MM_PER_FOOT * 3 * UNITS.MM_PER_FOOT * 3);
}

export function sqMmToAcres(sqMm: number): number {
  const sqFt = sqMmToSqFt(sqMm);
  return sqFt / INDIAN_UNITS.SQ_FT_PER_ACRE;
}

export function acresToSqMm(acres: number): number {
  const sqFt = acres * INDIAN_UNITS.SQ_FT_PER_ACRE;
  return sqFtToSqMm(sqFt);
}

export function sqMmToCents(sqMm: number): number {
  const sqFt = sqMmToSqFt(sqMm);
  return sqFt / INDIAN_UNITS.SQ_FT_PER_CENT;
}

export function centsToSqMm(cents: number): number {
  const sqFt = cents * INDIAN_UNITS.SQ_FT_PER_CENT;
  return sqFtToSqMm(sqFt);
}

export function sqMmToGunthas(sqMm: number): number {
  const sqFt = sqMmToSqFt(sqMm);
  return sqFt / INDIAN_UNITS.SQ_FT_PER_GUNTHA;
}

export function gunthasToSqMm(gunthas: number): number {
  const sqFt = gunthas * INDIAN_UNITS.SQ_FT_PER_GUNTHA;
  return sqFtToSqMm(sqFt);
}

// ─── Display Formatters ──────────────────────────────────────────────────────

/** Format mm as feet with customizable decimal places, e.g. "10.0 ft" */
export function formatFeet(mm: number, decimals: number = 1): string {
  return `${mmToFeet(mm).toFixed(decimals)} ft`;
}

/** Format mm as feet and inches, e.g. `10'-6"` */
export function formatFeetInches(mm: number): string {
  const totalInches = Math.round(mmToInches(mm));
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

/** Format mm as meters with customizable decimal places, e.g. "3.05 m" */
export function formatMeters(mm: number, decimals: number = 2): string {
  return `${mmToMeters(mm).toFixed(decimals)} m`;
}

/** Format sq mm as sq ft with customizable decimal places, e.g. "150.0 sq ft" */
export function formatSqFt(sqMm: number, decimals: number = 1): string {
  return `${sqMmToSqFt(sqMm).toFixed(decimals)} sq ft`;
}

/** Format sq mm as sq m with customizable decimal places, e.g. "14.2 sq m" */
export function formatSqM(sqMm: number, decimals: number = 1): string {
  return `${sqMmToSqM(sqMm).toFixed(decimals)} sq m`;
}

// ─── String Parsers ──────────────────────────────────────────────────────────

/**
 * Parse a human length string into canonical millimeters (mm).
 * Supports: "10 ft", "10'", "10'6\"", "10'-6\"", "3.5m", "3500mm", "120in", "10yd".
 */
export function parseLength(input: string): number {
  const clean = input.trim().toLowerCase();

  // Pattern: 10'6" or 10'-6" or 10' 6"
  const ftInMatch = clean.match(/^(\d+(?:\.\d+)?)\s*['’]\s*[- ]?\s*(\d+(?:\.\d+)?)\s*["”]?$/);
  if (ftInMatch) {
    const feet = parseFloat(ftInMatch[1]!);
    const inches = parseFloat(ftInMatch[2]!);
    return feetToMm(feet) + inchesToMm(inches);
  }

  // Pattern: 10 ft / 10'
  const ftMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:ft|feet|')$/);
  if (ftMatch) {
    return feetToMm(parseFloat(ftMatch[1]!));
  }

  // Pattern: 3.5 m / 3.5 meters
  const mMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:m|meters|meter)$/);
  if (mMatch) {
    return metersToMm(parseFloat(mMatch[1]!));
  }

  // Pattern: 350 cm
  const cmMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:cm|centimeters)$/);
  if (cmMatch) {
    return cmToMm(parseFloat(cmMatch[1]!));
  }

  // Pattern: 120 in / 120"
  const inMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")$/);
  if (inMatch) {
    return inchesToMm(parseFloat(inMatch[1]!));
  }

  // Pattern: 10 yd / 10 yards
  const ydMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:yd|yards|yard)$/);
  if (ydMatch) {
    return yardsToMm(parseFloat(ydMatch[1]!));
  }

  // Raw number or mm
  const mmMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:mm)?$/);
  if (mmMatch) {
    return parseFloat(mmMatch[1]!);
  }

  throw new Error(`Unrecognized length format: "${input}"`);
}

/**
 * Parse an area string into canonical square millimeters (mm²).
 * Supports: "1500 sq ft", "1500 sqft", "120 sq m", "120 sqm", "2 cents", "1 acre".
 */
export function parseArea(input: string): number {
  const clean = input.trim().toLowerCase();

  const sqFtMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:sq\s*ft|sqft|sft)$/);
  if (sqFtMatch) {
    return sqFtToSqMm(parseFloat(sqFtMatch[1]!));
  }

  const sqMMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:sq\s*m|sqm|m2|m²)$/);
  if (sqMMatch) {
    return sqMToSqMm(parseFloat(sqMMatch[1]!));
  }

  const centMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:cents?|ct)$/);
  if (centMatch) {
    return centsToSqMm(parseFloat(centMatch[1]!));
  }

  const gunthaMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:gunthas?|guntas?)$/);
  if (gunthaMatch) {
    return gunthasToSqMm(parseFloat(gunthaMatch[1]!));
  }

  const acreMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:acres?)$/);
  if (acreMatch) {
    return acresToSqMm(parseFloat(acreMatch[1]!));
  }

  const rawMatch = clean.match(/^(\d+(?:\.\d+)?)\s*(?:sq\s*mm|mm2|mm²)?$/);
  if (rawMatch) {
    return parseFloat(rawMatch[1]!);
  }

  throw new Error(`Unrecognized area format: "${input}"`);
}
