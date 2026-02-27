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
