import { Link } from "@remix-run/react";
import wordmarkLogo from "../../assets/KeyCliq_Wordmark_TwoTone_Dark.png";

/**
 * Header component for KeyCliq app
 * @param {Object} props
 * @param {string} props.title - Header title
 * @param {React.ReactNode} props.leftSlot - Left side content (e.g. back button)
 * @param {React.ReactNode} props.rightSlot - Right side content (e.g. step indicator)
 * @param {React.ReactNode} props.children - Additional header content
 */
export function Header({ title = "KeyCliq", leftSlot, rightSlot, children }) {
  const hasSlots = leftSlot || rightSlot;
  
  if (hasSlots) {
    return (
      <header className="topbar">
        <div className="container topbar__inner--slots">
          <div className="topbar__left">
            {leftSlot || <div />} {/* Empty div to maintain layout */}
          </div>
          
          <h1 className="topbar__title--centered">
            {title}
          </h1>
          
          <div className="topbar__right">
            {rightSlot && (
              typeof rightSlot === 'string' ? (
                <span className="topbar__step-label">{rightSlot}</span>
              ) : (
                rightSlot
              )
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <Link to="/" className="topbar__logo-link">
          <img 
            src={wordmarkLogo} 
            alt="KeyCliq" 
            className="topbar__logo"
          />
        </Link>
        
        {children && (
          <nav className="hidden sm:flex" style={{ gap: 12 }}>
            {children}
          </nav>
        )}
      </div>
    </header>
  );
}
