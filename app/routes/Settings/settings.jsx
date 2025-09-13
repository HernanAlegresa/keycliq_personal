import { Form, useNavigation } from "@remix-run/react";
import { requireUserId } from "../../utils/session.server.js";

export const handle = {
  title: "Settings",
};

export async function loader({ request }) {
  await requireUserId(request);
  return null;
}

export default function Settings() {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="settings-container">
      {/* Main Content */}
      <div className="settings-content">
        <Form method="post" action="/Auth/logout">
          <button
            type="submit"
            className="settings-logout-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing Out..." : "Log Out"}
          </button>
        </Form>
      </div>
    </div>
  );
}
