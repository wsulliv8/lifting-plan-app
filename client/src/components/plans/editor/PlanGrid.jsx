import { DndContext, rectIntersection, DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import React, {
  useRef,
  useEffect,
  useState,
  useMemo,
  useLayoutEffect,
} from "react";
import {
  computeWeeks,
  computeGridStyle,
  computeMobileGridStyle,
  generateHeaderDays,
} from "../../../utils/planUtils";
import Day from "./Day";
import Workout from "./Workout";
import { TrashIcon, PlusCircleIcon } from "@heroicons/react/24/solid";
import { useTheme } from "../../../context/ThemeContext";

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
  isReadOnly = false,
}) => {
  const { screenSize } = useTheme();
  const weeks = computeWeeks(totalDays);
  const headerDays = generateHeaderDays(collapsedDays, toggleDayCollapse);
  const [availableWidth, setAvailableWidth] = useState(window.innerWidth - 100);
  const [scrollContentWidth, setScrollContentWidth] = useState(0);
  const [prevDay7Collapsed, setPrevDay7Collapsed] = useState(collapsedDays[6]);

  const mainScrollRef = useRef(null);
  const stickyScrollRef = useRef(null);
  const dayHeaderRefs = useRef([]);
  const [showStickyScrollbar, setShowStickyScrollbar] = useState(false);

  // Initialize refs for each day column
  useEffect(() => {
    dayHeaderRefs.current = Array(7)
      .fill()
      .map((_, i) => dayHeaderRefs.current[i] || React.createRef());
  }, []);

  useLayoutEffect(() => {
    if (mainScrollRef.current && !screenSize.isMobile) {
      setScrollContentWidth(mainScrollRef.current.scrollWidth + 2);
    }
  }, [
    collapsedWeeks,
    collapsedDays,
    totalDays,
    availableWidth,
    screenSize.isMobile,
  ]);

  // Update available width on resize
  useEffect(() => {
    const handleResize = () => {
      setAvailableWidth(window.innerWidth - (screenSize.isMobile ? 32 : 100));
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [screenSize.isMobile]);

  // Effect to track Day 7's collapsed state changes (desktop only)
  useEffect(() => {
    if (screenSize.isMobile) return;

    const wasCollapsed = prevDay7Collapsed;
    const isCollapsedNow = collapsedDays[6];

    // Update the previous state for next comparison
    setPrevDay7Collapsed(isCollapsedNow);

    // Only scroll if Day 7 was collapsed and is now uncollapsed
    if (wasCollapsed && !isCollapsedNow && dayHeaderRefs.current[6]?.current) {
      const headerElement = dayHeaderRefs.current[6].current;
      const scrollContainer = mainScrollRef.current;

      if (headerElement && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const totalScroll = scrollContainer.scrollWidth;

        let targetScroll = headerElement.offsetLeft;

        targetScroll = Math.max(
          0,
          Math.min(targetScroll, totalScroll - containerWidth)
        );

        if (mainScrollRef.current) {
          mainScrollRef.current.scrollLeft = targetScroll;
        }
        if (stickyScrollRef.current) {
          stickyScrollRef.current.scrollLeft = targetScroll;
        }
      }
    }
  }, [collapsedDays, prevDay7Collapsed, screenSize.isMobile]);

  // Compute grid style with memoization
  const gridStyle = useMemo(
    () =>
      screenSize.isMobile
        ? computeMobileGridStyle(collapsedDays, availableWidth)
        : computeGridStyle(
            Array(Math.ceil(totalDays / 7)).fill(),
            collapsedWeeks,
            collapsedDays,
            availableWidth,
            screenSize.isMobile
          ),
    [
      totalDays,
      collapsedWeeks,
      collapsedDays,
      availableWidth,
      screenSize.isMobile,
    ]
  );

  // Sync scroll positions (desktop only)
  const handleMainScroll = () => {
    if (
      !screenSize.isMobile &&
      mainScrollRef.current &&
      stickyScrollRef.current
    ) {
      stickyScrollRef.current.scrollLeft = mainScrollRef.current.scrollLeft;
    }
  };

  const handleStickyScroll = () => {
    if (
      !screenSize.isMobile &&
      mainScrollRef.current &&
      stickyScrollRef.current
    ) {
      mainScrollRef.current.scrollLeft = stickyScrollRef.current.scrollLeft;
    }
  };

  // Check if content overflows to show/hide sticky scrollbar (desktop only)
  useEffect(() => {
    if (screenSize.isMobile) {
      setShowStickyScrollbar(false);
      return;
    }

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
  }, [totalDays, collapsedWeeks, collapsedDays, screenSize.isMobile]);

  // Refs for mobile scroll synchronization
  const weekScrollRefs = useRef([]);
  const headerScrollRef = useRef(null);

  // Initialize week scroll refs
  useEffect(() => {
    if (screenSize.isMobile) {
      weekScrollRefs.current = Array(weeks.length)
        .fill()
        .map((_, i) => weekScrollRefs.current[i] || React.createRef());
    }
  }, [weeks.length, screenSize.isMobile]);

  // Sync scroll across all week rows and header
  const handleMobileScroll = (scrollingElement) => {
    const scrollLeft = scrollingElement.scrollLeft;

    // Always sync header scroll
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }

    // Sync all week rows regardless of which one triggered the scroll
    weekScrollRefs.current.forEach((ref) => {
      if (ref.current) {
        ref.current.scrollLeft = scrollLeft;
      }
    });
  };

  // Mobile layout - each week is a separate scrollable row
  if (screenSize.isMobile) {
    return (
      <DndContext
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        sensors={sensors}
        disabled={isReadOnly}
      >
        <div className="space-y-2">
          {/* Day headers - sticky */}
          <div className="sticky top-0 z-20 bg-[var(--background)] pb-2">
            <div
              ref={headerScrollRef}
              className="overflow-x-auto scrollbar-none"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onScroll={(e) => handleMobileScroll(e.target)}
            >
              <div className="grid gap-2 min-w-max" style={gridStyle}>
                <div></div>
                {headerDays.map((day, index) => (
                  <div key={index} ref={dayHeaderRefs.current[index]}>
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weeks - each in its own scrollable container */}
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className="pb-2 relative flex">
              {/* Sticky Week Label */}
              <div
                className={`sticky left-1 top-0 z-10 bg-[var(--background-alt)] p-1 font-medium cursor-pointer flex items-center justify-center whitespace-nowrap rounded group w-10 ${
                  collapsedWeeks.has(weekIndex)
                    ? "text-[var(--text-secondary)]"
                    : "text-[var(--text-primary)]"
                }`}
                onClick={() => {
                  toggleWeekCollapse(weekIndex);
                }}
              >
                <span className="transform -rotate-90">
                  {!collapsedWeeks.has(weekIndex) ? "Week" : ""} {weekIndex + 1}
                </span>
                {!isReadOnly && (
                  <span>
                    <TrashIcon
                      className={`absolute top-1 left-1/2 transform -translate-x-1/2 rotate-[-90deg] h-4 w-4 text-[var(--danger)] hover:text-[var(--danger-dark)] md:opacity-0 ${
                        collapsedWeeks.has(weekIndex)
                          ? "opacity-0"
                          : "md:group-hover:opacity-100"
                      }`}
                      onClick={(e) => {
                        if (!collapsedWeeks.has(weekIndex))
                          handleDeleteWeek(weekIndex, e);
                      }}
                    />
                  </span>
                )}
              </div>

              <div
                ref={weekScrollRefs.current[weekIndex]}
                className={`overflow-x-auto scrollbar-none flex-1 ml-4`}
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
                onScroll={(e) => {
                  if (!activeWorkout) {
                    handleMobileScroll(e.target);
                  }
                }}
              >
                <div
                  className="grid gap-2 min-w-max"
                  style={computeMobileGridStyle(
                    collapsedDays,
                    availableWidth,
                    true
                  )}
                >
                  {/* Days in the week - each with its own background */}
                  {week.map((_, dayIndex) => {
                    const actualDayId = weekIndex * 7 + dayIndex;
                    const isSelected = selectedDays.includes(actualDayId);
                    return (
                      <Day
                        id={actualDayId}
                        key={actualDayId}
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
                        isReadOnly={isReadOnly}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1 md:mt-4 flex justify-center pb-14 md:pb-6">
          {!isReadOnly && (
            <PlusCircleIcon
              className="h-8 w-8 text-[var(--primary)] hover:text-[var(--primary-dark)] cursor-pointer"
              onClick={() => setTotalDays((prev) => prev + 7)}
            />
          )}
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
  }

  // Desktop layout - original grid structure
  const renderedWeeks = weeks.map((week, weekIndex) => (
    <div key={`week-${weekIndex}`} className="contents ">
      <div
        className={`bg-[var(--background-alt)] p-2 font-medium cursor-pointer md:hover:border hover:border-[var(--primary-light)] flex items-center justify-center writing-vertical-rl rotate-180 h-full whitespace-nowrap rounded relative group ${
          collapsedWeeks.has(weekIndex)
            ? "text-[var(--text-secondary)]"
            : "text-[var(--text-primary)]"
        }`}
        onClick={() => {
          toggleWeekCollapse(weekIndex);
        }}
      >
        {!collapsedWeeks.has(weekIndex) ? "Week" : ""} {weekIndex + 1}
        {!isReadOnly && (
          <span>
            <TrashIcon
              className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 h-4 w-4 text-[var(--danger)] hover:text-[var(--danger-dark)] rotate-90 md:opacity-0 ${
                collapsedWeeks.has(weekIndex)
                  ? "opacity-0"
                  : "md:group-hover:opacity-100"
              }`}
              onClick={(e) => {
                if (!collapsedWeeks.has(weekIndex))
                  handleDeleteWeek(weekIndex, e);
              }}
            />
          </span>
        )}
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
            isReadOnly={isReadOnly}
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
      disabled={isReadOnly}
    >
      <div className="relative">
        <div
          ref={mainScrollRef}
          className="overflow-x-hidden overflow-y-visible"
          onScroll={handleMainScroll}
        >
          <div className="grid gap-2 pr-10 overflow-x-auto" style={gridStyle}>
            <div></div>
            {headerDays.map((day, index) => (
              <div key={index} ref={dayHeaderRefs.current[index]}>
                {day}
              </div>
            ))}
            {renderedWeeks}
          </div>
        </div>

        {/* Sticky horizontal scrollbar at bottom of screen */}
        {showStickyScrollbar && !screenSize.isMobile && (
          <div
            className="fixed bottom-0 z-50 backdrop-blur-sm bg-[var(--surface)] bg-opacity-90 border-t border-[var(--border)] shadow-lg"
            style={{ left: "4rem", right: "0" }}
          >
            <div
              ref={stickyScrollRef}
              className="overflow-x-scroll overflow-y-hidden scrollbar-thin scrollbar-track-[var(--background-alt)] scrollbar-thumb-[var(--border)] hover:scrollbar-thumb-[var(--text-secondary)]"
              onScroll={handleStickyScroll}
              style={{ height: "16px" }}
            >
              <div
                style={{
                  width: scrollContentWidth + 50 || "100%",
                  height: "1px",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center pb-6">
        {!isReadOnly && (
          <PlusCircleIcon
            className="h-8 w-8 text-[var(--primary)] hover:text-[var(--primary-dark)] cursor-pointer"
            onClick={() => setTotalDays((prev) => prev + 7)}
          />
        )}
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
