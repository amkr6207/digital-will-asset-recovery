const ApiError = require('../utils/ApiError');

const buckets = new Map();

function cleanupExpired(now, windowMs) {
  for (const [key, bucket] of buckets.entries()) {
    if (now - bucket.windowStart > windowMs) {
      buckets.delete(key);
    }
  }
}

function rateLimit(windowMs, max) {
  return (req, _, next) => {
    const now = Date.now();
    const key = req.ip || req.connection.remoteAddress || 'unknown';

    if (Math.random() < 0.01) {
      cleanupExpired(now, windowMs);
    }

    let bucket = buckets.get(key);
    if (!bucket || now - bucket.windowStart > windowMs) {
      bucket = { count: 0, windowStart: now };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    if (bucket.count > max) {
      return next(new ApiError(429, 'Too many requests, retry later.', 'RATE_LIMIT_EXCEEDED'));
    }

    return next();
  };
}

module.exports = rateLimit;
