import { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Workout = memo(({ id, workout, handleClick }) => {
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

  const liftsContent = useMemo(() => {
    if (!workout.lifts || workout.lifts.length === 0) {
      return <div className="text-gray-500">No lifts</div>;
    }
    const getRepsString = (lift) => {
      if (!lift.reps || lift.reps.length === 0) return "";

      const sets = lift.reps.length;
      const sameReps = lift.reps.every((val) => val === lift.reps[0]);
      const reps = sameReps ? lift.reps[0] : lift.reps.join(", ");

      if (!lift.weight || lift.weight.length === 0) {
        return `${sets}x${reps}`;
      }

      const sameWeight = lift.weight.every((val) => val === lift.weight[0]);

      if (sameReps && sameWeight) {
        return `${sets}x${reps} @${lift.weight[0]}`;
      }

      return `${sets}x${reps} @${lift.weight.join(", ")}`;
    };

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
  }, [workout.lifts]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`w-full p-1 mb-2 bg-gray-100 rounded hover:bg-gray-200 first:mt-4 ${
        isDragging ? "opacity-50 border border-blue-500" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        handleClick(workout.dayId);
      }}
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

Workout.displayName = "Workout";

export default Workout;
