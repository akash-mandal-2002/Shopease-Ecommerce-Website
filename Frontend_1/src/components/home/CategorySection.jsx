import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { productApi } from '../../services/productApi';
import { useRouter } from '../../context/RouterContext';

// Jin categories ki image na ho ya load na ho, unke liye emoji
const categoryIcons = {
  beauty: '💄',
  fragrances: '🌸',
  furniture: '🛋️',
  groceries: '🛒',
  'home-decoration': '🏠',
  'kitchen-accessories': '🍳',
  laptops: '💻',
  'mens-shirts': '👔',
  'mens-shoes': '👟',
  'mens-watches': '⌚',
  'mobile-accessories': '📱',
  motorcycle: '🏍️',
  'skin-care': '✨',
  smartphones: '📲',
  'sports-accessories': '⚽',
  sunglasses: '🕶️',
  tablets: '📋',
  tops: '👗',
  vehicle: '🚗',
  'womens-bags': '👜',
  'womens-dresses': '👠',
  'womens-jewellery': '💎',
  'womens-shoes': '👢',
  'womens-watches': '⏱️',
};

// Page ka side padding banner ke text jaisa hi, taaki left edge ek line mein rahe
const PAD_X = 'px-5 sm:px-8 lg:px-10';

// Skeleton, cards aur arrows ek hi size use karte hain
const CARD_W = 'w-[150px] sm:w-[200px] lg:w-[250px]';

export function CategoryCard({ category, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const fallback = categoryIcons[category.slug] || '📦';
  const hasImage = category.image && !imgFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      title={category.description || category.name}
      className={`group relative ${CARD_W} shrink-0 snap-start overflow-hidden rounded-lg bg-neutral-100 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2`}
    >
      <div className="relative aspect-[4/5] w-full">
        {hasImage ? (
          <img
            src={category.image}
            alt=""
            loading="lazy"
            draggable={false}
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center text-5xl sm:text-6xl"
          >
            {fallback}
          </span>
        )}

        {/* Neeche dark gradient, banner jaisa, taaki white text padhe */}
        {hasImage && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
        )}

        {/* Label: neeche-left */}
        <span
          className={`absolute inset-x-0 bottom-0 line-clamp-2 p-3 text-sm font-medium leading-tight tracking-[-0.01em] sm:p-4 sm:text-base ${
            hasImage ? 'text-white' : 'text-neutral-900'
          }`}
        >
          {category.name}
        </span>
      </div>
    </button>
  );
}

// Purane naam se import ho raha ho toh bhi kaam kare
export const CategoryCircle = CategoryCard;

export default function CategorySection() {
  const { navigate } = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    productApi
      .categories()
      .then((res) => setCategories(res.data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  // Home page par pehli 12
  const displayCategories = categories.slice(0, 12);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows, displayCategories.length, loading]);

  const scrollByPage = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <section className={`w-full ${PAD_X}`}>
        <div className="flex items-center justify-between">
          <div className="skeleton h-7 w-56" />
          <div className="skeleton h-4 w-14" />
        </div>
        <div className="mt-5 flex gap-3 overflow-hidden sm:mt-6 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`skeleton aspect-[4/5] ${CARD_W} shrink-0 rounded-lg`}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!displayCategories.length) return null;

  const arrowBtn =
    'absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg outline-none transition-colors duration-200 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:flex';

  return (
    <section className="w-full" aria-labelledby="popular-categories-title">
      {/* Header */}
      <div className={`flex items-baseline justify-between gap-4 ${PAD_X}`}>
        <h2
        
          id="popular-categories-title"
          style={{ fontFamily: 'Satoshi-Medium' }}
          className="text-2xl tracking-[-0.03em] text-neutral-900 sm:text-3xl"
        >
          Shop popular categories
        </h2>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="text-sm font-medium text-neutral-900 underline underline-offset-4 transition-opacity duration-200 hover:opacity-60"
        >
          View all
        </button>
      </div>

      {/* Category row: cards screen ke edge tak scroll hote hain */}
      <div className="relative mt-5 sm:mt-6">
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll categories left"
            onClick={() => scrollByPage(-1)}
            className={`${arrowBtn} left-4 lg:left-6`}
          >
            <ChevronLeft size={20} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className={`flex snap-x snap-proximity gap-3 overflow-x-auto scroll-pl-5 pb-1 sm:scroll-pl-8 sm:gap-4 lg:scroll-pl-10 ${PAD_X} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
        >
          {displayCategories.map((category) => (
            <CategoryCard
              key={category.id ?? category.slug}
              category={category}
              onClick={() => navigate(`/shop?category=${category.slug}`)}
            />
          ))}
        </div>

        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll categories right"
            onClick={() => scrollByPage(1)}
            className={`${arrowBtn} right-4 lg:right-6`}
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </section>
  );
}