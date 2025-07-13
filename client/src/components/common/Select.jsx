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
      className={`input-field ${className}`}
      disabled={disabled}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default Select;
