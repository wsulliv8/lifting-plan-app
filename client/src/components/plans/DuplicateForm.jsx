const DuplicateForm = ({
  selectedDays,
  duplicateFormData,
  handleDuplicateFormChange,
  handleWeekDayToggle,
  handleDuplicateConfirm,
  setShowDuplicateForm,
}) => {
  if (selectedDays.length === 1) {
    return (
      <div className="absolute bottom-20 mb-2 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg border w-64 z-50">
        <h3 className="text-sm font-semibold mb-2">
          Duplicate Day {(selectedDays[0] % 7) + 1}
        </h3>
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">
            Days of the Week
          </label>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
            (day, index) => (
              <label key={index} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={duplicateFormData.selectedWeekDays.includes(index)}
                  onChange={() => handleWeekDayToggle(index)}
                  className="mr-2"
                />
                {day}
              </label>
            )
          )}
        </div>
        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">From Week</label>
          <input
            type="number"
            name="startWeek"
            value={duplicateFormData.startWeek}
            onChange={handleDuplicateFormChange}
            className="w-full border px-2 py-1 rounded text-sm"
            min="1"
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">To Week</label>
          <input
            type="number"
            name="endWeek"
            value={duplicateFormData.endWeek}
            onChange={handleDuplicateFormChange}
            className="w-full border px-2 py-1 rounded text-sm"
            min={duplicateFormData.startWeek}
          />
        </div>
        <div className="mb-3">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              name="autoProgress"
              checked={duplicateFormData.autoProgress}
              onChange={handleDuplicateFormChange}
              className="mr-2"
            />
            Auto-Progress Weights
          </label>
        </div>
        <div className="flex justify-between text-sm">
          <button
            className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
            onClick={handleDuplicateConfirm}
            disabled={duplicateFormData.selectedWeekDays.length === 0}
          >
            Confirm
          </button>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={() => setShowDuplicateForm(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-20 mb-2 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg border w-64 z-50">
      <h3 className="text-sm font-semibold mb-2">Duplicate Selected Days</h3>
      <div className="mb-2">
        <label className="block text-xs text-gray-500 mb-1">Repeat Times</label>
        <input
          type="number"
          name="repeatCount"
          value={duplicateFormData.repeatCount}
          onChange={handleDuplicateFormChange}
          className="w-full border px-2 py-1 rounded text-sm"
          min="1"
        />
      </div>
      <div className="mb-3">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            name="overwriteExisting"
            checked={duplicateFormData.overwriteExisting}
            onChange={handleDuplicateFormChange}
            className="mr-2"
          />
          Overwrite existing workouts
        </label>
      </div>
      <div className="mb-3">
        <label className="flex items-center text-sm">
          <input
            type="checkbox"
            name="autoProgress"
            checked={duplicateFormData.autoProgress}
            onChange={handleDuplicateFormChange}
            className="mr-2"
          />
          Auto-Progress Weights
        </label>
      </div>
      <div className="flex justify-between text-sm">
        <button
          className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
          onClick={handleDuplicateConfirm}
          disabled={duplicateFormData.repeatCount < 1}
        >
          Confirm
        </button>
        <button
          className="text-gray-500 hover:text-gray-700"
          onClick={() => setShowDuplicateForm(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DuplicateForm;
