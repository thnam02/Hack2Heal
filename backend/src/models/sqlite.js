const path = require('path');
const Database = require('better-sqlite3');

let instance;

function resolveDatabasePath() {
  const dbUrl = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../data.sqlite')}`;
  return dbUrl.startsWith('file:') ? dbUrl.replace(/^file:/, '') : dbUrl;
}

function getDb() {
  if (instance) {
    return instance;
  }
  instance = new Database(resolveDatabasePath());
  instance.pragma('journal_mode = WAL');
  return instance;
}

module.exports = {
  getDb,
};
