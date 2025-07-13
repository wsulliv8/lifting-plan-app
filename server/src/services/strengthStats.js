const strengthStats = require("../../prisma/data/strengthStats");
const weightComparisons = require("../../prisma/data/weightComparisons");

function interpolatePercentile(value, stats) {
  const percentiles = stats.percentiles;
  const percentileValues = Object.entries(percentiles)
    .map(([p, v]) => ({
      percentile: parseInt(p),
      value: v,
    }))
    .sort((a, b) => a.value - b.value);

  // If value is less than lowest percentile
  if (value < percentileValues[0].value) {
    return percentileValues[0].percentile;
  }

  // If value is greater than highest percentile
  if (value > percentileValues[percentileValues.length - 1].value) {
    return percentileValues[percentileValues.length - 1].percentile;
  }

  // Find the two percentiles to interpolate between
  for (let i = 0; i < percentileValues.length - 1; i++) {
    const lower = percentileValues[i];
    const upper = percentileValues[i + 1];

    if (value >= lower.value && value <= upper.value) {
      // Linear interpolation
      const ratio = (value - lower.value) / (upper.value - lower.value);
      return lower.percentile + ratio * (upper.percentile - lower.percentile);
    }
  }

  return 50; // Default to median if something goes wrong
}

function calculateStrengthPercentile(
  lift,
  weight,
  gender = "male",
  ageRange = "18-29"
) {
  if (!strengthStats[lift]?.[gender]?.[ageRange]) {
    return null;
  }

  const stats = strengthStats[lift][gender][ageRange];
  return Math.round(interpolatePercentile(weight, stats));
}

function getWeightComparison(totalWeight) {
  return weightComparisons.findComparison(totalWeight);
}

module.exports = {
  calculateStrengthPercentile,
  getWeightComparison,
};
