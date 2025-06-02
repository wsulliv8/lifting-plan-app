import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { downloadPlan } from "../../services/plans";
import { TrashIcon } from "@heroicons/react/24/outline";

const PlanCard = ({ plan, planType, onDelete }) => {
  const navigate = useNavigate();

  const handleDownload = async () => {
    try {
      const newPlan = await downloadPlan(plan.id);
      navigate(`/plans/${newPlan.id}/edit`);
    } catch (error) {
      console.error("Failed to download plan:", error);
    }
  };

  // Calculate progress
  const progressPercentage = plan.totalWorkouts
    ? Math.round((plan.completedWorkouts / plan.totalWorkouts) * 100)
    : 0;

  return (
    <div className="card flex flex-col gap-2">
      {/* Top Section: Image (Left) + Details (Right) */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Top-Left: Image */}
        <div className="w-full sm:w-24 h-24 flex-shrink-0">
          <img
            src={plan.image || "https://via.placeholder.com/128"}
            alt={`${plan.name} thumbnail`}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        {/* Top-Right: Plan Details */}
        <div className="flex-1 text-center">
          <h3 className="heading mb-2">{plan.name}</h3>
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium">Goal:</span> {plan.goal || "Strength"}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium">Duration:</span> {plan.duration_weeks}{" "}
            weeks
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            <span className="font-medium">Difficulty:</span>{" "}
            {plan.difficulty || "Intermediate"}
          </p>
        </div>
      </div>

      {/* Bottom: Action Buttons */}
      {planType === "your" ? (
        <>
          <div className="w-full mb-2">
            <div className="text-sm text-[var(--text-secondary)] mb-1">
              Progress: {progressPercentage}%
            </div>
            <div className="w-full bg-[var(--background-alt)] rounded-full h-2.5">
              <div
                className="bg-[var(--primary)] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/workouts/${plan.current_workout_id}`)}
            className="text-sm w-10/12 m-auto"
          >
            Start Workout
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/plans/${plan.id}/progress`)}
            className="text-sm w-10/12 m-auto"
          >
            View Progress
          </Button>
          <div className="flex w-10/12 m-auto gap-2">
            <Button
              variant="tertiary"
              onClick={() => navigate(`/plans/${plan.id}/edit`)}
              className="text-sm flex-1"
            >
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => onDelete(plan.id)}
              className="text-sm flex-none"
            >
              <TrashIcon className="h-6 w-6" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button
            variant="primary"
            onClick={handleDownload}
            className="text-sm sm:col-span-2"
          >
            Download Plan
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/plans/${plan.id}`)}
            className="text-sm sm:col-span-2"
          >
            View Plan
          </Button>
        </>
      )}
    </div>
  );
};

export default PlanCard;
