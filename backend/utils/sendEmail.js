const { getTransporter, isConfigured } = require("../config/mailer");
const logger = require("../config/logger");

/**
 * Sends an email. Silently skips (and logs) if SMTP is not configured so the
 * app keeps working in environments without email set up (e.g. local dev).
 */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!isConfigured()) {
    logger.warn(`[EMAIL] SMTP not configured — skipping email to ${to} (${subject})`);
    return { skipped: true };
  }
  try {
    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]+>/g, ""),
    });
    logger.info(`[EMAIL] Sent to ${to}: ${subject}`);
    return { skipped: false };
  } catch (err) {
    logger.error(`[EMAIL] Failed to send to ${to}: ${err.message}`);
    return { skipped: true, error: err.message };
  }
};

const templates = {
  welcome: (name) => `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#ff7a09">Welcome to Smart PG, ${name}!</h2>
      <p>Your account has been created successfully. You can now browse PGs, manage payments and raise complaints — all in one place.</p>
    </div>`,
  paymentSuccess: (name, amount, month, year) => `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#16a34a">Payment Received</h2>
      <p>Hi ${name}, we've received your rent payment of <strong>₹${amount.toLocaleString()}</strong> for <strong>${month}/${year}</strong>.</p>
      <p>Thank you for staying with us!</p>
    </div>`,
  paymentDue: (name, amount, month, year) => `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#d97706">Rent Due Reminder</h2>
      <p>Hi ${name}, your rent of <strong>₹${amount.toLocaleString()}</strong> for <strong>${month}/${year}</strong> is pending. Please pay at your earliest convenience.</p>
    </div>`,
  resetPassword: (name, resetUrl) => `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#ff7a09">Password Reset Request</h2>
      <p>Hi ${name}, click the link below to reset your password. This link expires in ${process.env.RESET_PASSWORD_EXPIRE_MIN || 30} minutes.</p>
      <p><a href="${resetUrl}" style="background:#ff7a09;color:white;padding:10px 20px;border-radius:8px;text-decoration:none">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  complaintUpdate: (name, title, status) => `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#2563eb">Complaint Update</h2>
      <p>Hi ${name}, your complaint "<strong>${title}</strong>" status was updated to <strong>${status}</strong>.</p>
    </div>`,
};

module.exports = { sendEmail, templates };
