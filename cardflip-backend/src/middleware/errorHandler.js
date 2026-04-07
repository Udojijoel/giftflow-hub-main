export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.code === 'P2002') { statusCode = 409; message = 'A record with this information already exists.'; }
  if (err.code === 'P2025') { statusCode = 404; message = 'Record not found.'; }
  if (err.name === 'MulterError') { statusCode = 400; message = err.message; }
  if (err.name === 'JsonWebTokenError') { statusCode = 401; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError') { statusCode = 401; message = 'Token expired.'; }

  if (process.env.NODE_ENV === 'development') console.error(err);

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
