const ApiError = require('../utils/ApiError');

const validate = (schemaFn, source = 'body') => (req, _, next) => {
  try {
    const parsed = schemaFn(req[source]);
    req[source] = parsed;
    return next();
  } catch (error) {
    if (error instanceof ApiError) {
      return next(error);
    }
    return next(new ApiError(400, error.message || 'Validation error', 'VALIDATION_ERROR'));
  }
};

module.exports = validate;
