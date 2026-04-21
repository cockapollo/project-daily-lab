# Day 09 - Summary Length & Mode Parameters

## Overview

Two new optional query parameters for `GET /summary` that give callers finer control over the AI-generated response:

1. **`length`** — controls verbosity: `brief` | `normal` (default) | `detailed`
2. **`mode`** — controls analytical focus: `trend` | `anomaly` (omit for general summary)

These are orthogonal dimensions and can be combined freely.

## Motivation

The Day 06–08 implementation produced a fixed 2–3 sentence general summary. Different use cases need different outputs:

- A dashboard widget wants one concise sentence (`brief`)
- A report needs a full paragraph with all variables covered (`detailed`)
- A user tracking seasonal change wants direction-focused analysis (`mode=trend`)
- An alert system wants outlier detection (`mode=anomaly`)

Separating length from focus keeps the parameter space clean — callers can mix any combination without needing a combinatorial `mode` enum.

## Endpoint Changes

### `GET /summary?city={city}` — updated query parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `city` | string | yes | — | City name (case-insensitive) |
| `from` | string | no | — | ISO 8601 lower bound (inclusive) |
| `to` | string | no | — | ISO 8601 upper bound (inclusive) |
| `length` | string | no | `normal` | Response length: `brief` \| `normal` \| `detailed` |
| `mode` | string | no | — | Analytical focus: `trend` \| `anomaly` |

Invalid values for `length` or `mode` return `400`.

### Response shape (unchanged)

```json
{
  "city": "Tokyo",
  "record_count": 14,
  "summary": "...",
  "cached": false
}
```

### Examples

```
GET /summary?city=Tokyo                              # normal summary, cache active
GET /summary?city=Tokyo&length=brief                 # 1-sentence summary
GET /summary?city=Tokyo&length=detailed              # full paragraph
GET /summary?city=Tokyo&mode=trend                   # trend-focused, normal length
GET /summary?city=Tokyo&mode=anomaly                 # outlier-focused, normal length
GET /summary?city=Tokyo&length=detailed&mode=trend   # full paragraph, trend-focused
```

## Prompt Strategy

Both parameters are expressed through the system prompt. The base instruction stays the same; length and mode instructions are appended:

### Length instructions

| Value | System prompt addition |
|-------|----------------------|
| `brief` | "Respond in exactly 1 sentence." |
| `normal` | "Respond in 2-3 sentences." |
| `detailed` | "Respond in a full paragraph (4-6 sentences), covering temperature, wind, and weather conditions in depth." |

### Mode instructions

| Value | System prompt addition |
|-------|----------------------|
| `trend` | "Focus on directional patterns and changes over time — is it getting warmer, cooler, windier, or calmer?" |
| `anomaly` | "Focus on outliers and unusual readings — flag any spikes, drops, or data points that deviate significantly from the rest." |

### Example system prompt (`length=detailed&mode=anomaly`)

> "You are a weather analyst. Use only the data provided. Do not add external knowledge, forecasts, or inferences beyond what the records show. Respond in a full paragraph (4-6 sentences), covering temperature, wind, and weather conditions in depth. Focus on outliers and unusual readings — flag any spikes, drops, or data points that deviate significantly from the rest."

## Cache Behaviour

Cache is only used when the request matches the default profile (`length=normal`, no `mode`). Any non-default combination bypasses the cache (both read and write).

Rationale: caching per `(city, length, mode)` composite key is possible but adds eviction complexity. Since non-default requests are typically intentional/exploratory, skipping the cache is the simpler and more correct choice for now.

```
isCustomized = length !== 'normal' || !!mode
isFiltered   = from || to
skipCache    = isFiltered || isCustomized

skipCache?
  ├─ YES → call Claude fresh, never read/write cache
  └─ NO  → existing hybrid cache logic (TTL + based_on_record_time)
```

## Implementation

### `src/handlers/summary.js`

**New constants:**

```js
const VALID_LENGTHS = ['brief', 'normal', 'detailed'];
const VALID_MODES   = ['trend', 'anomaly'];

const LENGTH_INSTRUCTIONS = {
  brief:    'Respond in exactly 1 sentence.',
  normal:   'Respond in 2-3 sentences.',
  detailed: 'Respond in a full paragraph (4-6 sentences), covering temperature, wind, and weather conditions in depth.',
};

const MODE_INSTRUCTIONS = {
  trend:   'Focus on directional patterns and changes over time — is it getting warmer, cooler, windier, or calmer?',
  anomaly: 'Focus on outliers and unusual readings — flag any spikes, drops, or data points that deviate significantly from the rest.',
};
```

**Dynamic system prompt:**

```js
function buildSystemPrompt(length, mode) {
  const parts = [
    'You are a weather analyst. Use only the data provided. Do not add external knowledge, forecasts, or inferences beyond what the records show.',
    LENGTH_INSTRUCTIONS[length],
  ];
  if (mode) parts.push(MODE_INSTRUCTIONS[mode]);
  return parts.join(' ');
}
```

**`callClaude` updated signature:**

```js
function callClaude(systemPrompt, prompt) { ... }
```

**Parameter parsing and validation (in `summaryHandler`):**

```js
const length = searchParams.get('length') || 'normal';
const mode   = searchParams.get('mode')   || undefined;

if (!VALID_LENGTHS.includes(length)) {
  // 400: Invalid value for length
}
if (mode && !VALID_MODES.includes(mode)) {
  // 400: Invalid value for mode
}
```

**Cache bypass:**

```js
const isFiltered   = from || to;
const isCustomized = length !== 'normal' || !!mode;
const skipCache    = isFiltered || isCustomized;
```

## Project Structure Changes

No new files. Modified only:

```
ai-helloworld/
  src/
    handlers/
      summary.js    # UPDATED: length + mode params, dynamic system prompt, cache bypass
```

## Acceptance Criteria

1. `GET /summary?city=Tokyo` → 200; behaviour unchanged (cache active, 2-3 sentence summary)
2. `GET /summary?city=Tokyo&length=brief` → 200; summary is 1 sentence; `cached: false` always
3. `GET /summary?city=Tokyo&length=detailed` → 200; summary is a full paragraph; `cached: false` always
4. `GET /summary?city=Tokyo&mode=trend` → 200; summary focuses on directional change; `cached: false` always
5. `GET /summary?city=Tokyo&mode=anomaly` → 200; summary flags outliers; `cached: false` always
6. `GET /summary?city=Tokyo&length=detailed&mode=trend` → 200; long trend-focused summary; `cached: false`
7. `GET /summary?city=Tokyo&length=bad` → 400 `{"error": "Invalid value for length: bad"}`
8. `GET /summary?city=Tokyo&mode=bad` → 400 `{"error": "Invalid value for mode: bad"}`
9. Regression: `GET /hello` → 200, `GET /weather?city=Tokyo` → 200, `GET /summary?city=Tokyo` → 200 with cache working

## Future (not in scope for Day 09)

- Decode weathercodes into human-readable labels before sending to Claude (D8-Future-1 backlog)
- Cache per `(city, length, mode)` composite key to serve repeated non-default requests from cache
- Stream the Claude response back to the caller for lower time-to-first-byte
