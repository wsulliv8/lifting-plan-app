const progressionRules = {
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
};

export default progressionRules;
