import React from "react";
import {
  useState,
  useMemo,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
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
  ArrowUpIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import {
  PlusCircleIcon,
  MinusCircleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import Button from "../../common/Button";
import LiftSearch from "../../lifts/LiftSearch";
import LiftSearchModal from "../../lifts/LiftSearchModal";
import progressionRules from "../../../utils/progressionRules";
import { useTheme } from "../../../context/useTheme";

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
  userLiftsData,
  experience,
  onWorkoutsChange,
}) => {
  const { screenSize } = useTheme();
  const [editedWorkouts, setEditedWorkouts] = useState(
    initialWorkouts && initialWorkouts.length > 0
      ? initialWorkouts
      : [{ id: `temp_${Date.now()}`, dayId, name: "", lifts: [] }]
  );
  const [isLiftSearchOpen, setIsLiftSearchOpen] = useState(false);

  // Add effect to notify parent of workouts changes
  useEffect(() => {
    onWorkoutsChange?.(editedWorkouts);
  }, [editedWorkouts, onWorkoutsChange]);

  const [activeWorkoutIndex, setActiveWorkoutIndex] = useState(0);
  const [scrollTrigger, setScrollTrigger] = useState(null); // Track when to scroll
  const scrollContainerRef = useRef(null); // Ref for the scrollable container
  const workoutRefs = useRef([]); // Refs for workout containers to get position

  const userLiftsMap = useMemo(
    () => new Map(userLiftsData.map((data) => [data.base_lift_id, data])),
    [userLiftsData]
  );

  const updateEditedWorkouts = useCallback((updater) => {
    setEditedWorkouts(updater);
  }, []);

  // Scroll to the active workout's bottom after adding a lift
  useLayoutEffect(() => {
    if (
      scrollTrigger !== null &&
      scrollContainerRef.current &&
      workoutRefs.current[scrollTrigger]
    ) {
      const scrollContainer = scrollContainerRef.current;
      const workoutContainer = workoutRefs.current[scrollTrigger];
      const clientHeight = scrollContainer.clientHeight;
      const workoutBottom =
        workoutContainer.offsetTop + workoutContainer.offsetHeight;

      // Scroll to the bottom of the active workout
      scrollContainer.scrollTo({
        top: workoutBottom - clientHeight + 20, // Small padding
        behavior: "smooth",
      });

      setScrollTrigger(null); // Reset trigger
    }
  }, [scrollTrigger]);

  // Update functions
  const updateWorkoutName = (workoutIndex, value) => {
    const updated = [...editedWorkouts];
    updated[workoutIndex].name = value;
    setEditedWorkouts(updated);
  };

  const addLift = (baseLift) => {
    let updated = [...editedWorkouts];
    if (!updated[activeWorkoutIndex]) updated = addWorkout();
    const userLift = userLiftsMap.get(baseLift.id);
    const progressionRule = progressionRules.computeProgressionRule(
      baseLift.lift_type === "Main" ? "primary" : "supplementary",
      experience
    );
    let reps = [8, 8, 8];
    let weight = [0, 0, 0];
    let rpe = ["8", "8", "8"];
    let rest = ["120", "120", "120"];

    if (userLift && userLift.rep_range_progress?.rep_ranges) {
      // Get available rep ranges from the new structure
      const availableRepRanges = Object.keys(
        userLift.rep_range_progress.rep_ranges
      ).map(Number);

      if (availableRepRanges.length > 0) {
        // Find the rep range closest to 8, or use the first available
        const targetReps = 8;
        const closestRepRange = availableRepRanges.reduce(
          (closest, current) => {
            const currentDiff = Math.abs(current - targetReps);
            const closestDiff = Math.abs(closest - targetReps);
            return currentDiff < closestDiff ? current : closest;
          }
        );

        const repRangeData =
          userLift.rep_range_progress.rep_ranges[closestRepRange];
        if (repRangeData?.current?.weight) {
          reps = Array(3).fill(closestRepRange);
          weight = Array(3).fill(repRangeData.current.weight);
        }
      }
    }

    const newLift = {
      id: `temp_${Date.now()}_${Math.random()}`,
      name: baseLift.name,
      base_lift_id: baseLift.id,
      reps,
      weight,
      sets: 3,
      progressionRule,
      rpe,
      rest,
      showRPE: baseLift.lift_type === "Main",
      showRest: true,
    };
    updated[activeWorkoutIndex].lifts.push(newLift);
    setEditedWorkouts(updated);
    setScrollTrigger(activeWorkoutIndex);
  };

  const addMultipleLifts = (baseLifts) => {
    let updated = [...editedWorkouts];
    if (!updated[activeWorkoutIndex]) {
      updated = addWorkout();
    }

    baseLifts.forEach((baseLift) => {
      const userLift = userLiftsMap.get(baseLift.id);
      const progressionRule = progressionRules.computeProgressionRule(
        baseLift.lift_type === "Main" ? "primary" : "supplementary",
        experience
      );
      let reps = [8, 8, 8];
      let weight = [0, 0, 0];
      let rpe = ["8", "8", "8"];
      let rest = ["120", "120", "120"];

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
        id: `temp_${Date.now()}_${Math.random()}`,
        name: baseLift.name,
        base_lift_id: baseLift.id,
        reps,
        weight,
        sets: 3,
        progressionRule,
        rpe,
        rest,
        showRPE: baseLift.lift_type === "Main",
        showRest: true,
      };
      updated[activeWorkoutIndex].lifts.push(newLift);
    });

    setEditedWorkouts(updated);
    setScrollTrigger(activeWorkoutIndex);
  };

  const updateSet = (workoutIndex, liftIndex, setIndex, field, value) => {
    const updated = [...editedWorkouts];
    const lift = updated[workoutIndex].lifts[liftIndex];

    // Initialize arrays if they don't exist
    if (field === "rpe" && !lift.rpe) {
      lift.rpe = Array(lift.sets).fill("8");
    }
    if (field === "rest" && !lift.rest) {
      lift.rest = Array(lift.sets).fill("120");
    }

    const oldValue = lift[field][setIndex];

    if (field === "reps") {
      const baseLiftId = lift.base_lift_id;
      const userLift = userLiftsMap.get(baseLiftId);
      lift.reps[setIndex] = parseInt(value) || 0;

      // Always cascade rep changes first
      for (let i = setIndex + 1; i < lift.reps.length; i++) {
        if (lift.reps[i] === oldValue) {
          lift.reps[i] = parseInt(value) || 0;
        }
      }

      // Then handle weight calculations if userLift data exists
      if (userLift && value) {
        let closestIndex = -1;
        let smallestDiff = Infinity;

        userLift.rep_ranges.forEach((rep, idx) => {
          const diff = Math.abs(rep - value);
          if (diff < smallestDiff) {
            smallestDiff = diff;
            closestIndex = idx;
          }
        });

        if (smallestDiff <= 1) {
          const newWeight = userLift.max_weights[closestIndex];
          lift.weight[setIndex] = newWeight;

          // Cascade weight changes to sets that were updated with the same rep value
          for (let i = setIndex + 1; i < lift.weight.length; i++) {
            if (lift.reps[i] === parseInt(value)) {
              lift.weight[i] = newWeight;
            }
          }
        } else {
          lift.weight[setIndex] = 0;
          // Cascade zero weight to sets with the same rep value
          for (let i = setIndex + 1; i < lift.weight.length; i++) {
            if (lift.reps[i] === parseInt(value)) {
              lift.weight[i] = 0;
            }
          }
        }
      }
    } else {
      lift[field][setIndex] = value;

      // Cascade changes for RPE and Rest
      for (let i = setIndex + 1; i < lift[field].length; i++) {
        if (String(lift[field][i]) === String(oldValue)) {
          lift[field][i] = value;
        }
      }
    }

    setEditedWorkouts(updated);
  };

  const addSet = (workoutIndex, liftIndex) => {
    const updated = [...editedWorkouts];
    const lift = updated[workoutIndex].lifts[liftIndex];

    const prevSetReps = lift.reps.at(-1);
    const prevSetWeight = lift.weight.at(-1);
    const prevSetRPE = lift.rpe?.at(-1) || "8";
    const prevSetRest = lift.rest?.at(-1) || "120";

    lift.reps.push(prevSetReps);
    lift.weight.push(prevSetWeight);

    // Initialize or extend RPE and Rest arrays
    if (!lift.rpe) lift.rpe = Array(lift.sets).fill("8");
    if (!lift.rest) lift.rest = Array(lift.sets).fill("120");

    lift.rpe.push(prevSetRPE);
    lift.rest.push(prevSetRest);
    lift.sets++;
    setEditedWorkouts(updated);
  };

  const removeSet = (workoutIndex, liftIndex) => {
    const updated = [...editedWorkouts];
    updated[workoutIndex].lifts[liftIndex] = {
      ...updated[workoutIndex].lifts[liftIndex],
      reps: updated[workoutIndex].lifts[liftIndex].reps.slice(0, -1),
      weight: updated[workoutIndex].lifts[liftIndex].weight.slice(0, -1),
      rpe: updated[workoutIndex].lifts[liftIndex].rpe?.slice(0, -1) || [],
      rest: updated[workoutIndex].lifts[liftIndex].rest?.slice(0, -1) || [],
      sets: updated[workoutIndex].lifts[liftIndex].sets - 1,
    };

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
    const filtered = editedWorkouts.filter((_, i) => i !== workoutIndex);
    setEditedWorkouts(filtered);

    // Prefer the next workout (same index), fallback to previous
    const nextIndex =
      workoutIndex < filtered.length ? workoutIndex : filtered.length - 1;

    setActiveWorkoutIndex(nextIndex >= 0 ? nextIndex : null); // null if none left
  };

  const addWorkout = () => {
    const newWorkout = { id: `temp_${Date.now()}`, dayId, name: "", lifts: [] };
    const updated = [...editedWorkouts, newWorkout];
    setEditedWorkouts(updated);
    setActiveWorkoutIndex(updated.length - 1);
    return updated;
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
    <div
      className={`w-full h-full rounded-lg ${
        screenSize.isMobile ? "flex flex-col gap-4" : "flex gap-4"
      }`}
    >
      {/* Workouts and Lifts Section */}
      <div
        ref={scrollContainerRef}
        className={`flex flex-col h-full items-center ${
          screenSize.isMobile
            ? "w-full order-2 overflow-y-auto scrollbar-none"
            : "w-2/3 overflow-y-auto pr-2"
        } scrollbar-none`}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {editedWorkouts.map((workout, workoutIndex) =>
            workoutIndex === activeWorkoutIndex ? (
              <div
                key={workout.id}
                ref={(el) => (workoutRefs.current[workoutIndex] = el)}
                className={`w-full flex flex-col gap-4 border border-[var(--border)] rounded-lg mb-4 shadow-inner relative ${
                  screenSize.isMobile ? "overflow-x-hidden p-3" : "p-5"
                }`}
              >
                <TrashIcon
                  onClick={() => removeWorkout(workoutIndex)}
                  className="w-4 h-4 absolute top-1 right-1 text-[var(--danger)] hover:text-[var(--danger-dark)] cursor-pointer"
                />
                <div className="flex justify-center">
                  <input
                    type="text"
                    placeholder="Workout Name"
                    value={workout.name}
                    onChange={(e) =>
                      updateWorkoutName(workoutIndex, e.target.value)
                    }
                    className={`input-field ${
                      screenSize.isMobile ? "w-4/5" : ""
                    }`}
                  />
                </div>
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
                        setEditedWorkouts={updateEditedWorkouts}
                        isMobile={screenSize.isMobile}
                        isDesktop={screenSize.isDesktop}
                      />
                    ))
                  ) : (
                    <span className="flex gap-2 justify-center text-[var(--text-secondary)]">
                      {screenSize.isMobile ? (
                        "Click the button below to add lifts!"
                      ) : (
                        <>
                          Add lifts from the lift library!{" "}
                          <ArrowRightIcon className="w-6 h-6" />
                        </>
                      )}
                    </span>
                  )}
                </SortableContext>
                {screenSize.isMobile && (
                  <Button
                    variant="primary"
                    onClick={() => setIsLiftSearchOpen(true)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Add Lift
                  </Button>
                )}
              </div>
            ) : (
              <div
                key={workout.id}
                className="w-full p-3 h-min border border-[var(--border)] rounded-lg space-y-4 mb-4 text-center cursor-pointer shadow-md hover:bg-[var(--background)] text-[var(--text-primary)]"
                onClick={() => setActiveWorkoutIndex(workoutIndex)}
              >
                {workout.name || "New Workout"}
              </div>
            )
          )}
          <Button
            onClick={() => addWorkout()}
            variant="primary"
            className={screenSize.isMobile ? "w-full" : "w-1/3"}
          >
            Add Workout
          </Button>
        </DndContext>
      </div>

      {/* Desktop Lift Search */}
      {!screenSize.isMobile && (
        <div className="w-1/3 h-full flex justify-center items-center">
          <LiftSearch
            lifts={baseLifts}
            onSelectLift={addLift}
            className="w-[100%] h-[100%] shadow-md border border-[var(--border)] rounded-lg"
          />
        </div>
      )}

      {/* Mobile Lift Search Modal */}
      {screenSize.isMobile && (
        <LiftSearchModal
          isOpen={isLiftSearchOpen}
          onClose={() => setIsLiftSearchOpen(false)}
          lifts={baseLifts}
          onSelectLift={addMultipleLifts}
        />
      )}
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
  setEditedWorkouts,
  isMobile,
  isDesktop,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: lift.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [showRPE, setShowRPE] = useState(lift.showRPE ?? false);
  const [showRest, setShowRest] = useState(lift.showRest ?? false);

  // Update lift's showRPE and showRest when they change
  useEffect(() => {
    setEditedWorkouts((prevWorkouts) => {
      const updated = [...prevWorkouts];
      const lift = updated[workoutIndex].lifts[liftIndex];

      // Initialize arrays if they don't exist or if showing for the first time
      if (showRPE && (!lift.rpe || lift.rpe.length === 0)) {
        lift.rpe = Array(lift.sets).fill("8");
      }
      if (showRest && (!lift.rest || lift.rest.length === 0)) {
        lift.rest = Array(lift.sets).fill("120");
      }

      // Update visibility flags
      lift.showRPE = showRPE;
      lift.showRest = showRest;

      // If hiding, keep the arrays but empty them
      if (!showRPE) {
        lift.rpe = [];
      }
      if (!showRest) {
        lift.rest = [];
      }

      return updated;
    });
  }, [liftIndex, workoutIndex, showRPE, showRest, setEditedWorkouts]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col bg-[var(--surface)] space-y-2 relative ${
        isMobile
          ? "border-b border-[var(--border)] rounded-b-none pb-3"
          : "border border-[var(--border)] p-2 rounded-lg"
      }`}
    >
      <div
        className={`flex items-center ${
          !isDesktop ? "justify-between mx-2" : "justify-between"
        }`}
      >
        {!isDesktop ? (
          <>
            <div {...attributes} {...listeners} className="touch-none">
              <Bars3Icon className="w-6 h-6 text-[var(--text-secondary)] cursor-grab active:cursor-grabbing" />
            </div>
            <h2 className="p-2 rounded font-semibold text-center capitalize text-[var(--text-primary)]">
              {lift.name
                .split(" ")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ")}
            </h2>
          </>
        ) : (
          <h2
            className="w-full p-2 rounded cursor-grab font-semibold text-center capitalize text-[var(--text-primary)]"
            {...attributes}
            {...listeners}
          >
            {lift.name
              .split(" ")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ")}
          </h2>
        )}
        <TrashIcon
          onClick={() => removeLift(workoutIndex, liftIndex)}
          className="w-4 h-4 text-[var(--danger)] hover:text-[var(--danger-dark)] cursor-pointer"
        />
      </div>

      <div className="flex justify-center flex-1 w-full">
        {isDesktop && (
          <div className="flex items-center mr-8 ">
            <div {...attributes} {...listeners} className="touch-none">
              <Bars3Icon className="w-6 h-6 text-[var(--text-secondary)] cursor-grab active:cursor-grabbing" />
            </div>
          </div>
        )}
        <div
          className={`grid flex-0 ${
            isMobile
              ? showRPE && showRest
                ? "grid-cols-[30px_1fr_1fr_1fr_1fr] gap-x-1"
                : showRPE || showRest
                  ? "grid-cols-[30px_1fr_1fr_1fr] gap-x-2"
                  : "grid-cols-[30px_1fr_1fr] gap-x-3"
              : showRPE && showRest
                ? "grid-cols-[40px_minmax(60px,_120px)_minmax(60px,_120px)_minmax(60px,_120px)_minmax(60px,_120px)]"
                : showRPE || showRest
                  ? "grid-cols-[40px_minmax(70px,_120px)_minmax(70px,_120px)_minmax(70px,_120px)]"
                  : "grid-cols-[40px_minmax(80px,_120px)_minmax(80px,_120px)]"
          } grid-rows-[auto_1fr] auto-rows-auto gap-y-2 ${
            isMobile
              ? ""
              : "gap-x-2 sm:gap-x-1 md:gap-x-3 lg:gap-x-8 xl:gap-x-10"
          } place-items-center`}
        >
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Sets
          </h3>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Reps
          </h3>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">
            Weight
          </h3>
          {showRPE && (
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              RPE
            </h3>
          )}
          {showRest && (
            <h3 className="text-sm font-medium text-[var(--text-primary)]">
              Rest
            </h3>
          )}

          {lift.reps.map((repsValue, setIndex) => (
            <React.Fragment key={`${lift.id}-set-${setIndex}`}>
              <span
                className={`${
                  isMobile ? "h-8 w-6" : "h-8 w-8"
                } flex items-center justify-center text-[var(--text-secondary)]`}
              >
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
                className="input-field h-8 w-full text-center"
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
                className="input-field h-8 w-full text-center"
              />
              {showRPE && (
                <select
                  value={lift.rpe?.[setIndex] || "8"}
                  onChange={(e) =>
                    updateSet(
                      workoutIndex,
                      liftIndex,
                      setIndex,
                      "rpe",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  className="input-field h-8 w-full p-1 text-center"
                >
                  <option value="">-</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              )}
              {showRest && (
                <select
                  value={lift.rest?.[setIndex] || "120"}
                  onChange={(e) =>
                    updateSet(
                      workoutIndex,
                      liftIndex,
                      setIndex,
                      "rest",
                      e.target.value
                    )
                  }
                  className="input-field h-8 w-full p-1 text-center text-sm"
                >
                  <option value="60">60s</option>
                  <option value="90">90s</option>
                  <option value="120" defaultValue>
                    120s
                  </option>
                  <option value="180">180s</option>
                  <option value="240">240s</option>
                </select>
              )}
            </React.Fragment>
          ))}
          <div className="flex items-center gap-1 col-span-full">
            <MinusCircleIcon
              onClick={() => removeSet(workoutIndex, liftIndex)}
              className="w-6 h-6 text-[var(--danger)] hover:text-[var(--danger-dark)] cursor-pointer"
            />
            <p className="text-xs text-[var(--text-secondary)]">Sets</p>
            <PlusCircleIcon
              onClick={() => addSet(workoutIndex, liftIndex)}
              className="w-6 h-6 text-[var(--primary-light)] hover:text-[var(--primary)] cursor-pointer"
            />
          </div>
        </div>

        {/* Vertical Controls */}
        {lift.sets > 0 && (
          <div
            className={`flex ${
              !isMobile ? "flex-row" : "flex-col"
            } gap-2 ml-2 items-center`}
          >
            <div className="flex flex-col items-center gap-1 group">
              <span className="writing-vertical-rl rotate-180 text-xs cursor-default text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                Add RPE
              </span>
              {!showRPE ? (
                <PlusCircleIcon
                  className={`w-5 h-5 cursor-pointer text-[var(--primary-light)] hover:text-[var(--primary)]`}
                  onClick={() => setShowRPE(!showRPE)}
                />
              ) : (
                <MinusCircleIcon
                  className="w-5 h-5 text-[var(--danger)] hover:text-[var(--danger-dark)] cursor-pointer"
                  onClick={() => setShowRPE(false)}
                />
              )}
            </div>
            <div className="flex flex-col items-center gap-1 group">
              <span className="writing-vertical-rl rotate-180 text-xs cursor-default text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">
                Add Rest
              </span>
              {!showRest ? (
                <PlusCircleIcon
                  className={`w-5 h-5 cursor-pointer text-[var(--primary-light)] hover:text-[var(--primary)]`}
                  onClick={() => setShowRest(!showRest)}
                />
              ) : (
                <MinusCircleIcon
                  className="w-5 h-5 text-[var(--danger)] hover:text-[var(--danger-dark)] cursor-pointer"
                  onClick={() => setShowRest(false)}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutEditor;
