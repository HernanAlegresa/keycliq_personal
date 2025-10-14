import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { json } from "@remix-run/node";
import { createPasswordResetToken } from "../utils/auth.server.js";
import wordmarkLogo from "../assets/KeyCliq_Wordmark_TwoTone_Dark.png";

export const handle = {
  hideFooter: true,
  title: "Forgot Password",
  showBackButton: true,
  backTo: "/signin",
};

export async function action({ request }) {
  const form = await request.formData();
  const email = String(form.get("email") || "").trim();

  // Validation
  const errors = {};
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    await createPasswordResetToken(email);
    return json({ 
      success: true, 
      message: "If an account exists with this email, a password reset link has been sent." 
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return json({ 
      errors: { general: "Something went wrong. Please try again later." } 
    }, { status: 500 });
  }
}

export default function ForgotPassword() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="auth-container">
      {/* Logo and Tagline */}
      <div className="auth-logo">
        <img src={wordmarkLogo} alt="KeyCliq logo" />
        <p className="auth-tagline">Your Digital Key Inventory</p>
      </div>

      {/* Form */}
      <Form method="post" className="auth-form">
        {actionData?.success ? (
          <div className="auth-success-message">
            {actionData.message}
          </div>
        ) : (
          <>
            <div className="auth-form-header">
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-subtitle">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

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

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-button auth-button--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>
          </>
        )}

        {/* Back to Sign In Link */}
        <div className="auth-secondary-link">
          <Link to="/signin">
            ← Back to Sign In
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
