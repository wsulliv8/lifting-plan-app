import { DndContext, rectIntersection, DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { useRef, useEffect, useState, useMemo } from "react";
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
  //const gridStyle = computeGridStyle(weeks, collapsedWeeks, collapsedDays);
  const headerDays = generateHeaderDays(collapsedDays, toggleDayCollapse);
  const [availableWidth, setAvailableWidth] = useState(window.innerWidth - 100); // Navbar = 48px

  const mainScrollRef = useRef(null);
  const stickyScrollRef = useRef(null);
  const [showStickyScrollbar, setShowStickyScrollbar] = useState(false);

  // Update available width on resize
  useEffect(() => {
    const handleResize = () => {
      setAvailableWidth(window.innerWidth - 100); // Adjust for navbar
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Compute grid style with memoization
  const gridStyle = useMemo(
    () =>
      computeGridStyle(
        Array(Math.ceil(totalDays / 7)).fill(),
        collapsedWeeks,
        collapsedDays,
        availableWidth
      ),
    [totalDays, collapsedWeeks, collapsedDays, availableWidth]
  );

  // Sync scroll positions
  const handleMainScroll = () => {
    if (mainScrollRef.current && stickyScrollRef.current) {
      stickyScrollRef.current.scrollLeft = mainScrollRef.current.scrollLeft;
    }
  };

  const handleStickyScroll = () => {
    if (mainScrollRef.current && stickyScrollRef.current) {
      mainScrollRef.current.scrollLeft = stickyScrollRef.current.scrollLeft;
    }
  };

  // Check if content overflows to show/hide sticky scrollbar
  useEffect(() => {
    const checkOverflow = () => {
      if (mainScrollRef.current) {
        const hasOverflow =
          mainScrollRef.current.scrollWidth > mainScrollRef.current.clientWidth;
        setShowStickyScrollbar(hasOverflow);
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [totalDays, collapsedWeeks, collapsedDays]);

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
      <div className="relative">
        <div
          ref={mainScrollRef}
          className="overflow-x-hidden overflow-y-visible"
          onScroll={handleMainScroll}
        >
          <div className="grid gap-2" style={gridStyle}>
            <div></div>
            {headerDays}
            {renderedWeeks}
          </div>
        </div>

        {/* Sticky horizontal scrollbar at bottom of screen - positioned to match grid width */}
        {showStickyScrollbar && (
          <div
            className="fixed bottom-0 z-50 backdrop-blur-sm bg-white/90 border-t border-gray-200/50 shadow-lg"
            style={{ left: "4rem", right: "0" }}
          >
            <div
              ref={stickyScrollRef}
              className="overflow-x-scroll overflow-y-hidden scrollbar-thin scrollbar-track-gray-100 scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500"
              onScroll={handleStickyScroll}
              style={{ height: "16px" }}
            >
              <div
                style={{
                  width: mainScrollRef.current?.scrollWidth || "100%",
                  height: "1px",
                }}
              />
            </div>
          </div>
        )}
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
