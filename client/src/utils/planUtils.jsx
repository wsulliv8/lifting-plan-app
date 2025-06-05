import chunk from "lodash/chunk";

// Compute workoutsByDay Map
export const computeWorkoutsByDay = (workouts) => {
  const map = new Map();
  workouts.forEach((workout) => {
    const dayId = workout.dayId;
    if (!map.has(dayId)) {
      map.set(dayId, []);
    }
    const copiedWorkout = {
      ...workout,
      name: workout.name,
      lifts: (workout.lifts || []).map((lift) => ({
        ...lift,
        reps: [...(lift.reps || [])],
        weight: [...(lift.weight || [])],
        progressionRule: lift.progressionRule
          ? { ...lift.progressionRule }
          : undefined,
      })),
    };
    map.get(dayId).push(copiedWorkout);
  });
  return map;
};

export const computeGridStyle = (
  weeks,
  collapsedWeeks,
  collapsedDays,
  availableWidth,
  isMobile
) => {
  const weekLabelWidth = "2rem";
  const minDayWidth = "10rem"; // Match minmax minimum
  const maxDayWidth = "12rem";

  // Calculate natural grid width (7 days + week label)
  const dayWidth = collapsedDays.map((collapsed) =>
    collapsed ? "2rem" : minDayWidth
  );

  const naturalWidth =
    parseFloat(weekLabelWidth) * 16 + // Convert rem to px (1rem = 16px)
    dayWidth.reduce((sum, w) => sum + parseFloat(w) * 16, 0);

  // If natural width fits within available width, use 1fr to expand
  const useFractional = naturalWidth < availableWidth;
  const dayColumnStyle = collapsedDays.map((collapsed) =>
    collapsed
      ? "2rem"
      : useFractional
      ? "1fr"
      : `minmax(${minDayWidth}, ${maxDayWidth})`
  );

  return {
    gridTemplateColumns: `${weekLabelWidth} ${
      dayColumnStyle.join(" ")
    }`,
    gridTemplateRows: `2rem ${weeks
      .map((_, weekIndex) =>
        collapsedWeeks.has(weekIndex) ? "2rem" : "minmax(7rem, auto)"
      )
      .join(" ")}`,
    width: useFractional ? `${availableWidth}px` : "max-content",
  };
};

// New mobile-specific grid style function
export const computeMobileGridStyle = (collapsedDays, availableWidth, excludeWeekLabel = false) => {
  const weekLabelWidth = "3rem"; // Slightly wider for mobile
  const minDayWidth = "8rem"; // Smaller minimum for mobile
  const maxDayWidth = "10rem"; // Smaller maximum for mobile

  // Calculate day column styles
  const dayColumnStyle = collapsedDays.map((collapsed) =>
    collapsed ? "2rem" : `minmax(${minDayWidth}, ${maxDayWidth})`
  );

  return {
    gridTemplateColumns: excludeWeekLabel 
      ? dayColumnStyle.join(" ") 
      : `${weekLabelWidth} ${dayColumnStyle.join(" ")}`,
    gridTemplateRows: "auto", // Single row for mobile layout
    minWidth: "max-content",
  };
};

// Strip IDs for saving
export const stripIds = (plan) => ({
  ...plan,
  weeks: plan.weeks.map((week) => ({
    ...week,
    days: week.days.map((day) => ({
      ...day,
      workouts: day.workouts.map((workout) => {
        const { id: _workoutId, ...workoutWithoutId } = workout;
        return {
          ...workoutWithoutId,
          lifts: workout.lifts.map((lift) => {
            const { id: _liftId, ...liftWithoutId } = lift;
            return {
              ...liftWithoutId,
              reps: liftWithoutId.reps.map((num) => num.toString()),
            };
          }),
        };
      }),
    })),
  })),
});

// Compute weeks
export const computeWeeks = (totalDays) => {
  const days = Array.from({ length: totalDays }, (_, i) => i);
  return chunk(days, 7);
};

// Generate header days
export const generateHeaderDays = (collapsedDays, toggleDayCollapse) =>
  Array(7)
    .fill()
    .map((_, dayIndex) => (
      <div
        key={`header-day-${dayIndex}`}
        className={`bg-[var(--background-alt)] p-1 font-medium cursor-pointer hover:bg-[var(--background-dark)] place-self-center w-full rounded text-center sticky -top-2 z-10 ${
          collapsedDays[dayIndex]
            ? "text-[var(--text-secondary)]"
            : "text-[var(--text-primary)]"
        }`}
        onClick={() => toggleDayCollapse(dayIndex)}
      >
        {!collapsedDays[dayIndex] ? "Day" : ""} {dayIndex + 1}
      </div>
    ));