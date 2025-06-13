const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debug line
    req.user = decoded; // Attach user ID to request
    console.log("User ID from token:", decoded.userId); // Debug line
    next();
  } catch (error) {
    console.log("Auth error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = authMiddleware;
