import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { orderApi } from '../services/orderApi';
import Loader from '../components/common/Loader';
import { formatCurrency } from '../utils/currency';
import { authApi } from '../services/authApi';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const inputClass =
  'mt-2 h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const labelClass = 'text-sm font-medium text-neutral-900';

const statusStyles = {
  delivered: 'bg-green-50 text-green-700',
  paid: 'bg-green-50 text-green-700',
  shipped: 'bg-blue-50 text-blue-700',
  processing: 'bg-amber-50 text-amber-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
  failed: 'bg-red-50 text-red-700',
};

function Badge({ children }) {
  const style =
    statusStyles[String(children).toLowerCase()] || 'bg-white text-neutral-600';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {children}
    </span>
  );
}

function Notice({ ok, children }) {
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={`mt-5 rounded-lg px-4 py-3 text-sm ${
        ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
      }`}
    >
      {children}
    </p>
  );
}

function PasswordInput({ id, label, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
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
          className="absolute right-1.5 top-[1.125rem] flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 outline-none transition-colors hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

const primaryBtn =
  'inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-7 text-base font-medium text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const outlineBtn =
  'inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2';

export default function Account() {
  const { user, loading: authLoading, updateProfile, logout } = useAuth();
  const { navigate } = useRouter();

  const [form, setForm] = useState(() =>
    user
      ? {
          name: user.name || '',
          phone: user.phone || '',
          address: user.address || '',
          pincode: user.pincode || '',
          gender: user.gender || '',
        }
      : null
  );
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageOk, setMessageOk] = useState(true);
  const [tab, setTab] = useState('profile');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordOk, setPasswordOk] = useState(true);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
        pincode: user.pincode || '',
        gender: user.gender || '',
      });
      orderApi
        .mine()
        .then((res) => setOrders(res.data || []))
        .catch(() => {});
    }
  }, [user]);

  // Redirect inside an effect, not during render
  useEffect(() => {
    if (!authLoading && !user) navigate('/login?next=/account');
  }, [authLoading, user, navigate]);

  if (authLoading) return <Loader />;
  if (!user) return null;
  if (!form) return <Loader />;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      setMessageOk(true);
      setMessage('Profile updated.');
    } catch (err) {
      setMessageOk(false);
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordOk(false);
      setPasswordMessage('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      const r = await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordOk(true);
      setPasswordMessage(r.message || 'Password changed.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setPasswordOk(false);
      setPasswordMessage(err.message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const fullName = (user.name || '').trim();
  const firstName = fullName.split(' ')[0] || 'there';

  const initials =
    (fullName || '?')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  const totalSpent = orders.reduce(
    (sum, o) => sum + (Number(o.totalAmount) || 0),
    0
  );

  const tabs = [
    { id: 'profile', label: 'Profile details' },
    { id: 'security', label: 'Password' },
  ];

  const stats = [
    { label: 'Total orders', value: orders.length },
    { label: 'Total spent', value: formatCurrency(totalSpent) },
    { label: 'Phone', value: user.phone || '—' },
  ];

  return (
    <main className="w-full pb-16 pt-24 sm:pb-20">
      <div className={`mx-auto max-w-[1400px] ${PAD_X}`}>
        {/* Header */}
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4 sm:gap-5">
            <div
              style={{ fontFamily: 'Satoshi-Medium' }}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xl text-white sm:h-20 sm:w-20 sm:text-2xl"
            >
              {initials}
            </div>
            <div>
              <p className="text-sm text-neutral-500">My account</p>
              <h1
                style={{ fontFamily: 'Satoshi-Regular' }}
                className="mt-1 text-4xl leading-[1] tracking-[-0.04em] text-neutral-900 sm:text-5xl"
              >
                Hello, {firstName}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/orders')} className={outlineBtn}>
              My orders
            </button>
            <button type="button" onClick={() => navigate('/support')} className={outlineBtn}>
              Support
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 px-5 text-sm font-medium text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Quick stats */}
        <section
          aria-label="Account summary"
          className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`rounded-lg bg-neutral-100 p-5 sm:p-6 ${
                i === 2 ? 'col-span-2 sm:col-span-1' : ''
              }`}
            >
              <p className="text-sm text-neutral-600">{s.label}</p>
              <p
                style={{ fontFamily: 'Satoshi-Medium' }}
                className="mt-2 truncate text-3xl tracking-[-0.03em] text-neutral-900"
              >
                {s.value}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-8 grid items-start gap-6 sm:mt-10 lg:grid-cols-[1fr_380px]">
          {/* Left: tabbed forms */}
          <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-8">
            <div
              role="tablist"
              aria-label="Account settings"
              className="inline-flex rounded-full bg-neutral-100 p-1"
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`h-10 rounded-full px-5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                    tab === t.id
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {tab === 'profile' && (
              <form onSubmit={save} className="mt-6 sm:mt-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  {[
                    ['name', 'Full name', 'name'],
                    ['phone', 'Phone number', 'tel'],
                    ['address', 'Address', 'street-address'],
                    ['pincode', 'Pincode', 'postal-code'],
                  ].map(([key, label, auto]) => (
                    <div
                      key={key}
                      className={key === 'address' ? 'sm:col-span-2' : ''}
                    >
                      <label htmlFor={`account-${key}`} className={labelClass}>
                        {label}
                      </label>
                      <input
                        id={`account-${key}`}
                        required={key === 'phone'}
                        minLength={key === 'phone' ? 10 : undefined}
                        maxLength={
                          key === 'phone' ? 15 : key === 'pincode' ? 10 : undefined
                        }
                        pattern={key === 'phone' ? '[0-9]{10,15}' : undefined}
                        title={key === 'phone' ? 'Enter 10–15 digits' : undefined}
                        inputMode={key === 'phone' ? 'numeric' : undefined}
                        autoComplete={auto}
                        value={form[key] || ''}
                        onChange={(e) =>
                          setForm({ ...form, [key]: e.target.value })
                        }
                        className={inputClass}
                      />
                    </div>
                  ))}

                  <div>
                    <label htmlFor="account-gender" className={labelClass}>
                      Gender
                    </label>
                    <select
                      id="account-gender"
                      value={form.gender || ''}
                      onChange={(e) =>
                        setForm({ ...form, gender: e.target.value })
                      }
                      className={inputClass}
                    >
                      <option value="">Prefer not to say</option>
                      {['Male', 'Female', 'Other'].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {message && <Notice ok={messageOk}>{message}</Notice>}

                <div className="mt-7 flex flex-wrap items-center gap-5">
                  <button type="submit" disabled={saving} className={primaryBtn}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/support')}
                    className="rounded text-sm font-medium text-neutral-900 underline underline-offset-4 outline-none transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900"
                  >
                    Contact support
                  </button>
                </div>
              </form>
            )}

            {tab === 'security' && (
              <form onSubmit={changePassword} className="mt-6 sm:mt-8">
                <div className="grid max-w-md gap-5">
                  {[
                    ['currentPassword', 'Current password', 'current-password'],
                    ['newPassword', 'New password', 'new-password'],
                    ['confirmPassword', 'Confirm new password', 'new-password'],
                  ].map(([key, label, auto]) => (
                    <PasswordInput
                      key={key}
                      id={`account-${key}`}
                      label={label}
                      required
                      minLength={key === 'currentPassword' ? undefined : 8}
                      maxLength={128}
                      autoComplete={auto}
                      value={passwordForm[key]}
                      onChange={(e) =>
                        setPasswordForm({
                          ...passwordForm,
                          [key]: e.target.value,
                        })
                      }
                    />
                  ))}
                </div>

                <p className="mt-4 text-sm text-neutral-500">
                  New password must be 8–128 characters. Existing sign-in
                  sessions remain valid until their JWT expires.
                </p>

                {passwordMessage && (
                  <Notice ok={passwordOk}>{passwordMessage}</Notice>
                )}

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className={`${primaryBtn} mt-7`}
                >
                  {passwordSaving ? 'Please wait…' : 'Change password'}
                </button>
              </form>
            )}
          </section>

          {/* Right: recent orders */}
          <aside aria-labelledby="recent-orders-title">
            <div className="flex items-baseline justify-between gap-4">
              <h2
                id="recent-orders-title"
                style={{ fontFamily: 'Satoshi-Medium' }}
                className="text-2xl tracking-[-0.03em] text-neutral-900"
              >
                Recent orders
              </h2>
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="rounded text-sm font-medium text-neutral-900 underline underline-offset-4 outline-none transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900"
              >
                View all
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              {orders.slice(0, 4).map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() =>
                    navigate(`/orders?success=${encodeURIComponent(order.id)}`)
                  }
                  className="rounded-lg bg-neutral-100 p-4 text-left outline-none transition-colors duration-200 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  <div className="flex items-center justify-between gap-3 text-sm font-medium text-neutral-900 sm:text-base">
                    <span className="truncate">#{order.id}</span>
                    <span className="shrink-0">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge>{order.status}</Badge>
                    <span className="text-xs text-neutral-500">Payment:</span>
                    <Badge>{order.paymentStatus}</Badge>
                  </div>
                </button>
              ))}

              {!orders.length && (
                <div className="rounded-lg bg-neutral-100 px-5 py-10 text-center">
                  <p
                    style={{ fontFamily: 'Satoshi-Medium' }}
                    className="text-lg text-neutral-900"
                  >
                    No orders yet
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    Your orders will show up here.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="mt-5 inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
                  >
                    Start shopping
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}