import { useState, useCallback, memo } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import PlanList from "../components/plans/PlanList";
import Modal from "../components/common/Modal";
import Input from "../components/common/Input";
import { createPlan } from "../services/plans";

const Plans = () => {
  const [view, setView] = useState("your");
  const plans = useLoaderData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayedPlans = view === "your" ? plans.userPlans : plans.genericPlans;
  const navigate = useNavigate();

  // State only for controlled inputs
  const [formInputs, setFormInputs] = useState({
    name: "",
    duration_weeks: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    // Reset form data
    const resetData = {
      name: "",
      duration_weeks: "",
    };
    setFormInputs(resetData);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newPlan = await createPlan({
        ...formInputs,
        duration_weeks: parseInt(formInputs.duration_weeks, 10),
      });

      // Close modal and reset form
      setIsModalOpen(false);
      const resetData = {
        name: "",
        duration_weeks: "",
      };
      setFormInputs(resetData);

      navigate(`/plans/${newPlan.id}/edit`);
    } catch (error) {
      console.error("Failed to create plan:", error);
    }
  };

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleViewYour = () => {
    setView("your");
  };

  const handleViewPreMade = () => {
    setView("pre-made");
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
              onClick={handleViewYour}
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
              onClick={handleViewPreMade}
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
        <button onClick={handleOpenModal} className="btn-primary">
          Create Plan
        </button>
      </div>
      <PlanList
        plans={displayedPlans}
        isLoading={navigation.state === "loading"}
        planType={view}
      />

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Create New Plan"
          className="w-1/2"
        >
          <FormContent
            formData={formInputs}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            handleCloseModal={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
};

const FormContent = memo(
  ({ formData, handleInputChange, handleSubmit, handleCloseModal }) => {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Plan Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
        />
        {/*         <Input
          label="Goal"
          name="goal"
          value={formData.goal}
          onChange={handleInputChange}
          placeholder="e.g., Strength, Hypertrophy"
        />
        <Input
          label="Categories"
          name="categories"
          value={formData.categories}
          onChange={handleInputChange}
          placeholder="e.g., Barbell, Compound, etc."
        /> */}
        <Input
          label="Duration (Weeks)"
          type="number"
          name="duration_weeks"
          value={formData.duration_weeks}
          onChange={handleInputChange}
          min="1"
        />
        {/*         <Select
          label="Difficulty"
          name="difficulty"
          value={formData.difficulty}
          onChange={handleInputChange}
          options={[
            { value: "Beginner", label: "Beginner" },
            { value: "Intermediate", label: "Intermediate" },
            { value: "Advanced", label: "Advanced" },
          ]}
        /> */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleCloseModal}
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
    );
  }
);

export default Plans;
