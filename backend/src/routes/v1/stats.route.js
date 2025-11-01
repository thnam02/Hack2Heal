const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const { statsController } = require('../../controllers');

const router = express.Router();

router
  .route('/complete-session')
  .post(auth(), statsController.completeSession);

router
  .route('/me')
  .get(auth(), statsController.getStats);

router
  .route('/leaderboard')
  .get(auth(), statsController.getLeaderboard);

module.exports = router;

