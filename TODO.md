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
