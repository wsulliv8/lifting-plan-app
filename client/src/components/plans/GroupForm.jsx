const GroupForm = ({
  groupName,
  setGroupName,
  groupColor,
  setGroupColor,
  handleGroupConfirm,
  setShowGroupForm,
}) => (
  <div className="absolute bottom-20 mb-2 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow-lg border w-64 z-50">
    <h3 className="text-sm font-semibold mb-2">Create Group</h3>
    <div className="mb-2">
      <label className="block text-xs text-gray-500 mb-1">Group Name</label>
      <input
        type="text"
        className="w-full border px-2 py-1 rounded text-sm"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
    </div>
    <div className="mb-3">
      <label className="block text-xs text-gray-500 mb-1">Group Color</label>
      <input
        type="color"
        value={groupColor}
        onChange={(e) => setGroupColor(e.target.value)}
        className="w-full"
      />
    </div>
    <div className="flex justify-between text-sm">
      <button
        className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600"
        onClick={handleGroupConfirm}
      >
        Confirm
      </button>
      <button
        className="text-gray-500 hover:text-gray-700"
        onClick={() => setShowGroupForm(false)}
      >
        Cancel
      </button>
    </div>
  </div>
);

export default GroupForm;
