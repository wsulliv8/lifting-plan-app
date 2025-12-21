import { useState, useCallback, memo } from "react";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import PlanList from "../../components/plans/PlanList";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { createPlan, deletePlan } from "../../services/plans";
import { useTheme } from "../../context/useTheme";
import { useUser } from "../../context/useUser";

const Plans = () => {
  const [view, setView] = useState("your");
  const plansData = useLoaderData();
  const [plans, setPlans] = useState({
    userPlans: plansData.userPlans,
    genericPlans: plansData.genericPlans,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const displayedPlans = view === "your" ? plans.userPlans : plans.genericPlans;
  const navigate = useNavigate();
  const navigation = useNavigation();
  const { screenSize } = useTheme();
  const { user } = useUser();
  const isAdmin = user?.role === "admin";

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

  const handleDelete = useCallback(async (planId) => {
    if (!window.confirm("Are you sure you want to delete this plan?")) return;
    try {
      await deletePlan(planId);
      setPlans((prev) => ({
        userPlans: prev.userPlans.filter((plan) => plan.id !== planId),
        genericPlans: prev.genericPlans.filter((plan) => plan.id !== planId),
      }));
    } catch (error) {
      console.error(error || "Failed to delete plan");
    }
  }, []);

  return (
    <div className="p-4">
      <div
        className={`flex ${
          screenSize.isMobile
            ? "flex-col gap-4"
            : "justify-between items-center"
        } mb-4`}
      >
        {!screenSize.isMobile && <div className="w-[200px]"></div>}
        {/* Toggle Button */}
        <div
          className={`flex justify-center ${
            screenSize.isMobile ? "order-1" : ""
          }`}
        >
          <div
            className={`toggle-container ${
              screenSize.isMobile ? "w-full max-w-md" : ""
            }`}
          >
            {/* Toggle Background Slider */}
            <div
              className={`toggle-slider ${
                view === "your" ? "translate-x-0" : "translate-x-full"
              }`}
            ></div>
            {/* Your Plans Option */}
            <button
              onClick={handleViewYour}
              className={`toggle-button ${
                view === "your" ? "active" : "inactive"
              }`}
              aria-pressed={view === "your"}
              aria-label="View Your Plans"
            >
              Your Plans
            </button>
            {/* Pre-Made Plans Option */}
            <button
              onClick={handleViewPreMade}
              className={`toggle-button ${
                view === "pre-made" ? "active" : "inactive"
              }`}
              aria-pressed={view === "pre-made"}
              aria-label="View Pre-Made Plans"
            >
              Pre-Made
            </button>
          </div>
        </div>
        <div className={`${screenSize.isMobile ? "order-2 w-full" : ""}`}>
          <Button
            onClick={handleOpenModal}
            variant="primary"
            className={`${screenSize.isMobile ? "w-full" : ""}`}
          >
            Create Plan
          </Button>
        </div>
      </div>
      <PlanList
        plans={displayedPlans}
        isLoading={navigation.state === "loading"}
        planType={view}
        onDelete={handleDelete}
        isAdmin={isAdmin}
      />
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="Create New Plan"
          className={`${screenSize.isMobile ? "w-[95%]" : "w-1/2"} p-4`}
        >
          <FormContent
            formData={formInputs}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            handleCloseModal={handleCloseModal}
            isMobile={screenSize.isMobile}
          />
        </Modal>
      )}
    </div>
  );
};

const FormContent = memo(
  ({
    formData,
    handleInputChange,
    handleSubmit,
    handleCloseModal,
    isMobile,
  }) => {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Plan Name"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          required
        />
        <Input
          label="Duration (Weeks)"
          type="number"
          name="duration_weeks"
          value={formData.duration_weeks}
          onChange={handleInputChange}
          min="1"
          required
        />

        <div className={`flex ${isMobile ? "flex-col" : "justify-end"} gap-2`}>
          <Button
            variant="primary"
            type="submit"
            className={isMobile ? "w-full" : ""}
          >
            Create
          </Button>
          <Button
            variant="danger"
            onClick={handleCloseModal}
            className={isMobile ? "w-full" : ""}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }
);

FormContent.displayName = "FormContent";

export default Plans;
