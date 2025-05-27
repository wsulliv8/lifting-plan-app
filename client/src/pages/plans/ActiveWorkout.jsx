import { useState, useEffect, useRef } from "react";
import React from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  TrashIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  Bars4Icon,
  ClockIcon,
  CheckIcon,
  ChevronDownIcon,
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
      return sum + (weight || 0) * (lift.reps_achieved[idx] || 0);
    }, 0);
    return total + liftVolume;
  }, 0);
};

const ActiveWorkout = () => {
  const initialWorkout = useLoaderData();
  const [workout, setWorkout] = useState(() => {
    return {
      ...initialWorkout,
      lifts: initialWorkout.lifts.map((lift) => ({
        ...lift,
        completed: false,
        set_completed: Array(lift.sets).fill(false),
        weight_achieved: lift.weight
          ? [...lift.weight]
          : Array(lift.sets).fill(null),
        reps_achieved: lift.reps ? [...lift.reps] : Array(lift.sets).fill(null),
        rpe_achieved: lift.rpe
          ? lift.rpe.map((val) => parseInt(val) || null)
          : Array(lift.sets).fill(null),
      })),
    };
  });
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalVolume, setTotalVolume] = useState(() =>
    calculateVolume(workout.lifts)
  );
  const navigate = useNavigate();
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTotalVolume(calculateVolume(workout.lifts));
  }, [workout.lifts]);

  const updateField = (exerciseIndex, setIndex, field, value) => {
    setWorkout((prev) => {
      const newLifts = [...prev.lifts];
      const lift = newLifts[exerciseIndex];

      if (!lift.set_completed)
        lift.set_completed = Array(lift.sets).fill(false);
      if (!lift.weight_achieved)
        lift.weight_achieved = lift.weight
          ? [...lift.weight]
          : Array(lift.sets).fill(null);
      if (!lift.reps_achieved)
        lift.reps_achieved = lift.reps
          ? [...lift.reps]
          : Array(lift.sets).fill(null);
      if (!lift.rpe_achieved)
        lift.rpe_achieved = lift.rpe
          ? lift.rpe.map((val) => parseInt(val) || null)
          : Array(lift.sets).fill(null);

      if (field === "set_completed") {
        lift.set_completed[setIndex] = value;
        // Update the overall completed status when a set is completed/uncompleted
        lift.completed = lift.set_completed.every(
          (complete) => complete === true
        );
        console.log(`Lift ${lift.name} completion status:`, {
          setIndex,
          value,
          set_completed: lift.set_completed,
          completed: lift.completed,
        });
      } else if (
        field === "weight_achieved" ||
        field === "reps_achieved" ||
        field === "rpe_achieved"
      ) {
        lift[field][setIndex] = value;
      } else {
        lift[field] = value;
      }

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
    console.log("Saving workout with lifts:", workout.lifts);
    const updatedLifts = workout.lifts.map((lift) => {
      console.log(`Lift ${lift.name} before save:`, {
        set_completed: lift.set_completed,
        completed: lift.completed,
      });
      return {
        ...lift,
        completed: lift.completed,
        // Keep all other fields
        id: lift.id,
        base_lift_id: lift.base_lift_id,
        name: lift.name,
        sets: lift.sets,
        reps: lift.reps,
        reps_achieved: lift.reps_achieved,
        weight: lift.weight,
        weight_achieved: lift.weight_achieved,
        rpe: lift.rpe || [],
        rpe_achieved: lift.rpe_achieved,
        rest_time: lift.rest_time,
        volume: lift.volume,
        notes: lift.notes,
        progression_rule: lift.progressionRule,
      };
    });

    console.log(
      "Updated lifts before save:",
      updatedLifts.map((l) => ({
        name: l.name,
        completed: l.completed,
      }))
    );

    await updateWorkout(workout.id, updatedLifts);
    navigate("/plans");
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

      <div className="fixed bottom-2 left-0 right-0 flex justify-center items-center">
        <div className="max-w-2xl mx-auto flex justify-between p-4 gap-4 z-50 bg-white border">
          <Button
            onClick={handleSave}
            className="flex-1 bg-green-500 text-white"
          >
            Finish
          </Button>
          <Button
            onClick={() => navigate("/plans")}
            className="flex-1 bg-red-500 text-white"
          >
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
};

const SortableLift = ({ lift, exerciseIndex, updateField, updateNotes }) => {
  const { setNodeRef } = useSortable({ id: lift.id });
  const isComplete = lift.completed;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [restTimers, setRestTimers] = useState(() => {
    return Array.from({ length: lift.sets }, (_, i) => ({
      remainingTime: lift.rest_time?.[i] || 120,
      initialTime: lift.rest_time?.[i] || 120,
      isRunning: false,
    }));
  });
  const timerRefs = useRef([]);

  useEffect(() => {
    // Initialize rest timers when lift changes
    setRestTimers(
      Array.from({ length: lift.sets }, (_, i) => ({
        remainingTime: lift.rest_time?.[i] || 120,
        initialTime: lift.rest_time?.[i] || 120,
        isRunning: lift.set_completed?.[i] || false,
      }))
    );
  }, [lift]);

  useEffect(() => {
    // Start/stop timers based on isRunning
    timerRefs.current = timerRefs.current.slice(0, lift.sets);
    restTimers.forEach((timer, index) => {
      if (timer.isRunning && timer.remainingTime > 0) {
        timerRefs.current[index] = setInterval(() => {
          setRestTimers((prev) => {
            const newTimers = [...prev];
            if (newTimers[index].remainingTime > 0) {
              newTimers[index] = {
                ...newTimers[index],
                remainingTime: newTimers[index].remainingTime - 1,
              };
            }
            return newTimers;
          });
        }, 1000);
      }
    });

    return () => {
      // Cleanup timers
      timerRefs.current.forEach((timer) => clearInterval(timer));
    };
  }, [restTimers, lift.sets]);

  const handleSetComplete = (setIndex, isChecked) => {
    updateField(exerciseIndex, setIndex, "set_completed", isChecked);
    setRestTimers((prev) => {
      const newTimers = [...prev];
      newTimers[setIndex] = {
        ...newTimers[setIndex],
        isRunning: isChecked,
        remainingTime: isChecked
          ? newTimers[setIndex].initialTime
          : newTimers[setIndex].initialTime,
      };
      return newTimers;
    });
    if (
      isChecked &&
      lift.set_completed.every((complete, i) => i === setIndex || complete)
    ) {
      setIsCollapsed(true);
    }
  };

  const getValueColor = (achieved, target, isRPE = false) => {
    if (achieved === undefined || achieved === null || achieved === "")
      return "text-gray-900";

    const achievedNum = parseInt(achieved);
    const targetNum = parseInt(target);

    if (isNaN(achievedNum) || isNaN(targetNum)) return "text-gray-900";

    if (isRPE) {
      if (achievedNum > targetNum) return "text-red-500";
      if (achievedNum < targetNum) return "text-green-500";
    } else {
      if (achievedNum < targetNum) return "text-red-500";
      if (achievedNum > targetNum) return "text-green-500";
    }
    return "text-gray-900";
  };

  if (isCollapsed) {
    return (
      <div
        ref={setNodeRef}
        onClick={() => setIsCollapsed(false)}
        className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:bg-gray-50"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold capitalize">
            {lift.name
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")}
            {isComplete && (
              <CheckIcon className="inline-block w-5 h-5 ml-2 text-green-500" />
            )}
          </h2>
          <ChevronDownIcon className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} className="bg-white rounded-lg shadow-sm p-4 pb-6">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold capitalize">
          {lift.name
            .split(" ")
            .map(
              (word) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
            .join(" ")}
        </h2>
        <ChevronDownIcon
          className="w-5 h-5 text-gray-600 cursor-pointer transform rotate-180 hover:text-gray-700"
          onClick={() => setIsCollapsed(true)}
        />
      </div>

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

      <div className="flex flex-col place-items-center gap-x-2 gap-y-5">
        <div
          className={`w-full grid ${
            lift.rpe.length > 0
              ? "grid-cols-[auto_auto_1fr_1fr_1fr]"
              : "grid-cols-[auto_auto_1fr_1fr]"
          } place-items-center gap-x-2`}
        >
          <div className="flex items-center justify-center w-8"></div>
          <div className="flex items-center justify-center text-sm font-medium">
            Set
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Weight
          </div>
          <div className="flex items-center justify-center text-sm font-medium">
            Reps
          </div>
          {lift.rpe.length > 0 ? (
            <div className="flex items-center justify-center text-sm font-medium">
              RPE
            </div>
          ) : null}
        </div>

        {Array.from({ length: lift.sets }).map((_, setIndex) => (
          <div
            key={`${lift.id}-set-${setIndex}`}
            className={`relative grid w-full ${
              lift.rpe.length > 0
                ? "grid-cols-[auto_auto_1fr_1fr_1fr]"
                : "grid-cols-[auto_auto_1fr_1fr]"
            } place-items-center gap-x-2`}
          >
            <div className="flex items-center justify-center w-8 h-8">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={lift.set_completed?.[setIndex] || false}
                  onChange={(e) =>
                    handleSetComplete(setIndex, e.target.checked)
                  }
                  className="h-5 w-5 appearance-none border-2 border-gray-300 rounded checked:border-green-500 checked:bg-green-500 relative"
                />
                <CheckIcon
                  className={`absolute h-4 w-4 pointer-events-none ${
                    lift.set_completed?.[setIndex]
                      ? "text-white"
                      : "text-gray-300"
                  }`}
                />
              </div>
            </div>
            <div className="text-sm w-4 text-center">{setIndex + 1}</div>
            <div className="flex flex-col items-center w-full">
              <Input
                type="text"
                value={lift.weight_achieved?.[setIndex] ?? ""}
                placeholder={lift.weight?.[setIndex] ?? ""}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  const numValue = value === "" ? null : parseInt(value);
                  updateField(
                    exerciseIndex,
                    setIndex,
                    "weight_achieved",
                    isNaN(numValue) ? null : numValue
                  );
                }}
                disabled={lift.set_completed?.[setIndex]}
                className={`text-center w-20 p-1 ${
                  lift.set_completed?.[setIndex] ? "bg-gray-100" : ""
                } ${getValueColor(
                  lift.weight_achieved?.[setIndex],
                  lift.weight?.[setIndex]
                )}`}
                containerClass="mb-0"
              />
            </div>
            <div className="flex flex-col items-center w-full">
              <Input
                type="text"
                value={lift.reps_achieved?.[setIndex] ?? ""}
                placeholder={lift.reps?.[setIndex] ?? ""}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  const numValue = value === "" ? null : parseInt(value);
                  updateField(
                    exerciseIndex,
                    setIndex,
                    "reps_achieved",
                    isNaN(numValue) ? null : numValue
                  );
                }}
                disabled={lift.set_completed?.[setIndex]}
                className={`text-center w-20 p-1 ${
                  lift.set_completed?.[setIndex] ? "bg-gray-100" : ""
                } ${getValueColor(
                  lift.reps_achieved?.[setIndex],
                  lift.reps?.[setIndex]
                )}`}
                containerClass="mb-0"
              />
            </div>
            {lift.rpe.length > 0 ? (
              <div className="flex flex-col items-center w-full">
                <Input
                  type="text"
                  value={lift.rpe_achieved?.[setIndex] ?? ""}
                  placeholder={lift.rpe?.[setIndex] ?? ""}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    const numValue = value === "" ? null : parseInt(value);
                    const validValue =
                      numValue !== null
                        ? Math.min(Math.max(numValue, 1), 10)
                        : null;
                    updateField(
                      exerciseIndex,
                      setIndex,
                      "rpe_achieved",
                      isNaN(validValue) ? null : validValue
                    );
                  }}
                  disabled={lift.set_completed?.[setIndex]}
                  className={`text-center w-20 p-1 ${
                    lift.set_completed?.[setIndex] ? "bg-gray-100" : ""
                  } ${getValueColor(
                    lift.rpe_achieved?.[setIndex],
                    lift.rpe?.[setIndex],
                    true
                  )}`}
                  containerClass="mb-0"
                />
              </div>
            ) : null}
            {lift.rest_time?.[setIndex] ? (
              <RestTimeIndicator
                restTime={restTimers[setIndex].remainingTime}
                progress={
                  restTimers[setIndex].remainingTime /
                  restTimers[setIndex].initialTime
                }
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
};

const RestTimeIndicator = ({ restTime, progress }) => {
  return (
    <div className="absolute -bottom-[0.6rem] left-4 right-4 flex items-center justify-center">
      <div
        className="relative w-full flex items-center"
        style={{
          transform: `scaleX(${progress})`,
          transformOrigin: "center",
          transition: "transform 1s linear",
        }}
      >
        <div className="absolute left-0 w-12 h-[2px] bg-gradient-to-r from-white via-blue-200/50 to-blue-200"></div>
        <div className="h-[2px] w-[calc(100%-96px)] mx-12 bg-blue-200"></div>
        <div className="absolute right-0 w-12 h-[2px] bg-gradient-to-l from-white via-blue-200/50 to-blue-200"></div>
      </div>
      <span className="absolute bg-white px-1 text-xs text-blue-500">
        {restTime}s
      </span>
    </div>
  );
};

export default ActiveWorkout;
