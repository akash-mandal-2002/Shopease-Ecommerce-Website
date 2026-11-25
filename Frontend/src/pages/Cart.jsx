import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import CartSummary from '../components/cart/CartSummary';
import Loader from '../components/common/Loader';
import { EmptyState, ErrorState } from '../components/common/States';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const primaryBtn =
  'inline-flex h-12 items-center justify-center rounded-full bg-neutral-900 px-7 text-base font-medium text-white outline-none transition-colors duration-200 hover:bg-neutral-700 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2';

const stepBtn =
  'flex h-full w-10 items-center justify-center text-neutral-900 outline-none transition-colors hover:bg-neutral-100 focus-visible:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-300 disabled:hover:bg-transparent';

export default function Cart() {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const { cart, loading, error, updateItem, removeItem, clearCart } = useCart();

  if (!user) {
    return (
      <main className={`mx-auto max-w-3xl pb-16 pt-28 ${PAD_X}`}>
        <EmptyState
          title="Sign in to view your cart"
          message="Your cart is securely linked to your account."
        />
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate('/login?next=/cart')}
            className={primaryBtn}
          >
            Sign in
          </button>
        </div>
      </main>
    );
  }

  if (loading) return <Loader label="Loading your cart..." />;

  if (error) {
    return (
      <main className={`mx-auto max-w-3xl pb-16 pt-28 ${PAD_X}`}>
        <ErrorState message={error} />
      </main>
    );
  }

  const items = cart?.items || [];
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const handleClear = async () => {
    if (window.confirm('Clear all items from your bag?')) {
      await clearCart();
    }
  };

  return (
    <main className="w-full pb-16 pt-24 sm:pb-20">
      <div className={`mx-auto max-w-[1400px] ${PAD_X}`}>
        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div>
            <h1
              style={{ fontFamily: 'Satoshi-Regular' }}
              className="text-4xl leading-[1] tracking-[-0.04em] text-neutral-900 sm:text-5xl"
            >
              Shopping bag
            </h1>
            <p className="mt-3 text-base text-neutral-600">
              {items.length} product{items.length === 1 ? '' : 's'} · {totalItems}{' '}
              item{totalItems === 1 ? '' : 's'}
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex h-11 shrink-0 items-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-medium text-neutral-900 outline-none transition-colors duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
            >
              Clear bag
            </button>
          )}
        </header>

        {!items.length ? (
          <div className="mt-8 rounded-lg bg-neutral-100 px-5 py-16 text-center sm:mt-10 sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-neutral-900">
              <ShoppingBag size={26} strokeWidth={1.5} />
            </div>
            <h2
              style={{ fontFamily: 'Satoshi-Medium' }}
              className="mt-6 text-2xl tracking-[-0.03em] text-neutral-900 sm:text-3xl"
            >
              Your bag is empty
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-base text-neutral-600">
              Add something you love and it will appear here.
            </p>
            <button
              type="button"
              onClick={() => navigate('/shop')}
              className={`mt-7 ${primaryBtn}`}
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="mt-8 grid items-start gap-6 sm:mt-10 lg:grid-cols-[1fr_380px]">
            {/* Items */}
            <section
              aria-label="Items in your bag"
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white"
            >
              <ul className="divide-y divide-neutral-200">
                {items.map((item) => {
                  const stock = Number.isFinite(Number(item.stock))
                    ? Number(item.stock)
                    : Infinity;
                  const atMin = item.quantity <= 1;
                  const atMax = item.quantity >= stock;

                  return (
                    <li
                      key={`${item.productId}-${item.variant || 'none'}`}
                      className="flex gap-4 p-4 sm:gap-6 sm:p-6"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/product/${item.productId}`)}
                        className="shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
                        aria-label={`View ${item.title}`}
                      >
                        <img
                          src={item.image}
                          alt=""
                          draggable={false}
                          className="h-32 w-28 rounded-lg bg-neutral-100 object-contain p-2 mix-blend-multiply sm:h-40 sm:w-32"
                        />
                      </button>

                      <div className="flex min-w-0 flex-1 flex-col">
                        {/* Title + remove */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/product/${item.productId}`)}
                              className="line-clamp-2 rounded text-left text-base font-medium leading-snug tracking-[-0.01em] text-neutral-900 outline-none hover:underline hover:underline-offset-2 focus-visible:underline sm:text-lg"
                            >
                              {item.title}
                            </button>
                            {item.variant && (
                              <span className="mt-2 inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                                {item.variant}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, item.variant)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-500 outline-none transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:ring-neutral-900"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        {/* Price + quantity */}
                        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                          <div>
                            <p className="text-lg font-medium text-neutral-900 sm:text-xl">
                              {formatCurrency(item.price * item.quantity)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-neutral-500">
                                {formatCurrency(item.price)} each
                              </p>
                            )}
                          </div>

                          <div className="text-right">
                            <div
                              role="group"
                              aria-label={`Quantity for ${item.title}`}
                              className="inline-flex h-11 items-center overflow-hidden rounded-full border border-neutral-300 bg-white"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(
                                    item.productId,
                                    Math.max(1, item.quantity - 1),
                                    item.variant
                                  )
                                }
                                disabled={atMin}
                                className={stepBtn}
                                aria-label="Decrease quantity"
                              >
                                <Minus size={15} />
                              </button>
                              <span
                                aria-live="polite"
                                className="w-8 text-center text-base font-medium text-neutral-900"
                              >
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(
                                    item.productId,
                                    Math.min(stock, item.quantity + 1),
                                    item.variant
                                  )
                                }
                                disabled={atMax}
                                className={stepBtn}
                                aria-label="Increase quantity"
                              >
                                <Plus size={15} />
                              </button>
                            </div>
                            {atMax && (
                              <p className="mt-1.5 text-xs font-medium text-amber-600">
                                Max stock reached
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="border-t border-neutral-200 bg-neutral-100 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="rounded text-sm font-medium text-neutral-900 underline underline-offset-4 outline-none transition-opacity hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900"
                >
                  ← Continue shopping
                </button>
              </div>
            </section>

            {/* Summary */}
            <CartSummary cart={cart} onAction={() => navigate('/checkout')} />
          </div>
        )}
      </div>
    </main>
  );
}