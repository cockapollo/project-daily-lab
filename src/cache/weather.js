const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../store.db');
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS weather_history (
    city TEXT NOT NULL,
    time TEXT NOT NULL,
    data TEXT NOT NULL,
    PRIMARY KEY (city, time)
  )
`);

const stmtGet = db.prepare('SELECT data FROM weather_history WHERE city = ? AND time = ?');
const stmtSet = db.prepare('INSERT OR IGNORE INTO weather_history (city, time, data) VALUES (?, ?, ?)');
const stmtHistory = db.prepare('SELECT time, data FROM weather_history WHERE city = ? ORDER BY time ASC');

function get(city, time) {
  const row = stmtGet.get(city.toLowerCase(), time);
  if (!row) return null;
  return JSON.parse(row.data);
}

function set(city, time, data) {
  const { temperature, windspeed, weathercode } = data;
  stmtSet.run(city.toLowerCase(), time, JSON.stringify({ temperature, windspeed, weathercode }));
}

function getHistory(city) {
  return stmtHistory.all(city.toLowerCase()).map(row => {
    const { temperature, windspeed, weathercode } = JSON.parse(row.data);
    return { time: row.time, temperature, windspeed, weathercode };
  });
}

module.exports = { get, set, getHistory };
