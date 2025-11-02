const httpStatus = require('http-status');
const { messageModel, User } = require('../models');
const ApiError = require('../utils/ApiError');

const sendMessage = async (fromUserId, toUserId, content) => {
  if (!content || !content.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Message content cannot be empty');
  }

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Recipient not found');
  }

  // Check if users are friends - use friendModel directly to avoid circular dependency
  const { friendModel } = require('../models');
  const friendship = await friendModel.findFriendship(fromUserId, toUserId);
  if (!friendship) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You can only message users who are your friends. Please send a friend request first.'
    );
  }

  return messageModel.createMessage(fromUserId, toUserId, content.trim());
};

const getConversations = async (userId) => {
  // console.log(`[messageService.getConversations] userId: ${userId}`);
  const conversations = await messageModel.getConversationsForUser(userId);
  // console.log(`[messageService.getConversations] Result: ${conversations?.length || 0} conversations`);
  return conversations || [];
};

const getMessages = async (userId1, userId2, limit) => {
  const otherUser = await User.findById(userId2);
  if (!otherUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return messageModel.getConversation(userId1, userId2, limit);
};

const markAsRead = async (messageId, userId) => {
  const message = await messageModel.findMessageById(messageId);
  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  if (message.toUserId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only mark your own received messages as read');
  }

  return messageModel.markMessageAsRead(messageId);
};

const markConversationAsRead = async (userId, otherUserId) => {
  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return messageModel.markConversationAsRead(otherUserId, userId);
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  markConversationAsRead,
};
