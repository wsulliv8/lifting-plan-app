import api from "../config/api.js";

const getUserLiftsData = async () => {
  const response = await api.get("/user/lifts");
  console.log(response.data);
  return response.data;
};

const getCurrentUser = async () => {
  const response = await api.get("/user");
  return response.data;
};

const updateUser = async (updates) => {
  const response = await api.put("/user", updates);
  console.log("updateUser", response.data);
  return response.data;
};

export { getUserLiftsData, getCurrentUser, updateUser };
