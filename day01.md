# Day 01 - Hello World API Service

## Overview

A minimal HTTP API service built with Node.js that responds with "hello world!" when a specific endpoint is called.

## Requirements

### Runtime

- **Platform:** Node.js (latest LTS)
- **Protocol:** HTTP (not HTTPS)
- **Host:** localhost
- **Port:** 3000

### Endpoint

| Method | Path     | Response Body  | Status Code | Content-Type       |
|--------|----------|----------------|-------------|--------------------|
| GET    | `/hello` | `hello world!` | 200         | `text/plain`       |

- Any other path should return a `404` status with the body `Not Found`.
- Any non-GET method on `/hello` should return a `405` status with the body `Method Not Allowed`.

### Routing

- Use a router module to handle request dispatching (not a single monolithic handler).
- The router should be easily extensible so new routes can be added in future iterations.

### Project Structure

```
ai-helloworld/
  package.json
  src/
    server.js      # Creates and starts the HTTP server
    router.js      # Route definitions and dispatch logic
    handlers/
      hello.js     # Handler for the /hello endpoint
```

### Implementation Constraints

- Use only Node.js built-in modules (`http`, `url`, etc.) — no external dependencies (no Express, Koa, etc.).
- The server should log `Server running at http://localhost:3000/` to stdout when it starts.
- The process should exit gracefully on `SIGINT` (Ctrl+C).

## Acceptance Criteria

1. Running `node src/server.js` starts the server on port 3000.
2. `curl http://localhost:3000/hello` returns `hello world!` with status 200.
3. `curl http://localhost:3000/unknown` returns `Not Found` with status 404.
4. `curl -X POST http://localhost:3000/hello` returns `Method Not Allowed` with status 405.
5. The project contains a valid `package.json` with `"start": "node src/server.js"` in `scripts`.

## Testing (manual)

```bash
# Start the server
npm start

# In another terminal
curl -i http://localhost:3000/hello
# Expected: HTTP/1.1 200 OK ... hello world!

curl -i http://localhost:3000/unknown
# Expected: HTTP/1.1 404 Not Found ... Not Found

curl -i -X POST http://localhost:3000/hello
# Expected: HTTP/1.1 405 Method Not Allowed ... Method Not Allowed
```
