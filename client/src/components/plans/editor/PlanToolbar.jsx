import { useNavigate } from "react-router-dom";
import Button from "../../common/Button";
import {
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/solid";

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

  return (
    <>
      <div className="flex justify-between mb-4">
        <span
          className="flex items-center gap-2 cursor-pointer text-[var(--text-primary)]"
          onClick={() => navigate("/plans/")}
        >
          <ArrowLeftIcon className="w-6 h-6" />
          <span>(To Plans)</span>
        </span>
        <span className="flex items-center gap-2">
          <h2 className="heading">{plan.name ? plan.name : "New Plan"}</h2>
          <AdjustmentsHorizontalIcon
            className="w-5 cursor-pointer text-[var(--text-primary)] hover:text-[var(--text-secondary)]"
            onClick={() => setIsModalOpen((prev) => !prev)}
          />
        </span>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </div>
      {selectedDays.length > 0 && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-[var(--surface)] shadow-md p-3 rounded flex gap-2 z-50 border border-[var(--border)]">
          <Button
            variant="primary"
            onClick={() => setShowGroupForm((prev) => !prev)}
          >
            Group
          </Button>
          <Button
            variant="secondary"
            onClick={() => handleCopy(selectedDays)}
            disabled={selectedDays.length === 0}
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
          >
            Cancel
          </Button>
        </div>
      )}
    </>
  );
};

export default PlanToolbar;
