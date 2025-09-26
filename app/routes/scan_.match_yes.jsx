import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button on match found
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanMatchFound() {
  const navigate = useNavigate();

  // Mock data - will be replaced with real data later
  const matchedKey = {
    id: "key-123",
    name: "Front Door Key",
    address: "12 Main St.",
    matchLevel: "High match",
    imageUrl: "/api/placeholder/200x150" // Placeholder for now
  };

  const handleOpenKeyDetails = () => {
    navigate(`/keys/${matchedKey.id}?from=/scan/match_yes`);
  };

  const handleScanAnotherKey = () => {
    navigate('/scan');
  };

  const handleDone = () => {
    navigate('/');
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
              src={matchedKey.imageUrl} 
              alt={matchedKey.name}
              className="scan-match-found__key-img"
            />
          </div>
          
          {/* Key Details */}
          <div className="scan-match-found__key-details">
            <h2 className="scan-match-found__key-name">{matchedKey.name}</h2>
            <p className="scan-match-found__key-address">{matchedKey.address}</p>
            
            {/* Match Level Badge */}
            <div className="scan-match-found__match-badge">
              <div className="scan-match-found__match-dot"></div>
              <span className="scan-match-found__match-text">{matchedKey.matchLevel}</span>
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
