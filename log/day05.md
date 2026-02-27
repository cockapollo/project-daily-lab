# Day 05 - Weather History Storage

## Overview

Add persistent historical storage for weather API responses. Each successful `/weather` request is recorded in a `weather_history` table inside `store.db` (the renamed `location.db`). The composite primary key `(city, time)` prevents duplicate entries for the same city at the same timestamp.

## Motivation

- Lay the groundwork for analytics and predictions over historical weather data.
- Avoid re-storing identical readings — the API returns weather at a fixed interval so repeated requests within the same interval would produce the same `time` value.
- Latitude and longitude are already available in the `locations` table; there is no need to duplicate them in weather history.

## Changes

### Database

- **`location.db` → `store.db`** (renamed): consolidates all SQLite data in one file with a clearer name.

### Schema — new table in `store.db`

```sql
CREATE TABLE IF NOT EXISTS weather_history (
  city TEXT NOT NULL,
  time TEXT NOT NULL,
  data TEXT NOT NULL,
  PRIMARY KEY (city, time)
);
```

| Column | Type | Description |
|--------|------|-------------|
| `city` | TEXT | Lowercase-normalized city name (e.g. `"tokyo"`) |
| `time` | TEXT | ISO 8601 timestamp from the API (e.g. `"2026-02-27T01:30"`) |
| `data` | TEXT | JSON blob: `{ temperature, windspeed, weathercode }` |

- `city` is stored lowercase (consistent with `locations` table).
- `latitude` and `longitude` are intentionally excluded — they are available via the `locations` table.
- `INSERT OR IGNORE` is used so duplicate `(city, time)` pairs are silently dropped.

### Data JSON Format

```json
{ "temperature": 10.6, "windspeed": 4.3, "weathercode": 2 }
```

## Project Structure Changes

```
ai-helloworld/
  location.db            # REMOVED (renamed)
  store.db               # RENAMED from location.db; now holds both tables
  src/
    cache/
      location.js        # UPDATED: DB path changed to store.db
      weather.js         # NEW: weather_history cache module
    handlers/
      weather.js         # UPDATED: saves each response to weather_history
```

## New Module: `src/cache/weather.js`

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `get`    | `get(city, time) → object\|null` | Returns parsed JSON data for a given city + time, or `null` |
| `set`    | `set(city, time, data) → void` | Inserts row with `INSERT OR IGNORE`; serializes `{ temperature, windspeed, weathercode }` |

## Acceptance Criteria

1. `location.db` no longer exists; `store.db` is present and contains both `locations` and `weather_history` tables.
2. `GET /weather?city=Tokyo` → 200 JSON; a row is inserted in `weather_history` with key `("tokyo", "<time>")`.
3. A second `GET /weather?city=Tokyo` within the same API time interval → 200 JSON; row count in `weather_history` does not increase (duplicate ignored).
4. `GET /weather?city=Osaka` → 200 JSON; a separate row for `"osaka"` is inserted.
5. All Day 01–04 acceptance criteria continue to pass.

## Testing (manual)

```bash
# Start the server
npm start

# First request — row inserted in weather_history
curl -s "http://localhost:3000/weather?city=Tokyo" | jq .

# Inspect the database
sqlite3 store.db "SELECT city, time, data FROM weather_history;"
# Expected: tokyo|2026-02-27T01:30|{"temperature":10.6,"windspeed":4.3,"weathercode":2}

# Second request — same time interval, duplicate ignored
curl -s "http://localhost:3000/weather?city=Tokyo" | jq .
sqlite3 store.db "SELECT COUNT(*) FROM weather_history WHERE city = 'tokyo';"
# Expected: 1

# Second city
curl -s "http://localhost:3000/weather?city=Osaka" | jq .
sqlite3 store.db "SELECT city, time, data FROM weather_history;"
# Expected: two rows (tokyo, osaka)

# Regression
curl -i http://localhost:3000/hello
# Expected: HTTP/1.1 200 OK, hello world!
```

## Future (not in scope for Day 05)

- Add a `GET /history?city={city}` endpoint to query stored weather records.
- Join `weather_history` with `locations` to enrich history responses with lat/lng.
- Aggregate queries (daily averages, temperature trends) for analytics.
