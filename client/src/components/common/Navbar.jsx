import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  DocumentTextIcon,
  PlayIcon,
  PlusCircleIcon,
  CogIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { logout } from "../../services/auth";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      console.error("Logout failed");
    }
  };

  const navItems = [
    { to: "/profile", label: "Home", icon: HomeIcon },
    { to: "/plans", label: "Plans", icon: DocumentTextIcon },
    { to: "/workouts", label: "Workouts", icon: PlayIcon },
    { to: "/lifts", label: "Lifts", icon: PlusCircleIcon },
  ];

  return (
    <nav className="h-screen md:w-16 flex flex-col fixed z-50 shadow-md bg-[var(--surface)]">
      {/* Logo */}
      <div className="p-3 border-[var(--border)] border-b">
        <h2 className="font-bold text-[var(--text-primary)]">Hevy</h2>
      </div>

      {/* Hamburger Toggle (Mobile) */}
      <button
        className="md:hidden p-4 focus:outline-none text-[var(--text-primary)]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <Bars3Icon className="h-6 w-6" />
        )}
      </button>

      {/* Nav Items */}
      <div
        className={`flex flex-col items-center space-y-4 p-2 mt-4 ${
          isOpen ? "block" : "hidden"
        } md:block flex-1`}
      >
        {navItems.map((item) => (
          <div key={item.to} className="relative group">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${
                  isActive
                    ? "bg-[var(--primary)] text-[var(--text-primary-light)] "
                    : "text-[var(--text-primary)] hover:bg-[var(--background)] "
                }`
              }
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-6 w-6" />
            </NavLink>
            {/* Hover Label (Desktop) */}
            <span className="nav-label hidden md:block left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
              {item.label}
            </span>
            {/* Label Always Visible (Mobile) */}
            <span className="md:hidden text-sm mt-1 text-center block text-[var(--text-secondary)]">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Theme Toggle */}
      <div className="relative group flex justify-center items-center">
        <ThemeToggle />
        {/* Hover Label (Desktop) */}
        <span className="nav-label hidden md:block left-full ml-2 top-1/2  transform -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
          Theme
        </span>
        {/* Label Always Visible (Mobile) */}
        <span className="md:hidden text-sm mt-1 text-center block text-[var(--text-secondary)]">
          Theme
        </span>
      </div>

      {/* User Profile Dropdown */}
      <div className="mt-2 p-2" ref={profileRef}>
        <div className="relative group">
          <button
            className={`nav-item ${
              isProfileOpen
                ? "bg-[var(--primary)] text-[var(--text-primary-light)]"
                : "text-[var(--text-primary)] hover:bg-[var(--background)]"
            }`}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <UserIcon className="h-6 w-6" />
          </button>
          {/* Hover Label (Desktop) */}
          <span className="nav-label hidden md:block left-full ml-2 top-1/2 transform -translate-y-1/2 group-hover:opacity-100">
            Profile
          </span>
          {/* Label Always Visible (Mobile) */}
          <span className="md:hidden text-sm mt-1 text-center block text-[var(--text-secondary)]">
            Profile
          </span>
          {/* Dropdown */}
          {isProfileOpen && (
            <div className="absolute bottom-full mb-2 md:left-full md:ml-2 shadow-lg rounded-lg w-40 py-2 z-50 bg-[var(--surface)]">
              <NavLink
                to="/settings"
                className="flex items-center space-x-2 px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--background-alt)]"
                onClick={() => setIsProfileOpen(false)}
              >
                <CogIcon className="h-5 w-5" />
                <span>Settings</span>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 w-full text-left text-[var(--text-primary)] hover:bg-[var(--background-alt)]"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
