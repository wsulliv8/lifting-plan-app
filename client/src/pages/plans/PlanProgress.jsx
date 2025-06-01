import { useState, useMemo } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon, ArrowLeftIcon } from "@heroicons/react/20/solid";
import Button from "../../components/common/Button";

const PlanProgress = () => {
  const { plan } = useLoaderData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);
  const navigate = useNavigate();
  // Process plan data to create calendar structure
  const calendarData = useMemo(() => {
    if (!plan || !plan.started_at) return [];

    const startDate = new Date(plan.started_at);
    const currentDate = new Date();
    const days = [];
    let shiftForward = 0;

    // Flatten all workouts from the plan
    const allWorkouts = [];
    plan.weeks?.forEach((week) => {
      week.days?.forEach((day) => {
        day.workoutDays?.forEach((workoutDay) => {
          if (workoutDay.workout) {
            allWorkouts.push({
              ...workoutDay.workout,
              dayOfWeek: day.day_of_week,
              weekNumber: week.week_number,
            });
          }
        });
      });
    });

    // Sort workouts by plan_day
    allWorkouts.sort((a, b) => a.plan_day - b.plan_day);

    // Loop from start date to current date
    const daysDiff = Math.floor(
      (currentDate - startDate) / (1000 * 60 * 60 * 24)
    );

    for (let dayIndex = 0; dayIndex <= daysDiff; dayIndex++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + dayIndex);

      // Find workouts for this day
      const dayWorkouts = allWorkouts.filter(
        (workout) => workout.plan_day === dayIndex + 1 - shiftForward
      );

      if (dayWorkouts.length > 0) {
        // Check if all workouts are completed on time
        const allCompleted = dayWorkouts.every((workout) => {
          if (!workout.completed_at) return false;
          const completedDate = new Date(workout.completed_at);
          const expectedDate = new Date(startDate);
          expectedDate.setDate(
            startDate.getDate() + workout.plan_day - 1 + shiftForward
          );
          return (
            Math.floor(
              (completedDate - expectedDate) / (1000 * 60 * 60 * 24)
            ) === 0
          );
        });

        if (!allCompleted) {
          // Add missed days until requirement is met
          let missedDays = 0;
          while (!allCompleted && dayIndex + missedDays <= daysDiff) {
            days.push({
              date: new Date(
                currentDay.getTime() + missedDays * 24 * 60 * 60 * 1000
              ),
              type: "missed",
              workouts: [],
            });
            missedDays++;
          }
          shiftForward += missedDays;
        }

        // Add the actual day
        const allSuccessful = dayWorkouts.every((workout) => workout.success);
        days.push({
          date: currentDay,
          type: dayWorkouts.every((w) => w.completed_at)
            ? allSuccessful
              ? "success"
              : "completed"
            : "scheduled",
          workouts: dayWorkouts,
        });
      } else {
        // Rest day
        days.push({
          date: currentDay,
          type: "rest",
          workouts: [],
        });
      }
    }

    // Handle future days based on current_workout_id
    if (plan.current_workout_id) {
      const nextWorkout = allWorkouts.find(
        (w) => w.id === plan.current_workout_id
      );
      if (nextWorkout) {
        const expectedDay = nextWorkout.plan_day + shiftForward;
        const daysSinceStart = Math.floor(
          (currentDate - startDate) / (1000 * 60 * 60 * 24)
        );

        if (expectedDay > daysSinceStart + 1) {
          // Add missed days until we reach the expected day
          for (let i = daysSinceStart + 1; i < expectedDay; i++) {
            const missedDate = new Date(startDate);
            missedDate.setDate(startDate.getDate() + i);
            days.push({
              date: missedDate,
              type: "missed",
              workouts: [],
            });
          }
        }
      }
    }

    return days;
  }, [plan]);

  // Generate calendar grid for current month
  const calendarGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
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
  }, [currentMonth, calendarData]);

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const getDayColor = (dayData) => {
    if (!dayData) return "";

    switch (dayData.type) {
      case "success":
        return "border-t-4 border-green-500";
      case "completed":
        return "border-t-4 border-yellow-500";
      case "missed":
        return "border-t-4 border-red-500";
      case "scheduled":
        return "border-t-4 border-blue-500 opacity-60";
      case "rest":
        return "border-t-4 border-gray-400";
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

  return (
    <div className="flex h-full bg-[var(--background)]">
      {/* Calendar Section - Expands when right panel collapses */}
      <div
        className={`${
          isRightPanelCollapsed ? "w-full pr-16" : "w-3/4"
        } transition-all duration-300 p-4 flex flex-col min-h-0`}
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <span
          className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)]"
          onClick={() => navigate("/plans/")}
        >
          <ArrowLeftIcon className="w-6 h-6" />
          <span>(To Plans)</span>
        </span>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {plan.name} - Progress
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="tertiary"
              onClick={() => navigateMonth(-1)}
              className="p-2"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] min-w-[200px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <Button
              variant="tertiary"
              onClick={() => navigateMonth(1)}
              className="p-2"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 flex flex-col min-h-0">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2 flex-shrink-0">
            {dayNames.map((dayName) => (
              <div
                key={dayName}
                className="p-2 text-center text-sm font-medium text-[var(--text-secondary)]"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="flex-1 grid grid-rows-5 gap-1">
            {calendarGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className={`
                      relative p-2 bg-[var(--background)] rounded border border-[var(--border)]
                      ${!day.isCurrentMonth ? "opacity-30" : ""}
                      ${getDayColor(day.data)}
                    `}
                  >
                    <div className="text-sm text-[var(--text-primary)]">
                      {getDisplayedDay(day)}
                    </div>
                    {day.data && (
                      <div className="mt-1">
                        {day.data.type === "missed" ? (
                          <div className="text-xs text-red-500 font-medium">
                            Missed
                          </div>
                        ) : day.data.workouts.length > 0 ? (
                          <div className="text-xs text-[var(--text-secondary)]">
                            {day.data.workouts.length} workout
                            {day.data.workouts.length > 1 ? "s" : ""}
                          </div>
                        ) : day.data.type === "rest" ? (
                          <div className="text-xs text-[var(--text-secondary)]">
                            Rest
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Fixed position, collapses to thin bar */}
      <div
        className={`${
          isRightPanelCollapsed ? "w-16" : "w-1/4"
        } transition-all duration-300 border-l border-[var(--border)] bg-[var(--surface)] flex flex-col fixed right-0 top-0 h-full z-10`}
      >
        {/* Header with collapse button */}
        <div className="flex items-center p-4 flex-shrink-0">
          {!isRightPanelCollapsed && (
            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex-1">
              Overview
            </h3>
          )}
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
        </div>

        {/* Content - only visible when not collapsed */}
        {!isRightPanelCollapsed && (
          <div className="flex-1 px-4 pb-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="text-sm text-[var(--text-secondary)]">
                Data overview coming soon...
              </div>

              {/* Legend */}
              <div className="space-y-2">
                <h4 className="font-medium text-[var(--text-primary)]">
                  Legend
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-green-500"></div>
                    <span className="text-[var(--text-secondary)]">
                      Successful
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-yellow-500"></div>
                    <span className="text-[var(--text-secondary)]">
                      Completed
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-blue-500"></div>
                    <span className="text-[var(--text-secondary)]">
                      Scheduled
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-red-500"></div>
                    <span className="text-[var(--text-secondary)]">Missed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-1 bg-gray-400"></div>
                    <span className="text-[var(--text-secondary)]">Rest</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanProgress;
