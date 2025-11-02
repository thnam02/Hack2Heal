const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { friendService } = require('../services');

const sendFriendRequest = catchAsync(async (req, res) => {
  console.log('📥 POST /friends/request received');
  console.log('Body:', req.body);
  console.log('User:', req.user?.id);
  
  const fromUserId = req.user.id;
  const { toUserId } = req.body;
  
  if (!toUserId) {
    return res.status(httpStatus.BAD_REQUEST).send({ message: 'toUserId is required' });
  }
  
  console.log('Sending request from', fromUserId, 'to', toUserId);
  
  const friendRequest = await friendService.sendFriendRequest(fromUserId, toUserId);
  console.log('✅ Friend request created:', friendRequest);
  res.status(httpStatus.CREATED).send(friendRequest);
});

const acceptFriendRequest = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const requestId = parseInt(req.params.requestId);
  
  const friendRequest = await friendService.acceptFriendRequest(requestId, userId);
  res.send(friendRequest);
});

const rejectFriendRequest = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const requestId = parseInt(req.params.requestId);
  
  await friendService.rejectFriendRequest(requestId, userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const getFriends = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const friends = await friendService.getFriends(userId);
  res.send(friends);
});

const getFriendRequests = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const requests = await friendService.getFriendRequests(userId);
  res.send(requests);
});

const getAllFriendRequests = catchAsync(async (req, res) => {
  const userId = req.user.id;
  
  const allRequests = await friendService.getAllFriendRequests(userId);
  res.send(allRequests);
});

const areFriends = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const otherUserId = parseInt(req.params.userId);
  
  const friends = await friendService.areFriends(userId, otherUserId);
  res.send(friends);
});

const getFriendRequestStatus = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const otherUserId = parseInt(req.params.userId);
  
  const status = await friendService.getFriendRequestStatus(userId, otherUserId);
  res.send(status);
});

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

