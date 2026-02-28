const crypto = require('crypto');

const generateInviteToken = () => crypto.randomBytes(24).toString('hex');

module.exports = { generateInviteToken };
