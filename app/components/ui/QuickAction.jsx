import { Link } from "@remix-run/react";

/**
 * QuickAction component for Homepage
 * @param {Object} props
 * @param {string} props.title - Action title
 * @param {string} props.description - Action description
 * @param {string} props.to - Link destination
 * @param {string} props.icon - Icon type ('camera' | 'search')
 * @param {string} props.variant - 'primary' | 'secondary'
 */
export function QuickAction({ title, description, to, icon, variant = "primary" }) {
  const variantClasses = {
    primary: "quick-action--primary",
    secondary: "quick-action--secondary",
  };

  const renderIcon = () => {
    if (icon === "camera") {
      return (
        <svg className="quick-action__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
      );
    }
    if (icon === "search") {
      return (
        <svg className="quick-action__icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
      );
    }
    return null;
  };

  return (
    <Link to={to} className={`quick-action ${variantClasses[variant]}`}>
      <div className="quick-action__content">
        <h3 className="quick-action__title">{title}</h3>
        <p className="quick-action__description">{description}</p>
      </div>
      <div className="quick-action__icon">
        {renderIcon()}
      </div>
    </Link>
  );
}
