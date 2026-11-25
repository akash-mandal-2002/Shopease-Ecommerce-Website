import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;
let emailConfigured = false;

/**
 * Initialise the SMTP transporter lazily the first time an email is sent.
 * Returns `true` if a real SMTP transport is available, `false` otherwise.
 */
function ensureTransporter() {
  if (transporter) return emailConfigured;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn(
      '[EmailService] SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in Backend/.env to enable email delivery.'
    );
    emailConfigured = false;
    // Create a dummy transporter so callers don't need to check null
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
 * Send a verification OTP email.
 * @param {string} to     Recipient email address
 * @param {string} otp    The 6-digit OTP (plaintext – only for the email body)
 * @param {string} name   Recipient name for personalisation
 * @returns {Promise<boolean>} true if the email was accepted by the SMTP server
 */
export async function sendVerificationEmail(to, otp, name) {
  const configured = ensureTransporter();
  if (!configured) {
    // In development, log the OTP to the console so the developer can still test.
    if (!env.isProduction) {
      console.log(`\n[DEV] Verification OTP for ${to}: ${otp}\n`);
      return true; // Pretend it was sent in dev mode only
    }
    throw new Error('Email service is not configured. Contact support.');
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from: `ShopEase <${from}>`,
    to,
    subject: 'Verify your ShopEase account',
    html: `
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
    `,
  });

  return true;
}

/**
 * Returns whether the email service is properly configured.
 */
export function isEmailServiceConfigured() {
  ensureTransporter();
  return emailConfigured;
}
