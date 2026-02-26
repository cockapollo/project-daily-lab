# Day 04 - SQLite Geocoding Cache

## Overview

Replace the Day 03 file-based geocoding cache (`location.json`) with a local SQLite database (`location.db`). Coordinates are stored as a TEXT column in JSON format. The public `get`/`set` API of `src/cache/location.js` remains unchanged so `weather.js` requires no modification.

## Requirements

### Database File

- **Path:** `location.db` (project root)
- **Driver:** [`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3) — synchronous API, drop-in for the current sync `fs` approach
- The database file and table are created automatically on first use.

### Schema

```sql
CREATE TABLE IF NOT EXISTS locations (
  city        TEXT PRIMARY KEY,  -- lowercase-normalized city name (e.g. "tokyo")
  name        TEXT NOT NULL,     -- display name from Geocoding API (e.g. "Tokyo")
  coordinates TEXT NOT NULL      -- JSON: {"latitude": 35.6895, "longitude": 139.69171}
);
```

- `city` is the lookup key, always stored and queried in lowercase.
- `coordinates` stores only `latitude` and `longitude` as a JSON text value.
- `name` is stored as a separate column (not inside the JSON) to keep lookups simple.

### Coordinates JSON Format

```json
{ "latitude": 35.6895, "longitude": 139.69171 }
```

### Cache Lookup Behavior

No change from Day 03. `weather.js` calls `locationCache.get(city)` and `locationCache.set(city, data)` as before.

## Project Structure Changes

```
ai-helloworld/
  location.db            # NEW: SQLite database (auto-created on first use)
  location.json          # REMOVED: replaced by SQLite; delete after migration
  src/
    cache/
      location.js        # UPDATED: SQLite-backed (same get/set API)
  package.json           # UPDATED: added better-sqlite3 dependency
```

## New Module: `src/cache/location.js`

Replaces the `fs`-based implementation with SQLite. Same exported API:

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `get`    | `get(city: string) → object\|null` | Queries `locations` by lowercase key; returns `{ name, latitude, longitude }` or `null` |
| `set`    | `set(city: string, data: object) → void` | Inserts or replaces row; serializes `latitude`/`longitude` into the `coordinates` TEXT column |

### Implementation Notes

- Open (and create) the database with `new Database(DB_FILE)` at module load time.
- Run `CREATE TABLE IF NOT EXISTS` immediately after opening — once per process start.
- Use `INSERT OR REPLACE` (upsert) in `set` so re-caching the same city is idempotent.
- Parse `coordinates` with `JSON.parse` in `get` before returning.
- `better-sqlite3` is fully synchronous — no callbacks or promises needed.

### Skeleton

```js
const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../location.db');
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    city        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    coordinates TEXT NOT NULL
  )
`);

function get(city) {
  const row = db.prepare('SELECT name, coordinates FROM locations WHERE city = ?')
                .get(city.toLowerCase());
  if (!row) return null;
  const { latitude, longitude } = JSON.parse(row.coordinates);
  return { name: row.name, latitude, longitude };
}

function set(city, data) {
  const { name, latitude, longitude } = data;
  db.prepare('INSERT OR REPLACE INTO locations (city, name, coordinates) VALUES (?, ?, ?)')
    .run(city.toLowerCase(), name, JSON.stringify({ latitude, longitude }));
}

module.exports = { get, set };
```

## Installation

```bash
npm install better-sqlite3
```

> `better-sqlite3` compiles a native addon. Node.js and `node-gyp` build tools must be available. On macOS, Xcode Command Line Tools are sufficient.

## Acceptance Criteria

1. `npm install` completes without errors and `better-sqlite3` appears in `node_modules/`.
2. First `GET /weather?city=Tokyo` creates `location.db` and inserts a `"tokyo"` row with a valid JSON `coordinates` value.
3. Second `GET /weather?city=Tokyo` returns the same 200 JSON response using the SQLite-cached coordinates (Geocoding API not called).
4. `GET /weather?city=tokyo` (lowercase) hits the same cache row.
5. `GET /weather?city=Nonexistentplace12345` returns 404; `location.db` is not modified.
6. `location.json` is no longer written or read.
7. All Day 01, 02, and 03 acceptance criteria continue to pass.

## Testing (manual)

```bash
# Install new dependency
npm install better-sqlite3

# Remove old cache file
rm -f location.json

# Start the server
npm start

# First request — DB created, row inserted
curl -i "http://localhost:3000/weather?city=Tokyo"

# Inspect the database
sqlite3 location.db "SELECT city, name, coordinates FROM locations;"
# Expected: tokyo|Tokyo|{"latitude":35.6895,"longitude":139.69171}

# Second request — served from SQLite cache
curl -i "http://localhost:3000/weather?city=Tokyo"

# Lowercase cache hit
curl -i "http://localhost:3000/weather?city=tokyo"

# Cache miss → 404, DB unchanged
curl -i "http://localhost:3000/weather?city=Nonexistentplace12345"
sqlite3 location.db "SELECT COUNT(*) FROM locations;"  # count must not increase

# Regression
curl -i http://localhost:3000/hello
# Expected: HTTP/1.1 200 OK, hello world!
```

## Future (not in scope for Day 04)

- Add a CLI or admin endpoint to list or clear all cached locations.
- Carry forward `D3-Future`: compare cached coordinates against live Geocoding API result and flag/update on mismatch.
