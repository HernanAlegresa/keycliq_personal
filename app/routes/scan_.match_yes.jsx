import { json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { getKeyById } from "../lib/keys.server.js";
import { Button } from "../components/ui/Button.jsx";
import { prisma } from "../utils/db.server.js";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button on match found
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

  // Get the latest KeyMatching for this user and key
  const latestMatching = await prisma.keyMatching.findFirst({
    where: {
      userId,
      matchedKeyId: keyId,
      matchType: 'MATCH_FOUND'
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return json({ 
    key,
    confidence: parseFloat(confidence) || 0,
    keyMatchingId: latestMatching?.id || null
  });
}

export default function ScanMatchFound() {
  const { key, confidence, keyMatchingId } = useLoaderData();
  const navigate = useNavigate();

  const confidencePercent = (confidence * 100).toFixed(1);
  const matchLevel = confidence >= 0.85 ? "High match" : "Good match";

  const handleOpenKeyDetails = () => {
    navigate(`/keys/${key.id}?from=/scan/match_yes`);
  };

  const handleScanAnotherKey = () => {
    navigate('/scan');
  };

  const handleDone = () => {
    navigate('/');
  };

  const handleViewAnalysis = () => {
    if (keyMatchingId) {
      navigate(`/scan/analysis?keyMatchingId=${keyMatchingId}`);
    } else {
      navigate(`/scan/analysis?keyId=${key.id}&confidence=${confidence}`);
    }
  };

  return (
    <div className="scan-match-found">
      {/* Main content */}
      <div className="scan-match-found__content">
        {/* Title and Success Icon */}
        <div className="scan-match-found__header">
          <h1 className="scan-match-found__title">Match Found</h1>
          <div className="scan-match-found__success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
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
            <div className="scan-match-found__match-badge">
              <div className="scan-match-found__match-dot"></div>
              <span className="scan-match-found__match-text">{matchLevel}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="scan-match-found__actions">
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleOpenKeyDetails}
            className="w-full py-3 rounded-2xl"
          >
            Open Key Details
          </Button>
          
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleScanAnotherKey}
            className="w-full py-3 rounded-2xl"
          >
            Scan Another Key
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleViewAnalysis}
            className="w-full py-3 rounded-2xl"
          >
            View Analysis
          </Button>
          
          <Button 
            variant="secondary" 
            size="large" 
            onClick={handleDone}
            className="w-full py-3 rounded-2xl"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
