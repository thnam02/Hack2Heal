const path = require('path');

const Database = (() => {
  try {
    // better-sqlite3 is a native dependency; ensure it is installed
    // before attempting to access the database.
    return require('better-sqlite3');
  } catch (error) {
    throw new Error(
      'better-sqlite3 is not installed. Run "npm install better-sqlite3" inside backend/ and rebuild any images.'
    );
  }
})();

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
