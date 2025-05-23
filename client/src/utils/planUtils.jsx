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

// Compute gridStyle
export const computeGridStyle = (weeks, collapsedWeeks, collapsedDays) => ({
  gridTemplateColumns: `2rem ${Array(7)
    .fill()
    .map((_, i) => (collapsedDays[i] ? "2rem" : "minmax(6rem, 1fr)"))
    .join(" ")}`,
  gridTemplateRows: `2rem ${weeks
    .map((_, weekIndex) =>
      collapsedWeeks.has(weekIndex) ? "2rem" : "minmax(7rem, auto)"
    )
    .join(" ")}`,
});

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
        className={`bg-gray-50 p-1 font-medium cursor-pointer hover:bg-gray-200 place-self-center w-full rounded text-center sticky -top-2 z-10 ${
          collapsedDays[dayIndex] ? "text-gray-400" : "text-gray-800"
        }`}
        onClick={() => toggleDayCollapse(dayIndex)}
      >
        {!collapsedDays[dayIndex] ? "Day" : ""} {dayIndex + 1}
      </div>
    ));
