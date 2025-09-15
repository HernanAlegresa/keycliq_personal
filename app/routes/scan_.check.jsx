import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { Button } from "../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false  // No back button during processing
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanProcessing() {
  const navigate = useNavigate();

  // Temporary testing navigation functions
  const goToMatchFound = () => {
    navigate('/scan/match_yes');
  };

  const goToNoMatch = () => {
    navigate('/scan/new');
  };

  return (
    <div className="scan-processing">
      {/* Main content */}
      <div className="scan-processing__content">
        {/* Title */}
        <h1 className="scan-processing__title">Processing your key</h1>
        
        {/* Loading Spinner */}
        <div className="scan-processing__spinner">
          <div className="scan-processing__spinner-circle">
            <div className="scan-processing__spinner-progress"></div>
          </div>
        </div>
        
        {/* Processing Steps */}
        <div className="scan-processing__steps">
          <p className="scan-processing__step">Extracting contours and properties...</p>
          <p className="scan-processing__step">Checking against your inventory...</p>
          <p className="scan-processing__step">This may take a few seconds.</p>
        </div>

        {/* TEMPORARY TESTING BUTTONS - Remove when AI logic is implemented */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '40px auto 0' }}>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            🧪 <strong>TEMP TESTING BUTTONS</strong> (Remove when AI is ready)
          </p>
          
          <Button
            variant="primary"
            size="medium"
            onClick={goToMatchFound}
            className="w-full"
          >
            ✅ Simulate Match Found
          </Button>
          
          <Button
            variant="secondary"
            size="medium"
            onClick={goToNoMatch}
            className="w-full"
          >
            ❌ Simulate No Match
          </Button>
        </div>
      </div>
    </div>
  );
}
