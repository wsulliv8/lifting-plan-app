const LiftsData = ({ lift }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg p-4 bg-[var(--surface)] shadow-md border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Progress Over Time
        </h3>
        <div className="w-full h-48 md:h-64 bg-[var(--background)] flex items-center justify-center rounded-lg mt-2">
          <span className="text-[var(--text-secondary)]">
            Graph placeholder for {lift.name}
          </span>
        </div>
      </div>
      <div className="rounded-lg p-4 bg-[var(--surface)] shadow-md border border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Volume Breakdown
        </h3>
        <div className="w-full h-48 md:h-64 bg-[var(--background)] flex items-center justify-center rounded-lg mt-2">
          <span className="text-[var(--text-secondary)]">
            Graph placeholder for {lift.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiftsData;
