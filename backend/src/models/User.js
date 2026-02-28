const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    lastCheckInAt: {
      type: Date,
      default: Date.now,
    },
    checkInIntervalDays: {
      type: Number,
      default: 30,
      min: 1,
      max: 365,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
