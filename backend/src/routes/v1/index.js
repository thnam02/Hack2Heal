const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const sessionRoute = require('./session.route');
const statsRoute = require('./stats.route');

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
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
