import { useState } from 'react';

// Same side padding as every other section
const PAD_X = 'px-5 sm:px-8 lg:px-10';

/*
  Shared layout for Login and Register.
  Props:
  eyebrow  -> small line above the title (desktop panel only)
  title    -> big headline on the left panel
  text     -> one line under the title
  perks    -> list of short bullet points
  image    -> optional photo for the left panel (dark gradient is used if missing)
  position -> objectPosition for that photo, e.g. "50% 20%"
*/
export default function AuthLayout({
  eyebrow,
  title,
  text,
  perks = [],
  image = null,
  position = '50% 20%',
  children,
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = image && !imgFailed;

  return (
    <main className="w-full pb-16 pt-24 sm:pb-20">
      <div className={PAD_X}>
        <div
          className="grid gap-4 lg:grid-cols-2"
          style={{ minHeight: 'calc(100svh - 9rem)' }}
        >
          {/* Left: brand panel (desktop only), same look as the banners */}
          <aside
            className="relative hidden overflow-hidden rounded-lg text-white lg:flex"
            style={{
              backgroundColor: '#171717',
              backgroundImage:
                'linear-gradient(135deg, #262626 0%, #171717 55%, #0a0a0a 100%)',
            }}
          >
            {hasImage && (
              <img
                src={image}
                alt=""
                loading="eager"
                decoding="async"
                draggable={false}
                onError={() => setImgFailed(true)}
                style={{ objectPosition: position }}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}

            {!hasImage && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
              />
            )}

            <div
              className="pointer-events-none absolute inset-x-0 bottom-0"
              style={{
                height: '75%',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)',
              }}
            />

            <div className="relative mt-auto w-full p-10 xl:p-14">
              {eyebrow && (
                <p className="text-sm text-neutral-300">{eyebrow}</p>
              )}

              <p
                style={{ fontFamily: 'Satoshi-Regular' }}
                className="mt-3 max-w-[14ch] text-5xl leading-[0.98] tracking-[-0.05em] xl:text-6xl"
              >
                {title}
              </p>

              {text && (
                <p className="mt-4 max-w-md text-lg tracking-[-0.01em] text-neutral-200">
                  {text}
                </p>
              )}

              {perks.length > 0 && (
                <ul className="mt-8 grid gap-3">
                  {perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-3 text-base text-neutral-200">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-neutral-500">
                        <svg
                          viewBox="0 0 20 20"
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M4 10.5l4 4 8-9" />
                        </svg>
                      </span>
                      {perk}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Right: form */}
          <section className="flex items-center justify-center py-4 sm:py-8 lg:px-10">
            <div className="w-full max-w-md">{children}</div>
          </section>
        </div>
      </div>
    </main>
  );
}