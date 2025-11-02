const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  console.log('🔐 verifyCallback called - err:', !!err, 'info:', !!info, 'user:', !!user);
  
  if (err || info || !user) {
    console.log('❌ verifyCallback failed - err:', err?.message, 'info:', info?.message, 'user:', user);
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  
  console.log('✅ verifyCallback success - user:', user.id, 'role:', user.role);
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      console.log('❌ Insufficient rights');
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
    }
  }

  console.log('✅ verifyCallback resolving');
  resolve();
};

const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    // Skip authentication for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') {
      return next();
    }
    
    console.log(`🔐 Auth middleware for ${req.method} ${req.path}`);
    console.log('🔐 Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    
    const authenticate = () =>
      new Promise((resolve, reject) => {
        const callback = verifyCallback(req, resolve, reject, requiredRights);
        passport.authenticate('jwt', { session: false }, callback)(req, res, next);
      });

    return authenticate()
      .then(() => {
        console.log('✅ Auth successful, user:', req.user?.id);
        next();
      })
      .catch((err) => {
        console.error('❌ Auth failed:', err.message || err);
        next(err);
      });
  };

module.exports = auth;
