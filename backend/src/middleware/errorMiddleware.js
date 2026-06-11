import logger from '../utils/logger.js';

export const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong';
  let details = error.details || null;

  if (error.name === 'CastError') {
    message = 'Invalid resource id';
  }

  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue || {})[0];
    message = `${duplicateField} already exists`;
  }

  if (error.name === 'ValidationError') {
    message = 'Validation failed';
    details = Object.values(error.errors).map((item) => item.message);
  }

  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'Image must be 10MB or smaller';
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected upload field. Please upload using the images field.';
    } else {
      message = 'Image upload failed';
    }
  }

  if (error.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    message = 'Authentication token has expired';
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    message = 'Invalid JSON payload';
  }

  logger.error(message, {
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    details,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(req.requestId ? { requestId: req.requestId } : {}),
    ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
  });
};
