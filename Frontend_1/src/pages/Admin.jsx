import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { adminApi } from '../services/adminApi';
import { productApi } from '../services/productApi';
import { formatCurrency } from '../utils/currency';
import Loader from '../components/common/Loader';
import ProductsTab from '../components/admin/ProductsTab';
import CategoriesTab from '../components/admin/CategoriesTab';
import OrdersTab from '../components/admin/OrdersTab';
import PaymentsTab from '../components/admin/PaymentsTab';
import UsersTab from '../components/admin/UsersTab';
import ReportsTab from '../components/admin/ReportsTab';
import InquiriesTab from '../components/admin/InquiriesTab';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const TABS = [
  'overview',
  'products',
  'categories',
  'orders',
  'payments',
  'users',
  'reports',
  'inquiries',
];

const statusStyles = {
  delivered: 'bg-green-50 text-green-700',
  paid: 'bg-green-50 text-green-700',
  shipped: 'bg-blue-50 text-blue-700',
  processing: 'bg-amber-50 text-amber-700',
  pending: 'bg-amber-50 text-amber-700',
  cancelled: 'bg-red-50 text-red-700',
  failed: 'bg-red-50 text-red-700',
};

function StatusBadge({ children }) {
  const style =
    statusStyles[String(children).toLowerCase()] || 'bg-neutral-100 text-neutral-600';
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {children}
    </span>
  );
}

function StockBadge({ stock }) {
  const out = Number(stock) <= 0;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        out ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {out ? 'Out of stock' : `${stock} left`}
    </span>
  );
}

const outlineBtn =
  'inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useRouter();

  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [focusedOrderId, setFocusedOrderId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o, c, r] = await Promise.all([
        adminApi.orders(),
        productApi.categories(),
        adminApi.reports({}),
      ]);
      setOrders(o.data);
      setCategories(c.data);
      setReport(r.data);
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    load();
  }, [user, authLoading, navigate, load]);

  const notice = useCallback((msg) => setError(msg), []);

  if (authLoading || loading) return <Loader label="Loading admin dashboard..." />;

  const stats = [
    {
      label: 'Catalog products',
      value: report?.data?.summary?.productCount ?? report?.summary?.productCount,
    },
    { label: 'Orders', value: report?.summary?.orderCount },
    { label: 'Recorded revenue', value: formatCurrency(report?.summary?.revenue || 0) },
    { label: 'Low stock', value: report?.summary?.lowStockCount },
  ];

  const lowStock = report?.lowStockProducts || [];

  return (
    <main className="w-full pb-16 pt-24 sm:pb-20">
      <div className={`mx-auto max-w-[1400px] ${PAD_X}`}>
        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-neutral-500">Admin</p>
            <h1
              style={{ fontFamily: 'Satoshi-Regular' }}
              className="mt-1 text-4xl leading-[1] tracking-[-0.04em] text-neutral-900 sm:text-5xl"
            >
              Store management
            </h1>
          </div>

          <button type="button" onClick={() => navigate('/')} className={outlineBtn}>
            View storefront
          </button>
        </header>

        {/* Notice */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss message"
              className="rounded px-1 text-lg leading-none outline-none hover:opacity-60 focus-visible:ring-2 focus-visible:ring-amber-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs: scrolls sideways on small screens */}
        <div className="mt-8 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            role="tablist"
            aria-label="Admin sections"
            className="inline-flex w-max rounded-full bg-neutral-100 p-1"
          >
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`h-10 whitespace-nowrap rounded-full px-5 text-sm font-medium capitalize outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                  tab === t
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Overview */}
        {tab === 'overview' && (
          <section className="mt-6 sm:mt-8">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {stats.map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-neutral-100 p-5 sm:p-6">
                  <p className="text-sm text-neutral-600">{label}</p>
                  <p
                    style={{ fontFamily: 'Satoshi-Medium' }}
                    className="mt-3 truncate text-3xl tracking-[-0.03em] text-neutral-900 sm:text-4xl"
                  >
                    {value ?? '—'}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Low stock */}
              <section
                aria-labelledby="low-stock-title"
                className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    id="low-stock-title"
                    style={{ fontFamily: 'Satoshi-Medium' }}
                    className="text-xl tracking-[-0.02em] text-neutral-900 sm:text-2xl"
                  >
                    Low stock alerts
                  </h2>
                  <span className="text-sm text-neutral-500">5 or fewer</span>
                </div>

                {lowStock.length > 0 ? (
                  <ul className="mt-4 max-h-[460px] divide-y divide-neutral-200 overflow-y-auto pr-1">
                    {lowStock.map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-4 py-3 text-sm text-neutral-900 sm:text-base"
                      >
                        <span className="truncate">{p.title}</span>
                        <StockBadge stock={p.stock} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-neutral-500">No low-stock alerts.</p>
                )}
              </section>

              {/* Recent orders */}
              <section
                aria-labelledby="recent-orders-title"
                className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2
                    id="recent-orders-title"
                    style={{ fontFamily: 'Satoshi-Medium' }}
                    className="text-xl tracking-[-0.02em] text-neutral-900 sm:text-2xl"
                  >
                    Recent orders
                  </h2>
                  <button
                    type="button"
                    onClick={() => setTab('orders')}
                    className="rounded text-sm font-medium text-neutral-900 underline underline-offset-4 outline-none transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900"
                  >
                    View all
                  </button>
                </div>

                {orders.length > 0 ? (
                  <ul className="mt-4 divide-y divide-neutral-200">
                    {orders.slice(0, 6).map((o) => (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setFocusedOrderId(o.id);
                            setTab('orders');
                          }}
                          className="flex w-full items-center justify-between gap-4 rounded py-3 text-left text-sm text-neutral-900 outline-none transition-colors hover:text-neutral-600 focus-visible:ring-2 focus-visible:ring-neutral-900 sm:text-base"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{o.id}</span>
                            {o.status && (
                              <span className="mt-1 inline-block">
                                <StatusBadge>{o.status}</StatusBadge>
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 font-medium">
                            {formatCurrency(o.totalAmount)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-neutral-500">No orders yet.</p>
                )}
              </section>
            </div>
          </section>
        )}

        {/* Other tabs: their own components */}
        <div className="mt-6 sm:mt-8">
          {tab === 'products' && (
            <ProductsTab categories={categories} onNotice={notice} />
          )}
          {tab === 'categories' && (
            <CategoriesTab categories={categories} onReload={load} onNotice={notice} />
          )}
          {tab === 'orders' && (
            <OrdersTab
              orders={orders}
              setOrders={setOrders}
              onNotice={notice}
              focusedOrderId={focusedOrderId}
            />
          )}
          {tab === 'payments' && (
            <PaymentsTab
              onNotice={notice}
              onSelectOrder={(id) => {
                setFocusedOrderId(id);
                setTab('orders');
              }}
            />
          )}
          {tab === 'users' && <UsersTab user={user} onNotice={notice} />}
          {tab === 'reports' && <ReportsTab onNotice={notice} />}
          {tab === 'inquiries' && <InquiriesTab onNotice={notice} />}
        </div>
      </div>
    </main>
  );
}