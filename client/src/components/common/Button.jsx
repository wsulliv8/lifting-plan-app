import React from "react";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  className = "",
  ...props
}) => {
  const variantClass = variant === "primary" ? "btn-primary" : "btn-secondary";
  return (
    <button type={type} className={`${variantClass} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
