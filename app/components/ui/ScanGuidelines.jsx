import keyExampleImage from "../../assets/key-example-lockbox-02.png";

/**
 * ScanGuidelines - Inline component to show optimal scanning conditions
 * 
 * Displays guidelines to help users capture keys in the best way
 * for optimal scanning and matching results.
 * No longer a modal - displayed inline on the scan page.
 */
export function ScanGuidelines() {
  const guidelines = [
    {
      icon: "↔️",
      title: "Horizontal Position",
      description: null,
    },
    {
      icon: "👈",
      title: "Handle on Left",
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
            <img 
              src={keyExampleImage}
              alt="Example of properly positioned key for scanning"
              className="scan-guidelines__key-image"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

