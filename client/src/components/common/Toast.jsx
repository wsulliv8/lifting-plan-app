import { useTheme } from "../../context/ThemeContext";

const Toast = ({ message, visible }) => {
  const { screenSize } = useTheme();

  if (!visible) return null;

  return (
    <div
      className={`fixed left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl shadow-lg z-50 animate-fade-in-out bg-[var(--primary)] text-[var(--text-primary-light)] ${
        screenSize.isMobile ? "bottom-14" : "bottom-6"
      }`}
    >
      {message}
    </div>
  );
};

export default Toast;
