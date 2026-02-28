const express = require('express');
const bcrypt = require('bcryptjs');

const auth = require('../middleware/auth');
const User = require('../models/User');
const Vault = require('../models/Vault');
const asyncHandler = require('../middleware/asyncHandler');
const validate = require('../middleware/validate');
const { parseRecoveryStart, parseSubmitShare, parseUnlock } = require('../validation/schemas');
const { getStatus, isEligibleForRecovery } = require('../services/deadmanService');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const router = express.Router();

const isRecoveryExpired = (vault) => Boolean(vault.recoveryExpiresAt && new Date() > vault.recoveryExpiresAt);

router.post(
  '/check-in',
  auth,
  asyncHandler(async (req, res) => {
    req.user.lastCheckInAt = new Date();
    await req.user.save();

    const vault = await Vault.findOne({ owner: req.user._id });
    if (vault) {
      vault.recoveryStartedAt = null;
      vault.recoveryExpiresAt = null;
      vault.recoveryUnlockedAt = null;
      vault.submittedShares = [];
      await vault.save();
    }

    return res.json({ message: 'Check-in successful', lastCheckInAt: req.user.lastCheckInAt });
  })
);

router.get(
  '/status',
  auth,
  asyncHandler(async (req, res) => {
    const status = await getStatus(req.user);
    return res.json(status);
  })
);

router.post(
  '/recovery/start',
  validate(parseRecoveryStart),
  asyncHandler(async (req, res) => {
    const { ownerEmail, recoveryAccessCode } = req.body;

    const user = await User.findOne({ email: ownerEmail });
    if (!user) {
      throw new ApiError(404, 'Owner not found', 'OWNER_NOT_FOUND');
    }

    if (!isEligibleForRecovery(user)) {
      throw new ApiError(403, 'Owner is still active, recovery not allowed yet', 'RECOVERY_NOT_ALLOWED');
    }

    const vault = await Vault.findOne({ owner: user._id });
    if (!vault) {
      throw new ApiError(404, 'Vault not found for owner', 'VAULT_NOT_FOUND');
    }

    const isAccessCodeValid = await bcrypt.compare(recoveryAccessCode, vault.recoveryAccessHash);
    if (!isAccessCodeValid) {
      throw new ApiError(403, 'Recovery access code is invalid', 'RECOVERY_CODE_INVALID');
    }

    if (!vault.recoveryStartedAt || isRecoveryExpired(vault)) {
      const now = new Date();
      const expires = new Date(now.getTime() + env.RECOVERY_EXPIRY_HOURS * 60 * 60 * 1000);
      vault.recoveryStartedAt = now;
      vault.recoveryExpiresAt = expires;
      vault.recoveryUnlockedAt = null;
      vault.submittedShares = [];
      await vault.save();
    }

    return res.json({
      message: 'Recovery started. Share invite tokens with trusted friends.',
      threshold: vault.threshold,
      recoveryExpiresAt: vault.recoveryExpiresAt,
      friendInvites: vault.friends.map((f) => ({ name: f.name, email: f.email, inviteToken: f.inviteToken })),
    });
  })
);

router.post(
  '/recovery/submit-share',
  validate(parseSubmitShare),
  asyncHandler(async (req, res) => {
    const { inviteToken, share } = req.body;

    const vault = await Vault.findOne({ 'friends.inviteToken': inviteToken });
    if (!vault) {
      throw new ApiError(404, 'Invalid invite token', 'INVITE_INVALID');
    }

    if (!vault.recoveryStartedAt) {
      throw new ApiError(403, 'Recovery has not started', 'RECOVERY_NOT_STARTED');
    }

    if (isRecoveryExpired(vault)) {
      throw new ApiError(403, 'Recovery session has expired', 'RECOVERY_EXPIRED');
    }

    const friend = vault.friends.find((f) => f.inviteToken === inviteToken);
    if (!friend) {
      throw new ApiError(404, 'Invalid invite token', 'INVITE_INVALID');
    }

    const alreadySubmitted = vault.submittedShares.some((s) => s.inviteToken === inviteToken);
    if (alreadySubmitted) {
      throw new ApiError(409, 'Share already submitted for this token', 'SHARE_ALREADY_SUBMITTED');
    }

    vault.submittedShares.push({
      inviteToken,
      friendName: friend.name,
      friendEmail: friend.email,
      share,
    });

    if (vault.submittedShares.length >= vault.threshold && !vault.recoveryUnlockedAt) {
      vault.recoveryUnlockedAt = new Date();
    }

    await vault.save();

    return res.json({
      message: 'Share accepted',
      submittedSharesCount: vault.submittedShares.length,
      threshold: vault.threshold,
      unlocked: Boolean(vault.recoveryUnlockedAt),
      recoveryExpiresAt: vault.recoveryExpiresAt,
    });
  })
);

router.post(
  '/recovery/unlock',
  validate(parseUnlock),
  asyncHandler(async (req, res) => {
    const { ownerEmail, recoveryAccessCode } = req.body;

    const user = await User.findOne({ email: ownerEmail });
    if (!user) {
      throw new ApiError(404, 'Owner not found', 'OWNER_NOT_FOUND');
    }

    const vault = await Vault.findOne({ owner: user._id });
    if (!vault) {
      throw new ApiError(404, 'Vault not found', 'VAULT_NOT_FOUND');
    }

    if (!vault.recoveryStartedAt) {
      throw new ApiError(403, 'Recovery has not started', 'RECOVERY_NOT_STARTED');
    }

    if (isRecoveryExpired(vault)) {
      throw new ApiError(403, 'Recovery session has expired', 'RECOVERY_EXPIRED');
    }

    const isAccessCodeValid = await bcrypt.compare(recoveryAccessCode, vault.recoveryAccessHash);
    if (!isAccessCodeValid) {
      throw new ApiError(403, 'Recovery access code is invalid', 'RECOVERY_CODE_INVALID');
    }

    if (!vault.recoveryUnlockedAt) {
      throw new ApiError(403, 'Not enough shares yet', 'THRESHOLD_NOT_MET');
    }

    return res.json({
      owner: { name: user.name, email: user.email },
      encryptedVault: vault.encryptedVault,
      iv: vault.iv,
      salt: vault.salt,
      submittedShares: vault.submittedShares.map((s) => ({
        friendName: s.friendName,
        friendEmail: s.friendEmail,
        share: s.share,
      })),
      recoveryExpiresAt: vault.recoveryExpiresAt,
    });
  })
);

module.exports = router;
