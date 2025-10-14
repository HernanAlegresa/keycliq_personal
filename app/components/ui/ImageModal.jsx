import { useEffect } from "react";

/**
 * Image Modal component for displaying full-size images
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Image alt text
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {function} props.onClose - Function to call when closing modal
 */
export function ImageModal({ src, alt = "Key image", isOpen, onClose }) {
  // Close modal when pressing Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal when clicking on backdrop
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="image-modal" onClick={handleBackdropClick}>
      <div className="image-modal__content">
        <button 
          className="image-modal__close"
          onClick={onClose}
          aria-label="Close image modal"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <img 
          src={src} 
          alt={alt}
          className="image-modal__img"
        />
      </div>
    </div>
  );
}
