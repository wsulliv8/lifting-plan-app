const rateLimit = require("express-rate-limit");

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per IP
  message: { error: "Too many requests, please try again later" },
});

module.exports = authRateLimiter;
