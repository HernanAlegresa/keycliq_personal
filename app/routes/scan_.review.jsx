import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";
import { ImagePreview } from "../components/ui/ImagePreview.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'Scan a Key', 
  stepLabel: '2 of 2',
  showBackButton: true,
  backTo: '/scan'
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanReview() {
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageName, setImageName] = useState("");

  useEffect(() => {
    // Get the temporary image from sessionStorage
    const tempUrl = sessionStorage.getItem('tempKeyImage');
    const tempName = sessionStorage.getItem('tempKeyImageName');
    
    if (tempUrl) {
      setImageUrl(tempUrl);
      setImageName(tempName || "Uploaded image");
    } else {
      // For testing: set placeholder data if no image
      setImageName("Test image preview");
    }
  }, []);

  const handleContinue = () => {
    // Navigate to processing screen
    navigate('/scan/check');
  };

  const handleRetakePhoto = () => {
    // Clean up sessionStorage and go back to scan
    sessionStorage.removeItem('tempKeyImage');
    sessionStorage.removeItem('tempKeyImageDataURL');
    sessionStorage.removeItem('tempKeyImageName');
    
    // Revoke object URL to free memory
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    
    navigate('/scan');
  };

  return (
    <div className="scan-review">
      {/* Success banner */}
      <div className="scan-review__banner">
        <svg className="scan-review__banner-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="scan-review__banner-text">Your Key photo is saved</p>
      </div>

      {/* Main content */}
      <div className="scan-review__content">
        <ImagePreview 
          src={imageUrl} 
          alt={imageName || "Key preview"} 
        />
      </div>

      {/* Action buttons - matching scan step 1 style */}
      <div className="scan-review__actions">
        <Button 
          variant="primary" 
          size="large" 
          onClick={handleContinue}
          className="w-full py-3 rounded-2xl"
        >
          Continue
        </Button>
        
        <button
          type="button"
          onClick={handleRetakePhoto}
          className="scan-capture__secondary-button"
          aria-label="Retake photo"
        >
          Retake photo
        </button>
      </div>
    </div>
  );
}
