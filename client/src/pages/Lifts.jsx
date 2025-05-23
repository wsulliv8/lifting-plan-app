import { useState } from "react";
import { useLoaderData } from "react-router-dom";
import LiftCard from "../components/lifts/LiftCard";
import LiftsData from "../components/lifts/LiftsData";
import LiftSearch from "../components/lifts/LiftSearch";

const Lifts = () => {
  const [selectedLift, setSelectedLift] = useState(null);
  const baseLiftsData = useLoaderData();
  const lifts = baseLiftsData ?? [];

  return (
    <div className="flex h-screen">
      <div className="w-2/3 p-4 pr-8">
        <h2 className="text-3xl font-bold mb-4">Lifts</h2>
        {selectedLift ? (
          <div className="space-y-4">
            <LiftCard lift={selectedLift} />
            <LiftsData lift={selectedLift} />
          </div>
        ) : (
          <p className="text-gray-500">Select a lift to view details</p>
        )}
      </div>
      <div className="w-1/3 h-screen flex justify-start items-center fixed right-0 top-0">
        <LiftSearch
          lifts={lifts}
          onSelectLift={setSelectedLift}
          className={"w-[90%] h-[95%]"}
        />
      </div>
    </div>
  );
};

export default Lifts;
