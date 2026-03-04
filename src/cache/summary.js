const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../store.db');
const db = new Database(DB_FILE);

db.exec(`
  CREATE TABLE IF NOT EXISTS summary_cache (
    city                TEXT PRIMARY KEY,
    summary             TEXT NOT NULL,
    based_on_record_time TEXT NOT NULL,
    cached_at           INTEGER NOT NULL
  )
`);

const stmtGet = db.prepare('SELECT summary, based_on_record_time, cached_at FROM summary_cache WHERE city = ?');
const stmtSet = db.prepare(`
  INSERT OR REPLACE INTO summary_cache (city, summary, based_on_record_time, cached_at)
  VALUES (?, ?, ?, ?)
`);

function get(city) {
  return stmtGet.get(city.toLowerCase()) || null;
}

function set(city, summary, basedOnRecordTime) {
  stmtSet.run(city.toLowerCase(), summary, basedOnRecordTime, Date.now());
}

module.exports = { get, set };
