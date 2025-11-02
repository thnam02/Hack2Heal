const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { messageService } = require('../services');

const sendMessage = catchAsync(async (req, res) => {
  const fromUserId = req.user.id;
  const { toUserId, content } = req.body;

  const message = await messageService.sendMessage(fromUserId, toUserId, content);
  res.status(httpStatus.CREATED).send(message);
});

const getConversations = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // console.log(`[getConversations] Getting conversations for userId: ${userId}`);

  const conversations = await messageService.getConversations(userId);
  // console.log(`[getConversations] Found ${conversations?.length || 0} conversations`);
  // console.log(`[getConversations] Conversations data:`, JSON.stringify(conversations, null, 2));
  // console.log(`[getConversations] Sending response...`);

  // Ensure response is sent
  if (!res.headersSent) {
    res.status(httpStatus.OK).json(conversations || []);
    // console.log(`[getConversations] Response sent successfully with status ${httpStatus.OK}`);
  }
});

const getMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const otherUserId = parseInt(req.params.userId, 10);
  const limit = parseInt(req.query.limit, 10) || 50;

  const messages = await messageService.getMessages(userId, otherUserId, limit);
  res.send(messages);
});

const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const messageId = parseInt(req.params.messageId, 10);

  const message = await messageService.markAsRead(messageId, userId);
  res.send(message);
});

const markConversationAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const otherUserId = parseInt(req.params.userId, 10);

  await messageService.markConversationAsRead(userId, otherUserId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  markConversationAsRead,
};
