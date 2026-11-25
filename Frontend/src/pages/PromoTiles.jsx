import { useState } from 'react';
import { useRouter } from '../context/RouterContext';

// Dono tiles ki alag-alag image. File ke naam apne hisaab se badal lo
import MenImage from '../assets/Image/promoTiles/PromoTiles (1).png';
import WomenImage from '../assets/Image/promoTiles/PromoTiles (2).png';

// Baaki sections jaisa hi side padding
const PAD_X = 'px-5 sm:px-8 lg:px-10';

/*
  Har tile ke fields:
  title    -> bada heading
  subtitle -> ek line ka text (optional)
  button   -> pill button ka text
  to       -> click par kahan jaana hai
  src      -> us tile ki image
  position -> objectPosition. Pehla number left-right, doosra upar-neeche.
              Sir kat raha ho toh doosra number chhota karo (jaise 0%, 10%)
*/
const DEFAULT_TILES = [
  {
    title: "Men's Style",
    subtitle: 'Modern basics, timeless fits.',
    button: 'Shop Men',
    to: '/shop?category=mens-shirts',
    src: MenImage,
    position: '50% 10%',
  },
  {
    title: "Women's Style",
    subtitle: 'Fresh looks for every day.',
    button: 'Shop Women',
    to: '/shop?category=tops',
    src: WomenImage,
    position: '50% 10%',
  },
];

function Tile({ tile, onOpen }) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = tile.src && !imgFailed;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-lg bg-neutral-200 text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:aspect-square lg:aspect-[6/5]"
    >
      {hasImage && (
        <img
          src={tile.src}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => setImgFailed(true)}
          style={{ objectPosition: tile.position || '50% 10%' }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />
      )}

      {/* Neeche dark gradient, banner jaisa, taaki white text padhe */}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t ${
          hasImage ? 'from-black/65 via-black/20' : 'from-neutral-900 via-neutral-900/60'
        } to-transparent`}
      />

      {/* Text: neeche-left */}
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
        <h2
          style={{ fontFamily: 'Satoshi-Regular' }}
          className="text-3xl leading-[1.05] tracking-[-0.03em] sm:text-5xl"
        >
          {tile.title}
        </h2>

        {tile.subtitle && (
          <p className="mt-2 text-sm tracking-[-0.01em] sm:text-lg">
            {tile.subtitle}
          </p>
        )}

        <span className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-neutral-900 transition-colors duration-200 group-hover:bg-neutral-200 sm:mt-6 sm:h-12 sm:text-base">
          {tile.button || 'Shop now'}
        </span>
      </div>
    </button>
  );
}

export default function PromoTiles({ tiles = DEFAULT_TILES }) {
  const { navigate } = useRouter();

  return (
    <section className={`w-full ${PAD_X}`} aria-label="Shop by style">
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        {tiles.map((tile) => (
          <Tile key={tile.title} tile={tile} onOpen={() => navigate(tile.to)} />
        ))}
      </div>
    </section>
  );
}