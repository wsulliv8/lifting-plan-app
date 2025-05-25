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
  ClockIcon,
  CheckIcon,
} from "@heroicons/react/20/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import Select from "../../components/common/Select.jsx";
import { updateWorkout } from "../../services/workouts.js";

const formatTime = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const calculateVolume = (lifts) => {
  return lifts.reduce((total, lift) => {
    const liftVolume = lift.weight_achieved.reduce((sum, weight, idx) => {
      return sum + weight * lift.reps_achieved[idx];
    }, 0);
    return total + liftVolume;
  }, 0);
};

const ActiveWorkout = () => {
  const initialWorkout = useLoaderData();
  const [workout, setWorkout] = useState(initialWorkout);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalVolume, setTotalVolume] = useState(() =>
    calculateVolume(workout.lifts)
  );
  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update volume when lifts change
  useEffect(() => {
    setTotalVolume(calculateVolume(workout.lifts));
  }, [workout.lifts]);

  const updateField = (exerciseIndex, setIndex, field, value) => {
    setWorkout((prev) => {
      const newLifts = [...prev.lifts];
      newLifts[exerciseIndex] = {
        ...newLifts[exerciseIndex],
        [field]:
          field.includes("achieved") ||
          field === "rest_time" ||
          field === "completed" ||
          field === "set_completed"
            ? field === "completed"
              ? value
              : field === "set_completed"
              ? [
                  ...newLifts[exerciseIndex][field].slice(0, setIndex),
                  value,
                  ...newLifts[exerciseIndex][field].slice(setIndex + 1),
                ]
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

  const handleSave = async () => {
    await updateWorkout(workout.plan_id, workout.plan_day, workout.lifts);
  };

  if (!workout || !workout.lifts || workout.lifts.length === 0)
    return <div className="p-4">No exercises available</div>;

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32 flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">
            {workout.plan?.name} - {workout.name}
          </h1>
          <div className="flex justify-center gap-20 text-sm text-gray-600">
            <div className="flex flex-col">
              <span className="text-sm">Duration</span>{" "}
              <span className="text-sm">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex flex-col ">
              <span className="text-sm">Volume</span>{" "}
              <span className="text-sm">{totalVolume} kg</span>
            </div>{" "}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {workout.lifts.map((lift, exerciseIndex) => (
            <SortableLift
              key={lift.id}
              lift={lift}
              exerciseIndex={exerciseIndex}
              updateField={updateField}
              updateNotes={updateNotes}
            />
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t z-50">
        <div className="max-w-2xl mx-auto flex justify-between gap-4">
          <Button
            onClick={handleSave}
            className="flex-1 bg-green-500 text-white"
          >
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
            className="flex-1 bg-blue-500 text-white"
          >
            Save Progress
          </Button>
        </div>
      </div>
    </div>
  );
};

const SortableLift = ({ lift, exerciseIndex, updateField, updateNotes }) => {
  const { setNodeRef } = useSortable({ id: lift.id });

  return (
    <div ref={setNodeRef} className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-semibold mb-2">{lift.name}</h2>

      <div className="mb-4">
        <textarea
          value={lift.notes || ""}
          onChange={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
            updateNotes(exerciseIndex, e.target.value);
          }}
          onFocus={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          placeholder="Add notes..."
          className="w-full p-2 border rounded text-sm min-h-[2.5rem] overflow-hidden"
          style={{ resize: "none" }}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-gray-500" />
        <span className="text-sm text-gray-600">Rest Timer:</span>
        <Select
          value={lift.rest_time[0] || 120}
          onChange={(e) =>
            updateField(exerciseIndex, 0, "rest_time", parseInt(e.target.value))
          }
          options={[
            { value: 60, label: "60s" },
            { value: 90, label: "90s" },
            { value: 120, label: "120s" },
            { value: 180, label: "180s" },
            { value: 240, label: "240s" },
          ]}
          className="w-16 p-0 text-center"
          containerClass="mb-0"
        />
      </div>

      <div className="grid grid-cols-[auto_auto_1fr_1fr_1fr] place-items-center gap-x-2 gap-y-1">
        <div className="contents text-center">
          <div className="flex items-center justify-center">
            <CheckIcon className="h-5 w-5 text-gray-300" />
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Set
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Weight
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Reps
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            RPE
          </div>
        </div>

        {Array.from({ length: lift.sets }).map((_, setIndex) => (
          <React.Fragment key={`${lift.id}-set-${setIndex}`}>
            <div className="flex items-center justify-center">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={lift.set_completed?.[setIndex] || false}
                  onChange={(e) =>
                    updateField(
                      exerciseIndex,
                      setIndex,
                      "set_completed",
                      e.target.checked
                    )
                  }
                  className="h-5 w-5 appearance-none border-2 border-gray-300 rounded checked:border-green-500 checked:bg-green-500 relative"
                />
                <CheckIcon
                  className={`absolute left-0.5 top-0.5 h-4 w-4 pointer-events-none ${
                    lift.set_completed?.[setIndex]
                      ? "text-white"
                      : "text-gray-300"
                  }`}
                />
              </div>
            </div>
            <div className="text-sm w-4 text-center">{setIndex + 1}</div>
            <Input
              type="number"
              value={
                lift.weight_achieved[setIndex] || lift.weight[setIndex] || ""
              }
              onChange={(e) =>
                updateField(
                  exerciseIndex,
                  setIndex,
                  "weight_achieved",
                  parseInt(e.target.value) || 0
                )
              }
              step={5}
              className="text-center w-20 p-1 mx-auto"
            />
            <Input
              type="number"
              value={lift.reps_achieved[setIndex] || lift.reps[setIndex] || ""}
              onChange={(e) =>
                updateField(
                  exerciseIndex,
                  setIndex,
                  "reps_achieved",
                  parseInt(e.target.value) || 0
                )
              }
              className="text-center w-20 p-1 mx-auto"
            />
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
              options={[...Array(10)].map((_, i) => ({
                value: i + 1,
                label: `${i + 1}`,
              }))}
              className="text-center w-20 p-1 mx-auto"
            />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ActiveWorkout;
