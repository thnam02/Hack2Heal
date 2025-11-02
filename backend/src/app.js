const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json({ limit: '10mb' }));

// parse urlencoded request body
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// enable cors FIRST, before authentication
const corsOptions = {
  origin: (origin, callback) => {
    // Allow all origins in development
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// gzip compression, but bypass SSE streams to avoid buffering
app.use(
  compression({
    filter: (req, res) => {
      const acceptHeader = req.headers.accept || '';
      if (acceptHeader.includes('text/event-stream')) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Debug middleware to log all requests
if (config.env !== 'production') {
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS' || req.method === 'POST') {
      console.log(`🔍 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
    }
    next();
  });
}

// jwt authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  // Ignore common non-API requests (browser auto-requests, etc.)
  if (req.path === '/favicon.ico' || 
      req.path.startsWith('/_next/') ||
      req.path === '/robots.txt' ||
      req.path.startsWith('/static/')) {
    return res.status(404).end();
  }
  
  // Only log API route 404s
  if (req.path.startsWith('/v1/')) {
    next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
  } else {
    // Silently ignore non-API routes
    res.status(404).end();
  }
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
