# Day 02 - Weather API Endpoint

## Overview

Extend the existing Day 01 Node.js HTTP API service with a new `/weather` endpoint that accepts a city name as a query parameter, fetches geolocation data and current weather conditions from the Open-Meteo public APIs, and returns a JSON response.

## Requirements

### New Endpoint

| Method | Path                     | Response Body       | Status Code | Content-Type       |
|--------|--------------------------|---------------------|-------------|--------------------|
| GET    | `/weather?city={city}`   | JSON weather object | 200         | `application/json` |

#### Query Parameters

| Parameter | Type   | Required | Description                        |
|-----------|--------|----------|------------------------------------|
| `city`    | string | Yes      | Name of the city (e.g. `Tokyo`)    |

#### Success Response (200)

```json
{
  "city": "Tokyo",
  "latitude": 35.6895,
  "longitude": 139.6917,
  "temperature": 15.2,
  "windspeed": 10.4,
  "weathercode": 0,
  "time": "2026-02-21T12:00"
}
```

#### Error Responses

| Condition                        | Status | Body                                      |
|----------------------------------|--------|-------------------------------------------|
| `city` param missing             | 400    | `{"error": "Missing required query parameter: city"}` |
| City not found in geocoding API  | 404    | `{"error": "City not found: {city}"}`     |
| External API request fails       | 502    | `{"error": "Failed to fetch weather data"}` |
| Non-GET method                   | 405    | `{"error": "Method Not Allowed"}`         |

All error responses use `Content-Type: application/json`.

### External APIs

#### 1. Geocoding API (Open-Meteo)

Used to resolve a city name to latitude and longitude.

- **URL:** `https://geocoding-api.open-meteo.com/v1/search`
- **Query params:** `name={city}&count=1&language=en&format=json`
- **Pick from response:** `results[0].latitude`, `results[0].longitude`, `results[0].name`
- **No API key required**

Example request:
```
GET https://geocoding-api.open-meteo.com/v1/search?name=Tokyo&count=1&language=en&format=json
```

Example response (abbreviated):
```json
{
  "results": [
    {
      "name": "Tokyo",
      "latitude": 35.6895,
      "longitude": 139.6917,
      "country": "Japan"
    }
  ]
}
```

#### 2. Forecast API (Open-Meteo)

Used to fetch current weather conditions for a given latitude and longitude.

- **URL:** `https://api.open-meteo.com/v1/forecast`
- **Query params:** `latitude={lat}&longitude={lng}&current_weather=true`
- **Pick from response:** `current_weather.temperature`, `current_weather.windspeed`, `current_weather.weathercode`, `current_weather.time`
- **No API key required**

Example request:
```
GET https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current_weather=true
```

Example response (abbreviated):
```json
{
  "current_weather": {
    "temperature": 15.2,
    "windspeed": 10.4,
    "weathercode": 0,
    "time": "2026-02-21T12:00"
  }
}
```

### Project Structure Changes

```
ai-helloworld/
  package.json
  src/
    server.js          # unchanged
    router.js          # add /weather route
    handlers/
      hello.js         # unchanged
      weather.js       # NEW: handler for /weather endpoint
```

### Implementation Constraints

- Continue using only Node.js built-in modules — use the built-in `https` module for external HTTP requests (no `node-fetch`, `axios`, etc.).
- All JSON responses must set `Content-Type: application/json`.
- The weather handler must call the two Open-Meteo APIs sequentially: geocoding first, then forecast using the resolved coordinates.
- Do not cache results between requests.

## Acceptance Criteria

1. `GET /weather?city=Tokyo` returns a 200 JSON response with `city`, `latitude`, `longitude`, `temperature`, `windspeed`, `weathercode`, and `time` fields.
2. `GET /weather` (no `city` param) returns 400 with `{"error": "Missing required query parameter: city"}`.
3. `GET /weather?city=Nonexistentplace12345` returns 404 with `{"error": "City not found: Nonexistentplace12345"}`.
4. `POST /weather?city=Tokyo` returns 405 with `{"error": "Method Not Allowed"}`.
5. The `/hello` endpoint from Day 01 continues to work without modification.

## Testing (manual)

```bash
# Start the server
npm start

# In another terminal

# 1. Valid city
curl -i "http://localhost:3000/weather?city=Tokyo"
# Expected: HTTP/1.1 200 OK, Content-Type: application/json
# Body: {"city":"Tokyo","latitude":35.6895,...}

# 2. Missing city param
curl -i "http://localhost:3000/weather"
# Expected: HTTP/1.1 400 Bad Request
# Body: {"error":"Missing required query parameter: city"}

# 3. Unknown city
curl -i "http://localhost:3000/weather?city=Nonexistentplace12345"
# Expected: HTTP/1.1 404 Not Found
# Body: {"error":"City not found: Nonexistentplace12345"}

# 4. Wrong method
curl -i -X POST "http://localhost:3000/weather?city=Tokyo"
# Expected: HTTP/1.1 405 Method Not Allowed
# Body: {"error":"Method Not Allowed"}

# 5. Confirm /hello still works
curl -i http://localhost:3000/hello
# Expected: HTTP/1.1 200 OK, hello world!
```
