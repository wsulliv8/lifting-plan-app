import Modal from "../common/Modal";
import WorkoutEditor from "./WorkoutEditor";

const WorkoutEditorModal = ({
  editingDay,
  onClose,
  workouts,
  baseLifts,
  onSave,
  dayId,
  userLiftsData,
  experience,
}) => (
  <Modal
    isOpen={editingDay !== null}
    onClose={onClose}
    title={`Week ${
      editingDay ? Math.floor(editingDay.dayId / 7) + 1 : ""
    } Day ${editingDay ? (editingDay.dayId % 7) + 1 : ""}`}
    className="w-[95vw] h-[95vh]"
  >
    {editingDay && (
      <WorkoutEditor
        workouts={workouts}
        baseLifts={baseLifts}
        onSave={onSave}
        dayId={dayId}
        userLiftsData={userLiftsData}
        experience={experience}
      />
    )}
  </Modal>
);

export default WorkoutEditorModal;
