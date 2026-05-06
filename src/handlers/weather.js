const https = require('https');
const locationCache = require('../cache/location');
const weatherHistory = require('../cache/weather');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      family: 4, // force IPv4 — IPv6 for open-meteo times out on this host
    };
    https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject).end();
  });
}

const MAX_CITIES = 3;

async function fetchWeatherForCity(city) {
  let cached = locationCache.get(city);
  let latitude, longitude, name;

  if (cached) {
    ({ latitude, longitude, name } = cached);
  } else {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoData = await fetchJson(geoUrl);

    if (!geoData.results || geoData.results.length === 0) {
      throw Object.assign(new Error(`City not found: ${city}`), { status: 404 });
    }

    ({ latitude, longitude, name } = geoData.results[0]);
    locationCache.set(city, { name, latitude, longitude });
  }

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
  const forecastData = await fetchJson(forecastUrl);

  const { temperature, windspeed, weathercode, time } = forecastData.current_weather;
  weatherHistory.set(name, time, { temperature, windspeed, weathercode });

  return { city: name, latitude, longitude, temperature, windspeed, weathercode, time };
}

async function weatherHandler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const city   = searchParams.get('city');
  const cities = searchParams.get('cities');

  if (!city && !cities) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing required query parameter: city or cities' }));
    return;
  }

  // single-city path
  if (city) {
    try {
      const result = await fetchWeatherForCity(city);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      const status = err.status === 404 ? 404 : 502;
      const message = err.status === 404 ? err.message : 'Failed to fetch weather data';
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: message }));
    }
    return;
  }

  // multi-city path
  const list = cities.split(',').map(c => c.trim()).filter(Boolean);

  if (list.length === 0) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No cities provided' }));
    return;
  }

  if (list.length > MAX_CITIES) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Too many cities: max ${MAX_CITIES}` }));
    return;
  }

  const settled = await Promise.allSettled(list.map(fetchWeatherForCity));

  const results = [];
  const errors  = [];

  settled.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
    } else {
      errors.push({ city: list[i], error: outcome.reason.message });
    }
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ results, errors }));
}

module.exports = weatherHandler;
