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
