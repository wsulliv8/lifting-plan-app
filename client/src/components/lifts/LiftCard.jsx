import { useState } from "react";

const LiftCard = ({ lift }) => {
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="rounded-lg bg-white shadow border-gray-300">
      {/* Tabs */}
      <div className="flex border-b-0">
        <button
          className={`flex-1 py-1 px-4 text-center text-sm rounded-tl-lg ${
            activeTab === "general"
              ? "bg-white shadow-[0_-1px_0_0_rgba(0,0,0,0)] "
              : "bg-gray-200  text-gray-600"
          }`}
          onClick={() => setActiveTab("general")}
        >
          General Info
        </button>
        <button
          className={`flex-1 py-1 px-4 text-center rounded-tr-lg ${
            activeTab === "instructions"
              ? "bg-white  shadow-[0_-1px_0_0_rgba(0,0,0,0)]"
              : "bg-gray-200  text-gray-600"
          }`}
          onClick={() => setActiveTab("instructions")}
        >
          Instructions
        </button>
      </div>
      {/* Card Content */}
      <div className="flex justify-between rounded-lg p-4 bg-white shadow rounded-t-lg">
        {/* Name (Left) */}
        <div>
          <h2 className="text-xl font-semibold">{lift.name}</h2>
          {activeTab === "general" ? (
            <div className="mt-2 text-sm">
              <p>
                <span className="font-semibold">Primary: </span>{" "}
                {lift.primary_muscle_groups.join(", ")}
              </p>
              <p>
                <span className="font-semibold">Secondary: </span>
                {lift.secondary_muscle_groups.join(", ")}
              </p>
              <p>
                <span className="font-semibold">Type: </span> {lift.lift_type}
              </p>
              <p>
                <span className="font-semibold">Equipment: </span>{" "}
                {lift.equipment.join(", ")}
              </p>
            </div>
          ) : (
            <div>
              <h3 className=" font-medium">How to Perform:</h3>
              <ol className="text-sm list-decimal pl-5 mt-1 text-gray-600">
                {lift.how_to.length > 0 ? (
                  lift.how_to.map((step, index) => <li key={index}>{step}</li>)
                ) : (
                  <li>No instructions available</li>
                )}
              </ol>
            </div>
          )}
        </div>
        {/* GIF (Right) */}
        <div>
          {lift.video_url ? (
            <img
              src={lift.video_url}
              alt={`${lift.name} demo`}
              className="w-56 h-48 object-cover rounded"
            />
          ) : (
            <div className="w-56 h-48 bg-gray-200 flex items-center justify-center rounded">
              <span className="text-gray-500">No GIF available</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiftCard;
