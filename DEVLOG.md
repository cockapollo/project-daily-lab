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
