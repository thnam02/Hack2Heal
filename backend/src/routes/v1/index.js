const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const config = require('../../config/config');

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
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  // Conditionally load docs route if it exists
  try {
    const docsRoute = require('./docs.route');
    router.use('/docs', docsRoute);
  } catch (error) {
    // docs.route not available - skip it
  }
}

module.exports = router;
