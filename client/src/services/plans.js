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

const savePlan = async (plan) => {
  try {
    // Helper function to safely convert IDs
    const safeInt = (id) => {
      if (!id) return undefined;
      const num = Number(id);
      // Check if within PostgreSQL INT4 range (-2147483648 to 2147483647)
      if (isNaN(num) || num > 2147483647 || num < -2147483648) {
        console.warn(
          `ID ${id} out of PostgreSQL INT4 range, removing ID to create new record`
        );
        return undefined; // Return undefined to force a new record creation
      }
      return num;
    };

    // Sanitize plan data to ensure consistent types and safe IDs
    const sanitizedPlan = {
      ...plan,
      id: safeInt(plan.id),
      weeks: plan.weeks.map((week, weekIndex) => ({
        id: safeInt(week.id),
        week_number: weekIndex + 1, // Ensure week numbers are sequential
        days: week.days.map((day) => ({
          id: safeInt(day.id),
          day_of_week: day.day_of_week ? Number(day.day_of_week) : 0,
          workouts: (day.workouts || []).map((workout, workoutIndex) => {
            // Create a proper workout object with correct types
            return {
              id: safeInt(workout.id),
              workoutDayId: safeInt(workout.workoutDayId),
              name: workout.name || `Workout ${workoutIndex + 1}`,
              // Include lifts if present
              ...(workout.lifts && {
                lifts: workout.lifts.map((lift) => ({
                  id: safeInt(lift.id),
                  name: lift.name,
                  base_lift_id: safeInt(lift.base_lift_id),
                  sets: Number(lift.sets || 0),
                  reps: lift.reps.map((num) => num.toString()) || [],
                  weight: lift.weight || [],
                  rpe: lift.rpe || [],
                })),
              }),
            };
          }),
        })),
      })),
    };

    let response;
    if (sanitizedPlan.id) {
      // Update existing plan
      response = await api.put(`/plans/${sanitizedPlan.id}`, sanitizedPlan);
    } else {
      // Create new plan
      response = await api.post("/plans", sanitizedPlan);
    }

    console.log("Plan saved successfully", response.data);
    return response.data; // Return the saved plan for state updates
  } catch (error) {
    console.error("Error saving plan:", error);
    throw error; // Rethrow for caller to handle
  }
};
/* const savePlan = async (plan) => {
  try {
    // Sanitize plan data
    const sanitizedPlan = {
      ...plan,
      id: plan.id ? Number(plan.id) : undefined,
      weeks: plan.weeks.map((week) => ({
        ...week,
        id: week.id ? Number(week.id) : undefined,
        days: week.days.map((day) => ({
          ...day,
          id: day.id ? Number(day.id) : undefined,
          week_id: undefined, // Remove week_id to avoid foreign key issues
          workouts: (day.workouts || []).map((workout) => ({
            ...workout,
            id: workout.id ? Number(workout.id) : undefined,
          })),
        })),
      })),
    };

    let response;
    if (sanitizedPlan.id) {
      // Update existing plan
      response = await api.put(`/plans/${sanitizedPlan.id}`, sanitizedPlan);
    } else {
      // Create new plan
      response = await api.post("/plans", sanitizedPlan);
    }

    console.log("Plan saved successfully", response.data);
    return response.data; // Return the saved plan for state updates
  } catch (error) {
    console.error("Error saving plan:", error);
    throw error; // Rethrow for caller to handle
  }
}; */

const deletePlan = async (id) => {
  return;
};

const downloadPlan = async (plan) => {
  return;
};

export {
  getPlans,
  getPlanById,
  createPlan,
  savePlan,
  deletePlan,
  downloadPlan,
};
