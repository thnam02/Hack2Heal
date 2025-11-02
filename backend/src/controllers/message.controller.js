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
  
  const conversations = await messageService.getConversations(userId);
  res.send(conversations);
});

const getMessages = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const otherUserId = parseInt(req.params.userId);
  const limit = parseInt(req.query.limit) || 50;
  
  const messages = await messageService.getMessages(userId, otherUserId, limit);
  res.send(messages);
});

const markAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const messageId = parseInt(req.params.messageId);
  
  const message = await messageService.markAsRead(messageId, userId);
  res.send(message);
});

const markConversationAsRead = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const otherUserId = parseInt(req.params.userId);
  
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

