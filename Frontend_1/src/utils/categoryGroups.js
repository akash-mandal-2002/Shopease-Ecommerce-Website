

import Banner from '../assets/Image/Pages/MenBanner.webp'
import Banner1 from '../assets/Image/Pages/WomenBanner.webp'
import Banner2 from '../assets/Image/Pages/ElectronicBanner.webp'
import Banner3 from '../assets/Image/Pages/BeautyBanner.webp'
import Banner4 from '../assets/Image/Pages/GroceryBanner.webp'

export const CATEGORY_GROUPS = {
  men: {
    label: 'Men',
    banner: Banner,
    slugs: [
      'mens-shirts',
      'mens-shoes',
      'mens-watches',
      'sunglasses',
      'sports-accessories',
      'fragrances',
      'skin-care',
    ],
    prefixes: ['mens-'],
  },
  women: {
    label: 'Women',
    banner: Banner1,
    slugs: [
      'womens-dresses',
      'tops',
      'womens-shoes',
      'womens-bags',
      'womens-jewellery',
      'womens-watches',
      'sunglasses',
      'beauty',
      'skin-care',
      'fragrances',
    ],
    prefixes: ['womens-'],
  },
  electronics: {
    label: 'Electronics',
    banner: Banner2,
    slugs: ['laptops', 'smartphones', 'tablets', 'mobile-accessories'],
    prefixes: [],
  },
  beauty: {
    label: 'Beauty',
    banner: Banner3,
    slugs: ['beauty', 'skin-care', 'fragrances'],
    prefixes: [],
  },
  groceries: {
    label: 'Groceries',
    banner: Banner4,
    slugs: ['groceries', 'kitchen-accessories', 'home-decoration'],
    prefixes: [],
  },
};

export const getGroup = (key) => CATEGORY_GROUPS[key] || null;

export const groupPath = (key) => `/category/${key}`;
export const subcategoryPath = (key, slug) => `/category/${key}/${slug}`;

export const belongsToGroup = (group, slug) =>
  group.slugs.includes(slug) || group.prefixes.some((prefix) => slug.startsWith(prefix));

/** Keep only the API categories that belong to `group`, in display order. */
export function pickGroupCategories(group, categories) {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const ordered = group.slugs.map((slug) => bySlug.get(slug)).filter(Boolean);
  const extras = categories.filter(
    (category) => !group.slugs.includes(category.slug) && belongsToGroup(group, category.slug),
  );
  return [...ordered, ...extras];
}
