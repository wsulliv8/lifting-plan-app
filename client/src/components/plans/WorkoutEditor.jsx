import React from "react";
import { useState, useMemo } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Bars4Icon,
  TrashIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { PlusCircleIcon, MinusCircleIcon } from "@heroicons/react/24/outline";
import Button from "../common/Button";
import Input from "../common/Input";
import { computeProgressionRule } from "../../utils/progressionAlgorithms";

// Simple arrayMove function for reordering
const arrayMove = (array, from, to) => {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
};

const WorkoutEditor = ({
  workouts: initialWorkouts,
  baseLifts,
  dayId,
  onSave,
  userLiftsData,
  experience,
}) => {
  const [editedWorkouts, setEditedWorkouts] = useState(
    initialWorkouts && initialWorkouts.length > 0
      ? initialWorkouts
      : [{ id: `${Date.now()}`, dayId, name: "", lifts: [] }]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);
  const filteredLifts = baseLifts.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const userLiftsMap = useMemo(
    () => new Map(userLiftsData.map((data) => [data.base_lift_id, data])),
    [userLiftsData]
  );

  // Update functions
  const updateWorkoutName = (workoutIndex, value) => {
    const updated = [...editedWorkouts];
    updated[workoutIndex].name = value;
    setEditedWorkouts(updated);
  };

  const addLift = (workoutIndex, baseLift) => {
    let updated = [...editedWorkouts];
    if (!updated[workoutIndex]) updated = addWorkout();
    const userLift = userLiftsMap.get(baseLift.id);
    const progressionRule = computeProgressionRule(
      baseLift.lift_type === "Main" ? "primary" : "supplementary",
      experience
    );

    let reps = [8, 8, 8];
    let weight = [0, 0, 0];
    if (userLift) {
      const index =
        userLift.rep_ranges.indexOf(8) !== -1
          ? userLift.rep_ranges.indexOf(8)
          : userLift.rep_ranges.reduce((closestIndex, curr, i, arr) => {
              const currDiff = Math.abs(curr - 8);
              const closestDiff = Math.abs(arr[closestIndex] - 8);
              return currDiff < closestDiff ? i : closestIndex;
            }, 0);
      reps = Array(3).fill(userLift.rep_ranges[index]);
      weight = Array(3).fill(userLift.max_weights[index]);
    }
    const newLift = {
      id: `${Date.now()}`,
      name: baseLift.name,
      base_lift_id: baseLift.id,
      reps,
      weight,
      sets: 3,
      progressionRule,
    };
    updated[workoutIndex].lifts.push(newLift);
    setEditedWorkouts(updated);
  };

  const updateSet = (workoutIndex, liftIndex, setIndex, field, value) => {
    const updated = [...editedWorkouts];
    const lift = updated[workoutIndex].lifts[liftIndex];
    const parsedValue = parseInt(value) || 0;
    const oldValue = lift[field][setIndex];

    if (field === "reps") {
      const baseLiftId = lift.base_lift_id;
      const userLift = userLiftsMap.get(baseLiftId);
      lift.reps[setIndex] = parsedValue;

      let closestIndex = -1;
      let smallestDiff = Infinity;

      if (userLift && value) {
        userLift.rep_ranges.forEach((rep, idx) => {
          const diff = Math.abs(rep - parsedValue);
          if (diff < smallestDiff) {
            smallestDiff = diff;
            closestIndex = idx;
          }
        });

        lift.weight[setIndex] =
          smallestDiff <= 1 ? userLift.max_weights[closestIndex] : 0;
      }

      // Cascade to following sets that matched the old value
      for (let i = setIndex + 1; i < lift.reps.length; i++) {
        if (lift.reps[i] === oldValue) {
          lift.reps[i] = parsedValue;
          if (userLift && closestIndex !== -1) {
            lift.weight[i] =
              smallestDiff <= 1 ? userLift.max_weights[closestIndex] : 0;
          }
        }
      }
    } else {
      lift[field][setIndex] = parsedValue;

      for (let i = setIndex + 1; i < lift[field].length; i++) {
        if (lift[field][i] === oldValue) {
          lift[field][i] = parsedValue;
        }
      }
    }

    setEditedWorkouts(updated);
  };

  const addSet = (workoutIndex, liftIndex) => {
    const updated = [...editedWorkouts];

    const prevSetReps = updated[workoutIndex].lifts[liftIndex].reps.at(-1);
    const prevSetWeight = updated[workoutIndex].lifts[liftIndex].weight.at(-1);

    updated[workoutIndex].lifts[liftIndex].reps.push(prevSetReps);
    updated[workoutIndex].lifts[liftIndex].weight.push(prevSetWeight);
    updated[workoutIndex].lifts[liftIndex].sets++;

    setEditedWorkouts(updated);
  };

  const removeSet = (workoutIndex, liftIndex) => {
    const updated = [...editedWorkouts];
    updated[workoutIndex].lifts[liftIndex] = {
      ...updated[workoutIndex].lifts[liftIndex],
      reps: updated[workoutIndex].lifts[liftIndex].reps.slice(0, -1),
      weight: updated[workoutIndex].lifts[liftIndex].weight.slice(0, -1),
    };
    updated[workoutIndex].lifts[liftIndex].sets--;

    setEditedWorkouts(updated);
  };

  const removeLift = (workoutIndex, liftIndex) => {
    const updated = [...editedWorkouts];
    updated[workoutIndex].lifts = updated[workoutIndex].lifts.filter(
      (_, i) => i !== liftIndex
    );
    setEditedWorkouts(updated);
  };

  const removeWorkout = (workoutIndex) => {
    const updated = [...editedWorkouts];
    setEditedWorkouts(updated.filter((_, i) => i !== workoutIndex));
  };

  const addWorkout = () => {
    const newWorkout = { id: `${Date.now()}`, dayId, name: "", lifts: [] };
    const updated = [...editedWorkouts, newWorkout];
    setEditedWorkouts(updated);
    return updated;
  };

  const addWorkoutCopy = (workout) => {
    const newWorkoutId = `${Date.now()}`;
    const newLifts = workout.lifts.map((lift, index) => ({
      id: `${newWorkoutId}-lift-${index}-${Date.now()}`,
      name: lift.name,
      base_lift_id: lift.base_lift_id, // retain link to base lift
      reps: [...lift.reps],
      weight: [...lift.weight],
    }));

    const newWorkout = {
      id: newWorkoutId,
      name: workout.name + " (Copy)",
      lifts: newLifts,
    };

    setEditedWorkouts([...editedWorkouts, newWorkout]);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sourceWorkoutIndex = editedWorkouts.findIndex((w) =>
      w.lifts.some((l) => l.id === active.id)
    );
    const destWorkoutIndex = editedWorkouts.findIndex((w) =>
      w.lifts.some((l) => l.id === over.id)
    );
    if (sourceWorkoutIndex !== destWorkoutIndex || sourceWorkoutIndex === -1)
      return;

    const workout = editedWorkouts[sourceWorkoutIndex];
    const fromIndex = workout.lifts.findIndex((l) => l.id === active.id);
    const toIndex = workout.lifts.findIndex((l) => l.id === over.id);
    const newLifts = arrayMove(workout.lifts, fromIndex, toIndex);
    const updated = [...editedWorkouts];
    updated[sourceWorkoutIndex].lifts = newLifts;
    setEditedWorkouts(updated);
  };

  return (
    <div className="w-full h-full bg-white rounded-lg flex gap-4">
      {/* Workouts and Lifts Section (2/3) */}
      <div className="flex flex-col h-full items-center w-2/3 overflow-y-auto pr-2">
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {editedWorkouts.map((workout, workoutIndex) =>
            workoutIndex === activeWorkoutIndex ? (
              <div
                key={workout.id}
                className="w-full flex flex-col gap-4 p-5 bg-gray-100 rounded-lg mb-4 shadow-inner relative"
              >
                <TrashIcon
                  onClick={() => removeWorkout(workoutIndex)}
                  className="w-4 h-4 absolute top-1 right-1  text-red-400 hover:text-red-600 cursor-pointer"
                />
                <input
                  type="text"
                  placeholder="Workout Name"
                  value={workout.name}
                  onChange={(e) =>
                    updateWorkoutName(workoutIndex, e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
                <SortableContext
                  id={`workout-${workoutIndex}`}
                  items={workout.lifts.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {workout.lifts.length > 0 ? (
                    workout.lifts.map((lift, liftIndex) => (
                      <SortableLift
                        key={lift.id}
                        lift={lift}
                        workoutIndex={workoutIndex}
                        liftIndex={liftIndex}
                        updateSet={updateSet}
                        addSet={addSet}
                        removeSet={removeSet}
                        removeLift={removeLift}
                      />
                    ))
                  ) : (
                    <span className="flex gap-2 justify-center text-primary">
                      Add lifts from the lift library!{" "}
                      <ArrowRightIcon className="w-6 h-6" />{" "}
                    </span>
                  )}
                </SortableContext>
              </div>
            ) : (
              <div
                key={workout.id}
                className="w-full p-3 h-min bg-gray-100 rounded-lg space-y-4 mb-4 text-center cursor-pointer shadow-md"
                onClick={() => setActiveWorkoutIndex(workoutIndex)}
              >
                {workout.name || "New Workout"}
              </div>
            )
          )}
          <Button
            onClick={() => addWorkout()}
            type={"primary"}
            className="w-1/3"
          >
            Add Workout
          </Button>
        </DndContext>
      </div>

      {/* Searchable Lift List (1/3) */}
      <div className="w-1/3 h-full p-3 bg-gray-100 overflow-y-auto">
        <Input
          type="text"
          placeholder="Search Lifts"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="space-y-2">
          {filteredLifts.map((lift) => (
            <div
              key={lift.id}
              className="flex justify-between items-center p-2 bg-gray-100 rounded"
            >
              <span>{lift.name}</span>
              <button
                onClick={() => addLift(activeWorkoutIndex, lift)}
                className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => onSave(editedWorkouts)}
        className="absolute top-9 right-[10%] px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Save
      </button>
    </div>
  );
};

const SortableLift = ({
  lift,
  workoutIndex,
  liftIndex,
  updateSet,
  addSet,
  removeSet,
  removeLift,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lift.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center  p-2 bg-white rounded-lg space-y-2 relative"
    >
      <TrashIcon
        onClick={() => removeLift(workoutIndex, liftIndex)}
        className="w-4 h-4 absolute top-1 right-1  text-red-400 hover:text-red-600 cursor-pointer "
      />
      <div
        className="flex-shrink-0 pt-2 cursor-grab"
        {...attributes}
        {...listeners}
      >
        <Bars4Icon className="h-5 w-5 text-gray-500" />
      </div>
      <h2 className="w-5/12 p-2  rounded">{lift.name} </h2>
      <div className="grid grid-cols-[1fr_1fr_1fr] grid-rows-[16px_1fr_1fr] gap-y-1 w-full place-items-center">
        <h3>Sets</h3>
        <h3>Reps</h3>
        <h3>Weight</h3>
        {lift.reps.map((repsValue, setIndex) => (
          <React.Fragment key={`${lift.id}-set-${setIndex}`}>
            <span className="h-8 w-8 flex items-center justify-center input-field">
              {setIndex + 1}
            </span>
            <input
              value={repsValue === 0 ? "" : repsValue}
              onChange={(e) =>
                updateSet(
                  workoutIndex,
                  liftIndex,
                  setIndex,
                  "reps",
                  parseInt(e.target.value) || 0
                )
              }
              className="h-8 w-1/2 text-center input-field"
            />
            <input
              value={lift.weight[setIndex] === 0 ? "" : lift.weight[setIndex]}
              onChange={(e) =>
                updateSet(
                  workoutIndex,
                  liftIndex,
                  setIndex,
                  "weight",
                  parseInt(e.target.value) || 0
                )
              }
              className="h-8 w-1/2 text-center input-field"
            />
          </React.Fragment>
        ))}
        <div className="flex items-center gap-1 col-span-full">
          <MinusCircleIcon
            onClick={() => removeSet(workoutIndex, liftIndex)}
            className="w-6 h-6 text-red-400 hover:text-red-600 cursor-pointer"
          />
          <p className="text-xs">Sets</p>
          <PlusCircleIcon
            onClick={() => addSet(workoutIndex, liftIndex)}
            className="w-6 h-6 text-green-400 hover:text-green-600 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default WorkoutEditor;
