const httpStatus = require('http-status');
const { userStatsModel } = require('../models');

const completeSession = async (userId) => {
  // Add +20 XP
  await userStatsModel.addXp(userId, 20);
  
  // Increment session count and update streak
  const stats = await userStatsModel.incrementSession(userId);
  
  // Update quest progress
  const questProgress = stats.questProgress || {};
  
  // Quest 1: Complete 3 sessions this week
  const quest1Id = 'complete_3_sessions_week';
  const quest1Progress = questProgress[quest1Id]?.progress || 0;
  await userStatsModel.updateQuestProgress(userId, quest1Id, quest1Progress + 1, 3);
  
  // Quest 2: Perfect Form x3 (completed when all sets are done)
  const quest2Id = 'perfect_form_x3';
  const quest2Progress = questProgress[quest2Id]?.progress || 0;
  const newQuest2Progress = Math.min(quest2Progress + 1, 3); // Cap at 3
  await userStatsModel.updateQuestProgress(userId, quest2Id, newQuest2Progress, 3);
  
  // Quest 4: Complete full exercise plan (increment session count towards total)
  const quest4Id = 'complete_full_exercise_plan';
  const quest4Progress = questProgress[quest4Id]?.progress || 0;
  await userStatsModel.updateQuestProgress(userId, quest4Id, quest4Progress + 1, 10);
  
  // Get updated stats
  return userStatsModel.findByUserId(userId);
};

const getUserStats = async (userId) => {
  const stats = await userStatsModel.findByUserId(userId);
  if (!stats) {
    // Initialize stats for user
    return await userStatsModel.createOrUpdate(userId, {
      totalXp: 0,
      currentStreak: 0,
      sessionsCompleted: 0,
      questProgress: {},
    });
  }
  return stats;
};

const getLeaderboard = async (limit = 10) => {
  return await userStatsModel.getLeaderboard(limit);
};

module.exports = {
  completeSession,
  getUserStats,
  getLeaderboard,
};

