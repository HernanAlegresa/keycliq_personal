/**
 * Camera placeholder component for scan capture
 */
export function CameraPlaceholder() {
  return (
    <div className="camera-placeholder">
      <div className="camera-placeholder__overlay">
        {/* Key icon as guide */}
        <svg
          className="camera-placeholder__icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
        </svg>
      </div>
    </div>
  );
}
