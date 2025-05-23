import { DndContext, rectIntersection, DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import {
  computeWeeks,
  computeGridStyle,
  generateHeaderDays,
} from "../../utils/planUtils";
import Day from "./Day";
import Workout from "./Workout";
import { TrashIcon, PlusCircleIcon } from "@heroicons/react/24/solid";

const PlanGrid = ({
  workouts,
  totalDays,
  collapsedWeeks,
  collapsedDays,
  selectedDays,
  handleEditWorkout,
  handleClick,
  plan,
  toggleWeekCollapse,
  handleDeleteWeek,
  toggleDayCollapse,
  activeWorkout,
  sensors,
  handleDragStart,
  handleDragEnd,
  onContextMenu,
  setTotalDays,
}) => {
  const weeks = computeWeeks(totalDays);
  const gridStyle = computeGridStyle(weeks, collapsedWeeks, collapsedDays);
  const headerDays = generateHeaderDays(collapsedDays, toggleDayCollapse);

  const renderedWeeks = weeks.map((week, weekIndex) => (
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
        const isSelected = selectedDays.includes(actualDayId);
        return (
          <Day
            key={actualDayId}
            id={actualDayId}
            isDayCollapsed={collapsedDays[dayIndex]}
            isWeekCollapsed={collapsedWeeks.has(weekIndex)}
            isDaySelected={isSelected}
            handleEditWorkout={handleEditWorkout}
            workouts={workouts.get(actualDayId) || []}
            handleClick={handleClick}
            group={
              plan.dayGroups?.find((group) =>
                group.dayIds.includes(actualDayId)
              ) || null
            }
            onContextMenu={onContextMenu}
          />
        );
      })}
    </div>
  ));

  return (
    <DndContext
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
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

export default PlanGrid;
