const adminMiddleware = (req, res, next) => {
  // This middleware should be used after authMiddleware
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!req.user.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
};

module.exports = adminMiddleware; 