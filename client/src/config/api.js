// API Configuration based on environment
const getApiBaseUrl = () => {
  // Check if we're in production mode
  if (import.meta.env.PROD) {
    // In production, use the VITE_API_URL environment variable
    return import.meta.env.VITE_API_URL || "https://api.yourdomain.com/api";
  }

  return import.meta.env.VITE_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// Create axios instance with the configured base URL
import axios from "axios";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
