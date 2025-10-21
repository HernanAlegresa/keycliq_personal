import { Link } from "@remix-run/react";
import { json } from "@remix-run/node";

export const handle = {
  hideFooter: true,
  title: "Privacy Policy - KeyCliq",
};

export async function loader() {
  return json({});
}

export default function PrivacyPolicy() {
  return (
    <div className="legal-container">
      <div className="legal-content">
        {/* Header */}
        <div className="legal-header">
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-subtitle">
            KeyCliq AI Key Identification Inc.
          </p>
          <div className="legal-dates">
            <span><strong>Effective Date:</strong> October 20, 2025</span>
            <span><strong>Updated:</strong> October 20, 2025</span>
          </div>
        </div>

        {/* Content */}
        <div className="legal-body">
          <p>
            KeyCliq AI Key Identification Inc. ("KeyCliq", "we", "our," or "us") is committed to protecting 
            the privacy and security of our users and their proprietary information. This Privacy Policy 
            explains how we collect, use, store, and protect information when you access or use our web-based 
            application designed for property managers to organize and manage physical keys (the "Service").
          </p>

          <p>
            By using KeyCliq, you agree to the terms of our Privacy Policy.
          </p>

          {/* Section 1 */}
          <section className="legal-section">
            <h2>Information We Collect</h2>
            <p>
              We collect and store only the information necessary to operate, improve, and support the Service. 
              This may include:
            </p>

            <h3>1.1 Account Information</h3>
            <ul>
              <li>First and last name</li>
              <li>Email address</li>
              <li>Organization or company name</li>
              <li>User role</li>
            </ul>

            <h3>1.2 Key and Property Information</h3>
            <ul>
              <li>Key names, labels, associated notes, and optional metadata</li>
              <li>Property/unit identifiers you provide</li>
            </ul>

            <h3>1.3 Usage Data (Automatic)</h3>
            <ul>
              <li>IP address</li>
              <li>Browser type and device information</li>
              <li>Log and activity data related to application use (for security, diagnostics, and product improvement)</li>
            </ul>

            <h3>1.4 Optional Submissions</h3>
            <ul>
              <li>Support messages, feature requests, or feedback you voluntarily submit</li>
            </ul>

            <p>
              We do not collect financial information, payment data, or unnecessary personally identifiable 
              information (PII).
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2>How We Use Information</h2>
            <p>We use collected data only to:</p>
            <ul>
              <li>Provide and maintain the Service</li>
              <li>Authenticate users and manage accounts</li>
              <li>Improve app functionality and user experience</li>
              <li>Respond to support requests</li>
              <li>Maintain security and prevent misuse</li>
              <li>Generate anonymized, aggregated usage analytics (non-identifiable)</li>
            </ul>
            <p>
              We do not sell or rent user data and do not use data for advertising purposes.
            </p>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2>Data Security</h2>
            <p>
              The KeyCliq platform, hosted on Heroku, is designed with multiple layers of security to protect 
              user data:
            </p>

            <h3>Data Protection</h3>
            <ul>
              <li>Sensitive data is encrypted in transit (TLS 1.2+) and at rest (AES-256).</li>
              <li>Personally identifiable information is minimized and stored only when required.</li>
            </ul>

            <h3>Access Controls</h3>
            <ul>
              <li>Role-based access controls limit data visibility to authorized users.</li>
              <li>Tenant isolation prevents cross-organization data exposure.</li>
            </ul>

            <h3>Encryption & Secrets Management</h3>
            <ul>
              <li>Application secrets and database credentials are securely stored via Heroku-managed configuration and secret storage.</li>
              <li>Regular key and credential rotation is enforced.</li>
            </ul>

            <h3>Backups & Reliability</h3>
            <ul>
              <li>Automated database backups with point-in-time recovery</li>
              <li>Redundant storage for media files with retention policies</li>
            </ul>

            <h3>Monitoring & Compliance</h3>
            <ul>
              <li>Hosting on Heroku leverages compliance frameworks such as SOC 2, ISO 27001, and GDPR-ready infrastructure.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2>User Authentication & Password Responsibilities</h2>
            <p>
              Users are responsible for maintaining the confidentiality of their login credentials and for 
              all activity that occurs under their account. You agree to:
            </p>
            <ul>
              <li>Use strong, unique passwords and update them periodically</li>
              <li>Not share login credentials with unauthorized individuals</li>
              <li>Notify us immediately if you suspect unauthorized access</li>
              <li>Remove access for former users who no longer require it</li>
            </ul>
            <p>
              We are not liable for unauthorized access resulting from weak passwords, credential sharing, 
              phishing attacks, or user failure to secure authentication methods.
            </p>
          </section>

          {/* Section 5 */}
          <section className="legal-section">
            <h2>Data Sharing and Third Parties</h2>
            <p>We only share data with:</p>
            <ul>
              <li>Essential infrastructure or service providers (e.g., hosting, email, and monitoring tools)</li>
              <li>Legal authorities, if required by applicable law</li>
            </ul>
            <p>
              We do not share data with advertisers, data brokers, or unrelated third parties.
            </p>
          </section>

          {/* Section 6 */}
          <section className="legal-section">
            <h2>Data Retention</h2>
            <p>
              We retain user data only for as long as needed to deliver the Service. Upon account deletion, 
              data is removed or anonymized except where limited retention is required for legal, security, 
              or disaster-recovery backup purposes.
            </p>
          </section>

          {/* Section 7 */}
          <section className="legal-section">
            <h2>User Rights</h2>
            <p>Users may request:</p>
            <ul>
              <li>Access to their data</li>
              <li>Correction of inaccurate data</li>
              <li>Deletion of stored data and account closure</li>
              <li>Export of data in a commonly used format</li>
            </ul>
            <p>
              Requests can be made via:{" "}
              <a href="mailto:brittany@keycliq.com" className="legal-link">
                brittany@keycliq.com
              </a>
            </p>
          </section>

          {/* Section 8 */}
          <section className="legal-section">
            <h2>Cookies</h2>
            <p>
              We use essential cookies for authentication, security, and app functionality. We do not use 
              tracking or advertising cookies.
            </p>
          </section>

          {/* Section 9 */}
          <section className="legal-section">
            <h2>Do Not Track (DNT) Disclosure</h2>
            <p>
              Some browsers offer a "Do Not Track" (DNT) setting that signals a preference not to be tracked. 
              Because there is currently no industry standard for recognizing or responding to DNT signals, 
              our Service does not respond to DNT requests at this time.
            </p>
            <p>
              We limit tracking to essential, non-advertising purposes only.
            </p>
          </section>

          {/* Section 10 */}
          <section className="legal-section">
            <h2>Children's Privacy</h2>
            <p>
              The Service is not intended for children under 16. We do not knowingly collect data from minors.
            </p>
          </section>

          {/* Section 11 */}
          <section className="legal-section">
            <h2>International Storage</h2>
            <p>
              Data may be stored in regions supported by our hosting provider. By using the Service, you 
              consent to data transfer and storage in such regions, protected under industry-standard 
              encryption and compliance frameworks.
            </p>
          </section>

          {/* Section 12 */}
          <section className="legal-section">
            <h2>Policy Updates</h2>
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated in-app 
              or by email notification.
            </p>
          </section>

          {/* Section 13 */}
          <section className="legal-section">
            <h2>Contact Information</h2>
            <p>
              For privacy questions or data requests, contact us at:
            </p>
            <p>
              <a href="mailto:brittany@keycliq.com" className="legal-link">
                brittany@keycliq.com
              </a>
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="legal-footer">
          <Link to="/" className="legal-back-link">
            ← Back to Home
          </Link>
          <Link to="/terms-of-use" className="legal-related-link">
            View Terms of Use
          </Link>
        </div>
      </div>
    </div>
  );
}

