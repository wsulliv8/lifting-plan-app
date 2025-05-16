import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

// Custom debounce hook to avoid excessive re-rendering with drag and drop
const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

const PlanEditor = () => {
  const { plan: initialPlan, baseLifts } = useLoaderData();
  const [plan, setPlan] = useState(initialPlan);

  // only track workouts and total days (derive everything else)
  const [workouts, setWorkouts] = useState(() =>
    plan.weeks.flatMap((week, weekIndex) =>
      week.days.flatMap((day, dayIndex) =>
        day.workouts.map((workout) => ({
          ...workout,
          dayId: weekIndex * 7 + dayIndex,
        }))
      )
    )
  );

  // memoize to only render days that change
  const workoutsByDay = useMemo(() => {
    const map = {};
    workouts.forEach((w) => {
      map[w.dayId] ||= [];
      map[w.dayId].push(w);
    });
    return map;
  }, [workouts]);

  // Debounced setWorkouts
  const debouncedSetWorkouts = useDebounce(setWorkouts, 50); // 100ms delay

  const [totalDays, setTotalDays] = useState(() => plan.weeks.length * 7);
  const weeks = useMemo(() => {
    const days = Array.from({ length: totalDays }, (_, i) => i);
    return chunk(days, 7);
  }, [totalDays]);

  // set when user grabs a workout
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
  // Grid styling
  const gridTemplateColumns = useMemo(
    () =>
      `2rem ${Array(7)
        .fill()
        .map((_, i) => (collapsedDays[i] ? "2rem" : "minmax(6rem, 1fr)"))
        .join(" ")}`,
    [collapsedDays]
  );

  const gridTemplateRows = useMemo(
    () =>
      `2rem ${weeks
        .map((_, weekIndex) =>
          collapsedWeeks.has(weekIndex) ? "2rem" : "minmax(7rem, auto)"
        )
        .join(" ")}`,
    [weeks, collapsedWeeks]
  );

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoriesChange = (selectedCategories) => {
    setFormInputs((prev) => ({
      ...prev,
      categories: selectedCategories,
    }));
  };

  const handleSubmit = async (e) => {
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
  };

  const toggleWeekCollapse = (weekIndex) => {
    const newCollapsedWeeks = new Set(collapsedWeeks);
    if (newCollapsedWeeks.has(weekIndex)) {
      newCollapsedWeeks.delete(weekIndex);
    } else {
      newCollapsedWeeks.add(weekIndex);
    }
    setCollapsedWeeks(newCollapsedWeeks);
  };

  const toggleDayCollapse = (dayIndex) => {
    setCollapsedDays((prev) => {
      const newCollapsedDays = [...prev];
      newCollapsedDays[dayIndex] = !newCollapsedDays[dayIndex];
      return newCollapsedDays;
    });
  };

  const handleDragOver = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = active.id;
      const overId = over.id;
      const isActiveAWorkout = active.data.current?.type === "Workout";

      if (!isActiveAWorkout) return;

      debouncedSetWorkouts((workouts) => {
        const activeIndex = workouts.findIndex((w) => w.id === activeId);
        if (activeIndex === -1) {
          console.log("Active workout not found:", activeId);
          return workouts;
        }

        const newWorkouts = [...workouts];

        if (over.data.current?.type === "Workout") {
          const overIndex = workouts.findIndex((w) => w.id === overId);
          if (overIndex === -1) {
            console.log("Over workout not found:", overId);
            return workouts;
          }

          newWorkouts[activeIndex] = {
            ...newWorkouts[activeIndex],
            dayId: newWorkouts[overIndex].dayId,
          };
          const updatedWorkouts = arrayMove(
            newWorkouts,
            activeIndex,
            overIndex
          );
          return updatedWorkouts;
        }

        if (over.data.current?.type === "Day") {
          newWorkouts[activeIndex] = {
            ...newWorkouts[activeIndex],
            dayId: overId,
          };
          return [...newWorkouts];
        }

        return workouts;
      });
    },
    [debouncedSetWorkouts]
  );

  const handleEditWorkout = useCallback(
    (dayId) => {
      setEditingDay({
        dayId,
        workouts: workouts.filter((workout) => workout.dayId === dayId),
      });
    },
    [workouts]
  );

  const saveEditedWorkouts = (newWorkouts) => {
    setWorkouts((prevWorkouts) => [
      ...prevWorkouts.filter((w) => w.dayId !== editingDay.dayId),
      ...newWorkouts,
    ]);
    setEditingDay(null);
  };

  const handleSave = async () => {
    // Recreate an array of days indexed by dayId
    const dayMap = Array.from({ length: totalDays }, () => []);

    // Fill dayMap with workouts
    workouts.forEach((workout) => {
      if (dayMap[workout.dayId]) {
        dayMap[workout.dayId].push(workout);
      }
    });

    // Split days back into weeks of 7
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
  };

  const stripIds = (plan) => {
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
  };

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={() => setActiveWorkout(null)}
      onDragOver={handleDragOver}
      onDragStart={(event) =>
        setActiveWorkout(event.active.data.current.workout)
      }
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
          <Button onClick={() => handleSave()} className="bg-green-600">
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
        <div
          className="grid gap-2 w-full"
          style={{ gridTemplateColumns, gridTemplateRows }}
        >
          <div></div>
          {Array(7)
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
            ))}
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className={`contents`}>
              <div
                className={`bg-gray-50 p-2 font-medium cursor-pointer hover:bg-gray-200 flex items-center justify-center writing-vertical-rl rotate-180 h-full whitespace-nowrap rounded relative group ${
                  collapsedWeeks.has(weekIndex)
                    ? "text-gray-400"
                    : "text-gray-800"
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
                    onClick={(e) => {
                      if (!collapsedWeeks.has(weekIndex)) {
                        e.stopPropagation();

                        const deletedStart = weekIndex * 7;
                        const deletedEnd = deletedStart + 6;

                        setWorkouts((prevWorkouts) =>
                          prevWorkouts
                            .filter(
                              (w) =>
                                w.dayId < deletedStart || w.dayId > deletedEnd
                            )
                            .map((w) =>
                              w.dayId > deletedEnd
                                ? { ...w, dayId: w.dayId - 7 }
                                : w
                            )
                        );

                        setTotalDays((prev) => Math.max(0, prev - 7));
                      }
                    }}
                  />
                </span>
              </div>
              {week.map((_, dayIndex) => (
                <Day
                  key={weekIndex * 7 + dayIndex}
                  id={weekIndex * 7 + dayIndex}
                  isDayCollapsed={collapsedDays[dayIndex]}
                  isWeekCollapsed={collapsedWeeks.has(weekIndex)}
                  handleEditWorkout={handleEditWorkout}
                  workouts={workoutsByDay[weekIndex * 7 + dayIndex] || []}
                />
              ))}
            </div>
          ))}
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

const FormContent = ({
  formData,
  handleInputChange,
  handleSubmit,
  handleCategoriesChange,
}) => {
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
};

export default PlanEditor;
