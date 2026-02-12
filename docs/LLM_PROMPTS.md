# LLM + Prompts Guide

This document describes how this project builds prompts and calls the LLM (Ollama), including prompt templates, output formats, feature flags, parsing/validation, and tracing.

## TL;DR

- **LLM client**: [backend/src/services/ollama.js](../backend/src/services/ollama.js)
- **Prompt templates**: [backend/src/prompts/](../backend/src/prompts/)
- **Personas (system prompts)**: [backend/src/prompts/personas.js](../backend/src/prompts/personas.js)
- **Prompt assembly helper**: [backend/src/prompts/promptBuilder.js](../backend/src/prompts/promptBuilder.js)
- **AI config / env flags**: [backend/src/config/ai.js](../backend/src/config/ai.js)
- **Tracing**: [backend/src/services/tracing.js](../backend/src/services/tracing.js) (docs: [TRACING.md](../TRACING.md))

## Architecture Diagram

See [LLM_FLOWCHART.mmd](LLM_FLOWCHART.mmd) for the complete architecture diagram showing:
- Request flow from Frontend → API → Routes
- MongoDB persistence (Biography + ChatMessage collections)
- Prompt template organization in `backend/src/prompts/*`
- AI configuration via `getAIConfig()`
- Ollama REST API integration
- Output parsing/validation utilities
- Tracing and logging observability

## LLM call sites

All LLM traffic goes through `OllamaService` in [backend/src/services/ollama.js](../backend/src/services/ollama.js).

The current operations are:

- `ollama.generateBiography(rawInput)`
- `ollama.refineBiography(currentBiography, userMessage, conversationHistory)`
- `ollama.extractKeywords(text)`
- `ollama.proposeBiographyFieldUpdates(currentFields, userMessage)`
- `ollama.generateMentorSummary(rawInput)`

Each method:
1. Reads config via `getAIConfig()`.
2. Builds a prompt with a template in `backend/src/prompts/*`.
3. Sends `POST {baseUrl}/api/generate` with `stream: false`.
4. Parses/validates the response.
5. Emits a trace span (`tracingService.startSpan` / `endSpan`).

## Prompt assembly model

All prompt templates use `assemblePrompt()` from [backend/src/prompts/promptBuilder.js](../backend/src/prompts/promptBuilder.js), which builds a single text prompt from consistent blocks:

- `SYSTEM` (persona / style)
- `TASK` (what to do)
- `DATA: ...` sections (inputs)
- `OUTPUT` rules (format constraints)

A key design choice is to keep the persona separate from data:

- If `AI_USE_OLLAMA_SYSTEM=true`, the persona is sent via the Ollama request-body `system` field and **omitted** from the prompt text (`includeSystemInPrompt=false`).
- Otherwise, the persona is included as a `### SYSTEM` section in the prompt body.

Personas are defined in [backend/src/prompts/personas.js](../backend/src/prompts/personas.js).

## Prompt catalog

### Biography generation

- Template: `generateBiographyPrompt` in [backend/src/prompts/biography.js](../backend/src/prompts/biography.js)
- Persona: `SYSTEM_PERSONAS.biographyWriter`
- Output: **plain text only** (200–400 words)

### Biography refinement (chat)

- Template: `refineBiographyPrompt` in [backend/src/prompts/refinement.js](../backend/src/prompts/refinement.js)
- Persona: `SYSTEM_PERSONAS.biographyRefiner`
- Inputs:
  - `CURRENT_BIOGRAPHY`
  - optional `PREVIOUS_CONVERSATION` (built by `buildConversationContext()`)
  - `USER_REQUEST`
- Output: **plain text only**
- Validation: `isValidBiographyText()` rejects “confused assistant” replies

### Keyword extraction

- Template: `extractKeywordsPrompt` in [backend/src/prompts/keywords.js](../backend/src/prompts/keywords.js)
- Persona: `SYSTEM_PERSONAS.keywordExtractor`
- Output: **JSON only** in the shape:

  ```json
  {"keywords":["...","..."]}
  ```

- Parsing strategy:
  - First try tolerant JSON parse via `parseJsonFromText()` (handles code fences + extra text).
  - Fallback: comma-separated parsing via `parseKeywords()` for backward compatibility.

### Structured field updates

- Template: `proposeFieldUpdatesPrompt` in [backend/src/prompts/fieldUpdates.js](../backend/src/prompts/fieldUpdates.js)
- Persona: `SYSTEM_PERSONAS.fieldUpdater`
- Purpose: extract *explicit* profile field updates from a user chat message (no inference)
- Output: **JSON only** in the shape:

  ```json
  {"updates":{},"explanations":[]}
  ```

- Notes:
  - Uses a `CURRENT_FIELDS_TRUTH` block to reduce hallucinations.
  - Uses `ALLOWED_FIELDS` constraints to keep output bounded.
  - The LLM call is **non-fatal**: failures return `null` so the app can continue.

### Mentor summary

- Template: `generateMentorSummaryPrompt` in [backend/src/prompts/mentorSummary.js](../backend/src/prompts/mentorSummary.js)
- Persona: `SYSTEM_PERSONAS.mentorSummaryWriter`
- Output: plain text with formatting rules (intro paragraph + hyphen bullets)
- Normalization: `normalizeMentorSummary()` cleans bullet formatting

## AI configuration (env vars)

Configuration is resolved by [backend/src/config/ai.js](../backend/src/config/ai.js).

Preferred variables:

```env
AI_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1

# Optional knobs
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=512
AI_TIMEOUT_MS=60000
AI_MAX_RETRIES=2
AI_RETRY_INITIAL_DELAY_MS=250
AI_RETRY_BACKOFF_MULTIPLIER=2

# Feature flags
AI_USE_OLLAMA_SYSTEM=true
AI_USE_OLLAMA_JSON_FORMAT=true
```

Backwards-compatible variables:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

### Feature flags

- `AI_USE_OLLAMA_SYSTEM`
  - When `true`, send persona via request-body `system`.
  - When `false`, persona is embedded into the prompt text under `### SYSTEM`.

- `AI_USE_OLLAMA_JSON_FORMAT`
  - When `true`, JSON-only operations include `format: "json"` in the Ollama request body.
  - The code still performs tolerant parsing because models may still produce extra text.

## Tracing + observability

Every LLM operation creates a tracing span with metadata such as:
- provider, base URL, endpoint, model
- temperature / max tokens
- retries and HTTP timeout
- input/output sizes
- token usage (when available from Ollama: `eval_count`, `prompt_eval_count`)

Tracing implementation: [backend/src/services/tracing.js](../backend/src/services/tracing.js)

Tracing docs and query endpoints: [TRACING.md](../TRACING.md)

## Testing touchpoints

Backend tests cover AI config and request options; run:

```bash
cd backend
npm test
```
