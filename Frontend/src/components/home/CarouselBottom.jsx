import { useCallback, useEffect, useRef, useState } from "react";

import Banner1 from "../../assets/Image/banner/Banner.png";
import Banner3 from "../../assets/Image/banner/Banner_1.png";
import Banner4 from "../../assets/Image/banner/Banner_2.png";

const SLIDES = [
  {
    src: Banner3,
    alt: "Black Friday Sale",
    title: "Black Friday Sale",
    position: "50% 15%",
    subtitle: "Hazaron products. Abhi, isi waqt.",
    buttons: [
      { label: "Shop Electronics", href: "/electronics" },
      { label: "Shop Fashion", href: "/fashion" },
    ],
  },
  {
    src: Banner4,
    alt: "New launch",
    title: "Introducing Puffer Series",
    subtitle: "Warm, lightweight aur har mausam ke liye.",
    buttons: [{ label: "Shop Now", href: "/new" }],
  },
  {
    src: Banner1,
    alt: "Winter Essentials",
    title: "Winter Essentials",
    subtitle: "Top brands par flat 40% tak ki chhoot.",
    buttons: [{ label: "Explore Collection", href: "/winter" }],
  },
];

export default function BannerSlider({ slides = SLIDES, interval = 3000 }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false); // pause button
  const [hoverPaused, setHoverPaused] = useState(false); // mouse / focus
  const [hidden, setHidden] = useState(false); // tab hidden
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  const startX = useRef(0);
  const width = useRef(1);
  const moved = useRef(false);
  const trackRef = useRef(null);

  const go = useCallback(
    (i) => setIndex(((i % count) + count) % count),
    [count],
  );
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count],
  );

  // Reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const paused = userPaused || hoverPaused || hidden || dragging;
  const autoplay = count > 1 && !reduceMotion;

  // Drag / swipe (buttons aur links par drag start nahi hota)
  const onPointerDown = (e) => {
    if (count < 2) return;
    if (e.target.closest("a, button")) return;
    startX.current = e.clientX;
    width.current = trackRef.current?.offsetWidth || 1;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 6) moved.current = true;
    setDragX(dx);
  };
  const endDrag = () => {
    if (!dragging) return;
    const threshold = width.current * 0.15;
    if (dragX > threshold) prev();
    else if (dragX < -threshold) next();
    setDragging(false);
    setDragX(0);
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  if (!count) return null;

  const offsetPct = -index * 100;
  const dragPct = dragging ? (dragX / width.current) * 100 : 0;

  return (
    <section
      className="relative w-full"
      aria-roledescription="carousel"
      aria-label="Promotional banners"
    >
      <div
        className="group relative overflow-hidden bg-neutral-900 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        {/* Track */}
        <div
          ref={trackRef}
          className="flex touch-pan-y select-none"
          style={{
            transform: `translateX(${offsetPct + dragPct}%)`,
            transition:
              dragging || reduceMotion
                ? "none"
                : "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)",
            cursor: count > 1 ? (dragging ? "grabbing" : "grab") : "default",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {slides.map((s, i) => {
            const active = i === index;
            return (
              <div
                key={i}
                className="relative aspect-[3/4] w-full shrink-0 sm:aspect-[16/9] lg:aspect-auto lg:h-[min(78vh,900px)]"
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={!active}
                inert={!active ? "" : undefined}
              >
                <picture>
                  {s.srcMobile && (
                    <source media="(max-width: 639px)" srcSet={s.srcMobile} />
                  )}
                  <img
                    src={s.src}
                    alt={s.alt || `Banner ${i + 1}`}
                    draggable={false}
                    loading={i === 0 ? "eager" : "lazy"}
                    style={{ objectPosition: s.position || "center" }}
                    className="absolute inset-0 block h-full w-full object-cover"
                  />
                </picture>

                {/* Neeche dark gradient taaki text saaf padhe */}
                {!s.dark && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                )}

                {/* Text: neeche-left */}
                {(s.title || s.subtitle || s.buttons?.length) && (
                  <div
                    className={`absolute inset-x-0 bottom-0 px-5 pb-16 sm:px-8 sm:pb-12 lg:px-10 lg:pb-14 ${
                      s.dark ? "text-neutral-900" : "text-white"
                    }`}
                  >
                    {s.title && (
                      <h2
                        style={{
                          fontFamily: "Satoshi-Regular",
                        }}
                        className="max-w-[18ch] text-4xl font-medium leading-[1.02] tracking-[-0.03em] sm:text-6xl lg:text-7xl"
                      >
                        {s.title}
                      </h2>
                    )}
                    {s.subtitle && (
                      <p className="mt-3 max-w-xl text-base font-normal tracking-[-0.01em] sm:text-xl lg:text-2xl">
                        {s.subtitle}
                      </p>
                    )}
                    {s.buttons?.length > 0 && (
                      <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
                        {s.buttons.slice(0, 2).map((b) => (
                          <a
                            key={b.label}
                            href={b.href}
                            onClick={(e) => {
                              if (moved.current) e.preventDefault();
                            }}
                            className="inline-flex h-11 items-center rounded-full bg-white px-6 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-12 sm:text-base"
                          >
                            {b.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Controls: neeche-right mein dots + pause button */}
        {count > 1 && (
          <div className="absolute bottom-4 right-4 flex items-center gap-3 sm:bottom-6 sm:right-8 lg:right-10">
            <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
              {slides.map((_, i) => {
                const active = i === index;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Go to banner ${i + 1}`}
                    aria-current={active}
                    className={`relative h-1.5 overflow-hidden rounded-full bg-white/50 transition-all duration-500 ${
                      active ? "w-8" : "w-1.5 hover:bg-white/80"
                    }`}
                  >
                    {active && (
                      <span
                        key={index}
                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                        style={{
                          width: autoplay ? undefined : "100%",
                          animation: autoplay
                            ? `bannerFill ${interval}ms linear forwards`
                            : "none",
                          animationPlayState: paused ? "paused" : "running",
                        }}
                        // Fill poora hote hi agla slide: timer aur progress hamesha sync
                        onAnimationEnd={next}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Play banners" : "Pause banners"}
              aria-pressed={userPaused}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {userPaused ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M3 1.5v11l9-5.5z" />
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <rect x="2.5" y="1.5" width="3" height="11" rx="0.5" />
                  <rect x="8.5" y="1.5" width="3" height="11" rx="0.5" />
                </svg>
              )}
            </button>
          </div>
        )}

        {/* Screen reader ke liye live region */}
        <p className="sr-only" aria-live="polite">
          Banner {index + 1} of {count}
        </p>
      </div>

      <style>{`
        @keyframes bannerFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
