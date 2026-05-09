const test = require('node:test');
const assert = require('node:assert/strict');

const { hashShare } = require('../src/utils/shareHash');
const { parseVault, parseSubmitShare } = require('../src/validation/schemas');

test('hashShare returns a stable sha256 hex digest', () => {
  assert.equal(
    hashShare('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
});

test('parseVault accepts one share hash per friend', () => {
  const payload = parseVault({
    encryptedVault: 'a'.repeat(40),
    iv: 'b'.repeat(12),
    salt: 'c'.repeat(16),
    threshold: 3,
    friends: Array.from({ length: 5 }, (_, index) => ({
      name: `Friend ${index + 1}`,
      email: `friend${index + 1}@example.com`,
    })),
    shareHashes: Array.from({ length: 5 }, () => 'd'.repeat(64)),
    checkInIntervalDays: 30,
    recoveryAccessCode: 'recovery-code',
  });

  assert.equal(payload.shareHashes.length, 5);
});

test('parseVault rejects missing share hashes', () => {
  assert.throws(
    () =>
      parseVault({
        encryptedVault: 'a'.repeat(40),
        iv: 'b'.repeat(12),
        salt: 'c'.repeat(16),
        threshold: 3,
        friends: Array.from({ length: 5 }, (_, index) => ({
          name: `Friend ${index + 1}`,
          email: `friend${index + 1}@example.com`,
        })),
        shareHashes: ['d'.repeat(64)],
        checkInIntervalDays: 30,
        recoveryAccessCode: 'recovery-code',
      }),
    /shareHashes must contain exactly 5 entries/
  );
});

test('parseSubmitShare still validates invite token shape', () => {
  const payload = parseSubmitShare({
    inviteToken: 'a'.repeat(48),
    share: 'x'.repeat(16),
  });

  assert.equal(payload.inviteToken.length, 48);
});
