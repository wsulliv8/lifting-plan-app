import { useMemo, useState } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import PlanGrid from "../../components/plans/editor/PlanGrid";
import Button from "../../components/common/Button";
import { computeWorkoutsByDay } from "../../utils/planUtils";
import { usePlanData } from "../../hooks/usePlanData";
import { downloadPlan } from "../../services/plans";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

const PlanViewer = () => {
  const navigate = useNavigate();
  const { plan, workouts, totalDays } = usePlanData(useLoaderData());
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());
  const [collapsedDays, setCollapsedDays] = useState(Array(7).fill(false));

  const workoutsByDay = useMemo(
    () => computeWorkoutsByDay(workouts),
    [workouts]
  );

  const handleDownload = async () => {
    try {
      const newPlan = await downloadPlan(plan.id);
      navigate(`/plans/${newPlan.id}/edit`);
    } catch (error) {
      console.error("Failed to download plan:", error);
    }
  };

  const toggleWeekCollapse = (weekIndex) => {
    setCollapsedWeeks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(weekIndex)) {
        newSet.delete(weekIndex);
      } else {
        newSet.add(weekIndex);
      }
      return newSet;
    });
  };

  const toggleDayCollapse = (dayIndex) => {
    setCollapsedDays((prev) => {
      const newDays = [...prev];
      newDays[dayIndex] = !newDays[dayIndex];
      return newDays;
    });
  };

  // Read-only state for the grid
  const viewerState = {
    collapsedWeeks,
    collapsedDays,
    selectedDays: [],
    handleEditWorkout: () => {}, // No-op
    handleClick: () => {}, // No-op
    toggleWeekCollapse,
    handleDeleteWeek: () => {}, // No-op
    toggleDayCollapse,
    activeWorkout: null,
    sensors: [],
    handleDragStart: () => {}, // No-op
    handleDragEnd: () => {}, // No-op
    onContextMenu: () => {}, // No-op
    setTotalDays: () => {}, // No-op
  };

  return (
    <div className="w-full h-full">
      {/* Header with navigation and actions */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="tertiary"
          className="flex items-center gap-2"
          onClick={() => navigate("/plans")}
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Back to Plans
        </Button>
        <Button variant="primary" onClick={handleDownload}>
          Download Plan
        </Button>
      </div>

      {/* Header with plan details */}
      <div className="mb-6 p-4 bg-[var(--surface)] rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">{plan.name}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Goal</p>
            <p className="font-medium">{plan.goal || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Duration</p>
            <p className="font-medium">{plan.duration_weeks} weeks</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Difficulty</p>
            <p className="font-medium">{plan.difficulty || "Not specified"}</p>
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Categories</p>
            <p className="font-medium">
              {plan.categories?.join(", ") || "Not specified"}
            </p>
          </div>
        </div>
        {plan.description && (
          <div className="mt-4">
            <p className="text-sm text-[var(--text-secondary)]">Description</p>
            <p className="mt-1">{plan.description}</p>
          </div>
        )}
      </div>

      {/* Read-only plan grid */}
      <PlanGrid
        workouts={workoutsByDay}
        totalDays={totalDays}
        plan={plan}
        isReadOnly={true}
        {...viewerState}
      />
    </div>
  );
};

export default PlanViewer;
