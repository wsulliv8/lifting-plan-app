import api from "../config/api.js";

const getAllBaseLifts = async () => {
  const response = await api.get("/lifts");
  return response.data; // e.g., [{ id: "1", name: "Bench Press" }, ...]
};
export { getAllBaseLifts };
