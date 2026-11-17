import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Store } from 'lucide-react';
import { IsokoMark } from './IsokoLogo';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';

const MESSAGES = [
  { title: 'hero_msg1_title', body: 'hero_msg1_body' },
  { title: 'hero_msg2_title', body: 'hero_msg2_body' },
  { title: 'hero_msg3_title', body: 'hero_msg3_body' },
  { title: 'hero_msg4_title', body: 'hero_msg4_body' },
] as const;

const ROTATE_MS = 5500;

/**
 * Compact home banner: one short message at a time that rotates by itself,
 * can be swiped or tapped through, and always keeps the "open a shop" action.
 * The h1 stays in the page for screen readers and search engines.
 */
export const HeroTicker: React.FC = () => {
  const { t } = useT();
  const { navigate } = useMarketplace();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % MESSAGES.length), []);
  const prev = useCallback(() => setIndex((i) => (i - 1 + MESSAGES.length) % MESSAGES.length), []);

  useEffect(() => {
    if (paused) return;
    const reduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const timer = window.setInterval(next, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, next]);

  const current = MESSAGES[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('app_tagline')}
      className="relative overflow-hidden rounded-xl border border-[#D7DED8] bg-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        setPaused(true);
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchStartX.current;
        touchStartX.current = null;
        setPaused(false);
        if (start === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? start) - start;
        if (Math.abs(delta) > 40) {
          if (delta < 0) next();
          else prev();
        }
      }}
    >
      <h1 className="sr-only">{t('hero_title')}</h1>
      <div aria-hidden="true" className="imigongo-band" />
      <div className="flex items-center gap-2.5 px-3 pb-2 pt-2.5">
        <IsokoMark className="hidden h-8 w-8 shrink-0 min-[400px]:block" />
        <div
          key={index}
          aria-live="polite"
          className="isoko-ticker-in min-h-[52px] min-w-0 flex-1"
        >
          <p className="text-[14px] font-extrabold leading-[18px] text-[#1A1F1C]">{t(current.title)}</p>
          <p className="mt-0.5 text-[12px] leading-[16px] text-[#4B544F] line-clamp-2">{t(current.body)}</p>
        </div>
        <a
          href="/abacuruzi"
          onClick={(event) => {
            event.preventDefault();
            navigate('/abacuruzi');
          }}
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0B6E4F] px-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#075A43]"
        >
          <Store className="hidden h-4 w-4 min-[400px]:block" aria-hidden="true" />
          <span>{t('register_seller')}</span>
        </a>
      </div>
      <div role="tablist" aria-label={t('app_tagline')} className="flex items-center justify-center pb-1">
        {MESSAGES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${i + 1}/${MESSAGES.length}`}
            onClick={() => setIndex(i)}
            className="flex h-6 w-6 items-center justify-center"
          >
            <span
              className={`block h-1.5 rounded-full transition-all ${
                i === index ? 'w-4 bg-[#C0392B]' : 'w-1.5 bg-[#C9D2CB]'
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
};
