import { useState, memo } from "react";

const Input = ({
  label,
  type = "text",
  value,
  onChange,
  className = "",
  containerClass = "",
  required,
  error,
  style,
  ...props
}) => {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
  };

  const isInvalid = required && touched && !value?.toString().trim();
  const hasError = error || isInvalid;

  return (
    <div className={`${containerClass}`}>
      {label && (
        <label className="block text-sm mb-1 text-[var(--text-primary)]">
          {label}
          {isInvalid && <span className="error-text ml-4">required</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={handleBlur}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-[var(--background)] text-[var(--text-primary)] ${
          hasError
            ? "border-red-500 focus:ring-red-500"
            : "border-[var(--border)]"
        } ${className}`}
        style={style}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default memo(Input);
