import { useState, useEffect, useRef } from "react";

const TextArea = ({
  label,
  value,
  onChange,
  className = "",
  required,
  containerClass = "",
  ...props
}) => {
  const [touched, setTouched] = useState(false);
  const textareaRef = useRef(null);

  const handleBlur = () => {
    setTouched(true);
  };

  const isInvalid = required && touched && !value?.toString().trim();

  // Resize on content change
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto"; // reset first
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);

  return (
    <div className={`mb-4 ${containerClass}`}>
      {label && (
        <label className="block text-gray-700 text-sm mb-1">
          {label}
          {isInvalid && <span className="text-error ml-4">required</span>}
        </label>
      )}
      <textarea
        ref={textareaRef}
        value={value ?? ""}
        onChange={onChange}
        onBlur={handleBlur}
        className={`input-field resize-none overflow-hidden ${
          isInvalid ? "border-error" : ""
        } ${className}`}
        rows={3}
        required={required}
        {...props}
      />
    </div>
  );
};

export default TextArea;
