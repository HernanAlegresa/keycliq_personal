import { Link } from "@remix-run/react";
import { json } from "@remix-run/node";

export const handle = {
  hideFooter: true,
  title: "Terms of Use - KeyCliq",
};

export async function loader() {
  return json({});
}

export default function TermsOfUse() {
  return (
    <div className="legal-container">
      <div className="legal-content">
        {/* Header */}
        <div className="legal-header">
          <h1 className="legal-title">Terms of Use</h1>
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
            These Terms of Use ("Terms") govern your access to and use of the KeyCliq web-based application 
            and related services (the "Service"), owned by KeyCliq AI Key Identification Inc. ("KeyCliq", 
            "we", "our," or "us"). By accessing or using KeyCliq, you indicate that you have read and 
            understand these Terms of Use and agree to abide by them at all times.
          </p>

          {/* Section 1 */}
          <section className="legal-section">
            <h2>Eligibility and Accounts</h2>
            <p>
              You must be at least 18 years old and have the authority to enter into these Terms to use the 
              Service. You agree to the following:
            </p>
            <ul>
              <li>Your account and the security and privacy of your account, including passwords or sensitive information attached to that account; and</li>
              <li>All personal information you provide to us through your account is up to date, accurate, and truthful and that you will update your personal information if it changes.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts for violations of these Terms or misuse 
              of the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section className="legal-section">
            <h2>Acceptable Use</h2>
            <p>
              You agree not to use the Service for any unlawful, abusive, harmful, or unauthorized purposes. 
              Prohibited actions include, but are not limited to:
            </p>
            <ul>
              <li>Attempting to gain unauthorized access to other user accounts, data, or systems</li>
              <li>Reverse engineering, decompiling, or modifying the platform</li>
              <li>Uploading malicious code, viruses, or scripts</li>
              <li>Using the Service in a manner that violates applicable laws or regulations</li>
              <li>Sharing login credentials with unauthorized users or providing false information</li>
            </ul>
            <p>
              We may suspend or restrict your access if we believe activity on your account violates these 
              Terms or threatens the security or integrity of the Service.
            </p>
          </section>

          {/* Section 3 */}
          <section className="legal-section">
            <h2>User Data and Content</h2>
            <p>
              You own and retain all rights to the data you upload into the Service ("User Content"). By 
              using KeyCliq, you grant us a limited, non-exclusive license to store, process, and transmit 
              User Content solely for the purpose of operating and improving the Service.
            </p>
            <p>
              You are responsible for the accuracy, legality, and integrity of the data you submit.
            </p>
            <p>
              Our use and handling of data is governed by our{" "}
              <Link to="/privacy-policy" className="legal-link">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          {/* Section 4 */}
          <section className="legal-section">
            <h2>Service Availability and Changes</h2>
            <p>
              We aim to provide a reliable Service but do not guarantee uninterrupted or error-free operation. 
              We may:
            </p>
            <ul>
              <li>Update, modify, or improve features</li>
              <li>Perform maintenance</li>
              <li>Limit or discontinue parts of the Service (with notice when reasonable)</li>
            </ul>
            <p>
              Your continued use after updates constitutes acceptance of any changes.
            </p>
          </section>

          {/* Section 5 */}
          <section className="legal-section">
            <h2>Third-Party Services</h2>
            <p>
              The Service may rely on third-party providers (e.g., hosting, infrastructure, email services). 
              We are not responsible for the availability, performance, or actions of third-party services, 
              though we take steps to work only with reputable providers.
            </p>
          </section>

          {/* Section 6 */}
          <section className="legal-section">
            <h2>Disclaimers</h2>
            <ul>
              <li>
                The Service is provided "as is" and "as available" without warranties of any kind, including 
                implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </li>
              <li>
                We do not guarantee that:
                <ul>
                  <li>The Service will be error-free or secure</li>
                  <li>Data will not be lost (though safeguards are in place)</li>
                  <li>The Service will meet every organizational requirement</li>
                </ul>
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="legal-section">
            <h2>Limitation of Liability</h2>
            <p>
              KeyCliq AI Key Identification Inc. and our directors, officers, agents, employees, subsidiaries, 
              and affiliates will not be liable for any claims, losses, damages, liabilities and expenses 
              including legal fees from your use of the Service.
            </p>
          </section>

          {/* Section 8 */}
          <section className="legal-section">
            <h2>Indemnity</h2>
            <p>
              Except where required by law, by using the Service you indemnify and hold harmless KeyCliq AI 
              Key Identification Inc. and our directors, officers, agents, employees, subsidiaries, and 
              affiliates from any actions, claims, losses, damages, liabilities and expenses including legal 
              fees arising out of your use of our Service or your violation of these Terms of Use.
            </p>
          </section>

          {/* Section 9 */}
          <section className="legal-section">
            <h2>Applicable Law</h2>
            <p>
              These Terms of Use are governed by the laws of the Province of Ontario.
            </p>
          </section>

          {/* Section 10 */}
          <section className="legal-section">
            <h2>Severability</h2>
            <p>
              If any time the provisions set forth in these Terms of Use are found to be inconsistent or 
              invalid under applicable laws, those provisions will be deemed void and will be removed from 
              these Terms of Use. All other provisions will not be affected by the removal and the rest of 
              the Terms of Use will still be considered valid.
            </p>
          </section>

          {/* Section 11 */}
          <section className="legal-section">
            <h2>Changes</h2>
            <p>
              These Terms of Use may be amended from time to time in order to maintain compliance with the 
              law and to reflect any changes to the way we operate our Services and the way we expect users 
              to behave on our platforms. We will notify users by email of changes to these Terms of Use.
            </p>
          </section>

          {/* Section 12 */}
          <section className="legal-section">
            <h2>Contact Details</h2>
            <p>
              Please contact us if you have any questions or concerns. Our contact details are as follows:
            </p>
            <p>
              <a href="mailto:brittany@keycliq.com" className="legal-link">
                brittany@keycliq.com
              </a>
              <br />
              4605 Crysler Ave. Unit 4 Niagara Falls Ontario Canada L2E3V6
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="legal-footer">
          <Link to="/" className="legal-back-link">
            ← Back to Home
          </Link>
          <Link to="/privacy-policy" className="legal-related-link">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

