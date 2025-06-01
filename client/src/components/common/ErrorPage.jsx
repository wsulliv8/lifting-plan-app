import React from "react";
import { useRouteError } from "react-router-dom";
import Button from "./Button";

const ErrorPage = () => {
  const error = useRouteError();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--background)]">
      <div className="card max-w-md text-center">
        <h2 className="heading mb-4">Oops!</h2>
        <p className="mb-4 text-[var(--text-secondary)]">
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
