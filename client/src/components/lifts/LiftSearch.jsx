import { useState } from "react";

const LiftSearch = ({ lifts, onSelectLift, selectedLifts = [], className }) => {
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

  const isSelected = (lift) => selectedLifts.some((l) => l.id === lift.id);

  return (
    <div className={`flex flex-col p-4 bg-[var(--surface)] ${className}`}>
      <form className="space-y-2 mb-4">
        <input
          type="text"
          placeholder="Search lifts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field w-full"
        />
        <select
          value={selectedMuscleGroup}
          onChange={(e) => setSelectedMuscleGroup(e.target.value)}
          className="input-field w-full"
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
          className="input-field w-full"
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
              className={`flex items-center p-2 md:hover:bg-[var(--background)] cursor-pointer rounded ${
                isSelected(lift) ? "" : ""
              }`}
              onClick={() => onSelectLift(lift)}
            >
              <div
                className={`w-8 h-8 rounded-full mr-2 overflow-hidden ${
                  isSelected(lift)
                    ? "bg-[var(--primary-light)]"
                    : "bg-[var(--background)]"
                }`}
              >
                {lift.video_url ? (
                  <img
                    src={lift.video_url}
                    alt={lift.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span
                    className={`flex items-center justify-center h-full text-xs ${
                      isSelected(lift)
                        ? "text-[var(--background)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {lift.name[0]}
                  </span>
                )}
              </div>
              <div>
                <p
                  className={`font-semibold ${
                    isSelected(lift)
                      ? "text-[var(--primary-light)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  {lift.name}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {lift.primary_muscle_groups.join(", ")}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-[var(--text-secondary)]">No lifts found</p>
        )}
      </div>
    </div>
  );
};

export default LiftSearch;
