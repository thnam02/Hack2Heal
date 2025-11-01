const bcrypt = require('bcryptjs');
const { getDb } = require('./sqlite');

const db = getDb();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    isEmailVerified INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`
).run();

function mapRow(row) {
  if (!row) return null;
  return {
    ...row,
    isEmailVerified: !!row.isEmailVerified,
    // Keep API similar to Mongoose doc instances used by auth
    isPasswordMatch: async (password) => bcrypt.compare(password, row.password),
  };
}

async function findById(id) {
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get([id]);
  return mapRow(row);
}

async function create(userBody) {
  const now = new Date().toISOString();
  const hashed = await bcrypt.hash(userBody.password, 8);

  // Validate role: must be 'patient' or 'clinician', default to 'patient' if not provided
  const validRoles = ['patient', 'clinician'];
  const role = userBody.role && validRoles.includes(userBody.role) ? userBody.role : 'patient';
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password, role, isEmailVerified, createdAt, updatedAt)
       VALUES (@name, @email, @password, @role, @isEmailVerified, @createdAt, @updatedAt)`
    )
    .run({
      name: userBody.name,
      email: userBody.email,
      password: hashed,
      role,
      isEmailVerified: 0,
      createdAt: now,
      updatedAt: now,
    });
  return findById(info.lastInsertRowid);
}

async function isEmailTaken(email, excludeUserId) {
  const row = db
    .prepare(
      excludeUserId
        ? `SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1`
        : `SELECT id FROM users WHERE email = ? LIMIT 1`
    )
    .get(excludeUserId ? [email, excludeUserId] : [email]);
  return !!row;
}

async function paginate(filter = {}, options = {}) {
  const limit = Math.max(1, Number(options.limit) || 10);
  const page = Math.max(1, Number(options.page) || 1);
  const offset = (page - 1) * limit;

  // Filtering
  const conditions = [];
  const params = [];
  if (filter.name) {
    conditions.push(`name LIKE ?`);
    params.push(`%${filter.name}%`);
  }
  if (filter.role) {
    conditions.push(`role = ?`);
    params.push(filter.role);
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Sorting
  let orderBy = 'ORDER BY createdAt DESC';
  if (options.sortBy) {
    // format: field:(asc|desc)
    const [field, direction] = String(options.sortBy).split(':');
    const dir = direction && direction.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const safeField = ['name', 'email', 'role', 'createdAt', 'updatedAt', 'id'].includes(field) ? field : 'createdAt';
    orderBy = `ORDER BY ${safeField} ${dir}`;
  }

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM users ${whereClause}`).get(params);
  const rows = db
    .prepare(`SELECT * FROM users ${whereClause} ${orderBy} LIMIT ? OFFSET ?`)
    .all([...params, limit, offset])
    .map(mapRow);

  const totalResults = totalRow.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / limit));

  return { results: rows, page, limit, totalPages, totalResults };
}

async function findOne(query) {
  if (query && query.email) {
    const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get([query.email]);
    return mapRow(row);
  }
  return null;
}

async function updateById(id, updateBody) {
  const user = await findById(id);
  if (!user) return null;

  const now = new Date().toISOString();
  let nextIsEmailVerified;
  if (updateBody.isEmailVerified !== undefined) {
    nextIsEmailVerified = updateBody.isEmailVerified ? 1 : 0;
  } else {
    nextIsEmailVerified = user.isEmailVerified ? 1 : 0;
  }
  const next = {
    name: updateBody.name !== undefined ? updateBody.name : user.name,
    email: updateBody.email !== undefined ? updateBody.email : user.email,
    role: updateBody.role !== undefined ? updateBody.role : user.role,
    isEmailVerified: nextIsEmailVerified,
    password: updateBody.password !== undefined ? await bcrypt.hash(updateBody.password, 8) : user.password,
  };

  db.prepare(
    `UPDATE users SET
        name = @name,
        email = @email,
        password = @password,
        role = @role,
        isEmailVerified = @isEmailVerified,
        updatedAt = @updatedAt
      WHERE id = @id`
  ).run({ ...next, updatedAt: now, id });

  return findById(id);
}

async function deleteById(id) {
  db.prepare(`DELETE FROM users WHERE id = ?`).run([id]);
  return true;
}

module.exports = {
  create,
  isEmailTaken,
  paginate,
  findById,
  findOne,
  updateById,
  deleteById,
};
