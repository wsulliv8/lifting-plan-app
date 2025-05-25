import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import Welcome from "./pages/Welcome";
import Plans from "./pages/plans/Plans";
import PlanEditor from "./pages/plans/PlanEditor";
import ActiveWorkout from "./pages/plans/ActiveWorkout";
import Workouts from "./pages/workouts/Workouts";
import Lifts from "./pages/lifts/Lifts";
import Layout from "./components/common/Layout";
import ErrorPage from "./components/common/ErrorPage";
import { getPlans, getPlanById } from "./services/plans";
import { getAllBaseLifts } from "./services/lifts";
import { getUserLiftsData, getCurrentUser } from "./services/user";
import { getWorkoutById } from "./services/workouts";

const checkAuthLoader = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    return redirect("/login");
  }
  return null;
};

const plansLoader = async () => {
  try {
    const plans = await getPlans();
    return plans;
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      return redirect("/login");
    }
    throw new Response("Failed to load plans", {
      status: err.response?.status || 500,
    });
  }
};

const editPlanLoader = async ({ params }) => {
  try {
    const [plan, baseLifts, userLiftsData, currentUser] = await Promise.all([
      getPlanById(params.planId),
      getAllBaseLifts(),
      getUserLiftsData(),
      getCurrentUser(),
    ]);
    return { plan, baseLifts, userLiftsData, currentUser };
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      return redirect("/login");
    }
    throw new Response("Failed to load plan", {
      status: err.response?.status || 500,
    });
  }
};

const activeWorkoutLoader = async ({ params }) => {
  try {
    const workout = await getWorkoutById(params.id);
    return workout;
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      return redirect("/login");
    }
    throw new Response("Failed to load workout", {
      status: err.response?.status || 500,
    });
  }
};

const liftsLoader = async () => {
  try {
    const lifts = await getAllBaseLifts();
    return lifts;
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      return redirect("/login");
    }
    throw new Response("Failed to load lifts", {
      status: err.response?.status || 500,
    });
  }
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    loader: checkAuthLoader,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "plans",
        element: <Plans />,
        loader: plansLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: "plans/:planId/edit",
        element: <PlanEditor />,
        loader: editPlanLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: "workouts",
        element: <Workouts />,
        errorElement: <ErrorPage />,
      },
      {
        path: "workouts/:id",
        element: <ActiveWorkout />,
        loader: activeWorkoutLoader,
        errorElement: <ErrorPage />,
      },
      {
        path: "lifts",
        element: <Lifts />,
        loader: liftsLoader,
        errorElement: <ErrorPage />,
      },
      {
        index: true,
        loader: () => redirect("/plans"),
      },
    ],
  },
  {
    path: "/login",
    element: <Welcome form={<LoginForm />} />,
  },
  {
    path: "/register",
    element: <Welcome form={<RegisterForm />} />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
