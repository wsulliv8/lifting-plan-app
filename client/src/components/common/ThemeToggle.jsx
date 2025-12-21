import { useTheme } from "../../context/useTheme";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const ThemeToggle = () => {
  const { theme, toggleTheme, screenSize } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`nav-item text-[var(--text-primary)] `}
      aria-label={
        theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"
      }
    >
      {theme === "light" ? (
        <MoonIcon
          className={`${screenSize.isMobile ? "h-6 w-6" : "h-8 w-8"}`}
        />
      ) : (
        <SunIcon className={`${screenSize.isMobile ? "h-6 w-6" : "h-8 w-8"}`} />
      )}
    </button>
  );
};

export default ThemeToggle;
