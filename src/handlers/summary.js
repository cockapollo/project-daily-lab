const https = require('https');
const locationCache = require('../cache/location');
const weatherHistory = require('../cache/weather');
const summaryCache = require('../cache/summary');
const { decode } = require('../utils/weathercodes');

const TTL_MS = (parseInt(process.env.SUMMARY_CACHE_TTL_MIN) || 60) * 60 * 1000;

const VALID_LENGTHS = ['brief', 'normal', 'detailed'];
const VALID_MODES   = ['trend', 'anomaly'];

const MAX_TOKENS = {
  brief:    80,
  normal:   200,
  detailed: 450,
};

const LENGTH_INSTRUCTIONS = {
  brief:    'Respond in exactly 1 sentence.',
  normal:   'Respond in 2-3 sentences.',
  detailed: 'Respond in a full paragraph (4-6 sentences), covering temperature, wind, and weather conditions in depth.',
};

const MODE_INSTRUCTIONS = {
  trend:   'Focus on directional patterns and changes over time — is it getting warmer, cooler, windier, or calmer?',
  anomaly: 'Focus on outliers and unusual readings — flag any spikes, drops, or data points that deviate significantly from the rest.',
};

function buildSystemPrompt(length, mode) {
  const parts = [
    'You are a weather analyst. Use only the data provided. Do not add external knowledge, forecasts, or inferences beyond what the records show.',
    LENGTH_INSTRUCTIONS[length],
  ];
  if (mode) parts.push(MODE_INSTRUCTIONS[mode]);
  return parts.join(' ');
}

function callClaude(systemPrompt, prompt, length) {
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: MAX_TOKENS[length],
    system: [
      { type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } },
    ],
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
            if (parsed.type === 'error') {
              reject(new Error(`Claude API error: ${parsed.error.type} — ${parsed.error.message}`));
            } else {
              resolve(parsed.content[0].text);
            }
          } catch (e) {
            reject(new Error(`Invalid response from Claude API: ${data.slice(0, 200)}`));
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
  const city   = searchParams.get('city');
  const from    = searchParams.get('from')    || undefined;
  const to      = searchParams.get('to')      || undefined;
  const length  = searchParams.get('length')  || 'normal';
  const mode    = searchParams.get('mode')    || undefined;
  const refresh = searchParams.get('refresh') === 'true';

  if (!city) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing required query parameter: city' }));
    return;
  }

  if (!VALID_LENGTHS.includes(length)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Invalid value for length: ${length}` }));
    return;
  }

  if (mode && !VALID_MODES.includes(mode)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Invalid value for mode: ${mode}` }));
    return;
  }

  const history = weatherHistory.getHistory(city, from, to);

  if (history.length === 0) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `No weather history found for: ${city}` }));
    return;
  }

  const location = locationCache.get(city);
  const displayName = location ? location.name : city;

  const isFiltered   = from || to;
  const isCustomized = length !== 'normal' || !!mode;
  const skipCache    = isFiltered || isCustomized || refresh;

  const latestRecordTime = weatherHistory.getLatestTime(city);

  if (!skipCache) {
    const cached = summaryCache.get(displayName);
    if (cached) {
      const age = Date.now() - cached.cached_at;
      if (age < TTL_MS || cached.based_on_record_time === latestRecordTime) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ city: displayName, record_count: history.length, summary: cached.summary, cached: true }));
        return;
      }
    }
  }

  const context = history
    .map(r => `${r.time} — temp: ${r.temperature}°C, wind: ${r.windspeed} km/h, conditions: ${decode(r.weathercode)}`)
    .join('\n');

  const systemPrompt = buildSystemPrompt(length, mode);
  const prompt = `City: ${displayName}. Weather history (oldest to newest):\n${context}\n\nSummarize the weather trend.`;

  try {
    const summary = await callClaude(systemPrompt, prompt, length);
    if (!skipCache) {
      summaryCache.set(displayName, summary, latestRecordTime);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ city: displayName, record_count: history.length, summary, cached: false }));
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to generate summary', detail: err.message }));
  }
}

module.exports = summaryHandler;
