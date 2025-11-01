const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const mongoose = require('mongoose');

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection && mongoose.connection.readyState === 1;
};

const register = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Registration is not available - MongoDB not configured' 
    });
  }
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Login is not available - MongoDB not configured' 
    });
  }
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Logout is not available - MongoDB not configured' 
    });
  }
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Token refresh is not available - MongoDB not configured' 
    });
  }
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Password reset is not available - MongoDB not configured' 
    });
  }
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Password reset is not available - MongoDB not configured' 
    });
  }
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Email verification is not available - MongoDB not configured' 
    });
  }
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(httpStatus.NOT_IMPLEMENTED).send({ 
      message: 'Email verification is not available - MongoDB not configured' 
    });
  }
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
