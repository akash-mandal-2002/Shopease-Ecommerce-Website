import mongoose from 'mongoose';

const { Schema } = mongoose;

const pendingUserSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    password: { type: String, required: true }, // bcrypt hash
    otpHash: { type: String, required: true },  // bcrypt hash of the 6-digit OTP
    otpExpiresAt: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },  // incorrect verification attempts
    resendCount: { type: Number, default: 0 },  // how many times OTP was resent
    lastResendAt: { type: Date },
    createdAt: { type: Date, default: Date.now, expires: 3600 }, // TTL: auto-delete after 1 hour
  },
  { collection: 'pending_users', versionKey: false }
);

// Prevent model re-compilation during hot-reload
export const PendingUser = mongoose.models.PendingUser || mongoose.model('PendingUser', pendingUserSchema);
