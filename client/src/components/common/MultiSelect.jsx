import React, { useRef, useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";

const MultiSelect = ({
  value = [],
  onChange,
  options = [],
  className = "",
  placeholder = "Type or select...",
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    // Auto expand textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tag) => {
    onChange(value.filter((t) => t !== tag));
  };

  const addTag = (option) => {
    if (!value.includes(option.value)) {
      onChange([...value, option.value]);
    }
    setInputValue("");
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={selectRef}>
      <div
        className={`flex items-start justify-between rounded-lg p-2 border border-[var(--border)] bg-[var(--background)] focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition-colors ${className}`}
        onClick={() => inputRef.current.focus()}
      >
        {/* Input */}
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="outline-none text-sm py-1 w-32 resize-none overflow-hidden leading-tight min-h-7 bg-[var(--background)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
          placeholder={value.length === 0 ? placeholder : ""}
          rows={1}
        />

        {/* Selected Tags */}
        <div className="w-3/5 flex justify-end flex-wrap gap-2">
          {value.map((tag) => (
            <div
              key={tag}
              className="w-32 h-7 flex items-center justify-between px-2 rounded-md bg-[var(--primary-light)] text-[var(--text-primary)]"
            >
              <span className="text-sm truncate">{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="text-[var(--text-primary)] hover:text-[var(--danger)] transition-colors focus:outline-none flex-shrink-0 ml-1"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-lg shadow-lg max-h-60 overflow-y-auto bg-[var(--surface)] border border-[var(--border)]">
          {options
            .filter((option) => !value.includes(option.value))
            .map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 cursor-pointer text-sm text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
                onClick={() => addTag(option)}
              >
                {option.label}
              </div>
            ))}
          {options.filter((option) => !value.includes(option.value)).length ===
            0 && (
            <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
