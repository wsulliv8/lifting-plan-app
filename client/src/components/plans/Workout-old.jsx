import { memo, useCallback } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Workout = memo(({ id, workout }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "Workout", workout } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getRepsString = useCallback((lift) => {
    if (lift.reps.every((val) => val === lift.reps[0])) {
      return `${lift.reps.length}x${lift.reps[0]}`;
    }
    return `${lift.weight.map((weight) => weight).join(", ")}`;
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full p-1 mb-2 bg-gray-100 rounded hover:bg-gray-200 ${
        isDragging
          ? "opacity-30 border border-blue-500 bg-blue-200 text-blue-200  cursor-grab"
          : ""
      }`}
    >
      <div className="w-full text-xs">
        <div className="font-medium text-center">
          {workout.name || "Workout"}
        </div>
        {workout.lifts && workout.lifts.length > 0 ? (
          <ul className="list-disc pl-4 mt-1">
            {workout.lifts.map((lift, index) => (
              <li key={`${lift.id}-${index}`}>
                <span className="flex flex-wrap">
                  <span className="mr-2">{lift.name}</span>
                  <span>{getRepsString(lift)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500">No lifts</div>
        )}
      </div>
    </div>
  );
});

export default Workout;
