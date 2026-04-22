# Development Log - Day 01: Hello World API Service

**Date:** 2026-02-20

## Session Summary

Built and deployed a minimal Node.js HTTP API service that responds with "hello world!" on the `/hello` endpoint.

## Steps Performed

### 1. Created Specification (`day01.md`)
- Defined endpoint: `GET /hello` → 200 `hello world!`
- Defined error handling: 404 for unknown paths, 405 for wrong methods
- Specified project structure, constraints (no external deps), and acceptance criteria

### 2. Created Task List (`TODO.md`)
- Broke the spec into 3 phases: Setup, Implementation, Verification
- 12 tasks total with checkboxes for tracking

### 3. Phase 1 — Project Setup
- Ran `npm init -y` to create `package.json`
- Added `"start": "node src/server.js"` script
- Created `src/` and `src/handlers/` directories

### 4. Phase 2 — Implementation
- **`src/handlers/hello.js`** — Handler returning `hello world!` (200) or `Method Not Allowed` (405)
- **`src/router.js`** — Route dispatcher mapping paths to handlers, with 404 fallback
- **`src/server.js`** — HTTP server on port 3000 with SIGINT graceful shutdown

### 5. Phase 3 — Verification

All acceptance criteria passed:

```
--- Test 3.2: GET /hello ---
HTTP/1.1 200 OK
Content-Type: text/plain
hello world!

--- Test 3.3: GET /unknown ---
HTTP/1.1 404 Not Found
Content-Type: text/plain
Not Found

--- Test 3.4: POST /hello ---
HTTP/1.1 405 Method Not Allowed
Content-Type: text/plain
Method Not Allowed
```

### 6. Cleanup
- Stopped the server running on port 3000

## Files Created

| File | Description |
|------|-------------|
| `day01.md` | Service specification |
| `TODO.md` | Task checklist (11/12 completed) |
| `package.json` | Project manifest with start script |
| `src/server.js` | HTTP server entry point |
| `src/router.js` | Route definitions and dispatch |
| `src/handlers/hello.js` | `/hello` endpoint handler |

## Status

Complete. All acceptance criteria verified.

---

# Development Log - Day 02: Weather API Endpoint

**Date:** 2026-02-21

## Session Summary

Extended the Day 01 Node.js API service with a new `/weather?city={city}` endpoint that fetches geolocation and current weather data from the Open-Meteo public APIs and returns a JSON response.

## Steps Performed

### 1. Created Specification (`day02.md`)
- Defined new endpoint: `GET /weather?city={city}` → 200 JSON
- Defined error handling: 400 (missing param), 404 (city not found), 405 (wrong method), 502 (upstream API error)
- Documented Open-Meteo Geocoding API and Forecast API (both free, no API key)
- Specified project structure changes and implementation constraints (built-in `https` module only)

### 2. Updated Task List (`TODO.md`)
- Added Day 02 section with 2 implementation tasks and 5 verification tasks

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `day02.md` | Created | Weather endpoint specification |
| `TODO.md` | Updated | Added Day 02 task checklist |
| `DEVLOG.md` | Updated | Added Day 02 session log |
| `src/handlers/weather.js` | Created | Weather handler — Geocoding + Forecast API calls |
| `src/router.js` | Updated | Added `/weather` route |

## Implementation Notes

- Used built-in `https.request` (not `https.get`) to force `family: 4` (IPv4).
  - Root cause: `api.open-meteo.com` resolves to both IPv4 and IPv6; Node.js preferred IPv6 which timed out on this machine; curl defaulted to IPv4 and succeeded.

## Verification Results

All 5 acceptance criteria passed:

```
D2-2.1: GET /weather?city=Tokyo       → 200 {"city":"Tokyo","latitude":35.6895,"longitude":139.69171,"temperature":8.8,"windspeed":2,"weathercode":0,"time":"2026-02-21T11:15"}
D2-2.2: GET /weather                  → 400 {"error":"Missing required query parameter: city"}
D2-2.3: GET /weather?city=Nonexist... → 404 {"error":"City not found: Nonexistentplace12345"}
D2-2.4: POST /weather?city=Tokyo      → 405 {"error":"Method Not Allowed"}
D2-2.5: GET /hello                    → 200 hello world!  (regression pass)
```

## Status

Complete. All Day 02 acceptance criteria verified.

---

# Development Log - Day 03: Geocoding Cache

**Date:** 2026-02-21

## Session Summary

Planned local file-based caching of geocoding results to `location.json`. Reorganized spec files into the `log/` directory, created the Day 03 specification, and updated the task list.

## Steps Performed

### 1. Reorganized Spec Files

- Created `log/` directory
- Moved `day01.md` and `day02.md` into `log/`

### 2. Created Specification (`log/day03.md`)

- Defined cache file format: `location.json` at project root, keyed by lowercase city name
- Defined new module `src/cache/location.js` with `get`/`set` API
- Specified cache lookup/write behavior in `weather.js` (Geocoding API bypassed on cache hit)
- Added future task: verify cached coordinates against live Geocoding API result

### 3. Updated Task List (`TODO.md`)

- Added Day 03 implementation and verification tasks
- Added `D3-Future` entry for cache validation capability

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `log/` | Created | Directory for spec files |
| `log/day01.md` | Moved | Day 01 spec (was `day01.md`) |
| `log/day02.md` | Moved | Day 02 spec (was `day02.md`) |
| `log/day03.md` | Created | Geocoding cache specification |
| `TODO.md` | Updated | Added Day 03 tasks and future task entry |
| `DEVLOG.md` | Updated | Added Day 03 session log |

## Implementation Notes

- Initial server test showed `location.json` not being written; root cause was a stale server process from a previous session still holding port 3000. Subsequent clean run (with explicit port kill) confirmed correct behavior.

## Verification Results

All 5 acceptance criteria passed:

```
D3-2.1: GET /weather?city=Tokyo       → 200 JSON; location.json created with "tokyo" entry
D3-2.2: GET /weather?city=Tokyo       → 200 JSON from cache (geocoding API not called)
D3-2.3: GET /weather?city=tokyo       → 200 JSON cache hit (lowercase key match)
D3-2.4: GET /weather?city=Nonexist... → 404 {"error":"City not found: ..."}; location.json unchanged
D3-2.5: GET /hello                    → 200 hello world!  (regression pass)
```

## Files Created / Modified (Final)

| File | Action | Description |
|------|--------|-------------|
| `log/` | Created | Directory for spec files |
| `log/day01.md` | Moved | Day 01 spec (was `day01.md`) |
| `log/day02.md` | Moved | Day 02 spec (was `day02.md`) |
| `log/day03.md` | Created | Geocoding cache specification |
| `src/cache/location.js` | Created | Cache module — `get`/`set` backed by `location.json` |
| `src/handlers/weather.js` | Updated | Cache-first geocoding lookup |
| `location.json` | Auto-created | Geocoding cache (persisted between runs) |
| `TODO.md` | Updated | Day 03 tasks all checked |
| `DEVLOG.md` | Updated | Added Day 03 session log |

## Status

Complete. All Day 03 acceptance criteria verified.

---

# Development Log - Day 04: SQLite Geocoding Cache

**Date:** 2026-02-24

## Session Summary

Replaced the Day 03 file-based geocoding cache (`location.json`) with a SQLite database (`location.db`) using `better-sqlite3`. The public `get`/`set` API of `src/cache/location.js` remained unchanged so `weather.js` required no modification.

## Steps Performed

### 1. Created Specification (`log/day04.md`)
- Defined `locations` table schema with `city` TEXT PRIMARY KEY, `name` TEXT, `coordinates` TEXT (JSON)
- Specified `INSERT OR REPLACE` for upsert behaviour
- Documented `better-sqlite3` installation requirement

### 2. Updated Task List (`TODO.md`)
- Added Day 04 section with setup, implementation, and verification tasks

### 3. Phase 1 — Setup
- Ran `npm install better-sqlite3`
- Deleted `location.json`

### 4. Phase 2 — Implementation
- **`src/cache/location.js`** — rewritten to open `location.db`, create table on startup, and use prepared statements for `get`/`set`

### 5. Phase 3 — Verification

All acceptance criteria passed:

```
D4-3.2: GET /weather?city=Tokyo       → 200 JSON; location.db created; "tokyo" row with JSON coordinates
D4-3.3: GET /weather?city=Tokyo       → 200 JSON from SQLite cache
D4-3.4: GET /weather?city=tokyo       → 200 JSON cache hit (lowercase)
D4-3.5: GET /weather?city=Nonexist... → 404; location.db row count unchanged
D4-3.6: location.json not written
D4-3.7: GET /hello                    → 200 hello world!
```

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `log/day04.md` | Created | SQLite cache specification |
| `TODO.md` | Updated | Added Day 04 tasks |
| `DEVLOG.md` | Updated | Added Day 04 session log |
| `src/cache/location.js` | Updated | SQLite-backed cache using better-sqlite3 |
| `package.json` | Updated | Added better-sqlite3 dependency |
| `location.json` | Deleted | Replaced by SQLite |
| `location.db` | Auto-created | SQLite database file |

## Status

Complete. All Day 04 acceptance criteria verified.

---

# Development Log - Day 05: Weather History Storage

**Date:** 2026-02-27

## Session Summary

Added persistent historical storage for weather API responses. Renamed `location.db` to `store.db` to consolidate all SQLite data under a single, clearly named file. Introduced a `weather_history` table with a composite primary key `(city, time)` to prevent duplicate entries. Each successful `/weather` request now records the weather payload as a JSON blob.

## Steps Performed

### 1. Renamed database file
- `location.db` → `store.db`
- Updated `src/cache/location.js` DB path accordingly

### 2. Created Specification (`log/day05.md`)
- Defined `weather_history` table schema
- Documented JSON blob format (no lat/lng — available via `locations` table)
- Specified `INSERT OR IGNORE` deduplication strategy

### 3. Updated Task List (`TODO.md`)
- Added Day 05 section with implementation and verification tasks

### 4. Implementation
- **`src/cache/weather.js`** — new module opening `store.db`, creating `weather_history` table on startup, exposing `get(city, time)` and `set(city, time, data)` with prepared statements
- **`src/handlers/weather.js`** — added `weatherHistory.set(name, time, ...)` call after each successful API fetch

### 5. Verification

All acceptance criteria passed:

```
D5-2.1: GET /weather?city=Tokyo       → 200 JSON; weather_history row inserted (tokyo, 2026-02-27T01:30)
D5-2.2: GET /weather?city=Tokyo again → 200 JSON; row count unchanged (duplicate ignored)
D5-2.3: GET /weather?city=Osaka       → 200 JSON; separate row inserted for osaka
D5-2.4: GET /hello                    → 200 hello world!  (regression pass)
```

```
sqlite3 store.db "SELECT city, time, data FROM weather_history;"
tokyo|2026-02-27T01:30|{"temperature":10.6,"windspeed":4.3,"weathercode":2}
osaka|2026-02-27T01:30|{"temperature":12.4,"windspeed":5.4,"weathercode":2}
```

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `log/day05.md` | Created | Weather history specification |
| `TODO.md` | Updated | Added Day 05 tasks |
| `DEVLOG.md` | Updated | Added Day 05 session log |
| `store.db` | Renamed from `location.db` | Consolidated SQLite database |
| `src/cache/location.js` | Updated | DB path changed to store.db |
| `src/cache/weather.js` | Created | Weather history cache module |
| `src/handlers/weather.js` | Updated | Saves each weather response to history |

## Status

Complete. All Day 05 acceptance criteria verified.

---

# Development Log - Day 06: Weather Summary Endpoint (AI-Generated)

**Date:** 2026-03-04

## Session Summary

Added a `GET /summary?city={city}` endpoint that reads stored weather history from `store.db`, formats it as a natural-language prompt, sends it to the Claude API (`claude-haiku-4-5-20251001`), and returns a 2–3 sentence summary grounded in the actual recorded data.

## Steps Performed

### 1. Created Specification (`log/day06.md`)
- Defined 4-step flow: fetch DB records → format prompt → call Claude API → return summary
- Specified response shape: `{ city, record_count, summary }`
- Documented error cases: 400 (missing city), 404 (no history), 405 (wrong method), 502 (API failure)
- Noted importance of restricting Claude to provided data only

### 2. Implementation

- **`src/cache/weather.js`** — added `getHistory(city)` using a new prepared statement; returns all rows ordered by `time ASC` as `{ time, temperature, windspeed, weathercode }` objects
- **`src/handlers/summary.js`** — new handler: validates request, fetches history, builds context string, calls Claude API via `https.request`, returns `{ city, record_count, summary }`
- **`src/router.js`** — registered `/summary` route

### 3. Prompt Refinement

Initial system prompt (`"Summarize weather trends concisely in 2-3 sentences"`) caused Claude to infer beyond the data — e.g. interpreting WMO weathercodes using its own knowledge and adding seasonal context not present in the records. Since the point of the endpoint is to summarise the DB data, not Claude's general knowledge, the prompt was tightened to:

> "You are a weather analyst. Summarize the weather trend in 2-3 sentences using only the data provided. Do not add external knowledge, forecasts, or inferences beyond what the records show."

### 4. Verification

```
GET /summary?city=Tokyo → 200
{
  "city": "Tokyo",
  "record_count": 2,
  "summary": "Tokyo experienced a significant cooling trend from late February to early March 2026, with temperatures dropping from 10.6°C to 2.9°C over five days. Wind speeds increased notably during this period, rising from 4.3 km/h to 11.8 km/h. The weather code change from 2 to 63 indicates a shift to more severe weather conditions."
}
```

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `log/day06.md` | Created | AI summary endpoint specification |
| `TODO.md` | Updated | Added Day 06 tasks |
| `DEVLOG.md` | Updated | Added Day 06 session log |
| `src/cache/weather.js` | Updated | Added `getHistory(city)` function |
| `src/handlers/summary.js` | Created | GET /summary handler with Claude API call |
| `src/router.js` | Updated | Registered `/summary` route |

## Implementation Notes

- Used Node's built-in `https` module for the Claude API call (consistent with existing `weather.js` pattern; no new dependencies added).
- `ANTHROPIC_API_KEY` must be set in the environment before starting the server.
- No `.env` file in the project — key is passed via shell environment.

## Status

Complete. All Day 06 acceptance criteria verified.

---

# Development Log - Day 07: Summary Cache (TTL + Content-Based)

**Date:** 2026-03-04

## Session Summary

Added a SQLite-backed cache for the `GET /summary` endpoint to prevent calling the Claude API on every request. Implemented a hybrid invalidation strategy: a configurable minimum TTL (default 60 min) protects against burst traffic, combined with content-based invalidation that also skips regeneration when the underlying weather history hasn't changed after the TTL expires.

Key finding during design: Open-Meteo `current_weather.time` uses **15-minute intervals** (not hourly as assumed), meaning new history records can arrive up to 4× per hour — making the minimum TTL essential.

## Steps Performed

### 1. Created Specification (`log/day07.md`)
- Documented hybrid cache logic (TTL floor + content-based invalidation)
- Defined `summary_cache` table schema
- Specified `SUMMARY_CACHE_TTL_MIN` env var for external TTL configuration

### 2. Implementation

- **`src/cache/summary.js`** — new module; opens `store.db`, creates `summary_cache` table on startup, exposes `get(city)` and `set(city, summary, basedOnRecordTime)` with prepared statements
- **`src/handlers/summary.js`** — reads `SUMMARY_CACHE_TTL_MIN` env var (default 60) at module load; applies hybrid cache check before calling Claude; stores result after fresh generation; adds `cached: true/false` to all 200 responses

### 3. Variable Naming Fix
- `cached` variable conflict: `locationCache.get(city)` result renamed to `location` to avoid clash with `summaryCache.get(displayName)` result

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `log/day07.md` | Created | Summary cache specification |
| `TODO.md` | Updated | Added Day 07 tasks; marked D6-Future-3 complete |
| `DEVLOG.md` | Updated | Added Day 07 session log |
| `src/cache/summary.js` | Created | SQLite summary cache module |
| `src/handlers/summary.js` | Updated | Hybrid cache logic + `cached` field in response |

## Status

Complete. All Day 07 acceptance criteria verified.

---

# Development Log - Day 08: MAX(time) Fix + Date-Range Filters

**Date:** 2026-03-05

## Session Summary

Two focused improvements to the `/summary` endpoint:

1. **Safety fix** — replaced the array-position assumption (`history[history.length - 1].time`) for `latestRecordTime` with a dedicated `SELECT MAX(time)` SQL query. The array approach was correct while `getHistory` had no filters, but would have silently broken the cache invalidation logic once range filters were added.

2. **Date-range filters** — implemented `?from` and `?to` query parameters on `GET /summary` to scope the history window before summarising. When either filter is active, the summary cache is bypassed entirely (filtered results are request-specific and should not pollute or be served from the full-city cache).

## Steps Performed

### 1. `src/cache/weather.js` — `getLatestTime` + dynamic `getHistory`

- Removed the static `stmtHistory` prepared statement
- Added `stmtLatestTime` — `SELECT MAX(time) AS maxTime FROM weather_history WHERE city = ?`
- Added `getLatestTime(city)` — returns the true latest record time from the DB, regardless of any range filter applied on the history query
- Updated `getHistory(city, from, to)` — builds SQL dynamically with optional `AND time >= ?` / `AND time <= ?` clauses; `from` and `to` default to `undefined` (backward-compatible with no-filter callers)

### 2. `src/handlers/summary.js` — consume new API + cache bypass

- Reads `?from` and `?to` from `searchParams` (lines 58–59)
- Passes them to `getHistory(city, from, to)` (line 67)
- Calls `getLatestTime(city)` for `latestRecordTime` — always the DB-wide max, not bounded by the filter (line 79)
- Wraps cache read and cache write in `if (!isFiltered)` guard — filtered requests always call Claude fresh and never write to the cache

## Design Decisions

- **`MAX(time)` over array tail:** `ORDER BY time ASC` without `LIMIT` made the tail approach technically safe today, but it was an implicit contract. A SQL aggregate is self-documenting and immune to future ordering changes or filtered-result confusion.
- **Skip cache for filtered requests:** Caching filtered summaries would require a composite key `(city, from, to)` and cache-busting rules for each combination. The simpler rule — no cache when filters are present — is correct and avoids cache pollution.
- **String comparison for ISO timestamps:** `time` is stored as ISO 8601 strings (e.g. `2026-03-05T12:00`). SQLite string comparison with date prefixes like `2026-03-05` is lexicographically correct and requires no date parsing.

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `TODO.md` | Updated | Added Day 08 tasks; marked D6-Future-1 / D7-Future-1 complete |
| `DEVLOG.md` | Updated | Added Day 08 session log |
| `src/cache/weather.js` | Updated | Added `getLatestTime`; updated `getHistory` with optional `from`/`to` |
| `src/handlers/summary.js` | Updated | Reads `?from`/`?to`; uses `getLatestTime`; bypasses cache when filtered |

## Usage

```
GET /summary?city=Tokyo                                   # full history, cache active
GET /summary?city=Tokyo&from=2026-01-01                   # from date onwards, no cache
GET /summary?city=Tokyo&to=2026-03-01                     # up to date, no cache
GET /summary?city=Tokyo&from=2026-01-01&to=2026-03-01     # explicit range, no cache
```

## Status

Complete.

---

# Development Log - Day 09: Summary Length & Mode Parameters

**Date:** 2026-04-21

## Session Summary

Added two optional query parameters to `GET /summary` for finer control over the AI-generated response:

- **`?length=brief|normal|detailed`** (default `normal`) — controls verbosity from 1 sentence to a full paragraph
- **`?mode=trend|anomaly`** (optional) — shifts Claude's analytical focus toward directional patterns or outlier detection

The parameters are orthogonal and can be combined freely. Both are expressed through a dynamically built system prompt. Cache is bypassed for any non-default combination (consistent with the existing `isFiltered` rule for date-range requests).

## Design Decisions

- **Two separate params over one `mode` enum:** A single enum (e.g. `mode=detailed-trend`) would be combinatorially unwieldy and prevent independent control of length and focus. Two params keep the surface clean.
- **`detailed` not `detail`:** Consistent adjective form alongside `brief` and `normal`.
- **Cache bypass for non-default:** Caching per `(city, length, mode)` composite key is possible but adds eviction complexity. Non-default requests are typically intentional/exploratory, so skipping cache is the simpler correct choice for now. Tracked as D9-Future-1.
- **D8-Future-1 backlog noted:** Raw `weathercode` integers limit the quality of `mode=anomaly` output (Claude must infer code meanings). Weathercode decoding is the highest-value follow-up for these new modes.

## Steps Performed

### 1. Created Specification (`log/day09.md`)
- Defined both parameters, valid values, and default behaviour
- Documented dynamic system prompt construction
- Specified cache bypass rule (`skipCache = isFiltered || isCustomized`)
- Listed 9 acceptance criteria

### 2. Updated Task List (`TODO.md`)
- Annotated D8-Future-1 with context from Day 09 design discussion
- Added Day 09 section with implementation and verification tasks

### 3. Implementation (`src/handlers/summary.js`)
- Added `VALID_LENGTHS`, `VALID_MODES`, `LENGTH_INSTRUCTIONS`, `MODE_INSTRUCTIONS` constants
- Added `buildSystemPrompt(length, mode)` — joins base instruction + length instruction + optional mode instruction
- Updated `callClaude(systemPrompt, prompt)` — accepts system prompt as a parameter instead of hardcoding it
- Added `?length` and `?mode` parsing and 400 validation in `summaryHandler`
- Replaced `isFiltered`-only cache guard with `skipCache = isFiltered || isCustomized`

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `log/day09.md` | Created | Length & mode parameter specification |
| `TODO.md` | Updated | D8-Future-1 annotated; Day 09 tasks added |
| `DEVLOG.md` | Updated | Added Day 09 session log |
| `src/handlers/summary.js` | Updated | length + mode params, dynamic system prompt, cache bypass |

## Usage

```
GET /summary?city=Tokyo                              # normal summary, cache active
GET /summary?city=Tokyo&length=brief                 # 1-sentence, no cache
GET /summary?city=Tokyo&length=detailed              # full paragraph, no cache
GET /summary?city=Tokyo&mode=trend                   # trend-focused, no cache
GET /summary?city=Tokyo&mode=anomaly                 # outlier-focused, no cache
GET /summary?city=Tokyo&length=detailed&mode=trend   # combined, no cache
GET /summary?city=Tokyo&length=bad                   # 400 Invalid value for length: bad
GET /summary?city=Tokyo&mode=bad                     # 400 Invalid value for mode: bad
```

## Status

Complete. All Day 09 acceptance criteria verified.

---

# Development Log - Day 10: Weathercode Decoding

**Date:** 2026-04-22

## Session Summary

Decoded WMO weathercodes into human-readable labels before sending weather history to Claude. Previously, the context string included raw integers (`code: 63`), which required Claude to silently infer meaning from training data — contradicting the system prompt's instruction to use only provided data. This was especially limiting for `mode=anomaly`, where outlier detection depends on understanding what conditions codes represent.

## Steps Performed

### 1. Created Specification (`log/day10.md`)

### 2. Implementation

- **`src/utils/weathercodes.js`** — new module; WMO code enum covering all standard codes (0–99); `decode(code)` returns the label or `"Unknown (code: N)"` for unmapped values
- **`src/handlers/summary.js`** — imported `decode`; replaced `code: ${r.weathercode}` with `conditions: ${decode(r.weathercode)}` in the context string; added `?refresh=true` parameter to force cache bypass without needing a non-default `length` or `mode`

### 3. Updated Task List and Devlog

- Marked D8-Future-1 complete in `TODO.md`
- Added Day 10 section to `TODO.md` and `DEVLOG.md`

## Files Created / Modified

| File | Action | Description |
|------|--------|-------------|
| `log/day10.md` | Created | Weathercode decoding specification |
| `src/utils/weathercodes.js` | Created | WMO code enum + `decode()` function |
| `src/handlers/summary.js` | Updated | Use `decode(r.weathercode)` in context string |
| `TODO.md` | Updated | D8-Future-1 marked complete; Day 10 tasks added |
| `DEVLOG.md` | Updated | Added Day 10 session log |

## Before / After

Before:
```
2026-03-05T12:00 — temp: 8.8°C, wind: 2 km/h, code: 63
```

After:
```
2026-03-05T12:00 — temp: 8.8°C, wind: 2 km/h, conditions: Moderate rain
```

## Status

Implementation complete. Pending verification.
