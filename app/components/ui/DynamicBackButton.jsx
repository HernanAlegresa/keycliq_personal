import { useNavigate } from "@remix-run/react";

/**
 * Dynamic back button component that determines navigation based on URL params
 */
export function DynamicBackButton() {
  const navigate = useNavigate();
  
  // Determine the previous screen based on URL parameters
  const getPreviousScreen = () => {
    // Check URL search params for navigation source
    const urlParams = new URLSearchParams(window.location.search);
    const from = urlParams.get('from');
    
    if (from) {
      // Handle special case for Home page
      if (from === '/') {
        return '/';
      }
      return from;
    }
    
    // Check if this is a new key
    const isNewKey = window.location.pathname.includes('new-key');
    
    // Default fallbacks based on key type
    if (isNewKey) {
      return '/scan/no_match'; // Default for new keys
    } else {
      return '/keys'; // Default for existing keys
    }
  };

  const handleBackNavigation = () => {
    const previousScreen = getPreviousScreen();
    navigate(previousScreen);
  };

  return (
    <button
      onClick={handleBackNavigation}
      className="back-button"
      aria-label="Go back"
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
    </button>
  );
}
