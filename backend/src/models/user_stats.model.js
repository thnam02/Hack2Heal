const { getDb } = require('./sqlite');

const db = getDb();

// Create user_stats table
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL UNIQUE,
    totalXp INTEGER NOT NULL DEFAULT 0,
    currentStreak INTEGER NOT NULL DEFAULT 0,
    lastCompletedDate TEXT,
    sessionsCompleted INTEGER NOT NULL DEFAULT 0,
    questProgress TEXT NOT NULL DEFAULT '{}',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`
).run();

function mapRow(row) {
  if (!row) return null;
  try {
    const questProgress = row.questProgress ? JSON.parse(row.questProgress) : {};
    return {
      ...row,
      questProgress,
      lastCompletedDate: row.lastCompletedDate || null,
    };
  } catch (e) {
    return {
      ...row,
      questProgress: {},
      lastCompletedDate: row.lastCompletedDate || null,
    };
  }
}

async function findByUserId(userId) {
  const row = db.prepare(`SELECT * FROM user_stats WHERE userId = ?`).get([userId]);
  return mapRow(row);
}

async function createOrUpdate(userId, statsData) {
  const existing = await findByUserId(userId);
  const now = new Date().toISOString();
  const questProgress = JSON.stringify(statsData.questProgress || {});

  if (existing) {
    db.prepare(
      `UPDATE user_stats SET
        totalXp = @totalXp,
        currentStreak = @currentStreak,
        lastCompletedDate = @lastCompletedDate,
        sessionsCompleted = @sessionsCompleted,
        questProgress = @questProgress,
        updatedAt = @updatedAt
      WHERE userId = @userId`
    ).run({
      userId,
      totalXp: statsData.totalXp ?? existing.totalXp,
      currentStreak: statsData.currentStreak ?? existing.currentStreak,
      lastCompletedDate: statsData.lastCompletedDate ?? existing.lastCompletedDate,
      sessionsCompleted: statsData.sessionsCompleted ?? existing.sessionsCompleted,
      questProgress,
      updatedAt: now,
    });
    return findByUserId(userId);
  }

  // eslint-disable-next-line no-unused-vars
  const info = db
    .prepare(
      `INSERT INTO user_stats (userId, totalXp, currentStreak, lastCompletedDate, sessionsCompleted, questProgress, createdAt, updatedAt)
       VALUES (@userId, @totalXp, @currentStreak, @lastCompletedDate, @sessionsCompleted, @questProgress, @createdAt, @updatedAt)`
    )
    .run({
      userId,
      totalXp: statsData.totalXp || 0,
      currentStreak: statsData.currentStreak || 0,
      lastCompletedDate: statsData.lastCompletedDate || null,
      sessionsCompleted: statsData.sessionsCompleted || 0,
      questProgress,
      createdAt: now,
      updatedAt: now,
    });
  return findByUserId(userId);
}

async function addXp(userId, xpAmount) {
  const stats = await findByUserId(userId);
  const currentXp = stats ? stats.totalXp : 0;
  return createOrUpdate(userId, {
    totalXp: currentXp + xpAmount,
  });
}

async function incrementSession(userId) {
  const stats = await findByUserId(userId);
  const currentSessions = stats ? stats.sessionsCompleted : 0;

  // Check if we should update streak
  const today = new Date().toISOString().split('T')[0];
  const lastCompleted = stats?.lastCompletedDate ? stats.lastCompletedDate.split('T')[0] : null;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = stats ? stats.currentStreak : 0;
  const lastCompletedDate = today;

  if (lastCompleted === today) {
    // Already completed today, don't increment streak or session
    return stats;
  }
  if (lastCompleted === yesterday) {
    // Consecutive day, increment streak
    newStreak += 1;
  } else if (lastCompleted && lastCompleted !== yesterday && lastCompleted !== today) {
    // Streak broken, reset to 1
    newStreak = 1;
  } else {
    // First time or no previous completion
    newStreak = 1;
  }

  return createOrUpdate(userId, {
    sessionsCompleted: currentSessions + 1,
    currentStreak: newStreak,
    lastCompletedDate,
  });
}

async function updateQuestProgress(userId, questId, progress, total) {
  const stats = await findByUserId(userId);
  const questProgress = stats?.questProgress || {};
  questProgress[questId] = { progress, total };

  return createOrUpdate(userId, {
    questProgress,
  });
}

async function getLeaderboard(limit = 10) {
  const rows = db
    .prepare(
      `SELECT 
        us.userId,
        u.name,
        u.email,
        us.totalXp,
        us.currentStreak,
        us.sessionsCompleted,
        ROW_NUMBER() OVER (ORDER BY us.totalXp DESC) as rank
      FROM user_stats us
      JOIN users u ON us.userId = u.id
      WHERE u.role != 'clinician'
      ORDER BY us.totalXp DESC
      LIMIT ?`
    )
    .all([limit])
    .map((row) => ({
      rank: row.rank,
      userId: row.userId,
      name: row.name,
      email: row.email,
      xp: row.totalXp,
      streak: row.currentStreak,
      sessionsCompleted: row.sessionsCompleted,
      level: Math.floor(row.totalXp / 150) + 1, // Level based on XP (150 XP per level)
    }));

  return rows;
}

module.exports = {
  findByUserId,
  createOrUpdate,
  addXp,
  incrementSession,
  updateQuestProgress,
  getLeaderboard,
};
