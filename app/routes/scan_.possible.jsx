import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { getKeyById } from "../lib/keys.server.js";
import { Button } from "../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button on possible match
};

export async function loader({ request }) {
  const userId = await requireUserId(request);
  const url = new URL(request.url);
  const keyId = url.searchParams.get('keyId');
  const confidence = url.searchParams.get('confidence');

  if (!keyId) {
    return redirect('/scan');
  }

  const key = await getKeyById(keyId, userId);
  
  if (!key) {
    return redirect('/scan');
  }

  return json({ 
    key,
    confidence: parseFloat(confidence) || 0
  });
}

export default function ScanPossibleMatch() {
  const { key, confidence } = useLoaderData();
  const navigate = useNavigate();

  const handleConfirmMatch = () => {
    // El usuario confirma que es esta llave
    navigate(`/keys/${key.id}?from=/scan/possible&confirmed=true`);
  };

  const handleTryAgain = () => {
    // El usuario dice que no es esta llave, volver a scan
    navigate('/scan');
  };

  const handleAddAsNew = () => {
    // El usuario quiere agregar como nueva llave
    navigate('/scan/new');
  };

  const confidencePercent = (confidence * 100).toFixed(1);

  return (
    <div className="scan-match-found">
      {/* Main content */}
      <div className="scan-match-found__content">
        {/* Title and Possible Match Icon */}
        <div className="scan-match-found__header">
          <h1 className="scan-match-found__title">Possible Match</h1>
          <div className="scan-match-found__success-icon" style={{ backgroundColor: '#f59e0b' }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="scan-match-found__message" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: '1.5' }}>
            We found a key that might match. 
            Is this the key you scanned?
          </p>
        </div>

        {/* Key Card */}
        <div className="scan-match-found__key-card">
          {/* Key Image */}
          <div className="scan-match-found__key-image">
            <img 
              src={key.imageUrl || "/api/placeholder/200x150"} 
              alt={key.name}
              className="scan-match-found__key-img"
            />
          </div>
          
          {/* Key Details */}
          <div className="scan-match-found__key-details">
            <h2 className="scan-match-found__key-name">{key.name}</h2>
            {key.description && (
              <p className="scan-match-found__key-address">{key.description}</p>
            )}
            {key.unit && (
              <p className="scan-match-found__key-address">Unit: {key.unit}</p>
            )}
            {key.door && (
              <p className="scan-match-found__key-address">Door: {key.door}</p>
            )}
            
            {/* Match Level Badge */}
            <div className="scan-match-found__match-badge" style={{ backgroundColor: '#fef3c7' }}>
              <div className="scan-match-found__match-dot" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="scan-match-found__match-text" style={{ color: '#92400e' }}>
                Possible match
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="scan-match-found__actions">
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleConfirmMatch}
            className="w-full py-3 rounded-2xl"
          >
            Yes, It's This Key
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleAddAsNew}
            className="w-full py-3 rounded-2xl"
          >
            No, Save as New Key
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleTryAgain}
            className="w-full py-3 rounded-2xl"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}


