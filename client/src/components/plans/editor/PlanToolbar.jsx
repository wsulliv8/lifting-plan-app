import { useNavigate } from "react-router-dom";
import Button from "../../common/Button";
import {
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/solid";
import { useTheme } from "../../../context/useTheme";

const PlanToolbar = ({
  plan,
  setIsModalOpen,
  handleSave,
  selectedDays,
  setShowGroupForm,
  handleCopy,
  setShowDuplicateForm,
  setDuplicateFormData,
  setSelectedDays,
  setClipboard,
  setContextMenu,
  weeksLength,
}) => {
  const navigate = useNavigate();
  const { screenSize } = useTheme();

  return (
    <>
      <div
        className={`flex ${
          screenSize.isMobile ? "flex-col gap-4" : "justify-between"
        } mb-4 ${screenSize.isMobile ? "pr-0" : "pr-6"}`}
      >
        {!screenSize.isMobile && (
          <Button
            variant="tertiary"
            className={`flex items-center gap-2 ${
              screenSize.isMobile ? "w-full justify-center" : ""
            }`}
            onClick={() => navigate("/plans")}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Plans
          </Button>
        )}
        <span
          className={`flex items-center ${
            screenSize.isMobile ? "justify-center gap-4 w-full" : "gap-2"
          }`}
        >
          <h2 className="heading">{plan.name ? plan.name : "New Plan"}</h2>
          <AdjustmentsHorizontalIcon
            className="w-5 cursor-pointer text-[var(--text-primary)] hover:text-[var(--text-secondary)]"
            onClick={() => setIsModalOpen((prev) => !prev)}
          />
        </span>
        <Button
          variant="primary"
          onClick={handleSave}
          className={screenSize.isMobile ? "w-full " : ""}
        >
          Save
        </Button>
      </div>
      {selectedDays.length > 0 && (
        <div
          className={`fixed ${
            screenSize.isMobile
              ? "bottom-20 left-4 right-4"
              : "bottom-5 left-1/2 transform -translate-x-1/2"
          } bg-[var(--surface)] shadow-md p-3 rounded z-50 border border-[var(--border)]`}
        >
          <div
            className={`flex ${screenSize.isMobile ? "flex-col" : ""} gap-2`}
          >
            <Button
              variant="primary"
              onClick={() => setShowGroupForm((prev) => !prev)}
              className={screenSize.isMobile ? "w-full" : ""}
            >
              Group
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleCopy(selectedDays)}
              disabled={selectedDays.length === 0}
              className={screenSize.isMobile ? "w-full" : ""}
            >
              Copy
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDuplicateForm(true);
                setDuplicateFormData({
                  selectedWeekDays: [],
                  startWeek: 1,
                  endWeek: weeksLength,
                  repeatCount: 1,
                  overwriteExisting: false,
                  autoProgress: true,
                });
              }}
              className={screenSize.isMobile ? "w-full" : ""}
            >
              Duplicate
            </Button>
            <Button
              variant="tertiary"
              onClick={() => {
                setSelectedDays([]);
                setShowDuplicateForm(false);
                setClipboard([]);
                setContextMenu(null);
              }}
              className={screenSize.isMobile ? "w-full" : ""}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </>
  );
};

export default PlanToolbar;
