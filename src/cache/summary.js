const Database = require('better-sqlite3');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../store.db');
const db = new Database(DB_FILE);

const cols = db.prepare('PRAGMA table_info(summary_cache)').all().map(c => c.name);
if (cols.length > 0 && !cols.includes('length')) {
  db.exec('DROP TABLE summary_cache');
}

db.exec(`
  CREATE TABLE IF NOT EXISTS summary_cache (
    city                TEXT NOT NULL,
    length              TEXT NOT NULL,
    mode                TEXT NOT NULL,
    summary             TEXT NOT NULL,
    based_on_record_time TEXT NOT NULL,
    cached_at           INTEGER NOT NULL,
    PRIMARY KEY (city, length, mode)
  )
`);

const stmtGet = db.prepare('SELECT summary, based_on_record_time, cached_at FROM summary_cache WHERE city = ? AND length = ? AND mode = ?');
const stmtSet = db.prepare(`
  INSERT OR REPLACE INTO summary_cache (city, length, mode, summary, based_on_record_time, cached_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

function get(city, length, mode) {
  return stmtGet.get(city.toLowerCase(), length, mode) || null;
}

function set(city, length, mode, summary, basedOnRecordTime) {
  stmtSet.run(city.toLowerCase(), length, mode, summary, basedOnRecordTime, Date.now());
}

module.exports = { get, set };
