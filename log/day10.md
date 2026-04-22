# Day 10 - Weathercode Decoding

## Overview

Decode WMO weathercodes into human-readable labels before sending weather history to Claude. Previously, the summary prompt included raw integers (e.g. `code: 63`), requiring Claude to infer meaning from its training data — contradicting the system prompt's instruction to use only provided data.

## Motivation

The `mode=anomaly` parameter (Day 09) asks Claude to flag unusual conditions. With raw codes, Claude must silently translate `63 → "Moderate rain"` using its own knowledge, which is exactly the kind of inference the system prompt prohibits. Decoded labels make the data self-describing and eliminate the contradiction.

This was tracked as D8-Future-1.

## Changes

### `src/utils/weathercodes.js` — new file

A module containing the full WMO weathercode enum and a `decode(code)` function:

```js
decode(63)  // → "Moderate rain"
decode(999) // → "Unknown (code: 999)"
```

### `src/handlers/summary.js` — updated

Two changes:

1. Replaced `code: ${r.weathercode}` with `conditions: ${decode(r.weathercode)}` in the context string:

Before:
```
2026-03-05T12:00 — temp: 8.8°C, wind: 2 km/h, code: 63
```

After:
```
2026-03-05T12:00 — temp: 8.8°C, wind: 2 km/h, conditions: Moderate rain
```

2. Added `?refresh=true` parameter — sets `skipCache = true` regardless of other params, allowing cache bypass without needing a non-default `length` or `mode`.

## Project Structure Changes

```
ai-helloworld/
  src/
    utils/
      weathercodes.js   # NEW: WMO code enum + decode()
    handlers/
      summary.js        # UPDATED: use decode(r.weathercode)
```

## Acceptance Criteria

1. `GET /summary?city=Tokyo` → 200; summary references weather conditions by name, not raw codes
2. `GET /summary?city=Tokyo&refresh=true` → 200 with `cached: false`; forces fresh Claude call
3. `GET /summary?city=Tokyo&mode=anomaly` → 200; anomaly detection more precise with decoded labels
4. `decode(0)` → `"Clear sky"`, `decode(99)` → `"Thunderstorm with heavy hail"`, `decode(999)` → `"Unknown (code: 999)"`
5. Regression: `GET /hello` → 200, `GET /weather?city=Tokyo` → 200

## Future (not in scope for Day 10)

- Cache per `(city, length, mode)` composite key (D9-Future-1)
- Stream the Claude response back to the caller (D9-Future-2)
- Increase `max_tokens` for `length=detailed` (D9-Future-3)
