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

const getUserLiftsData = async () => {
  const response = await api.get("/user/lifts");
  console.log(response.data);
  return response.data;
};

const getCurrentUser = async () => {
  const response = await api.get("/user");
  return response.data;
};

export { getUserLiftsData, getCurrentUser };
