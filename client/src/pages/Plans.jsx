import { useState } from "react";
import { useLoaderData, useNavigation } from "react-router-dom";
import { Link } from "react-router-dom";
import PlanList from "../components/plans/PlanList";
import Modal from "../components/common/Modal";
import Select from "../components/common/Select";
import Input from "../components/common/Input";
import { createPlan } from "../services/plans";

const Plans = () => {
  const [view, setView] = useState("your");
  const plans = useLoaderData();
  const navigation = useNavigation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayedPlans = view === "your" ? plans.userPlans : plans.genericPlans;

  // Form state for plan creation
  const [formData, setFormData] = useState({
    name: "",
    goal: "",
    duration_weeks: "",
    difficulty: "Beginner",
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createPlan({
        ...formData,
        duration_weeks: parseInt(formData.duration_weeks, 10),
      });
      setIsModalOpen(false);
      setFormData({
        name: "",
        goal: "",
        duration_weeks: "",
        difficulty: "Beginner",
      });
      window.location.reload(); // Temporary; replace with state update
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold w-[200px]">
          {view === "your" ? "Your Plans" : "Pre-Made Plans"}
        </h2>
        {/* Toggle Button */}
        <div className="flex justify-center">
          <div className="relative inline-flex bg-gray-200 rounded-full p-1 w-64">
            {/* Toggle Background Slider */}
            <div
              className={`absolute top-1 bottom-1 w-1/2 bg-primary rounded-full transition-transform duration-300 ease-in-out ${
                view === "your" ? "translate-x-0" : "translate-x-full"
              }`}
            ></div>
            {/* Your Plans Option */}
            <button
              onClick={() => setView("your")}
              className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-300 ${
                view === "your" ? "text-white" : "text-gray-700"
              }`}
              aria-pressed={view === "your"}
              aria-label="View Your Plans"
            >
              Your Plans
            </button>
            {/* Pre-Made Plans Option */}
            <button
              onClick={() => setView("pre-made")}
              className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-300 ${
                view === "pre-made" ? "text-white" : "text-gray-700"
              }`}
              aria-pressed={view === "pre-made"}
              aria-label="View Pre-Made Plans"
            >
              Pre-Made
            </button>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          Create Plan
        </button>
      </div>
      <PlanList
        plans={displayedPlans}
        isLoading={navigation.state === "loading"}
        planType={view}
      />
      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Plan"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Plan Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
          />
          <Input
            label="Goal"
            name="goal"
            value={formData.goal}
            onChange={handleInputChange}
            placeholder="e.g., Strength, Hypertrophy"
          />
          <Input
            label="Duration (Weeks)"
            type="number"
            name="duration_weeks"
            value={formData.duration_weeks}
            onChange={handleInputChange}
            min="1"
          />
          <Select
            label="Difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleInputChange}
            options={[
              { value: "Beginner", label: "Beginner" },
              { value: "Intermediate", label: "Intermediate" },
              { value: "Advanced", label: "Advanced" },
            ]}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Plans;
