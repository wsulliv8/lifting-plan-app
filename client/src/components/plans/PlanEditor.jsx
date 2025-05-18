import { useState, useCallback, useEffect, useRef, useMemo, memo } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Day from "./Day";
import Modal from "../common/Modal";
import WorkoutEditor from "./WorkoutEditor";
import Workout from "./Workout";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import MultiSelect from "../common/MultiSelect";
import TextArea from "../common/TextArea";
import { savePlan } from "../../services/plans";
import {
  PlusCircleIcon,
  TrashIcon,
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/solid";
import chunk from "lodash/chunk";

// Better debounce implementation
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update the callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );
};

// Memoized form component
const FormContent = memo(
  ({ formData, handleInputChange, handleSubmit, handleCategoriesChange }) => {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <Input
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          containerClass="w-3/4"
        />
        <Input
          label="Goal"
          name="goal"
          value={formData.goal}
          onChange={handleInputChange}
          containerClass="w-3/4"
          placeholder="e.g., Strength, Hypertrophy"
        />
        <div className="w-3/4">
          <label className="block text-sm font-normal text-gray-700 mb-1">
            Categories
          </label>
          <MultiSelect
            value={formData.categories || []}
            onChange={handleCategoriesChange}
            options={[
              { value: "Upper Body", label: "Upper Body" },
              { value: "Lower Body", label: "Lower Body" },
              { value: "Full Body", label: "Full Body" },
              { value: "Barbell", label: "Barbell" },
              { value: "Compound", label: "Compound" },
            ]}
          />
        </div>
        <Select
          label="Difficulty"
          name="difficulty"
          value={formData.difficulty}
          onChange={handleInputChange}
          containerClass="w-3/4"
          options={[
            { value: "Beginner", label: "Beginner" },
            { value: "Intermediate", label: "Intermediate" },
            { value: "Advanced", label: "Advanced" },
          ]}
        />
        <TextArea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          containerClass="w-3/4"
        />
        <button
          type="submit"
          className="px-4 py-2 w-1/2 text-white bg-green-500 rounded hover:bg-green-600 m-auto"
        >
          Save
        </button>
      </form>
    );
  }
);

const PlanEditor = () => {
  const { plan: initialPlan, baseLifts } = useLoaderData();
  const [plan, setPlan] = useState(initialPlan);

  // Use a Map for efficient workout lookup and updates
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

  const workoutsRef = useRef(workouts);
  useEffect(() => {
    workoutsRef.current = workouts;
  }, [workouts]);

  const [totalDays, setTotalDays] = useState(() => plan.weeks.length * 7);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());
  const [collapsedDays, setCollapsedDays] = useState(Array(7).fill(false));
  const [editingDay, setEditingDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const [formInputs, setFormInputs] = useState({
    name: plan.name ? plan.name : "New Plan",
    goal: plan.goal,
    categories: plan.categories || [],
    difficulty: plan.difficulty,
    description: plan.description,
  });

  // Memoize the weeks calculation
  const weeks = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => i);
    return chunk(days, 7);
  }, [totalDays]);

  // Memoize the workouts by day calculation
  const workoutsByDay = useMemo(() => {
    const map = new Map();
    workouts.forEach((workout) => {
      const dayId = workout.dayId;
      if (!map.has(dayId)) {
        map.set(dayId, []);
      }
      map.get(dayId).push(workout);
    });

    // Convert workout maps to plain objects for each day
    const result = new Map();
    map.forEach((workoutsArray, dayId) => {
      result.set(
        dayId,
        workoutsArray.map((workout) => ({ ...workout }))
      );
    });

    return result;
  }, [workouts]);

  // Grid styling - memoized
  const gridStyle = useMemo(() => {
    return {
      gridTemplateColumns: `2rem ${Array(7)
        .fill()
        .map((_, i) => (collapsedDays[i] ? "2rem" : "minmax(6rem, 1fr)"))
        .join(" ")}`,
      gridTemplateRows: `2rem ${weeks
        .map((_, weekIndex) =>
          collapsedWeeks.has(weekIndex) ? "2rem" : "minmax(7rem, auto)"
        )
        .join(" ")}`,
    };
  }, [weeks.length, collapsedWeeks, collapsedDays]);

  useEffect(() => {
    if (isModalOpen) {
      setFormInputs({
        name: plan.name || "New Plan",
        goal: plan.goal || "",
        categories: plan.categories || [],
        difficulty: plan.difficulty || "",
        description: plan.description || "",
      });
    }
  }, [isModalOpen, plan]);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleCategoriesChange = useCallback((selectedCategories) => {
    setFormInputs((prev) => ({
      ...prev,
      categories: selectedCategories,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const updatedPlan = {
        ...plan,
        name: formInputs.name,
        goal: formInputs.goal,
        categories: formInputs.categories,
        difficulty: formInputs.difficulty,
        description: formInputs.description,
      };
      setPlan(updatedPlan);
      await savePlan(stripIds(updatedPlan));
      setIsModalOpen(false);
    },
    [formInputs, plan]
  );

  const toggleWeekCollapse = useCallback((weekIndex) => {
    setCollapsedWeeks((prev) => {
      const newCollapsedWeeks = new Set(prev);
      if (newCollapsedWeeks.has(weekIndex)) {
        newCollapsedWeeks.delete(weekIndex);
      } else {
        newCollapsedWeeks.add(weekIndex);
      }
      return newCollapsedWeeks;
    });
  }, []);

  const toggleDayCollapse = useCallback((dayIndex) => {
    setCollapsedDays((prev) => {
      const newCollapsedDays = [...prev];
      newCollapsedDays[dayIndex] = !newCollapsedDays[dayIndex];
      return newCollapsedDays;
    });
  }, []);

  // Optimized drag and drop handler
  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id;
    const overId = over.id;
    const isActiveAWorkout = active.data.current?.type === "Workout";

    if (!isActiveAWorkout) return;

    const currentWorkouts = new Map(workoutsRef.current); // Get latest workouts

    const activeWorkout = currentWorkouts.get(activeId);
    if (!activeWorkout) return;

    if (over.data.current?.type === "Workout") {
      const overWorkout = currentWorkouts.get(overId);
      if (!overWorkout) return;

      if (activeWorkout.dayId !== overWorkout.dayId) {
        currentWorkouts.set(activeId, {
          ...activeWorkout,
          dayId: overWorkout.dayId,
        });
        setWorkouts(new Map(currentWorkouts)); // Create a new Map to trigger re-render
      }

      // arrayMove is not needed with a Map, but if you need to reorder within the day:
      //  (You'd need to track order within the day separately in the workout object)
    } else if (over.data.current?.type === "Day") {
      const targetDayId = overId;
      if (activeWorkout.dayId !== targetDayId) {
        currentWorkouts.set(activeId, {
          ...activeWorkout,
          dayId: targetDayId,
        });
        setWorkouts(new Map(currentWorkouts)); // Create a new Map to trigger re-render
      }
    }
  }, []);

  const handleEditWorkout = useCallback((dayId) => {
    setEditingDay({
      dayId,
      workouts: workoutsRef.current.filter(
        (workout) => workout.dayId === dayId
      ),
    });
  }, []);

  const saveEditedWorkouts = useCallback(
    (newWorkouts) => {
      setWorkouts((prevWorkouts) => {
        const updatedWorkouts = new Map(prevWorkouts);
        // Delete old workouts for the day
        prevWorkouts.forEach((workout) => {
          if (workout.dayId === editingDay.dayId) {
            updatedWorkouts.delete(workout.id);
          }
        });
        // Add the new workouts
        newWorkouts.forEach((workout) => {
          updatedWorkouts.set(workout.id, workout);
        });
        return new Map(updatedWorkouts); // Create a new Map to trigger re-render
      });
      setEditingDay(null);
    },
    [editingDay]
  );

  // Memoize the stripIds function
  const stripIds = useCallback((plan) => {
    return {
      ...plan,
      weeks: plan.weeks.map((week) => ({
        ...week,
        days: week.days.map((day) => ({
          ...day,
          workouts: day.workouts.map((workout) => {
            const { id: _workoutId, ...workoutWithoutId } = workout;
            return {
              ...workoutWithoutId,
              lifts: workout.lifts.map((lift) => {
                const { id: _liftId, ...liftWithoutId } = lift;
                return {
                  ...liftWithoutId,
                  reps: liftWithoutId.reps.map((num) => num.toString()),
                };
              }),
            };
          }),
        })),
      })),
    };
  }, []);

  const handleSave = useCallback(async () => {
    const dayMap = Array.from({ length: totalDays }, () => []);

    workoutsRef.current.forEach((workout) => {
      if (workout.dayId < totalDays) {
        dayMap[workout.dayId].push(workout);
      }
    });

    const weeks = chunk(dayMap, 7);

    const rebuiltPlan = {
      ...plan,
      weeks: weeks.map((weekDays, weekIndex) => ({
        week_number: weekIndex + 1,
        days: weekDays.map((dayWorkouts, dayIndex) => ({
          day_of_week: dayIndex,
          workouts: dayWorkouts
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((w) => ({
              id: w.id,
              name: w.name,
              lifts: w.lifts.map((lift) => ({
                id: lift.id,
                name: lift.name,
                sets: lift.sets,
                reps: lift.reps,
                weight: lift.weight,
                base_lift_id: lift.base_lift_id,
              })),
            })),
        })),
      })),
    };

    setPlan(rebuiltPlan);
    await savePlan(stripIds(rebuiltPlan));
  }, [plan, totalDays, stripIds]);

  // Memoize the week deletion handler
  const handleDeleteWeek = useCallback((weekIndex, e) => {
    e.stopPropagation();

    const deletedStart = weekIndex * 7;
    const deletedEnd = deletedStart + 6;

    setWorkouts((prevWorkouts) => {
      const updatedWorkouts = new Map(prevWorkouts);
      prevWorkouts.forEach((workout) => {
        if (workout.dayId < deletedStart || workout.dayId > deletedEnd) {
          if (workout.dayId > deletedEnd) {
            updatedWorkouts.set(workout.id, {
              ...workout,
              dayId: workout.dayId - 7,
            });
          } else {
            updatedWorkouts.set(workout.id, workout);
          }
        } else {
          updatedWorkouts.delete(workout.id);
        }
      });
      return new Map(updatedWorkouts); // Create a new Map to trigger re-render
    });

    setTotalDays((prev) => Math.max(0, prev - 7));
  }, []);

  // Rendering optimization for the header days
  const headerDays = useMemo(() => {
    return Array(7)
      .fill()
      .map((_, dayIndex) => (
        <div
          key={`header-day-${dayIndex}`}
          className={`bg-gray-50 p-1 font-medium cursor-pointer hover:bg-gray-200 place-self-center w-full rounded text-center sticky -top-2 z-10 ${
            collapsedDays[dayIndex] ? "text-gray-400" : "text-gray-800"
          }`}
          onClick={() => toggleDayCollapse(dayIndex)}
        >
          {!collapsedDays[dayIndex] ? "Day" : ""} {dayIndex + 1}
        </div>
      ));
  }, [collapsedDays, toggleDayCollapse]);

  // Use drag start handler reference
  const handleDragStart = useCallback((event) => {
    if (event.active.data.current?.workout) {
      setActiveWorkout(event.active.data.current.workout);
    }
  }, []);

  // Render weeks once and memoize
  const renderedWeeks = useMemo(() => {
    return weeks.map((week, weekIndex) => (
      <div key={`week-${weekIndex}`} className="contents">
        <div
          className={`bg-gray-50 p-2 font-medium cursor-pointer hover:bg-gray-200 flex items-center justify-center writing-vertical-rl rotate-180 h-full whitespace-nowrap rounded relative group ${
            collapsedWeeks.has(weekIndex) ? "text-gray-400" : "text-gray-800"
          }`}
          onClick={() => toggleWeekCollapse(weekIndex)}
        >
          {!collapsedWeeks.has(weekIndex) ? "Week" : ""} {weekIndex + 1}
          <span>
            <TrashIcon
              className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 h-4 w-4 text-red-400 hover:text-red-600 rotate-90 opacity-0 ${
                collapsedWeeks.has(weekIndex)
                  ? "opacity-0"
                  : "group-hover:opacity-100"
              }`}
              onClick={(e) => handleDeleteWeek(weekIndex, e)}
            />
          </span>
        </div>
        {week.map((_, dayIndex) => {
          const actualDayId = weekIndex * 7 + dayIndex;
          return (
            <Day
              key={actualDayId}
              id={actualDayId}
              isDayCollapsed={collapsedDays[dayIndex]}
              isWeekCollapsed={collapsedWeeks.has(weekIndex)}
              handleEditWorkout={handleEditWorkout}
              workouts={workoutsByDay.get(actualDayId) || []} // Pass only the relevant workouts
            />
          );
        })}
      </div>
    ));
  }, [
    weeks,
    collapsedWeeks,
    collapsedDays,
    toggleWeekCollapse,
    handleEditWorkout,
    workoutsByDay,
    handleDeleteWeek,
  ]);

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={() => setActiveWorkout(null)}
      onDragOver={handleDragOver}
      onDragStart={handleDragStart}
    >
      <div className="w-full h-full">
        <div className="flex justify-between mb-4">
          <span
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/plans/")}
          >
            <ArrowLeftIcon className="w-6 h-6" />
            <span>(To Plans)</span>
          </span>
          <span className="flex items-center gap-2">
            <h2 className="heading">{plan.name ? plan.name : "New Plan"}</h2>
            <AdjustmentsHorizontalIcon
              className="w-5 cursor-pointer"
              onClick={() => setIsModalOpen(!isModalOpen)}
            />
          </span>
          <Button onClick={handleSave} className="bg-green-600">
            Save
          </Button>
        </div>

        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            title="Plan Settings"
            className="w-3/4"
          >
            <FormContent
              formData={formInputs}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              handleCategoriesChange={handleCategoriesChange}
            />
          </Modal>
        )}

        <div className="grid gap-2 w-full" style={gridStyle}>
          <div></div>
          {headerDays}
          {renderedWeeks}
        </div>

        <div className="mt-4 flex justify-center">
          <PlusCircleIcon
            className="h-8 w-8 text-green-500 hover:text-green-600 cursor-pointer"
            onClick={() => setTotalDays((prev) => prev + 7)}
          />
        </div>
      </div>

      <Modal
        isOpen={editingDay !== null}
        onClose={() => setEditingDay(null)}
        title={`Week ${
          editingDay ? Math.floor(editingDay.dayId / 7) + 1 : ""
        } Day ${editingDay ? (editingDay.dayId % 7) + 1 : ""}`}
        className="w-[95vw] h-[95vh]"
      >
        {editingDay && (
          <WorkoutEditor
            workouts={editingDay.workouts}
            baseLifts={baseLifts}
            onSave={saveEditedWorkouts}
            dayId={editingDay.dayId}
          />
        )}
      </Modal>

      {createPortal(
        <DragOverlay>
          {activeWorkout && (
            <Workout id={activeWorkout.id} workout={activeWorkout} />
          )}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};

export default PlanEditor;
