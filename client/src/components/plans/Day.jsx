import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, useState } from "react";

const Day = ({
  id,
  weekIndex,
  dayIndex,
  day,
  collapsedDays,
  collapsedWeeks,
  handleEditWorkout,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: "Day",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`group flex flex-col justify-between p-2 bg-white shadow-sm rounded-lg text-xs border border-transparent ${
        !collapsedDays[dayIndex] && !collapsedWeeks.has(weekIndex)
          ? `hover:border-primary hover:shadow-xl ${isOver ? "bg-blue-50" : ""}`
          : ""
      }`}
    >
      {!collapsedDays[dayIndex] && !collapsedWeeks.has(weekIndex) ? (
        <>
          <SortableContext
            id={`day-${weekIndex}-${dayIndex}`}
            items={day.workouts
              .filter((w) => w && w.id)
              .map((w) => w.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="w-full flex flex-col justify-center items-center self-center flex-grow">
              {day.workouts.length > 0 ? (
                day.workouts
                  .filter((w) => w && w.id)
                  .map((workout) => (
                    <Workout
                      key={workout.id}
                      id={workout.id.toString()}
                      workout={workout}
                    />
                  ))
              ) : (
                <span className="text-gray-500">Rest Day</span>
              )}
            </div>
          </SortableContext>
          <div className="mt-2 space-y-2 opacity-0 max-h-0 overflow-hidden transition-all duration-300 group-hover:opacity-100 group-hover:max-h-40">
            <Button
              variant={"primary"}
              className={"text-sm p-1 w-full"}
              onClick={() => handleEditWorkout(weekIndex, dayIndex)}
            >
              Edit
            </Button>
            <Button variant={"secondary"} className={"text-sm p-1 w-full"}>
              Import
            </Button>
          </div>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default Day;
