import { useState, useEffect, useRef } from "react";

export const usePlanData = ({
  plan: initialPlan,
  baseLifts,
  userLiftsData,
  currentUser,
}) => {
  const [plan, setPlan] = useState({ ...initialPlan });
  const [workouts, setWorkouts] = useState(() => {
    const initialWorkouts = new Map();
    initialPlan.weeks.forEach((week, weekIndex) => {
      week.days.forEach((day, dayIndex) => {
        day.workouts.forEach((workout) => {
          initialWorkouts.set(workout.id, {
            ...workout,
            dayId: weekIndex * 7 + dayIndex,
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
