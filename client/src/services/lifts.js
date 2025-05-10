import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:3001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const getAllBaseLifts = async () => {
  const response = await api.get("/lifts");
  return response.data; // e.g., [{ id: "1", name: "Bench Press" }, ...]
};
export { getAllBaseLifts };
