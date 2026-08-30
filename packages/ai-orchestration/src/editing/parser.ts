import type { Building } from '@ai-floor-planner/core';
import type { AIEditIntent } from './types';
import { resolveRoomTarget } from './target-resolver';

export interface LocalEditParseOptions {
  readonly activeFloorId?: string;
  readonly selectedRoomId?: string;
}

export interface LocalEditParseResult {
  readonly intent: AIEditIntent | null;
  readonly message?: string;
}

function unitToMm(value: number, unit?: string): number {
  if (unit?.startsWith('m') && unit !== 'mm') return Math.round(value * 1000);
  if (unit === 'ft' || unit === 'feet' || unit === 'foot') return Math.round(value * 304.8);
  return Math.round(value);
}

function targetQueryFrom(command: string, building: Building, options: LocalEditParseOptions): string | null {
  const lower = command.toLowerCase();
  if (/\b(selected|this room|current room)\b/.test(lower)) return 'selected room';
  const roomsByName = building.floors.flatMap(floor => floor.rooms)
    .sort((a, b) => b.name.length - a.name.length);
  const named = roomsByName.find(room => lower.includes(room.name.toLowerCase()));
  if (named) return named.name;
  const aliases = [
    'master bedroom', 'guest bedroom', 'living room', 'family living', 'family lounge',
    'servant quarter', 'pooja room', 'prayer room', 'study room', 'utility room',
    'bathroom', 'bedroom', 'kitchen', 'dining', 'study', 'office', 'balcony',
    'parking', 'garage', 'corridor', 'foyer',
  ];
  const alias = aliases.find(value => lower.includes(value));
  if (alias) {
    const ordinal = lower.match(/\b(first|second|third|fourth|fifth|sixth|\d+(?:st|nd|rd|th)?)\s+(?:master\s+|guest\s+)?(?:bedroom|bathroom)\b/);
    return ordinal ? ordinal[0] : alias;
  }
  return options.selectedRoomId ? 'selected room' : null;
}

export class RuleBasedEditParser {
  parse(command: string, building: Building, options: LocalEditParseOptions = {}): LocalEditParseResult {
    const text = command.trim();
    const lower = text.toLowerCase();
    if (!text) return { intent: null, message: 'Enter an edit instruction.' };
    const targetQuery = targetQueryFrom(text, building, options);
    if (!targetQuery) return { intent: null, message: 'Name or select the room to edit.' };

    const target = resolveRoomTarget(building, targetQuery, options.activeFloorId, options.selectedRoomId);
    const resolvedQuery = target.room?.id ?? targetQuery;

    const rename = text.match(/^rename\s+.+?\s+to\s+["']?(.+?)["']?$/i);
    if (rename) {
      const newName = rename[1]?.trim().slice(0, 80);
      return newName
        ? { intent: { action: 'rename_room', targetQuery: resolvedQuery, newName, reasoning: `Rename ${targetQuery} to ${newName}.` } }
        : { intent: null, message: 'Provide a non-empty room name.' };
    }

    if (/\b(move|shift|place|relocate)\b/.test(lower)) {
      const direction = /\b(north|up)\b/.test(lower) ? 'north'
        : /\b(south|down)\b/.test(lower) ? 'south'
          : /\b(east|right)\b/.test(lower) ? 'east'
            : /\b(west|left)\b/.test(lower) ? 'west'
              : 'auto';
      const distance = lower.match(/(?:by\s+)?(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)\b/);
      const distanceMm = distance ? unitToMm(Number(distance[1]), distance[2]) : 500;
      return {
        intent: {
          action: 'move_room',
          targetQuery: resolvedQuery,
          direction,
          distanceMm,
          reasoning: direction === 'auto' ? `Find a nearby valid position for ${targetQuery}.` : `Move ${targetQuery} ${direction} by ${distanceMm} mm.`,
        },
      };
    }

    if (/\b(resize|larger|bigger|increase|expand|smaller|decrease|shrink|reduce|wide|wider)\b/.test(lower)) {
      const dimensions = lower.match(/(?:to|at)?\s*(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)?\s*(?:x|×|by)\s*(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)?/);
      if (dimensions) {
        const unit = dimensions[2] ?? dimensions[4] ?? 'mm';
        return {
          intent: {
            action: 'resize_room',
            targetQuery: resolvedQuery,
            widthMm: unitToMm(Number(dimensions[1]), unit),
            heightMm: unitToMm(Number(dimensions[3]), unit),
            reasoning: `Resize ${targetQuery} to the requested dimensions.`,
          },
        };
      }
      const percent = lower.match(/(\d+(?:\.\d+)?)\s*%/);
      const shrink = /\b(smaller|decrease|shrink|reduce)\b/.test(lower);
      const delta = lower.match(/(?:by\s+)(\d+(?:\.\d+)?)\s*(mm|m|ft|feet|foot)\b/);
      if (delta) {
        const amount = unitToMm(Number(delta[1]), delta[2]);
        return {
          intent: {
            action: 'resize_room',
            targetQuery: resolvedQuery,
            dimensionDeltaMm: shrink ? -amount : amount,
            reasoning: `${shrink ? 'Reduce' : 'Increase'} ${targetQuery} dimensions by ${amount} mm.`,
          },
        };
      }
      const scalePercent = (shrink ? -1 : 1) * (percent ? Number(percent[1]) : 10);
      return {
        intent: {
          action: 'resize_room',
          targetQuery: resolvedQuery,
          scalePercent,
          reasoning: `${shrink ? 'Reduce' : 'Increase'} ${targetQuery} area by approximately ${Math.abs(scalePercent)}%.`,
        },
      };
    }

    return { intent: null, message: 'Supported edits are moving, resizing, or renaming a room.' };
  }
}
