import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import PlanSettingsForm from "../forms/PlanSettingsForm";

const PlanSettingsModal = ({ isOpen, onClose, plan, handleSubmit }) => {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Settings"
      className="w-3/4"
    >
      <PlanSettingsForm
        formData={formInputs}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        handleCategoriesChange={handleCategoriesChange}
      />
    </Modal>
  );
};

export default PlanSettingsModal;
