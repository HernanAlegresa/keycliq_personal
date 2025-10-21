import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { getUserById } from "../utils/auth.server.js";

export const handle = {
  title: "Settings",
};

export async function loader({ request }) {
  try {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    
    if (!user) {
      throw new Response("User not found", { status: 404 });
    }
    
    return { user };
  } catch (error) {
    console.error("Error in settings loader:", error);
    throw new Response("Internal Server Error", { status: 500 });
  }
}

export default function Settings() {
  const { user } = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="settings-container">
      {/* Main Content */}
      <div className="settings-content">
        {/* User Profile Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">Account Information</h2>
          <div className="settings-info-grid">
            <div className="settings-info-item">
              <label className="settings-info-label">Email Address</label>
              <div className="settings-info-value">{user.email}</div>
            </div>
            <div className="settings-info-item">
              <label className="settings-info-label">Member Since</label>
              <div className="settings-info-value">{formatDate(user.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">Your Statistics</h2>
          <div className="settings-stats-single">
            <div className="settings-stat-item">
              <div className="settings-stat-number">{user._count?.keys || 0}</div>
              <div className="settings-stat-label">Keys in Inventory</div>
            </div>
          </div>
        </div>

        {/* Account Actions Section */}
        <div className="settings-section">
          <h2 className="settings-section-title">Account Actions</h2>
          <div className="settings-actions">
            <Form method="post" action="/logout">
              <button
                type="submit"
                className="settings-logout-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing Out..." : "Sign Out"}
              </button>
            </Form>
          </div>
        </div>

        {/* Legal Links Section */}
        <div className="settings-section settings-legal">
          <div className="settings-legal-links">
            <a 
              href="/privacy-policy" 
              className="settings-legal-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            <span className="settings-legal-separator">•</span>
            <a 
              href="/terms-of-use" 
              className="settings-legal-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
