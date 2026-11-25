import { Truck, RotateCcw, ShieldCheck, Headphones } from 'lucide-react';

// Same side padding as the other sections
const PAD_X = 'px-5 sm:px-8 lg:px-10';

// Edit the text to match your real policies
const DEFAULT_ITEMS = [
  {
    icon: Truck,
    title: 'Free delivery',
    text: 'On orders over ₹999, straight to your door.',
  },
  {
    icon: RotateCcw,
    title: 'Easy returns',
    text: '7-day hassle-free returns, no questions asked.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure payment',
    text: '100% protected checkout on every order.',
  },
  {
    icon: Headphones,
    title: '24/7 support',
    text: 'Real people ready to help whenever you need.',
  },
];

export default function TrustStrip({
  title = 'Shopping, made simple.',
  subtitle = 'From checkout to your doorstep, we take care of the details so you can focus on finding what you love.',
  items = DEFAULT_ITEMS,
}) {
  return (
    <section
      className={`w-full ${PAD_X}`}
      aria-labelledby="trust-strip-title"
    >
      <div className="grid gap-10 border-t border-neutral-900 pt-10 sm:pt-12 lg:grid-cols-12 lg:gap-16 lg:pt-14">
        {/* Left: editorial headline */}
        <div className="lg:col-span-5">
          <h2
            id="trust-strip-title"
            style={{ fontFamily: 'Satoshi-Medium' }}
            className="max-w-[14ch] text-4xl leading-[1.02] tracking-[-0.03em] text-neutral-900 sm:text-5xl lg:text-6xl"
          >
            {title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-neutral-600 sm:text-lg">
            {subtitle}
          </p>
        </div>

        {/* Right: 2x2 grid, no boxes, just fine lines */}
        <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:col-span-7">
          {items.map(({ icon: Icon, title: itemTitle, text }) => (
            <li key={itemTitle} className="border-t border-neutral-300 pt-5">
              <Icon
                size={30}
                strokeWidth={1.4}
                className="text-neutral-900"
                aria-hidden="true"
              />
              <h3
                style={{ fontFamily: 'Satoshi-Regular' }}
                className="mt-5 text-xl tracking-[-0.02em] text-neutral-900 sm:text-2xl"
              >
                {itemTitle}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-neutral-600 sm:text-base">
                {text}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}