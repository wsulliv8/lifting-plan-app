// common/Select.jsx
import React from "react";

const Select = ({ label, value, onChange, options, name, className = "" }) => (
  <div className="mb-4">
    {label && (
      <label className="block text-gray-700 text-sm mb-1">{label}</label>
    )}
    <select
      value={value}
      onChange={onChange}
      name={name}
      className={`input-field ${className}`}
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
