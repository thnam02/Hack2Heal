const express = require('express');
const auth = require('../../middlewares/auth');
const { messageController } = require('../../controllers');

const router = express.Router();

// Log all requests to message routes
router.use((req, res, next) => {
  // console.log(`📨 Message route: ${req.method} ${req.path} - Original URL: ${req.originalUrl}`);
  next();
});

router.use((req, res, next) => {
  // console.log(`🔍 Before route handlers: ${req.method} ${req.path}`);
  next();
});

router.route('/send').post(auth(), messageController.sendMessage);

router.route('/conversations').get(
  auth(),
  (req, res, next) => {
    // console.log(`✅ GET /conversations route handler called - userId: ${req.user?.id}`);
    next();
  },
  messageController.getConversations
);

router.route('/conversation/:userId').get(auth(), messageController.getMessages);

router.route('/read/:messageId').post(auth(), messageController.markAsRead);

router.route('/conversation/:userId/read').post(auth(), messageController.markConversationAsRead);

module.exports = router;
