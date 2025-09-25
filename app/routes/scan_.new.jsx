import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button on no match found
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanNoMatch() {
  const navigate = useNavigate();
  const [scannedImageUrl, setScannedImageUrl] = useState("/api/placeholder/200/150");

  useEffect(() => {
    // Get the scanned image from sessionStorage
    const tempUrl = sessionStorage.getItem('tempKeyImage');
    if (tempUrl) {
      setScannedImageUrl(tempUrl);
    }
  }, []);

  const handleSaveAsNewKey = async () => {
    try {
      // Get the data URL from sessionStorage
      const dataURL = sessionStorage.getItem('tempKeyImageDataURL');
      
      if (dataURL && dataURL.startsWith('data:')) {
        // Convert to permanent image via API
        const response = await fetch('/api/convert-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageUrl: dataURL }),
        });
        
        if (response.ok) {
          const { permanentUrl } = await response.json();
          navigate(`/keys/new-key?from=/scan/new&image=${encodeURIComponent(permanentUrl)}`);
        } else {
          // Fallback to placeholder
          navigate(`/keys/new-key?from=/scan/new&image=${encodeURIComponent('/api/placeholder/200/150')}`);
        }
      } else {
        // No data URL available, use placeholder
        navigate(`/keys/new-key?from=/scan/new&image=${encodeURIComponent('/api/placeholder/200/150')}`);
      }
    } catch (error) {
      console.error('Error converting image:', error);
      // Fallback to placeholder
      navigate(`/keys/new-key?from=/scan/new&image=${encodeURIComponent('/api/placeholder/200/150')}`);
    }
  };

  const handleScanAnotherKey = () => {
    navigate('/scan');
  };

  return (
    <div className="scan-no-match">
      {/* Main content */}
      <div className="scan-no-match__content">
        {/* Title and No Match Icon */}
        <div className="scan-no-match__header">
          <h1 className="scan-no-match__title">No Match Found</h1>
          <div className="scan-no-match__no-match-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Key Card */}
        <div className="scan-no-match__key-card">
          {/* Key Image */}
          <div className="scan-no-match__key-image">
            <img 
              src={scannedImageUrl} 
              alt="Scanned key"
              className="scan-no-match__key-img"
            />
          </div>
          
          {/* Key Details */}
          <div className="scan-no-match__key-details">
            {/* No Match Badge */}
            <div className="scan-no-match__no-match-badge">
              <div className="scan-no-match__no-match-dot"></div>
              <span className="scan-no-match__no-match-text">No Match</span>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="scan-no-match__message">
          <p className="scan-no-match__message-text">
            This key doesn't match any in your inventory. You can save it as a new key to add it to your collection.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="scan-no-match__actions">
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleSaveAsNewKey}
            className="w-full py-3 rounded-2xl"
          >
            Save as New Key
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleScanAnotherKey}
            className="w-full py-3 rounded-2xl"
          >
            Scan Another Key
          </Button>
        </div>
      </div>
    </div>
  );
}
