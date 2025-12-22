const progressionAlgorithm = {
  computeProgressionRule(liftType, experienceLevel) {
    // Base increment map: [lbs]
    const baseIncrements = {
      beginner: { primary: 10, supplementary: 5 },
      intermediate: { primary: 5, supplementary: 5 },
      advanced: { primary: 5, supplementary: 5 },
    };

    // Base frequency map: [sessions]
    const baseFrequencies = {
      beginner: { primary: 1, supplementary: 1 }, // every session
      intermediate: { primary: 2, supplementary: 3 },
      advanced: { primary: 5, supplementary: 6 },
    };

    const regression = {
      beginner: 10, // drop 10 pounds on failure
      intermediate: 5,
      advanced: 5,
    };

    return {
      progressionIncrement: baseIncrements[experienceLevel][liftType],
      progressionFrequency: baseFrequencies[experienceLevel][liftType],
      regressionOnFailure: regression[experienceLevel],
    };
  },

  adjustFutureWeights(lift) {
    if (!lift.progression_rule || !lift.weight_achieved) {
      return 0; // No adjustment if missing data
    }

    const { progressionIncrement, regressionOnFailure } = lift.progression_rule;

    // Count sets where performance exceeded expectations
    let exceededWeightOrRepsCount = 0;
    let lowRPECount = 0;
    let failedSetsCount = 0;

    lift.weight.forEach((targetWeight, index) => {
      const achievedWeight = parseFloat(lift.weight_achieved[index]);
      const targetReps = parseInt(lift.reps[index].split("-")[0]); // Use lower bound of rep range
      const achievedReps = parseInt(lift.reps_achieved[index]);
      const targetRPE = lift.rpe ? parseInt(lift.rpe[index]) : null;
      const achievedRPE = lift.rpe_achieved
        ? parseInt(lift.rpe_achieved[index])
        : null;

      // Check for exceeded performance
      if (achievedWeight > targetWeight || achievedReps > targetReps) {
        exceededWeightOrRepsCount++;
      }

      // Check for significantly lower RPE (2 or more points under target)
      if (targetRPE && achievedRPE && achievedRPE <= targetRPE - 2) {
        lowRPECount++;
      }

      // Check for failed sets
      if (
        achievedWeight < targetWeight ||
        achievedReps < targetReps ||
        (targetRPE && achievedRPE && achievedRPE > targetRPE)
      ) {
        failedSetsCount++;
      }
    });

    // Return adjustment value based on performance
    if (exceededWeightOrRepsCount >= 3 || lowRPECount >= 3) {
      // Double the normal progression increment
      return progressionIncrement * 2;
    } else if (failedSetsCount >= 2) {
      // Reduce by regression value
      return -regressionOnFailure;
    } else {
      // No adjustment needed
      return 0;
    }
  },

  calculateWeightAdjustment(oldWeight, newWeight, repDifference = 0) {
    // Calculate base percentage increase
    const percentageIncrease = (newWeight - oldWeight) / oldWeight;

    // If there's a rep difference, adjust the percentage
    if (repDifference !== 0) {
      // Each rep difference adds/subtracts 10% to the adjustment
      const repAdjustmentFactor = 1 + repDifference * 0.1;
      return percentageIncrease * repAdjustmentFactor;
    }

    return percentageIncrease;
  },

  applyWeightAdjustment(
    currentEstimatedMax,
    adjustmentFactor,
    weightAdjustmentFactor
  ) {
    const newEstimatedMax =
      currentEstimatedMax * (1 + adjustmentFactor * weightAdjustmentFactor);
    // Round down to nearest 5
    return Math.floor(newEstimatedMax / 5) * 5;
  },
};

module.exports = progressionAlgorithm;
