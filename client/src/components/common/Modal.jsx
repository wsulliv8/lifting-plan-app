import { useEffect, useRef, memo } from "react";

const Modal = ({ isOpen, onClose, title, children, className }) => {
  const modalRef = useRef(null);
  const firstRenderRef = useRef(true);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleFocusTrap = (e) => {
      if (!modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleFocusTrap);
      if (firstRenderRef.current) {
        const firstInput = modalRef.current.querySelector(
          "input, select, textarea"
        );
        if (firstInput) {
          firstInput.focus();
        } else {
          modalRef.current.querySelector("#modal-title")?.focus();
        }
        firstRenderRef.current = false;
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleFocusTrap);
      firstRenderRef.current = true;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`flex flex-col bg-white rounded-lg shadow-md p-6 max-w-[95vw] max-h-[95vh] overflow-hidden ${className}`}
        tabIndex={-1}
        style={{ maxHeight: "95vh" }}
      >
        <div className="h-8 flex justify-between items-center mb-4">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900"
            tabIndex={-1}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div
          className="flex-1 min-h-0 overflow-y-auto"
          style={{ maxHeight: "calc(95vh - 3rem)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default memo(Modal);
