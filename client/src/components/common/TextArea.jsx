import { useState, memo } from "react";

const TextArea = ({
  label,
  value,
  onChange,
  className = "",
  required,
  ...props
}) => {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
  };

  const isInvalid = required && touched && !value?.toString().trim();

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-gray-700 text-sm mb-1">
          {label}
          {isInvalid && <span className="text-error ml-4">required</span>}
        </label>
      )}
      <textarea
        value={value ?? ""}
        onChange={onChange}
        onBlur={handleBlur}
        className={`input-field resize-none ${
          isInvalid ? "border-error" : ""
        } ${className}`}
        required={required}
        {...props}
      />
    </div>
  );
};

export default memo(TextArea);
