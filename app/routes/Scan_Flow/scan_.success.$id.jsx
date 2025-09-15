import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { requireUserId } from "../../utils/session.server.js";
import { Button } from "../../components/ui/Button.jsx";

export const handle = { 
  hideFooter: false, 
  title: 'KeyCliq', 
  showBackButton: false
};

export async function loader({ request, params }) {
  await requireUserId(request);
  return json({ keyId: params.id });
}

export default function ScanSuccess() {
  const navigate = useNavigate();

  const handleScanAnotherKey = () => {
    navigate('/Scan_Flow/scan');
  };

  return (
    <div className="scan-success">
      {/* Main content */}
      <div className="scan-success__content">
        {/* Success Icon */}
        <div className="scan-success__icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="scan-success__title">Key saved successfully</h1>
        
        {/* Subcopy */}
        <p className="scan-success__subcopy">
          You can now identify this key by scanning it or viewing its details in your key inventory anytime.
        </p>

        {/* Action Button */}
        <div className="scan-success__actions">
          <Button 
            variant="primary" 
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