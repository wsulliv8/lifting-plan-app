const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "24h",
    issuer: process.env.JWT_ISSUER || "lifting-app",
    audience: process.env.JWT_AUDIENCE || "lifting-app-users",
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: process.env.JWT_ISSUER || "lifting-app",
    audience: process.env.JWT_AUDIENCE || "lifting-app-users",
  });
};

const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Import stronger validation from security middleware
const {
  validateEmail,
  validatePassword,
  validateUsername,
} = require("../middleware/securityMiddleware");

module.exports = {
  signToken,
  verifyToken,
  generateSecureToken,
  validateEmail,
  validatePassword,
  validateUsername,
};
