import { useState } from "react";

const LiftSearch = ({ lifts, onSelectLift, className }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");

  // Extract unique muscle groups and equipment for dropdowns
  const muscleGroups = Array.from(
    new Set(
      lifts.flatMap((lift) => [
        ...lift.primary_muscle_groups,
        ...lift.secondary_muscle_groups,
      ])
    )
  );
  const equipment = Array.from(
    new Set(lifts.flatMap((lift) => lift.equipment))
  );

  // Filter lifts based on search and dropdowns
  const filteredLifts = lifts.filter((lift) => {
    const matchesSearch = lift.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesMuscleGroup =
      !selectedMuscleGroup ||
      lift.primary_muscle_groups.includes(selectedMuscleGroup) ||
      lift.secondary_muscle_groups.includes(selectedMuscleGroup);
    const matchesEquipment =
      !selectedEquipment || lift.equipment.includes(selectedEquipment);
    return matchesSearch && matchesMuscleGroup && matchesEquipment;
  });

  return (
    <div className={`flex flex-col  p-4 bg-white ${className}`}>
      <form className="space-y-2 mb-4">
        <input
          type="text"
          placeholder="Search lifts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedMuscleGroup}
          onChange={(e) => setSelectedMuscleGroup(e.target.value)}
          className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Muscle Groups</option>
          {muscleGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value)}
          className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Equipment</option>
          {equipment.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </form>
      <div className="overflow-y-auto flex-1">
        {filteredLifts.length > 0 ? (
          filteredLifts.map((lift) => (
            <div
              key={lift.id}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer rounded"
              onClick={() => onSelectLift(lift)}
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
                {lift.video_url ? (
                  <img
                    src={lift.video_url}
                    alt={lift.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center h-full text-gray-500 text-xs">
                    {lift.name[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold">{lift.name}</p>
                <p className="text-sm text-gray-500">
                  {lift.primary_muscle_groups.join(", ")}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No lifts found</p>
        )}
      </div>
    </div>
  );
};

export default LiftSearch;
