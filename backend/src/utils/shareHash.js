const crypto = require('crypto');

function hashShare(share) {
  return crypto.createHash('sha256').update(share).digest('hex');
}

module.exports = {
  hashShare,
};
