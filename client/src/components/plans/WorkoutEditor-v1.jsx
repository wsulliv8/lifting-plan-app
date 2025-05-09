import { useState } from "react";
import Input from "../common/Input";

const WorkoutEditor = ({ workouts, onSave }) => {
  const [editedWorkouts, setEditedWorkouts] = useState(workouts);

  const addWorkout = () => {
    setEditedWorkouts([
      ...editedWorkouts,
      { id: `${Date.now()}`, name: "", lifts: [] },
    ]);
  };

  const updateWorkoutName = (workoutIndex, value) => {
    const updated = [...editedWorkouts];
    updated[workoutIndex] = { ...updated[workoutIndex], name: value };
    setEditedWorkouts(updated);
  };

  const addLift = (workoutIndex) => {
    const updated = [...editedWorkouts];
    const newLift = {
      id: `${Date.now()}-${workoutIndex}`,
      name: "",
      sets: 0,
      reps: 0,
    };
    updated[workoutIndex].lifts.push(newLift);
    setEditedWorkouts(updated);
  };

  const updateLift = (workoutIndex, liftIndex, field, value) => {
    const updated = [...editedWorkouts];
    const lift = updated[workoutIndex].lifts[liftIndex];
    updated[workoutIndex].lifts[liftIndex] = { ...lift, [field]: value };
    setEditedWorkouts(updated);
  };

  const removeLift = (workoutIndex, liftIndex) => {
    const updated = [...editedWorkouts];
    updated[workoutIndex].lifts = updated[workoutIndex].lifts.filter(
      (_, i) => i !== liftIndex
    );
    setEditedWorkouts(updated);
  };

  const removeWorkout = (workoutIndex) => {
    setEditedWorkouts(editedWorkouts.filter((_, i) => i !== workoutIndex));
  };

  return (
    <div className="space-y-4">
      {editedWorkouts.map((workout, workoutIndex) => (
        <div key={workout.id} className="p-4 bg-gray-100 rounded-lg space-y-4">
          <Input
            label="Workout Name"
            value={workout.name}
            onChange={(e) => updateWorkoutName(workoutIndex, e.target.value)}
            className="w-full"
          />
          <div className="space-y-2">
            {workout.lifts.map((lift, liftIndex) => (
              <div key={lift.id} className="p-2 bg-white rounded-lg space-y-2">
                <Input
                  label="Lift Name"
                  value={lift.name}
                  onChange={(e) =>
                    updateLift(workoutIndex, liftIndex, "name", e.target.value)
                  }
                  className="w-full"
                />
                <Input
                  label="Sets"
                  type="number"
                  value={lift.sets}
                  onChange={(e) =>
                    updateLift(
                      workoutIndex,
                      liftIndex,
                      "sets",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full"
                />
                <Input
                  label="Reps"
                  type="number"
                  value={lift.reps}
                  onChange={(e) =>
                    updateLift(
                      workoutIndex,
                      liftIndex,
                      "reps",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className="w-full"
                />
                <button
                  onClick={() => removeLift(workoutIndex, liftIndex)}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove Lift
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addLift(workoutIndex)}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Lift
          </button>
          <button
            onClick={() => removeWorkout(workoutIndex)}
            className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Remove Workout
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
