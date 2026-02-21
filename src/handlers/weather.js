const https = require('https');
const locationCache = require('../cache/location');

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

async function weatherHandler(req, res) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
  const city = searchParams.get('city');

  if (!city) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing required query parameter: city' }));
    return;
  }

  try {
    let cached = locationCache.get(city);
    let latitude, longitude, name;

    if (cached) {
      ({ latitude, longitude, name } = cached);
    } else {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoData = await fetchJson(geoUrl);

      if (!geoData.results || geoData.results.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `City not found: ${city}` }));
        return;
      }

      ({ latitude, longitude, name } = geoData.results[0]);
      locationCache.set(city, { name, latitude, longitude });
    }

    const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    const forecastData = await fetchJson(forecastUrl);

    const { temperature, windspeed, weathercode, time } = forecastData.current_weather;

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ city: name, latitude, longitude, temperature, windspeed, weathercode, time }));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to fetch weather data' }));
  }
}

module.exports = weatherHandler;
