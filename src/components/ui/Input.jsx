import React from 'react';

export function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  disabled = false,
  required = false,
  error = '',
  helperText = '',
  className = '',
  style = {},
  ...props
}) {
  return (
    <div className={`crono-input-group ${className}`.trim()} style={style}>
      {label && (
        <label htmlFor={id || name} className="crono-label">
          {label} {required && <span className="crono-required">*</span>}
        </label>
      )}
      <input
        id={id || name}
        name={name || id}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={`crono-input ${error ? 'has-error' : ''}`}
        {...props}
      />
      {error && <span className="crono-error-text">{error}</span>}
      {helperText && !error && <span className="crono-helper-text">{helperText}</span>}
    </div>
  );
}

export function Select({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  required = false,
  className = '',
  children,
  ...props
}) {
  return (
    <div className={`crono-input-group ${className}`.trim()}>
      {label && (
        <label htmlFor={id || name} className="crono-label">
          {label} {required && <span className="crono-required">*</span>}
        </label>
      )}
      <select
        id={id || name}
        name={name || id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="crono-select"
        {...props}
      >
        {children || options.map(opt => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {labelText}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default Input;