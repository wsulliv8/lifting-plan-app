// This file would be called workoutsStore.js
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const useWorkoutsStore = create(
  immer((set, get) => ({
    workoutsByDay: {},

    // Initialize workouts for all days
    initializeWorkouts: (workouts, totalDays) => {
      const workoutsByDay = {};

      // Ensure all days have an array, even empty ones
      for (let i = 0; i < totalDays; i++) {
        workoutsByDay[i] = [];
      }

      // Group workouts by dayId
      workouts.forEach((workout) => {
        const dayId = workout.dayId;
        if (!workoutsByDay[dayId]) {
          workoutsByDay[dayId] = [];
        }
        workoutsByDay[dayId].push(workout);
      });

      set({ workoutsByDay });
    },

    // Move a workout within the same day (reordering)
    moveWorkoutInDay: (dayId, fromIndex, toIndex) => {
      set((state) => {
        if (!state.workoutsByDay[dayId]) return;

        // Create a new array for just this day's workouts
        const dayWorkouts = [...state.workoutsByDay[dayId]];
        const [movedWorkout] = dayWorkouts.splice(fromIndex, 1);

        if (movedWorkout) {
          dayWorkouts.splice(toIndex, 0, movedWorkout);

          // Only update the specific day that changed
          state.workoutsByDay[dayId] = dayWorkouts;
        }
      });
    },

    // Move a workout from one day to another
    moveWorkoutToDay: (workoutId, fromDayId, toDayId) => {
      set((state) => {
        if (!state.workoutsByDay[fromDayId] || !state.workoutsByDay[toDayId])
          return;

        // Find the workout in the source day
        const fromDayWorkouts = [...state.workoutsByDay[fromDayId]];
        const workoutIndex = fromDayWorkouts.findIndex(
          (w) => w.id === workoutId
        );

        if (workoutIndex === -1) return;

        // Remove from source day
        const [movedWorkout] = fromDayWorkouts.splice(workoutIndex, 1);

        // Add to target day (at the end)
        const toDayWorkouts = [
          ...state.workoutsByDay[toDayId],
          { ...movedWorkout, dayId: toDayId },
        ];

        // Only update the days that changed
        state.workoutsByDay[fromDayId] = fromDayWorkouts;
        state.workoutsByDay[toDayId] = toDayWorkouts;
      });
    },

    // Update all workouts for a specific day
    updateDayWorkouts: (dayId, workouts) => {
      set((state) => {
        // Only update the specific day
        state.workoutsByDay[dayId] = workouts.map((w) => ({ ...w, dayId }));
      });
    },

    // Clear workouts for a specific week
    clearWeekWorkouts: (weekIndex, totalDays) => {
      set((state) => {
        const newWorkoutsByDay = { ...state.workoutsByDay };

        // Calculate the day range for this week
        const startDay = weekIndex * 7;
        const endDay = startDay + 7;

        // Remove the days from this week
        for (let i = startDay; i < endDay && i < totalDays; i++) {
          delete newWorkoutsByDay[i];
        }

        // Shift all workouts from later days up
        for (let i = endDay; i < totalDays; i++) {
          if (newWorkoutsByDay[i]) {
            // Move workouts to 7 days earlier and update their dayId
            newWorkoutsByDay[i - 7] = newWorkoutsByDay[i].map((workout) => ({
              ...workout,
              dayId: i - 7,
            }));
            delete newWorkoutsByDay[i];
          }
        }

        return { workoutsByDay: newWorkoutsByDay };
      });
    },
  }))
);

export default useWorkoutsStore;
