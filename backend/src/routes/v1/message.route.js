const express = require('express');
const auth = require('../../middlewares/auth');
const { messageController } = require('../../controllers');

const router = express.Router();

router.use(auth);

router
  .route('/send')
  .post(messageController.sendMessage);

router
  .route('/conversations')
  .get(messageController.getConversations);

router
  .route('/conversation/:userId')
  .get(messageController.getMessages);

router
  .route('/read/:messageId')
  .post(messageController.markAsRead);

router
  .route('/conversation/:userId/read')
  .post(messageController.markConversationAsRead);

module.exports = router;

