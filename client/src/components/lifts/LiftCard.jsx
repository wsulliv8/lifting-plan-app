import { useState } from "react";

const LiftCard = ({ lift }) => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="rounded-lg bg-[var(--surface)] shadow-md border border-[var(--border)]">
      {/* Tabs */}
      <div className="flex">
        <button
          className={`flex-1 py-1 px-4 text-center text-sm rounded-tl-lg transition-colors ${
            activeTab === "general"
              ? "bg-[var(--surface)] text-[var(--text-primary)]"
              : "bg-[var(--background)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => setActiveTab("general")}
        >
          General Info
        </button>
        <button
          className={`flex-1 py-1 px-4 text-center text-sm rounded-tr-lg transition-colors ${
            activeTab === "instructions"
              ? "bg-[var(--surface)] text-[var(--text-primary)]"
              : "bg-[var(--background)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
          onClick={() => setActiveTab("instructions")}
        >
          Instructions
        </button>
      </div>
      {/* Card Content */}
      <div className="flex flex-col md:flex-row md:justify-between p-4 bg-[var(--surface)] rounded-b-lg">
        {/* Name and Info */}
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {lift.name}
          </h2>
          {activeTab === "general" ? (
            <div className="mt-2 text-sm space-y-1">
              <p className="text-[var(--text-primary)]">
                <span className="font-semibold">Primary: </span>
                {lift.primary_muscle_groups.join(", ")}
              </p>
              <p className="text-[var(--text-primary)]">
                <span className="font-semibold">Secondary: </span>
                {lift.secondary_muscle_groups.join(", ")}
              </p>
              <p className="text-[var(--text-primary)]">
                <span className="font-semibold">Type: </span> {lift.lift_type}
              </p>
              <p className="text-[var(--text-primary)]">
                <span className="font-semibold">Equipment: </span>
                {lift.equipment.join(", ")}
              </p>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-[var(--text-primary)]">
                How to Perform:
              </h3>
              <ol className="text-sm list-decimal pl-5 mt-1 text-[var(--text-secondary)]">
                {lift.how_to.length > 0 ? (
                  lift.how_to.map((step, index) => <li key={index}>{step}</li>)
                ) : (
                  <li>No instructions available</li>
                )}
              </ol>
            </div>
          )}
        </div>
        {/* GIF */}
        <div className="w-full md:w-56 md:flex-shrink-0 md:ml-4">
          {lift.video_url ? (
            <img
              src={lift.video_url}
              alt={`${lift.name} demo`}
              className="w-full md:w-56 h-48 object-cover rounded-lg border border-[var(--border)]"
            />
          ) : (
            <div className="w-full md:w-56 h-48 bg-[var(--background)] flex items-center justify-center rounded-lg border border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">
                No GIF available
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiftCard;
