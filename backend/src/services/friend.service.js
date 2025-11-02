const { friendModel, User } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

const sendFriendRequest = async (fromUserId, toUserId) => {
  if (fromUserId === toUserId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot send friend request to yourself');
  }

  const toUser = await User.findById(toUserId);
  if (!toUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const existingRequest = await friendModel.findFriendRequest(fromUserId, toUserId);
  if (existingRequest) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Friend request already exists');
  }

  const reverseRequest = await friendModel.findFriendRequest(toUserId, fromUserId);
  if (reverseRequest && reverseRequest.status === 'pending') {
    // Auto-accept if reverse request exists
    await friendModel.updateFriendRequestStatus(reverseRequest.id, 'accepted');
    await friendModel.createFriendship(fromUserId, toUserId);
    return {
      id: reverseRequest.id,
      fromUserId: reverseRequest.fromUserId,
      toUserId: reverseRequest.toUserId,
      status: 'accepted',
      createdAt: reverseRequest.createdAt,
      updatedAt: new Date().toISOString(),
    };
  }

  return await friendModel.createFriendRequest(fromUserId, toUserId);
};

const acceptFriendRequest = async (requestId, userId) => {
  const request = await friendModel.findFriendRequestById(requestId);
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Friend request not found');
  }

  if (request.toUserId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only accept requests sent to you');
  }

  if (request.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Friend request is not pending');
  }

  await friendModel.updateFriendRequestStatus(requestId, 'accepted');
  await friendModel.createFriendship(request.fromUserId, request.toUserId);

  return friendModel.findFriendRequestById(requestId);
};

const rejectFriendRequest = async (requestId, userId) => {
  const request = await friendModel.findFriendRequestById(requestId);
  if (!request) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Friend request not found');
  }

  if (request.toUserId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You can only reject requests sent to you');
  }

  return await friendModel.updateFriendRequestStatus(requestId, 'rejected');
};

const getFriends = async (userId) => {
  return await friendModel.getFriendsForUser(userId);
};

const getFriendRequests = async (userId) => {
  return await friendModel.getPendingFriendRequestsForUser(userId);
};

const getAllFriendRequests = async (userId) => {
  return await friendModel.getAllFriendRequestsForUser(userId);
};

const areFriends = async (userId1, userId2) => {
  const friendship = await friendModel.findFriendship(userId1, userId2);
  return !!friendship;
};

const getFriendRequestStatus = async (fromUserId, toUserId) => {
  // Check if already friends
  const friendship = await friendModel.findFriendship(fromUserId, toUserId);
  if (friendship) {
    return { status: 'friends', friendship };
  }

  // Check for outgoing request
  const outgoingRequest = await friendModel.findFriendRequest(fromUserId, toUserId);
  if (outgoingRequest) {
    return { status: 'request_sent', request: outgoingRequest };
  }

  // Check for incoming request
  const incomingRequest = await friendModel.findFriendRequest(toUserId, fromUserId);
  if (incomingRequest) {
    return { status: 'request_received', request: incomingRequest };
  }

  return { status: 'not_friends' };
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
  getAllFriendRequests,
  areFriends,
  getFriendRequestStatus,
};

