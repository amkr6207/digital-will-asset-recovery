function parsePositiveInt(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`Invalid positive integer value: ${value}`);
  }
  return num;
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parsePositiveInt(process.env.PORT, 5000),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'digital-will-api',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX: parsePositiveInt(process.env.RATE_LIMIT_MAX, 100),
  RECOVERY_EXPIRY_HOURS: parsePositiveInt(process.env.RECOVERY_EXPIRY_HOURS, 168),
};

if (!env.MONGO_URI) {
  throw new Error('MONGO_URI must be set');
}

if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

module.exports = env;
