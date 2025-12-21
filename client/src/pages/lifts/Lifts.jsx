import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import LiftCard from "../../components/lifts/LiftCard";
import LiftsData from "../../components/lifts/LiftsData";
import LiftSearch from "../../components/lifts/LiftSearch";
import LiftSearchModal from "../../components/lifts/LiftSearchModal";
import Button from "../../components/common/Button";
import { useTheme } from "../../context/useTheme";

const Lifts = () => {
  const [selectedLift, setSelectedLift] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const baseLiftsData = useLoaderData();
  const lifts = baseLiftsData ?? [];
  const { screenSize } = useTheme();
  console.log(lifts);

  const handleLiftSelect = (selectedLifts) => {
    if (selectedLifts.length > 0) {
      setSelectedLift(selectedLifts[0]); // Take only the first lift
      if (screenSize.isMobile) {
        setIsModalOpen(false);
      }
    }
  };

  return (
    <div className="flex">
      {/* Main Content */}
      <div className="w-full md:w-2/3 md:pr-8 overflow-y-auto md:pb-4">
        <div className="flex flex-col space-y-2 mb-4">
          <h2 className="text-3xl font-bold text-[var(--text-primary)]">
            Lifts
          </h2>
          {screenSize.isMobile && (
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="w-full"
            >
              Select Lift
            </Button>
          )}
        </div>

        {selectedLift ? (
          <div className="space-y-4">
            <LiftCard lift={selectedLift} />
            <LiftsData lift={selectedLift} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-170px)]">
            <p className="text-xl text-[var(--primary-light)]">
              Select a lift to view details
            </p>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      {!screenSize.isMobile && (
        <div className="hidden md:flex w-1/3 h-screen justify-start items-center fixed right-0 top-0">
          <LiftSearch
            lifts={lifts}
            onSelectLift={setSelectedLift}
            className="w-[90%] h-[95%] shadow-md border border-[var(--border)] rounded-lg"
          />
        </div>
      )}

      {/* Mobile Modal */}
      {screenSize.isMobile && (
        <LiftSearchModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          lifts={lifts}
          onSelectLift={handleLiftSelect}
          multiSelect={false}
        />
      )}
    </div>
  );
};

export default Lifts;
