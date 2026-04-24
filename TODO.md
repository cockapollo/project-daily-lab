# TODO - Day 01: Hello World API Service

Reference: [day01.md](./day01.md)

## Phase 1: Project Setup

- [x] **1.1** Initialize the project with `npm init` to create `package.json`
- [x] **1.2** Add `"start": "node src/server.js"` to the `scripts` section in `package.json`
- [x] **1.3** Create the directory structure: `src/` and `src/handlers/`

## Phase 2: Implementation

- [x] **2.1** Create `src/handlers/hello.js` — export a handler function that responds with `hello world!` (status 200, Content-Type `text/plain`), and returns 405 for non-GET methods
- [x] **2.2** Create `src/router.js` — implement a router that maps `GET /hello` to the hello handler, returns 404 for unregistered paths, and is extensible for future routes
- [x] **2.3** Create `src/server.js` — create an HTTP server using the built-in `http` module, wire it to the router, listen on port 3000, log the startup message, and handle `SIGINT` for graceful shutdown

## Phase 3: Verification

- [x] **3.1** Start the server with `npm start` and confirm the startup log message
- [x] **3.2** Test `curl -i http://localhost:3000/hello` — expect 200 and `hello world!`
- [x] **3.3** Test `curl -i http://localhost:3000/unknown` — expect 404 and `Not Found`
- [x] **3.4** Test `curl -i -X POST http://localhost:3000/hello` — expect 405 and `Method Not Allowed`
- [ ] **3.5** Test graceful shutdown with Ctrl+C

## Notes

- No external dependencies — use only Node.js built-in modules
- Implementation order: handlers first (2.1), then router (2.2), then server (2.3) — each layer builds on the previous one

---

# TODO - Day 02: Weather API Endpoint

Reference: [day02.md](./day02.md)

## Phase 1: Implementation

- [x] **D2-1.1** Create `src/handlers/weather.js` — handler that reads `city` query param, calls Geocoding API, calls Forecast API, and returns JSON response
- [x] **D2-1.2** Update `src/router.js` — add `/weather` route pointing to the weather handler

## Phase 2: Verification

- [x] **D2-2.1** Start the server and test `GET /weather?city=Tokyo` — expect 200 JSON with all fields
- [x] **D2-2.2** Test `GET /weather` (no param) — expect 400 `{"error":"Missing required query parameter: city"}`
- [x] **D2-2.3** Test `GET /weather?city=Nonexistentplace12345` — expect 404 `{"error":"City not found: ..."}`
- [x] **D2-2.4** Test `POST /weather?city=Tokyo` — expect 405 `{"error":"Method Not Allowed"}`
- [x] **D2-2.5** Confirm `GET /hello` still returns 200 `hello world!`

## Notes

- Use built-in `https` module for external API calls — no `node-fetch` or `axios`
- Call APIs sequentially: geocoding first to get lat/lng, then forecast
- All JSON responses (including errors) must use `Content-Type: application/json`
- External APIs: Open-Meteo (no API key required)

---

# TODO - Day 03: Geocoding Cache

Reference: [log/day03.md](./log/day03.md)

## Phase 1: Implementation

- [x] **D3-1.1** Create `src/cache/location.js` — module that reads/writes `location.json`; exports `get(city)` and `set(city, data)` with lowercase-normalized keys
- [x] **D3-1.2** Update `src/handlers/weather.js` — check cache before Geocoding API call; write to cache on successful geocoding response

## Phase 2: Verification

- [x] **D3-2.1** Start server, `GET /weather?city=Tokyo` — expect 200 JSON; confirm `location.json` created with `"tokyo"` entry
- [x] **D3-2.2** Second `GET /weather?city=Tokyo` — expect 200 JSON served from cache (Geocoding API not called)
- [x] **D3-2.3** `GET /weather?city=tokyo` (lowercase) — expect 200 JSON cache hit
- [x] **D3-2.4** `GET /weather?city=Nonexistentplace12345` — expect 404; confirm `location.json` unchanged
- [x] **D3-2.5** Confirm `GET /hello` still returns 200 `hello world!`

## Future Tasks (not scheduled)

- [ ] **D3-Future** Add capability to compare cached location against live Geocoding API result and flag/update on coordinate mismatch

---

# TODO - Day 04: SQLite Geocoding Cache

Reference: [log/day04.md](./log/day04.md)

## Phase 1: Setup

- [ ] **D4-1.1** Run `npm install better-sqlite3` and confirm it appears in `package.json` dependencies
- [ ] **D4-1.2** Delete `location.json` (no longer used)

## Phase 2: Implementation

- [ ] **D4-2.1** Update `src/cache/location.js` — open `location.db` with `better-sqlite3`, create `locations` table on startup, implement `get` (SELECT + JSON.parse coordinates) and `set` (INSERT OR REPLACE + JSON.stringify coordinates)

## Phase 3: Verification

- [x] **D4-3.1** `npm install` completes without errors; `better-sqlite3` present in `node_modules/`
- [x] **D4-3.2** First `GET /weather?city=Tokyo` → 200 JSON; `location.db` created; `sqlite3 location.db "SELECT * FROM locations;"` shows a `"tokyo"` row with JSON coordinates
- [x] **D4-3.3** Second `GET /weather?city=Tokyo` → 200 JSON from SQLite cache (Geocoding API not called)
- [x] **D4-3.4** `GET /weather?city=tokyo` (lowercase) → 200 JSON cache hit
- [x] **D4-3.5** `GET /weather?city=Nonexistentplace12345` → 404; row count in `locations` unchanged
- [x] **D4-3.6** Confirm `location.json` is not created or written during any of the above requests
- [x] **D4-3.7** Confirm `GET /hello` still returns 200 `hello world!`

---

# TODO - Day 05: Weather History Storage

Reference: [log/day05.md](./log/day05.md)

## Phase 1: Implementation

- [x] **D5-1.1** Rename `location.db` to `store.db`
- [x] **D5-1.2** Update `src/cache/location.js` — change DB path to `store.db`
- [x] **D5-1.3** Create `src/cache/weather.js` — open `store.db`, create `weather_history` table with `PRIMARY KEY (city, time)`, expose `get(city, time)` and `set(city, time, data)` using `INSERT OR IGNORE`
- [x] **D5-1.4** Update `src/handlers/weather.js` — call `weatherHistory.set(name, time, { temperature, windspeed, weathercode })` after each successful fetch

## Phase 2: Verification

- [x] **D5-2.1** `GET /weather?city=Tokyo` → 200 JSON; `sqlite3 store.db "SELECT * FROM weather_history;"` shows a `"tokyo"` row with JSON data
- [x] **D5-2.2** Second `GET /weather?city=Tokyo` within same time interval → 200 JSON; row count in `weather_history` unchanged (duplicate ignored)
- [x] **D5-2.3** `GET /weather?city=Osaka` → 200 JSON; a separate `"osaka"` row inserted
- [x] **D5-2.4** Confirm `GET /hello` still returns 200 `hello world!`

## Future Tasks (not scheduled)

- [ ] **D5-Future-1** Add `GET /history?city={city}` endpoint to query stored weather records
- [ ] **D5-Future-2** Join `weather_history` with `locations` to enrich history responses with lat/lng
- [ ] **D5-Future-3** Aggregate queries for analytics (daily averages, temperature trends)

---

# TODO - Day 06: Weather Summary Endpoint (AI-Generated)

Reference: [log/day06.md](./log/day06.md)

## Phase 1: Implementation

- [x] **D6-1.1** Add `getHistory(city)` to `src/cache/weather.js` — returns all rows for a city ordered by `time ASC`
- [x] **D6-1.2** Create `src/handlers/summary.js` — validate request, fetch history, build prompt, call Claude API, return `{ city, record_count, summary }`
- [x] **D6-1.3** Update `src/router.js` — register `/summary` route

## Phase 2: Prompt Refinement

- [x] **D6-2.1** Tighten system prompt to restrict Claude to provided data only (prevent inference beyond DB records)

## Phase 3: Verification

- [x] **D6-3.1** `GET /summary?city=Tokyo` (after seeding history) → 200 `{ city, record_count, summary }`
- [x] **D6-3.2** `GET /summary` (no city) → 400
- [x] **D6-3.3** `GET /summary?city=Atlantis` (no history) → 404
- [x] **D6-3.4** `POST /summary?city=Tokyo` → 405
- [x] **D6-3.5** Regression: `GET /hello` → 200, `GET /weather?city=Tokyo` → 200

## Future Tasks (not scheduled)

- [x] **D6-Future-1** Add `?from` / `?to` date-range filters to scope history before summarising → implemented in Day 08
- [ ] **D6-Future-2** Decode weathercodes into labels before sending to Claude (eliminate remaining inference)
- [x] **D6-Future-3** Cache the generated summary briefly to avoid repeated API calls for the same city → implemented in Day 07
- [ ] **D6-Future-4** Stream the Claude response back to the caller for lower time-to-first-byte

---

# TODO - Day 07: Summary Cache (TTL + Content-Based)

Reference: [log/day07.md](./log/day07.md)

## Phase 1: Implementation

- [x] **D7-1.1** Create `src/cache/summary.js` — open `store.db`, create `summary_cache` table, expose `get(city)` and `set(city, summary, basedOnRecordTime)`
- [x] **D7-1.2** Update `src/handlers/summary.js` — read `SUMMARY_CACHE_TTL_MIN` env var (default 60), apply hybrid cache check, store result after fresh generation, add `cached` field to response

## Phase 2: Verification

- [ ] **D7-2.1** First `GET /summary?city=Tokyo` → 200 with `"cached": false`; row present in `summary_cache`
- [ ] **D7-2.2** Immediate second request → 200 with `"cached": true`; Claude API not called
- [ ] **D7-2.3** `SUMMARY_CACHE_TTL_MIN=120 npm start` — confirm 120-min TTL is applied
- [ ] **D7-2.4** Regression: `GET /hello`, `GET /weather?city=Tokyo`, `GET /summary?city=Tokyo` all return 200

## Future Tasks (not scheduled)

- [x] **D7-Future-1** Add `?from` / `?to` date-range filters to scope history before summarising → implemented in Day 08
- [ ] **D7-Future-2** Decode weathercodes into human-readable labels before sending to Claude
- [ ] **D7-Future-3** Stream the Claude response back to the caller for lower time-to-first-byte

---

# TODO - Day 08: MAX(time) Fix + Date-Range Filters

Reference: [log/day08.md](./log/day08.md)

## Phase 1: Safety Fix — MAX(time)

- [x] **D8-1.1** Add `getLatestTime(city)` to `src/cache/weather.js` using `SELECT MAX(time)` — replaces the fragile array-tail assumption
- [x] **D8-1.2** Update `src/handlers/summary.js` — call `getLatestTime(city)` for `latestRecordTime` instead of `history[history.length - 1].time`

## Phase 2: Date-Range Filters

- [x] **D8-2.1** Update `getHistory(city, from, to)` in `src/cache/weather.js` — build SQL dynamically with optional `AND time >= ?` / `AND time <= ?` clauses
- [x] **D8-2.2** Update `src/handlers/summary.js` — read `?from` / `?to` from query params; pass to `getHistory`; bypass cache read/write when either filter is set

## Phase 3: Verification

- [ ] **D8-3.1** `GET /summary?city=Tokyo` → 200 with `cached: false` on first call, `cached: true` on second (cache still works)
- [ ] **D8-3.2** `GET /summary?city=Tokyo&from=2026-01-01` → 200 with `cached: false`; Claude called fresh; repeat call also returns `cached: false`
- [ ] **D8-3.3** `GET /summary?city=Tokyo&from=2026-01-01&to=2026-12-31` → 200 or 404 depending on data range
- [ ] **D8-3.4** Regression: `GET /hello`, `GET /weather?city=Tokyo`, `GET /summary?city=Tokyo` all return 200

## Future Tasks (not scheduled)

- [x] **D8-Future-1** Decode weathercodes into human-readable labels before sending to Claude → implemented in Day 10
- [ ] **D8-Future-2** Stream the Claude response back to the caller for lower time-to-first-byte

---

# TODO - Day 09: Summary Length & Mode Parameters

Reference: [log/day09.md](./log/day09.md)

## Phase 1: Implementation

- [x] **D9-1.1** Update `src/handlers/summary.js` — add `?length=brief|normal|detailed` (default `normal`) and `?mode=trend|anomaly` (optional); validate both params; build system prompt dynamically; bypass cache when non-default

## Phase 2: Verification

- [x] **D9-2.1** `GET /summary?city=Tokyo` → 200; behaviour unchanged (cache active, 2-3 sentence summary)
- [x] **D9-2.2** `GET /summary?city=Tokyo&length=brief` → 200; 1-sentence summary; `cached: false` always
- [x] **D9-2.3** `GET /summary?city=Tokyo&length=detailed` → 200; full paragraph; `cached: false` always
- [x] **D9-2.4** `GET /summary?city=Tokyo&mode=trend` → 200; directional summary; `cached: false` always
- [x] **D9-2.5** `GET /summary?city=Tokyo&mode=anomaly` → 200; outlier-focused summary; `cached: false` always
- [x] **D9-2.6** `GET /summary?city=Tokyo&length=detailed&mode=trend` → 200; long trend-focused summary; `cached: false`
- [x] **D9-2.7** `GET /summary?city=Tokyo&length=bad` → 400 `{"error":"Invalid value for length: bad"}`
- [x] **D9-2.8** `GET /summary?city=Tokyo&mode=bad` → 400 `{"error":"Invalid value for mode: bad"}`
- [x] **D9-2.9** Regression: `GET /hello` → 200, `GET /weather?city=Tokyo` → 200, `GET /summary?city=Tokyo` → 200 with cache

## Future Tasks (not scheduled)

- [ ] **D9-Future-1** Cache per `(city, length, mode)` composite key to serve repeated non-default requests from cache
- [ ] **D9-Future-2** Stream the Claude response back to the caller for lower time-to-first-byte
- [ ] **D9-Future-3** Increase `max_tokens` for `length=detailed` to avoid mid-sentence truncation (currently capped at 200)

---

# TODO - Day 10: Weathercode Decoding

Reference: [log/day10.md](./log/day10.md)

## Phase 1: Implementation

- [x] **D10-1.1** Create `src/utils/weathercodes.js` — WMO code enum and `decode(code)` function
- [x] **D10-1.2** Update `src/handlers/summary.js` — replace `code: ${r.weathercode}` with `conditions: ${decode(r.weathercode)}` in context string
- [x] **D10-1.3** Add `?refresh=true` parameter to `GET /summary` — forces cache bypass without requiring non-default length/mode

## Phase 2: Verification

- [x] **D10-2.1** `GET /summary?city=Tokyo` → 200; summary references conditions by name (e.g. "Moderate rain"), not raw codes
- [~] **D10-2.2** `GET /summary?city=Tokyo&mode=anomaly` → 200; outlier detection more precise with decoded labels (skipped)
- [~] **D10-2.3** Regression: `GET /hello` → 200, `GET /weather?city=Tokyo` → 200 (skipped)

## Future Tasks (not scheduled)

- [ ] **D10-Future-1** Cache per `(city, length, mode)` composite key (D9-Future-1)
- [ ] **D10-Future-2** Stream the Claude response back to the caller (D9-Future-2)
- [x] **D10-Future-3** Increase `max_tokens` for `length=detailed` → implemented in Day 11

---

# TODO - Day 11: Tiered max_tokens + Prompt Caching

Reference: [log/day11.md](./log/day11.md)

## Phase 1: Implementation

- [x] **D11-1.1** Add `MAX_TOKENS` map (`brief`: 80, `normal`: 200, `detailed`: 450) to `src/handlers/summary.js`
- [x] **D11-1.2** Update `callClaude` to accept `length` param and use `MAX_TOKENS[length]`
- [x] **D11-1.3** Convert `system` field to content array with `cache_control: { type: "ephemeral" }`
- [x] **D11-1.4** Add `anthropic-beta: prompt-caching-2024-07-31` header

## Phase 2: Verification

- [x] **D11-2.1** `GET /summary?city=Tokyo&length=detailed` → 200; full paragraph response; no mid-sentence truncation
- [x] **D11-2.2** `GET /summary?city=Tokyo&length=brief` → 200; single sentence
- [x] **D11-2.3** `GET /summary?city=Tokyo` → 200; 2–3 sentence response; cache still active
- [x] **D11-2.4** Regression: `GET /hello` → 200, `GET /weather?city=Tokyo` → 200

## Future Tasks (not scheduled)

- [ ] **D11-Future-1** Cache per `(city, length, mode)` composite key (D10-Future-1)
- [ ] **D11-Future-2** Stream the Claude response back to the caller (D10-Future-2)
