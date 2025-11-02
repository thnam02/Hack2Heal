const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const sessionRoute = require('./session.route');
const statsRoute = require('./stats.route');
const friendRoute = require('./friend.route');
const messageRoute = require('./message.route');

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/sessions',
    route: sessionRoute,
  },
  {
    path: '/stats',
    route: statsRoute,
  },
  {
    path: '/friends',
    route: friendRoute,
  },
  {
    path: '/messages',
    route: messageRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
