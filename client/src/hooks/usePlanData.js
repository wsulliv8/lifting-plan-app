import { useState, useEffect, useRef } from "react";

export const usePlanData = ({
  plan: initialPlan,
  baseLifts,
  userLiftsData,
  currentUser,
}) => {
  // Create a deep copy of initialPlan to preserve all IDs
  const [plan, setPlan] = useState(() => {
    // Ensure we preserve all IDs from the database
    return {
      ...initialPlan,
      weeks: initialPlan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          workouts: day.workouts.map((workout) => ({
            ...workout,
          })),
        })),
      })),
    };
  });

  const [workouts, setWorkouts] = useState(() => {
    const initialWorkouts = new Map();
    initialPlan.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        day.workouts.forEach((workout) => {
          initialWorkouts.set(workout.id, {
            ...workout,
            dayId: weekIndex * 7 + dayIndex,
            lifts: workout.lifts.map((lift) => ({
              ...lift,
              rpe: lift.rpe || [],
              rest: lift.rest || [],
              showRPE: lift.rpe && lift.rpe.length > 0,
              showRest: lift.rest && lift.rest.length > 0,
            })),
          });
        });
      });
    });
    return initialWorkouts;
  });

  const [totalDays, setTotalDays] = useState(
    () => initialPlan.weeks.length * 7
  );

  const workoutsRef = useRef(workouts);
  useEffect(() => {
    workoutsRef.current = workouts;
  }, [workouts]);

  return {
    plan,
    setPlan,
    workouts,
    setWorkouts,
    totalDays,
    setTotalDays,
    workoutsRef,
    baseLifts,
    userLiftsData,
    currentUser,
  };
};
