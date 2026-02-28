const express = require('express');
const bcrypt = require('bcryptjs');

const auth = require('../middleware/auth');
const Vault = require('../models/Vault');
const { generateInviteToken } = require('../utils/token');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { parseVault } = require('../validation/schemas');

const router = express.Router();

router.post(
  '/',
  auth,
  validate(parseVault),
  asyncHandler(async (req, res) => {
    const {
      encryptedVault,
      iv,
      salt,
      threshold = 3,
      friends,
      checkInIntervalDays = 30,
      recoveryAccessCode,
    } = req.body;

    const friendRecords = friends.map((friend) => ({
      name: friend.name,
      email: friend.email,
      inviteToken: generateInviteToken(),
    }));

    const recoveryAccessHash = await bcrypt.hash(recoveryAccessCode, 12);

    const payload = {
      owner: req.user._id,
      encryptedVault,
      iv,
      salt,
      recoveryAccessHash,
      friends: friendRecords,
      threshold,
      submittedShares: [],
      recoveryStartedAt: null,
      recoveryExpiresAt: null,
      recoveryUnlockedAt: null,
    };

    const vault = await Vault.findOneAndUpdate({ owner: req.user._id }, payload, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });

    req.user.checkInIntervalDays = checkInIntervalDays;
    await req.user.save();

    return res.status(201).json({
      message: 'Vault saved',
      threshold: vault.threshold,
      contacts: vault.friends.map((f) => ({ name: f.name, email: f.email, inviteToken: f.inviteToken })),
    });
  })
);

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const vault = await Vault.findOne({ owner: req.user._id }).select('-submittedShares.share -recoveryAccessHash');
    if (!vault) {
      return res.status(404).json({ code: 'VAULT_NOT_FOUND', message: 'Vault not found' });
    }

    return res.json({
      id: vault._id,
      threshold: vault.threshold,
      friends: vault.friends.map((f) => ({ name: f.name, email: f.email, inviteToken: f.inviteToken })),
      recoveryStartedAt: vault.recoveryStartedAt,
      recoveryExpiresAt: vault.recoveryExpiresAt,
      recoveryUnlockedAt: vault.recoveryUnlockedAt,
      submittedSharesCount: vault.submittedShares.length,
    });
  })
);

module.exports = router;
