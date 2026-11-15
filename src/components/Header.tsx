import React, { useMemo, useState } from 'react';
import { ChevronDown, LogOut, MapPin, Search, ShoppingCart, User } from 'lucide-react';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { IsokoWordmark, RwandanGeometricPattern } from './IsokoLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

const FALLBACK_CATEGORIES = [
  { id: 1, parent_id: null, slug: 'inkweto', name_rw: 'Inkweto' },
  { id: 2, parent_id: null, slug: 'imyenda', name_rw: 'Imyenda' },
  { id: 3, parent_id: null, slug: 'amasogisi', name_rw: "Amasogisi n'imbere" },
  { id: 4, parent_id: null, slug: 'ibindi', name_rw: 'Ibikoresho' },
];

export const Header: React.FC<{ onOpenCategories?: () => void }> = ({ onOpenCategories }) => {
  const {
    pathname,
    searchParams,
    navigate,
    cartCount,
    location,
    setLocationModalOpen,
    bootstrap,
    authProfile,
    logout,
  } = useMarketplace();
  const { t } = useT();

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !bootstrap) return [];
    const out: Array<{ label: string; sub?: string; to: string }> = [];

    for (const cat of bootstrap.categories) {
      if (cat.name_rw.toLowerCase().includes(q)) {
        out.push({ label: cat.name_rw, sub: t('category_label'), to: `/c/${cat.slug}` });
      }
      if (out.length >= 3) break;
    }

    const seenBrands = new Set<string>();
    for (const p of bootstrap.products) {
      if (p.brand && p.brand.toLowerCase().includes(q) && !seenBrands.has(p.brand)) {
        seenBrands.add(p.brand);
        out.push({
          label: p.brand,
          sub: t('brand_label'),
          to: `/shakisha?q=${encodeURIComponent(p.brand)}`,
        });
      }
      if (out.length >= 5) break;
    }

    for (const p of bootstrap.products) {
      if (p.name.toLowerCase().includes(q)) {
        out.push({ label: p.name, sub: t('products'), to: `/p/${p.id}` });
      }
      if (out.length >= 8) break;
    }

    return out;
  }, [query, bootstrap, t]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmed = query.trim();
    navigate(trimmed ? `/shakisha?q=${encodeURIComponent(trimmed)}` : '/shakisha');
  };

  const accountHref = '/konti';
  const accountLabel = t('account');

  const handleHeaderLogout = async () => {
    setLogoutError(null);
    setLogoutBusy(true);
    try {
      await logout();
    } catch (err) {
      setLogoutError(err instanceof Error ? err.message : 'Ntibishobotse gusohoka. Ongera ugerageze.');
    } finally {
      setLogoutBusy(false);
    }
  };

  const categories = bootstrap?.categories?.length ? bootstrap.categories : FALLBACK_CATEGORIES;
  const locationLabel = location ? location.districtName : 'Kigali';
  const showBuyerRows = !pathname.startsWith('/umucuruzi') && !pathname.startsWith('/admin');
  const sortParam = searchParams.get('sort') ?? '';
  const discountedParam = searchParams.get('discounted') === '1';

  const modeTabs = [
    {
      id: 'products',
      label: t('products'),
      active: (pathname === '/' || pathname === '/shakisha') && !discountedParam && sortParam !== 'nearby',
      onClick: () => navigate('/'),
    },
    {
      id: 'shops',
      label: t('shops'),
      active: pathname.startsWith('/i/') || pathname.startsWith('/s/'),
      onClick: () => navigate('/shakisha?sort=popular'),
    },
    {
      id: 'nearby',
      label: t('nearby'),
      active: sortParam === 'nearby',
      onClick: () => {
        if (location?.districtId) {
          navigate(`/shakisha?district=${location.districtId}&sort=nearby`);
        } else {
          setLocationModalOpen(true);
        }
      },
    },
    {
      id: 'discounted',
      label: t('discounted'),
      active: discountedParam,
      onClick: () => navigate('/shakisha?discounted=1'),
    },
    {
      id: 'sell',
      label: t('sell'),
      active: pathname === '/abacuruzi',
      onClick: () => navigate('/abacuruzi'),
    },
  ];

  return (
    <>
      {/* Sticky Top Header (52px mobile / 58px desktop) + 8px 100%-opacity SVG Imigongo strip */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center gap-2 px-2.5 sm:px-6 lg:h-[58px] lg:gap-4">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            aria-label={`Isoko ${t('home')}`}
            className="inline-flex min-h-[40px] items-center whitespace-nowrap shrink-0"
          >
            <IsokoWordmark
              markClassName="h-6 w-6 lg:h-7 lg:w-7"
              wordmarkClassName="h-[16px] w-auto lg:h-[18px]"
            />
          </a>

          {showBuyerRows ? (
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 lg:max-w-[560px]">
              <label htmlFor="global-search" className="sr-only">
                {t('search_placeholder')}
              </label>
              <div className="relative flex h-9 items-center rounded-full border border-[#D9D6CE] bg-[#F7F5F0] pl-3 pr-1 transition-colors focus-within:border-[#214E43] focus-within:bg-white lg:h-10">
                <input
                  id="global-search"
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                  placeholder={t('search_placeholder')}
                  className="h-full w-full min-w-0 bg-transparent pr-1.5 text-[12.5px] text-[#202724] placeholder:text-[#68716D] focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label={t('search_btn')}
                  className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full bg-[#214E43] px-2.5 text-xs font-semibold text-white hover:bg-[#183B33] transition-colors lg:h-8 lg:px-3.5"
                >
                  <Search className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  <span className="hidden lg:inline">{t('search_btn')}</span>
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-10 z-50 rounded-lg border border-[#E3E0D8] bg-white py-1 shadow-md">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={`${sug.to}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowSuggestions(false);
                        navigate(sug.to);
                      }}
                      className="flex min-h-[40px] w-full items-center justify-between px-3 py-1.5 text-left text-[12.5px] hover:bg-[#F7F5F0]"
                    >
                      <span className="font-medium text-[#202724] truncate">{sug.label}</span>
                      {sug.sub && <span className="ml-3 shrink-0 text-[11px] text-[#68716D]">{sug.sub}</span>}
                    </button>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div className="flex-1" />
          )}

          {/* Language Switcher (Globe + 2-letter code) + Location pin on mobile */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            {showBuyerRows && (
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                aria-label={`${t('choose_location')} (${locationLabel})`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#E3E0D8] bg-[#F7F5F0] text-[#214E43] lg:w-auto lg:gap-1.5 lg:px-2.5 lg:text-xs lg:font-medium lg:text-[#202724] hover:border-[#214E43] transition-colors"
              >
                <MapPin className="h-4 w-4 text-[#214E43] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                <span className="hidden lg:inline whitespace-nowrap">{locationLabel}</span>
              </button>
            )}

            <LanguageSwitcher variant="header" />

            {/* Desktop account + cart */}
            <a
              href={accountHref}
              onClick={(e) => {
                e.preventDefault();
                navigate(accountHref);
              }}
              className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E3E0D8] bg-white px-3 text-xs font-medium text-[#202724] hover:border-[#214E43] transition-colors whitespace-nowrap"
            >
              <User className="h-3.5 w-3.5 text-[#68716D]" strokeWidth={1.75} aria-hidden="true" />
              <span>{accountLabel}</span>
            </a>
            {authProfile && (
              <button
                type="button"
                onClick={handleHeaderLogout}
                disabled={logoutBusy}
                aria-label={logoutBusy ? 'Turagusohora...' : 'Sohoka'}
                title={logoutError || 'Sohoka muri konti yawe'}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-[#C0392B]/35 bg-white text-xs font-semibold text-[#C0392B] disabled:opacity-60 lg:h-11 lg:w-auto lg:px-3"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{logoutBusy ? 'Turagusohora...' : 'Sohoka'}</span>
              </button>
            )}
            {logoutError && <span role="alert" className="hidden lg:inline text-[11px] font-medium text-[#C0392B]">{logoutError}</span>}

            <button
              type="button"
              onClick={() => navigate('/igare')}
              aria-label={`${t('cart')} (${cartCount})`}
              className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-md bg-[#214E43] px-3 text-xs font-semibold text-white hover:bg-[#183B33] transition-colors whitespace-nowrap"
            >
              <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              <span>{t('cart')}</span>
              <span className="rounded bg-[#BD594A] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
        <RwandanGeometricPattern size="header" />
      </header>

      {/* Desktop/Tablet Secondary Navigation Rows (hidden on narrow mobile to keep 360x640 first screen ultra-compact) */}
      {showBuyerRows && (
        <div className="hidden md:block border-b border-[#E3E0D8] bg-white">
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-5">
              {modeTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={tab.onClick}
                  className={`relative flex h-9 shrink-0 items-center whitespace-nowrap text-[13px] transition-colors ${
                    tab.active
                      ? 'font-semibold text-[#214E43]'
                      : 'font-normal text-[#68716D] hover:text-[#202724]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-[2px] bg-[#214E43]"
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-[12px]">
              {categories.filter((c) => c.parent_id === null).slice(0, 5).map((cat) => (
                <a
                  key={cat.slug}
                  href={`/c/${cat.slug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/c/${cat.slug}`);
                  }}
                  className={`whitespace-nowrap transition-colors ${
                    pathname === `/c/${cat.slug}`
                      ? 'font-semibold text-[#214E43]'
                      : 'text-[#68716D] hover:text-[#214E43]'
                  }`}
                >
                  {cat.name_rw}
                </a>
              ))}
              <button
                type="button"
                onClick={() => (onOpenCategories ? onOpenCategories() : navigate('/ibyiciro'))}
                className="inline-flex items-center gap-1 text-[#214E43] font-semibold hover:underline whitespace-nowrap"
              >
                <span>{t('all_categories')}</span>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
