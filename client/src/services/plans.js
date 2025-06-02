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

const startPlan = async (planId) => {
  const response = await api.patch(`/plans/${planId}/start`);
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
      goal: data.goal,
      categories: data.categories,
      difficulty: data.difficulty,
      description: data.description,
      duration_weeks: data.duration_weeks,
      started_at: data.started_at,
      completed_at: data.completed_at,
      current_workout_id: data.current_workout_id,
      dayGroups: data.dayGroups,
      weeks: data.weeks.map((week) => ({
        id: week.id,
        week_number: week.week_number,
        days: week.days.map((day) => ({
          id: day.id,
          day_of_week: day.day_of_week,
          workouts: day.workoutDays
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((wd) => ({
              id: wd.workout.id,
              name: wd.workout.name,
              plan_day: wd.workout.plan_day,
              completed_at: wd.workout.completed_at,
              success: wd.workout.success,
              lifts: wd.workout.lifts.map((lift) => ({
                id: lift.id,
                name: lift.name,
                sets: lift.sets,
                reps: lift.reps,
                reps_achieved: lift.reps_achieved,
                rpe: lift.rpe,
                rpe_achieved: lift.rpe_achieved,
                rest: lift.rest_time,
                weight: lift.weight,
                weight_achieved: lift.weight_achieved,
                base_lift_id: lift.base_lift_id,
                progressionRule: lift.progression_rule,
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

const savePlan = async (plan) => {
  try {
    const response = await api.put(`/plans/${plan.id}`, plan);

    console.log("Plan saved successfully", response.data);
    return response.data; // Return the saved plan for state updates
  } catch (error) {
    console.error("Error saving plan:", error);
    throw error; // Rethrow for caller to handle
  }
};

const deletePlan = async (planId) => {
  try {
    // Validate planId
    if (!Number.isInteger(Number(planId)) || Number(planId) <= 0) {
      throw new Error("Invalid plan ID");
    }

    await api.delete(`/plans/${planId}`);
    return { success: true, planId };
  } catch (error) {
    console.error("Failed to delete plan:", error);
    throw (
      error.response?.data?.error || error.message || "Failed to delete plan"
    );
  }
};

const downloadPlan = async (planId) => {
  try {
    if (!Number.isInteger(Number(planId)) || Number(planId) <= 0) {
      throw new Error("Invalid plan ID");
    }

    // Get the full plan with all nested data
    const response = await api.post(`/plans/${planId}/copy`);

    if (!response.data) {
      throw new Error("No data received from server");
    }

    return response.data;
  } catch (error) {
    console.error("Failed to copy plan:", error);
    if (error.response) {
      console.error(
        "Response error:",
        error.response.status,
        error.response.data
      );
    }
    throw error.response?.data?.error || error.message || "Failed to copy plan";
  }
};

export {
  getPlans,
  getPlanById,
  createPlan,
  savePlan,
  deletePlan,
  downloadPlan,
  startPlan,
};
