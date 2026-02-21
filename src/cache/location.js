const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, '../../location.json');

function load() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function get(city) {
  const cache = load();
  return cache[city.toLowerCase()] || null;
}

function set(city, data) {
  const cache = load();
  cache[city.toLowerCase()] = data;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

module.exports = { get, set };
