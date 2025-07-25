import { Link, useNavigate } from "react-router-dom";
import Button from "../common/Button";
import { downloadPlan } from "../../services/plans";
import { TrashIcon } from "@heroicons/react/24/outline";

const PlanCard = ({ plan, planType, onDelete, isAdmin }) => {
  const navigate = useNavigate();
  const handleDownload = async () => {
    try {
      const newPlan = await downloadPlan(plan.id);
      navigate(`/plans/${newPlan.id}/edit`);
    } catch (error) {
      console.error("Failed to download plan:", error);
    }
  };

  // Calculate progress using passed in values
  const progressPercentage = plan.totalWorkouts
    ? Math.round((plan.completedWorkouts / plan.totalWorkouts) * 100)
    : 0;

  return (
    <div className="card flex flex-col gap-2 w-full max-w-xl justify-self-center">
      {/* Top Section: Image (Left) + Details (Right) */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Top-Right: Plan Details */}
        <div className="flex-1 text-center">
          <h3 className="heading mb-2">{plan.name}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Goal</p>
              <p className="text-sm text-[var(--text-primary)]">
                {plan.goal || "Not specified"}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Duration</p>
              <p className="text-sm text-[var(--text-primary)]">
                {plan.duration_weeks} weeks
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Difficulty</p>
              <p className="text-sm text-[var(--text-primary)]">
                {plan.difficulty || "Not specified"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Action Buttons */}
      {planType === "your" ? (
        <>
          <div className="w-full mb-2">
            <div className="text-sm text-[var(--text-secondary)] mb-1">
              Progress: {progressPercentage}% ({plan.completedWorkouts}/
              {plan.totalWorkouts} workouts)
            </div>
            <div className="w-full bg-[var(--background)] rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${progressPercentage}%`,
                  background:
                    "linear-gradient(90deg, #99F6E4 0%, #134E4A 100%)",
                }}
              ></div>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/workouts/${plan.current_workout_id}`)}
            className="text-sm w-10/12 mx-auto"
          >
            Start Workout
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/plans/${plan.id}/progress`)}
            className="text-sm w-10/12 mx-auto"
          >
            View Progress
          </Button>
          <div className="flex w-10/12 mx-auto gap-2">
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
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => navigate(`/plans/${plan.id}`)}
              className="text-sm flex-1"
            >
              View Plan
            </Button>
            {isAdmin && (
              <Button
                variant="danger"
                onClick={() => onDelete(plan.id)}
                className="text-sm flex-none"
              >
                <TrashIcon className="h-6 w-6" />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PlanCard;
