import Modal from "../../common/Modal";
import WorkoutEditor from "../editor/WorkoutEditor";
import Button from "../../common/Button";
import { useState } from "react";

const WorkoutEditorModal = ({
  editingDay,
  onClose,
  workouts,
  baseLifts,
  onSave,
  dayId,
  userLiftsData,
  experience,
}) => {
  const [currentWorkouts, setCurrentWorkouts] = useState(workouts);

  return (
    <Modal
      isOpen={editingDay !== null}
      onClose={onClose}
      title={`Week ${
        editingDay ? Math.floor(editingDay.dayId / 7) + 1 : ""
      } Day ${editingDay ? (editingDay.dayId % 7) + 1 : ""}`}
      titleClassName="text-[var(--text-primary)] font-medium"
      className="w-[95vw] h-[95vh]"
      headerContent={
        <Button
          variant="primary"
          size="sm"
          className="text-sm px-4"
          onClick={() => onSave(currentWorkouts)}
        >
          Save
        </Button>
      }
    >
      {editingDay && (
        <WorkoutEditor
          workouts={workouts}
          baseLifts={baseLifts}
          dayId={dayId}
          userLiftsData={userLiftsData}
          experience={experience}
          onWorkoutsChange={setCurrentWorkouts}
        />
      )}
    </Modal>
  );
};

export default WorkoutEditorModal;
