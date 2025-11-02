const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { statsService } = require('../services');

const completeSession = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const stats = await statsService.completeSession(userId);
  res.status(httpStatus.OK).send(stats);
});

const getStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const stats = await statsService.getUserStats(userId);
  res.status(httpStatus.OK).send(stats);
});

const getLeaderboard = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const leaderboard = await statsService.getLeaderboard(limit);
  res.status(httpStatus.OK).send(leaderboard);
});

module.exports = {
  completeSession,
  getStats,
  getLeaderboard,
};
