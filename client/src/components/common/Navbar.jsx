import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
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
import { CiDumbbell, CiCalendar } from "react-icons/ci";
import logo from "../../assets/images/logo-yellow.png";
import { logout } from "../../services/auth";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { theme, screenSize } = useTheme();
  
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
    { to: "/plans", label: "Plans", icon: CiCalendar },
    { to: "/lifts", label: "Lifts", icon: CiDumbbell },
  ];

  return (
    <nav className="md:h-screen md:w-16 flex md:flex-col fixed z-50 shadow-md bg-[var(--surface)] md:top-0 bottom-0 left-0 right-0 md:right-auto">
      {/* Desktop Logo */} 
      {screenSize.isDesktop && (
      <div className="hidden md:block py-8 px-1 pr-2 border-[var(--border)] border-b">
        <img
          src={theme === "light" ? logo : logo}
          onClick={() => navigate("/plans")}
          alt="Hevy Logo"
          className={`w-26 h-auto`}
        />
      </div>
      )}

      {/* Main Navigation */}
      <div className={`flex flex-row w-full md:flex-col md:h-full ${
        screenSize.isMobile ? "h-12" : "h-full"
      }`}>
        {/* Top Navigation Items */}
        <div className="flex flex-row md:flex-col flex-1 md:flex-none md:mt-10 justify-around md:justify-start md:items-center">
          {navItems.map((item) => (
            <div key={item.to} className="relative group md:mb-8 flex items-center justify-center">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--text-primary-light)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--background-dark)]"
                  }
                  ${screenSize.isMobile ? "h-10 w-10" : "h-12 w-12"}`
                }
              >
                <item.icon className="h-8 w-8" />
              </NavLink>
              {/* Desktop Hover Label */}
              <span className="nav-label hidden md:block left-16 ml-2 top-1/2 transform -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {screenSize.isMobile && (
      <div className="flex justify-center items-center">
        <img
          src={theme === "light" ? logo : logo}
          onClick={() => navigate("/plans")}
          alt="Hevy Logo"
          className={`w-16 h-auto`}
        />
      </div>
      )}

        {/* Bottom Items (Theme and Profile) */}
        <div className="flex flex-row md:flex-col flex-1 md:flex-none justify-around md:justify-start md:items-center md:mt-auto md:mb-4">
          {/* Theme Toggle */}
          <div className="relative group md:mb-4 flex items-center justify-center">
            <div className={`nav-item ${
                screenSize.isMobile ? "h-10 w-10" : "h-12 w-12"
              } hover:bg-[var(--background-dark)]`}
            >
              <ThemeToggle />
              {/* Mobile Label */}
            </div>
            {/* Desktop Hover Label */}
            <span className="nav-label hidden md:block left-16 ml-2 top-1/2 transform -translate-y-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200">
              Theme
            </span>
          </div>

          {/* User Profile */}
          <div className="relative group flex items-center justify-center" ref={profileRef}>
            <button
              className={`nav-item ${
                screenSize.isMobile ? "h-10 w-10" : "h-12 w-12"
              } ${
                isProfileOpen
                  ? "bg-[var(--primary)] text-[var(--text-primary-light)]"
                  : "text-[var(--text-primary)] hover:bg-[var(--background-dark)]"
              }`}
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <UserIcon className={`${screenSize.isMobile ? "h-5 w-5" : "h-6 w-6"}`} />
            </button>
            {/* Desktop Hover Label */}
            <span
              className={`nav-label hidden md:block left-16 ml-2 top-1/2 transform -translate-y-1/2 opacity-0 pointer-events-none transition-opacity duration-200 ${
                !isProfileOpen
                  ? "group-hover:opacity-100 group-hover:pointer-events-auto"
                  : ""
              }`}
            >
              Profile
            </span>
            {/* Dropdown */}
            {isProfileOpen && (
              <div className={`absolute md:bottom-auto md:top-[-45px] bottom-full mb-2 md:ml-2 md:mb-0 shadow-lg rounded-lg py-2 z-50 bg-[var(--surface)] ${
                screenSize.isMobile ? "left-[-40%] transform -translate-x-1/2 w-32" : "left-[60px] w-40"
              }`}>
                <NavLink
                  to="/settings"
                  className="flex items-center space-x-2 px-4 py-2 text-[var(--text-primary)] hover:bg-[var(--background)]"
                  onClick={() => setIsProfileOpen(false)}
                >
                  <CogIcon className="h-5 w-5" />
                  <span>Settings</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 w-full text-left text-[var(--text-primary)] hover:bg-[var(--background)]"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
