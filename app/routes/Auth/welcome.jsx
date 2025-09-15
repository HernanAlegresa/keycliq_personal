import { Link, useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { getSession } from "../../utils/session.server.js";
import logo from "../../assets/Logo KeyCliq (1).png";

export const handle = {
  hideHeader: true,
  hideFooter: true,
};

export async function loader({ request }) {
  // If already authenticated, redirect to home
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (userId) return redirect("/");
  return json({});
}

export default function Welcome() {
  return (
    <div className="welcome-container">
      {/* Logo and Tagline Section */}
      <div className="welcome-logo">
        <img 
          src={logo} 
          alt="KeyCliq logo" 
        />
        <p className="welcome-tagline">
          Your Digital Key Inventory
        </p>
      </div>

      {/* Action Buttons Section */}
      <div className="welcome-buttons">
        <Link 
          to="/Auth/signin" 
          className="welcome-button welcome-button--primary"
        >
          Sign In
        </Link>
        
        <Link 
          to="/Auth/signup" 
          className="welcome-button welcome-button--secondary"
        >
          Create Account
        </Link>
      </div>

      {/* Legal Text Section */}
      <div className="welcome-legal">
        <p className="welcome-legal-text">
          By continuing, you agree to our{" "}
          <Link 
            to="/terms" 
            className="welcome-legal-link"
          >
            Terms
          </Link>
          {" "}and{" "}
          <Link 
            to="/privacy" 
            className="welcome-legal-link"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
