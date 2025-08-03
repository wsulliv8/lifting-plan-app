import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import { register } from "../../services/auth";
import { validateUserData } from "../../utils/validation";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    experience: "beginner",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register(
        formData.email,
        formData.username,
        formData.password,
        formData.experience
      );
      navigate("/login");
    } catch (err) {
      setServerError(err.response?.data?.error || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2 className="heading mb-6 text-center">Register</h2>

      {/* Server Error Display */}
      {serverError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {serverError}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        error={validationErrors.email}
      />

      <Input
        label="Username"
        type="text"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
        error={validationErrors.username}
      />

      <Input
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
        error={validationErrors.password}
      />

      <Select
        label="Experience Level"
        name="experience"
        value={formData.experience}
        onChange={handleInputChange}
        options={[
          { value: "beginner", label: "Beginner" },
          { value: "intermediate", label: "Intermediate" },
          { value: "advanced", label: "Advanced" },
        ]}
        error={validationErrors.experience}
      />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Creating Account..." : "Register"}
      </Button>

      <p className="mt-4 text-center text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-500 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
};

export default RegisterForm;
