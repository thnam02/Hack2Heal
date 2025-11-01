const { getDb } = require('./sqlite');

const db = getDb();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL UNIQUE,
    userId INTEGER NOT NULL,
    type TEXT NOT NULL,
    expires TEXT NOT NULL,
    blacklisted INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`
).run();

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    token: row.token,
    user: row.userId,
    type: row.type,
    expires: row.expires,
    blacklisted: !!row.blacklisted,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findById(id) {
  const row = db.prepare(`SELECT * FROM tokens WHERE id = ?`).get([id]);
  return mapRow(row);
}

async function create({ token, user, type, expires, blacklisted = false }) {
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO tokens (token, userId, type, expires, blacklisted, createdAt, updatedAt)
       VALUES (@token, @userId, @type, @expires, @blacklisted, @createdAt, @updatedAt)`
    )
    .run({
      token,
      userId: user,
      type,
      expires: typeof expires === 'string' ? expires : new Date(expires).toISOString(),
      blacklisted: blacklisted ? 1 : 0,
      createdAt: now,
      updatedAt: now,
    });
  return findById(info.lastInsertRowid);
}

function buildFilterClause(filter = {}) {
  const conditions = [];
  const params = [];

  if (filter.token) {
    conditions.push('token = ?');
    params.push(filter.token);
  }
  if (filter.type) {
    conditions.push('type = ?');
    params.push(filter.type);
  }
  if (filter.user) {
    conditions.push('userId = ?');
    params.push(filter.user);
  }
  if (filter.blacklisted !== undefined) {
    conditions.push('blacklisted = ?');
    params.push(filter.blacklisted ? 1 : 0);
  }

  const clause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

async function findOne(filter = {}) {
  const { clause, params } = buildFilterClause(filter);
  const row = db.prepare(`SELECT * FROM tokens ${clause} LIMIT 1`).get(params);
  return mapRow(row);
}

async function deleteById(id) {
  db.prepare(`DELETE FROM tokens WHERE id = ?`).run([id]);
}

async function deleteMany(filter = {}) {
  const { clause, params } = buildFilterClause(filter);
  db.prepare(`DELETE FROM tokens ${clause}`).run(params);
}

module.exports = {
  create,
  findOne,
  findById,
  deleteById,
  deleteMany,
};
