import api from "../config/api.js";

const getUserLiftsData = async () => {
  const response = await api.get("/user/lifts");
  return response.data;
};

const getCurrentUser = async () => {
  const response = await api.get("/user");
  return response.data;
};

const updateUser = async (updates) => {
  const response = await api.put("/user", updates);
  return response.data;
};

export { getUserLiftsData, getCurrentUser, updateUser };
