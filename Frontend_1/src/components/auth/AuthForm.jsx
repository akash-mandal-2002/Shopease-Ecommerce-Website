import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import EmailVerification from './EmailVerification';

const inputClass =
  'h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const labelClass = 'text-sm font-medium text-neutral-900';

function Field({ label, id, className = '', ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} {...props} className={`${inputClass} mt-2`} />
    </div>
  );
}

function PasswordField({ label, id, className = '', ...props }) {
  const [show, setShow] = useState(false);

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          {...props}
          type={show ? 'text' : 'password'}
          className={`${inputClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function AuthForm({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const { navigate, search } = useRouter();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Registration flow state
  const [step, setStep] = useState('form'); // 'form' | 'verify'
  const [pendingEmail, setPendingEmail] = useState('');

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
        const next = new URLSearchParams(search).get('next') || '/';
        navigate(next);
      } else {
        // Validate confirm password
        if (form.password !== form.confirmPassword) {
          setError('Passwords do not match.');
          return;
        }

        // Registration sends an OTP, it doesn't auto-login
        await register({
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
        });

        // Move to email verification step
        setPendingEmail(form.email.trim().toLowerCase());
        setStep('verify');
      }
    } catch (e) {
      // Handle unverified email during login
      if (e.message && e.message.includes('not verified')) {
        setPendingEmail(form.email.trim().toLowerCase());
        setStep('verify');
        setError('');
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show email verification screen
  if (step === 'verify' && pendingEmail) {
    return (
      <EmailVerification
        email={pendingEmail}
        onBack={() => {
          setStep('form');
          setPendingEmail('');
        }}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Heading */}
      <div>
        <h1
          style={{ fontFamily: 'Satoshi-Medium' }}
          className="text-4xl leading-[1.02] tracking-[-0.03em] text-neutral-900 sm:text-5xl"
        >
          {isLogin ? 'Welcome back.' : 'Create your account.'}
        </h1>
        <p className="mt-3 text-base text-neutral-600">
          {isLogin
            ? 'Sign in to manage your bag and orders.'
            : 'Save your wishlist, checkout faster and track orders.'}
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 grid gap-5">
        {!isLogin && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Full name"
              id="register-name"
              required
              minLength={2}
              autoComplete="name"
              value={form.name}
              onChange={set('name')}
            />
            <Field
              label="Phone"
              id="register-phone"
              required
              minLength={10}
              maxLength={15}
              pattern="[0-9]{10,15}"
              title="Enter 10–15 digits"
              inputMode="numeric"
              autoComplete="tel"
              value={form.phone}
              onChange={set('phone')}
            />
          </div>
        )}

        <Field
          label="Email"
          id={`${mode}-email`}
          required
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={set('email')}
        />

        {isLogin ? (
          <PasswordField
            label="Password"
            id="login-password"
            required
            minLength={8}
            autoComplete="current-password"
            value={form.password}
            onChange={set('password')}
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2">
              <PasswordField
                label="Password"
                id="register-password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={form.password}
                onChange={set('password')}
              />
              <PasswordField
                label="Confirm password"
                id="register-confirm-password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
              />
            </div>
            <p className="-mt-2 text-sm text-neutral-500">
              Password must be 8–128 characters. Phone must contain 10–15 digits.
            </p>
          </>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          id={`${mode}-submit`}
          disabled={loading}
          style={{ fontFamily: 'Satoshi-Medium' }}
          className="mt-1 inline-flex h-12 w-full items-center justify-center rounded-full bg-neutral-900 px-6 text-base font-medium text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-600">
        {isLogin ? 'New to ShopEase?' : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => navigate(isLogin ? '/register' : '/login')}
          className="rounded font-medium text-neutral-900 underline underline-offset-4 outline-none transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          {isLogin ? 'Create account' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}