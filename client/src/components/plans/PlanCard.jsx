import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button"; // Assuming your Button component
import { deletePlan, downloadPlan } from "../../services/plans"; // Your API client for DELETE /api/plans/:id
import { TrashIcon } from "@heroicons/react/24/outline";

const PlanCard = ({ plan, planType, onDelete }) => {
  const navigate = useNavigate();

  const handleDownload = async () => {
    try {
      await downloadPlan(plan.id); // Assumes POST /api/plans/download
      window.location.reload(); // Temporary; refresh to show updated Your Plans
    } catch (error) {
      console.error("Failed to download plan:", error);
    }
  };

  // Calculate progress (e.g., 3/10 workouts completed = 30%)
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
          <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Goal:</span> {plan.goal || "Strength"}
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Duration:</span> {plan.duration_weeks}{" "}
            weeks
          </p>
          <p className="text-gray-600 text-sm">
            <span className="font-medium">Difficulty:</span>{" "}
            {plan.difficulty || "Intermediate"}
          </p>
        </div>
      </div>

      {/* Bottom: Action Buttons */}
      {planType === "your" ? (
        <>
          <div className="w-full mb-2">
            <div className="text-sm text-gray-600 mb-1">
              Progress: {progressPercentage}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => navigate(`/workouts/${plan.current_workout_id}`)}
            className="text-sm w-10/12 m-auto  bg-green-500 hover:bg-green-600"
          >
            Start Workout
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/plans/${plan.id}/progress`)}
            className="text-sm w-10/12 m-auto  bg-blue-500 hover:bg-blue-600"
          >
            View Progress
          </Button>
          <div className="flex w-10/12 m-auto gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/plans/${plan.id}/edit`)}
              className="text-sm flex-1"
            >
              Edit
            </Button>
            <Button
              variant="secondary"
              onClick={() => onDelete(plan.id)}
              className="text-sm   bg-red-500 hover:bg-red-600 text-white flex-none"
            >
              <TrashIcon className="h-6 w-6 text-gray-800" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <Button
            variant="secondary"
            onClick={() => navigate(`/plans/${plan.id}`)}
            className="text-sm sm:col-span-2"
          >
            View Plan
          </Button>
          <Button
            variant="secondary"
            onClick={handleDownload}
            className="text-sm sm:col-span-2 bg-green-500 hover:bg-green-600 text-white"
          >
            Download Plan
          </Button>
        </>
      )}
    </div>
  );
};

export default PlanCard;
