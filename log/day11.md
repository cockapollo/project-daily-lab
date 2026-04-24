# Day 11: Tiered max_tokens + Prompt Caching

## Goals

1. **Fix `length=detailed` truncation** — replace the global `max_tokens: 200` cap with a per-length map so `brief` and `detailed` each get a purposeful limit.
2. **Add prompt caching on the system prompt** — structure the system field as a content array with `cache_control: {type: "ephemeral"}` to enable caching on repeated calls.

## Spec

### Tiered max_tokens

| length   | max_tokens | Rationale                          |
|----------|------------|------------------------------------|
| brief    | 80         | 1 sentence; 200 was excessive      |
| normal   | 200        | 2–3 sentences; unchanged           |
| detailed | 450        | 4–6 sentences; fixes truncation    |

### Prompt caching

Convert the `system` field from a plain string to a content array:

```json
"system": [
  { "type": "text", "text": "...", "cache_control": { "type": "ephemeral" } }
]
```

Prompt caching is GA — no `anthropic-beta` header required.

**Effective range note:** Haiku 4.5 requires a minimum of 4096 tokens in the cached prefix before caching activates (below that the marker is silently ignored — no error, `cache_creation_input_tokens: 0`). The system prompt alone is ~50 tokens. Caching becomes effective once a city's full weather history context pushes the total prompt past 4096 tokens. The implementation is correct and forward-compatible; it simply won't cache on small datasets.

---

## About Claude Haiku

**What it is:** Claude Haiku is Anthropic's fastest and most cost-efficient model in the Claude family. The current version used here is `claude-haiku-4-5-20251001` (Claude Haiku 4.5). It sits at the bottom of the cost tier — roughly $1/million input tokens and $5/million output tokens — compared to Sonnet (~3×) or Opus (~5×).

**Why this project uses it:** The `/summary` endpoint generates short, structured weather summaries from a fixed dataset. The task is low-complexity: the prompt is small, the output is bounded (80–450 tokens), and correctness depends on the provided data rather than broad reasoning. Haiku handles this well and keeps API costs low per request.

**Haiku's trade-offs in this context:**

| Characteristic | Impact here |
|---|---|
| Fastest response time | `/summary` returns quickly even without streaming |
| Lowest cost | Repeated calls (e.g. `mode=anomaly`, `length=detailed`) are cheap |
| 200K context window | Well above what weather history records need |
| 4096-token cache minimum | System prompt (~50 tokens) is too short to cache until history grows large |

**Model string:** `claude-haiku-4-5-20251001` — the full dated ID is used here for pinning; the alias `claude-haiku-4-5` resolves to the same model.

## Changes

| File | Change |
|------|--------|
| `src/handlers/summary.js` | Add `MAX_TOKENS` map; update `callClaude(systemPrompt, prompt, length)`; structured system array with `cache_control`; add `anthropic-beta` header |
