const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

function notFound(req, _, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}

function errorHandler(err, req, res, _) {
  const base = {
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Internal server error',
    requestId: req.id,
  };

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json(base);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ ...base, code: 'DB_VALIDATION_ERROR' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ ...base, code: 'DUPLICATE_RESOURCE', message: 'Duplicate resource' });
  }

  console.error('[error]', err);
  return res.status(500).json(base);
}

module.exports = {
  notFound,
  errorHandler,
};
