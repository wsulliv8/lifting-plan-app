import { useState, useCallback } from "react";
import React from "react";
import { DndContext, closestCenter, pointerWithin } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "../common/Modal";
import Input from "../common/Input";
import { v4 as uuidv4 } from "uuid"; // You might need to install this dependency

// WorkoutEditor component (previously missing)
const WorkoutEditor = ({ workouts = [], onSave }) => {
  const [editedWorkouts, setEditedWorkouts] = useState(workouts);
  const [newWorkoutName, setNewWorkoutName] = useState("");

  const addWorkout = () => {
    if (!newWorkoutName.trim()) return;

    setEditedWorkouts([
      ...editedWorkouts,
      { id: uuidv4(), name: newWorkoutName.trim(), exercises: [] },
    ]);
    setNewWorkoutName("");
  };

  const removeWorkout = (workoutId) => {
    setEditedWorkouts(editedWorkouts.filter((w) => w.id !== workoutId));
  };

  const updateWorkoutName = (workoutId, newName) => {
    setEditedWorkouts(
      editedWorkouts.map((w) =>
        w.id === workoutId ? { ...w, name: newName } : w
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {editedWorkouts.map((workout, index) => (
          <div
            key={workout.id}
            className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
          >
            <Input
              value={workout.name}
              onChange={(e) => updateWorkoutName(workout.id, e.target.value)}
              placeholder="Workout name"
              className="flex-grow"
            />
            <button
              onClick={() => removeWorkout(workout.id)}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <Input
          value={newWorkoutName}
          onChange={(e) => setNewWorkoutName(e.target.value)}
          placeholder="New workout name"
          className="flex-grow"
          onKeyPress={(e) => e.key === "Enter" && addWorkout()}
        />
        <button
          onClick={addWorkout}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <button
          onClick={() => onSave(editedWorkouts)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Save Workouts
        </button>
      </div>
    </div>
  );
};

const PlanEditor = ({ initialPlan }) => {
  // Initialize with at least 4 weeks if no initial plan is provided
  const defaultPlan = {
    weeks: Array(4)
      .fill()
      .map(() => ({
        days: Array(7)
          .fill()
          .map(() => ({ workouts: [] })),
      })),
  };

  const [plan, setPlan] = useState(initialPlan || defaultPlan);
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());
  const [collapsedDays, setCollapsedDays] = useState(Array(7).fill(false));
  const [editingDay, setEditingDay] = useState(null);
  const [copySource, setCopySource] = useState(null);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [repeatSource, setRepeatSource] = useState(null);
  const [repeatCount, setRepeatCount] = useState(1);

  // Toggle week collapse state
  const toggleWeekCollapse = (weekIndex) => {
    const newCollapsedWeeks = new Set(collapsedWeeks);
    if (newCollapsedWeeks.has(weekIndex)) {
      newCollapsedWeeks.delete(weekIndex);
    } else {
      newCollapsedWeeks.add(weekIndex);
    }
    setCollapsedWeeks(newCollapsedWeeks);
  };

  // Toggle day collapse state
  const toggleDayCollapse = (dayIndex) => {
    setCollapsedDays((prev) => {
      const newCollapsedDays = [...prev];
      newCollapsedDays[dayIndex] = !newCollapsedDays[dayIndex];
      return newCollapsedDays;
    });
  };

  // Handle drag end for workouts
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!active || !over) return;

    const activeId = active.id;
    const overId = over.id;

    // Handle if we're dropping on a day container instead of a workout
    const isOverDay = overId.toString().startsWith("day-");

    // Find source workout
    let sourceWeekIndex, sourceDayIndex, sourceWorkoutIndex;
    let destWeekIndex, destDayIndex;

    // Find the source workout
    for (let wi = 0; wi < plan.weeks.length; wi++) {
      for (let di = 0; di < 7; di++) {
        const workouts = plan.weeks[wi].days[di].workouts;
        const workoutIndex = workouts.findIndex((w) => w.id === activeId);

        if (workoutIndex !== -1) {
          sourceWeekIndex = wi;
          sourceDayIndex = di;
          sourceWorkoutIndex = workoutIndex;
          break;
        }
      }
      if (sourceWeekIndex !== undefined) break;
    }

    if (sourceWeekIndex === undefined) return;

    // If dropping on a day container
    if (isOverDay) {
      const [_, weekStr, dayStr] = overId.toString().split("-");
      destWeekIndex = parseInt(weekStr, 10);
      destDayIndex = parseInt(dayStr, 10);

      // Move workout to the end of destination day
      const newPlan = { ...plan };
      const workoutToMove = {
        ...newPlan.weeks[sourceWeekIndex].days[sourceDayIndex].workouts[
          sourceWorkoutIndex
        ],
      };

      // Remove from source
      newPlan.weeks[sourceWeekIndex].days[sourceDayIndex].workouts.splice(
        sourceWorkoutIndex,
        1
      );

      // Add to destination
      newPlan.weeks[destWeekIndex].days[destDayIndex].workouts.push(
        workoutToMove
      );

      setPlan(newPlan);
      return;
    }

    // Find destination workout
    for (let wi = 0; wi < plan.weeks.length; wi++) {
      for (let di = 0; di < 7; di++) {
        const workouts = plan.weeks[wi].days[di].workouts;
        const workoutIndex = workouts.findIndex((w) => w.id === overId);

        if (workoutIndex !== -1) {
          destWeekIndex = wi;
          destDayIndex = di;

          // If same day, reorder
          if (
            sourceWeekIndex === destWeekIndex &&
            sourceDayIndex === destDayIndex
          ) {
            const newWorkouts = [...plan.weeks[wi].days[di].workouts];
            const [movedItem] = newWorkouts.splice(sourceWorkoutIndex, 1);
            newWorkouts.splice(workoutIndex, 0, movedItem);

            setPlan((prevPlan) => ({
              ...prevPlan,
              weeks: prevPlan.weeks.map((week, weekIndex) =>
                weekIndex === wi
                  ? {
                      ...week,
                      days: week.days.map((day, dayIndex) =>
                        dayIndex === di
                          ? { ...day, workouts: newWorkouts }
                          : day
                      ),
                    }
                  : week
              ),
            }));
          } else {
            // Move between days
            const newPlan = { ...plan };
            const workoutToMove = {
              ...newPlan.weeks[sourceWeekIndex].days[sourceDayIndex].workouts[
                sourceWorkoutIndex
              ],
            };

            // Remove from source
            newPlan.weeks[sourceWeekIndex].days[sourceDayIndex].workouts.splice(
              sourceWorkoutIndex,
              1
            );

            // Add to destination before the target workout
            newPlan.weeks[destWeekIndex].days[destDayIndex].workouts.splice(
              workoutIndex,
              0,
              workoutToMove
            );

            setPlan(newPlan);
          }
          return;
        }
      }
    }
  };

  // Handle copying a day's workouts
  const copyWorkouts = (weekIndex, dayIndex) => {
    const workouts = plan.weeks[weekIndex].days[dayIndex].workouts;
    setCopySource({
      weekIndex,
      dayIndex,
      workouts: workouts.map((w) => ({ ...w, id: w.id })), // Keep original IDs when copying
    });
  };

  // Handle pasting workouts to a day
  const pasteWorkouts = (weekIndex, dayIndex) => {
    if (!copySource) return;

    // Create deep copies with new IDs
    const workoutsToPaste = copySource.workouts.map((w) => ({
      ...w,
      id: uuidv4(), // Generate new ID for each pasted workout
    }));

    setPlan((prevPlan) => ({
      ...prevPlan,
      weeks: prevPlan.weeks.map((week, wIndex) =>
        wIndex === weekIndex
          ? {
              ...week,
              days: week.days.map((day, dIndex) =>
                dIndex === dayIndex
                  ? {
                      ...day,
                      workouts: [...day.workouts, ...workoutsToPaste],
                    }
                  : day
              ),
            }
          : week
      ),
    }));
  };

  // Open repeat modal
  const openRepeatModal = (weekIndex, dayIndex) => {
    setRepeatSource({ weekIndex, dayIndex });
    setRepeatCount(1);
    setShowRepeatModal(true);
  };

  // Handle repeating workouts for multiple days
  const handleRepeatWorkouts = () => {
    if (!repeatSource || repeatCount < 1) {
      setShowRepeatModal(false);
      return;
    }

    const { weekIndex, dayIndex } = repeatSource;
    const sourceWorkouts = plan.weeks[weekIndex].days[dayIndex].workouts;

    // Create a new plan to modify
    const newPlan = { ...plan };

    // For each day to repeat to
    for (let i = 1; i <= repeatCount; i++) {
      const targetDayIndex = (dayIndex + i) % 7;
      const targetWeekIndex = weekIndex + Math.floor((dayIndex + i) / 7);

      // Ensure we have enough weeks
      while (newPlan.weeks.length <= targetWeekIndex) {
        newPlan.weeks.push({
          days: Array(7)
            .fill()
            .map(() => ({ workouts: [] })),
        });
      }

      // Create deep copies with new IDs
      const workoutsToCopy = sourceWorkouts.map((w) => ({
        ...w,
        id: uuidv4(), // Generate new ID for each repeated workout
      }));

      // Add to target day
      newPlan.weeks[targetWeekIndex].days[targetDayIndex].workouts = [
        ...newPlan.weeks[targetWeekIndex].days[targetDayIndex].workouts,
        ...workoutsToCopy,
      ];
    }

    setPlan(newPlan);
    setShowRepeatModal(false);
  };

  // Handle editing workouts in a day
  const handleEditWorkout = (weekIndex, dayIndex) => {
    setEditingDay({
      weekIndex,
      dayIndex,
      workouts: [...plan.weeks[weekIndex].days[dayIndex].workouts],
    });
  };

  // Save edited workouts
  const saveEditedWorkouts = (newWorkouts) => {
    if (!editingDay) return;

    const { weekIndex, dayIndex } = editingDay;
    setPlan((prevPlan) => ({
      ...prevPlan,
      weeks: prevPlan.weeks.map((week, wIndex) =>
        wIndex === weekIndex
          ? {
              ...week,
              days: week.days.map((day, dIndex) =>
                dIndex === dayIndex ? { ...day, workouts: newWorkouts } : day
              ),
            }
          : week
      ),
    }));
    setEditingDay(null);
  };

  // Add a new week to the plan
  const addNewWeek = () => {
    setPlan((prevPlan) => ({
      ...prevPlan,
      weeks: [
        ...prevPlan.weeks,
        {
          days: Array(7)
            .fill()
            .map(() => ({ workouts: [] })),
        },
      ],
    }));
  };

  // Generate grid template columns based on collapsed days
  const gridTemplateColumns = `minmax(6rem, auto) ${Array(7)
    .fill()
    .map((_, i) => (collapsedDays[i] ? "4rem" : "minmax(10rem, 1fr)"))
    .join(" ")}`;

  // Get day name based on index
  const getDayName = (index) => {
    return `Day ${index + 1}`;
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Lifting Plan Editor</h2>

      <DndContext collisionDetection={pointerWithin} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto pb-4 mb-4">
          {/* Grid Container */}
          <div
            className="grid gap-2 min-w-full"
            style={{ gridTemplateColumns }}
          >
            {/* Header Row */}
            <div className="bg-gray-200 p-3 font-semibold text-gray-800 rounded-tl-lg">
              Week
            </div>
            {Array(7)
              .fill()
              .map((_, dayIndex) => (
                <div
                  key={`header-day-${dayIndex}`}
                  className={`bg-gray-200 p-3 font-semibold cursor-pointer rounded-t-lg
                    ${
                      collapsedDays[dayIndex]
                        ? "text-gray-400"
                        : "text-gray-800"
                    }
                    ${dayIndex === 6 ? "rounded-tr-lg" : ""}
                  `}
                  onClick={() => toggleDayCollapse(dayIndex)}
                >
                  <div className="flex justify-between items-center">
                    {getDayName(dayIndex)}
                    <span className="ml-2">
                      {collapsedDays[dayIndex] ? "►" : "▼"}
                    </span>
                  </div>
                </div>
              ))}

            {/* Week Rows */}
            {plan.weeks.map((week, weekIndex) => (
              <React.Fragment key={`week-${weekIndex}`}>
                <div
                  className={`bg-blue-100 p-3 font-medium cursor-pointer hover:bg-blue-200 flex items-center
                    ${
                      weekIndex === plan.weeks.length - 1 ? "rounded-bl-lg" : ""
                    }
                  `}
                  onClick={() => toggleWeekCollapse(weekIndex)}
                >
                  <div className="flex justify-between items-center w-full">
                    Week {weekIndex + 1}
                    <span>{collapsedWeeks.has(weekIndex) ? "►" : "▼"}</span>
                  </div>
                </div>

                {/* Only render days if week is not collapsed */}
                {!collapsedWeeks.has(weekIndex) &&
                  week.days.map((day, dayIndex) => (
                    <div
                      key={`day-${weekIndex}-${dayIndex}`}
                      className={`
                      ${
                        collapsedDays[dayIndex]
                          ? "min-w-[4rem] bg-gray-100"
                          : "bg-white"
                      }
                      ${
                        dayIndex === 6 && weekIndex === plan.weeks.length - 1
                          ? "rounded-br-lg"
                          : ""
                      }
                      ${dayIndex === 6 ? "rounded-r" : ""}
                      p-3 border border-gray-200 transition-all
                    `}
                    >
                      {!collapsedDays[dayIndex] && (
                        <>
                          <SortableContext
                            id={`day-${weekIndex}-${dayIndex}`}
                            items={day.workouts.map((w) => w.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div
                              id={`day-${weekIndex}-${dayIndex}`}
                              className="min-h-[120px] bg-gray-50 rounded-lg p-2 mb-3"
                            >
                              {day.workouts.length === 0 ? (
                                <div className="text-gray-400 text-center py-10">
                                  Drop workouts here
                                </div>
                              ) : (
                                day.workouts.map((workout) => (
                                  <SortableItem
                                    key={workout.id}
                                    id={workout.id}
                                    workout={workout}
                                  />
                                ))
                              )}
                            </div>
                          </SortableContext>

                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <button
                              onClick={() =>
                                handleEditWorkout(weekIndex, dayIndex)
                              }
                              className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm transition"
                            >
                              Edit Workout
                            </button>
                            <button className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm transition">
                              Import Workout
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-1 mt-2">
                            <button
                              onClick={() => copyWorkouts(weekIndex, dayIndex)}
                              className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs transition"
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => pasteWorkouts(weekIndex, dayIndex)}
                              className={`px-2 py-1 rounded text-xs transition ${
                                copySource
                                  ? "bg-green-500 text-white hover:bg-green-600"
                                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
                              }`}
                              disabled={!copySource}
                            >
                              Paste
                            </button>
                            <button
                              onClick={() =>
                                openRepeatModal(weekIndex, dayIndex)
                              }
                              className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs transition"
                            >
                              Repeat
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </DndContext>

      <div className="flex justify-end">
        <button
          onClick={addNewWeek}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Add Week
        </button>
      </div>

      {/* Edit Workout Modal */}
      <Modal
        isOpen={editingDay !== null}
        onClose={() => setEditingDay(null)}
        title={
          editingDay
            ? `Edit Workouts - Week ${editingDay.weekIndex + 1}, ${getDayName(
                editingDay.dayIndex
              )}`
            : "Edit Workouts"
        }
      >
        {editingDay && (
          <WorkoutEditor
            workouts={editingDay.workouts}
            onSave={saveEditedWorkouts}
          />
        )}
      </Modal>

      {/* Repeat Workout Modal */}
      <Modal
        isOpen={showRepeatModal}
        onClose={() => setShowRepeatModal(false)}
        title="Repeat Workout"
      >
        <div className="space-y-4">
          <p>Repeat this day's workouts for the next:</p>
          <Input
            type="number"
            min="1"
            max="14"
            value={repeatCount}
            onChange={(e) => setRepeatCount(parseInt(e.target.value) || 1)}
            className="w-full"
          />
          <p className="text-sm text-gray-600">
            Workouts will be copied to the next {repeatCount} consecutive days
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowRepeatModal(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleRepeatWorkouts}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Repeat
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// SortableItem Component
const SortableItem = ({ id, workout }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 mb-2 bg-white border border-gray-200 rounded cursor-move hover:shadow-md transition"
    >
      <strong>{workout.name || "Unnamed Workout"}</strong>
      {workout.exercises && workout.exercises.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {workout.exercises.length} exercise(s)
        </div>
      )}
    </div>
  );
};

export default PlanEditor;
