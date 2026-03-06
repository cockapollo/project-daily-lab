# Day 08 - MAX(time) Fix + Date-Range Filters

## Overview

Two focused improvements to the `GET /summary` endpoint:

1. **Safety fix** — replace the array-position assumption for `latestRecordTime` with a dedicated `SELECT MAX(time)` SQL query.
2. **Date-range filters** — add `?from` and `?to` query parameters to scope the history window before summarising.

## Motivation

### MAX(time) fix

`src/handlers/summary.js` derived the latest record time as `history[history.length - 1].time`. This relied on `getHistory` always returning rows in `ASC` order with no `LIMIT` — an implicit contract. With the introduction of `?from`/`?to` filters the tail of the filtered array is no longer the overall latest record, which would silently corrupt the cache invalidation check (`based_on_record_time === latestRecordTime`). A dedicated `SELECT MAX(time)` query is self-documenting and immune to this.

### Date-range filters

Callers may want a summary scoped to a specific period (e.g. last week, a particular month) rather than the full history. `?from` and `?to` allow this without any schema changes — `time` is stored as ISO 8601 strings, so SQLite lexicographic comparison is correct.

## Endpoint Changes

### `GET /summary?city={city}` — updated query parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `city` | string | yes | City name (case-insensitive) |
| `from` | string | no | ISO 8601 date/datetime lower bound (inclusive). E.g. `2026-01-01` or `2026-01-01T00:00` |
| `to` | string | no | ISO 8601 date/datetime upper bound (inclusive). E.g. `2026-03-31` or `2026-03-31T23:45` |

Response shape is unchanged. `cached` is always `false` when `?from` or `?to` is present (see Cache Behaviour below).

#### Examples

```
GET /summary?city=Tokyo                                   # full history, cache active
GET /summary?city=Tokyo&from=2026-01-01                   # from date onwards, no cache
GET /summary?city=Tokyo&to=2026-03-01                     # up to date, no cache
GET /summary?city=Tokyo&from=2026-01-01&to=2026-03-01     # explicit range, no cache
```

## Cache Behaviour

When `?from` or `?to` is present the summary cache is **bypassed entirely** — both the read and the write. Reasons:

- Filtered summaries are request-specific; caching them would require a composite key `(city, from, to)` and separate eviction rules per combination.
- The simpler rule — no cache for filtered requests — is correct and avoids cache pollution that could interfere with full-history summaries.

The full-history (no filters) path is unchanged: hybrid TTL + content-based invalidation applies as before.

```
isFiltered = from || to

isFiltered?
  ├─ YES → call Claude fresh, return result (never read/write cache)
  └─ NO  → existing hybrid cache logic (TTL + based_on_record_time check)
```

## Implementation

### `src/cache/weather.js`

**Added `stmtLatestTime`:**

```sql
SELECT MAX(time) AS maxTime FROM weather_history WHERE city = ?
```

**Added `getLatestTime(city)`:**

```js
function getLatestTime(city) {
  const row = stmtLatestTime.get(city.toLowerCase());
  return row ? row.maxTime : null;
}
```

**Updated `getHistory(city, from, to)`:**

Builds SQL dynamically — `from` and `to` default to `undefined` so existing callers (no filters) are unaffected:

```js
function getHistory(city, from, to) {
  let sql = 'SELECT time, data FROM weather_history WHERE city = ?';
  const params = [city.toLowerCase()];
  if (from) { sql += ' AND time >= ?'; params.push(from); }
  if (to)   { sql += ' AND time <= ?'; params.push(to); }
  sql += ' ORDER BY time ASC';
  return db.prepare(sql).all(...params).map(row => { ... });
}
```

### `src/handlers/summary.js`

- Reads `?from` and `?to` from `searchParams`; converts empty string to `undefined` via `|| undefined`
- Passes `from`, `to` to `getHistory(city, from, to)`
- Calls `getLatestTime(city)` (not `history[history.length - 1].time`) for the cache key
- Guards cache read and cache write with `if (!isFiltered)`

## Project Structure Changes

No new files. Modified only:

```
ai-helloworld/
  src/
    cache/
      weather.js      # UPDATED: getLatestTime + dynamic getHistory(city, from, to)
    handlers/
      summary.js      # UPDATED: ?from/?to params; getLatestTime; cache bypass when filtered
```

## Acceptance Criteria

1. `GET /summary?city=Tokyo` → 200 with `"cached": false` on first call, `"cached": true` on second (existing cache behaviour preserved).
2. `GET /summary?city=Tokyo&from=2026-01-01` → 200 with `"cached": false`; repeat call also `"cached": false` (cache bypassed).
3. `GET /summary?city=Tokyo&from=2026-01-01&to=2026-12-31` → 200 or 404 depending on whether records exist in that range.
4. `GET /summary?city=Tokyo&to=2026-01-01` (before any data) → 404 `{"error":"No weather history found for: Tokyo"}`.
5. All Day 01–07 acceptance criteria continue to pass.

## Testing (manual)

```bash
npm start

# Verify full-history cache still works
curl -s "http://localhost:3000/summary?city=Tokyo" | jq .   # cached: false
curl -s "http://localhost:3000/summary?city=Tokyo" | jq .   # cached: true

# Verify ?from filter (adjust date to match your data)
curl -s "http://localhost:3000/summary?city=Tokyo&from=2026-03-01" | jq .   # cached: false
curl -s "http://localhost:3000/summary?city=Tokyo&from=2026-03-01" | jq .   # cached: false (no cache)

# Verify ?to filter
curl -s "http://localhost:3000/summary?city=Tokyo&to=2026-01-01" | jq .     # 404 if no data before Jan

# Verify ?from + ?to range
curl -s "http://localhost:3000/summary?city=Tokyo&from=2026-01-01&to=2026-12-31" | jq .

# Confirm full-history cache key is still MAX(time) across all records
sqlite3 store.db "SELECT MAX(time) FROM weather_history WHERE city = 'tokyo';"
```

## Future (not in scope for Day 08)

- Decode weathercodes into human-readable labels before sending to Claude.
- Stream the Claude response back to the caller for lower time-to-first-byte.
