/**
 * Card component following KeyCliq style guide
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Enable hover effects
 * @param {string} props.as - HTML element or component to render as
 */
export function Card({
  children,
  className = "",
  hover = true,
  as: Component = "div",
  ...props
}) {
  const classes = [
    "card",
    hover ? "" : "card--no-hover",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

/**
 * Card body component
 */
export function CardBody({ children, className = "", ...props }) {
  return (
    <div className={`card__body ${className}`} {...props}>
      {children}
    </div>
  );
}

/**
 * Card image component
 */
export function CardImage({ src, alt, className = "", ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      className={`card__img ${className}`}
      {...props}
    />
  );
}
