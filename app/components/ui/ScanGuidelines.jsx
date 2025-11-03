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
    },
    {
      icon: "👈",
      title: "Handle on Left",
    },
    {
      icon: "⬆️",
      title: "Teeth Facing Up",
    },
    {
      icon: "💡",
      title: "Good Lighting",
    },
    {
      icon: "🔍",
      title: "Zoom for better focus",
    }
  ];

  return (
    <div className="scan-guidelines scan-guidelines--inline">
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
  );
}

