import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { INITIAL_CATEGORIES } from '../data/categories';
import { getCategoryIcon as categoryIcon } from '../lib/categoryVisual';

/**
 * Mobile & Desktop Category Split View (/ibyiciro):
 * Rulebook §5: "urutonde rw'ibumoso (26%) + udukuta 3"
 */
export const CategoriesPage: React.FC = () => {
  const { bootstrap, navigate } = useMarketplace();
  const { t } = useT();

  const categories = bootstrap?.categories?.length ? bootstrap.categories : INITIAL_CATEGORIES;
  const topCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null),
    [categories]
  );

  const [selectedTopId, setSelectedTopId] = useState<number>(
    () => topCategories[0]?.id ?? 1
  );

  const activeTop =
    topCategories.find((c) => c.id === selectedTopId) ?? topCategories[0];

  const subCategories = useMemo(() => {
    if (!activeTop) return [];
    const kids = categories.filter((c) => c.parent_id === activeTop.id);
    return kids.length > 0 ? kids : [activeTop];
  }, [categories, activeTop]);

  return (
    <main className="mx-auto flex min-h-[calc(100vh-120px)] max-w-7xl bg-white border-x border-[#E3E0D8]">
      {/* Left Rail — strictly 26% width on mobile */}
      <aside
        aria-label={t('categories')}
        className="w-[26%] min-w-[90px] max-w-[220px] shrink-0 border-r border-[#E3E0D8] bg-[#F7F5F0]"
      >
        <div className="divide-y divide-[#E3E0D8]">
          {topCategories.map((cat) => {
            const active = activeTop?.id === cat.id;
            const Icon = categoryIcon(cat.slug);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedTopId(cat.id)}
                className={`relative flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-1.5 py-2 text-center transition-colors ${
                  active
                    ? 'bg-white font-semibold text-[#214E43]'
                    : 'font-medium text-[#68716D] hover:bg-white/60'
                }`}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2 left-0 top-2 w-[3px] bg-[#214E43]"
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="text-[11px] leading-[13px] line-clamp-2">{cat.name_rw}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Right Subcategory Grid — 3 columns mobile (§5) */}
      <section className="flex-1 min-w-0 p-2.5 sm:p-5">
        {activeTop && (
          <>
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#E3E0D8] pb-2">
              <h1 className="text-[15px] font-semibold text-[#202724] truncate">
                {activeTop.name_rw}
              </h1>
              <a
                href={`/c/${activeTop.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/c/${activeTop.slug}`);
                }}
                className="inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-semibold text-[#214E43] hover:underline"
              >
                <span>{t('see_all')}</span>
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 sm:gap-3">
              {subCategories.map((sub) => {
                const Icon = categoryIcon(sub.slug);
                return (
                  <a
                    key={sub.id}
                    href={`/c/${sub.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/c/${sub.slug}`);
                    }}
                    className="flex flex-col items-center rounded-md border border-[#E3E0D8] bg-white p-2 text-center hover:border-[#214E43] transition-colors"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[#E9F0EB] text-[#214E43]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="mt-1.5 text-[11px] font-medium leading-[14px] text-[#202724] line-clamp-2">
                      {sub.name_rw}
                    </span>
                  </a>
                );
              })}
            </div>
          </>
        )}
      </section>
    </main>
  );
};
