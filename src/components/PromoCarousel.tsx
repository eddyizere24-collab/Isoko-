import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { trackCampaignEvent } from '../lib/api';
import { getSessionId } from '../lib/storage';
import type { PromoCampaign } from '../types/marketplace';

interface PromoCarouselProps {
  campaigns: PromoCampaign[];
}

export const PromoCarousel: React.FC<PromoCarouselProps> = ({ campaigns }) => {
  const { navigate } = useMarketplace();
  const slides = campaigns.filter((c) => c.active);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const impressedRef = useRef<Set<string>>(new Set());

  const safeIndex = slides.length > 0 ? index % slides.length : 0;
  const activeSlide = slides[safeIndex];

  const goNext = useCallback(() => {
    if (slides.length <= 1) return;
    setIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length <= 1) return;
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Respect prefers-reduced-motion and pause on hover/focus
  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const timer = window.setInterval(goNext, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, goNext]);

  // Record impression when slide becomes visible
  useEffect(() => {
    if (!activeSlide || impressedRef.current.has(activeSlide.id)) return;
    impressedRef.current.add(activeSlide.id);
    trackCampaignEvent(activeSlide.id, 'impression', getSessionId());
  }, [activeSlide]);

  if (!activeSlide) return null;

  const handleCtaClick = () => {
    trackCampaignEvent(activeSlide.id, 'click', getSessionId());
    navigate(activeSlide.targetPath || '/shakisha');
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Kwamamaza amaduka n'ibicuruzwa byatoranyijwe"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          goNext();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goPrev();
        }
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const delta = endX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(delta) > 45) {
          if (delta < 0) goNext();
          else goPrev();
        }
      }}
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#0F1E18]"
    >
      <div className="relative min-h-[260px] sm:min-h-[300px] lg:min-h-[320px] flex items-end sm:items-center">
        <img
          key={activeSlide.id}
          src={activeSlide.imageUrl}
          alt={activeSlide.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
        />
        {/* Measured scrim ensuring >= 4.5:1 contrast for overlaid copy */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#091410]/92 via-[#091410]/70 to-[#091410]/25"
        />

        <div className="relative z-10 flex w-full flex-col justify-between gap-5 p-5 sm:p-8 lg:p-10">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#F6C873]">
              <span>Kwamamaza</span>
              {activeSlide.kicker && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{activeSlide.kicker}</span>
                </>
              )}
              {slides.length > 1 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-white/80">
                    {safeIndex + 1} / {slides.length}
                  </span>
                </>
              )}
            </div>

            <h2 className="mt-2 font-display text-xl font-bold leading-tight text-white sm:text-3xl text-balance">
              {activeSlide.title}
            </h2>

            {activeSlide.subtitle && (
              <p className="mt-2.5 text-sm leading-relaxed text-white/90 sm:text-base max-w-lg">
                {activeSlide.subtitle}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCtaClick}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#E8A33D] px-5 py-2.5 text-sm font-bold text-[#141A17] hover:bg-[#F1B456] transition-colors"
              >
                <span>{activeSlide.ctaLabel || 'Reba byinshi'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>

              {activeSlide.shopName && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/85">
                  <Store className="h-3.5 w-3.5 text-[#F6C873]" aria-hidden="true" />
                  <span>{activeSlide.shopName}</span>
                </span>
              )}
            </div>
          </div>

          {slides.length > 1 && (
            <div className="flex items-center justify-between gap-4 pt-1">
              <div role="tablist" aria-label="Hitamo itangazo" className="flex items-center gap-1">
                {slides.map((s, idx) => {
                  const selected = idx === safeIndex;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-label={`Itangazo ${idx + 1}: ${s.title}`}
                      onClick={() => setIndex(idx)}
                      className="flex min-h-[44px] min-w-[28px] items-center justify-center px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E8A33D] rounded-lg"
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all ${
                          selected ? 'w-7 bg-[#E8A33D]' : 'w-3 bg-white/45 hover:bg-white/75'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Itangazo ribanza"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/25 bg-black/35 text-white hover:bg-black/55 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Itangazo rikurikira"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-white/25 bg-black/35 text-white hover:bg-black/55 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
