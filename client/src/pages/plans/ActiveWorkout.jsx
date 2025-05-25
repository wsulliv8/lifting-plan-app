import { useState, useEffect } from "react";
import React from "react";
import { useLoaderData } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TrashIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  Bars4Icon,
} from "@heroicons/react/20/solid";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import { updateWorkout } from "../../services/workouts.js";

const ActiveWorkout = () => {
  const initialWorkout = useLoaderData();
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState(null);

  // Initialize workout state
  useEffect(() => {
    if (!initialWorkout || !initialWorkout.lifts) {
      setError("No workout data available");
      return;
    }
    setWorkout({
      ...initialWorkout,
      lifts: initialWorkout.lifts.map((lift) => ({
        ...lift,
        sets: lift.sets || lift.reps.length,
        reps: lift.reps || Array(lift.sets).fill("0"),
        reps_achieved:
          lift.reps_achieved || lift.reps.map((r) => parseInt(r) || 0),
        weight: lift.weight || Array(lift.sets).fill(0),
        weight_achieved: lift.weight_achieved || lift.weight.map((w) => w || 0),
        rpe: lift.rpe || Array(lift.sets).fill(""),
        rpe_achieved:
          lift.rpe_achieved || lift.rpe.map((r) => (r ? parseInt(r) : null)),
        rest_time: lift.rest_time || Array(lift.sets).fill(120),
        volume: lift.volume || null,
        notes: lift.notes || "",
        completed: lift.completed || false,
      })),
    });
  }, [initialWorkout]);

  const updateField = (exerciseIndex, setIndex, field, value) => {
    setWorkout((prev) => {
      const newLifts = [...prev.lifts];
      newLifts[exerciseIndex] = {
        ...newLifts[exerciseIndex],
        [field]:
          field.includes("achieved") ||
          field === "rest_time" ||
          field === "completed"
            ? field === "completed"
              ? value
              : [
                  ...newLifts[exerciseIndex][field].slice(0, setIndex),
                  value,
                  ...newLifts[exerciseIndex][field].slice(setIndex + 1),
                ]
            : value,
      };
      return { ...prev, lifts: newLifts };
    });
  };

  const updateNotes = (exerciseIndex, value) => {
    setWorkout((prev) => {
      const newLifts = [...prev.lifts];
      newLifts[exerciseIndex] = { ...newLifts[exerciseIndex], notes: value };
      return { ...prev, lifts: newLifts };
    });
  };

  const addSet = (exerciseIndex) => {
    setWorkout((prev) => {
      const newLifts = [...prev.lifts];
      const lift = newLifts[exerciseIndex];
      newLifts[exerciseIndex] = {
        ...lift,
        sets: lift.sets + 1,
        reps: [...lift.reps, lift.reps[lift.reps.length - 1] || "0"],
        reps_achieved: [
          ...lift.reps_achieved,
          lift.reps_achieved[lift.reps_achieved.length - 1] || 0,
        ],
        weight: [...lift.weight, lift.weight[lift.weight.length - 1] || 0],
        weight_achieved: [
          ...lift.weight_achieved,
          lift.weight_achieved[lift.weight_achieved.length - 1] || 0,
        ],
        rpe: [...lift.rpe, lift.rpe[lift.rpe.length - 1] || ""],
        rpe_achieved: [
          ...lift.rpe_achieved,
          lift.rpe_achieved[lift.rpe_achieved.length - 1] || null,
        ],
        rest_time: [
          ...lift.rest_time,
          lift.rest_time[lift.rest_time.length - 1] || 120,
        ],
      };
      return { ...prev, lifts: newLifts };
    });
  };

  const removeSet = (exerciseIndex) => {
    setWorkout((prev) => {
      const newLifts = [...prev.lifts];
      const lift = newLifts[exerciseIndex];
      if (lift.sets <= 1) return prev; // Prevent removing last set
      newLifts[exerciseIndex] = {
        ...lift,
        sets: lift.sets - 1,
        reps: lift.reps.slice(0, -1),
        reps_achieved: lift.reps_achieved.slice(0, -1),
        weight: lift.weight.slice(0, -1),
        weight_achieved: lift.weight_achieved.slice(0, -1),
        rpe: lift.rpe.slice(0, -1),
        rpe_achieved: lift.rpe_achieved.slice(0, -1),
        rest_time: lift.rest_time.slice(0, -1),
      };
      return { ...prev, lifts: newLifts };
    });
  };

  const removeLift = (exerciseIndex) => {
    setWorkout((prev) => {
      const newLifts = prev.lifts.filter((_, index) => index !== exerciseIndex);
      return { ...prev, lifts: newLifts };
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    try {
      await updateWorkout(workout.plan_id, workout.plan_day, workout.lifts);
      // Redirect or show summary
    } catch (err) {
      setError("Failed to save workout");
    }
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!workout || !workout.lifts || workout.lifts.length === 0)
    return <div className="p-4">No exercises available</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold">
          {workout.plan?.name || "Workout"} - {workout.name}
        </h1>
        <div className="mt-2 text-sm">
          Progress: {workout.lifts.filter((ex) => ex.completed).length}/
          {workout.lifts.length}
        </div>
        <Button
          onClick={handlePrint}
          className="mt-2 bg-blue-500 text-white no-print"
        >
          Print Workout
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 print:p-0 print:bg-white">
        {workout.lifts.map((lift, exerciseIndex) => (
          <SortableLift
            key={lift.id}
            lift={lift}
            exerciseIndex={exerciseIndex}
            updateField={updateField}
            updateNotes={updateNotes}
            addSet={addSet}
            removeSet={removeSet}
            removeLift={removeLift}
          />
        ))}
      </div>
      <div className="p-4 flex justify-between no-print">
        <Button onClick={handleSave} className="bg-green-500 text-white">
          Finish Workout
        </Button>
        <Button
          onClick={() =>
            updateWorkout(
              workout.plan_id,
              workout.plan_day,
              workout.lifts,
              false
            )
          }
          className="bg-blue-500 text-white"
        >
          Save Progress
        </Button>
      </div>
    </div>
  );
};

const SortableLift = ({
  lift,
  exerciseIndex,
  updateField,
  updateNotes,
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
      className="flex flex-col p-2 bg-white rounded-lg space-y-2 relative mb-4 print:shadow-none print:p-2 print:mb-2"
    >
      <TrashIcon
        onClick={() => removeLift(exerciseIndex)}
        className="w-4 h-4 absolute top-1 right-1 text-red-400 hover:text-red-600 cursor-pointer no-print"
      />
      <div className="flex items-center">
        <div
          className="flex-shrink-0 pt-2 cursor-grab no-print"
          {...attributes}
          {...listeners}
        >
          <Bars4Icon className="h-5 w-5 text-gray-500" />
        </div>
        <h2 className="w-5/12 p-2 rounded text-lg font-semibold">
          {lift.name}
        </h2>
      </div>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr] grid-rows-[16px_repeat(auto-fill,_minmax(40px,_1fr))_40px] gap-y-1 w-full place-items-center print:border print:border-gray-300">
        <h3 className="print:text-sm">Set</h3>
        <h3 className="print:text-sm">Weight</h3>
        <h3 className="print:text-sm">Reps</h3>
        <h3 className="print:text-sm">RPE</h3>
        <h3 className="print:text-sm">Rest (s)</h3>
        {Array.from({ length: lift.sets }).map((_, setIndex) => (
          <React.Fragment key={`${lift.id}-set-${setIndex}`}>
            <span className="h-8 w-8 flex items-center justify-center input-field print:text-sm print:text-center">
              {setIndex + 1}
            </span>
            <div className="h-8 w-1/2 text-center input-field print:text-sm print:text-center">
              <span className="print:block">
                {lift.weight_achieved[setIndex]}
              </span>
              <Input
                type="number"
                value={
                  lift.weight_achieved[setIndex] === 0
                    ? ""
                    : lift.weight_achieved[setIndex]
                }
                onChange={(e) =>
                  updateField(
                    exerciseIndex,
                    setIndex,
                    "weight_achieved",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-8 w-full text-center no-print"
              />
            </div>
            <div className="h-8 w-1/2 text-center input-field print:text-sm print:text-center">
              <span className="print:block">
                {lift.reps_achieved[setIndex]}
              </span>
              <Input
                type="number"
                value={
                  lift.reps_achieved[setIndex] === 0
                    ? ""
                    : lift.reps_achieved[setIndex]
                }
                onChange={(e) =>
                  updateField(
                    exerciseIndex,
                    setIndex,
                    "reps_achieved",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-8 w-full text-center no-print"
              />
            </div>
            <div className="h-8 w-1/2 text-center input-field print:text-sm print:text-center">
              <span className="print:block">
                {lift.rpe_achieved[setIndex] || "-"}
              </span>
              <Select
                value={lift.rpe_achieved[setIndex] || ""}
                onChange={(e) =>
                  updateField(
                    exerciseIndex,
                    setIndex,
                    "rpe_achieved",
                    parseInt(e.target.value) || null
                  )
                }
                options={[...Array(10).keys()].map((i) => ({
                  value: i + 1,
                  label: `RPE ${i + 1}`,
                }))}
                className="h-8 w-full no-print"
              />
            </div>
            <div className="h-8 w-1/2 text-center input-field print:text-sm print:text-center">
              <span className="print:block">{lift.rest_time[setIndex]}</span>
              <Input
                type="number"
                value={
                  lift.rest_time[setIndex] === 0 ? "" : lift.rest_time[setIndex]
                }
                onChange={(e) =>
                  updateField(
                    exerciseIndex,
                    setIndex,
                    "rest_time",
                    parseInt(e.target.value) || 0
                  )
                }
                className="h-8 w-full text-center no-print"
              />
            </div>
          </React.Fragment>
        ))}
        <div className="flex items-center gap-1 col-span-5 no-print">
          <MinusCircleIcon
            onClick={() => removeSet(exerciseIndex)}
            className="w-6 h-6 text-red-400 hover:text-red-600 cursor-pointer"
          />
          <p className="text-xs">Sets</p>
          <PlusCircleIcon
            onClick={() => addSet(exerciseIndex)}
            className="w-6 h-6 text-green-400 hover:text-green-600 cursor-pointer"
          />
          <input
            type="checkbox"
            checked={lift.completed}
            onChange={() =>
              updateField(exerciseIndex, 0, "completed", !lift.completed)
            }
            className="ml-4"
          />
          <span className="text-sm">Completed</span>
        </div>
      </div>
      <div className="mt-2">
        <label className="block text-sm font-medium no-print">Notes</label>
        <textarea
          value={lift.notes || ""}
          onChange={(e) => updateNotes(exerciseIndex, e.target.value)}
          placeholder="Add notes..."
          className="w-full p-2 border rounded no-print"
        />
        <span className="print:block text-sm">{lift.notes || "-"}</span>
      </div>
    </div>
  );
};

export default ActiveWorkout;
