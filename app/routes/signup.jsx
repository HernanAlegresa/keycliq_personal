import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { register } from "../utils/auth.server.js";
import { createUserSession, getSession } from "../utils/session.server.js";
import wordmarkLogo from "../assets/KeyCliq_Wordmark_TwoTone_Dark.png";

export const handle = {
  hideFooter: true,
  title: "Create Account",
  showBackButton: true,
  backTo: "/welcome",
};

export async function loader({ request }) {
  const session = await getSession(request.headers.get("Cookie"), request);
  const userId = session.get("userId");
  if (userId) return redirect("/");
  return json({});
}

export async function action({ request }) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const agreeToTerms = form.get("agreeToTerms") === "on";

  // Validation
  const errors = {};
  if (!email) errors.email = "Email is required";
  if (!password) errors.password = "Password is required";
  if (password.length < 6) errors.password = "Password must be at least 6 characters";
  if (!agreeToTerms) errors.agreeToTerms = "You must agree to the terms and privacy policy";

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    const user = await register(email, password);
    return createUserSession(user.id, "/", request);
  } catch (error) {
    if (error.code === "P2002") {
      return json({ errors: { email: "Email already exists" } }, { status: 400 });
    }
    return json({ errors: { general: "Something went wrong. Please try again." } }, { status: 500 });
  }
}

export default function SignUp() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="auth-container">
      {/* Logo and Tagline - Same as Welcome */}
      <div className="auth-logo">
        <img src={wordmarkLogo} alt="KeyCliq logo" />
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

        {/* Email Input */}
        <div className="auth-input-group">
          <label className="auth-input-label">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            autoComplete="email"
            className={`auth-input ${actionData?.errors?.email ? 'auth-input--error' : ''}`}
            onInvalid={(e) => {
              if (e.target.validity.valueMissing) {
                e.target.setCustomValidity('Please enter an email address');
              } else if (e.target.validity.typeMismatch) {
                e.target.setCustomValidity('Please enter a valid email address');
              } else {
                e.target.setCustomValidity('Please enter a valid email address');
              }
            }}
            onInput={(e) => {
              e.target.setCustomValidity('');
            }}
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
            placeholder="Password"
            required
            autoComplete="new-password"
            className={`auth-input ${actionData?.errors?.password ? 'auth-input--error' : ''}`}
            onInvalid={(e) => {
              e.target.setCustomValidity('Password is required');
            }}
            onInput={(e) => {
              e.target.setCustomValidity('');
            }}
          />
          {actionData?.errors?.password && (
            <p className="auth-error">{actionData.errors.password}</p>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className="auth-checkbox-group">
          <input
            type="checkbox"
            name="agreeToTerms"
            id="agreeToTerms"
            className="auth-checkbox"
            required
            onInvalid={(e) => {
              e.target.setCustomValidity('Please agree to the terms and privacy policy to continue');
            }}
            onInput={(e) => {
              e.target.setCustomValidity('');
            }}
          />
          <label htmlFor="agreeToTerms" className="auth-checkbox-label">
            I agree to{" "}
            <Link to="/terms" className="auth-checkbox-link">
              Terms
            </Link>
            {" "}and{" "}
            <Link to="/privacy" className="auth-checkbox-link">
              Privacy Policy
            </Link>
          </label>
        </div>
        {actionData?.errors?.agreeToTerms && (
          <p className="auth-error">{actionData.errors.agreeToTerms}</p>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-button auth-button--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>
      </Form>

      {/* Footer Link */}
      <div className="auth-footer">
        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/signin" className="auth-footer-link">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
