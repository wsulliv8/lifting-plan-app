const { verifyToken } = require("../utils/authUtils");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No valid token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = verifyToken(token);

    // Remove debug logs in production
    if (process.env.NODE_ENV === "development") {
      console.log("Decoded token:", decoded);
      console.log("User ID from token:", decoded.userId);
      console.log("User role from token:", decoded.role);
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      isAdmin: decoded.role === "admin",
    };

    next();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log("Auth error:", error.message);
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    } else {
      return res.status(401).json({ error: "Authentication failed" });
    }
  }
};

module.exports = authMiddleware;
