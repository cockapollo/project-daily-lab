const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../location.db');
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    city        TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    coordinates TEXT NOT NULL
  )
`);

const stmtGet = db.prepare('SELECT name, coordinates FROM locations WHERE city = ?');
const stmtSet = db.prepare('INSERT OR REPLACE INTO locations (city, name, coordinates) VALUES (?, ?, ?)');

function get(city) {
  const row = stmtGet.get(city.toLowerCase());
  if (!row) return null;
  const { latitude, longitude } = JSON.parse(row.coordinates);
  return { name: row.name, latitude, longitude };
}

function set(city, data) {
  const { name, latitude, longitude } = data;
  stmtSet.run(city.toLowerCase(), name, JSON.stringify({ latitude, longitude }));
}

module.exports = { get, set };
