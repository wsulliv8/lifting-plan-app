// Validation utility functions with descriptive error messages

export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, error: "Email is required" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  if (email.length > 254) {
    return {
      isValid: false,
      error: "Email address is too long (max 254 characters)",
    };
  }

  return { isValid: true, error: null };
};

export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  const errors = [];

  if (password.length < 8) {
    errors.push("at least 8 characters");
  }

  if (password.length > 128) {
    errors.push("no more than 128 characters");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("one lowercase letter");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("one uppercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("one number");
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push("one special character (@$!%*?&)");
  }

  if (errors.length > 0) {
    return {
      isValid: false,
      error: `Password must contain ${errors.join(", ")}`,
    };
  }

  return { isValid: true, error: null };
};

export const validateUsername = (username) => {
  if (!username) {
    return { isValid: false, error: "Username is required" };
  }

  if (username.length < 3) {
    return {
      isValid: false,
      error: "Username must be at least 3 characters long",
    };
  }

  if (username.length > 30) {
    return {
      isValid: false,
      error: "Username must be no more than 30 characters long",
    };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return {
      isValid: false,
      error:
        "Username can only contain letters, numbers, hyphens, and underscores",
    };
  }

  return { isValid: true, error: null };
};

export const validateExperience = (experience) => {
  const validLevels = ["beginner", "intermediate", "advanced"];

  if (!experience) {
    return { isValid: false, error: "Experience level is required" };
  }

  if (!validLevels.includes(experience)) {
    return {
      isValid: false,
      error: "Experience level must be beginner, intermediate, or advanced",
    };
  }

  return { isValid: true, error: null };
};

// Validate all user fields at once
export const validateUserData = (userData) => {
  const errors = {};

  if (userData.email !== undefined) {
    const emailValidation = validateEmail(userData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }
  }

  if (userData.username !== undefined) {
    const usernameValidation = validateUsername(userData.username);
    if (!usernameValidation.isValid) {
      errors.username = usernameValidation.error;
    }
  }

  if (userData.password !== undefined && userData.password !== "") {
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
    }
  }

  if (userData.experience !== undefined) {
    const experienceValidation = validateExperience(userData.experience);
    if (!experienceValidation.isValid) {
      errors.experience = experienceValidation.error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
