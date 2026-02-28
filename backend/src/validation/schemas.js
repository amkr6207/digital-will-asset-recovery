const ApiError = require('../utils/ApiError');

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const ensureString = (value, field, min = 1, max = 10000) => {
  if (typeof value !== 'string') {
    throw new ApiError(400, `${field} must be a string`, 'VALIDATION_ERROR');
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new ApiError(400, `${field} length must be between ${min} and ${max}`, 'VALIDATION_ERROR');
  }
  return trimmed;
};

const ensureEmail = (value, field) => {
  const email = ensureString(value, field, 5, 254).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ApiError(400, `${field} must be a valid email`, 'VALIDATION_ERROR');
  }
  return email;
};

const ensureInt = (value, field, min, max, fallback) => {
  const num = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new ApiError(400, `${field} must be an integer between ${min} and ${max}`, 'VALIDATION_ERROR');
  }
  return num;
};

const parseRegister = (payload) => {
  if (!isObject(payload)) {
    throw new ApiError(400, 'Payload must be an object', 'VALIDATION_ERROR');
  }

  return {
    name: ensureString(payload.name, 'name', 2, 80),
    email: ensureEmail(payload.email, 'email'),
    password: ensureString(payload.password, 'password', 10, 200),
  };
};

const parseLogin = (payload) => {
  if (!isObject(payload)) {
    throw new ApiError(400, 'Payload must be an object', 'VALIDATION_ERROR');
  }

  return {
    email: ensureEmail(payload.email, 'email'),
    password: ensureString(payload.password, 'password', 1, 200),
  };
};

const parseFriends = (friends) => {
  if (!Array.isArray(friends) || friends.length !== 5) {
    throw new ApiError(400, 'friends must contain exactly 5 entries', 'VALIDATION_ERROR');
  }

  const seenEmails = new Set();
  return friends.map((friend, index) => {
    if (!isObject(friend)) {
      throw new ApiError(400, `friends[${index}] must be an object`, 'VALIDATION_ERROR');
    }

    const email = ensureEmail(friend.email, `friends[${index}].email`);
    if (seenEmails.has(email)) {
      throw new ApiError(400, 'friend emails must be unique', 'VALIDATION_ERROR');
    }
    seenEmails.add(email);

    return {
      name: ensureString(friend.name, `friends[${index}].name`, 2, 80),
      email,
    };
  });
};

const parseVault = (payload) => {
  if (!isObject(payload)) {
    throw new ApiError(400, 'Payload must be an object', 'VALIDATION_ERROR');
  }

  return {
    encryptedVault: ensureString(payload.encryptedVault, 'encryptedVault', 32, 50000),
    iv: ensureString(payload.iv, 'iv', 8, 200),
    salt: ensureString(payload.salt, 'salt', 8, 200),
    threshold: ensureInt(payload.threshold, 'threshold', 2, 5, 3),
    friends: parseFriends(payload.friends),
    checkInIntervalDays: ensureInt(payload.checkInIntervalDays, 'checkInIntervalDays', 1, 365, 30),
    recoveryAccessCode: ensureString(payload.recoveryAccessCode, 'recoveryAccessCode', 8, 128),
  };
};

const parseRecoveryStart = (payload) => {
  if (!isObject(payload)) {
    throw new ApiError(400, 'Payload must be an object', 'VALIDATION_ERROR');
  }

  return {
    ownerEmail: ensureEmail(payload.ownerEmail, 'ownerEmail'),
    recoveryAccessCode: ensureString(payload.recoveryAccessCode, 'recoveryAccessCode', 8, 128),
  };
};

const parseSubmitShare = (payload) => {
  if (!isObject(payload)) {
    throw new ApiError(400, 'Payload must be an object', 'VALIDATION_ERROR');
  }

  const inviteToken = ensureString(payload.inviteToken, 'inviteToken', 48, 48);
  if (!/^[a-f0-9]{48}$/.test(inviteToken)) {
    throw new ApiError(400, 'inviteToken must be a valid 48-char hex string', 'VALIDATION_ERROR');
  }

  return {
    inviteToken,
    share: ensureString(payload.share, 'share', 16, 10000),
  };
};

const parseUnlock = (payload) => {
  if (!isObject(payload)) {
    throw new ApiError(400, 'Payload must be an object', 'VALIDATION_ERROR');
  }

  return {
    ownerEmail: ensureEmail(payload.ownerEmail, 'ownerEmail'),
    recoveryAccessCode: ensureString(payload.recoveryAccessCode, 'recoveryAccessCode', 8, 128),
  };
};

module.exports = {
  parseRegister,
  parseLogin,
  parseVault,
  parseRecoveryStart,
  parseSubmitShare,
  parseUnlock,
};
