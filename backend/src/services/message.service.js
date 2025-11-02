const { messageModel, User } = require('../models');
const { friendService } = require('./friend.service');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const sendMessage = async (fromUserId, toUserId, content) => {
  if (!content || !content.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Message content cannot be empty');
  }

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Recipient not found');
  }

  // Check if users are friends
  const areUsersFriends = await friendService.areFriends(fromUserId, toUserId);
  if (!areUsersFriends) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'You can only message users who are your friends. Please send a friend request first.'
    );
  }

  return await messageModel.createMessage(fromUserId, toUserId, content.trim());
};

const getConversations = async (userId) => {
  return await messageModel.getConversationsForUser(userId);
};

const getMessages = async (userId1, userId2, limit) => {
  const otherUser = await User.findById(userId2);
  if (!otherUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return await messageModel.getConversation(userId1, userId2, limit);
};

const markAsRead = async (messageId, userId) => {
  const message = await messageModel.findMessageById(messageId);
  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  if (message.toUserId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only mark your own received messages as read');
  }

  return await messageModel.markMessageAsRead(messageId);
};

const markConversationAsRead = async (userId, otherUserId) => {
  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  return await messageModel.markConversationAsRead(otherUserId, userId);
};

module.exports = {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  markConversationAsRead,
};

