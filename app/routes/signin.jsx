import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { verifyLogin } from "../utils/auth.server.js";
import { createUserSession, getSession } from "../utils/session.server.js";
import logo from "../assets/Logo KeyCliq (1).png";

export const handle = {
  hideFooter: true,
  title: "Sign In",
  showBackButton: true,
  backTo: "/welcome",
};

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  // Validation
  const errors = {};
  if (!email) errors.email = "Email is required";
  if (!password) errors.password = "Password is required";

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  const user = await verifyLogin(email, password);
  if (!user) {
    return json({ errors: { general: "Invalid email or password" } }, { status: 400 });
  }

  return createUserSession(user.id, "/");
}

export default function SignIn() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="auth-container">
      {/* Logo and Tagline - Same as Welcome */}
      <div className="auth-logo">
        <img src={logo} alt="KeyCliq logo" />
        <p className="auth-tagline">Your Digital Key Inventory</p>
      </div>

      {/* Form */}
      <Form method="post" className="auth-form">
        {actionData?.errors?.general && (
          <div className="auth-error-message">
            {actionData.errors.general}
          </div>
        )}

        {/* Email Input */}
        <div className="auth-input-group">
          <label className="auth-input-label">Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            className={`auth-input ${actionData?.errors?.email ? 'auth-input--error' : ''}`}
          />
          {actionData?.errors?.email && (
            <p className="auth-error">{actionData.errors.email}</p>
          )}
        </div>

        {/* Password Input */}
        <div className="auth-input-group">
          <label className="auth-input-label">Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            className={`auth-input ${actionData?.errors?.password ? 'auth-input--error' : ''}`}
          />
          {actionData?.errors?.password && (
            <p className="auth-error">{actionData.errors.password}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-button auth-button--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing In..." : "Continue"}
        </button>

        {/* Forgot Password Link */}
        <div className="auth-secondary-link">
          <Link to="/forgot-password">
            Forgot password?
          </Link>
        </div>
      </Form>

      {/* Footer Link */}
      <div className="auth-footer">
        <p className="auth-footer-text">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-footer-link">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
