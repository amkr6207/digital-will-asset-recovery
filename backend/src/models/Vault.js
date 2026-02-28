const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    inviteToken: { type: String, required: true, unique: true },
  },
  { _id: false }
);

const submittedShareSchema = new mongoose.Schema(
  {
    inviteToken: { type: String, required: true },
    friendName: { type: String, required: true },
    friendEmail: { type: String, required: true },
    share: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const vaultSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    encryptedVault: {
      type: String,
      required: true,
    },
    iv: {
      type: String,
      required: true,
    },
    salt: {
      type: String,
      required: true,
    },
    recoveryAccessHash: {
      type: String,
      required: true,
    },
    friends: {
      type: [contactSchema],
      validate: {
        validator: (value) => value.length === 5,
        message: 'Exactly 5 trusted contacts are required',
      },
      required: true,
    },
    threshold: {
      type: Number,
      default: 3,
      min: 2,
      max: 5,
    },
    recoveryStartedAt: Date,
    recoveryExpiresAt: Date,
    submittedShares: {
      type: [submittedShareSchema],
      default: [],
    },
    recoveryUnlockedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vault', vaultSchema);
