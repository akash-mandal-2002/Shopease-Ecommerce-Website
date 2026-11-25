import { Router } from 'express';
import { login, logout, me, register, verifyEmail, resendOtp, updateProfile, changePassword } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { rateLimit } from '../middleware/rateLimit.js';

const authAttemptLimit = rateLimit({ limit: 10, windowMs: 15 * 60 * 1000 });
const otpAttemptLimit = rateLimit({ limit: 6, windowMs: 15 * 60 * 1000 });

const router = Router();

router.post('/register', authAttemptLimit, asyncHandler(register));
router.post('/verify-email', otpAttemptLimit, asyncHandler(verifyEmail));
router.post('/resend-otp', otpAttemptLimit, asyncHandler(resendOtp));
router.post('/login', authAttemptLimit, asyncHandler(login));
router.post('/logout', requireAuth, asyncHandler(logout));
router.get('/me', requireAuth, asyncHandler(me));
router.patch('/profile', requireAuth, asyncHandler(updateProfile));
router.post('/change-password', requireAuth, authAttemptLimit, asyncHandler(changePassword));

export default router;
