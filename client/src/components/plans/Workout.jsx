import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const Workout = ({ id, workout }) => {
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
    //zIndex: isDragging ? 50 : "auto",
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full p-1 mb-2 bg-gray-100 rounded opacity-30 border border-dashed border-rose-500"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-full p-1 mb-2 bg-gray-100 rounded hover:bg-gray-200"
    >
      <div className="w-full text-sm">
        <div className="font-medium text-center">
          {workout.name || "Workout"}
        </div>
        {workout.lifts && workout.lifts.length > 0 ? (
          <ul className="list-disc pl-4 mt-1">
            {workout.lifts.map((lift, index) => (
              <li key={`${lift.id}-${index}`}>
                <span className="flex flex-col">
                  <span>{lift.name}</span>
                  <span>
                    {lift.reps.every((val) => val === lift.reps[0])
                      ? `${lift.reps.length}x${lift.reps[0]}`
                      : `${lift.weight.map((weight) => weight).join(", ")}`}
                  </span>
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
};

export default Workout;
