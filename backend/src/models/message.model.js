const { getDb } = require('./sqlite');

const db = getDb();

// Create tables
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fromUserId INTEGER NOT NULL,
    toUserId INTEGER NOT NULL,
    content TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`
).run();

// Create indexes for better query performance
db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(fromUserId, toUserId, createdAt)`
).run();

db.prepare(
  `CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages(toUserId, read, createdAt)`
).run();

function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    fromUserId: row.fromUserId,
    toUserId: row.toUserId,
    content: row.content,
    read: !!row.read,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function createMessage(fromUserId, toUserId, content) {
  const now = new Date().toISOString();
  
  const info = db
    .prepare(
      `INSERT INTO messages (fromUserId, toUserId, content, read, createdAt, updatedAt)
       VALUES (@fromUserId, @toUserId, @content, @read, @createdAt, @updatedAt)`
    )
    .run({
      fromUserId,
      toUserId,
      content,
      read: 0,
      createdAt: now,
      updatedAt: now,
    });
  
  return findMessageById(info.lastInsertRowid);
}

async function findMessageById(id) {
  const row = db.prepare(`SELECT * FROM messages WHERE id = ?`).get([id]);
  return mapMessage(row);
}

async function getConversation(userId1, userId2, limit = 50) {
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)
       ORDER BY createdAt DESC
       LIMIT ?`
    )
    .all([userId1, userId2, userId2, userId1, limit]);
  
  // Reverse to get chronological order
  return rows.reverse().map(mapMessage);
}

async function getConversationsForUser(userId) {
  // Get all unique conversations for the user
  const rows = db
    .prepare(
      `SELECT 
         CASE 
           WHEN fromUserId = ? THEN toUserId
           ELSE fromUserId
         END as otherUserId,
         MAX(createdAt) as lastMessageTime
       FROM messages
       WHERE fromUserId = ? OR toUserId = ?
       GROUP BY otherUserId
       ORDER BY lastMessageTime DESC`
    )
    .all([userId, userId, userId]);
  
  // Get user info and message details for each conversation
  const conversations = await Promise.all(
    rows.map(async (row) => {
      const otherUser = await require('./user.model').findById(row.otherUserId);
      
      // Get last message
      const lastMessageRow = db
        .prepare(
          `SELECT content FROM messages
           WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?)
           ORDER BY createdAt DESC LIMIT 1`
        )
        .get([userId, row.otherUserId, row.otherUserId, userId]);
      
      // Get unread count
      const unreadRow = db
        .prepare(
          `SELECT COUNT(*) as count FROM messages 
           WHERE toUserId = ? AND fromUserId = ? AND read = 0`
        )
        .get([userId, row.otherUserId]);
      
      return {
        id: row.otherUserId,
        userId: userId,
        otherUserId: row.otherUserId,
        otherUserName: otherUser?.name || 'Unknown',
        otherUserAvatar: otherUser?.name?.charAt(0).toUpperCase() || '?',
        lastMessage: lastMessageRow?.content || '',
        lastMessageTime: row.lastMessageTime || '',
        unreadCount: unreadRow?.count || 0,
      };
    })
  );
  
  return conversations;
}

async function markMessageAsRead(messageId) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE messages SET read = 1, updatedAt = @updatedAt WHERE id = @id`
  ).run({ id: messageId, updatedAt: now });
  
  return findMessageById(messageId);
}

async function markConversationAsRead(fromUserId, toUserId) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE messages 
     SET read = 1, updatedAt = @updatedAt 
     WHERE fromUserId = ? AND toUserId = ? AND read = 0`
  ).run([fromUserId, toUserId, now]);
  
  return true;
}

async function getUnreadCountForUser(userId) {
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM messages WHERE toUserId = ? AND read = 0`)
    .get([userId]);
  
  return row?.count || 0;
}

module.exports = {
  createMessage,
  findMessageById,
  getConversation,
  getConversationsForUser,
  markMessageAsRead,
  markConversationAsRead,
  getUnreadCountForUser,
};

