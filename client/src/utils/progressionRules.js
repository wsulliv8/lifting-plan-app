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
    // Return lift unchanged if no progression rule
    if (!lift.progressionRule) {
      return lift;
    }

    const { progressionIncrement, progressionFrequency } = lift.progressionRule;
    // Calculate increments based on session and frequency
    const incrementsApplied = Math.floor(sessionIndex / progressionFrequency);
    const newWeight = lift.weight.map(
      (w) => w + incrementsApplied * progressionIncrement
    );

    // Validate against max weights from rep_range_progress (cap at 110% of max)
    if (userLiftData?.rep_range_progress?.rep_ranges) {
      const repRanges = Object.values(
        userLiftData.rep_range_progress.rep_ranges
      );
      const maxWeights = repRanges
        .map((range) => range.current?.weight)
        .filter((w) => w && w > 0);

      if (maxWeights.length > 0) {
        const maxWeight = Math.max(...maxWeights);
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
