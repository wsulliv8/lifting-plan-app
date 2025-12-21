import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";
import { useTheme } from "../../context/useTheme";
import { useUser } from "../../context/useUser";
import { validateUserData } from "../../utils/validation";

const SettingsModal = ({ isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { screenSize } = useTheme();
  const { user, updateUserData, loading } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    experience: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // Update form data when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        username: user.username || "",
        password: "",
        experience: user.experience || "beginner",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear server error when user makes changes
    if (serverError) {
      setServerError("");
    }
  };

  const validateForm = () => {
    const validation = validateUserData(formData);
    setValidationErrors(validation.errors);
    return validation.isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const updates = {
      email: formData.email,
      username: formData.username,
      experience: formData.experience,
      ...(formData.password ? { password: formData.password } : {}),
    };

    const result = await updateUserData(updates);
    if (result.success) {
      setIsEditing(false);
      setValidationErrors({});
      setServerError("");
    } else {
      setServerError(result.error || "Failed to update user");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setValidationErrors({});
    setServerError("");
    // Reset form data to current user data
    if (user) {
      setFormData({
        email: user.email || "",
        username: user.username || "",
        password: "",
        experience: user.experience || "beginner",
      });
    }
  };

  const experienceOptions = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
  ];

  if (!user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      className={screenSize.isMobile ? "w-[95%] mx-auto p-4" : "w-1/2 p-6"}
    >
      <div className="space-y-4">
        {/* Server Error Display */}
        {serverError && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {serverError}
          </div>
        )}

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          disabled={!isEditing}
          error={validationErrors.email}
        />

        <Input
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          disabled={!isEditing}
          error={validationErrors.username}
        />

        {isEditing && (
          <Input
            label="Password (leave blank to keep current)"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Enter new password"
            error={validationErrors.password}
          />
        )}

        <Select
          label="Experience Level"
          name="experience"
          value={formData.experience}
          onChange={handleInputChange}
          options={experienceOptions}
          disabled={!isEditing}
          error={validationErrors.experience}
        />

        <div
          className={`flex ${screenSize.isMobile ? "flex-col" : "justify-end"} gap-2 mt-6`}
        >
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              variant="primary"
              className={screenSize.isMobile ? "w-full" : ""}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                onClick={handleSave}
                variant="primary"
                disabled={loading}
                className={screenSize.isMobile ? "w-full" : ""}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="secondary"
                disabled={loading}
                className={screenSize.isMobile ? "w-full" : ""}
              >
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SettingsModal;
