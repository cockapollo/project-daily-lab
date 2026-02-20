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
