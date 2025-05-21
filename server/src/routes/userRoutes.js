const express = require("express");
const userController = require("../controllers/userController");
const authController = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authController, userController.getUserLiftsData);

module.exports = router;
