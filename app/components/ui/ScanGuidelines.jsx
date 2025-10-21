import { useState } from "react";
import { Button } from "./Button.jsx";

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
            <svg 
              viewBox="0 0 200 100" 
              className="scan-guidelines__key-illustration"
              aria-label="Key positioning example"
            >
              {/* Key outline */}
              <rect x="20" y="35" width="30" height="30" rx="5" fill="#006209" opacity="0.9"/>
              {/* Key shaft */}
              <rect x="50" y="45" width="120" height="10" fill="#006209" opacity="0.9"/>
              {/* Key teeth */}
              <rect x="100" y="35" width="5" height="10" fill="#006209"/>
              <rect x="110" y="30" width="5" height="15" fill="#006209"/>
              <rect x="120" y="35" width="5" height="10" fill="#006209"/>
              <rect x="130" y="28" width="5" height="17" fill="#006209"/>
              <rect x="140" y="33" width="5" height="12" fill="#006209"/>
              <rect x="150" y="30" width="5" height="15" fill="#006209"/>
              <rect x="160" y="35" width="5" height="10" fill="#006209"/>
              
              {/* Labels */}
              <text x="35" y="80" fontSize="10" fill="#666" textAnchor="middle">Handle</text>
              <text x="165" y="25" fontSize="10" fill="#666" textAnchor="middle">Teeth Up</text>
              
              {/* Arrow pointing left */}
              <path d="M 15 50 L 5 50 L 10 45 M 5 50 L 10 55" stroke="#006209" strokeWidth="2" fill="none"/>
              <text x="12" y="65" fontSize="8" fill="#006209">Left</text>
            </svg>
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

