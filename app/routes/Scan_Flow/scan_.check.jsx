import { json } from "@remix-run/node";
import { requireUserId } from "../utils/session.server.js";

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
      </div>
    </div>
  );
}
