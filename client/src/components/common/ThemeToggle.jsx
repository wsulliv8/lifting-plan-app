import { useTheme } from "../../context/ThemeContext";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`nav-item text-[var(--text-primary)] `}
      aria-label={
        theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
      }
    >
      {theme === "light" ? (
        <MoonIcon className="h-8 w-8" />
      ) : (
        <SunIcon className="h-8 w-8" />
      )}
    </button>
  );
};

export default ThemeToggle;
