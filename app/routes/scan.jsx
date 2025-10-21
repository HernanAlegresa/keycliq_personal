import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useRef, useState, useEffect } from "react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";
import { CameraPlaceholder } from "../components/ui/CameraPlaceholder.jsx";
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
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);

  // Check if user has seen guidelines before
  useEffect(() => {
    const hasSeenGuidelines = localStorage.getItem('hasSeenScanGuidelines');
    if (!hasSeenGuidelines) {
      // Show guidelines on first visit
      setShowGuidelines(true);
    }
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
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

  const handleScan = () => {
    // Check if user has seen guidelines
    const hasSeenGuidelines = localStorage.getItem('hasSeenScanGuidelines');
    
    if (!hasSeenGuidelines) {
      // Show guidelines first
      setShowGuidelines(true);
    } else {
      // Proceed with scan
      fileInputRef.current?.click();
    }
  };

  const handleGuidelinesContinue = () => {
    // Mark guidelines as seen
    localStorage.setItem('hasSeenScanGuidelines', 'true');
    setShowGuidelines(false);
    
    // Proceed with scan
    fileInputRef.current?.click();
  };

  const handleGuidelinesCancel = () => {
    // User skipped guidelines
    localStorage.setItem('hasSeenScanGuidelines', 'true');
    setShowGuidelines(false);
  };

  return (
    <div className="scan-capture">
      {/* Camera Area */}
      <CameraPlaceholder />
      
      {/* Hint Text */}
      <p className="scan-capture__hint">
        Place the key on a light background. Align with the frame.
      </p>

      {/* Actions */}
      <div className="scan-capture__actions">
        <Button
          variant="primary"
          size="large"
          onClick={handleScan}
          disabled={isLoading}
          className="w-full py-3 rounded-2xl"
        >
          SCAN
        </Button>

        {error && (
          <p className="text-red-600 text-sm text-center" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="scan-capture__file-input"
        aria-label="Scan a key image"
      />

      {/* Scan Guidelines Modal */}
      {showGuidelines && (
        <ScanGuidelines 
          onContinue={handleGuidelinesContinue}
          onCancel={handleGuidelinesCancel}
        />
      )}
    </div>
  );
}