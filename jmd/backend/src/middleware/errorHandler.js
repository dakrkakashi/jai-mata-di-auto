/**
 * Central Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}

module.exports = errorHandler;
