import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import Button from '../common/Button';

export default function EmailVerification({ email, onBack }) {
  const { verifyEmail, resendOtp } = useAuth();
  const { navigate } = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChange = useCallback((index, value) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await verifyEmail({ email, otp: code });
      setSuccess('Email verified successfully! Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResending(true);
    setError('');
    setSuccess('');

    try {
      await resendOtp({ email });
      setSuccess('A new verification code has been sent to your email.');
      setCountdown(600);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-gray-200 bg-white p-7 shadow-sm sm:p-9 animate-fade-in">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Verify your email</h1>
        <p className="mt-2 text-sm text-gray-500">
          We sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        {/* OTP Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`h-13 w-11 rounded-xl border text-center text-xl font-semibold outline-none transition-all sm:h-14 sm:w-12
                ${error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-gray-900 focus:bg-white focus:ring-1 focus:ring-gray-900'}
              `}
              autoFocus={i === 0}
              id={`otp-input-${i}`}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="mt-4 text-center">
          {countdown > 0 ? (
            <p className="text-sm text-gray-500">
              Code expires in <span className="font-medium text-gray-900">{formatTime(countdown)}</span>
            </p>
          ) : (
            <p className="text-sm font-medium text-red-600">Code expired. Please request a new one.</p>
          )}
        </div>

        {/* Messages */}
        {error && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
        )}
        {success && (
          <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm text-green-700">{success}</p>
        )}

        {/* Actions */}
        <Button
          type="submit"
          loading={loading}
          disabled={countdown === 0}
          className="mt-6 w-full"
        >
          Verify email
        </Button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || resendCooldown > 0}
            className="text-sm font-semibold text-gray-600 underline transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resending ? 'Sending...' : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </button>
        </div>
      </form>

      {onBack && (
        <p className="mt-6 text-center text-sm text-gray-500">
          Wrong email?{' '}
          <button onClick={onBack} className="font-semibold text-gray-950 underline">
            Go back
          </button>
        </p>
      )}
    </div>
  );
}
