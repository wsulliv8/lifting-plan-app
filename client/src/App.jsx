import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  redirect,
} from "react-router-dom";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import Welcome from "./pages/Welcome";
import Plans from "./pages/Plans";
import PlanEditor from "./components/plans/PlanEditor";
import Workouts from "./pages/Workouts";
import Lifts from "./pages/Lifts";
import Layout from "./components/common/Layout";
import ErrorPage from "./components/common/ErrorPage";
import { getPlans, getPlanById } from "./services/plans";
import { getAllBaseLifts } from "./services/lifts";

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
    const [plan, baseLifts] = await Promise.all([
      getPlanById(params.planId),
      getAllBaseLifts(),
    ]);
    return { plan, baseLifts };
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
        path: "lifts",
        element: <Lifts />,
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
