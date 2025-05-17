import { memo, useCallback, useMemo } from "react";
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
  } = useSortable({
    id,
    data: { type: "Workout", workout },
    // Disable some measurements for faster dragging
    measuring: {
      dragging: {
        containerScale: false,
      },
    },
  });

  const style = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition]
  );

  // Memoize the reps string calculation
  const getRepsString = useCallback((lift) => {
    if (!lift.reps || lift.reps.length === 0) return "";

    if (lift.reps.every((val) => val === lift.reps[0])) {
      return `${lift.reps.length}x${lift.reps[0]}`;
    }

    if (lift.weight && lift.weight.length) {
      return lift.weight.join(", ");
    }

    return lift.reps.join(", ");
  }, []);

  // Memoize lift list rendering
  const liftsContent = useMemo(() => {
    if (!workout.lifts || workout.lifts.length === 0) {
      return <div className="text-gray-500">No lifts</div>;
    }

    return (
      <ul className="list-disc pl-4 mt-1">
        {workout.lifts.map((lift, index) => (
          <li key={`${lift.id || index}-${index}`}>
            <span className="flex flex-wrap">
              <span className="mr-2">{lift.name}</span>
              <span>{getRepsString(lift)}</span>
            </span>
          </li>
        ))}
      </ul>
    );
  }, [workout.lifts, getRepsString]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full p-1 mb-2 bg-gray-100 rounded hover:bg-gray-200 ${
        isDragging
          ? "opacity-30 border border-blue-500 bg-blue-200 text-blue-200 cursor-grab"
          : ""
      }`}
    >
      <div className="w-full text-xs">
        <div className="font-medium text-center">
          {workout.name || "Workout"}
        </div>
        {liftsContent}
      </div>
    </div>
  );
});

// Use displayName for better debugging
Workout.displayName = "Workout";

export default Workout;
