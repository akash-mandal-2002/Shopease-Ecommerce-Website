import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { productApi } from '../../services/productApi';
import { useRouter } from '../../context/RouterContext';

// Aapka /products endpoint sirf query params aage bhejta hai, isliye bada pool
// fetch karke yahin rank karte hain. Backend mein agar kabhi sort=trending aa
// jaye toh { sort: 'trending', limit: 10 } use karo aur rankTrending hata do.
const TRENDING_QUERY = { limit: 30 };
const TRENDING_COUNT = 10;

// Banner, category aur featured section jaisa hi side padding
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const getName = (p) => p.name || p.title || '';
const getImage = (p) => p.image || p.thumbnail || p.images?.[0] || '';
const getPath = (p) => `/product/${p.slug || p.id}`;
const getRating = (p) => Number(p.rating ?? p.averageRating ?? 0);
const getReviewCount = (p) => Number(p.reviewCount ?? p.numReviews ?? p.reviews ?? 0);
const getOriginalPrice = (p) => p.originalPrice ?? p.compareAtPrice ?? p.mrp ?? null;

// Sabse zyada reviews pehle, barabar hone par zyada rating wala pehle.
const rankTrending = (list) =>
  [...list].sort(
    (a, b) => getReviewCount(b) - getReviewCount(a) || getRating(b) - getRating(a)
  );

const formatPrice = (value, currency = 'USD') => {
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
};

const compactCount = (n) =>
  n >= 1000
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })
        .format(n)
        .toLowerCase()
    : String(n);

// Cards ki width: mobile par 2.3, tablet par 3.2, md par 4, desktop par 5 cards
const CARD_W =
  'w-[calc((100%-1.5rem)/2.3)] sm:w-[calc((100%-3.75rem)/3.2)] md:w-[calc((100%-3.75rem)/4)] lg:w-[calc((100%-5rem)/5)]';

/* ----------------------------- Stars ------------------------------ */
function StarRating({ value }) {
  const pct = Math.max(0, Math.min(5, value)) * 20;
  const row = (cls) => (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={12} strokeWidth={0} fill="currentColor" className={cls} />
      ))}
    </span>
  );

  return (
    <span
      className="relative inline-flex"
      role="img"
      aria-label={`Rated ${value.toFixed(1)} out of 5`}
    >
      <span className="text-neutral-300">{row('')}</span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden text-neutral-900"
        style={{ width: `${pct}%` }}
      >
        <span className="flex w-max">{row('shrink-0')}</span>
      </span>
    </span>
  );
}

/* ------------------------------ Card ------------------------------- */
function ProductCard({ product, wished, onToggleWish, onOpen }) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = getName(product);
  const image = getImage(product);
  const rating = getRating(product);
  const reviews = getReviewCount(product);
  const original = getOriginalPrice(product);
  const hasDiscount = original != null && Number(original) > Number(product.price);
  const currency = product.currency || 'USD';

  return (
    <article className={`group relative ${CARD_W} shrink-0 snap-start`}>
      <button
        type="button"
        onClick={onOpen}
        className="block w-full text-left outline-none"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-100 ring-2 ring-inset ring-transparent transition-shadow duration-200 group-has-[button:focus-visible]:ring-neutral-900">
          {image && !imgFailed ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              draggable={false}
              onError={() => setImgFailed(true)}
              className="h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none sm:p-6"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              No image
            </div>
          )}

          {hasDiscount && (
            <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-900">
              Sale
            </span>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 text-sm font-medium leading-snug tracking-[-0.01em] text-neutral-900 group-hover:underline group-hover:underline-offset-2 sm:text-base">
          {name}
        </h3>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-neutral-900 sm:text-base">
            {formatPrice(product.price, currency)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-neutral-500 line-through sm:text-sm">
              <span className="sr-only">Was </span>
              {formatPrice(original, currency)}
            </span>
          )}
        </div>

        {rating > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating value={rating} />
            {reviews > 0 && (
              <span className="text-xs text-neutral-500">({compactCount(reviews)})</span>
            )}
          </div>
        )}
      </button>

      {/* Wishlist: card button ka sibling hai, taaki button ke andar button na aaye */}
      <button
        type="button"
        aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
        aria-pressed={wished}
        onClick={onToggleWish}
        className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 ${
          wished ? 'text-red-600' : 'text-neutral-900'
        }`}
      >
        <Heart size={16} fill={wished ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

/* ----------------------------- Skeleton ---------------------------- */
function SkeletonCard() {
  return (
    <div className={`${CARD_W} shrink-0`}>
      <div className="skeleton aspect-[4/5] w-full rounded-lg" />
      <div className="skeleton mt-3 h-4 w-11/12" />
      <div className="skeleton mt-1.5 h-4 w-2/3" />
      <div className="skeleton mt-2.5 h-4 w-1/3" />
    </div>
  );
}

/* ---------------------------- Main section ------------------------- */
export default function TrendingProducts({
  title = 'Trending right now',
  query = TRENDING_QUERY,
}) {
  const { navigate } = useRouter();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [wishlist, setWishlist] = useState(() => new Set());
  const [edge, setEdge] = useState({ start: true, end: false });
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    productApi
      .list(query)
      .then((res) => {
        if (active) setProducts(rankTrending(res.data || []).slice(0, TRENDING_COUNT));
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, attempt]);

  const updateEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setEdge({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [products, updateEdges]);

  const scrollByPage = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  const toggleWish = (id) =>
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const arrow =
    'hidden h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35 md:flex';

  return (
    <section className="w-full" aria-labelledby="trending-products-title">
      {/* Header */}
      <div className={`flex items-center justify-between gap-4 ${PAD_X}`}>
        <h2
          id="trending-products-title"
          style={{ fontFamily: 'Satoshi-Medium' }}
          className="text-2xl tracking-[-0.03em] text-neutral-900 sm:text-3xl"
        >
          {title}
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Previous products"
            disabled={edge.start}
            onClick={() => scrollByPage(-1)}
            className={arrow}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next products"
            disabled={edge.end}
            onClick={() => scrollByPage(1)}
            className={arrow}
          >
            <ChevronRight size={20} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="ml-2 rounded text-sm font-medium text-neutral-900 underline underline-offset-4 outline-none transition-opacity duration-200 hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            View all
          </button>
        </div>
      </div>

      {/* Body: cards screen ke edge tak scroll hote hain */}
      <div className="mt-5 sm:mt-6">
        {loading ? (
          <div className={`flex gap-3 overflow-hidden sm:gap-5 ${PAD_X}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className={PAD_X}>
            <div className="flex flex-col items-start gap-4 rounded-lg bg-neutral-100 px-6 py-8">
              <p className="text-sm text-neutral-700">
                Products load nahi ho paaye. {error}
              </p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-700"
              >
                Try again
              </button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <p className={`py-10 text-sm text-neutral-500 ${PAD_X}`}>
            Abhi koi trending product nahi hai.
          </p>
        ) : (
          <div
            ref={scrollRef}
            className={`flex snap-x snap-proximity scroll-pl-5 gap-3 overflow-x-auto pb-2 sm:scroll-pl-8 sm:gap-5 lg:scroll-pl-10 ${PAD_X} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                wished={wishlist.has(product.id)}
                onToggleWish={() => toggleWish(product.id)}
                onOpen={() => navigate(getPath(product))}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}