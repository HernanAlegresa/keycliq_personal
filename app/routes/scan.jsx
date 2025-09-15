import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useRef, useState } from "react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";
import { CameraPlaceholder } from "../components/ui/CameraPlaceholder.jsx";

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
      // Store file temporarily for review page
      const objectUrl = URL.createObjectURL(file);
      sessionStorage.setItem('tempKeyImage', objectUrl);
      sessionStorage.setItem('tempKeyImageName', file.name);
      
      // Navigate to review page
      navigate('/scan/review');
    } catch (err) {
      setError('Failed to process image');
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakePhoto = () => {
    // TODO: Implement camera functionality
    console.log('Take photo - not implemented yet');
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
          onClick={handleTakePhoto}
          disabled={isLoading}
          className="w-full py-3 rounded-2xl"
        >
          Take Photo
        </Button>
        
        <button
          type="button"
          onClick={handleUploadClick}
          className="scan-capture__secondary-button"
          aria-label="Upload an image instead"
          disabled={isLoading}
        >
          Upload an image instead
        </button>

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
        onChange={handleFileUpload}
        className="scan-capture__file-input"
        aria-label="Upload a key image"
      />
    </div>
  );
}