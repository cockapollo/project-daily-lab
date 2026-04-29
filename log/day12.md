# Day 12: Composite Summary Cache Key

## Goal

Cache `GET /summary` responses per `(city, length, mode)` combination.

The original `summary_cache` table used `city TEXT PRIMARY KEY` — one row per city, with no `length` or `mode` in the key. Storing different summaries for the same city under different params would collide: an `INSERT OR REPLACE` for a `brief` request would overwrite the `normal` row, and the next `normal` read would get a one-sentence response. The cache key simply couldn't represent the full request identity.

Day 9 patched this by setting `isCustomized = length !== 'normal' || !!mode` and adding it to `skipCache`, so non-default combinations always bypassed the cache. That avoided incorrect results but meant every repeated `brief` or `trend` call paid a full Claude API round-trip regardless of whether the data had changed.

## Changes

### `src/cache/summary.js`

- `summary_cache` table: `PRIMARY KEY (city, length, mode)` replaces `city TEXT PRIMARY KEY`
- `mode` stored as `''` when no mode is specified (avoids NULL-in-composite-PK)
- Schema migration on startup: `PRAGMA table_info` detects old schema (missing `length` column) and drops the table before recreating
- `get(city, length, mode)` → `SELECT ... WHERE city = ? AND length = ? AND mode = ?`
- `set(city, length, mode, summary, basedOnRecordTime)`

### `src/handlers/summary.js`

- Removed `isCustomized` variable
- `skipCache = isFiltered || refresh` (date-range and `?refresh=true` still bypass; `length`/`mode` no longer do)
- `summaryCache.get(displayName, length, mode || '')`
- `summaryCache.set(displayName, length, mode || '', summary, latestRecordTime)`

## Acceptance Criteria

| # | Request | Expected |
|---|---------|----------|
| D12-2.1 | `GET /summary?city=Tokyo` × 2 | `cached: false`, then `cached: true` |
| D12-2.2 | `GET /summary?city=Tokyo&length=brief` × 2 | `cached: false`, then `cached: true` |
| D12-2.3 | `GET /summary?city=Tokyo&mode=trend` × 2 | `cached: false`, then `cached: true` |
| D12-2.4 | `GET /summary?city=Tokyo&length=detailed&mode=trend` × 2 | `cached: false`, then `cached: true` |
| D12-2.5 | `GET /summary?city=Tokyo&from=2026-01-01` × 2 | `cached: false` both times |
| D12-2.6 | `sqlite3 store.db "SELECT city, length, mode FROM summary_cache;"` | Separate row per combo |
