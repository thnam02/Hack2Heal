const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;

// Only connect to MongoDB if MONGODB_URL is provided
if (config.mongoose.url) {
  const mongoose = require('mongoose');
  mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info('Connected to MongoDB');
    startServer();
  }).catch((err) => {
    logger.error('MongoDB connection error:', err);
    logger.warn('Starting server without MongoDB - authentication features will not work');
    startServer();
  });
} else {
  logger.warn('MongoDB not configured - starting server without database');
  logger.warn('Authentication endpoints will return 501 (Not Implemented)');
  startServer();
}

function startServer() {
  server = app.listen(config.port, () => {
    logger.info(`Listening to port ${config.port}`);
  });
}

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
