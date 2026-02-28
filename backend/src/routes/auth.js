const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const auth = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { parseRegister, parseLogin } = require('../validation/schemas');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
  });

router.post(
  '/register',
  validate(parseRegister),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new ApiError(409, 'Email already in use', 'EMAIL_IN_USE');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    const token = signToken(user._id.toString());
    return res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  })
);

router.post(
  '/login',
  validate(parseLogin),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(401, 'Invalid credentials', 'AUTH_INVALID');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new ApiError(401, 'Invalid credentials', 'AUTH_INVALID');
    }

    const token = signToken(user._id.toString());
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  })
);

router.get(
  '/me',
  auth,
  asyncHandler(async (req, res) => {
    return res.json({ id: req.user._id, name: req.user.name, email: req.user.email });
  })
);

module.exports = router;
