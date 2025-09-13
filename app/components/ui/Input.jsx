import { forwardRef } from "react";

/**
 * Input component following KeyCliq style guide
 * @param {Object} props
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Required field
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.error - Error message
 * @param {string} props.label - Label text
 * @param {string} props.autoComplete - Auto complete attribute
 */
export const Input = forwardRef(({
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
  error,
  label,
  autoComplete,
  ...props
}, ref) => {
  const inputClasses = [
    "input",
    error ? "input--error" : "",
    className
  ].filter(Boolean).join(" ");

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: 'var(--font-body)' }}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600" style={{ fontFamily: 'var(--font-body)' }}>
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";
