import { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { orderApi } from '../services/orderApi';
import CartSummary from '../components/cart/CartSummary';
import { formatCurrency } from '../utils/currency';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const inputClass =
  'mt-2 h-12 w-full rounded-lg border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900';

const labelClass = 'text-sm font-medium text-neutral-900';

const primaryBtn =
  'inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-7 text-base font-medium text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

/* ----------------------------- helpers ----------------------------- */
const luhn = (n) => {
  let sum = 0;
  let alt = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
};

const brand = (n) =>
  /^4/.test(n)
    ? 'Visa'
    : /^(5[1-5]|2)/.test(n)
      ? 'Mastercard'
      : /^3[47]/.test(n)
        ? 'American Express'
        : 'Card';

// 4242424242424242 -> 4242 4242 4242 4242
const formatCardNumber = (v) =>
  v
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim();

// 1228 -> 12/28
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

const ADDRESS_FIELDS = [
  ['name', 'Full name', 'name'],
  ['line1', 'Address', 'address-line1'],
  ['city', 'City', 'address-level2'],
  ['state', 'State', 'address-level1'],
  ['pincode', 'Pincode', 'postal-code'],
  ['phone', 'Phone', 'tel'],
];

const PAYMENT_METHODS = [
  ['upi', 'UPI'],
  ['card', 'Card'],
  ['netbanking', 'Net Banking'],
  ['cod', 'Cash on Delivery'],
];

const BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
];

/* ------------------------- small components ------------------------ */
function Panel({ step, title, action, children }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            style={{ fontFamily: 'Satoshi-Medium' }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm text-white"
          >
            {step}
          </span>
          <h2
            style={{ fontFamily: 'Satoshi-Medium' }}
            className="text-xl tracking-[-0.02em] text-neutral-900 sm:text-2xl"
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function AddressFields({ value, onChange, section }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {ADDRESS_FIELDS.map(([k, label, auto]) => (
        <div key={k} className={k === 'line1' ? 'sm:col-span-2' : ''}>
          <label htmlFor={`${section}-${k}`} className={labelClass}>
            {label}
          </label>
          <input
            id={`${section}-${k}`}
            required
            value={value[k] || ''}
            maxLength={k === 'pincode' ? 10 : undefined}
            pattern={k === 'phone' ? '[0-9]{10,15}' : undefined}
            title={k === 'phone' ? 'Enter 10–15 digits' : undefined}
            inputMode={k === 'phone' ? 'numeric' : undefined}
            autoComplete={`${section} ${auto}`}
            onChange={(e) => onChange(k, e.target.value)}
            className={inputClass}
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ page ------------------------------- */
export default function Checkout() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { cart, refresh } = useCart();

  const blankAddress = {
    name: user?.name || '',
    line1: user?.address || '',
    city: '',
    state: 'Delhi',
    pincode: user?.pincode || '',
    phone: user?.phone || '',
  };

  const [shipping, setShipping] = useState(blankAddress);
  const [sameBilling, setSameBilling] = useState(true);
  const [billing, setBilling] = useState(blankAddress);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [details, setDetails] = useState({
    upiId: '',
    cardHolder: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    bank: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (setter, key, value) =>
    setter((old) => ({ ...old, [key]: value }));

  // Redirect inside an effect, not during render
  useEffect(() => {
    if (!user) navigate('/login?next=/checkout');
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (paymentMethod === 'upi' && !/^[\w.-]+@[\w.-]+$/.test(details.upiId)) {
      setError('Enter a valid UPI ID such as name@bank.');
      return;
    }

    let paymentDetails = {};
    if (paymentMethod === 'upi') paymentDetails = { upiId: details.upiId };
    if (paymentMethod === 'netbanking') paymentDetails = { bank: details.bank };

    if (paymentMethod === 'card') {
      const n = details.cardNumber.replace(/\s/g, '');

      if (!/^\d{13,19}$/.test(n) || !luhn(n)) {
        setError('Card number is invalid. Check the number and try again.');
        return;
      }
      if (
        !/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(details.expiry) ||
        !/^\d{3,4}$/.test(details.cvv)
      ) {
        setError('Enter a valid card expiry (MM/YY) and CVV.');
        return;
      }

      const [mm, yy] = details.expiry.split('/').map(Number);
      const now = new Date();
      if (
        2000 + yy < now.getFullYear() ||
        (2000 + yy === now.getFullYear() && mm < now.getMonth() + 1)
      ) {
        setError('This card is expired. Choose another payment method.');
        return;
      }

      paymentDetails = {
        cardLast4: n.slice(-4),
        cardBrand: brand(n),
        cardHolder: details.cardHolder,
        expiry: details.expiry,
      };
    }

    setLoading(true);
    try {
      const payload = {
        shippingAddress: shipping,
        billingAddress: sameBilling ? shipping : billing,
        paymentMethod,
        paymentDetails,
      };
      const res = await orderApi.create(payload);
      await refresh();
      navigate(`/orders?success=${encodeURIComponent(res.data.id)}`);
    } catch (err) {
      setError(err.message || 'Payment failed, try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const items = cart?.items || [];

  if (!items.length) {
    return (
      <main className={`mx-auto max-w-3xl pb-16 pt-28 text-center ${PAD_X}`}>
        <h1
          style={{ fontFamily: 'Satoshi-Regular' }}
          className="text-4xl tracking-[-0.04em] text-neutral-900 sm:text-5xl"
        >
          Your cart is empty.
        </h1>
        <p className="mt-3 text-base text-neutral-600">
          Add something to your bag before checking out.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className={`mt-7 ${primaryBtn}`}
        >
          Shop products
        </button>
      </main>
    );
  }

  // Same formula as before: shipping is free from 999, plus 5% tax
  const subtotal = cart.totalPrice || 0;
  const shippingFee = subtotal >= 999 ? 0 : 79;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shippingFee + tax;

  return (
    <main className="w-full pb-16 pt-24 sm:pb-20">
      <div className={`mx-auto max-w-[1400px] ${PAD_X}`}>
        {/* Header */}
        <header>
          <h1
            style={{ fontFamily: 'Satoshi-Regular' }}
            className="text-4xl leading-[1] tracking-[-0.04em] text-neutral-900 sm:text-5xl"
          >
            Checkout
          </h1>
          <p className="mt-4 inline-block rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            Demo transaction only — no real payment gateway is connected.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="mt-8 grid items-start gap-6 sm:mt-10 lg:grid-cols-[1fr_400px] lg:gap-8"
        >
          {/* Left: steps */}
          <div className="grid content-start gap-5 sm:gap-6">
            <Panel step="1" title="Shipping details">
              <AddressFields
                section="shipping"
                value={shipping}
                onChange={(k, v) => update(setShipping, k, v)}
              />
            </Panel>

            <Panel
              step="2"
              title="Billing information"
              action={
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-neutral-900">
                  <input
                    type="checkbox"
                    checked={sameBilling}
                    onChange={(e) => setSameBilling(e.target.checked)}
                    className="h-5 w-5 rounded accent-neutral-900"
                  />
                  Same as shipping
                </label>
              }
            >
              {sameBilling ? (
                <p className="text-sm text-neutral-600">
                  We’ll use your shipping address for billing.
                </p>
              ) : (
                <AddressFields
                  section="billing"
                  value={billing}
                  onChange={(k, v) => update(setBilling, k, v)}
                />
              )}
            </Panel>

            <Panel step="3" title="Payment method">
              <div
                role="radiogroup"
                aria-label="Payment method"
                className="grid gap-3 sm:grid-cols-2"
              >
                {PAYMENT_METHODS.map(([v, label]) => {
                  const selected = paymentMethod === v;
                  return (
                    <label
                      key={v}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-neutral-900 focus-within:ring-offset-2 ${
                        selected
                          ? 'border-neutral-900 bg-neutral-100'
                          : 'border-neutral-300 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={v}
                        checked={selected}
                        onChange={() => setPaymentMethod(v)}
                        className="mt-1 h-4 w-4 accent-neutral-900"
                      />
                      <span>
                        <span className="block text-base font-medium text-neutral-900">
                          {label}
                        </span>
                        <span className="mt-0.5 block text-sm text-neutral-500">
                          {v === 'cod' ? 'Pay when delivered.' : 'Simulated demo transaction.'}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {paymentMethod === 'upi' && (
                <div className="mt-6">
                  <label htmlFor="pay-upi" className={labelClass}>
                    UPI ID
                  </label>
                  <input
                    id="pay-upi"
                    required
                    value={details.upiId}
                    onChange={(e) => update(setDetails, 'upiId', e.target.value)}
                    placeholder="name@bank"
                    autoComplete="off"
                    className={inputClass}
                  />
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="pay-holder" className={labelClass}>
                      Cardholder name
                    </label>
                    <input
                      id="pay-holder"
                      required
                      autoComplete="cc-name"
                      value={details.cardHolder}
                      onChange={(e) => update(setDetails, 'cardHolder', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="pay-number" className={labelClass}>
                      Card number
                    </label>
                    <input
                      id="pay-number"
                      required
                      autoComplete="cc-number"
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      value={details.cardNumber}
                      onChange={(e) =>
                        update(setDetails, 'cardNumber', formatCardNumber(e.target.value))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="pay-expiry" className={labelClass}>
                      Expiry (MM/YY)
                    </label>
                    <input
                      id="pay-expiry"
                      required
                      autoComplete="cc-exp"
                      inputMode="numeric"
                      placeholder="MM/YY"
                      value={details.expiry}
                      onChange={(e) =>
                        update(setDetails, 'expiry', formatExpiry(e.target.value))
                      }
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="pay-cvv" className={labelClass}>
                      CVV
                    </label>
                    <input
                      id="pay-cvv"
                      required
                      type="password"
                      autoComplete="cc-csc"
                      inputMode="numeric"
                      maxLength={4}
                      value={details.cvv}
                      onChange={(e) =>
                        update(setDetails, 'cvv', e.target.value.replace(/\D/g, ''))
                      }
                      className={inputClass}
                    />
                  </div>

                  <p className="text-sm text-neutral-500 sm:col-span-2">
                    Card number and CVV are validated in the browser and are never
                    sent to or stored by ShopEase.
                  </p>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="mt-6">
                  <label htmlFor="pay-bank" className={labelClass}>
                    Bank
                  </label>
                  <select
                    id="pay-bank"
                    required
                    value={details.bank}
                    onChange={(e) => update(setDetails, 'bank', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Choose a bank</option>
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}
            </Panel>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </div>

          {/* Right: summary + place order */}
          <div className="lg:sticky lg:top-28">
            <CartSummary cart={cart} />
            <button
              type="submit"
              disabled={loading}
              style={{ fontFamily: 'Satoshi-Medium' }}
              className={`${primaryBtn} mt-4 w-full`}
            >
              {loading ? 'Placing order…' : `Place order · ${formatCurrency(total)}`}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}