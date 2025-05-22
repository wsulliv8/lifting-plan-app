const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, userController.getCurrentUser);

router.get("/lifts", authMiddleware, userController.getUserLiftsData);

module.exports = router;
