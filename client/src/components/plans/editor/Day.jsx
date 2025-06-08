import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { memo, useMemo } from "react";
import Button from "../../common/Button";
import Workout from "./Workout";
import { useTheme } from "../../../context/ThemeContext";

function shallowEqualWorkouts(arr1, arr2) {
  if (arr1 === arr2) {
    return true;
  }
  if (!arr1 || !arr2 || arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    const w1 = arr1[i];
    const w2 = arr2[i];
    if (w1.id !== w2.id || w1.name !== w2.name) {
      return false;
    }

    const lifts1 = w1.lifts || [];
    const lifts2 = w2.lifts || [];
    if (lifts1.length !== lifts2.length) {
      return false;
    }

    for (let j = 0; j < lifts1.length; j++) {
      const lift1 = lifts1[j];
      const lift2 = lifts2[j];
      if (
        lift1.id !== lift2.id ||
        lift1.sets !== lift2.sets ||
        lift1.progressionRule !== lift2.progressionRule ||
        (lift1.reps || []).length !== (lift2.reps || []).length ||
        (lift1.reps || []).some((val, k) => val !== (lift2.reps || [])[k]) ||
        (lift1.weight || []).length !== (lift2.weight || []).length ||
        (lift1.weight || []).some((val, k) => val !== (lift2.weight || [])[k])
      ) {
        return false;
      }
    }
  }

  return true;
}

function areDayPropsEqual(prev, next) {
  const isEqual =
    prev.id === next.id &&
    prev.isDayCollapsed === next.isDayCollapsed &&
    prev.isWeekCollapsed === next.isWeekCollapsed &&
    prev.handleEditWorkout === next.handleEditWorkout &&
    prev.isDaySelected === next.isDaySelected &&
    prev.handleClick === next.handleClick &&
    prev.group === next.group &&
    prev.isReadOnly === next.isReadOnly &&
    shallowEqualWorkouts(prev.workouts, next.workouts);

  return isEqual;
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
    isReadOnly = false,
  }) => {
    const { screenSize } = useTheme();
    const workoutItems = useMemo(
      () => workouts.map((w) => w.id.toString()),
      [workouts]
    );

    if (isDayCollapsed || isWeekCollapsed) {
      return (
        <div className="p-2 bg-[var(--surface)] shadow-sm rounded-lg text-xs border border-transparent"></div>
      );
    }

    return (
      <DroppableContainer
        id={id}
        disabled={isDayCollapsed || isWeekCollapsed || isReadOnly}
        isDaySelected={isDaySelected}
        isDragging={isDragging}
        handleClick={isReadOnly ? undefined : handleClick}
        onContextMenu={isReadOnly ? undefined : onContextMenu}
        isReadOnly={isReadOnly}
        isMobile={screenSize.isMobile}
      >
        <DaySortableWrapper id={id} workoutItems={workoutItems}>
          <DayData
            id={id}
            workouts={workouts}
            handleEditWorkout={handleEditWorkout}
            handleClick={handleClick}
            group={group}
            isDragging={isDragging}
            isReadOnly={isReadOnly}
            isMobile={screenSize.isMobile}
          />
        </DaySortableWrapper>
      </DroppableContainer>
    );
  },
  areDayPropsEqual
);

Day.displayName = "Day";

const DroppableContainer = memo(
  ({ id, disabled, isDaySelected, onContextMenu, children, isMobile }) => {
    const { setNodeRef, isOver } = useDroppable({
      id,
      data: { type: "Day" },
      disabled,
    });
    return (
      <div
        ref={setNodeRef}
        className={`group flex flex-col justify-between relative ${
          isMobile ? "p-3" : "p-2"
        } bg-[var(--surface)] shadow-sm rounded-lg text-xs border ${
          isDaySelected ? "border-[var(--primary)]" : "border-transparent"
        } md:hover:border-[var(--primary-light)] hover:shadow-xl active:shadow-xl
        ${isOver ? "bg-[var(--primary-light)] bg-opacity-10" : ""}`}
        onContextMenu={(e) => onContextMenu(e, id)}
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
  ({
    id,
    workouts,
    handleEditWorkout,
    handleClick,
    isDragging,
    group,
    isReadOnly,
    isMobile,
  }) => {
    const workoutComponents = useMemo(() => {
      if (!workouts.length) {
        return (
          <span className="text-[var(--text-secondary)] p-1 pt-5">
            Rest Day
          </span>
        );
      }

      return workouts
        .filter((w) => w && w.id)
        .map((workout) => (
          <Workout
            key={workout.id}
            id={workout.id}
            workout={workout}
            isDragging={isDragging}
            handleClick={isReadOnly ? undefined : handleClick}
            isReadOnly={isReadOnly}
            isMobile={isMobile}
          />
        ));
    }, [workouts, handleClick, isDragging, isReadOnly, isMobile]);

    return (
      <>
        {group && (
          <div
            className={`w-full h-2 absolute top-0 left-0 rounded-t-lg ${
              isMobile ? "hover:h-8" : "hover:h-6"
            }
             transition-all duration-200 ${
               !isReadOnly ? "cursor-pointer" : ""
             } flex items-center justify-center overflow-hidden group/bar`}
            style={{ backgroundColor: group.color }}
            onClick={
              isReadOnly
                ? undefined
                : (e) => {
                    e.stopPropagation();
                    handleClick([...group.dayIds]);
                  }
            }
          >
            <span className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 text-[0.65rem] text-white font-medium">
              {group.name}
            </span>
          </div>
        )}
        <div
          onClick={
            isReadOnly
              ? undefined
              : (e) => {
                  e.stopPropagation();
                  handleClick(id);
                }
          }
          className={`w-full flex flex-col justify-start items-center self-center flex-grow ${
            isMobile ? "min-h-[80px]" : ""
          }`}
        >
          {workoutComponents}
        </div>
        {!isReadOnly && (
          <div
            className={`flex flex-col gap-1 ${
              isMobile
                ? "opacity-100 pointer-events-auto"
                : "transition-opacity duration-300 opacity-0 group-hover:opacity-100 group-hover:pointer-events-auto pointer-events-none"
            }`}
          >
            <Button
              variant="tertiary"
              className={`text-xs ${isMobile ? "p-2" : "p-1"} w-full`}
              onClick={() => handleEditWorkout(id)}
            >
              Edit
            </Button>
          </div>
        )}
      </>
    );
  }
);

DayData.displayName = "DayData";

export default Day;
