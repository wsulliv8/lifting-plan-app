import PlanCard from "./PlanCard";

const PlanList = ({ plans, isLoading, planType, onDelete }) => {
  if (isLoading) {
    return <div className="p-4 text-gray-600">Loading plans...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.length === 0 ? (
        <p className="text-gray-600">No plans available.</p>
      ) : (
        plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={{
              ...plan,
              completedWorkouts:
                plan.workouts?.filter((w) => w.completed).length || 0,
              totalWorkouts: plan.workouts?.length || 0,
            }}
            planType={planType}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default PlanList;
