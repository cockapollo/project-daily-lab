# Day 03 - Geocoding Cache

## Overview

Extend the Day 02 weather handler to cache geocoding results locally in `location.json`. When a city's coordinates are already stored, skip the Geocoding API call and use the cached data directly. City coordinates do not change, so a perpetual local cache is appropriate.

## Requirements

### Cache File

- **Path:** `location.json` (project root)
- **Format:** JSON object keyed by normalized city name (lowercase)
- **Schema:**

```json
{
  "tokyo": { "name": "Tokyo", "latitude": 35.6895, "longitude": 139.69171 },
  "paris": { "name": "Paris", "latitude": 48.85341, "longitude": 2.3488 }
}
```

- The file is created automatically on the first cache write if it does not exist.

### Cache Lookup Behavior

On `GET /weather?city={city}`:

1. Normalize the lookup key: `city.toLowerCase()`
2. If the key exists in `location.json`, use cached `name`, `latitude`, `longitude` — skip the Geocoding API call.
3. If the key is not cached:
   a. Call the Geocoding API as before.
   b. If the city is not found, return 404 (do not write to cache).
   c. If found, write the result to `location.json` and proceed to the Forecast API.

### Project Structure Changes

```
ai-helloworld/
  location.json          # NEW: geocoding cache (auto-created on first miss)
  log/
    day01.md             # moved from root
    day02.md             # moved from root
    day03.md             # this spec
  src/
    cache/
      location.js        # NEW: cache module (read/write location.json)
    handlers/
      weather.js         # updated: use cache module before geocoding API
```

### New Module: `src/cache/location.js`

Exports two functions:

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `get`    | `get(city: string) → object\|null` | Returns cached entry for normalized key, or `null` if not present |
| `set`    | `set(city: string, data: object) → void` | Writes entry under normalized key and persists to `location.json` |

- Uses built-in `fs` module (`readFileSync` / `writeFileSync`) — synchronous I/O is acceptable because the file is small.
- If `location.json` does not exist, `get` returns `null` and `set` creates the file.

### Implementation Constraints

- Use only Node.js built-in modules (`fs`, `path`).
- Normalize cache keys to lowercase (`city.toLowerCase()`) for case-insensitive lookup.
- Cache `name`, `latitude`, and `longitude` only — weather data is never cached.
- Do not modify the Forecast API call path; only the Geocoding API call is affected.

## Acceptance Criteria

1. First `GET /weather?city=Tokyo` calls the Geocoding API and writes a `"tokyo"` entry to `location.json`.
2. Second `GET /weather?city=Tokyo` returns the same 200 JSON response using cached coordinates (Geocoding API not called).
3. `GET /weather?city=tokyo` (lowercase) hits the cache written in step 1.
4. `GET /weather?city=Nonexistentplace12345` returns 404; `location.json` is not modified.
5. All Day 01 and Day 02 acceptance criteria continue to pass.

## Future (not in scope for Day 03)

- Verify that cached coordinates match the current Geocoding API response and flag or update on mismatch (see `TODO.md` D3-Future).

## Testing (manual)

```bash
# Start the server
npm start

# First request — geocoding API called, location.json created/updated
curl -i "http://localhost:3000/weather?city=Tokyo"
cat location.json   # expect: { "tokyo": { "name": "Tokyo", "latitude": ..., "longitude": ... } }

# Second request — served from cache
curl -i "http://localhost:3000/weather?city=Tokyo"

# Case-insensitive cache hit
curl -i "http://localhost:3000/weather?city=tokyo"

# Cache miss → 404, location.json unchanged
curl -i "http://localhost:3000/weather?city=Nonexistentplace12345"

# Regression
curl -i http://localhost:3000/hello
# Expected: HTTP/1.1 200 OK, hello world!
```
