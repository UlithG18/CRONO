import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  disabled = false,
  onClick,
  style = {},
  ...props
}) {
  const baseClasses = 'crono-btn';
  const variantClass = `crono-btn-${variant}`;
  const sizeClass = `crono-btn-${size}`;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;