import api from "../config/api.js";
import sanitizeHtml from "sanitize-html";

export const login = async (email, password) => {
  const cleanEmail = sanitizeHtml(email);
  try {
    const response = await api.post("/auth/login", {
      email: cleanEmail,
      password,
    });
    localStorage.setItem("token", response.data.token);
    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const register = async (email, username, password, experience) => {
  const cleanEmail = sanitizeHtml(email);
  const cleanUsername = sanitizeHtml(username);
  const response = await api.post("/auth/register", {
    email: cleanEmail,
    username: cleanUsername,
    password,
    experience,
  });
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
};
