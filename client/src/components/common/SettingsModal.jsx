import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import Input from "./Input";
import Select from "./Select";
import Button from "./Button";
import { useTheme } from "../../context/ThemeContext";
import { useUser } from "../../context/UserContext";

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
  };

  const handleSave = async () => {
    const updates = {
      email: formData.email,
      username: formData.username,
      experience: formData.experience,
      ...(formData.password ? { password: formData.password } : {}),
    };

    const result = await updateUserData(updates);
    if (result.success) {
      setIsEditing(false);
    } else {
      // TODO: Show error message to user
      console.error("Failed to update user:", result.error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
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

  if (loading) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Settings"
        className={`${screenSize.isMobile ? "w-[95%]" : "w-1/2"} p-4`}
      >
        <div className="flex justify-center items-center h-32">Loading...</div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      className={`${screenSize.isMobile ? "w-[95%]" : "w-1/2"} p-4`}
    >
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          disabled={!isEditing}
          required
        />
        <Input
          label="Username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleInputChange}
          disabled={!isEditing}
          required
        />
        {isEditing && (
          <Input
            label="New Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Leave blank to keep current password"
          />
        )}
        <Select
          label="Experience Level"
          name="experience"
          value={formData.experience}
          onChange={handleInputChange}
          options={experienceOptions}
          disabled={!isEditing}
          required
        />

        <div
          className={`flex ${screenSize.isMobile ? "flex-col" : "justify-end"} gap-2`}
        >
          {isEditing ? (
            <>
              <Button
                variant="primary"
                onClick={handleSave}
                className={screenSize.isMobile ? "w-full" : ""}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="danger"
                onClick={handleCancel}
                className={screenSize.isMobile ? "w-full" : ""}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              onClick={() => setIsEditing(true)}
              className={screenSize.isMobile ? "w-full" : ""}
            >
              Edit
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default SettingsModal;
