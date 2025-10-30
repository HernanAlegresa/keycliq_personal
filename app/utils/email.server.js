import { Resend } from 'resend';

// Lazy initialization to prevent crashes if key is missing
let resend;
function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ No email API key configured. Email functionality disabled.');
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export async function sendPasswordResetEmail(email, resetToken) {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
  
  const emailClient = getResend();
  if (!emailClient) {
    console.error('Cannot send email: No email API configured');
    throw new Error('Email service not configured');
  }
  
  try {
    const { data, error } = await emailClient.emails.send({
      from: `${process.env.MAIL_FROM_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: [email],
      subject: 'Reset your KeyCliq password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #006209;">Reset your KeyCliq password</h2>
          <p>You requested to reset your password for your KeyCliq account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #006209; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent from KeyCliq - Your Digital Key Inventory
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send password reset email');
    }

    return data;
  } catch (error) {
    console.error('Error in sendPasswordResetEmail:', error);
    throw error;
  }
}
