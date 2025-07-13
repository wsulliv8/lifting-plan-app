const express = require("express");
const router = express.Router();
const {
  getWeightComparison,
  calculateStrengthPercentile,
} = require("../services/strengthStats");

// Get weight comparison for total volume
router.get("/weight-comparison", (req, res) => {
  const weight = parseInt(req.query.weight);
  if (isNaN(weight)) {
    return res.status(400).json({ error: "Invalid weight parameter" });
  }

  const comparison = getWeightComparison(weight);
  if (!comparison) {
    return res
      .status(404)
      .json({ error: "No comparison found for this weight" });
  }

  res.json(comparison);
});

// Calculate strength percentile
router.get("/strength-percentile", (req, res) => {
  const { lift, weight, gender, ageRange } = req.query;

  if (!lift || !weight || isNaN(parseInt(weight))) {
    return res.status(400).json({ error: "Missing or invalid parameters" });
  }

  const percentile = calculateStrengthPercentile(
    lift,
    parseInt(weight),
    gender || "male",
    ageRange || "18-29"
  );

  if (percentile === null) {
    return res
      .status(404)
      .json({ error: "No statistics found for these parameters" });
  }

  res.json({ percentile });
});

module.exports = router;
