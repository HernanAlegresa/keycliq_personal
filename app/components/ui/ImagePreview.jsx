// app/components/ui/ImagePreview.jsx
export function ImagePreview({ src, alt = "Key preview", className = "" }) {
  return (
    <div className={`image-preview key-image-frame ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={alt}
          className="image-preview__img key-image-frame__img"
        />
      ) : (
        <div className="image-preview__placeholder">
          <div className="image-preview__placeholder-content">
            {/* Key icon placeholder */}
            <svg 
              className="image-preview__placeholder-icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M15.75 5.25a3 3 0 013 3m0 0a3 3 0 01-3 3m3-3h1.5m-1.5 0V9m-7.5 3a3 3 0 01-3-3m0 0a3 3 0 013-3m-3 3H3m3.75 0v10.5a2.25 2.25 0 002.25 2.25h6a2.25 2.25 0 002.25-2.25V12M9 9l10.5-3m0 0l-10.5 4.5m10.5-4.5L12 5.25"
              />
            </svg>
            <p className="image-preview__placeholder-text">
              Image preview will appear here
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
