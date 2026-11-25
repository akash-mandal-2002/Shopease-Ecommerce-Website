import { useEffect, useMemo, useState } from 'react';
import { productApi } from '../services/productApi';
import { useRouter } from '../context/RouterContext';
import { EmptyState, ErrorState } from '../components/common/States';
import Button from '../components/common/Button';
import Shop from './Shop';
import {
  belongsToGroup,
  getGroup,
  groupPath,
  pickGroupCategories,
  subcategoryPath,
} from '../utils/categoryGroups';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const prettyName = (category) =>
  String(
    category.name || category.title || category.label || category.slug || ''
  )
    .replace(/[-_]/g, ' ')
    .replace(/\bmens\b/gi, "men's")
    .replace(/\bwomens\b/gi, "women's");

export default function Category({ group: groupKey, sub }) {
  const { navigate } = useRouter();
  const group = getGroup(groupKey);

  const notFound = (
    <main className="mx-auto max-w-2xl px-4 py-20">
      <EmptyState title="Category not found" message="The category you requested does not exist." />
      <div className="mt-5 text-center">
        <Button onClick={() => navigate(group ? groupPath(groupKey) : '/')}>
          {group ? `Back to ${group.label}` : 'Back home'}
        </Button>
      </div>
    </main>
  );

  if (!group) return notFound;

  // Subcategory page: same Shop page / filters / grid, locked to one category.
  if (sub) {
    if (!belongsToGroup(group, sub)) return notFound;
    return (
      <Shop
        key={sub}
        lockedCategory={sub}
        groupKey={groupKey}
        backTo={{ label: group.label, path: groupPath(groupKey) }}
      />
    );
  }

  return <GroupPage key={groupKey} groupKey={groupKey} group={group} />;
}

/* ------------------------------ Banner ------------------------------ */
// Full-width hero: text bottom-left, white pill links, dark gradient (same as home banner)
function GroupBanner({ src, position, tone, label, subtitle, links, onHome, onLink }) {
  const [failed, setFailed] = useState(false);
  const hasImage = src && !failed;

  return (
    <section
      className={`relative w-full overflow-hidden ${tone || 'bg-neutral-800'}`}
      aria-label={`${label} banner`}
    >
      <div className="relative h-[58svh] min-h-[420px] max-h-[720px] w-full sm:h-[64svh] lg:h-[70svh]">
        {hasImage && (
          <img
            src={src}
            alt=""
            loading="eager"
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
            style={{ objectPosition: position || '50% 0%' }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        <div className="pointer-events-none absolute inset-0 bg-black/[0.08]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />

        <div className={`absolute inset-x-0 bottom-0 ${PAD_X} pb-8 text-white sm:pb-12 lg:pb-14`}>
          <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/80">
            <ol className="flex items-center gap-2">
              <li>
                <button
                  type="button"
                  onClick={onHome}
                  className="rounded outline-none transition-colors hover:text-white focus-visible:underline"
                >
                  Home
                </button>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-white">
                {label}
              </li>
            </ol>
          </nav>

          <h1
            style={{ fontFamily: 'Satoshi-Regular' }}
            className="max-w-[18ch] text-5xl leading-[0.98] tracking-[-0.05em] sm:text-6xl lg:text-7xl"
          >
            {label}
          </h1>

          {subtitle && (
            <p className="mt-3 max-w-xl text-base tracking-[-0.01em] text-white/95 sm:text-xl lg:text-2xl">
              {subtitle}
            </p>
          )}

          {links.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              {links.map((l) => (
                <button
                  key={l.slug}
                  type="button"
                  onClick={() => onLink(l.slug)}
                  style={{ fontFamily: 'Satoshi-Medium' }}
                  className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium capitalize text-neutral-900 outline-none transition-colors duration-200 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 sm:h-12 sm:text-base"
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Card ------------------------------- */
function CategoryCard({ category, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const name = prettyName(category);
  const image = category.image || category.image_url || category.thumbnail;

  return (
    <button
      type="button"
      onClick={onClick}
      title={category.description || name}
      className="group block w-full text-left outline-none"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-100 ring-2 ring-inset ring-transparent transition-shadow duration-200 group-focus-visible:ring-neutral-900">
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
          <div className="flex h-full w-full items-center justify-center text-5xl font-medium text-neutral-300">
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Only shown when your data really has a discount for this category */}
        {category.discount && (
          <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-900">
            {category.discount}
          </span>
        )}
      </div>

      <p className="mt-3 truncate text-sm font-medium capitalize tracking-[-0.01em] text-neutral-900 group-hover:underline group-hover:underline-offset-2 sm:text-base">
        {name}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500 sm:text-sm">Shop now</p>
    </button>
  );
}

/* ---------------------------- Group page ---------------------------- */
function GroupPage({ groupKey, group }) {
  const { navigate } = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    productApi
      .categories()
      .then((res) => {
        if (active) {
          setCategories(res.data || []);
          setError('');
        }
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
  }, [groupKey]);

  const subcategories = useMemo(
    () => pickGroupCategories(group, categories),
    [group, categories]
  );

  // First 3 subcategories become quick links inside the banner
  const bannerLinks = useMemo(
    () =>
      subcategories.slice(0, 3).map((c) => ({
        slug: c.slug,
        label: prettyName(c),
      })),
    [subcategories]
  );

  const gridClass =
    'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6';

  return (
    <main className="w-full pb-16 pt-24 sm:pb-20">
      <GroupBanner
        key={groupKey}
        src={group.banner}
        position={group.bannerPosition}
        tone={group.tone}
        label={group.label}
        subtitle={group.description || `Explore everything in ${group.label}.`}
        links={bannerLinks}
        onHome={() => navigate('/')}
        onLink={(slug) => navigate(subcategoryPath(groupKey, slug))}
      />

      <section className={`${PAD_X} mt-10 sm:mt-14`} aria-labelledby="shop-by-category">
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="shop-by-category"
            style={{ fontFamily: 'Satoshi-Medium' }}
            className="text-2xl tracking-[-0.03em] text-neutral-900 sm:text-3xl"
          >
            Shop by category
          </h2>
          {!loading && !error && subcategories.length > 0 && (
            <span className="text-sm text-neutral-500">
              {subcategories.length} categories
            </span>
          )}
        </div>

        <div className="mt-5 sm:mt-6">
          {error ? (
            <ErrorState message={error} />
          ) : loading ? (
            <div className={gridClass}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="skeleton aspect-[4/5] w-full rounded-lg" />
                  <div className="skeleton mt-3 h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : subcategories.length === 0 ? (
            <EmptyState
              title="No categories yet"
              message={`There are no ${group.label} categories to show right now.`}
            />
          ) : (
            <div className={gridClass}>
              {subcategories.map((category) => (
                <CategoryCard
                  key={category.slug}
                  category={category}
                  onClick={() => navigate(subcategoryPath(groupKey, category.slug))}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}