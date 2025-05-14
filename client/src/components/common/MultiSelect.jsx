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
    <div className="relative mb-4" ref={selectRef}>
      <div
        className={`flex items-start justify-between border border-gray-300 rounded-md p-2 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 ${className}`}
        onClick={() => inputRef.current.focus()}
      >
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="outline-none text-sm p-1 w-32 resize-none overflow-hidden leading-tight min-h-7"
          placeholder={value.length === 0 ? "Type or select..." : ""}
          rows={1}
        />

        {/* Selected Tags */}
        <div className="w-3/5 flex justify-end flex-wrap gap-1">
          {value.map((tag, index) => (
            <div
              key={tag}
              className={`w-32 flex items-center justify-between bg-blue-100 text-blue-800 px-2 py-1 rounded-md ${
                index >= 2 ? "mt-1" : ""
              }`}
            >
              <span className="text-sm mr-1">{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                className="focus:outline-none"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options
            .filter((option) => !value.includes(option.value))
            .map((option) => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => addTag(option)}
              >
                {option.label}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
