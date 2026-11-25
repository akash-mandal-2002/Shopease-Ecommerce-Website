import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "../../context/RouterContext";

import Slider1 from "../../assets/Image/Home/carousel (1).webp";
import Slider2 from "../../assets/Image/Home/carousel (2).webp";
import Slider3 from "../../assets/Image/Home/carousel (3).webp";
import Slider4 from "../../assets/Image/Home/carousel.webp";

const slides = [
  {
    id: 1,
    image: Slider1,
    title: "Everyday upgrades, thoughtfully chosen.",
    text: "Discover modern essentials across tech, fashion and home.",
    action: "Shop collection",
    path: "/shop",
  },
  {
    id: 2,
    image: Slider2,
    title: "Make your space feel like yours.",
    text: "Quietly premium pieces for work, rest and everything between.",
    action: "Explore home",
    path: "/shop?category=home-decoration",
  },
  {
    id: 3,
    image: Slider3,
    title: "Style that works every day.",
    text: "Build a wardrobe around versatile, easy-to-wear essentials.",
    action: "Shop fashion",
    path: "/shop?category=mens-shirts",
  },
  {
    id: 4,
    image: Slider4,
    title: "Technology, made more useful.",
    text: "Audio, wearables and desk gear selected for modern routines.",
    action: "Shop electronics",
    path: "/shop?category=laptops",
  },
];

const SLIDE_DURATION = 1000; // ms, horizontal slide
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const TEXT_DURATION = 800; // ms, translateY + opacity
const TEXT_DELAY = 350; // ms, starts while the image is still settling
const TEXT_STAGGER = 90; // ms between heading → paragraph → buttons
const TEXT_OFFSET = 32; // px, how far the text travels upward

const AUTOPLAY_MS = 3000;
const SWIPE_THRESHOLD = 60;

const total = slides.length;

const extendedSlides = [slides[total - 1], ...slides, slides[0]];

export default function Carousel() {
  const { navigate } = useRouter();

  const [pos, setPos] = useState(1); // position inside extendedSlides
  const [animate, setAnimate] = useState(true);
  const [userPaused, setUserPaused] = useState(false); // pause button
  const [hoverPaused, setHoverPaused] = useState(false); // mouse over
  const [hidden, setHidden] = useState(false); // browser tab hidden
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false); // lets the first slide's text animate on load

  const posRef = useRef(1);
  const lockRef = useRef(false);
  const settleTimerRef = useRef(null);
  const retryTimerRef = useRef(null);
  const touchRef = useRef(null);

  const paused = userPaused || hoverPaused || hidden || dragging;
  const autoplay = total > 1 && !reduceMotion;
  const noMotion = !animate || reduceMotion;

  // Which real slide is showing (clones map back to the real ones)
  const realIndex = pos === 0 ? total - 1 : pos === total + 1 ? 0 : pos - 1;

  /* First load: play the text entrance once the page has painted */
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setReady(true))
    );
    return () => cancelAnimationFrame(id);
  }, []);

  /* Reduced motion */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* Pause while the browser tab is hidden */
  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(settleTimerRef.current);
      clearTimeout(retryTimerRef.current);
    },
    []
  );

  /* After a slide finishes: if we're on a clone, jump to the real slide
     with transitions disabled (visually identical, so no flicker). */
  const settle = useCallback(() => {
    const current = posRef.current;
    let target = null;

    if (current === 0) target = total;
    else if (current === total + 1) target = 1;

    if (target === null) {
      lockRef.current = false;
      return;
    }

    posRef.current = target;
    setAnimate(false);
    setPos(target);

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        lockRef.current = false;
      })
    );
  }, []);

  const moveTo = useCallback(
    (target) => {
      if (lockRef.current) return; // one slide at a time
      if (target === posRef.current) return;
      lockRef.current = true;

      posRef.current = target;
      setAnimate(true);
      setPos(target);

      clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(settle, SLIDE_DURATION + 30);
    },
    [settle]
  );

  const next = useCallback(() => moveTo(posRef.current + 1), [moveTo]);
  const prev = useCallback(() => moveTo(posRef.current - 1), [moveTo]);

  /* Autoplay is driven by the active dot's progress animation ending,
     so the progress bar and the slide change can never go out of sync.
     If a slide is mid-move at that moment, retry a moment later. */
  const advance = () => {
    if (lockRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(advance, 120);
      return;
    }
    next();
  };

  /* Touch swipe — the track follows the finger, then snaps */
  const handleTouchStart = (e) => {
    if (lockRef.current) return;

    touchRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      horizontal: null,
    };
  };

  const handleTouchMove = (e) => {
    const t = touchRef.current;
    if (!t) return;

    const dx = e.touches[0].clientX - t.x;
    const dy = e.touches[0].clientY - t.y;

    if (t.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      t.horizontal = Math.abs(dx) > Math.abs(dy);
    }

    if (!t.horizontal) return;

    setDragging(true);
    setDragX(dx);
  };

  const handleTouchEnd = (e) => {
    const t = touchRef.current;
    touchRef.current = null;

    if (!t || !t.horizontal) return;

    const dx = e.changedTouches[0].clientX - t.x;

    setDragging(false);
    setDragX(0);

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) next();
      else prev();
    }
  };

  /* Keyboard */
  const handleKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  /* Same entrance for every slide: translateY + opacity, staggered by `order` */
  const reveal = (active, order) => ({
    opacity: active ? 1 : 0,
    transform: active
      ? "translate3d(0, 0, 0)"
      : `translate3d(0, ${TEXT_OFFSET}px, 0)`,
    transition: noMotion
      ? "none"
      : active
        ? `opacity ${TEXT_DURATION}ms ${EASE} ${TEXT_DELAY + order * TEXT_STAGGER}ms, transform ${TEXT_DURATION}ms ${EASE} ${TEXT_DELAY + order * TEXT_STAGGER}ms`
        : // leaving: just fade, then reset the offset once the slide is off-screen
          `opacity 350ms ease-out 0ms, transform 0ms linear ${SLIDE_DURATION}ms`,
    willChange: "transform, opacity",
  });

  const circleBtn =
    "flex h-9 w-9 items-center justify-center rounded-full text-white outline-none transition-colors duration-200 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white active:scale-95 sm:h-10 sm:w-10";

  return (
    <section
      className="relative w-full touch-pan-y overflow-hidden bg-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      {/* Hero */}
      <div className="relative h-[78svh] min-h-[620px] max-h-[900px] w-full sm:h-[82svh] lg:h-[calc(100svh-16px)]">
        {/* Sliding track */}
        <div
          className="flex h-full w-full"
          style={{
            transform: `translate3d(calc(${-pos * 100}% + ${dragX}px), 0, 0)`,
            transition:
              animate && !dragging && !reduceMotion
                ? `transform ${SLIDE_DURATION}ms ${EASE}`
                : "none",
            willChange: "transform",
          }}
        >
          {extendedSlides.map((item, j) => {
            const isCurrent = j === pos;
            const isActive = isCurrent && ready;

            return (
              <div
                key={`${item.id}-${j}`}
                className="relative h-full w-full shrink-0 basis-full overflow-hidden"
                aria-hidden={!isCurrent}
                inert={!isCurrent ? "" : undefined}
                role="group"
                aria-roledescription="slide"
              >
                {/* Image */}
                <img
                  src={item.image}
                  alt=""
                  className="h-full w-full object-cover object-center"
                  loading={j === 1 ? "eager" : "lazy"}
                  fetchPriority={j === 1 ? "high" : "auto"}
                  decoding="async"
                  draggable="false"
                />

                {/* Editorial overlays */}
                <div className="absolute inset-0 bg-black/[0.08]" />

                <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/10 to-transparent" />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-[1560px] px-6 pb-20 sm:px-10 sm:pb-20 lg:px-12 lg:pb-20">
                  <div className="max-w-[850px] text-white">
                    {/* Heading */}
                    <h2
                      style={{
                        fontFamily: "Satoshi-Regular",
                        ...reveal(isActive, 0),
                      }}
                      className="max-w-[850px] text-[40px] leading-[0.95] tracking-[-0.05em] text-white sm:text-6xl lg:text-[69px] lg:leading-[1] lg:tracking-[-0.01em]"
                    >
                      {item.title}
                    </h2>

                    {/* Description */}
                    <p
                      style={reveal(isActive, 1)}
                      className="mt-6 max-w-xl text-sm leading-6 text-white/95 sm:text-base lg:text-2xl"
                    >
                      {item.text}
                    </p>

                    {/* Buttons */}
                    <div
                      style={reveal(isActive, 2)}
                      className="mt-7 flex flex-wrap gap-3"
                    >
                      <button
                        style={{ fontFamily: "Satoshi-Medium" }}
                        onClick={() => navigate(item.path)}
                        tabIndex={isCurrent ? 0 : -1}
                        className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-950 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-xl sm:px-7"
                      >
                        {item.action}
                      </button>

                      <button
                        style={{ fontFamily: "Satoshi-Medium" }}
                        onClick={() => navigate("/shop")}
                        tabIndex={isCurrent ? 0 : -1}
                        className="rounded-full border border-white/50 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-gray-950 sm:px-7"
                      >
                        Explore all
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Controls: arrows + progress dots in one pill, and a separate pause button */}
        <div className="absolute bottom-5 right-4 z-20 flex items-center gap-2 sm:bottom-9 sm:right-10 sm:gap-3">
          <div className="flex items-center gap-1 rounded-full bg-black/35 p-1 backdrop-blur-md sm:gap-2">
           

            <div className="flex items-center gap-2 px-1">
              {slides.map((s, i) => {
                const active = i === realIndex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => moveTo(i + 1)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={active}
                    className={`relative h-1.5 overflow-hidden rounded-full bg-white/50 outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 ${
                      active ? "w-8" : "w-1.5 hover:bg-white/80"
                    }`}
                  >
                    {active && (
                      <span
                        key={realIndex}
                        className="absolute inset-y-0 left-0 rounded-full bg-white"
                        style={{
                          width: autoplay ? undefined : "100%",
                          animation: autoplay
                            ? `carouselFill ${AUTOPLAY_MS}ms linear forwards`
                            : "none",
                          animationPlayState: paused ? "paused" : "running",
                        }}
                        onAnimationEnd={advance}
                      />
                    )}
                  </button>
                );
              })}
            </div>

           
          </div>

          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
            aria-pressed={userPaused}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white outline-none backdrop-blur-md transition-colors duration-200 hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white sm:h-12 sm:w-12"
          >
            {userPaused ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <path d="M3 1.5v11l9-5.5z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <rect x="2.5" y="1.5" width="3" height="11" rx="0.5" />
                <rect x="8.5" y="1.5" width="3" height="11" rx="0.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Live region for screen readers */}
        <p className="sr-only" aria-live="polite">
          Slide {realIndex + 1} of {total}
        </p>
      </div>

      <style>{`
        @keyframes carouselFill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}