import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import PlanSettingsForm from "../forms/PlanSettingsForm";
import { useTheme } from "../../../context/ThemeContext";

const PlanSettingsModal = ({ isOpen, onClose, plan, handleSubmit }) => {
  const { screenSize } = useTheme();
  const [formInputs, setFormInputs] = useState({
    name: plan.name || "New Plan",
    goal: plan.goal || "",
    categories: plan.categories || [],
    difficulty: plan.difficulty || "",
    description: plan.description || "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormInputs({
        name: plan.name || "New Plan",
        goal: plan.goal || "",
        categories: plan.categories || [],
        difficulty: plan.difficulty || "",
        description: plan.description || "",
      });
    }
  }, [isOpen, plan]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoriesChange = (selectedCategories) => {
    setFormInputs((prev) => ({ ...prev, categories: selectedCategories }));
  };

  const handleFormSubmit = (e) => {
    handleSubmit(e, formInputs);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Settings"
      className={screenSize.isMobile ? "w-[95%] mx-auto p-4" : "w-3/4 p-6"}
    >
      <PlanSettingsForm
        formData={formInputs}
        handleInputChange={handleInputChange}
        handleSubmit={handleFormSubmit}
        handleCategoriesChange={handleCategoriesChange}
      />
    </Modal>
  );
};

export default PlanSettingsModal;
