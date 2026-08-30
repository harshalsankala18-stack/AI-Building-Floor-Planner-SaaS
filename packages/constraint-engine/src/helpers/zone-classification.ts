/**
 * Zone classification for functional zoning analysis.
 *
 * Zones:
 * - PUBLIC: living, dining, foyer, drawing
 * - PRIVATE: bedroom, bathroom (attached), study
 * - SERVICE: kitchen, utility, servant_quarter, storage
 * - CIRCULATION: corridor, staircase
 * - OUTDOOR: balcony, terrace, garden, parking
 */

import type { Room } from '@ai-floor-planner/core';

export enum Zone {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SERVICE = 'service',
  CIRCULATION = 'circulation',
  OUTDOOR = 'outdoor',
}

const ZONE_MAP: Record<string, Zone> = {
  living: Zone.PUBLIC,
  dining: Zone.PUBLIC,
  foyer: Zone.PUBLIC,
  drawing: Zone.PUBLIC,
  family_living: Zone.PUBLIC,

  bedroom: Zone.PRIVATE,
  bathroom: Zone.PRIVATE,
  study: Zone.PRIVATE,
  pooja: Zone.PRIVATE,

  kitchen: Zone.SERVICE,
  utility: Zone.SERVICE,
  servant_quarter: Zone.SERVICE,
  storage: Zone.SERVICE,

  corridor: Zone.CIRCULATION,
  staircase: Zone.CIRCULATION,

  balcony: Zone.OUTDOOR,
  terrace: Zone.OUTDOOR,
  garden: Zone.OUTDOOR,
  parking: Zone.OUTDOOR,

  custom: Zone.PRIVATE,
};

/** Get the functional zone for a room or room type. */
export function getRoomZone(roomOrType: Room | string): Zone {
  const type = typeof roomOrType === 'string' ? roomOrType : roomOrType.type;
  return ZONE_MAP[type] ?? Zone.PRIVATE;
}

/** Classify all rooms into zones. */
export function classifyRooms(rooms: readonly Room[]): Record<Zone, Room[]> {
  const record: Record<Zone, Room[]> = {
    [Zone.PUBLIC]: [],
    [Zone.PRIVATE]: [],
    [Zone.SERVICE]: [],
    [Zone.CIRCULATION]: [],
    [Zone.OUTDOOR]: [],
  };
  for (const room of rooms) {
    const zone = getRoomZone(room);
    record[zone].push(room);
  }
  return record;
}

/** Check if a room belongs to a specific zone. */
export function isInZone(room: Room, zone: Zone): boolean {
  return getRoomZone(room) === zone;
}

/** Get all public-zone rooms. */
export function getPublicRooms(rooms: readonly Room[]): Room[] {
  return rooms.filter(r => getRoomZone(r) === Zone.PUBLIC);
}

/** Get all private-zone rooms. */
export function getPrivateRooms(rooms: readonly Room[]): Room[] {
  return rooms.filter(r => getRoomZone(r) === Zone.PRIVATE);
}

/** Get all service-zone rooms. */
export function getServiceRooms(rooms: readonly Room[]): Room[] {
  return rooms.filter(r => getRoomZone(r) === Zone.SERVICE);
}
