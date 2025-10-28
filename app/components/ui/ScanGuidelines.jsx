import { useState } from "react";
import { Button } from "./Button.jsx";
import keyExampleImage from "../../assets/key-example-lockbox-02.png";

/**
 * ScanGuidelines - Component to show optimal scanning conditions
 * 
 * Displays guidelines to help users capture keys in the best way
 * for optimal scanning and matching results.
 */
export function ScanGuidelines({ onContinue, onCancel }) {
  const [understood, setUnderstood] = useState(false);

  const guidelines = [
    {
      icon: "↔️",
      title: "Horizontal Position",
      description: "Place the key horizontally for best results"
    },
    {
      icon: "👈",
      title: "Handle on Left",
      description: "Position the handle on the left side"
    },
    {
      icon: "⬆️",
      title: "Teeth Facing Up",
      description: "Make sure the teeth point upward"
    },
    {
      icon: "💡",
      title: "Good Lighting",
      description: "Use a light background and good lighting"
    }
  ];

  return (
    <div className="scan-guidelines">
      <div className="scan-guidelines__overlay" onClick={onCancel}></div>
      
      <div className="scan-guidelines__modal">
        {/* Header */}
        <div className="scan-guidelines__header">
          <h2 className="scan-guidelines__title">
            📸 Tips for Best Results
          </h2>
          <p className="scan-guidelines__subtitle">
            Follow these simple guidelines to optimize your key scanning
          </p>
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
                <p className="scan-guidelines__item-description">
                  {guideline.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Example */}
        <div className="scan-guidelines__example">
          <div className="scan-guidelines__example-label">Example:</div>
          <div className="scan-guidelines__example-image">
            <img 
              src={keyExampleImage}
              alt="Example of properly positioned key for scanning"
              className="scan-guidelines__key-image"
            />
          </div>
        </div>

        {/* Checkbox */}
        <label className="scan-guidelines__checkbox">
          <input 
            type="checkbox" 
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="scan-guidelines__checkbox-input"
          />
          <span className="scan-guidelines__checkbox-label">
            I understand these guidelines will help improve results
          </span>
        </label>

        {/* Actions */}
        <div className="scan-guidelines__actions">
          <Button
            variant="primary"
            size="large"
            onClick={onContinue}
            disabled={!understood}
            className="w-full py-3 rounded-2xl"
          >
            Got It, Let's Scan
          </Button>
          
          <button
            type="button"
            onClick={onCancel}
            className="scan-guidelines__skip"
          >
            Skip for now
          </button>
        </div>

        {/* Footer note */}
        <p className="scan-guidelines__note">
          💡 These are recommendations, not requirements. 
          The system will work even if conditions aren't perfect.
        </p>
      </div>
    </div>
  );
}

