const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing auth token', 'AUTH_REQUIRED'));
  }

  const token = header.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
    });
    const user = await User.findById(payload.sub);
    if (!user) {
      return next(new ApiError(401, 'Invalid token user', 'AUTH_INVALID'));
    }
    req.user = user;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token', 'AUTH_INVALID'));
  }
};

module.exports = auth;
