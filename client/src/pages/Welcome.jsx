import React from "react";

const Welcome = ({ form }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Form Section (Left on Desktop, Top on Mobile) */}
      <div className="flex-1 flex items-center justify-center p-4">{form}</div>
      {/* Hero Section (Right on Desktop, Bottom on Mobile) */}
      <div className="flex-1 bg-primary text-white flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Lift Your Limits
          </h1>
          <p className="text-lg md:text-xl">
            Build your perfect weightlifting plan with ease.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
