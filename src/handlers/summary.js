const https = require('https');
const locationCache = require('../cache/location');
const weatherHistory = require('../cache/weather');
const summaryCache = require('../cache/summary');

const TTL_MS = (parseInt(process.env.SUMMARY_CACHE_TTL_MIN) || 60) * 60 * 1000;

function callClaude(prompt) {
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: 'You are a weather analyst. Summarize the weather trend in 2-3 sentences using only the data provided. Do not add external knowledge, forecasts, or inferences beyond what the records show.',
    messages: [{ role: 'user', content: prompt }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        family: 4,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.content[0].text);
          } catch (e) {
            reject(new Error('Invalid response from Claude API'));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function summaryHandler(req, res) {
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

  const history = weatherHistory.getHistory(city);

  if (history.length === 0) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `No weather history found for: ${city}` }));
    return;
  }

  const location = locationCache.get(city);
  const displayName = location ? location.name : city;

  const latestRecordTime = history[history.length - 1].time;

  const cached = summaryCache.get(displayName);
  if (cached) {
    const age = Date.now() - cached.cached_at;
    if (age < TTL_MS || cached.based_on_record_time === latestRecordTime) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ city: displayName, record_count: history.length, summary: cached.summary, cached: true }));
      return;
    }
  }

  const context = history
    .map(r => `${r.time} — temp: ${r.temperature}°C, wind: ${r.windspeed} km/h, code: ${r.weathercode}`)
    .join('\n');

  const prompt = `City: ${displayName}. Weather history (oldest to newest):\n${context}\n\nSummarize the weather trend in 2-3 sentences.`;

  try {
    const summary = await callClaude(prompt);
    summaryCache.set(displayName, summary, latestRecordTime);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ city: displayName, record_count: history.length, summary, cached: false }));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to generate summary' }));
  }
}

module.exports = summaryHandler;
