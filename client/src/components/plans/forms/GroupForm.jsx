import Button from "../../common/Button";

const GroupForm = ({
  groupName,
  setGroupName,
  groupColor,
  setGroupColor,
  handleGroupConfirm,
  setShowGroupForm,
}) => (
  <div className="absolute bottom-20 mb-2 left-1/2 transform -translate-x-1/2 bg-[var(--surface)] p-4 rounded-lg shadow-md border border-[var(--border)] w-64 z-50">
    <h3 className="text-sm font-semibold mb-2 text-[var(--text-primary)]">
      Create Group
    </h3>
    <div className="mb-2">
      <label className="block text-xs text-[var(--text-secondary)] mb-1">
        Group Name
      </label>
      <input
        type="text"
        className="input-field w-full"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />
    </div>
    <div className="mb-3">
      <label className="block text-xs text-[var(--text-secondary)] mb-1">
        Group Color
      </label>
      <input
        type="color"
        value={groupColor}
        onChange={(e) => setGroupColor(e.target.value)}
        className="w-full rounded h-8"
      />
    </div>
    <div className="flex justify-between text-sm">
      <Button variant="primary" size="sm" onClick={handleGroupConfirm}>
        Confirm
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowGroupForm(false)}
      >
        Cancel
      </Button>
    </div>
  </div>
);

export default GroupForm;
