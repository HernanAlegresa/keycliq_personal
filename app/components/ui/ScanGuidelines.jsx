import { useState } from "react";

/**
 * ScanGuidelines - Inline component to show optimal scanning conditions
 * 
 * Displays guidelines to help users capture keys in the best way
 * for optimal scanning and matching results.
 * No longer a modal - displayed inline on the scan page.
 */
// Static asset in public/ — no serverless filesystem; same visual behavior
const SCAN_GUIDE_IMAGE_SRC = "/scan-guide-key.png";

export function ScanGuidelines() {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const defaultSrc = SCAN_GUIDE_IMAGE_SRC;
  const fallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='720' height='480' viewBox='0 0 720 480'%3E%3Crect width='720' height='480' fill='%23f3f4f6'/%3E%3Cpath d='M120 120h480v240H120z' fill='none' stroke='%23d1d5db' stroke-width='8' stroke-dasharray='16 18'/%3E%3Cpath d='M240 240c0-52.996 43.004-96 96-96s96 43.004 96 96-43.004 96-96 96-96-43.004-96-96z' fill='none' stroke='%239ca3af' stroke-width='14' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

  const guidelines = [
    {
      icon: "↔️",
      title: "Horizontal Position",
      description: null,
    },
    {
      icon: "👈",
      title: "Bow on Left",
      description: null,
    },
    {
      icon: "⬆️",
      title: "Teeth Facing Up",
      description: null,
    },
    {
      icon: "💡",
      title: "Good Lighting",
      description: null,
    },
    {
      icon: "🔍",
      title: "Zoom for better focus",
      description: "Make a small zoom to improve sharpness and get a clearer key image. Avoid taking the photo too close or too far.",
    }
  ];

  return (
    <div className="scan-guidelines scan-guidelines--inline">
      {/* Guidelines Card Container */}
      <div className="scan-guidelines__card">
        {/* Header */}
        <div className="scan-guidelines__header">
          <h2 className="scan-guidelines__header-title">Scanning Tips</h2>
        </div>

        {/* Guidelines List */}
        <div className="scan-guidelines__list">
          {guidelines.map((guideline, index) => (
            <div key={index} className="scan-guidelines__item">
              <div className="scan-guidelines__icon">
                {guideline.icon}
              </div>
              <div className="scan-guidelines__content">
                <h3 className="scan-guidelines__item-title">
                  {guideline.title}
                </h3>
                {guideline.description && (
                  <p className="scan-guidelines__item-description">
                    {guideline.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Visual Example */}
        <div className="scan-guidelines__example">
          <div className="scan-guidelines__example-image">
            <div
              className={`scan-guidelines__image-skeleton ${imageLoaded ? "is-hidden" : ""}`}
              aria-hidden="true"
            />
            <picture>
              <img
                src={imageFailed ? fallbackSvg : defaultSrc}
                alt="Example of properly positioned key for scanning"
                className="scan-guidelines__key-image"
                loading="lazy"
                decoding="async"
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageFailed(true);
                  setImageLoaded(true);
                }}
              />
            </picture>
          </div>
        </div>
      </div>
    </div>
  );
}

