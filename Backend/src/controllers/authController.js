import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repositories } from '../repositories/index.js';
import { PendingUser } from '../models/PendingUser.js';
import { sendVerificationEmail } from '../services/emailService.js';
import { HttpError } from '../utils/httpError.js';

/* ───────────── helpers ───────────── */

const publicUser = (user) => ({
  id: user.id, name: user.name, email: user.email, phone: user.phone || '',
  address: user.address || '', pincode: user.pincode || '', gender: user.gender || '',
  role: user.role, emailVerified: user.emailVerified ?? true,
});

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    env.jwtSecret,
    { expiresIn: '7d' }
  );

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());

const OTP_EXPIRY_MS = 10 * 60 * 1000;   // 10 minutes
const MAX_OTP_ATTEMPTS = 5;              // max wrong OTP tries
const MAX_RESEND_COUNT = 5;              // max resend requests
const RESEND_COOLDOWN_MS = 60 * 1000;    // 1 minute between resends

function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

/* ───────────── REGISTER (Step 1: collect info + send OTP) ───────────── */

export async function register(req, res) {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const phone = String(req.body.phone || '').trim();

  // Validation
  if (name.length < 2 || !validEmail(email) || !password || !/^\d{10,15}$/.test(phone)) {
    throw new HttpError(400, 'A valid name, email, password and phone (10–15 digits) are required.');
  }
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (password.length > 128) throw new HttpError(400, 'Password must be 128 characters or fewer.');

  // Check if email already registered (active user)
  if (await repositories.users.findOne({ email })) {
    throw new HttpError(409, 'An account with this email already exists.');
  }

  // Check phone uniqueness against active users
  if (phone && await repositories.users.findOne({ phone })) {
    throw new HttpError(409, 'An account with this phone number already exists.');
  }

  // Generate OTP and hash it
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const passwordHash = await bcrypt.hash(password, 12);

  // Upsert into pending_users (handles re-registration attempts for same email)
  await PendingUser.findOneAndUpdate(
    { email },
    {
      name,
      email,
      phone,
      password: passwordHash,
      otpHash,
      otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      otpAttempts: 0,
      resendCount: 0,
      lastResendAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Send verification email
  try {
    await sendVerificationEmail(email, otp, name);
  } catch (err) {
    // Clean up the pending record if email send fails
    await PendingUser.deleteOne({ email });
    console.error('[Auth] Failed to send verification email:', err.message);
    throw new HttpError(500, 'Unable to send verification email. Please try again later.');
  }

  res.status(200).json({
    success: true,
    message: 'A verification code has been sent to your email address.',
    data: { email, otpExpiresInMs: OTP_EXPIRY_MS },
  });
}

/* ───────────── VERIFY EMAIL (Step 2: check OTP + activate account) ───────────── */

export async function verifyEmail(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();

  if (!email || !otp) throw new HttpError(400, 'Email and verification code are required.');
  if (!/^\d{6}$/.test(otp)) throw new HttpError(400, 'Verification code must be 6 digits.');

  const pending = await PendingUser.findOne({ email });
  if (!pending) {
    throw new HttpError(404, 'No pending registration found for this email. Please register again.');
  }

  // Check expiry
  if (pending.otpExpiresAt < new Date()) {
    await PendingUser.deleteOne({ email });
    throw new HttpError(410, 'Verification code has expired. Please register again.');
  }

  // Check attempt limit
  if (pending.otpAttempts >= MAX_OTP_ATTEMPTS) {
    await PendingUser.deleteOne({ email });
    throw new HttpError(429, 'Too many incorrect attempts. Please register again.');
  }

  // Verify OTP
  const isValid = await bcrypt.compare(otp, pending.otpHash);
  if (!isValid) {
    await PendingUser.updateOne({ email }, { $inc: { otpAttempts: 1 } });
    const remaining = MAX_OTP_ATTEMPTS - pending.otpAttempts - 1;
    throw new HttpError(401, `Incorrect verification code. ${remaining > 0 ? `${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` : 'No attempts remaining.'}`);
  }

  // Double-check email is still available (race condition guard)
  if (await repositories.users.findOne({ email })) {
    await PendingUser.deleteOne({ email });
    throw new HttpError(409, 'An account with this email already exists.');
  }

  // Create the verified user account
  const user = await repositories.users.insert({
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    password: pending.password,
    address: '',
    pincode: '',
    gender: '',
    role: 'customer', // Never allow public registration as admin
    emailVerified: true,
    createdAt: new Date().toISOString(),
  });

  // Remove the pending record
  await PendingUser.deleteOne({ email });

  res.status(201).json({
    success: true,
    message: 'Email verified successfully. Your account is now active. Please sign in.',
    data: { email: user.email },
  });
}

/* ───────────── RESEND OTP ───────────── */

export async function resendOtp(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!email) throw new HttpError(400, 'Email is required.');

  const pending = await PendingUser.findOne({ email });
  if (!pending) {
    throw new HttpError(404, 'No pending registration found for this email. Please register again.');
  }

  // Resend limit
  if (pending.resendCount >= MAX_RESEND_COUNT) {
    throw new HttpError(429, 'Maximum resend limit reached. Please register again.');
  }

  // Cooldown
  if (pending.lastResendAt && (Date.now() - pending.lastResendAt.getTime()) < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - pending.lastResendAt.getTime())) / 1000);
    throw new HttpError(429, `Please wait ${waitSec} second${waitSec === 1 ? '' : 's'} before requesting a new code.`);
  }

  // Generate new OTP
  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  await PendingUser.updateOne(
    { email },
    {
      $set: {
        otpHash,
        otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
        otpAttempts: 0,
        lastResendAt: new Date(),
      },
      $inc: { resendCount: 1 },
    }
  );

  try {
    await sendVerificationEmail(email, otp, pending.name);
  } catch (err) {
    console.error('[Auth] Failed to resend verification email:', err.message);
    throw new HttpError(500, 'Unable to send verification email. Please try again later.');
  }

  res.json({
    success: true,
    message: 'A new verification code has been sent to your email.',
    data: { email, otpExpiresInMs: OTP_EXPIRY_MS },
  });
}

/* ───────────── LOGIN ───────────── */

export async function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) throw new HttpError(400, 'Email and password are required.');

  const user = await repositories.users.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password || ''))) {
    throw new HttpError(401, 'Invalid email or password.');
  }

  // Check email verification status
  if (user.emailVerified === false) {
    throw new HttpError(403, 'Your email is not verified. Please complete email verification before signing in.', { emailUnverified: true, email });
  }

  res.json({
    success: true,
    data: { user: publicUser(user), token: signToken(user) },
  });
}

/* ───────────── LOGOUT ───────────── */

export async function logout(req, res) {
  // With stateless JWTs, server-side logout is limited.
  // The frontend clears the token. This endpoint confirms the action
  // and can be extended to add token blacklisting if needed.
  res.json({
    success: true,
    message: 'Logged out successfully. Please clear your local session.',
  });
}

/* ───────────── GET CURRENT USER ───────────── */

export async function me(req, res) {
  const user = await repositories.users.findById(req.user.id);
  if (!user) throw new HttpError(404, 'User account not found.');
  res.json({ success: true, data: publicUser(user) });
}

/* ───────────── UPDATE PROFILE ───────────── */

export async function updateProfile(req, res) {
  const allowed = ['name', 'phone', 'address', 'pincode', 'gender'];
  const patch = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (patch.name !== undefined && String(patch.name).trim().length < 2) throw new HttpError(400, 'Name must contain at least 2 characters.');
  if (patch.phone !== undefined && !/^\d{10,15}$/.test(String(patch.phone))) throw new HttpError(400, 'Phone must contain 10–15 digits.');
  if (patch.gender !== undefined && !['', 'Male', 'Female', 'Other'].includes(String(patch.gender))) throw new HttpError(400, 'Gender must be Male, Female, Other, or blank.');
  if (patch.pincode !== undefined && String(patch.pincode).length > 10) throw new HttpError(400, 'Pincode must be 10 characters or fewer.');
  if (patch.name !== undefined) patch.name = String(patch.name).trim();
  const user = await repositories.users.update(req.user.id, patch);
  if (!user) throw new HttpError(404, 'User account not found.');
  res.json({ success: true, data: publicUser(user) });
}

/* ───────────── CHANGE PASSWORD ───────────── */

export async function changePassword(req, res) {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  if (!currentPassword || !newPassword) throw new HttpError(400, 'Current and new passwords are required.');
  if (newPassword.length < 8 || newPassword.length > 128) throw new HttpError(400, 'New password must be 8–128 characters.');
  if (currentPassword === newPassword) throw new HttpError(400, 'New password must differ from the current password.');
  const user = await repositories.users.findById(req.user.id);
  if (!user) throw new HttpError(404, 'User account not found.');
  if (!(await bcrypt.compare(currentPassword, user.password || ''))) throw new HttpError(401, 'Current password is incorrect.');
  await repositories.users.update(user.id, { password: await bcrypt.hash(newPassword, 12) });
  res.json({ success: true, message: 'Password changed. Existing JWT sessions remain valid until they expire.' });
}
