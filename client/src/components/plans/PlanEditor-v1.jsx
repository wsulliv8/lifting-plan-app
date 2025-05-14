import { useState, useCallback, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

const arrayMove = (array, from, to) => {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
};

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
    // Update local plan state with new settings
    const updatedPlan = {
      ...plan,
      name: formInputs.name,
      goal: formInputs.goal,
      categories: formInputs.categories,
      difficulty: formInputs.difficulty,
      description: formInputs.description,
    };
    setPlan(updatedPlan);

    // Save the full updated plan, ensuring all properties (e.g., weeks) are preserved
    await savePlan(stripIds(updatedPlan));

    // Close modal
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

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    console.log("Drag event:", { activeId, overId }); // Debug log

    let sourceWeekIndex, sourceDayIndex, sourceWorkoutIndex;
    let destWeekIndex, destDayIndex, destWorkoutIndex;

    for (let wi = 0; wi < plan.weeks.length; wi++) {
      for (let di = 0; di < 7; di++) {
        const workouts = plan.weeks[wi].days[di].workouts.filter(
          (w) => w && w.id
        ); // Filter valid workouts
        const workoutIds = workouts.map((w) => w.id);
        if (workoutIds.includes(activeId)) {
          sourceWeekIndex = wi;
          sourceDayIndex = di;
          sourceWorkoutIndex = workoutIds.indexOf(activeId);
        }
        if (workoutIds.includes(overId)) {
          destWeekIndex = wi;
          destDayIndex = di;
          destWorkoutIndex = workoutIds.indexOf(overId);
        } else if (`day-${wi}-${di}` === overId) {
          destWeekIndex = wi;
          destDayIndex = di;
          destWorkoutIndex = workouts.length; // Append to end
        }
      }
    }

    if (sourceWeekIndex === undefined || destWeekIndex === undefined) {
      console.warn("Drag failed: Invalid source or destination", {
        activeId,
        overId,
      });
      return;
    }

    console.log("Indices:", {
      sourceWeekIndex,
      sourceDayIndex,
      sourceWorkoutIndex,
      destWeekIndex,
      destDayIndex,
      destWorkoutIndex,
    }); // Debug log

    setPlan((prevPlan) => {
      const newWeeks = [...prevPlan.weeks];

      const sourceWorkouts = [
        ...newWeeks[sourceWeekIndex].days[sourceDayIndex].workouts,
      ];
      const destWorkouts =
        sourceWeekIndex === destWeekIndex && sourceDayIndex === destDayIndex
          ? sourceWorkouts
          : [...newWeeks[destWeekIndex].days[destDayIndex].workouts];

      if (
        sourceWeekIndex === destWeekIndex &&
        sourceDayIndex === destDayIndex
      ) {
        if (sourceWorkoutIndex === destWorkoutIndex) return prevPlan; // No change needed
        const newWorkouts = arrayMove(
          sourceWorkouts,
          sourceWorkoutIndex,
          destWorkoutIndex
        );
        newWeeks[sourceWeekIndex].days[sourceDayIndex] = {
          ...newWeeks[sourceWeekIndex].days[sourceDayIndex],
          workouts: newWorkouts.filter((w) => w && w.id), // Ensure no undefined
        };
      } else {
        const [workoutToMove] = sourceWorkouts.splice(sourceWorkoutIndex, 1);
        if (!workoutToMove) {
          console.warn("No workout to move at index", sourceWorkoutIndex);
          return prevPlan;
        }
        destWorkouts.splice(destWorkoutIndex, 0, workoutToMove);
        newWeeks[sourceWeekIndex].days[sourceDayIndex] = {
          ...newWeeks[sourceWeekIndex].days[sourceDayIndex],
          workouts: sourceWorkouts.filter((w) => w && w.id),
        };
        newWeeks[destWeekIndex].days[destDayIndex] = {
          ...newWeeks[destWeekIndex].days[destDayIndex],
          workouts: destWorkouts.filter((w) => w && w.id),
        };
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
    setPlan((prevPlan) => ({
      ...prevPlan,
      weeks: prevPlan.weeks.map((w, wi) =>
        wi === weekIndex
          ? {
              ...w,
              days: w.days.map((d, di) =>
                di === dayIndex ? { ...d, workouts: newWorkouts } : d
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
      weeks: prevPlan.weeks.filter((_, i) => i != weekIndex),
    }));

    setCollapsedWeeks((prev) => {
      const newSet = new Set();
      for (let index of prev) {
        if (index < weekIndex) {
          newSet.add(index); // unaffected
        } else if (index > weekIndex) {
          newSet.add(index - 1); // shift down
        }
        // If index === weekIndexToDelete, we skip it (effectively removing it)
      }
      return newSet;
    });
  };

  // strip Date.now() ids in preparation for db autoincrement (prevent overflow) and convert reps to STRING
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

  // Generate grid template columns based on collapsed days
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
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
        {/* Settings Modal */}

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
        {/* Grid Container */}
        <div
          className="grid gap-2 w-full"
          style={{ gridTemplateColumns, gridTemplateRows }}
        >
          {/* Header Row */}
          <div></div>
          {Array(7)
            .fill()
            .map((_, dayIndex) => (
              <div
                key={`header-day-${dayIndex}`}
                className={`bg-gray-50 p-1 font-medium cursor-pointer hover:bg-gray-200  place-self-center w-full rounded text-center sticky -top-2 z-10${
                  collapsedDays[dayIndex] ? "text-gray-400" : "text-gray-800"
                }`}
                onClick={() => toggleDayCollapse(dayIndex)}
              >
                {!collapsedDays[dayIndex] ? "Day" : ""} {dayIndex + 1}
              </div>
            ))}

          {/* Week Rows */}
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
                    className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 h-4 w-4 text-red-400 hover:text-red-600 rotate-90 opacity-0
                                ${
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
                <div
                  key={`day-${weekIndex}-${dayIndex}`}
                  className={`group flex flex-col justify-between p-2 bg-white shadow-sm rounded-lg text-xs border border-transparent ${
                    !collapsedDays[dayIndex] && !collapsedWeeks.has(weekIndex)
                      ? "hover:border-primary hover:shadow-xl"
                      : ""
                  }`}
                >
                  {!collapsedDays[dayIndex] &&
                  !collapsedWeeks.has(weekIndex) ? (
                    <>
                      <SortableContext
                        id={`day-${weekIndex}-${dayIndex}`}
                        items={day.workouts.map((w) => w.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="w-full flex flex-col justify-center items-center self-center flex-grow">
                          {day.workouts.length > 0 ? (
                            day.workouts.map((workout) => (
                              <SortableItem
                                key={workout.id}
                                id={workout.id}
                                workout={workout}
                              />
                            ))
                          ) : (
                            <span className="">Rest Day</span>
                          )}
                        </div>
                      </SortableContext>
                      <div className="mt-2 space-y-2 opacity-0 max-h-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:max-h-40">
                        <Button
                          variant={"primary"}
                          className={"text-sm p-1 w-full "}
                          onClick={() => handleEditWorkout(weekIndex, dayIndex)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant={"secondary"}
                          className={"text-sm p-1 w-full "}
                        >
                          Import
                        </Button>
                      </div>
                    </>
                  ) : (
                    ""
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Add Week Button */}
        <div className="mt-4 flex justify-center">
          <PlusCircleIcon
            className="h-8 w-8 text-green-500 hover:text-green-600 cursor-pointer"
            onClick={addWeek}
          />
        </div>
      </div>

      {/* Edit Workout Modal */}
      <Modal
        isOpen={editingDay !== null}
        onClose={() => setEditingDay(null)}
        title={`Week ${editingDay ? editingDay.weekIndex + 1 : ""} Day ${
          editingDay ? editingDay.dayIndex + 1 : ""
        }`}
        className="w-[95vw] h-[95vh] "
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
      className="w-full p-1 mb-2 bg-gray-100 rounded hover:bg-gray-200"
    >
      <div className="w-full text-sm">
        <div className="font-medium text-center">
          {workout.name || "Workout"}
        </div>
        {workout.lifts && workout.lifts.length > 0 ? (
          <ul className="list-disc pl-4 mt-1">
            {workout.lifts.map((lift, index) => (
              <li key={`${lift.id}-${index}`}>
                <span className="flex flex-col">
                  <span>{lift.name}</span>
                  <span>
                    {lift.reps.every((val) => val === lift.reps[0])
                      ? `${lift.reps.length}x${lift.reps[0]}`
                      : `${lift.weight.map((weight) => weight).join(", ")}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No lifts</div>
        )}
      </div>
    </div>
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
        <label className="block text-sm font-normal text-gray-700 mb-1 ">
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
