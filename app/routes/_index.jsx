import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { requireUserId } from "../utils/session.server.js";
import { getRecentKeys } from "../lib/keys.server.js";
import { QuickAction } from "../components/ui/QuickAction.jsx";
import { RecentKeys } from "../components/ui/RecentKeys.jsx";

export async function loader({ request }) {
  // If not authenticated, send to welcome
  const userId = await requireUserId(request);
  
  // Get recent keys for the user
  const recentKeys = await getRecentKeys(userId, 2);
  
  return json({ recentKeys });
}

export default function Index() {
  const { recentKeys } = useLoaderData();
  
  return (
    <div className="homepage">
      {/* Quick Actions Section */}
      <div className="homepage__section">
        <h2 className="homepage__section-title">Quick Actions</h2>
        <div className="homepage__actions">
          <QuickAction
            title="Scan a Key"
            description="Scan a key to check if it's already in your inventory or save it as new."
            to="/scan"
            icon="camera"
            variant="primary"
          />
          
          <QuickAction
            title="Inventory"
            description="View and manage your saved keys."
            to="/keys"
            icon="search"
            variant="secondary"
          />
        </div>
      </div>

      {/* Recent Keys Section */}
      <RecentKeys keys={recentKeys} isEmpty={recentKeys.length === 0} />
    </div>
  );
}