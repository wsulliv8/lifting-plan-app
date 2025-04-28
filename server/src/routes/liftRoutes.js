const express = require("express");
const liftController = require("../controllers/liftController");
const authController = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authController, liftController.createLift);

module.exports = router;
