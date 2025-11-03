import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useRef, useState, useEffect } from "react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";
import { ScanGuidelines } from "../components/ui/ScanGuidelines.jsx";
import { fileToDataURL } from "../utils/imageUtils.js";

export const handle = { 
  hideFooter: true, 
  title: 'Scan a Key', 
  stepLabel: '1 of 2',
  showBackButton: true,
  backTo: '/'
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanCapture() {
  const navigate = useNavigate();
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const actionSelectorRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showActionSelector, setShowActionSelector] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect if we're on desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Close action selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionSelectorRef.current && !actionSelectorRef.current.contains(event.target)) {
        setShowActionSelector(false);
      }
    };

    if (showActionSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionSelector]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setIsLoading(true);
    setShowActionSelector(false);

    try {
      // Convert file to data URL for better persistence
      const dataURL = await fileToDataURL(file);
      
      // Store both blob URL (for preview) and data URL (for persistence)
      const objectUrl = URL.createObjectURL(file);
      sessionStorage.setItem('tempKeyImage', objectUrl);
      sessionStorage.setItem('tempKeyImageDataURL', dataURL);
      sessionStorage.setItem('tempKeyImageName', file.name);
      
      // Navigate to review page
      navigate('/scan/review');
    } catch (err) {
      console.error('Error processing image:', err);
      setError('Failed to process image');
      setIsLoading(false);
    }
  };

  const handleCameraInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleGalleryInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleUploadInputChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleScanClick = () => {
    setShowActionSelector(!showActionSelector);
  };

  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const handleChooseFromGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleUploadFile = () => {
    uploadInputRef.current?.click();
  };

  return (
    <div className="scan-capture">
      {/* Inline Scan Guidelines */}
      <ScanGuidelines />

      {/* Actions */}
      <div className="scan-capture__actions">
        <div className="scan-capture__action-wrapper" ref={actionSelectorRef}>
          <Button
            variant="primary"
            size="large"
            onClick={handleScanClick}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl"
          >
            SCAN
          </Button>

          {/* Action Selector Popover */}
          {showActionSelector && (
            <div className="scan-action-selector">
              <button
                type="button"
                onClick={handleTakePhoto}
                className="scan-action-selector__option"
                disabled={isLoading}
              >
                <span className="scan-action-selector__icon">📸</span>
                <span className="scan-action-selector__text">Take a Photo</span>
              </button>
              
              <button
                type="button"
                onClick={handleChooseFromGallery}
                className="scan-action-selector__option"
                disabled={isLoading}
              >
                <span className="scan-action-selector__icon">🖼️</span>
                <span className="scan-action-selector__text">Choose from Gallery</span>
              </button>

              {isDesktop && (
                <button
                  type="button"
                  onClick={handleUploadFile}
                  className="scan-action-selector__option"
                  disabled={isLoading}
                >
                  <span className="scan-action-selector__icon">📁</span>
                  <span className="scan-action-selector__text">Upload File</span>
                </button>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraInputChange}
        className="scan-capture__file-input"
        aria-label="Take a photo"
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryInputChange}
        className="scan-capture__file-input"
        aria-label="Choose from gallery"
      />

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={handleUploadInputChange}
        className="scan-capture__file-input"
        aria-label="Upload file"
      />
    </div>
  );
}