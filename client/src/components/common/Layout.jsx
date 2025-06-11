import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="min-h-screen flex overflow-x-hidden bg-[var(--background)]">
      <Navbar />
      <main className="p-2 md:p-4 md:pr-1 md:ml-16 flex-1 w-full overflow-y-auto overflow-x-hidden max-h-screen pb-14 md:pb-4">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
