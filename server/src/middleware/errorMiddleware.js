const errorMiddleware = (err, req, res, next) => {
  console.error(`Error: ${err.message}`, err.stack);

  const statusCode = err.cause?.status || 500;
  const message = statusCode === 500 ? "Something went wrong!" : err.message;

  res.status(statusCode).json({ error: message });
};

module.exports = errorMiddleware;
