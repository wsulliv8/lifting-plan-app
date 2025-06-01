import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen flex overflow-x-hidden bg-[var(--background)]">
      <Navbar />
      <main className="p-4 pr-0 ml-16 flex-1 w-full overflow-y-scroll overflow-x-hidden max-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
