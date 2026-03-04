# Day 07 - Summary Cache (TTL + Content-Based)

## Overview

Add a SQLite-backed cache for the `GET /summary` endpoint to avoid calling the Claude API on every request. Uses a hybrid invalidation strategy:

1. **Minimum TTL** — serve the cached summary if it is younger than `SUMMARY_CACHE_TTL_MIN` minutes, regardless of whether new weather data has arrived.
2. **Content-based invalidation** — after the TTL expires, only regenerate if the latest weather record time has changed since the summary was generated.

## Motivation

- `GET /summary` currently calls the Claude API on every request, incurring cost and latency.
- Open-Meteo `current_weather.time` is a **15-minute interval** timestamp (not hourly as initially assumed), so new history records can arrive up to 4× per hour.
- Pure content-based caching would call Claude up to 4× per hour per city under continuous traffic.
- A configurable minimum TTL (default 60 min) caps LLM calls regardless of traffic volume.
- TTL is externalised to `SUMMARY_CACHE_TTL_MIN` so it can be tuned per environment without a code change.

## Cache Invalidation Logic

```
cached entry exists?
  ├─ NO  → call Claude, store result
  └─ YES
       ├─ age < TTL  → serve cache  (burst protection)
       └─ age ≥ TTL
            ├─ latest_record_time == based_on_record_time  → serve cache  (no new data)
            └─ latest_record_time changed  → call Claude, update cache
```

## Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `SUMMARY_CACHE_TTL_MIN` | `60` | Minimum minutes before a cached summary may be regenerated |

```bash
# Override at startup
SUMMARY_CACHE_TTL_MIN=120 npm start
```

## Endpoint Changes

### `GET /summary?city={city}` — updated response

Added `cached` boolean field to indicate whether the response was served from cache.

#### Success Response — `200 OK`

```json
{
  "city": "Tokyo",
  "record_count": 5,
  "summary": "Tokyo experienced a cooling trend...",
  "cached": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `city` | string | Display name from `locations` table |
| `record_count` | number | Number of history rows used |
| `summary` | string | AI-generated summary (fresh or cached) |
| `cached` | boolean | `true` if served from cache; `false` if freshly generated |

Error responses are unchanged from Day 06.

## Implementation

### `src/cache/summary.js` — new file

SQLite-backed summary cache using `store.db`.

**Table schema:**

```sql
CREATE TABLE IF NOT EXISTS summary_cache (
  city                 TEXT PRIMARY KEY,
  summary              TEXT NOT NULL,
  based_on_record_time TEXT NOT NULL,
  cached_at            INTEGER NOT NULL
)
```

| Column | Type | Description |
|--------|------|-------------|
| `city` | TEXT PK | Lowercase display name |
| `summary` | TEXT | Cached summary text |
| `based_on_record_time` | TEXT | `time` value of the latest history record when the summary was generated |
| `cached_at` | INTEGER | Unix timestamp (ms) of when the summary was cached |

**Exported functions:**

| Function | Signature | Behaviour |
|----------|-----------|-----------|
| `get` | `get(city) → row \| null` | Returns `{ summary, based_on_record_time, cached_at }` or `null` |
| `set` | `set(city, summary, basedOnRecordTime)` | Upserts row with current `Date.now()` as `cached_at` |

### `src/handlers/summary.js` — updated

- Import `summaryCache` and compute `TTL_MS` from `SUMMARY_CACHE_TTL_MIN` env var (default 60) at module load time.
- Derive `latestRecordTime` from `history[history.length - 1].time`.
- Apply hybrid cache check before calling Claude.
- Store result in cache after a successful Claude call.
- Include `cached: true/false` in all 200 responses.

## Project Structure Changes

```
ai-helloworld/
  src/
    cache/
      summary.js        # NEW: summary cache backed by store.db
    handlers/
      summary.js        # UPDATED: hybrid cache logic + cached field in response
```

## Acceptance Criteria

1. First `GET /summary?city=Tokyo` → 200 with `"cached": false`; row inserted in `summary_cache`.
2. Immediate second request → 200 with `"cached": true`; Claude API not called.
3. After `SUMMARY_CACHE_TTL_MIN` minutes with no new weather data → `"cached": true` (content unchanged).
4. After TTL + new weather record → `"cached": false` (regenerated).
5. `SUMMARY_CACHE_TTL_MIN=120 npm start` uses 120-minute TTL.
6. All Day 01–06 acceptance criteria continue to pass.

## Testing (manual)

```bash
# Start server (default 60-min TTL)
npm start

# First call — should generate and cache
curl -s "http://localhost:3000/summary?city=Tokyo" | jq .
# Expected: { ..., "cached": false }

# Immediate second call — should hit cache
curl -s "http://localhost:3000/summary?city=Tokyo" | jq .
# Expected: { ..., "cached": true }

# Verify cache row in SQLite
sqlite3 store.db "SELECT city, based_on_record_time, datetime(cached_at/1000, 'unixepoch') FROM summary_cache;"

# Test with short TTL to verify expiry behaviour
SUMMARY_CACHE_TTL_MIN=0 npm start
curl -s "http://localhost:3000/summary?city=Tokyo" | jq .  # cached: false (expired immediately)
```

## Future (not in scope for Day 07)

- Add `?from` / `?to` date-range filters to scope history before summarising.
- Stream the Claude response back to the caller for lower time-to-first-byte.
- Decode weathercodes into labels before sending to Claude.
