const express = require('express');
const auth = require('../../middlewares/auth');
const { friendController } = require('../../controllers');

const router = express.Router();

// Handle OPTIONS requests before auth middleware
router.options('/request', (req, res) => {
  console.log('🔍 OPTIONS /friends/request - Setting CORS headers');
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(204);
});

// Log all requests to this router (before auth)
router.use((req, res, next) => {
  console.log(`🛣️ Friend route matched: ${req.method} ${req.path}`);
  next();
});

console.log('🔧 Setting up auth middleware for friend routes');

router
  .route('/request')
  .post(auth(), (req, res, next) => {
    console.log('📮 POST /friends/request route handler called - BEFORE controller');
    console.log('📮 Request body:', req.body);
    console.log('📮 User:', req.user?.id);
    friendController.sendFriendRequest(req, res, next);
  });

router
  .route('/accept/:requestId')
  .post(auth(), friendController.acceptFriendRequest);

router
  .route('/reject/:requestId')
  .post(auth(), friendController.rejectFriendRequest);

router
  .route('/')
  .get(auth(), friendController.getFriends);

router
  .route('/requests')
  .get(auth(), friendController.getFriendRequests);

router
  .route('/requests/all')
  .get(auth(), friendController.getAllFriendRequests);

router
  .route('/check/:userId')
  .get(auth(), friendController.areFriends);

router
  .route('/status/:userId')
  .get(auth(), friendController.getFriendRequestStatus);

module.exports = router;

