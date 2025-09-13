import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { requireUserId } from "../../utils/session.server.js";
import { Button } from "../../components/ui/Button.jsx";

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

  // Mock data - will be replaced with real scanned image later
  const scannedKey = {
    imageUrl: "/api/placeholder/200/150" // Placeholder for now - will be the actual scanned image
  };

  const handleSaveAsNewKey = () => {
    // Navigate to Key Details with a new key ID and empty form
    navigate('/MyKeys/keys/new-key?from=/Scan_Flow/scan/new');
  };

  const handleScanAnotherKey = () => {
    navigate('/Scan_Flow/scan');
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
              src={scannedKey.imageUrl} 
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
