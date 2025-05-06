import axios from "axios";
import sanitizeHtml from "sanitize-html";

const api = axios.create({ baseURL: "https://localhost:3001/api" });

export const login = async (email, password) => {
  const cleanEmail = sanitizeHtml(email);
  const response = await api.post("/auth/login", {
    email: cleanEmail,
    password,
  });
  localStorage.setItem("token", response.data.token);
  return response.data;
};

export const register = async (email, username, password) => {
  const cleanEmail = sanitizeHtml(email);
  const cleanUsername = sanitizeHtml(username);
  const response = await api.post("/auth/register", {
    email: cleanEmail,
    username: cleanUsername,
    password,
  });
  return response.data;
};

export const logout = async () => {
  await api.post("/auth/logout");
  localStorage.removeItem("token");
};
