import { useState, memo } from "react";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  className = "",
  containerClass = "",
  required,
  ...props
}) => {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
  };

  const isInvalid = required && touched && !value?.toString().trim();

  return (
    <div className={`mb-4 ${containerClass}`}>
      {label && (
        <label className="block text-gray-700 text-sm mb-1">
          {label}
          {isInvalid && <span className="text-error ml-4">required</span>}
        </label>
      )}
      <input
        type={type}
        value={value ?? ""}
        onChange={onChange}
        onBlur={handleBlur}
        className={`input-field ${
          isInvalid ? "border-error" : ""
        } ${className}`}
        required={required}
        {...props}
      />
    </div>
  );
};

export default memo(Input);
