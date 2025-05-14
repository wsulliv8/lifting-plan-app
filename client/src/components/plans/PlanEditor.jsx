import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useLoaderData, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  useDroppable,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Day from "./Day";
import Workout from "./Workout";
import Modal from "../common/Modal";
import WorkoutEditor from "./WorkoutEditor";
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

const PlanEditor = () => {
  const { plan: initialPlan, baseLifts } = useLoaderData();
  const [plan, setPlan] = useState(initialPlan);
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

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    const isActiveAWorkout = active.data.current?.type === "Workout";
    const isOverAWorkout = over.data.current?.type === "Workout";

    // Hover task over task
    if (isActiveAWorkout && isOverAWorkout) {
      return;
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id.toString();
    const overId = over.id.toString();

    console.log("Drag event:", { activeId, overId });

    let source = null;
    let destination = null;

    plan.weeks.forEach((week, wi) => {
      week.days.forEach((day, di) => {
        const ids = day.workouts.map((w) => w?.id?.toString());
        if (ids.includes(activeId)) {
          source = {
            weekIndex: wi,
            dayIndex: di,
            workoutIndex: ids.indexOf(activeId),
          };
        }

        if (ids.includes(overId)) {
          destination = {
            weekIndex: wi,
            dayIndex: di,
            workoutIndex: ids.indexOf(overId),
          };
        }

        if (`day-${wi}-${di}` === overId) {
          destination = {
            weekIndex: wi,
            dayIndex: di,
            workoutIndex: day.workouts.length, // append to end
          };
        }
      });
    });

    if (!source || !destination) {
      console.warn("Invalid drag source or destination", {
        source,
        destination,
      });
      return;
    }

    console.log("Drag indices:", { source, destination });

    setPlan((prevPlan) => {
      const newWeeks = [...prevPlan.weeks];
      const sourceDay = newWeeks[source.weekIndex].days[source.dayIndex];
      const destDay =
        newWeeks[destination.weekIndex].days[destination.dayIndex];

      const sourceWorkouts = [...sourceDay.workouts];
      const destWorkouts = [...destDay.workouts];

      const [movedWorkout] = sourceWorkouts.splice(source.workoutIndex, 1);
      if (!movedWorkout) return prevPlan;

      // Same day: reorder using arrayMove
      if (
        source.weekIndex === destination.weekIndex &&
        source.dayIndex === destination.dayIndex
      ) {
        const newWorkouts = arrayMove(
          sourceWorkouts.concat(movedWorkout), // Need to reinsert before moving
          source.workoutIndex,
          destination.workoutIndex
        );
        newWeeks[source.weekIndex].days[source.dayIndex].workouts = newWorkouts;
      } else {
        // Cross-day move
        destWorkouts.splice(destination.workoutIndex, 0, movedWorkout);
        newWeeks[source.weekIndex].days[source.dayIndex].workouts =
          sourceWorkouts;
        newWeeks[destination.weekIndex].days[destination.dayIndex].workouts =
          destWorkouts;
      }

      return { ...prevPlan, weeks: newWeeks };
    });
  };

  const handleEditWorkout = (weekIndex, dayIndex) => {
    setEditingDay({
      weekIndex,
      dayIndex,
      workouts: [...plan.weeks[weekIndex].days[dayIndex].workouts],
    });
  };

  const saveEditedWorkouts = (newWorkouts) => {
    const { weekIndex, dayIndex } = editingDay;
    const validWorkouts = newWorkouts.filter((w) => w && w.id);
    if (validWorkouts.length !== newWorkouts.length) {
      console.warn(
        "Invalid workouts detected in saveEditedWorkouts",
        newWorkouts
      );
    }
    setPlan((prevPlan) => ({
      ...prevPlan,
      weeks: prevPlan.weeks.map((w, wi) =>
        wi === weekIndex
          ? {
              ...w,
              days: w.days.map((d, di) =>
                di === dayIndex ? { ...d, workouts: validWorkouts } : d
              ),
            }
          : w
      ),
    }));
    setEditingDay(null);
  };

  const addWeek = () => {
    setPlan((prevPlan) => ({
      ...prevPlan,
      weeks: [
        ...prevPlan.weeks,
        {
          days: Array(7)
            .fill()
            .map((_, i) => ({ workouts: [], day_of_week: i + 1 })),
          week_number: prevPlan.weeks.length + 1,
        },
      ],
    }));
  };

  const deleteWeek = (weekIndex) => {
    setPlan((prevPlan) => ({
      ...prevPlan,
      weeks: prevPlan.weeks.filter((_, i) => i !== weekIndex),
    }));

    setCollapsedWeeks((prev) => {
      const newSet = new Set();
      for (let index of prev) {
        if (index < weekIndex) {
          newSet.add(index);
        } else if (index > weekIndex) {
          newSet.add(index - 1);
        }
      }
      return newSet;
    });
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

  const gridTemplateColumns = `2rem ${Array(7)
    .fill()
    .map((_, i) => (collapsedDays[i] ? "2rem" : "minmax(6rem, 1fr)"))
    .join(" ")}`;

  const gridTemplateRows = `2rem ${plan.weeks
    .map((_, weekIndex) =>
      collapsedWeeks.has(weekIndex) ? "2rem" : "minmax(12rem, auto)"
    )
    .join(" ")}`;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
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
          <Button onClick={() => savePlan(stripIds(plan))}>Save</Button>
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
          {plan.weeks.map((week, weekIndex) => (
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
                    className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 h-4 w-4 text-red-400 hover:text-red-600 rotate-90 opacity-0 ${
                      collapsedWeeks.has(weekIndex)
                        ? "opacity-0"
                        : "group-hover:opacity-100"
                    }`}
                    onClick={(e) => {
                      if (!collapsedWeeks.has(weekIndex)) {
                        e.stopPropagation();
                        deleteWeek(weekIndex);
                      }
                    }}
                  />
                </span>
              </div>
              {week.days.map((day, dayIndex) => (
                <Day
                  key={`day-${weekIndex}-${dayIndex}`}
                  id={`day-${weekIndex}-${dayIndex}`}
                  weekIndex={weekIndex}
                  dayIndex={dayIndex}
                  day={day}
                  collapsedDays={collapsedDays}
                  collapsedWeeks={collapsedWeeks}
                  handleEditWorkout={handleEditWorkout}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <PlusCircleIcon
            className="h-8 w-8 text-green-500 hover:text-green-600 cursor-pointer"
            onClick={addWeek}
          />
        </div>
      </div>
      <Modal
        isOpen={editingDay !== null}
        onClose={() => setEditingDay(null)}
        title={`Week ${editingDay ? editingDay.weekIndex + 1 : ""} Day ${
          editingDay ? editingDay.dayIndex + 1 : ""
        }`}
        className="w-[95vw] h-[95vh]"
      >
        {editingDay && (
          <WorkoutEditor
            workouts={editingDay.workouts}
            baseLifts={baseLifts}
            onSave={saveEditedWorkouts}
          />
        )}
      </Modal>
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
