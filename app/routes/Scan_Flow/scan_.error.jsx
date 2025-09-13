import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { requireUserId } from "../../utils/session.server.js";
import { Button } from "../../components/ui/Button.jsx";

export const handle = { 
  hideFooter: false, 
  title: 'KeyCliq', 
  showBackButton: false
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanError() {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/Scan_Flow/scan/new');
  };

  return (
    <div className="scan-error">
      {/* Main content */}
      <div className="scan-error__content">
        {/* Error Icon */}
        <div className="scan-error__icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="scan-error__title">Could not save your key</h1>
        
        {/* Subcopy */}
        <p className="scan-error__subcopy">
          There was a validation error.
        </p>

        {/* Action Button */}
        <div className="scan-error__actions">
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleRetry}
            className="w-full py-3 rounded-2xl"
          >
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}