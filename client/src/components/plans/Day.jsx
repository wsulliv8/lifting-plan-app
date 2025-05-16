import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable, DragOverlay } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { memo, useMemo } from "react";
import Button from "../common/Button";
import Workout from "./Workout";

const Day = memo(
  ({ id, isDayCollapsed, isWeekCollapsed, handleEditWorkout, workouts }) => {
    const { setNodeRef, isOver } = useDroppable({
      id,
      data: {
        type: "Day",
      },
    });

    const workoutItems = useMemo(
      () => workouts.map((w) => w.id.toString()),
      [workouts]
    );

    return (
      <div
        ref={setNodeRef}
        className={`group flex flex-col justify-between p-2 bg-white shadow-sm rounded-lg text-xs border border-transparent ${
          !isDayCollapsed && !isWeekCollapsed
            ? `hover:border-primary hover:shadow-xl ${
                isOver ? "bg-blue-50" : ""
              }`
            : ""
        }`}
      >
        {!isDayCollapsed && !isWeekCollapsed ? (
          <>
            <SortableContext
              id={id}
              items={workoutItems}
              strategy={verticalListSortingStrategy}
            >
              <div className="w-full flex flex-col justify-start items-center self-center flex-grow">
                {workouts.length > 0 ? (
                  workouts
                    .filter((w) => w && w.id)
                    .map((workout) => (
                      <Workout
                        key={workout.id}
                        id={workout.id}
                        workout={workout}
                      />
                    ))
                ) : (
                  <span className="text-gray-500 p-1">Rest Day</span>
                )}
              </div>
            </SortableContext>
            <div className="flex flex-col gap-1 transition-opacity duration-300 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none">
              <Button
                variant="primary"
                className="text-xs p-1 w-full"
                onClick={() => handleEditWorkout(id)}
              >
                Edit
              </Button>
              <Button variant="secondary" className="text-xs p-1 w-full">
                Import
              </Button>
            </div>
          </>
        ) : (
          ""
        )}
      </div>
    );
  }
);

export default Day;
