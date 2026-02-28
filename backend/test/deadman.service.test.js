const test = require('node:test');
const assert = require('node:assert/strict');

const { getDeadline, isEligibleForRecovery } = require('../src/services/deadmanService');

test('getDeadline returns check-in date + interval', () => {
  const lastCheckInAt = new Date('2026-01-01T00:00:00.000Z');
  const deadline = getDeadline(lastCheckInAt, 30);
  assert.equal(deadline.toISOString(), '2026-01-31T00:00:00.000Z');
});

test('isEligibleForRecovery returns false before deadline', () => {
  const user = {
    lastCheckInAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    checkInIntervalDays: 30,
  };

  assert.equal(isEligibleForRecovery(user), false);
});

test('isEligibleForRecovery returns true after deadline', () => {
  const user = {
    lastCheckInAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    checkInIntervalDays: 30,
  };

  assert.equal(isEligibleForRecovery(user), true);
});
