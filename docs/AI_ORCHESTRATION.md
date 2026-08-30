# AI Floor Planner — AI Orchestration Specification

## 1. Purpose

The AI Orchestration layer manages all interactions with language models. It provides a unified abstraction over multiple AI providers, enforces safety boundaries, and routes tasks to appropriate models.

---

## 2. Core Principle: AI Safety Boundary

AI is NEVER allowed to directly:
- Write arbitrary geometry coordinates
- Bypass constraint validation
- Declare a plan safe for construction
- Claim engineering or regulatory approval
- Override hard constraints
- Fabricate dimensions
- Fabricate compliance status

**AI proposes. The system validates.**

---

## 3. Architecture

```
┌──────────────────────────────────────────────┐
│              AI Orchestration Layer            │
│                                               │
│  ┌─────────────┐    ┌─────────────────────┐  │
│  │  AI Router  │───▶│  Task Classifier    │  │
│  └─────────────┘    └─────────────────────┘  │
│         │                                     │
│         ▼                                     │
│  ┌─────────────────────────────────────────┐  │
│  │         Provider Abstraction             │  │
│  │  ┌────────┐ ┌────────┐ ┌────────────┐  │  │
│  │  │ Gemini │ │ OpenAI │ │   Claude   │  │  │
│  │  └────────┘ └────────┘ └────────────┘  │  │
│  └─────────────────────────────────────────┘  │
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │         Response Validator              │  │
│  │  (enforces safety boundary)             │  │
│  └─────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 4. AI Provider Interface

```typescript
interface AIProvider {
  name: string;
  
  // Core capability
  complete(request: AIRequest): Promise<AIResponse>;
  
  // Streaming support
  stream(request: AIRequest): AsyncIterable<AIChunk>;
  
  // Health check
  isAvailable(): Promise<boolean>;
  
  // Model info
  getModelInfo(): ModelInfo;
}

interface AIRequest {
  taskType: AITaskType;
  systemPrompt: string;
  userPrompt: string;
  context?: AIContext;
  responseFormat?: 'json' | 'text';
  temperature?: number;
  maxTokens?: number;
}

interface AIResponse {
  content: string;
  parsed?: Record<string, any>;  // If JSON response
  usage: TokenUsage;
  model: string;
  latencyMs: number;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
```

---

## 5. Provider Implementations

### 5.1 GeminiProvider

- Model: gemini-2.0-flash / gemini-2.0-pro
- Best for: requirement extraction, plan explanation, general reasoning
- Context window: large
- Cost: moderate

### 5.2 OpenAIProvider

- Model: gpt-4o / gpt-4o-mini
- Best for: structured output, JSON mode, precise instructions
- Context window: 128K
- Cost: varies by model

### 5.3 ClaudeProvider

- Model: claude-sonnet / claude-haiku
- Best for: complex reasoning, design critique, nuanced analysis
- Context window: 200K
- Cost: varies by model

---

## 6. AI Router

The router selects the appropriate provider based on task type, availability, and cost.

```typescript
interface AIRouter {
  route(task: AITask): Promise<AIProvider>;
}

enum AITaskType {
  REQUIREMENT_EXTRACTION = 'requirement_extraction',
  PLAN_EXPLANATION = 'plan_explanation',
  DESIGN_CRITIQUE = 'design_critique',
  NATURAL_LANGUAGE_EDIT = 'natural_language_edit',
  ROOM_NAMING = 'room_naming',
  VASTU_ANALYSIS = 'vastu_analysis',
  IMAGE_UNDERSTANDING = 'image_understanding',
  COMPLEX_REASONING = 'complex_reasoning',
}
```

### Default Routing Table

| Task Type | Primary | Fallback |
|-----------|---------|----------|
| Requirement Extraction | Gemini Flash | OpenAI Mini |
| Plan Explanation | Gemini Flash | Claude Haiku |
| Design Critique | Claude Sonnet | GPT-4o |
| NL Edit Parsing | GPT-4o | Gemini Pro |
| Image Understanding | Gemini Pro | GPT-4o |
| Complex Reasoning | Claude Sonnet | GPT-4o |

---

## 7. AI Tasks

### 7.1 Requirement Extraction

**Input**: Natural-language project description from user.
**Output**: Structured `UserRequirements` object.

Example:
```
Input: "I need a 30x50 east-facing 3BHK with 2 bathrooms, 
        modular kitchen, pooja room, and covered parking. 
        Vastu compliant. Ground + 1 floor."

Output: {
  plotWidth: 9144,    // 30ft in mm
  plotDepth: 15240,   // 50ft in mm
  orientation: 90,    // East = 90°
  floors: 2,
  rooms: [
    { type: "bedroom", count: 3, priority: 8 },
    { type: "bathroom", count: 2, priority: 7 },
    { type: "kitchen", count: 1, priority: 9 },
    { type: "pooja", count: 1, priority: 6 },
    { type: "parking", count: 1, priority: 7 },
    { type: "living", count: 1, priority: 8 },
    { type: "dining", count: 1, priority: 7 }
  ],
  preferences: {
    vastuCompliance: true,
    naturalLight: "high",
    parkingRequired: true
  }
}
```

### 7.2 Natural Language Edit Parsing

**Input**: User's edit command + current Building Model summary.
**Output**: Structured edit operations.

Example:
```
Input: "Make the master bedroom larger"
Context: { masterBedroom: { id: "room-123", width: 3600, height: 4200 } }

Output: {
  operations: [
    {
      type: "resize",
      targetId: "room-123",
      changes: { width: 4200, height: 4800 },
      reasoning: "Increased master bedroom from 3.6x4.2m to 4.2x4.8m"
    }
  ]
}
```

### 7.3 Design Critique

**Input**: Building Model + scores.
**Output**: Natural-language critique with specific improvement suggestions.

### 7.4 Plan Explanation

**Input**: Building Model.
**Output**: Human-readable description of the plan layout, design choices, and trade-offs.

---

## 8. Response Validation

Every AI response passes through validation before reaching the application:

```typescript
interface ResponseValidator {
  // Validate structured requirement extraction
  validateRequirements(response: any): ValidatedRequirements | ValidationError;
  
  // Validate edit operations
  validateEditOps(response: any, model: Building): ValidatedOps | ValidationError;
  
  // Ensure no prohibited content
  sanitize(response: AIResponse): AIResponse;
}
```

Validation rules:
1. All dimensions must be positive numbers.
2. Room types must be from the defined enum.
3. Edit operations must reference valid entity IDs.
4. No response may claim regulatory compliance.
5. Coordinates must be within plot boundaries.

---

## 9. Context Management

AI requests include relevant context, never the entire application state:

```typescript
interface AIContext {
  // Only what's needed for the specific task
  plotDimensions?: { width: number; depth: number };
  roomSummary?: RoomSummary[];
  currentScores?: PlanScore;
  userPreferences?: DesignPreferences;
  editHistory?: string[];  // Recent edits for context
}
```

Never send to AI:
- User credentials
- Billing information
- Other users' data
- Internal system prompts (beyond task-specific ones)
- Database connection strings

---

## 10. Error Handling & Fallback

```typescript
interface AIErrorHandler {
  // Retry with same provider
  retry(request: AIRequest, provider: AIProvider, maxRetries: number): Promise<AIResponse>;
  
  // Fallback to alternate provider
  fallback(request: AIRequest, failedProvider: string): Promise<AIResponse>;
  
  // Graceful degradation
  degrade(taskType: AITaskType): DegradedResponse;
}
```

Degradation strategy:
- If AI is completely unavailable, the system still functions for manual editing.
- Requirement extraction falls back to a form-based input.
- Edit parsing falls back to "could not understand, please try again."
- Critique/explanation features show "AI unavailable" with plan scores still visible.

---

## 11. Rate Limiting & Cost Control

```typescript
interface UsageTracker {
  trackRequest(userId: string, task: AITaskType, usage: TokenUsage): void;
  checkQuota(userId: string): QuotaStatus;
  estimateCost(request: AIRequest): CostEstimate;
}
```

Per-user daily limits (configurable per plan tier):
- Free: 50 AI requests/day
- Pro: 500 AI requests/day
- Enterprise: unlimited

---

## 12. Testing Strategy

- Mock providers for unit tests (deterministic responses).
- Integration tests against real providers (gated behind env flags).
- Response validation tests with malformed/adversarial AI outputs.
- Fallback tests: simulate provider failures.
- Cost tracking accuracy tests.
