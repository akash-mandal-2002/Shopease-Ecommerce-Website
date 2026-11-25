import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { orderApi } from '../services/orderApi';
import Loader from '../components/common/Loader';
import { ErrorState } from '../components/common/States';
import { formatCurrency } from '../utils/currency';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const steps = ['confirmed', 'dispatched', 'delivered'];

const statusStyles = {
  confirmed: 'bg-blue-50 text-blue-700',
  dispatched: 'bg-amber-50 text-amber-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const primaryBtn =
  'inline-flex h-11 items-center justify-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 print:hidden';

const outlineBtn =
  'inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 print:hidden';

const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN') : '');
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '');

function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-neutral-100 text-neutral-700';
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ${style}`}
    >
      {status}
    </span>
  );
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

/* Order tracking: three steps joined by a line */
function Tracker({ order }) {
  const idx = steps.indexOf(order.status);

  if (order.status === 'cancelled') {
    return (
      <p role="status" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
        Order cancelled
      </p>
    );
  }

  return (
    <ol className="grid grid-cols-3">
      {steps.map((step, i) => {
        const done = i <= idx;
        const at = order.statusHistory?.find((h) => h.status === step)?.at;

        return (
          <li key={step} className="relative text-center">
            {i > 0 && (
              <span
                aria-hidden="true"
                style={{ left: '-50%', right: '50%' }}
                className={`absolute top-4 h-0.5 -translate-y-1/2 ${
                  i <= idx ? 'bg-neutral-900' : 'bg-neutral-200'
                }`}
              />
            )}
            <span
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                done
                  ? 'bg-neutral-900 text-white'
                  : 'border border-neutral-300 bg-white text-neutral-400'
              }`}
            >
              {done ? <CheckIcon /> : i + 1}
            </span>
            <p
              className={`mt-2 text-sm font-medium capitalize ${
                done ? 'text-neutral-900' : 'text-neutral-400'
              }`}
            >
              {step}
            </p>
            <p className="mt-0.5 min-h-[1rem] text-xs text-neutral-500">{fmtDate(at)}</p>
          </li>
        );
      })}
    </ol>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const { navigate, search } = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [returnReasons, setReturnReasons] = useState({});
  const [invoice, setInvoice] = useState(null);

  const successId = new URLSearchParams(search).get('success');

  const load = useCallback(async () => {
    try {
      const r = await orderApi.mine();
      setOrders(r.data);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login?next=/orders');
      return;
    }
    load();

    // Refresh every 30 seconds while the tab is visible, and when it regains focus
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    const focus = () => load();
    window.addEventListener('focus', focus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', focus);
    };
  }, [user, load, navigate]);

  const confirmed = useMemo(
    () => orders.find((o) => o.id === successId),
    [orders, successId]
  );

  const act = async (fn) => {
    setError('');
    setNotice('');
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const showInvoice = async (id) => {
    try {
      const r = await orderApi.invoice(id);
      setInvoice(r.data);
      setTimeout(() => window.print(), 100);
    } catch (e) {
      setError(e.message);
    }
  };

  if (loading) return <Loader label="Loading orders..." />;

  return (
    <main className="w-full pb-16 pt-24 sm:pb-20">
      <div className={`mx-auto max-w-[1100px] ${PAD_X}`}>
        {/* Header */}
        <header>
          <h1
            style={{ fontFamily: 'Satoshi-Regular' }}
            className="text-4xl leading-[1] tracking-[-0.04em] text-neutral-900 sm:text-5xl"
          >
            Orders
          </h1>
          <p className="mt-3 text-base text-neutral-600">
            {orders.length === 0
              ? 'Track, return and download invoices for your purchases.'
              : `${orders.length} order${orders.length === 1 ? '' : 's'}`}
          </p>
        </header>

        {error && (
          <div className="mt-6">
            <ErrorState message={error} />
          </div>
        )}

        {notice && (
          <p
            role="status"
            className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {notice}
          </p>
        )}

        {/* Order confirmed */}
        {confirmed && (
          <section
            aria-labelledby="order-confirmed-title"
            className="mt-8 overflow-hidden rounded-lg bg-neutral-900 p-6 text-white sm:p-10"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-900">
                <CheckIcon className="h-5 w-5" />
              </span>
              <p className="text-sm text-neutral-300">Order confirmed</p>
            </div>

            <h2
              id="order-confirmed-title"
              style={{ fontFamily: 'Satoshi-Regular' }}
              className="mt-5 text-4xl leading-[1] tracking-[-0.04em] sm:text-5xl"
            >
              Thank you for your order
            </h2>
            <p className="mt-4 inline-flex rounded-full border border-neutral-600 px-4 py-1.5 text-sm text-neutral-200">
              Order ID: <span className="ml-1.5 font-medium text-white">{confirmed.id}</span>
            </p>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              {/* Details */}
              <dl className="grid content-start gap-5 text-sm">
                <div>
                  <dt className="text-neutral-400">Payment</dt>
                  <dd className="mt-1 text-base capitalize text-white">
                    {confirmed.paymentMethod} · {confirmed.paymentStatus}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Ship to</dt>
                  <dd className="mt-1 text-base text-white">
                    {confirmed.shippingAddress?.line1}, {confirmed.shippingAddress?.city},{' '}
                    {confirmed.shippingAddress?.pincode}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-400">Billing</dt>
                  <dd className="mt-1 text-base text-white">
                    {confirmed.billingAddress?.line1 || confirmed.shippingAddress?.line1},{' '}
                    {confirmed.billingAddress?.city || confirmed.shippingAddress?.city}
                  </dd>
                </div>
              </dl>

              {/* Items and totals */}
              <div>
                <ul className="divide-y divide-neutral-700 border-y border-neutral-700">
                  {(confirmed.items || []).map((item, index) => (
                    <li
                      key={`${item.productId}-${index}`}
                      className="flex items-center justify-between gap-4 py-3 text-sm"
                    >
                      <span className="min-w-0 truncate text-neutral-100">
                        {item.title} × {item.quantity}
                      </span>
                      <span className="shrink-0 text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-4 grid gap-2 text-sm">
                  <div className="flex justify-between text-neutral-300">
                    <dt>Subtotal</dt>
                    <dd>{formatCurrency(confirmed.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <dt>Shipping</dt>
                    <dd>{formatCurrency(confirmed.shipping)}</dd>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <dt>Tax</dt>
                    <dd>{formatCurrency(confirmed.tax)}</dd>
                  </div>
                  <div
                    style={{ fontFamily: 'Satoshi-Medium' }}
                    className="mt-2 flex justify-between border-t border-neutral-700 pt-3 text-xl text-white"
                  >
                    <dt>Total</dt>
                    <dd>{formatCurrency(confirmed.totalAmount)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        )}

        {/* Invoice (printable) */}
        {invoice && (
          <section className="invoice-print mt-8 rounded-lg border border-neutral-200 bg-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2
                style={{ fontFamily: 'Satoshi-Medium' }}
                className="text-2xl tracking-[-0.03em] text-neutral-900 sm:text-3xl"
              >
                Invoice {invoice.invoiceNumber}
              </h2>
              <button type="button" onClick={() => window.print()} className={primaryBtn}>
                Print invoice
              </button>
            </div>

            <p className="mt-3 text-sm text-neutral-600">
              Issued: {fmtDateTime(invoice.issuedAt)} · Order: {invoice.order.id}
            </p>

            <div className="mt-5 grid gap-4 text-sm text-neutral-800 sm:grid-cols-2">
              <p>
                <span className="block text-neutral-500">Shipping</span>
                {invoice.order.shippingAddress?.name} · {invoice.order.shippingAddress?.line1},{' '}
                {invoice.order.shippingAddress?.city}, {invoice.order.shippingAddress?.state}{' '}
                {invoice.order.shippingAddress?.pincode} · {invoice.order.shippingAddress?.phone}
              </p>
              {invoice.order.billingAddress && (
                <p>
                  <span className="block text-neutral-500">Billing</span>
                  {invoice.order.billingAddress?.name} · {invoice.order.billingAddress?.line1},{' '}
                  {invoice.order.billingAddress?.city}, {invoice.order.billingAddress?.pincode}
                </p>
              )}
            </div>

            <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
              {invoice.order.items.map((i, n) => (
                <li
                  key={`${i.productId}-${n}`}
                  className="flex justify-between gap-4 py-3 text-sm text-neutral-900"
                >
                  <span>
                    {i.title} × {i.quantity}
                  </span>
                  <span className="shrink-0">{formatCurrency(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-1.5 text-right text-sm text-neutral-700">
              <p>Subtotal: {formatCurrency(invoice.order.subtotal)}</p>
              <p>Shipping: {formatCurrency(invoice.order.shipping)}</p>
              <p>Tax: {formatCurrency(invoice.order.tax)}</p>
              <p className="pt-2 text-lg font-semibold text-neutral-900">
                Total: {formatCurrency(invoice.order.totalAmount)}
              </p>
              <p className="capitalize">
                Payment: {invoice.order.paymentMethod} · {invoice.order.paymentStatus}
              </p>
              <p>
                Transaction: {invoice.payment?.transactionId || invoice.payment?.note || '—'}
              </p>
            </div>

            <p className="mt-4 text-xs text-neutral-500">{invoice.paymentDisclaimer}</p>

            <button
              type="button"
              onClick={() => setInvoice(null)}
              className={`${outlineBtn} mt-5`}
            >
              Close invoice
            </button>
          </section>
        )}

        {/* Orders list */}
        {orders.length === 0 ? (
          <div className="mt-8 rounded-lg bg-neutral-100 px-5 py-16 text-center sm:py-20">
            <h2
              style={{ fontFamily: 'Satoshi-Medium' }}
              className="text-2xl tracking-[-0.03em] text-neutral-900 sm:text-3xl"
            >
              No orders yet
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-base text-neutral-600">
              Your purchases will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className={`${primaryBtn} mt-7 h-12 px-7 text-base`}
            >
              Start shopping
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:gap-6">
            {orders.map((order) => {
              const reason = returnReasons[order.id] || '';
              const canReturn =
                order.status === 'delivered' &&
                (!order.returnStatus || order.returnStatus === 'not_requested');
              const hasReturn =
                order.returnStatus && order.returnStatus !== 'not_requested';

              return (
                <article
                  key={order.id}
                  className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-8"
                >
                  {/* Top: id, date, total, status */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-base font-medium text-neutral-900 sm:text-lg">
                        {order.id}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {fmtDateTime(order.orderDate)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-2">
                      <p
                        style={{ fontFamily: 'Satoshi-Medium' }}
                        className="text-2xl tracking-[-0.03em] text-neutral-900"
                      >
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <div className="flex flex-col items-end gap-1">
                        <StatusBadge status={order.status} />
                        <p className="text-xs text-neutral-500">Payment: {order.paymentStatus}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <ul className="mt-6 divide-y divide-neutral-200 border-y border-neutral-200">
                    {(order.items || []).map((item, n) => (
                      <li
                        key={`${item.productId}-${item.variant || 'none'}-${n}`}
                        className="flex items-center gap-4 py-4"
                      >
                        <img
                          src={item.image}
                          alt=""
                          draggable={false}
                          className="h-16 w-16 shrink-0 rounded-lg bg-neutral-100 object-contain p-1.5 mix-blend-multiply"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-neutral-900 sm:text-base">
                            {item.title}
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-500">
                            Qty {item.quantity}
                            {item.variant ? ` · ${item.variant}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-medium text-neutral-900 sm:text-base">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Tracking */}
                  <div className="mt-6">
                    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                      <h3
                        style={{ fontFamily: 'Satoshi-Medium' }}
                        className="text-lg tracking-[-0.02em] text-neutral-900"
                      >
                        Order tracking
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Updates automatically while you’re on this page
                      </p>
                    </div>
                    <Tracker order={order} />
                  </div>

                  {/* Actions */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    {order.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Cancel this order?')) {
                            act(async () => {
                              await orderApi.cancel(order.id);
                              setNotice('Order cancelled.');
                            });
                          }
                        }}
                        className={`${outlineBtn} hover:border-red-300 hover:bg-red-50 hover:text-red-600`}
                      >
                        Cancel order
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => showInvoice(order.id)}
                      className={outlineBtn}
                    >
                      Invoice / Print
                    </button>
                  </div>

                  {/* Return request */}
                  {canReturn && (
                    <div className="mt-6 rounded-lg bg-neutral-100 p-4 sm:p-5">
                      <label
                        htmlFor={`return-${order.id}`}
                        className="block text-sm font-medium text-neutral-900"
                      >
                        Request return
                      </label>
                      <textarea
                        id={`return-${order.id}`}
                        minLength={5}
                        rows={3}
                        value={reason}
                        onChange={(e) =>
                          setReturnReasons({ ...returnReasons, [order.id]: e.target.value })
                        }
                        placeholder="Tell us why you want to return this order"
                        className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 hover:border-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          act(async () => {
                            await orderApi.requestReturn(order.id, reason);
                            setNotice('Return request submitted.');
                          })
                        }
                        disabled={reason.trim().length < 5}
                        className={`${primaryBtn} mt-3`}
                      >
                        Request return
                      </button>
                    </div>
                  )}

                  {hasReturn && (                                                                                                                                                                                                                         
                    <p className="mt-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
                      Return status: <strong className="capitalize">{order.returnStatus}</strong>
                      {order.returnReason ? ` · ${order.returnReason}` : ''}
                      {order.returnAdminNote ? ` · Admin note: ${order.returnAdminNote}` : ''}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}