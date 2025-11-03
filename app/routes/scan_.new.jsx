import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { useEffect, useState } from "react";
import { requireUserId, getSession, commitSession } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button on no match found
};

export async function loader({ request }) {
  await requireUserId(request);
  
  const session = await getSession(request.headers.get('Cookie'));
  const scanMessage = session.get('scanMessage');
  
  // Clear flash messages after reading
  const headers = {
    'Set-Cookie': await commitSession(session)
  };
  
  return json({ 
    scanMessage: scanMessage || null
  }, { headers });
}

export default function ScanNoMatch() {
  const { scanMessage } = useLoaderData();
  const navigate = useNavigate();
  const [scannedImageUrl, setScannedImageUrl] = useState("/api/placeholder/200x150");

  useEffect(() => {
    // Get the scanned image from sessionStorage
    const tempUrl = sessionStorage.getItem('tempKeyImage');
    if (tempUrl) {
      setScannedImageUrl(tempUrl);
    }
  }, []);

  const handleSaveAsNewKey = async () => {
    try {
      // Navigate to new key form - signature will be retrieved from sessionStorage
      navigate(`/keys/new-key?from=/scan/new`);
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback to new key page without image
      navigate(`/keys/new-key?from=/scan/new`);
    }
  };
  
  const isFirstKey = scanMessage?.includes('first key');

  const handleScanAnotherKey = () => {
    navigate('/scan');
  };

  return (
    <div className="scan-no-match">
      {/* Main content */}
      <div className="scan-no-match__content">
        {/* Title and No Match Icon */}
        <div className="scan-no-match__header">
          <h1 className="scan-no-match__title">{isFirstKey ? 'Add Your First Key' : 'No Match Found'}</h1>
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
        </div>

        {/* Message */}
        <div className="scan-no-match__message">
          <p className="scan-no-match__message-text">
            {isFirstKey 
              ? "Let's add this key to your inventory. Give it a name and description to help you remember it."
              : "This key doesn't match any in your inventory. You can save it as a new key to add it to your collection."
            }
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
