import { redirect } from "@remix-run/node";
import { requireUserId } from "../../utils/session.server.js";
import { QuickAction } from "../../components/ui/QuickAction.jsx";
import { RecentKeys } from "../../components/ui/RecentKeys.jsx";

export async function loader({ request }) {
  // If not authenticated, send to welcome
  try {
    await requireUserId(request);
  } catch {
    return redirect("/Auth/welcome");
  }
  return null;
}

export default function Index() {
  return (
    <div className="homepage">
      {/* Quick Actions Section */}
      <div className="homepage__section">
        <h2 className="homepage__section-title">Quick Actions</h2>
        <div className="homepage__actions">
          <QuickAction
            title="Scan a Key"
            description="Scan a key to check if it's already in your inventory or save it as new."
            to="/Scan_Flow/scan"
            icon="camera"
            variant="primary"
          />
          
          <QuickAction
            title="Inventory"
            description="View and manage your saved keys."
            to="/MyKeys/keys"
            icon="search"
            variant="secondary"
          />
        </div>
      </div>

      {/* Recent Keys Section */}
      <RecentKeys isEmpty={true} />
    </div>
  );
}