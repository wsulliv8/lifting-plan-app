import Modal from "../common/Modal";
import LiftSearch from "./LiftSearch";
import { useTheme } from "../../context/ThemeContext";
import { useState, useEffect } from "react";
import Button from "../common/Button";

const LiftSearchModal = ({
  isOpen,
  onClose,
  lifts,
  onSelectLift,
  multiSelect = true,
}) => {
  const { screenSize } = useTheme();
  const [selectedLifts, setSelectedLifts] = useState([]);

  // Reset selected lifts when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedLifts([]);
    }
  }, [isOpen]);

  const handleLiftSelect = (lift) => {
    if (multiSelect) {
      setSelectedLifts((prev) => {
        const isSelected = prev.some((l) => l.id === lift.id);
        if (isSelected) {
          return prev.filter((l) => l.id !== lift.id);
        } else {
          return [...prev, lift];
        }
      });
    } else {
      // For single select, immediately call onSelectLift and close
      onSelectLift([lift]);
      onClose();
    }
  };

  const handleAddLifts = () => {
    onSelectLift(selectedLifts);
    setSelectedLifts([]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSelectedLifts([]);
        onClose();
      }}
      title="Add Lift"
      className={
        screenSize.isMobile ? "w-[95vw] h-[95vh] p-2" : "w-[95vw] h-[95vh] p-6"
      }
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <LiftSearch
            lifts={lifts}
            onSelectLift={handleLiftSelect}
            selectedLifts={selectedLifts}
            className="h-full"
          />
        </div>
        {multiSelect && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="primary"
              onClick={handleAddLifts}
              disabled={selectedLifts.length === 0}
              className="w-full sm:w-auto"
            >
              Add {selectedLifts.length}{" "}
              {selectedLifts.length === 1 ? "Lift" : "Lifts"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default LiftSearchModal;
