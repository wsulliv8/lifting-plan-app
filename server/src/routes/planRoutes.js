const express = require("express");
const planController = require("../controllers/planController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/plans
router.get("/", authMiddleware, planController.getPlans);

// GET /api/plans/:id
router.get("/:id", authMiddleware, planController.getPlanById);

// POST /api/plans
router.post("/", authMiddleware, planController.createPlan);

module.exports = router;
