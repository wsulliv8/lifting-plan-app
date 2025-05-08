import { useState } from "react";
import Input from "../common/Input";

// WorkoutEditor Component (assuming this remains unchanged)
const WorkoutEditor = ({ workouts, onSave }) => {
  const [editedWorkouts, setEditedWorkouts] = useState(workouts);

  const addWorkout = () => {
    setEditedWorkouts([
      ...editedWorkouts,
      { id: `${Date.now()}`, name: "", sets: 0, reps: 0 },
    ]);
  };

  const updateWorkout = (index, field, value) => {
    const updated = [...editedWorkouts];
    updated[index] = { ...updated[index], [field]: value };
    setEditedWorkouts(updated);
  };

  const removeWorkout = (index) => {
    setEditedWorkouts(editedWorkouts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {editedWorkouts.map((workout, index) => (
        <div key={workout.id} className="p-4 bg-gray-100 rounded-lg space-y-2">
          <Input
            label="Exercise Name"
            value={workout.name}
            onChange={(e) => updateWorkout(index, "name", e.target.value)}
            className="w-full"
          />
          <Input
            label="Sets"
            type="number"
            value={workout.sets}
            onChange={(e) =>
              updateWorkout(index, "sets", parseInt(e.target.value) || 0)
            }
            className="w-full"
          />
          <Input
            label="Reps"
            type="number"
            value={workout.reps}
            onChange={(e) =>
              updateWorkout(index, "reps", parseInt(e.target.value) || 0)
            }
            className="w-full"
          />
          <button
            onClick={() => removeWorkout(index)}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        onClick={addWorkout}
        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Add Workout
      </button>
      <button
        onClick={() => onSave(editedWorkouts)}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Save
      </button>
    </div>
  );
};

export default WorkoutEditor;
