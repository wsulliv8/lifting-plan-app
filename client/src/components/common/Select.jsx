// common/Select.jsx
import React from "react";

const Select = ({
  label,
  value,
  onChange,
  options,
  name,
  disabled = false,
  className = "",
  containerClass = "",
  error,
}) => (
  <div className={`mb-4 ${containerClass}`}>
    {label && (
      <label className="block text-sm mb-1 text-[var(--text-primary)]">
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      name={name}
      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-[var(--text-primary)] bg-[var(--background)] ${
        error ? "border-red-500 focus:ring-red-500" : "border-[var(--border)]"
      } ${className}`}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);

export default Select;
