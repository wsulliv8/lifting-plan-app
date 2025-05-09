import { useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Modal from "../common/Modal";
import WorkoutEditor from "./WorkoutEditor-v1";
import Button from "../common/Button";
import { PlusCircleIcon, TrashIcon } from "@heroicons/react/24/solid";

// Simple arrayMove function for reordering
const arrayMove = (array, from, to) => {
  const newArray = [...array];
  const [item] = newArray.splice(from, 1);
  newArray.splice(to, 0, item);
  return newArray;
};

const PlanEditor = ({ initialPlan }) => {
  const [plan, setPlan] = useState(
    initialPlan || {
      weeks: [
        {
          days: Array(7)
            .fill()
            .map(() => ({ workouts: [] })),
        },
      ],
    }
  );
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());
  const [collapsedDays, setCollapsedDays] = useState(Array(7).fill(false));
  const [editingDay, setEditingDay] = useState(null);

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

    // Find source and destination
    let sourceWeekIndex, sourceDayIndex, sourceWorkoutIndex;
    let destWeekIndex, destDayIndex, destWorkoutIndex;

    for (let wi = 0; wi < plan.weeks.length; wi++) {
      for (let di = 0; di < 7; di++) {
        const workouts = plan.weeks[wi].days[di].workouts;
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

    if (sourceWeekIndex === undefined || destWeekIndex === undefined) return;

    setPlan((prevPlan) => {
      const newWeeks = [...prevPlan.weeks];

      // Clone source and destination workouts
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
        // Reorder within the same day
        const newWorkouts = arrayMove(
          sourceWorkouts,
          sourceWorkoutIndex,
          destWorkoutIndex
        );
        newWeeks[sourceWeekIndex].days[sourceDayIndex] = {
          ...newWeeks[sourceWeekIndex].days[sourceDayIndex],
          workouts: newWorkouts,
        };
      } else {
        // Move to a different day
        const [workoutToMove] = sourceWorkouts.splice(sourceWorkoutIndex, 1);
        destWorkouts.splice(destWorkoutIndex, 0, workoutToMove);

        // Update source day
        newWeeks[sourceWeekIndex].days[sourceDayIndex] = {
          ...newWeeks[sourceWeekIndex].days[sourceDayIndex],
          workouts: sourceWorkouts,
        };

        // Update destination day
        newWeeks[destWeekIndex].days[destDayIndex] = {
          ...newWeeks[destWeekIndex].days[destDayIndex],
          workouts: destWorkouts,
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
            .map(() => ({ workouts: [] })),
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
      <div className="w-full overflow-x-auto lg:overflow-x-hidden">
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
                className={`bg-gray-50 p-1 font-medium cursor-pointer hover:bg-gray-200  place-self-center w-full rounded text-center ${
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
                      e.stopPropagation();
                      deleteWeek(weekIndex);
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
                  {" "}
                  {!collapsedDays[dayIndex] &&
                  !collapsedWeeks.has(weekIndex) ? (
                    <>
                      <SortableContext
                        id={`day-${weekIndex}-${dayIndex}`}
                        items={day.workouts.map((w) => w.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="flex flex-col justify-center items-center self-center flex-grow">
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
        className="w-[90vw]"
      >
        {editingDay && (
          <WorkoutEditor
            workouts={editingDay.workouts}
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
      className="p-2 mb-2 bg-gray-100 rounded hover:bg-gray-200"
    >
      {workout.name || "Unnamed Workout"}
    </div>
  );
};

export default PlanEditor;
