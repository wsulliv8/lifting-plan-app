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

const getPlans = async () => {
  console.log(api.headers);
  const response = await api.get("/plans");
  return response.data;
};

const createPlan = async (planData) => {
  const response = await api.post("/plans", planData);
  return response.data;
};

const deletePlan = async (id) => {
  return;
};

const downloadPlan = async (plan) => {
  return;
};

export { getPlans, createPlan, deletePlan, downloadPlan };
