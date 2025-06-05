import PlanCard from "./PlanCard";

const PlanList = ({ plans, isLoading, planType, onDelete }) => {
  if (isLoading) {
    return (
      <div className="p-4 text-[var(--text-secondary)]">Loading plans...</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 place-items-center">
      {plans.length === 0 ? (
        <p className="text-[var(--text-secondary)]">No plans available.</p>
      ) : (
        plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            planType={planType}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
};

export default PlanList;
