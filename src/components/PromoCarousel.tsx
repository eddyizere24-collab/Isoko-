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

  useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const timer = window.setInterval(goNext, 6500);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, goNext]);

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
      className="relative overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#064E3B]"
    >
      <div className="relative min-h-[152px] sm:min-h-[180px] flex items-center">
        <img
          key={activeSlide.id}
          src={activeSlide.imageUrl}
          alt={activeSlide.title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-[#064E3B]/95 via-[#064E3B]/80 to-[#064E3B]/35"
        />

        <div className="relative z-10 flex w-full flex-col justify-between gap-3 p-4 sm:p-6">
          <div className="max-w-lg">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#E8F3EE]">
              <span className="rounded bg-[#C0392B] px-1.5 py-0.5 text-[10px] leading-none text-white">
                Kwamamaza
              </span>
              {activeSlide.kicker && <span>{activeSlide.kicker}</span>}
              {slides.length > 1 && (
                <span className="tabular-nums text-white/80">
                  · {safeIndex + 1}/{slides.length}
                </span>
              )}
            </div>

            <h2 className="mt-1.5 text-[16px] font-bold leading-snug text-white sm:text-xl text-balance">
              {activeSlide.title}
            </h2>

            {activeSlide.subtitle && (
              <p className="mt-1 text-[12px] leading-relaxed text-[#E8F3EE]/90 sm:text-sm max-w-md line-clamp-2">
                {activeSlide.subtitle}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCtaClick}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[12px] font-semibold text-[#0B6E4F] hover:bg-[#E8F3EE] transition-colors"
              >
                <span>{activeSlide.ctaLabel || 'Reba byinshi'}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>

              {activeSlide.shopName && (
                <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#E8F3EE]/90">
                  <Store className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{activeSlide.shopName}</span>
                </span>
              )}
            </div>
          </div>

          {slides.length > 1 && (
            <div className="flex items-center justify-between gap-3">
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
                      className="flex h-6 items-center justify-center px-0.5 rounded"
                    >
                      <span
                        className={`block h-1.5 rounded-full transition-all ${
                          selected ? 'w-5 bg-[#C0392B]' : 'w-2 bg-white/45 hover:bg-white/75'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="Itangazo ribanza"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="Itangazo rikurikira"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white hover:bg-black/50"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
