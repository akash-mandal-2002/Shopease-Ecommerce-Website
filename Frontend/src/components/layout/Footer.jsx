import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

const columns = [
  {
    title: 'Shop',
    links: [
      { label: 'Shop All', to: '/shop' },
      { label: 'Fashion', to: '/shop?category=fashion' },
      { label: 'Electronics', to: '/shop?category=electronics' },
      { label: 'Home & Living', to: '/shop?category=home' },
      { label: 'Beauty', to: '/shop?category=beauty' },
      { label: 'Books', to: '/shop?category=books' },
    ],
  },
  {
    title: 'My Account',
    links: [
      { label: 'Sign In', to: '/account' },
      { label: 'Register', to: '/account' },
      { label: 'Order Status', to: '/orders' },
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'Returns', to: '/orders' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Ordering', to: '/help' },
      { label: 'Returns and Refunds', to: '/help' },
      { label: 'Shipping and Delivery', to: '/help' },
      { label: 'Payment', to: '/help' },
      { label: 'Product and Sizing', to: '/help' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Use', to: '/terms' },
      { label: 'Accessibility', to: '/accessibility' },
    ],
  },
  {
    title: 'About Us',
    links: [
      { label: 'Our Story', to: '/about' },
      { label: 'The Project', to: '/about' },
      { label: 'Tech Stack', to: '/about' },
    ],
  },
  {
    title: 'Contact Us',
    links: [
      { label: 'Live Chat', to: '/contact' },
      { label: 'Email Us', to: '/contact' },
      { label: 'Sitemap', to: '/sitemap' },
    ],
  },
];

const socials = [
  { label: 'Instagram', Icon: Instagram },
  { label: 'Twitter', Icon: Twitter },
  { label: 'Facebook', Icon: Facebook },
  { label: 'YouTube', Icon: Youtube },
];

const linkClass =
  'rounded text-left text-sm text-neutral-400 outline-none transition-colors duration-200 hover:text-white focus-visible:text-white focus-visible:underline focus-visible:underline-offset-4 sm:text-[15px]';

export default function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="mt-16 w-full sm:mt-20">
      <div className="relative overflow-hidden rounded-t-2xl bg-neutral-950 text-neutral-300">
        <div className={`${PAD_X} pt-12 sm:pt-16`}>
          {/* Top: headline + call to action */}
          <div className="flex flex-col gap-8 border-b border-white/10 pb-10 sm:pb-14 md:flex-row md:items-end md:justify-between">
            <h2
              style={{ fontFamily: 'Satoshi-Regular' }}
              className="max-w-[16ch] text-4xl leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl"
            >
              Everything you need, in one place.
            </h2>

            <button
              type="button"
              onClick={() => navigate('/shop')}
              className="inline-flex h-12 w-fit items-center rounded-full bg-white px-7 text-base font-medium text-neutral-900 outline-none transition-colors duration-200 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            >
              Start Shopping
            </button>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-10 sm:grid-cols-3 sm:py-14 lg:grid-cols-6">
            {columns.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h3
                  style={{ fontFamily: 'Satoshi-Medium' }}
                  className="text-base tracking-[-0.01em] text-white sm:text-lg"
                >
                  {col.title}
                </h3>
                <ul className="mt-4 grid gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={() => navigate(link.to)}
                        className={linkClass}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* Brand, socials, legal */}
          <div className="flex flex-col gap-8 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-sm">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded text-2xl font-black tracking-[-0.06em] text-white outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                SHOPEASE<span className="text-orange-500">.</span>
              </button>
              <p className="mt-3 text-sm leading-6 text-neutral-400">
                Everyday products across tech, fashion, home, beauty and books.
              </p>
            </div>

            <div className="flex gap-3">
              {socials.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-neutral-200 outline-none transition-colors duration-200 hover:border-white hover:bg-white hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} ShopEase. A MERN-style BCA academic project.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/privacy')}
                className="rounded outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:underline"
              >
                Privacy Policy
              </button>
              <span className="h-3 w-px bg-white/20" aria-hidden="true" />
              <button
                type="button"
                onClick={() => navigate('/terms')}
                className="rounded outline-none transition-colors hover:text-white focus-visible:text-white focus-visible:underline"
              >
                Terms of Use
              </button>
            </div>
          </div>
        </div>

        {/* Big faded wordmark at the bottom, purely decorative */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none overflow-hidden px-5 sm:px-8 lg:px-10"
        >
          <p className="-mb-[0.14em] text-center text-[19vw] font-black leading-[0.85] tracking-[-0.06em] text-white/[0.06]">
            SHOPEASE
          </p>
        </div>
      </div>
    </footer>
  );
}