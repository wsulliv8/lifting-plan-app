import { useState, useCallback } from "react";
import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

export const usePlanDragAndDrop = (workoutsRef, setWorkouts) => {
  const [activeWorkout, setActiveWorkout] = useState(null);

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 50,
      tolerance: 0,
      distance: 5,
    },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  const handleDragStart = useCallback((event) => {
bbb    if (event.active.data.current?.workout) {
      setActiveWorkout(event.active.data.current.workout);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        setActiveWorkout(null);
        return;
      }

      const activeId = active.id;
      const overId = over.id;
      const isActiveAWorkout = active.data.current?.type === "Workout";

      if (!isActiveAWorkout) {
        setActiveWorkout(null);
        return;
      }

      const currentWorkouts = new Map(workoutsRef.current);
      const activeWorkout = currentWorkouts.get(activeId);
      if (!activeWorkout) {
        setActiveWorkout(null);
        return;
      }

      if (over.data.current?.type === "Workout") {
        const overWorkout = currentWorkouts.get(overId);
        if (!overWorkout) {
          setActiveWorkout(null);
          return;
        }

        if (activeWorkout.dayId !== overWorkout.dayId) {
          currentWorkouts.set(activeId, {
            ...activeWorkout,
            dayId: overWorkout.dayId,
          });
          setWorkouts(new Map(currentWorkouts));
        }
      } else if (over.data.current?.type === "Day") {
        const targetDayId = overId;
        if (activeWorkout.dayId !== targetDayId) {
          currentWorkouts.set(activeId, {
            ...activeWorkout,
            dayId: targetDayId,
          });
          setWorkouts(new Map(currentWorkouts));
        }
      }
      setActiveWorkout(null);
    },
    [workoutsRef, setWorkouts]
  );

  return {
    activeWorkout,
    sensors,
    handleDragStart,
    handleDragEnd,
  };
};
