import { ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { productApi } from '../../services/productApi';
import { useRouter } from '../../context/RouterContext';

const MENS_SHOES_QUERY = {
  category: 'mens-shoes',
  sort: 'featured',
  limit: 10,
};

const PRODUCT_COUNT = 10;

// Banner, category aur baaki product sections jaisa hi side padding
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const getId = (product) => product.id ?? product._id;

const getName = (product) => product.name || product.title || '';

const getImage = (product) =>
  product.image || product.thumbnail || product.images?.[0] || '';

const getPath = (product) => `/product/${product.slug || getId(product)}`;

const getRating = (product) =>
  Number(product.rating ?? product.averageRating ?? 0);

const getReviewCount = (product) =>
  Number(
    product.reviewCount ??
      product.numReviews ??
      (typeof product.reviews === 'number' ? product.reviews : 0)
  );

const getOriginalPrice = (product) =>
  product.originalPrice ?? product.compareAtPrice ?? product.mrp ?? null;

// Alag-alag API formats ki category values ko ek jaisa banata hai.
const normalizeCategory = (value) => {
  if (value == null) return '';

  if (typeof value === 'object') {
    return normalizeCategory(value.slug || value.name || value.title || '');
  }

  return String(value).toLowerCase().trim().replace(/[\s_]+/g, '-');
};

const MENS_SHOE_CATEGORIES = new Set([
  'mens-shoes',
  'men-shoes',
  'mens-shoe',
  'men-shoe',
]);

const isMensShoes = (product) => {
  const categories = [
    product.category,
    product.categorySlug,
    product.categoryName,
    product.categoryId,
    ...(Array.isArray(product.categories) ? product.categories : []),
  ];

  return categories.some((category) =>
    MENS_SHOE_CATEGORIES.has(normalizeCategory(category))
  );
};

// Common API response formats handle karta hai.
const getProductList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const formatPrice = (value, currency = 'INR') => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return '';

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return amount.toFixed(2);
  }
};

const compactCount = (value) =>
  value >= 1000
    ? new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
      })
        .format(value)
        .toLowerCase()
    : String(value);

// Cards ki width: mobile par 2.3, tablet par 3.2, md par 4, desktop par 5 cards
const CARD_W =
  'w-[calc((100%-1.5rem)/2.3)] sm:w-[calc((100%-3.75rem)/3.2)] md:w-[calc((100%-3.75rem)/4)] lg:w-[calc((100%-5rem)/5)]';

/* ----------------------------- Star rating ----------------------------- */

function StarRating({ value }) {
  const rating = Math.max(0, Math.min(5, value));
  const percentage = rating * 20;

  return (
    <span
      className="relative inline-flex"
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      <span className="flex text-neutral-300">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} size={12} strokeWidth={0} fill="currentColor" />
        ))}
      </span>

      <span
        className="absolute inset-y-0 left-0 overflow-hidden text-neutral-900"
        style={{ width: `${percentage}%` }}
      >
        <span className="flex w-max">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={12}
              strokeWidth={0}
              fill="currentColor"
              className="shrink-0"
            />
          ))}
        </span>
      </span>
    </span>
  );
}

/* ----------------------------- Product card ---------------------------- */

function ProductCard({ product, wished, onToggleWish, onOpen }) {
  const [imgFailed, setImgFailed] = useState(false);

  const name = getName(product);
  const image = getImage(product);
  const rating = getRating(product);
  const reviews = getReviewCount(product);
  const original = getOriginalPrice(product);
  const hasDiscount =
    original != null && Number(original) > Number(product.price);

  const currency = product.currency || 'INR';

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
              alt={name}
              loading="lazy"
              draggable={false}
              onError={() => setImgFailed(true)}
              className="h-full w-full object-contain p-4 mix-blend-multiply transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none sm:p-6"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              No image available
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
              <span className="text-xs text-neutral-500">
                ({compactCount(reviews)})
              </span>
            )}
          </div>
        )}
      </button>

      {/* Wishlist button alag rakha hai, taaki button ke andar button na aaye. */}
      <button
        type="button"
        aria-label={
          wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`
        }
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

/* ----------------------------- Skeleton card --------------------------- */

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

/* ----------------------------- Main section ---------------------------- */

export default function MensShoes({
  title = "Men's Shoes",
  query = MENS_SHOES_QUERY,
}) {
  const { navigate } = useRouter();

  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [wishlist, setWishlist] = useState(() => new Set());
  const [edge, setEdge] = useState({ start: true, end: false });

  const scrollRef = useRef(null);

  /* ----------------------------- Fetch products ------------------------ */

  useEffect(() => {
    let active = true;

    const loadProducts = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await productApi.list(query);

        if (!active) return;

        const list = getProductList(response);

        // Sirf men's shoes category ke products dikhao.
        const filteredProducts = list
          .filter(isMensShoes)
          .slice(0, PRODUCT_COUNT);

        setProducts(filteredProducts);
      } catch (err) {
        if (active) {
          setError(err?.message || "Couldn't load men's shoes.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      active = false;
    };
  }, [query, attempt]);

  /* ----------------------------- Carousel controls --------------------- */

  const updateEdges = useCallback(() => {
    const element = scrollRef.current;

    if (!element) return;

    setEdge({
      start: element.scrollLeft <= 4,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) return undefined;

    updateEdges();

    element.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);

    return () => {
      element.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [products, loading, updateEdges]);

  const scrollByPage = (direction) => {
    const element = scrollRef.current;

    if (!element) return;

    element.scrollBy({
      left: direction * element.clientWidth * 0.85,
      behavior: 'smooth',
    });
  };

  /* ----------------------------- Wishlist ------------------------------ */

  const toggleWish = (id) => {
    setWishlist((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const arrowClass =
    'hidden h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35 md:flex';

  /* ----------------------------- Render section ------------------------ */

  return (
    <section className="w-full" aria-labelledby="mens-shoes-title">
      {/* Header */}
      <div className={`flex items-center justify-between gap-4 ${PAD_X}`}>
        <h2
          id="mens-shoes-title"
          style={{ fontFamily: 'Satoshi-Medium' }}
          className="text-2xl tracking-[-0.03em] text-neutral-900 sm:text-3xl"
        >
          {title}
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-label="Previous men's shoes"
            disabled={edge.start || loading || products.length === 0}
            onClick={() => scrollByPage(-1)}
            className={arrowClass}
          >
            <ChevronLeft size={20} />
          </button>

          <button
            type="button"
            aria-label="Next men's shoes"
            disabled={edge.end || loading || products.length === 0}
            onClick={() => scrollByPage(1)}
            className={arrowClass}
          >
            <ChevronRight size={20} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/shop?category=mens-shoes')}
            className="ml-2 rounded text-sm font-medium text-neutral-900 underline underline-offset-4 outline-none transition-opacity duration-200 hover:opacity-60 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            View all
          </button>
        </div>
      </div>

      {/* Product carousel: cards screen ke edge tak scroll hote hain */}
      <div className="mt-5 sm:mt-6">
        {loading ? (
          <div className={`flex gap-3 overflow-hidden sm:gap-5 ${PAD_X}`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : error ? (
          <div className={PAD_X}>
            <div className="flex flex-col items-start gap-4 rounded-lg bg-neutral-100 px-6 py-8">
              <p className="text-sm text-neutral-700">
                Men's shoes load nahi ho paaye. {error}
              </p>

              <button
                type="button"
                onClick={() => setAttempt((value) => value + 1)}
                className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-6 text-sm font-medium text-white transition-colors duration-200 hover:bg-neutral-700"
              >
                Try again
              </button>
            </div>
          </div>
        ) : products.length === 0 ? (
          <p className={`py-10 text-sm text-neutral-500 ${PAD_X}`}>
            Abhi koi men's shoes available nahi hain.
          </p>
        ) : (
          <div
            ref={scrollRef}
            className={`flex snap-x snap-proximity scroll-pl-5 gap-3 overflow-x-auto pb-2 sm:scroll-pl-8 sm:gap-5 lg:scroll-pl-10 ${PAD_X} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
          >
            {products.map((product) => {
              const id = getId(product);

              return (
                <ProductCard
                  key={id}
                  product={product}
                  wished={wishlist.has(id)}
                  onToggleWish={() => toggleWish(id)}
                  onOpen={() => navigate(getPath(product))}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}