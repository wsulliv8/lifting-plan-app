export const getMaxWeightForRepRange = (userLift, reps) => {
  if (!userLift?.rep_range_progress?.rep_ranges) {
    return null;
  }

  // Check for exact match first
  const exactMatch = userLift.rep_range_progress.rep_ranges[String(reps)];
  if (exactMatch?.current?.weight) {
    return exactMatch.current.weight;
  }

  // If no exact match, find the closest rep range (within ±1 rep)
  const availableRepRanges = Object.keys(
    userLift.rep_range_progress.rep_ranges
  ).map(Number);

  const closest = availableRepRanges.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev - reps);
    const currDiff = Math.abs(curr - reps);
    return currDiff < prevDiff ? curr : prev;
  }, availableRepRanges[0]);

  // Only use the closest if it's within 1 rep
  if (Math.abs(closest - reps) <= 1) {
    const closestData = userLift.rep_range_progress.rep_ranges[String(closest)];
    return closestData?.current?.weight || null;
  }

  return null;
};

export const getClosestRepRange = (userLift, targetReps = 8) => {
  if (!userLift?.rep_range_progress?.rep_ranges) {
    return null;
  }

  const availableRepRanges = Object.keys(
    userLift.rep_range_progress.rep_ranges
  ).map(Number);

  if (availableRepRanges.length === 0) {
    return null;
  }

  return availableRepRanges.reduce((closest, current) => {
    const currentDiff = Math.abs(current - targetReps);
    const closestDiff = Math.abs(closest - targetReps);
    return currentDiff < closestDiff ? current : closest;
  });
};
