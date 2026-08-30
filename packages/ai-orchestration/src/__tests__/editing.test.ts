import { describe, expect, it, vi } from 'vitest';
import type { AIProvider, AIRequest, AIResponse, Building, ModelInfo } from '@ai-floor-planner/core';
import {
  AITaskType,
  ChangeSource,
  EditorEngine,
  RoomType,
  UpdateRoomPropertiesCommand,
  createBuilding,
  createRoom,
  rectToPolygon,
} from '@ai-floor-planner/core';
import {
  AIEditPlanner,
  AI_EDIT_RESPONSE_SCHEMA,
  AIOrchestrationService,
  OpenAIProvider,
  RuleBasedEditParser,
  extractAIEditContext,
} from '../index';

function editingFixture(twoBedrooms = false): Building {
  const base = createBuilding({
    projectId: 'phase9-project',
    name: 'Phase 9 Fixture',
    site: { plotWidth: 10000, plotDepth: 10000 },
    floors: [{ buildingId: '', level: 0, name: 'Ground Floor', boundary: rectToPolygon(0, 0, 10000, 10000) }],
  });
  const floor = base.floors[0]!;
  const rooms = [
    createRoom({ floorId: floor.id, type: RoomType.Bedroom, name: twoBedrooms ? 'Bedroom 1' : 'Bedroom', x: 1000, y: 1000, width: 3200, height: 3200 }),
    createRoom({ floorId: floor.id, type: RoomType.Kitchen, name: 'Kitchen', x: 6000, y: 1000, width: 3000, height: 3000 }),
    ...(twoBedrooms ? [createRoom({ floorId: floor.id, type: RoomType.Bedroom, name: 'Bedroom 2', x: 1000, y: 6000, width: 3200, height: 3200 })] : []),
  ];
  return { ...base, floors: [{ ...floor, rooms }] };
}

function editResponse(parsed: Record<string, unknown>): AIResponse {
  return {
    content: JSON.stringify(parsed), parsed,
    usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    model: 'mock-edit-model', latencyMs: 1,
  };
}

class EditMockProvider implements AIProvider {
  readonly name = 'mock-edit';
  lastRequest: AIRequest | null = null;
  constructor(private readonly result: AIResponse) {}
  async complete(request: AIRequest) { this.lastRequest = request; return this.result; }
  async *stream(request: AIRequest) { yield { content: (await this.complete(request)).content, isComplete: true }; }
  async isAvailable() { return true; }
  getModelInfo(): ModelInfo { return { provider: this.name, model: 'mock-edit-model', contextWindow: 1000, supportsJson: true, supportsStreaming: false }; }
}

describe('Phase 9 AI editing', () => {
  it('extracts a compact model summary with active and selected-room context', () => {
    const building = editingFixture();
    const room = building.floors[0]!.rooms[0]!;
    const context = extractAIEditContext(building, building.floors[0]!.id, room.id);
    expect(context.rooms).toHaveLength(2);
    expect(context.selectedRoomId).toBe(room.id);
    expect(context.promptSummary).toContain('|selected');
    expect(context.promptSummary).not.toContain(JSON.stringify(building));
  });

  it('parses common resize, move, and rename instructions deterministically', () => {
    const building = editingFixture();
    const parser = new RuleBasedEditParser();
    expect(parser.parse('Make bedroom 20% larger', building).intent).toMatchObject({ action: 'resize_room', scalePercent: 20 });
    expect(parser.parse('Move kitchen east by 2 ft', building).intent).toMatchObject({ action: 'move_room', direction: 'east', distanceMm: 610 });
    expect(parser.parse('Rename kitchen to Chef Kitchen', building).intent).toMatchObject({ action: 'rename_room', newName: 'Chef Kitchen' });
  });

  it('uses the selected room for contextual commands', () => {
    const building = editingFixture();
    const bedroom = building.floors[0]!.rooms[0]!;
    const result = new RuleBasedEditParser().parse('Make selected room 10% smaller', building, { selectedRoomId: bedroom.id });
    expect(result.intent?.targetQuery).toBe(bedroom.id);
    expect(result.intent?.scalePercent).toBe(-10);
  });

  it('previews a hard-valid resize without mutating the source model', () => {
    const building = editingFixture();
    const bedroom = building.floors[0]!.rooms[0]!;
    const preview = new AIEditPlanner().preview(building, {
      action: 'resize_room', targetQuery: bedroom.id, scalePercent: 10, reasoning: 'Increase bedroom area by 10%.',
    }, { allowIncompleteDraft: true });
    expect(preview.status).toBe('ready');
    expect(preview.afterValidation?.isValid).toBe(true);
    expect(preview.afterBuilding?.version).toBe(building.version + 1);
    expect(building.floors[0]!.rooms[0]!.area).toBe(10_240_000);
    expect(preview.command?.versionSnapshot.changeSource).toBe(ChangeSource.AIEdit);
  });

  it('finds a bounded hard-valid placement for the roadmap command “move kitchen”', () => {
    const building = editingFixture();
    const kitchen = building.floors[0]!.rooms[1]!;
    const parsed = new RuleBasedEditParser().parse('move kitchen', building);
    const preview = new AIEditPlanner().preview(building, parsed.intent!, { allowIncompleteDraft: true });
    const movedKitchen = preview.afterBuilding?.floors[0]!.rooms.find(room => room.id === kitchen.id);
    expect(preview.status).toBe('ready');
    expect(preview.validCandidates).toBeGreaterThan(0);
    expect(movedKitchen && (movedKitchen.x !== kitchen.x || movedKitchen.y !== kitchen.y)).toBe(true);
    expect(preview.afterValidation?.isValid).toBe(true);
  });

  it('maps a validated edit into one undoable and redoable editor transaction', () => {
    const building = editingFixture();
    const preview = new AIEditPlanner().preview(building, {
      action: 'rename_room', targetQuery: 'Kitchen', newName: 'Chef Kitchen', reasoning: 'Rename Kitchen to Chef Kitchen.',
    }, { allowIncompleteDraft: true });
    expect(preview.command).not.toBeNull();
    const engine = new EditorEngine(building);
    engine.execute(preview.command!);
    expect(engine.getBuilding().version).toBe(2);
    expect(engine.getBuilding().floors[0]!.rooms[1]!.name).toBe('Chef Kitchen');
    expect(engine.getState().historySummary.undoCount).toBe(1);
    expect(engine.undo()).toBe(true);
    expect(engine.getBuilding()).toBe(building);
    expect(engine.redo()).toBe(true);
    expect(engine.getBuilding().version).toBe(2);
  });

  it('rejects stale previews after an intervening manual edit', () => {
    const building = editingFixture();
    const kitchen = building.floors[0]!.rooms[1]!;
    const preview = new AIEditPlanner().preview(building, {
      action: 'rename_room', targetQuery: kitchen.id, newName: 'Chef Kitchen', reasoning: 'Rename Kitchen.',
    }, { allowIncompleteDraft: true });
    const engine = new EditorEngine(building);
    engine.execute(new UpdateRoomPropertiesCommand(kitchen.id, { name: 'Manual Name' }));
    expect(() => engine.execute(preview.command!)).toThrow(/changed after.*previewed/i);
    expect(engine.getBuilding().floors[0]!.rooms[1]!.name).toBe('Manual Name');
  });

  it('rejects impossible geometry and never exposes an apply command', () => {
    const building = editingFixture();
    const preview = new AIEditPlanner().preview(building, {
      action: 'resize_room', targetQuery: 'Bedroom', widthMm: 20000, heightMm: 20000, reasoning: 'Oversize Bedroom.',
    }, { allowIncompleteDraft: true });
    expect(preview.status).toBe('rejected');
    expect(preview.command).toBeNull();
    expect(preview.validCandidates).toBe(0);
  });

  it('requests clarification when a type query matches multiple rooms', () => {
    const building = editingFixture(true);
    const preview = new AIEditPlanner().preview(building, {
      action: 'move_room', targetQuery: 'bedroom', direction: 'auto', distanceMm: 500, reasoning: 'Move bedroom.',
    }, { allowIncompleteDraft: true });
    expect(preview.status).toBe('clarification_required');
    expect(preview.message).toMatch(/matches 2 rooms/i);
  });

  it('accepts provider edit schema output and falls back on invalid output', async () => {
    const building = editingFixture();
    const validProvider = new EditMockProvider(editResponse({
      action: 'move_room', targetQuery: 'Kitchen', direction: 'east', distanceMm: 300,
      widthMm: 0, heightMm: 0, scalePercent: 0, dimensionDeltaMm: 0, newName: '', reasoning: 'Move Kitchen east.',
    }));
    const valid = await new AIOrchestrationService(validProvider).parseEditCommandDetailed('move kitchen east by 300 mm', building);
    expect(valid.source).toBe('provider');
    expect(valid.intent?.action).toBe('move_room');
    expect(validProvider.lastRequest?.taskType).toBe(AITaskType.NaturalLanguageEdit);
    expect(validProvider.lastRequest?.responseSchemaName).toBe('floor_plan_edit');

    const invalidProvider = new EditMockProvider(editResponse({ action: 'delete_everything' }));
    const fallback = await new AIOrchestrationService(invalidProvider).parseEditCommandDetailed('rename kitchen to Safe Kitchen', building);
    expect(fallback.source).toBe('rule_based_fallback');
    expect(fallback.intent).toMatchObject({ action: 'rename_room', newName: 'Safe Kitchen' });
  });

  it('sends the Phase 9 schema through the OpenAI structured-output adapter', async () => {
    const payload = {
      action: 'rename_room', targetQuery: 'Kitchen', direction: 'auto', distanceMm: 0,
      widthMm: 0, heightMm: 0, scalePercent: 0, dimensionDeltaMm: 0,
      newName: 'Chef Kitchen', reasoning: 'Rename Kitchen.',
    };
    const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const requestBody = JSON.parse(String(init?.body));
      expect(requestBody.text.format.name).toBe('floor_plan_edit');
      expect(requestBody.text.format.schema).toEqual(AI_EDIT_RESPONSE_SCHEMA);
      return new Response(JSON.stringify({ output_text: JSON.stringify(payload), model: 'test-edit', usage: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });
    const provider = new OpenAIProvider({ apiKey: 'test-key', model: 'test-edit', fetchImplementation: fetchMock as typeof fetch });
    const response = await provider.complete({
      taskType: AITaskType.NaturalLanguageEdit,
      systemPrompt: 'parse edit',
      userPrompt: 'rename kitchen',
      responseFormat: 'json',
      responseSchema: AI_EDIT_RESPONSE_SCHEMA,
      responseSchemaName: 'floor_plan_edit',
    });
    expect(response.parsed?.action).toBe('rename_room');
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
