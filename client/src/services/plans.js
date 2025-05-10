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
  const response = await api.get("/plans");
  return response.data;
};

const getPlanById = async (planId) => {
  try {
    const response = await api.get(`/plans/${planId}`, {
      params: {
        include: "weeks.days.workoutDays.workout.lifts",
      },
    });

    const data = response.data;

    return {
      id: data.id,
      name: data.name,
      weeks: data.weeks.map((week) => ({
        week_number: week.week_number,
        days: week.days.map((day) => ({
          day_of_week: day.day_of_week,
          workouts: day.workoutDays
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((wd) => ({
              id: wd.workout.id,
              name: wd.workout.name,
              lifts: wd.workout.lifts.map((lift) => ({
                id: lift.id,
                name: lift.name,
                reps: lift.reps,
                weight: lift.weight,
              })),
            })),
        })),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    throw error;
  }
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

export { getPlans, getPlanById, createPlan, deletePlan, downloadPlan };
