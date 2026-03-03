# Day 06 - Weather Summary Endpoint (AI-Generated)

## Overview

Add a `GET /summary?city={city}` endpoint that:

1. Fetches all stored weather history for the city from `store.db`.
2. Converts the records into a natural-language prompt.
3. Sends the prompt to the Claude API.
4. Returns the AI-generated 2–3 sentence summary to the caller.

## Motivation

- Make historical weather data human-readable without the caller needing to interpret raw numbers.
- Leverage the Claude API to produce concise, meaningful trend descriptions.
- Keep the response lightweight — a short paragraph instead of a large JSON array.

## Endpoint

```
GET /summary?city={city}
```

| Parameter | Required | Description |
|-----------|----------|-------------|
| `city`    | Yes      | City name (case-insensitive). Matched against the lowercase `city` column in `weather_history`. |

### Success Response — `200 OK`

```json
{
  "city": "Tokyo",
  "record_count": 5,
  "summary": "Tokyo has seen mild temperatures ranging from 9.5°C to 11.2°C over the last few readings, with light winds averaging around 4 km/h. Conditions have been mostly clear with occasional light cloud cover. Overall, the weather trend appears stable with no significant changes expected."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | Display name from the `locations` table; falls back to the input city string. |
| `record_count` | number | Number of history rows used to generate the summary. |
| `summary` | string | AI-generated 2–3 sentence natural language summary of weather trends. |

### Error Responses

| Status | Condition | Body |
|--------|-----------|------|
| 400 | `city` parameter missing | `{ "error": "Missing required query parameter: city" }` |
| 404 | No history rows found for the city | `{ "error": "No weather history found for: {city}" }` |
| 405 | Non-GET request | `{ "error": "Method Not Allowed" }` |
| 502 | Claude API call fails | `{ "error": "Failed to generate summary" }` |

## Implementation Flow

```
GET /summary?city=Tokyo
      │
      ▼
1. Query weather_history WHERE city = 'tokyo' ORDER BY time ASC
      │
      ▼
2. Format records as natural-language context string:
   "City: Tokyo. Weather history (oldest to newest):
    2026-03-04T00:00 — temp: 9.5°C, wind: 3.2 km/h, code: 1
    2026-03-04T00:30 — temp: 10.1°C, wind: 4.0 km/h, code: 2
    ..."
      │
      ▼
3. POST to Claude API (claude-haiku-4-5-20251001) with prompt:
   "Summarize the weather trend for {city} in 2-3 sentences
    based on the following history: {context}"
      │
      ▼
4. Return { city, record_count, summary: <claude response> }
```

## Changes

### Environment

- Add `ANTHROPIC_API_KEY` to the environment (`.env` file or shell export).
- The server reads this key to authenticate Claude API requests.

### `src/cache/weather.js`

Add a new exported function `getHistory`:

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `getHistory` | `getHistory(city) → array` | Returns all rows ordered by `time ASC`. Each element: `{ time, temperature, windspeed, weathercode }`. Returns `[]` if no rows. |

SQL:
```sql
SELECT time, data FROM weather_history WHERE city = ? ORDER BY time ASC
```

### `src/handlers/summary.js` — new file

Handler logic:

1. Reject non-GET requests → 405.
2. Parse `city`; return 400 if absent.
3. Call `weatherHistory.getHistory(city)` → return 404 if empty.
4. Look up display name via `locationCache.get(city)`; fall back to raw city string.
5. Build a natural-language context string from the history rows.
6. Call Claude API (`claude-haiku-4-5-20251001`) with the context + instruction prompt.
7. Return 200 `{ city, record_count, summary }`.

### Claude API Call

- **Model:** `claude-haiku-4-5-20251001`
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Max tokens:** 200 (sufficient for 2–3 sentences)
- **System prompt:** `"You are a weather analyst. Summarize the weather trend in 2-3 sentences using only the data provided. Do not add external knowledge, forecasts, or inferences beyond what the records show."`
- **User message:** the formatted history context

> **Important:** The system prompt explicitly restricts Claude to the provided records only. Without this constraint, Claude uses its own world knowledge (e.g. interpreting WMO weathercodes, adding seasonal context) rather than grounding the summary in the actual stored data — making the DB records redundant.

### `src/router.js`

```js
const summaryHandler = require('./handlers/summary');

const routes = {
  '/hello':   helloHandler,
  '/weather': weatherHandler,
  '/summary': summaryHandler,
};
```

## Project Structure Changes

```
ai-helloworld/
  .env                    # NEW (or updated): ANTHROPIC_API_KEY=sk-ant-...
  src/
    cache/
      weather.js          # UPDATED: add getHistory(city)
    handlers/
      summary.js          # NEW: GET /summary handler
    router.js             # UPDATED: register /summary route
```

## Acceptance Criteria

1. `GET /summary` (no city) → 400.
2. `GET /summary?city=Atlantis` (no history) → 404.
3. After at least one `GET /weather?city=Tokyo`, `GET /summary?city=Tokyo` → 200 with a non-empty `summary` string of 2–3 sentences.
4. `record_count` matches the number of rows in `weather_history` for that city.
5. `POST /summary?city=Tokyo` → 405.
6. All Day 01–05 acceptance criteria continue to pass.

## Testing (manual)

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Start the server
npm start

# Seed history
curl -s "http://localhost:3000/weather?city=Tokyo" | jq .

# Get summary
curl -s "http://localhost:3000/summary?city=Tokyo" | jq .
# Expected: { "city": "Tokyo", "record_count": 1, "summary": "..." }

# Missing city
curl -i "http://localhost:3000/summary"
# Expected: 400

# No history
curl -i "http://localhost:3000/summary?city=Atlantis"
# Expected: 404

# Wrong method
curl -i -X POST "http://localhost:3000/summary?city=Tokyo"
# Expected: 405

# Regression
curl -i "http://localhost:3000/hello"
curl -i "http://localhost:3000/weather?city=Tokyo"
```

## Future (not in scope for Day 06)

- Add `?from` and `?to` date-range filters to scope history before summarising.
- Stream the Claude response back to the caller for lower time-to-first-byte.
- Cache the generated summary briefly to avoid repeated API calls for the same city.
