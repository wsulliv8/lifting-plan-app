const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, userController.getCurrentUser);

router.get("/lifts", authMiddleware, userController.getUserLiftsData);

router.put("/", authMiddleware, userController.updateUser);

// Admin-only route to update user role
router.put("/:id/role", authMiddleware, adminMiddleware, userController.updateUserRole);

module.exports = router;
