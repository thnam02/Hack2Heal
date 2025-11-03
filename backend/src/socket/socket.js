const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { friendService } = require('../services');
const { messageService } = require('../services');
const { friendModel } = require('../models');

let io;

const initializeSocket = (server) => {
  // FRONTEND_URL is required for production
  const frontendUrl = process.env.FRONTEND_URL;

  // Only allow localhost fallback in development
  if (!frontendUrl && process.env.NODE_ENV !== 'development') {
    throw new Error('FRONTEND_URL environment variable is required for production deployment.');
  }

  io = new Server(server, {
    cors: {
      origin: frontendUrl || 'http://localhost:3001', // localhost only for local dev
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, config.jwt.secret);
      // eslint-disable-next-line no-param-reassign
      socket.userId = decoded.sub;
      // eslint-disable-next-line no-param-reassign
      socket.user = decoded;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Debug log removed for production
    // console.log(`✅ User ${socket.userId} connected`);

    // Join user's own room for direct messaging
    socket.join(`user_${socket.userId}`);

    // ========== LIVE SESSION ==========

    // Join session room
    socket.on('session:join', (data) => {
      const { sessionId } = data;
      if (sessionId) {
        socket.join(`session_${sessionId}`);
      }
    });

    // Leave session room
    socket.on('session:leave', (data) => {
      const { sessionId } = data;
      if (sessionId) {
        socket.leave(`session_${sessionId}`);
      }
    });

    // ========== FRIEND REQUESTS ==========

    // Send friend request
    socket.on('friend:send_request', async (data) => {
      try {
        const { toUserId } = data;
        const fromUserId = socket.userId;

        if (!toUserId) {
          socket.emit('friend:error', { message: 'toUserId is required' });
          return;
        }

        const friendRequest = await friendService.sendFriendRequest(fromUserId, toUserId);

        // Notify sender
        socket.emit('friend:request_sent', friendRequest);

        // Notify recipient
        io.to(`user_${toUserId}`).emit('friend:request_received', friendRequest);

        // Update both users' friend request lists
        const senderRequests = await friendService.getAllFriendRequests(fromUserId);
        const receiverRequests = await friendService.getAllFriendRequests(toUserId);

        socket.emit('friend:requests_updated', senderRequests);
        io.to(`user_${toUserId}`).emit('friend:requests_updated', receiverRequests);
      } catch (error) {
        // console.error('Friend request error:', error);
        socket.emit('friend:error', { message: error.message || 'Failed to send friend request' });
      }
    });

    // Accept friend request
    socket.on('friend:accept_request', async (data) => {
      try {
        const { requestId } = data;
        const { userId } = socket;

        // Get the friend request first to know both users
        const request = await friendModel.findFriendRequestById(requestId);

        if (!request) {
          socket.emit('friend:error', { message: 'Friend request not found' });
          return;
        }

        const { fromUserId } = request;
        const { toUserId } = request;

        const friendRequest = await friendService.acceptFriendRequest(requestId, userId);

        // Notify both users with the accepted friend request
        socket.emit('friend:request_accepted', friendRequest);
        io.to(`user_${fromUserId}`).emit('friend:request_accepted', friendRequest);

        // Update both users' friend lists and requests
        const senderRequests = await friendService.getAllFriendRequests(fromUserId);
        const receiverRequests = await friendService.getAllFriendRequests(toUserId);

        io.to(`user_${fromUserId}`).emit('friend:requests_updated', senderRequests);
        io.to(`user_${toUserId}`).emit('friend:requests_updated', receiverRequests);

        // Update conversations for both users
        try {
          const senderConversations = await messageService.getConversations(fromUserId);
          const receiverConversations = await messageService.getConversations(toUserId);

          io.to(`user_${fromUserId}`).emit('message:conversations_updated', senderConversations);
          io.to(`user_${toUserId}`).emit('message:conversations_updated', receiverConversations);
        } catch (err) {
          // console.error('Error updating conversations:', err);
        }
      } catch (error) {
        // console.error('Accept friend request error:', error);
        socket.emit('friend:error', { message: error.message || 'Failed to accept friend request' });
      }
    });

    // Reject friend request
    socket.on('friend:reject_request', async (data) => {
      try {
        const { requestId } = data;
        const { userId } = socket;

        await friendService.rejectFriendRequest(requestId, userId);

        socket.emit('friend:request_rejected', { requestId });

        // Refresh requests
        const requests = await friendService.getAllFriendRequests(userId);
        socket.emit('friend:requests_updated', requests);
      } catch (error) {
        // console.error('Reject friend request error:', error);
        socket.emit('friend:error', { message: error.message || 'Failed to reject friend request' });
      }
    });

    // Get friend requests
    socket.on('friend:get_requests', async () => {
      try {
        const { userId } = socket;
        const requests = await friendService.getAllFriendRequests(userId);
        socket.emit('friend:requests', requests);
      } catch (error) {
        // console.error('Get friend requests error:', error);
        socket.emit('friend:error', { message: error.message || 'Failed to get friend requests' });
      }
    });

    // Get friends list
    socket.on('friend:get_friends', async () => {
      try {
        const { userId } = socket;
        const friends = await friendService.getFriends(userId);
        socket.emit('friend:friends', friends);
      } catch (error) {
        // console.error('Get friends error:', error);
        socket.emit('friend:error', { message: error.message || 'Failed to get friends' });
      }
    });

    // Check friendship status
    socket.on('friend:check_status', async (data) => {
      try {
        const { toUserId } = data;
        const fromUserId = socket.userId;

        const status = await friendService.getFriendRequestStatus(fromUserId, toUserId);
        socket.emit('friend:status', { toUserId, ...status });
      } catch (error) {
        // console.error('Check friend status error:', error);
        socket.emit('friend:error', { message: error.message || 'Failed to check status' });
      }
    });

    // ========== MESSAGES ==========

    // Send message
    socket.on('message:send', async (data) => {
      try {
        const { toUserId, content } = data;
        const fromUserId = socket.userId;

        if (!toUserId || !content) {
          socket.emit('message:error', { message: 'toUserId and content are required' });
          return;
        }

        const message = await messageService.sendMessage(fromUserId, toUserId, content);

        // Send to sender
        socket.emit('message:sent', message);

        // Send to recipient (if online)
        io.to(`user_${toUserId}`).emit('message:received', message);

        // Update conversations for both users
        try {
          const senderConversations = await messageService.getConversations(fromUserId);
          const receiverConversations = await messageService.getConversations(toUserId);

          socket.emit('message:conversations_updated', senderConversations);
          io.to(`user_${toUserId}`).emit('message:conversations_updated', receiverConversations);
        } catch (err) {
          // console.error('Error updating conversations:', err);
        }
      } catch (error) {
        // console.error('Send message error:', error);
        socket.emit('message:error', { message: error.message || 'Failed to send message' });
      }
    });

    // Get conversations
    socket.on('message:get_conversations', async () => {
      try {
        const { userId } = socket;
        const conversations = await messageService.getConversations(userId);
        socket.emit('message:conversations', conversations);
      } catch (error) {
        // console.error('Get conversations error:', error);
        socket.emit('message:error', { message: error.message || 'Failed to get conversations' });
      }
    });

    // Get messages with a user
    socket.on('message:get_messages', async (data) => {
      try {
        const { withUserId, limit = 50 } = data;
        const { userId } = socket;

        const messages = await messageService.getMessages(userId, withUserId, limit);
        socket.emit('message:messages', { withUserId, messages });
      } catch (error) {
        // console.error('Get messages error:', error);
        socket.emit('message:error', { message: error.message || 'Failed to get messages' });
      }
    });

    // Mark message as read
    socket.on('message:mark_read', async (data) => {
      try {
        const { messageId } = data;
        const { userId } = socket;

        await messageService.markAsRead(messageId, userId);

        socket.emit('message:read', { messageId });
      } catch (error) {
        // console.error('Mark message read error:', error);
        socket.emit('message:error', { message: error.message || 'Failed to mark message as read' });
      }
    });

    // Mark conversation as read
    socket.on('message:mark_conversation_read', async (data) => {
      try {
        const { withUserId } = data;
        const { userId } = socket;

        await messageService.markConversationAsRead(userId, withUserId);

        socket.emit('message:conversation_read', { withUserId });

        // DON'T emit conversations_updated here to prevent infinite loop
        // Frontend will update unread count via real-time message events or when conversations are refreshed
        // Only emit if there was an actual change (unread count decreased)
        // const conversations = await messageService.getConversations(userId);
        // socket.emit('message:conversations_updated', conversations);
      } catch (error) {
        // console.error('Mark conversation read error:', error);
        socket.emit('message:error', { message: error.message || 'Failed to mark conversation as read' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      // console.log(`❌ User ${socket.userId} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
