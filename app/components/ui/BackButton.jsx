import { Link } from "@remix-run/react";

/**
 * Back button component for navigation
 * @param {Object} props
 * @param {string} props.to - Navigation destination
 * @param {string} props.ariaLabel - Accessibility label
 */
export function BackButton({ to = "/", ariaLabel = "Go back" }) {
  return (
    <Link
      to={to}
      className="back-button"
      aria-label={ariaLabel}
      role="button"
    >
      <svg
        className="back-button__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
    </Link>
  );
}
