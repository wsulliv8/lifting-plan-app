import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { memo, useMemo } from "react";
import Button from "../common/Button";
import Workout from "./Workout";

function shallowEqualWorkouts(arr1, arr2) {
  if (arr1 === arr2) return true; // Same reference
  if (!arr1 || !arr2 || arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].id !== arr2[i].id) {
      return false;
    }
  }

  return true;
}

function areDayPropsEqual(prev, next) {
  return (
    prev.id === next.id &&
    prev.isDayCollapsed === next.isDayCollapsed &&
    prev.isWeekCollapsed === next.isWeekCollapsed &&
    prev.handleEditWorkout === next.handleEditWorkout &&
    prev.isDaySelected === next.isDaySelected &&
    prev.handleClick === next.handleClick &&
    prev.group === next.group &&
    shallowEqualWorkouts(prev.workouts, next.workouts)
  );
}

const Day = memo(
  ({
    id,
    isDayCollapsed,
    isWeekCollapsed,
    isDaySelected,
    handleEditWorkout,
    workouts,
    handleClick,
    group,
    isDragging,
    onContextMenu,
  }) => {
    const workoutItems = useMemo(
      () => workouts.map((w) => w.id.toString()),
      [workouts]
    );

    if (isDayCollapsed || isWeekCollapsed) {
      return (
        <div className="p-2 bg-white shadow-sm rounded-lg text-xs border border-transparent"></div>
      );
    }

    return (
      <DroppableContainer
        id={id}
        disabled={isDayCollapsed || isWeekCollapsed}
        isDaySelected={isDaySelected}
        isDragging={isDragging}
        handleClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, id)} // Pass dayId
      >
        <DaySortableWrapper id={id} workoutItems={workoutItems}>
          <DayData
            id={id}
            workouts={workouts}
            handleEditWorkout={handleEditWorkout}
            handleClick={handleClick}
            group={group}
            isDragging={isDragging}
          />
        </DaySortableWrapper>
      </DroppableContainer>
    );
  },
  areDayPropsEqual
);

Day.displayName = "Day";

const DroppableContainer = memo(
  ({ id, disabled, isDaySelected, onContextMenu, children }) => {
    const { setNodeRef, isOver } = useDroppable({
      id,
      data: { type: "Day" },
      disabled,
    });
    return (
      <div
        ref={setNodeRef}
        className={`group flex flex-col justify-between relative p-2 bg-white shadow-sm rounded-lg text-xs border ${
          isDaySelected ? "border-primary" : "border-transparent"
        } hover:border-primary hover:shadow-xl ${isOver ? "bg-blue-50" : ""}`}
        onContextMenu={onContextMenu} // Add context menu handler
      >
        {children}
      </div>
    );
  }
);

const DaySortableWrapper = memo(({ id, workoutItems, children }) => {
  return (
    <SortableContext
      id={id}
      items={workoutItems}
      strategy={verticalListSortingStrategy}
    >
      {children}
    </SortableContext>
  );
});

const DayData = memo(
  ({ id, workouts, handleEditWorkout, handleClick, isDragging, group }) => {
    const workoutComponents = useMemo(() => {
      if (!workouts.length) {
        return <span className="text-gray-500 p-1 pt-5">Rest Day</span>;
      }

      return workouts
        .filter((w) => w && w.id)
        .map((workout) => (
          <Workout
            key={workout.id}
            id={workout.id}
            workout={workout}
            isDragging={isDragging}
            handleClick={handleClick}
          />
        ));
    }, [workouts, handleClick, isDragging]);

    return (
      <>
        {group && (
          <div
            className="w-full h-2 absolute top-0 left-0 rounded-t-lg hover:h-6 transition-all duration-200 cursor-pointer flex items-center justify-center overflow-hidden group/bar"
            style={{ backgroundColor: group.color }}
            onClick={(e) => {
              e.stopPropagation();
              handleClick([...group.dayIds]);
            }}
          >
            <span className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 text-[0.65rem] text-white font-medium">
              {group.name}
            </span>
          </div>
        )}
        <div
          onClick={(e) => {
            e.stopPropagation();
            console.log(`adding day with id: ${id}`);
            handleClick(id);
          }}
          className="w-full flex flex-col justify-start items-center self-center flex-grow"
        >
          {workoutComponents}
        </div>
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
    );
  }
);

DayData.displayName = "DayData";

export default Day;
