import { Form, Link, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { validatePasswordResetToken, resetPassword } from "../utils/auth.server.js";
import wordmarkLogo from "../assets/KeyCliq_Wordmark_TwoTone_Dark.png";

export const handle = {
  hideFooter: true,
  title: "Reset Password",
  showBackButton: true,
  backTo: "/signin",
};

export async function loader({ request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirect("/forgot-password?error=missing-token");
  }

  const user = await validatePasswordResetToken(token);
  if (!user) {
    return redirect("/forgot-password?error=invalid-token");
  }

  return json({ valid: true, email: user.email });
}

export async function action({ request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  
  if (!token) {
    return json({ 
      errors: { general: "Invalid reset link. Please request a new one." } 
    }, { status: 400 });
  }

  const form = await request.formData();
  const password = String(form.get("password") || "");
  const confirmPassword = String(form.get("confirmPassword") || "");

  // Validation
  const errors = {};
  if (!password) errors.password = "Password is required";
  else if (password.length < 8) errors.password = "Password must be at least 8 characters";
  else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number";
  }
  
  if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
  else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";

  if (Object.keys(errors).length > 0) {
    return json({ errors }, { status: 400 });
  }

  try {
    await resetPassword(token, password);
    return redirect("/signin?message=password-reset-success");
  } catch (error) {
    console.error("Password reset error:", error);
    return json({ 
      errors: { general: "Invalid or expired reset link. Please request a new one." } 
    }, { status: 400 });
  }
}

export default function ResetPassword() {
  const actionData = useActionData();
  const loaderData = useLoaderData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (!loaderData?.valid) {
    return (
      <div className="auth-container">
        <div className="auth-logo">
          <img src={wordmarkLogo} alt="KeyCliq logo" />
          <p className="auth-tagline">Your Digital Key Inventory</p>
        </div>
        <div className="auth-error-message">
          Invalid or expired reset link. Please request a new one.
        </div>
        <div className="auth-secondary-link">
          <Link to="/forgot-password">Request New Reset Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      {/* Logo and Tagline */}
      <div className="auth-logo">
        <img src={wordmarkLogo} alt="KeyCliq logo" />
        <p className="auth-tagline">Your Digital Key Inventory</p>
      </div>

      {/* Form */}
      <Form method="post" className="auth-form">
        <div className="auth-form-header">
          <h1 className="auth-title">Reset Your Password</h1>
          <p className="auth-subtitle">
            Enter your new password for <strong>{loaderData.email}</strong>
          </p>
        </div>

        {actionData?.errors?.general && (
          <div className="auth-error-message">
            {actionData.errors.general}
          </div>
        )}

        {/* Password Input */}
        <div className="auth-input-group">
          <label className="auth-input-label">New Password</label>
          <input
            name="password"
            type="password"
            placeholder="Enter your new password"
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

        {/* Confirm Password Input */}
        <div className="auth-input-group">
          <label className="auth-input-label">Confirm New Password</label>
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            required
            autoComplete="new-password"
            className={`auth-input ${actionData?.errors?.confirmPassword ? 'auth-input--error' : ''}`}
            onInvalid={(e) => {
              e.target.setCustomValidity('Please confirm your password');
            }}
            onInput={(e) => {
              e.target.setCustomValidity('');
            }}
          />
          {actionData?.errors?.confirmPassword && (
            <p className="auth-error">{actionData.errors.confirmPassword}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-button auth-button--primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>

        {/* Back to Sign In Link */}
        <div className="auth-secondary-link">
          <Link to="/signin">
            ← Back to Sign In
          </Link>
        </div>
      </Form>
    </div>
  );
}
