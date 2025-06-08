import Modal from "../common/Modal";
import LiftSearch from "./LiftSearch";
import { useTheme } from "../../context/ThemeContext";

const LiftSearchModal = ({ isOpen, onClose, lifts, onSelectLift }) => {
  const { screenSize } = useTheme();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Lift"
      className={
        screenSize.isMobile ? "w-[95vw] h-[95vh] p-2" : "w-[95vw] h-[95vh] p-6"
      }
    >
      <LiftSearch
        lifts={lifts}
        onSelectLift={(lift) => {
          onSelectLift(lift);
          onClose();
        }}
        className="h-full"
      />
    </Modal>
  );
};

export default LiftSearchModal;
