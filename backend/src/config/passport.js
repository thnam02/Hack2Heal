const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    // Debug logs removed for production
    // console.log('🔐 jwtVerify called - payload:', { sub: payload.sub, type: payload.type });

    if (payload.type !== tokenTypes.ACCESS) {
      // console.log('❌ Invalid token type:', payload.type);
      throw new Error('Invalid token type');
    }

    const user = await User.findById(payload.sub);
    // console.log('🔐 User lookup - found:', !!user, 'userId:', payload.sub);

    if (!user) {
      // console.log('❌ User not found');
      return done(null, false);
    }

    // console.log('✅ jwtVerify success - user:', user.id);
    return done(null, user);
  } catch (error) {
    // console.error('❌ jwtVerify error:', error.message || error);
    return done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
