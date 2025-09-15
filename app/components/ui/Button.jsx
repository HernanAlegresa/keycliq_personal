import { Link } from "@remix-run/react";

/**
 * Button component following KeyCliq style guide
 * @param {Object} props
 * @param {string} props.variant - 'primary' | 'secondary' | 'disabled'
 * @param {string} props.size - 'small' | 'medium' | 'large'
 * @param {string} props.to - Link destination (makes it a Link)
 * @param {string} props.href - External link (makes it an anchor)
 * @param {boolean} props.disabled - Disabled state
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
export function Button({
  variant = "primary",
  size = "medium",
  to,
  href,
  disabled = false,
  children,
  className = "",
  onClick,
  ...props
}) {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn--primary",
    secondary: "btn--secondary",
    disabled: "btn--disabled",
  };
  const sizeClasses = {
    small: "btn--small",
    medium: "",
    large: "btn--large",
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? "btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const buttonProps = {
    className: classes,
    disabled: disabled || variant === "disabled",
    onClick,
    ...props,
  };

  // External link
  if (href) {
    return (
      <a href={href} {...buttonProps}>
        {children}
      </a>
    );
  }

  // Internal link
  if (to) {
    return (
      <Link to={to} {...buttonProps}>
        {children}
      </Link>
    );
  }

  // Regular button
  return <button {...buttonProps}>{children}</button>;
}
