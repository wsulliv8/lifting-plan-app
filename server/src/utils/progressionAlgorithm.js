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

  applyProgressionRule(lift, sessionIndex, userLiftData) {
    if (!lift.progressionRule) console.log(lift);
    const { progressionIncrement, progressionFrequency } = lift.progressionRule;
    // Calculate increments based on session and frequency
    const incrementsApplied = Math.floor(sessionIndex / progressionFrequency);
    const newWeight = lift.weight.map(
      (w) => w + incrementsApplied * progressionIncrement
    );

    // Validate against max weights (cap at 110% of max)
    if (userLiftData) {
      const maxWeight = Math.max(
        ...userLiftData.max_weights.filter((w) => w > 0)
      );
      if (maxWeight > 0) {
        return {
          ...lift,
          weight: newWeight.map((w) =>
            Number(Math.min(w, maxWeight * 1.1).toFixed(1))
          ),
        };
      }
    }

    return {
      ...lift,
      weight: newWeight,
    };
  },

  adjustFutureWeights(lift) {
    if (!lift.progressionRule || !lift.actualPerformance) {
      return 0; // No adjustment if missing data
    }

    const { progressionIncrement, regressionOnFailure } = lift.progressionRule;
    const { weight, reps, rpe } = lift;
    const { actualWeight, actualReps, actualRPE } = lift.actualPerformance;

    // Count sets where performance exceeded expectations
    let exceededWeightOrRepsCount = 0;
    let lowRPECount = 0;
    let failedSetsCount = 0;

    weight.forEach((targetWeight, index) => {
      const setWeight = actualWeight[index];
      const setReps = actualReps[index];
      const setRPE = actualRPE[index];

      // Check for exceeded performance
      if (setWeight > targetWeight || setReps > reps[index]) {
        exceededWeightOrRepsCount++;
      }

      // Check for significantly lower RPE (2 or more points under target)
      if (setRPE <= rpe[index] - 2) {
        lowRPECount++;
      }

      // Check for failed sets
      if (
        setWeight < targetWeight ||
        setReps < reps[index] ||
        setRPE > rpe[index]
      ) {
        failedSetsCount++;
      }
    });

    // Return adjustment value based on performance
    if (exceededWeightOrRepsCount >= 3 || lowRPECount >= 3) {
      // Double the normal progression increment
      return progressionIncrement * 2;
    } else if (failedSetsCount >= 2) {
      // Reduce by regression value (in pounds)
      return -regressionOnFailure;
    } else {
      // No adjustment needed
      return 0;
    }
  },
};

module.exports = progressionAlgorithm;
