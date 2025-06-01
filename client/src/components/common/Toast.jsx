const Toast = ({ message, visible }) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl shadow-lg z-50 animate-fade-in-out bg-[var(--primary)] text-[var(--text-primary-light)]">
      {message}
    </div>
  );
};

export default Toast;
