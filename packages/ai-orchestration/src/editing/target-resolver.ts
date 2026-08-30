import type { Building, Room } from '@ai-floor-planner/core';
import { RoomType } from '@ai-floor-planner/core';

export interface RoomTargetResolution {
  readonly room: Room | null;
  readonly matches: readonly Room[];
  readonly message?: string;
}

const TYPE_ALIASES: readonly [RoomType, readonly string[]][] = [
  [RoomType.ServantQuarter, ['servant quarter', 'maid room']],
  [RoomType.FamilyLiving, ['family living', 'family lounge']],
  [RoomType.Living, ['living room', 'living']],
  [RoomType.Bedroom, ['master bedroom', 'guest bedroom', 'bedroom', 'bed room']],
  [RoomType.Bathroom, ['bathroom', 'bath room', 'toilet']],
  [RoomType.Kitchen, ['kitchen']],
  [RoomType.Dining, ['dining room', 'dining']],
  [RoomType.Study, ['study room', 'study', 'office']],
  [RoomType.Pooja, ['pooja room', 'puja room', 'prayer room', 'pooja']],
  [RoomType.Utility, ['utility room', 'utility']],
  [RoomType.Storage, ['storage room', 'store room', 'storage']],
  [RoomType.Balcony, ['balcony']],
  [RoomType.Parking, ['parking', 'garage']],
  [RoomType.Corridor, ['corridor', 'passage']],
  [RoomType.Foyer, ['foyer', 'entry']],
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sortedRooms(building: Building, activeFloorId?: string): Room[] {
  return building.floors
    .flatMap(floor => floor.rooms.map(room => ({ room, floor })))
    .sort((a, b) => {
      const activeDelta = Number(b.floor.id === activeFloorId) - Number(a.floor.id === activeFloorId);
      return activeDelta || a.floor.level - b.floor.level || a.room.name.localeCompare(b.room.name) || a.room.id.localeCompare(b.room.id);
    })
    .map(entry => entry.room);
}

function ordinalFrom(query: string): number | null {
  const wordMap: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 };
  for (const [word, value] of Object.entries(wordMap)) if (new RegExp(`\\b${word}\\b`).test(query)) return value;
  const match = query.match(/\b(\d+)(?:st|nd|rd|th)?\b/);
  return match ? Math.max(1, Number(match[1])) : null;
}

export function resolveRoomTarget(
  building: Building,
  query: string,
  activeFloorId?: string,
  selectedRoomId?: string,
): RoomTargetResolution {
  const rooms = sortedRooms(building, activeFloorId);
  const normalizedQuery = normalize(query);
  if (/\b(selected|this room|current room)\b/.test(normalizedQuery)) {
    const selected = rooms.find(room => room.id === selectedRoomId) ?? null;
    return selected
      ? { room: selected, matches: [selected] }
      : { room: null, matches: [], message: 'Select a room before using a selected-room instruction.' };
  }

  const exactId = rooms.find(room => room.id === query);
  if (exactId) return { room: exactId, matches: [exactId] };

  const exactName = rooms.filter(room => normalize(room.name) === normalizedQuery);
  if (exactName.length === 1) return { room: exactName[0]!, matches: exactName };

  const mentionedNames = rooms.filter(room => normalizedQuery.includes(normalize(room.name)));
  if (mentionedNames.length === 1) return { room: mentionedNames[0]!, matches: mentionedNames };

  let resolvedType: RoomType | null = null;
  for (const [type, aliases] of TYPE_ALIASES) {
    if (aliases.some(alias => normalizedQuery.includes(alias))) {
      resolvedType = type;
      break;
    }
  }
  if (!resolvedType) return { room: null, matches: [], message: `No room matches “${query}”.` };

  let matches = rooms.filter(room => room.type === resolvedType);
  if (normalizedQuery.includes('master')) {
    matches = matches.filter(room => normalize(room.name).includes('master') || room.tags.some(tag => normalize(tag).includes('master')));
  }
  const ordinal = ordinalFrom(normalizedQuery);
  if (ordinal !== null && matches[ordinal - 1]) return { room: matches[ordinal - 1]!, matches };
  if (matches.length === 1) return { room: matches[0]!, matches };
  if (matches.length > 1) {
    return {
      room: null,
      matches,
      message: `“${query}” matches ${matches.length} rooms (${matches.map(room => room.name).join(', ')}). Select one or use its exact name.`,
    };
  }
  return { room: null, matches: [], message: `No room matches “${query}”.` };
}
