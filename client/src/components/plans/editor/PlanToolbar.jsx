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
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/plans/")}
        >
          <ArrowLeftIcon className="w-6 h-6" />
          <span>(To Plans)</span>
        </span>
        <span className="flex items-center gap-2">
          <h2 className="heading">{plan.name ? plan.name : "New Plan"}</h2>
          <AdjustmentsHorizontalIcon
            className="w-5 cursor-pointer"
            onClick={() => setIsModalOpen((prev) => !prev)}
          />
        </span>
        <Button onClick={handleSave} className="bg-green-600">
          Save
        </Button>
      </div>
      {selectedDays.length > 0 && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-white shadow-md p-3 rounded flex gap-2 z-50">
          <Button
            className="btn btn-primary"
            onClick={() => setShowGroupForm((prev) => !prev)}
          >
            Group
          </Button>
          <Button
            className="btn btn-primary"
            onClick={() => handleCopy(selectedDays)}
            disabled={selectedDays.length === 0}
          >
            Copy
          </Button>
          <Button
            className="btn btn-primary"
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
            className="btn btn-secondary"
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
