import React, { useState, useMemo, useRef, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from "@heroicons/react/20/solid";
import Button from "../../components/common/Button";
import DayModal from "../../components/plans/modals/DayModal";
import { getCurrentDate } from "../../utils/dateUtils";
import { useTheme } from "../../context/ThemeContext";

const PlanProgress = () => {
  const { plan } = useLoaderData();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(null);
  const { screenSize } = useTheme();

  // Refs for mobile scroll synchronization
  const weekScrollRefs = useRef([]);
  const headerScrollRef = useRef(null);

  // Initialize week scroll refs for mobile
  useEffect(() => {
    if (screenSize.isMobile) {
      weekScrollRefs.current = Array(5)
        .fill()
        .map((_, i) => weekScrollRefs.current[i] || React.createRef());
    }
  }, [screenSize.isMobile]);

  // Sync scroll across all week rows and header for mobile
  const handleMobileScroll = (scrollingElement) => {
    if (!screenSize.isMobile) return;

    const scrollLeft = scrollingElement.scrollLeft;

    // Sync header scroll
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = scrollLeft;
    }

    // Sync all week rows
    weekScrollRefs.current.forEach((ref) => {
      if (ref.current && ref.current !== scrollingElement) {
        ref.current.scrollLeft = scrollLeft;
      }
    });
  };

  // Calculate plan date range
  const planDateRange = useMemo(() => {
    if (!plan) return null;

    const startDate = plan.started_at
      ? new Date(plan.started_at)
      : getCurrentDate();
    const planDurationDays = (plan.duration_weeks || 12) * 7; // Default to 12 weeks if not specified

    // Count missed days up to current date to extend plan duration
    let missedDaysCount = 0;
    if (plan.started_at) {
      const today = getCurrentDate();
      const currentDate = new Date(startDate);
      let planDay = 1;

      while (currentDate <= today && planDay <= planDurationDays) {
        const weekIndex = Math.floor((planDay - 1) / 7);
        const dayIndex = (planDay - 1) % 7;

        if (plan.weeks?.[weekIndex]?.days?.[dayIndex]) {
          const dayWorkouts = plan.weeks[weekIndex].days[dayIndex].workouts;
          if (dayWorkouts.length > 0) {
            const completedWorkouts = dayWorkouts.filter((w) => w.completed_at);
            if (completedWorkouts.length < dayWorkouts.length) {
              missedDaysCount++;
            }
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
        planDay++;
      }
    }

    const endDate = new Date(startDate);
    endDate.setDate(
      startDate.getDate() + planDurationDays + missedDaysCount - 1
    ); // -1 because we include the start date

    return {
      startDate,
      endDate,
      startMonth: new Date(startDate.getFullYear(), startDate.getMonth(), 1),
      endMonth: new Date(endDate.getFullYear(), endDate.getMonth(), 1),
    };
  }, [plan]);

  const [currentMonth, setCurrentMonth] = useState(() => {
    return planDateRange ? planDateRange.startMonth : new Date();
  });

  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const canNavigatePrevious = useMemo(() => {
    if (!planDateRange) return false;
    return currentMonth > planDateRange.startMonth;
  }, [currentMonth, planDateRange]);

  const canNavigateNext = useMemo(() => {
    if (!planDateRange) return false;
    return currentMonth < planDateRange.endMonth;
  }, [currentMonth, planDateRange]);

  // Process plan data to create calendar structure
  const calendarData = useMemo(() => {
    if (!plan || !planDateRange) return [];

    const { startDate, endDate } = planDateRange;
    const days = [];
    let missedDays = 0;

    // Calculate each day from start to end
    const currentDate = new Date(startDate);
    let planDay = 1;

    while (currentDate <= endDate) {
      // Find workouts for this day
      let dayWorkouts = [];
      const adjustedPlanDay = planDay - missedDays; // Adjust for missed days
      const weekIndex = Math.floor((adjustedPlanDay - 1) / 7);
      const dayIndex = (adjustedPlanDay - 1) % 7;

      // Get workouts from the correct week and day if within original plan duration
      if (
        weekIndex < plan.weeks?.length &&
        plan.weeks[weekIndex]?.days?.[dayIndex]
      ) {
        dayWorkouts = plan.weeks[weekIndex].days[dayIndex].workouts;
      }

      let dayType = "rest";

      if (dayWorkouts.length > 0) {
        // Check if workouts are completed
        const completedWorkouts = dayWorkouts.filter((w) => w.completed_at);
        const allCompleted = completedWorkouts.length === dayWorkouts.length;

        if (plan.started_at && currentDate < getCurrentDate()) {
          // Past day
          if (allCompleted) {
            const allSuccessful = completedWorkouts.every((w) => w.success);
            dayType = allSuccessful ? "success" : "failed";
          } else {
            // Instead of marking as missed, increment missedDays and add a missed day
            missedDays++;
            days.push({
              date: new Date(currentDate),
              planDay,
              type: "missed",
              workouts: [],
            });
            currentDate.setDate(currentDate.getDate() + 1);
            planDay++;
            continue; // Skip to next day
          }
        } else {
          // Future day or not started
          dayType = "scheduled";
        }
      }

      days.push({
        date: new Date(currentDate),
        planDay,
        type: dayType,
        workouts: dayWorkouts,
      });

      currentDate.setDate(currentDate.getDate() + 1);
      planDay++;
    }

    return days;
  }, [plan, planDateRange]);

  // Generate calendar grid for current month
  const calendarGrid = useMemo(() => {
    if (!planDateRange) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Check if this month is within the plan range
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); // Last day of month

    // If the month is completely outside the plan range, don't show anything
    if (
      monthEnd < planDateRange.startDate ||
      monthStart > planDateRange.endDate
    ) {
      return [];
    }

    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const grid = [];
    const current = new Date(startDate);

    for (let week = 0; week < 5; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const dayData = calendarData.find(
          (d) =>
            d.date.getDate() === current.getDate() &&
            d.date.getMonth() === current.getMonth() &&
            d.date.getFullYear() === current.getFullYear()
        );

        weekDays.push({
          date: new Date(current),
          isCurrentMonth: current.getMonth() === month,
          data: dayData,
        });

        current.setDate(current.getDate() + 1);
      }
      grid.push(weekDays);
    }

    return grid;
  }, [currentMonth, calendarData, planDateRange]);

  const navigateMonth = (direction) => {
    if (!planDateRange) return;

    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);

      // Constrain to plan date range
      if (newDate < planDateRange.startMonth) {
        return planDateRange.startMonth;
      }
      if (newDate > planDateRange.endMonth) {
        return planDateRange.endMonth;
      }

      return newDate;
    });
  };

  const getDayColor = (dayData) => {
    if (!dayData) return "";

    switch (dayData.type) {
      case "success":
        return "bg-[var(--secondary-light)]";
      case "failed":
        return "bg-[var(--danger-dark)]";
      /*       case "missed":
        return "bg-red-500"; */
      case "scheduled":
        return "border border-[var(--border)] border-dashed";
      default:
        return "";
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const monthAbbreviations = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const getDisplayedDay = (day) => {
    // If it's the 1st day of a month, check if we should show the month label
    if (day.date.getDate() === 1) {
      const monthAbbr = monthAbbreviations[day.date.getMonth()];

      // For the current viewing month, only show month label if it's not in the top left
      if (day.isCurrentMonth) {
        // Check if this is the top left position by seeing if there are previous month days
        const firstDayOfMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1
        );
        const dayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // If dayOfWeek > 0, then the first day is not on Sunday (top left), so show month label
        if (dayOfWeek > 0) {
          return `${monthAbbr} 1`;
        }
        // If dayOfWeek === 0, it's in the top left, so just show the day number
        return 1;
      } else {
        // For carryover months (previous/next), always show month label for 1st day
        return `${monthAbbr} 1`;
      }
    }
    // Otherwise just show the day number
    return day.date.getDate();
  };

  const handleDayClick = (day) => {
    if (!day.data || day.data.type === "rest") return;

    setSelectedDay({
      planDay: day.data.planDay,
      workouts: day.data.workouts,
      date: day.date,
    });
  };

  // Calculate progress statistics
  const progressStats = useMemo(() => {
    if (!plan || !planDateRange) return null;

    const originalTotalDays = (plan.duration_weeks || 12) * 7;
    let completedDays = 0;
    let missedDays = 0;
    let totalSets = 0;
    let failedSets = 0;
    let totalPlannedVolume = 0;
    let totalAchievedVolume = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    // Track performance by lift
    const liftPerformance = new Map(); // { liftName: { exceeded: number, failed: number, total: number } }

    // Process each day's data
    calendarData.forEach((day) => {
      if (day.type === "success" || day.type === "failed") {
        completedDays++;
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);

        // Process workouts
        day.workouts.forEach((workout) => {
          workout.lifts.forEach((lift) => {
            // Initialize lift performance tracking if not exists
            if (!liftPerformance.has(lift.name)) {
              liftPerformance.set(lift.name, {
                exceeded: 0,
                failed: 0,
                total: 0,
                name: lift.name,
              });
            }
            const performance = liftPerformance.get(lift.name);

            for (let i = 0; i < lift.sets; i++) {
              totalSets++;

              // Calculate planned volume
              const plannedVolume = lift.reps[i] * lift.weight[i];
              totalPlannedVolume += plannedVolume;

              // Calculate achieved volume and check for failed sets
              const achievedReps = lift.reps_achieved?.[i] || 0;
              const achievedWeight = lift.weight_achieved?.[i] || 0;
              const achievedVolume = achievedReps * achievedWeight;
              totalAchievedVolume += achievedVolume;

              // Track performance for this set
              performance.total++;

              // Check if set exceeded expectations (more reps or weight than planned)
              if (
                achievedReps > lift.reps[i] ||
                achievedWeight > lift.weight[i]
              ) {
                performance.exceeded++;
              }

              // Check if set failed (missed reps, weight, or RPE)
              const repsOK = achievedReps >= lift.reps[i];
              const weightOK = achievedWeight >= lift.weight[i];
              const rpeOK =
                !lift.rpe?.[i] ||
                !lift.rpe_achieved?.[i] ||
                lift.rpe_achieved[i] <= lift.rpe[i];

              if (!repsOK || !weightOK || !rpeOK) {
                failedSets++;
                performance.failed++;
              }
            }
          });
        });
      } else if (day.type === "missed") {
        missedDays++;
        currentStreak = 0;
      }
    });

    // Calculate lift performance metrics
    const liftMetrics = Array.from(liftPerformance.values())
      .filter((perf) => perf.total >= 5) // Only consider lifts with at least 5 sets
      .map((perf) => ({
        ...perf,
        successRate: ((perf.total - perf.failed) / perf.total) * 100,
        exceedRate: (perf.exceeded / perf.total) * 100,
        failRate: (perf.failed / perf.total) * 100,
      }));

    // Find the lift with the most exceeded sets (only consider lifts that have exceeded sets)
    const mostImproved = liftMetrics
      .filter((lift) => lift.exceeded > 0)
      .reduce((best, current) => {
        if (!best || current.exceeded > best.exceeded) {
          return current;
        }
        return best;
      }, null);

    // Find the lift with the most failed sets (only consider lifts that have failed sets)
    const leastImproved = liftMetrics
      .filter((lift) => lift.failed > 0)
      .reduce((worst, current) => {
        if (!worst || current.failed > worst.failed) {
          return current;
        }
        return worst;
      }, null);

    const adjustedTotalDays = originalTotalDays + missedDays;
    const successfulSetsPercentage =
      totalSets > 0
        ? Math.round(((totalSets - failedSets) / totalSets) * 100)
        : 0;
    const volumeCompletionPercentage =
      totalPlannedVolume > 0
        ? Math.round((totalAchievedVolume / totalPlannedVolume) * 100)
        : 0;

    return {
      originalProgress: Math.round((completedDays / originalTotalDays) * 100),
      adjustedProgress: Math.round((completedDays / adjustedTotalDays) * 100),
      originalTotalDays,
      adjustedTotalDays,
      completedDays,
      missedDays,
      failedSets,
      totalSets,
      successfulSetsPercentage,
      volumeCompletionPercentage,
      totalPlannedVolume,
      totalAchievedVolume,
      maxStreak,
      currentStreak,
      mostImproved,
      leastImproved,
    };
  }, [plan, planDateRange, calendarData]);

  return (
    <div className="flex  h-full bg-[var(--background)]">
      {/* Calendar Section - Expands when right panel collapses */}
      <div
        className={`${
          isRightPanelCollapsed || screenSize.isMobile ? "w-full" : "w-3/4"
        } transition-all duration-300 flex flex-col min-h-0 ${
          screenSize.isMobile ? "p-2" : "pr-16 p-4"
        }`}
      >
        {/* Calendar Header */}
        <div
          className={`flex ${screenSize.isMobile ? "flex-col gap-4" : "items-center justify-between mb-6"} flex-shrink-0`}
        >
          {!screenSize.isMobile && (
            <Button
              variant="tertiary"
              className="flex items-center gap-2"
              onClick={() => navigate("/plans")}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Back to Plans
            </Button>
          )}
          <h1
            className={`text-2xl font-bold text-[var(--text-primary)] ${screenSize.isMobile ? "text-center" : ""}`}
          >
            {plan.name} - Progress
          </h1>
          <span
            className={`flex items-center ${screenSize.isMobile ? "justify-center" : ""}`}
          >
            {!screenSize.isMobile && (
              <div className="space-y-2">
                <h4 className="font-medium text-center text-[var(--text-primary)]">
                  Legend
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-[var(--secondary-light)]"></div>
                    <span className="text-[var(--text-secondary)]">
                      Successful
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-[var(--danger-dark)]"></div>
                    <span className="text-[var(--text-secondary)]">Failed</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center">
              <Button
                variant="tertiary"
                onClick={() => navigateMonth(-1)}
                className="p-2"
                disabled={!canNavigatePrevious}
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </Button>
              <h2
                className={`${screenSize.isMobile ? "text-base" : "text-xl"} font-semibold text-[var(--text-primary)] min-w-[200px] text-center`}
              >
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h2>
              <Button
                variant="tertiary"
                onClick={() => navigateMonth(1)}
                className="p-2"
                disabled={!canNavigateNext}
              >
                <ChevronRightIcon className="w-5 h-5" />
              </Button>
            </div>
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 rounded-lg p-2 pt-6 flex flex-col justify-start min-h-0">
          {screenSize.isMobile ? (
            <>
              {/* Mobile Day Headers - sticky */}
              <div className="sticky top-0 bg-[var(--background)] pb-2">
                <div
                  ref={headerScrollRef}
                  className="overflow-x-auto scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  onScroll={(e) => handleMobileScroll(e.target)}
                >
                  <div className="grid grid-cols-7 gap-2 min-w-[800px] z-[-1]">
                    {dayNames.map((dayName) => (
                      <div
                        key={dayName}
                        className="p-2 text-center text-xs font-medium text-[var(--text-primary)]"
                      >
                        {dayName.slice(0, 1)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile Calendar Grid - scrollable weeks */}
              <div className="flex flex-col gap-2 flex-1">
                {calendarGrid.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-1">
                    <div
                      ref={weekScrollRefs.current[weekIndex]}
                      className="overflow-x-auto scrollbar-none flex-1"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                      onScroll={(e) => handleMobileScroll(e.target)}
                    >
                      <div className="grid grid-cols-7 gap-2 min-w-[800px] h-full">
                        {week.map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            className={`
                              relative p-1 rounded-lg flex flex-col min-h-[100px] h-full
                              ${
                                !day.isCurrentMonth || !day.data
                                  ? "border border-[var(--border)] border-dashed opacity-50"
                                  : "bg-[var(--surface)] cursor-pointer "
                              }
                              ${
                                day.data && day.data.type === "missed"
                                  ? "border border-[var(--danger)] border-dashed bg-opacity-50"
                                  : ""
                              }`}
                            onClick={() => handleDayClick(day)}
                          >
                            {day.data?.type !== "rest" && (
                              <div
                                className={`w-full h-[5px] absolute top-0 left-0 rounded-t-lg ${getDayColor(
                                  day.data
                                )}`}
                              />
                            )}
                            <div className="text-xs text-[var(--text-primary)]">
                              {getDisplayedDay(day)}
                            </div>
                            {day.data && (
                              <div className="flex-1 flex flex-col">
                                {day.data.type === "missed" ? (
                                  <div className="flex-1 flex items-center justify-center text-xs text-red-500 font-medium">
                                    Missed
                                  </div>
                                ) : day.data.type === "rest" ? (
                                  <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-secondary)]">
                                    Rest
                                  </div>
                                ) : day.data.workouts.length > 0 ? (
                                  <div className="mt-1 space-y-1 overflow-hidden text-[10px]">
                                    {day.data.workouts.map((workout) => (
                                      <div key={workout.id}>
                                        <div className="font-medium text-[var(--text-primary)] truncate">
                                          {workout.name}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Desktop Calendar Grid - unchanged
            <>
              <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
                {dayNames.map((dayName) => (
                  <div
                    key={dayName}
                    className="p-2 text-center text-sm font-medium text-[var(--text-primary)]"
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-2">
                {calendarGrid.flat().map((day, index) => (
                  <div
                    key={index}
                    className={`
                      relative ${screenSize.isMobile ? "p-1" : "p-2"} rounded-lg flex flex-col
                      ${
                        !day.isCurrentMonth || !day.data
                          ? "border border-[var(--border)] border-dashed opacity-50"
                          : "bg-[var(--surface)] cursor-pointer hover:border-2 hover:border-[var(--primary)]"
                      }
                     ${
                       day.data && day.data.type === "missed"
                         ? "border border-[var(--danger)] border-dashed bg-opacity-50"
                         : ""
                     }`}
                    onClick={() => handleDayClick(day)}
                  >
                    {day.data?.type !== "rest" && (
                      <div
                        className={`w-full h-2 absolute top-0 left-0 rounded-t-lg ${getDayColor(
                          day.data
                        )}`}
                      />
                    )}
                    <div
                      className={`${screenSize.isMobile ? "text-xs" : "text-sm"} text-[var(--text-primary)]`}
                    >
                      {getDisplayedDay(day)}
                    </div>
                    {day.data && (
                      <div className="flex-1 flex flex-col">
                        {day.data.type === "missed" ? (
                          <div className="flex-1 flex items-center justify-center text-xs text-red-500 font-medium">
                            Missed
                          </div>
                        ) : day.data.type === "rest" ? (
                          <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-secondary)]">
                            Rest
                          </div>
                        ) : day.data.workouts.length > 0 ? (
                          <div
                            className={`mt-1 space-y-1 overflow-hidden ${screenSize.isMobile ? "text-[10px]" : "text-xs"}`}
                          >
                            {day.data.workouts.map((workout) => (
                              <div key={workout.id}>
                                <div className="font-medium text-[var(--text-primary)] truncate">
                                  {workout.name}
                                </div>
                                {!screenSize.isMobile && (
                                  <div className="space-y-0.5 max-h-16 overflow-hidden">
                                    {workout.lifts?.slice(0, 3).map((lift) => (
                                      <div
                                        key={lift.id}
                                        className="text-[var(--text-secondary)] truncate"
                                      >
                                        {lift.name}: {lift.sets}x
                                        {lift.reps?.[0] || "?"}
                                        {lift.weight?.[0]
                                          ? ` @ ${lift.weight[0]}kg`
                                          : ""}
                                      </div>
                                    ))}
                                    {workout.lifts?.length > 3 && (
                                      <div className="text-[var(--text-secondary)]">
                                        +{workout.lifts.length - 3} more
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Panel - Fixed position, collapses to thin bar on desktop, slides from right on mobile */}
      <div
        className={`${
          screenSize.isMobile
            ? `fixed ${
                isRightPanelCollapsed
                  ? "w-[40px] right-0 top-[4rem] h-auto rounded-l-lg"
                  : "w-[85vw] right-0 top-[4rem] h-[60vh] rounded-l-xl"
              } transition-all duration-300 shadow-lg`
            : `${
                isRightPanelCollapsed ? "w-16" : "w-1/4"
              } fixed right-0 top-0 h-full`
        } border-l border-[var(--border)] bg-[var(--surface)] flex flex-col z-10`}
      >
        {/* Header with collapse button */}
        <div
          className={`flex items-center ${
            screenSize.isMobile && isRightPanelCollapsed
              ? "w-full flex-col justify-center cursor-pointer p-2"
              : "p-4 flex-shrink-0"
          }`}
          onClick={() =>
            screenSize.isMobile &&
            setIsRightPanelCollapsed(!isRightPanelCollapsed)
          }
        >
          {!isRightPanelCollapsed && (
            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex-1">
              Overview
            </h3>
          )}
          {screenSize.isMobile ? (
            isRightPanelCollapsed ? (
              <>
                <span
                  className="text-[var(--text-primary)] font-semibold text-sm mb-1"
                  style={{ writingMode: "vertical-rl" }}
                >
                  Overview
                </span>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-primary)] transform rotate-180" />
              </>
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-[var(--text-primary)]" />
            )
          ) : (
            <Button
              variant="tertiary"
              onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
              className="p-2"
            >
              <ChevronRightIcon
                className={`w-5 h-5 transition-transform ${
                  isRightPanelCollapsed ? "rotate-180" : ""
                }`}
              />
            </Button>
          )}
        </div>

        {/* Content - only visible when not collapsed */}
        {!isRightPanelCollapsed && progressStats && (
          <div className="flex-1 px-4 pb-4 overflow-y-auto">
            <div className="h-full space-y-6">
              {/* Progress Bars Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Progress
                </h4>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      Original Progress
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {progressStats.completedDays} /{" "}
                      {progressStats.originalTotalDays} days
                    </span>
                  </div>
                  <div className="w-full bg-[var(--background-alt)] rounded-full h-2.5">
                    <div
                      className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressStats.originalProgress}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      Adjusted Progress
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {progressStats.completedDays} /{" "}
                      {progressStats.adjustedTotalDays} days
                    </span>
                  </div>
                  <div className="w-full bg-[var(--background-alt)] rounded-full h-2.5">
                    <div
                      className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progressStats.adjustedProgress}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-secondary)] italic">
                    Includes {progressStats.missedDays} missed{" "}
                    {progressStats.missedDays === 1 ? "day" : "days"}
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Statistics
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--background)] p-3 rounded-lg">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {progressStats.successfulSetsPercentage}%
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Sets Successful
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {progressStats.failedSets} failed sets
                    </div>
                  </div>

                  <div className="bg-[var(--background)] p-3 rounded-lg">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {progressStats.volumeCompletionPercentage}%
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Volume Completed
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      {Math.round(
                        progressStats.totalAchievedVolume
                      ).toLocaleString()}{" "}
                      /{" "}
                      {Math.round(
                        progressStats.totalPlannedVolume
                      ).toLocaleString()}{" "}
                      kg
                    </div>
                  </div>

                  <div className="bg-[var(--background)] p-3 rounded-lg">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {progressStats.maxStreak}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Longest Streak
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      Days without missing
                    </div>
                  </div>

                  <div className="bg-[var(--background)] p-3 rounded-lg">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {progressStats.currentStreak}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Current Streak
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] mt-1">
                      Days in a row
                    </div>
                  </div>
                </div>
              </div>

              {/* Lift Performance Section */}
              {(progressStats.mostImproved || progressStats.leastImproved) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Lift Performance
                  </h4>

                  <div className="space-y-3">
                    {progressStats.mostImproved && (
                      <div className="bg-[var(--background)] p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              Most Improved
                            </div>
                            <div className="text-lg font-bold text-[var(--primary)] mt-1 capitalize">
                              {progressStats.mostImproved.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[var(--primary)]">
                              {progressStats.mostImproved.exceeded}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              sets exceeded
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-2">
                          Out of {progressStats.mostImproved.total} total sets (
                          {Math.round(progressStats.mostImproved.exceedRate)}%)
                        </div>
                      </div>
                    )}

                    {progressStats.leastImproved && (
                      <div className="bg-[var(--background)] p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium text-[var(--text-primary)]">
                              Needs Improvement
                            </div>
                            <div className="text-lg font-bold text-[var(--danger)] mt-1 capitalize">
                              {progressStats.leastImproved.name}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-[var(--danger)]">
                              {progressStats.leastImproved.failed}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)]">
                              sets failed
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-[var(--text-secondary)] mt-2">
                          Out of {progressStats.leastImproved.total} total sets
                          ({Math.round(progressStats.leastImproved.failRate)}%)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Day Modal */}
      <DayModal
        isOpen={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        day={selectedDay}
      />
    </div>
  );
};

export default PlanProgress;
