const Vault = require('../models/Vault');

const getDeadline = (lastCheckInAt, checkInIntervalDays) => {
  const ms = checkInIntervalDays * 24 * 60 * 60 * 1000;
  return new Date(lastCheckInAt.getTime() + ms);
};

const isEligibleForRecovery = (user) => {
  const deadline = getDeadline(user.lastCheckInAt, user.checkInIntervalDays);
  return new Date() > deadline;
};

const getStatus = async (user) => {
  const deadline = getDeadline(user.lastCheckInAt, user.checkInIntervalDays);
  const eligible = isEligibleForRecovery(user);
  const vault = await Vault.findOne({ owner: user._id });

  return {
    lastCheckInAt: user.lastCheckInAt,
    nextCheckInDeadline: deadline,
    checkInIntervalDays: user.checkInIntervalDays,
    eligibleForRecovery: eligible,
    recoveryStarted: Boolean(vault?.recoveryStartedAt),
    recoveryExpiresAt: vault?.recoveryExpiresAt || null,
    recoveryUnlocked: Boolean(vault?.recoveryUnlockedAt),
    submittedSharesCount: vault?.submittedShares?.length || 0,
    threshold: vault?.threshold || 3,
  };
};

module.exports = {
  getDeadline,
  isEligibleForRecovery,
  getStatus,
};
