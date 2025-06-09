import { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { useTheme } from "../../../context/ThemeContext";

const Workout = memo(({ id, workout, handleClick, isReadOnly = false }) => {
  const { screenSize } = useTheme();
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
    disabled: isReadOnly,
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
      WebkitUserSelect: "none",
      userSelect: "none",
    }),
    [transform, transition]
  );

  const liftsContent = useMemo(() => {
    if (!workout.lifts || workout.lifts.length === 0) {
      return <div className="text-[var(--text-secondary)]">No lifts</div>;
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
              <span className="mr-2 text-[var(--text-primary)]">
                {lift.name}
              </span>
              <span className="text-[var(--text-secondary)]">
                {getRepsString(lift)}
              </span>
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
      {...(!screenSize.isMobile ? { ...attributes, ...listeners } : {})}
      className={`w-full p-1 mb-2 bg-[var(--background-alt)] border border-[var(--border)] rounded md:hover:border-[var(--primary-light)] first:mt-4 select-none ${
        isDragging ? "opacity-50 border border-[var(--primary-light)]" : ""
      } ${!screenSize.isMobile ? "cursor-grab" : ""}`}
      onClick={
        isReadOnly
          ? undefined
          : (e) => {
              e.stopPropagation();
              handleClick(workout.dayId);
            }
      }
    >
      <div className="w-full text-xs">
        <div className="font-medium text-center text-[var(--text-primary)] flex items-center justify-between">
          {screenSize.isMobile && !isReadOnly ? (
            <div
              {...attributes}
              {...listeners}
              className="p-1 cursor-grab touch-none"
              style={{ touchAction: "none" }}
            >
              <Bars3Icon className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
          ) : (
            <div className="w-4" />
          )}
          <div className="flex-1">{workout.name || "Workout"}</div>
          {screenSize.isMobile && !isReadOnly ? (
            <div
              {...attributes}
              {...listeners}
              className="p-1 cursor-grab touch-none"
              style={{ touchAction: "none" }}
            >
              <Bars3Icon className="h-4 w-4 text-[var(--text-secondary)]" />
            </div>
          ) : (
            <div className="w-4" />
          )}
        </div>
        {liftsContent}
      </div>
    </div>
  );
});

Workout.displayName = "Workout";

export default Workout;
