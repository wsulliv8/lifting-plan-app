const progressionAlgorithm = {
  computeProgressionRule(liftType, experienceLevel) {
    // Base increment map: [lbs]
    const baseIncrements = {
      beginner: { primary: 10, supplementary: 5 },
      intermediate: { primary: 5, supplementary: 2.5 },
      advanced: { primary: 2.5, supplementary: 1.25 },
    };

    // Base frequency map: [sessions]
    const baseFrequencies = {
      beginner: { primary: 1, supplementary: 1 }, // every session
      intermediate: { primary: 1, supplementary: 2 }, // every other session
      advanced: { primary: 3, supplementary: 4 }, // every 3 sessions
    };

    // Drop % if failed (can also be a range if you want more control)
    const regression = {
      beginner: 0.1, // drop 10% on failure
      intermediate: 0.07,
      advanced: 0.05,
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
          weight: newWeight.map((w) => Math.min(w, maxWeight * 1.1)),
        };
      }
    }

    return {
      ...lift,
      weight: newWeight,
    };
  },

  adjustProgressionRule() {
    return null;
  },
};

export default progressionAlgorithm;
