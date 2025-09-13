import { json } from "@remix-run/node";
import { useNavigate } from "@remix-run/react";
import { requireUserId } from "../../utils/session.server.js";
import { Button } from "../../components/ui/Button.jsx";

export const handle = { 
  hideFooter: true, 
  title: 'KeyCliq', 
  showBackButton: false
};

export async function loader({ request }) {
  await requireUserId(request);
  return json({});
}

export default function ScanInvalidPhoto() {
  const navigate = useNavigate();

  const handleRetakePhoto = () => {
    // Navigate back to scan step 1
    navigate('/Scan_Flow/scan');
  };

  return (
    <div className="scan-invalid">
      {/* Main content */}
      <div className="scan-invalid__content">
        {/* Invalid Key Image */}
        <div className="scan-invalid__image-container">
          <img
            src="https://imgur.com/3AympjL.jpg"
            alt="Invalid key photo"
            className="scan-invalid__image"
          />
        </div>

        {/* Message and Action */}
        <div className="scan-invalid__message-section">
          <p className="scan-invalid__message">
            Make sure the key is fully visible and well lit.
          </p>
          
          <Button 
            variant="primary" 
            size="large" 
            onClick={handleRetakePhoto}
            className="scan-invalid__retake-button"
          >
            Retake
          </Button>
        </div>
      </div>
    </div>
  );
}
