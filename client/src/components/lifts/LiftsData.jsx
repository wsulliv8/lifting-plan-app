const LiftsData = ({ lift }) => {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-4 bg-white shadow">
        <h3 className="text-lg font-semibold">Graph 1: Progress Over Time</h3>
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded">
          <span className="text-gray-500">
            Graph placeholder for {lift.name}
          </span>
        </div>
      </div>
      <div className="border rounded-lg p-4 bg-white shadow">
        <h3 className="text-lg font-semibold">Graph 2: Volume Breakdown</h3>
        <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded">
          <span className="text-gray-500">
            Graph placeholder for {lift.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LiftsData;
