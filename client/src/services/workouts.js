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

const getWorkoutById = async (id) => {
  try {
    const response = await api.get(`/workouts/${id}`);

    const data = response.data;

    return {
      id: data.id,
      user_id: data.user_id,
      plan_id: data.plan_id,
      name: data.name,
      week_number: data.week_number,
      plan_day: data.plan_day,
      day_of_week: data.day_of_week,
      iteration: data.iteration,
      total_volume: data.total_volume,
      user: data.user,
      plan: data.plan,
      lifts: data.lifts.map((lift) => ({
        id: lift.id,
        base_lift_id: lift.base_lift_id,
        name: lift.name,
        sets: lift.sets,
        reps: lift.reps,
        reps_achieved: lift.reps_achieved,
        weight: lift.weight,
        weight_achieved: lift.weight_achieved,
        rpe: lift.rpe,
        rpe_achieved: lift.rpe_achieved,
        progressionRule: lift.progressionRule,
        rest_time: lift.rest_time,
        volume: lift.volume,
        completed: lift.completed,
        notes: lift.notes,
      })),
      workoutDays: data.workoutDays.map((day) => ({
        day_id: day.day_id,
        order: day.order,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch plan:", error);
    throw error;
  }
};

const updateWorkout = async (id) => {};

export { getWorkoutById, updateWorkout };
