import React from "react";
import { useRouteError } from "react-router-dom";
import Button from "./Button";

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="card max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Oops!</h2>
        <p className="text-gray-600 mb-4">
          {error.statusText || error.message || "Something went wrong"}
        </p>
        <Button onClick={() => (window.location.href = "/plans")}>
          Back to Plans
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage;
