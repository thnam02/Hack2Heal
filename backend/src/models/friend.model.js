const { getDb } = require('./sqlite');

const db = getDb();

// Create tables
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS friend_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromUserId INTEGER NOT NULL,
    toUserId INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    UNIQUE(fromUserId, toUserId)
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS friends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    friendId INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    UNIQUE(userId, friendId),
    CHECK(userId != friendId)
  )
`
).run();

function mapFriendRequest(row) {
  if (!row) return null;
  return {
    id: row.id,
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapFriend(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    friendId: row.friendId,
    createdAt: row.createdAt,
  };
}

// Friend Requests
async function createFriendRequest(fromUserId, toUserId) {
  const now = new Date().toISOString();

  // Check if request already exists
  const existing = db
    .prepare(`SELECT * FROM friend_requests WHERE fromUserId = ? AND toUserId = ?`)
    .get([fromUserId, toUserId]);

  if (existing) {
    const error = new Error('Friend request already exists');
    error.status = 400;
    throw error;
  }

  // Check if already friends
  // eslint-disable-next-line no-use-before-define
  const friendship = await findFriendship(fromUserId, toUserId);
  if (friendship) {
    const error = new Error('Already friends');
    error.status = 400;
    throw error;
  }

  // Check reverse request
  const reverse = db
    .prepare(`SELECT * FROM friend_requests WHERE fromUserId = ? AND toUserId = ?`)
    .get([toUserId, fromUserId]);

  if (reverse && reverse.status === 'pending') {
    // Auto-accept if reverse request exists
    // eslint-disable-next-line no-use-before-define
    await updateFriendRequestStatus(reverse.id, 'accepted');
    // eslint-disable-next-line no-use-before-define
    await createFriendship(fromUserId, toUserId);
    // eslint-disable-next-line no-use-before-define
    return findFriendRequestById(reverse.id);
  }

  const info = db
    .prepare(
      `INSERT INTO friend_requests (fromUserId, toUserId, status, createdAt, updatedAt)
       VALUES (@fromUserId, @toUserId, @status, @createdAt, @updatedAt)`
    )
    .run({
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

  // eslint-disable-next-line no-use-before-define
  return findFriendRequestById(info.lastInsertRowid);
}

async function findFriendRequestById(id) {
  const row = db.prepare(`SELECT * FROM friend_requests WHERE id = ?`).get([id]);
  return mapFriendRequest(row);
}

async function findFriendRequest(fromUserId, toUserId) {
  const row = db.prepare(`SELECT * FROM friend_requests WHERE fromUserId = ? AND toUserId = ?`).get([fromUserId, toUserId]);
  return mapFriendRequest(row);
}

async function updateFriendRequestStatus(id, status) {
  const now = new Date().toISOString();
  db.prepare(`UPDATE friend_requests SET status = @status, updatedAt = @updatedAt WHERE id = @id`).run({
    id,
    status,
    updatedAt: now,
  });

  return findFriendRequestById(id);
}

async function getFriendRequestsForUser(userId) {
  const rows = db
    .prepare(
      `SELECT * FROM friend_requests 
       WHERE (fromUserId = ? OR toUserId = ?) 
       ORDER BY createdAt DESC`
    )
    .all([userId, userId]);

  return rows.map(mapFriendRequest);
}

async function getPendingFriendRequestsForUser(userId) {
  const rows = db
    .prepare(
      `SELECT fr.*, u.id as user_id, u.name as user_name, u.email as user_email
       FROM friend_requests fr
       JOIN users u ON fr.fromUserId = u.id
       WHERE fr.toUserId = ? AND fr.status = 'pending'
       ORDER BY fr.createdAt DESC`
    )
    .all([userId]);

  return rows.map((row) => ({
    ...mapFriendRequest(row),
    userName: row.user_name,
    userEmail: row.user_email,
    userAvatar: row.user_name?.charAt(0).toUpperCase() || '?',
  }));
}

async function getAllFriendRequestsForUser(userId) {
  // Get incoming requests (sent to user)
  const incomingRows = db
    .prepare(
      `SELECT fr.*, u.id as user_id, u.name as user_name, u.email as user_email
       FROM friend_requests fr
       JOIN users u ON fr.fromUserId = u.id
       WHERE fr.toUserId = ? AND fr.status = 'pending'
       ORDER BY fr.createdAt DESC`
    )
    .all([userId]);

  // Get outgoing requests (sent by user)
  const outgoingRows = db
    .prepare(
      `SELECT fr.*, u.id as user_id, u.name as user_name, u.email as user_email
       FROM friend_requests fr
       JOIN users u ON fr.toUserId = u.id
       WHERE fr.fromUserId = ? AND fr.status = 'pending'
       ORDER BY fr.createdAt DESC`
    )
    .all([userId]);

  return {
    incoming: incomingRows.map((row) => ({
      ...mapFriendRequest(row),
      userName: row.user_name,
      userEmail: row.user_email,
      userAvatar: row.user_name?.charAt(0).toUpperCase() || '?',
    })),
    outgoing: outgoingRows.map((row) => ({
      ...mapFriendRequest(row),
      userName: row.user_name,
      userEmail: row.user_email,
      userAvatar: row.user_name?.charAt(0).toUpperCase() || '?',
    })),
  };
}

// Friends
async function createFriendship(userId1, userId2) {
  const now = new Date().toISOString();

  // Create bidirectional friendship
  // eslint-disable-next-line no-unused-vars
  const info1 = db
    .prepare(
      `INSERT OR IGNORE INTO friends (userId, friendId, createdAt)
       VALUES (@userId, @friendId, @createdAt)`
    )
    .run({
      userId: userId1,
      friendId: userId2,
      createdAt: now,
    });

  // eslint-disable-next-line no-unused-vars
  const info2 = db
    .prepare(
      `INSERT OR IGNORE INTO friends (userId, friendId, createdAt)
       VALUES (@userId, @friendId, @createdAt)`
    )
    .run({
      userId: userId2,
      friendId: userId1,
      createdAt: now,
    });

  // eslint-disable-next-line no-use-before-define
  return findFriendship(userId1, userId2);
}

async function findFriendship(userId1, userId2) {
  const row = db.prepare(`SELECT * FROM friends WHERE userId = ? AND friendId = ?`).get([userId1, userId2]);
  return mapFriend(row);
}

async function getFriendsForUser(userId) {
  const rows = db
    .prepare(
      `SELECT f.*, u.id as friendUserId, u.name as friendName, u.email as friendEmail
       FROM friends f
       JOIN users u ON f.friendId = u.id
       WHERE f.userId = ?
       ORDER BY f.createdAt DESC`
    )
    .all([userId]);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    friendId: row.friendId,
    friendName: row.friendName,
    friendEmail: row.friendEmail,
    createdAt: row.createdAt,
  }));
}

async function deleteFriendship(userId1, userId2) {
  db.prepare(`DELETE FROM friends WHERE userId = ? AND friendId = ?`).run([userId1, userId2]);
  db.prepare(`DELETE FROM friends WHERE userId = ? AND friendId = ?`).run([userId2, userId1]);
  return true;
}

module.exports = {
  // Friend Requests
  createFriendRequest,
  findFriendRequestById,
  findFriendRequest,
  updateFriendRequestStatus,
  getFriendRequestsForUser,
  getPendingFriendRequestsForUser,
  getAllFriendRequestsForUser,

  // Friends
  createFriendship,
  findFriendship,
  getFriendsForUser,
  deleteFriendship,
};
