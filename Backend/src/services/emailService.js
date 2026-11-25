import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;
let emailConfigured = false;

function buildHtml(otp, name) {
  return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #171717; margin: 0;">SHOPEASE<span style="color: #ea580c;">.</span></h1>
        </div>
        <p style="font-size: 16px; color: #374151;">Hi ${name},</p>
        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          Thank you for creating a ShopEase account. Use the verification code below to complete your registration.
          This code expires in <strong>10 minutes</strong>.
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #171717; background: #f5f5f4; border-radius: 12px; padding: 16px 28px;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 13px; color: #9ca3af; text-align: center;">
          If you didn't request this, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">
          &copy; ${new Date().getFullYear()} ShopEase. All rights reserved.
        </p>
      </div>
    `;
}

/**
 * SMTP transporter (used only when BREVO_API_KEY is not set, e.g. local development).
 */
function ensureTransporter() {
  if (transporter) return emailConfigured;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn('[EmailService] SMTP is not configured.');
    emailConfigured = false;
    transporter = { sendMail: async () => { throw new Error('Email service is not configured.'); } };
    return false;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: env.isProduction },
  });

  emailConfigured = true;
  console.log(`[EmailService] SMTP configured: ${host}:${port}`);
  return true;
}

/**
 * Send email through Brevo's HTTPS API (works on hosts that block SMTP ports, like Render free tier).
 */
async function sendWithBrevo({ to, name, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!fromEmail) throw new Error('EMAIL_FROM is missing.');

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'ShopEase', email: fromEmail },
      to: [{ email: to, name: name || to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    console.error(`[EmailService] Brevo error ${response.status}: ${text}`);
    throw new Error('Could not send verification email.');
  }
  console.log(`[EmailService] OTP email sent to ${to} via Brevo`);
}

/**
 * Send a verification OTP email.
 * @param {string} to     Recipient email address
 * @param {string} otp    The 6-digit OTP
 * @param {string} name   Recipient name
 * @returns {Promise<boolean>}
 */
export async function sendVerificationEmail(to, otp, name) {
  const subject = 'Verify your ShopEase account';
  const html = buildHtml(otp, name);

  // Preferred: Brevo HTTPS API
  if (process.env.BREVO_API_KEY) {
    await sendWithBrevo({ to, name, subject, html });
    return true;
  }

  // Fallback: SMTP
  const configured = ensureTransporter();
  if (!configured) {
    if (!env.isProduction) {
      console.log(`\n[DEV] Verification OTP for ${to}: ${otp}\n`);
      return true;
    }
    throw new Error('Email service is not configured. Contact support.');
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  await transporter.sendMail({ from: `ShopEase <${from}>`, to, subject, html });
  return true;
}

export function isEmailServiceConfigured() {
  if (process.env.BREVO_API_KEY) return true;
  ensureTransporter();
  return emailConfigured;
}