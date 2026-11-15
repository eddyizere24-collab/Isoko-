import React, { useMemo, useState } from 'react';
import { ChevronDown, MapPin, Search, ShoppingCart, User } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { IsokoWordmark, RwandanGeometricPattern } from './IsokoLogo';

const FALLBACK_CATEGORIES = [
  { id: 1, parent_id: null, slug: 'inkweto', name_rw: 'Inkweto' },
  { id: 2, parent_id: null, slug: 'imyenda', name_rw: 'Imyenda' },
  { id: 3, parent_id: null, slug: 'amasogisi', name_rw: "Amasogisi n'imyenda y'imbere" },
  { id: 4, parent_id: null, slug: 'ibindi', name_rw: 'Ibindi byo kwambara' },
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
  } = useMarketplace();

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !bootstrap) return [];
    const out: Array<{ label: string; sub?: string; to: string }> = [];

    for (const cat of bootstrap.categories) {
      if (cat.name_rw.toLowerCase().includes(q)) {
        out.push({ label: cat.name_rw, sub: 'Icyiciro', to: `/c/${cat.slug}` });
      }
      if (out.length >= 3) break;
    }

    const seenBrands = new Set<string>();
    for (const p of bootstrap.products) {
      if (p.brand && p.brand.toLowerCase().includes(q) && !seenBrands.has(p.brand)) {
        seenBrands.add(p.brand);
        out.push({
          label: p.brand,
          sub: 'Ikirango',
          to: `/shakisha?q=${encodeURIComponent(p.brand)}`,
        });
      }
      if (out.length >= 5) break;
    }

    for (const p of bootstrap.products) {
      if (p.name.toLowerCase().includes(q)) {
        out.push({ label: p.name, sub: 'Igicuruzwa', to: `/p/${p.id}` });
      }
      if (out.length >= 8) break;
    }

    return out;
  }, [query, bootstrap]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const trimmed = query.trim();
    navigate(trimmed ? `/shakisha?q=${encodeURIComponent(trimmed)}` : '/shakisha');
  };

  const accountHref = authProfile
    ? authProfile.role === 'admin' || authProfile.role === 'moderator'
      ? '/admin'
      : '/umucuruzi'
    : '/injira';

  const accountLabel = authProfile
    ? authProfile.role === 'admin' || authProfile.role === 'moderator'
      ? 'Admin'
      : 'Iduka ryanjye'
    : RW.login;

  const categories = bootstrap?.categories?.length ? bootstrap.categories : FALLBACK_CATEGORIES;
  const locationLabel = location ? location.districtName : 'Kigali';
  const showBuyerRows = !pathname.startsWith('/umucuruzi') && !pathname.startsWith('/admin');
  const sortParam = searchParams.get('sort') ?? '';
  const discountedParam = searchParams.get('discounted') === '1';

  const modeTabs = [
    {
      id: 'products',
      label: 'Ibicuruzwa',
      active: (pathname === '/' || pathname === '/shakisha') && !discountedParam && sortParam !== 'nearby',
      onClick: () => navigate('/'),
    },
    {
      id: 'shops',
      label: 'Amaduka',
      active: pathname.startsWith('/i/'),
      onClick: () => navigate('/shakisha?sort=popular'),
    },
    {
      id: 'nearby',
      label: 'Hafi yawe',
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
      label: 'Byagabanyijwe',
      active: discountedParam,
      onClick: () => navigate('/shakisha?discounted=1'),
    },
    {
      id: 'sell',
      label: 'Gucuruza',
      active: pathname === '/abacuruzi',
      onClick: () => navigate('/abacuruzi'),
    },
  ];

  return (
    <>
      {/* Sticky Top Search Bar (52px mobile / 60px desktop + 3px Imigongo accent = 55px mobile) */}
      <header className="sticky top-0 z-40 bg-white">
        <div className="mx-auto flex h-[52px] max-w-7xl items-center gap-2.5 px-3 sm:px-6 lg:h-[60px] lg:gap-5">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            aria-label="Isoko Ahabanza"
            className="inline-flex min-h-[40px] items-center whitespace-nowrap shrink-0"
          >
            <IsokoWordmark
              markClassName="h-6 w-6 lg:h-7 lg:w-7"
              wordmarkClassName="h-[16px] w-auto lg:h-[18px]"
            />
          </a>

          {showBuyerRows ? (
            <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 lg:max-w-[600px]">
              <label htmlFor="global-search" className="sr-only">
                {RW.search_placeholder}
              </label>
              <div className="relative flex h-9 items-center rounded-full border border-[#D1D5DB] bg-[#F7F8FA] pl-3 pr-1 transition-colors focus-within:border-[#0B6E4F] focus-within:bg-white lg:h-10">
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
                  placeholder={RW.search_placeholder}
                  className="h-full w-full min-w-0 bg-transparent pr-2 text-[13px] text-[#1B1F23] placeholder:text-[#6B7280] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setLocationModalOpen(true)}
                  aria-label={`${RW.choose_location} (${locationLabel})`}
                  className="hidden sm:inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[#4B5563] hover:text-[#0B6E4F] shrink-0 lg:hidden"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#0B6E4F]" strokeWidth={1.75} aria-hidden="true" />
                  <span>{locationLabel}</span>
                </button>
                <button
                  type="submit"
                  aria-label="Shakisha"
                  className="inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full bg-[#0B6E4F] px-3 text-xs font-semibold text-white hover:bg-[#08553D] transition-colors lg:h-8 lg:px-4"
                >
                  <Search className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  <span className="hidden lg:inline">Shakisha</span>
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-10 z-50 rounded-xl border border-[#E5E7EB] bg-white py-1 shadow-md">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={`${sug.to}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowSuggestions(false);
                        navigate(sug.to);
                      }}
                      className="flex min-h-[42px] w-full items-center justify-between px-3.5 py-1.5 text-left text-[13px] hover:bg-[#F7F8FA]"
                    >
                      <span className="font-medium text-[#1B1F23] truncate">{sug.label}</span>
                      {sug.sub && <span className="ml-3 shrink-0 text-[11px] text-[#6B7280]">{sug.sub}</span>}
                    </button>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div className="flex-1" />
          )}

          {/* Desktop right utility actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0 ml-auto">
            {showBuyerRows && (
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F7F8FA] px-3 text-xs font-medium text-[#1B1F23] hover:border-[#0B6E4F] transition-colors whitespace-nowrap"
              >
                <MapPin className="h-3.5 w-3.5 text-[#0B6E4F]" strokeWidth={1.75} aria-hidden="true" />
                <span>{locationLabel}</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#6B7280]" aria-hidden="true" />
              </button>
            )}
            <a
              href={accountHref}
              onClick={(e) => {
                e.preventDefault();
                navigate(accountHref);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 text-xs font-medium text-[#1B1F23] hover:border-[#0B6E4F] transition-colors whitespace-nowrap"
            >
              <User className="h-3.5 w-3.5 text-[#4B5563]" strokeWidth={1.75} aria-hidden="true" />
              <span>{accountLabel}</span>
            </a>
            <button
              type="button"
              onClick={() => navigate('/igare')}
              aria-label={`${RW.cart} (${cartCount})`}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#0B6E4F] px-3.5 text-xs font-semibold text-white hover:bg-[#08553D] transition-colors whitespace-nowrap"
            >
              <ShoppingCart className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              <span>{RW.cart}</span>
              <span className="rounded-full bg-[#C0392B] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white tabular-nums">
                {cartCount}
              </span>
            </button>
          </div>

          {/* Mobile compact location pin button when not on buyer rows or subtle right action */}
          {showBuyerRows && (
            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              aria-label={`${RW.choose_location} (${locationLabel})`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F7F8FA] text-[#0B6E4F] sm:hidden shrink-0"
            >
              <MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </div>
        <RwandanGeometricPattern />
      </header>

      {/* Row 2: Calm Mode Tabs (38px, non-sticky) */}
      {showBuyerRows && (
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="mx-auto flex h-[38px] max-w-7xl items-center gap-5 overflow-x-auto no-scrollbar px-3 sm:px-6">
            {modeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={tab.onClick}
                className={`relative flex h-full shrink-0 items-center whitespace-nowrap text-[13.5px] transition-colors ${
                  tab.active
                    ? 'font-semibold text-[#1B1F23]'
                    : 'font-normal text-[#4B5563] hover:text-[#1B1F23]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-[2px] bg-[#0B6E4F]"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Row 3: Slim Unboxed Category Text Strip (36px, non-sticky) */}
      {showBuyerRows && (
        <nav
          aria-label="Ibyiciro by'urubuga"
          className="border-b border-[#E5E7EB] bg-white overflow-hidden"
        >
          <div className="mx-auto flex h-9 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto no-scrollbar text-[12.5px]">
              <a
                href="/shakisha"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/shakisha');
                }}
                className={`relative flex h-9 shrink-0 items-center whitespace-nowrap transition-colors ${
                  pathname === '/' || pathname === '/shakisha'
                    ? 'font-semibold text-[#1B1F23]'
                    : 'font-normal text-[#4B5563] hover:text-[#0B6E4F]'
                }`}
              >
                <span>Byose</span>
                {(pathname === '/' || pathname === '/shakisha') && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 w-4 h-[2px] bg-[#0B6E4F]"
                  />
                )}
              </a>
              {categories.map((cat) => {
                const active = pathname === `/c/${cat.slug}` || pathname === `/icyiciro/${cat.slug}`;
                return (
                  <a
                    key={cat.slug}
                    href={`/c/${cat.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/c/${cat.slug}`);
                    }}
                    className={`relative flex h-9 shrink-0 items-center whitespace-nowrap transition-colors ${
                      active
                        ? 'font-semibold text-[#0B6E4F]'
                        : 'font-normal text-[#4B5563] hover:text-[#0B6E4F]'
                    }`}
                  >
                    <span>{cat.name_rw}</span>
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 bottom-0 h-[2px] bg-[#0B6E4F]"
                      />
                    )}
                  </a>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => (onOpenCategories ? onOpenCategories() : navigate('/shakisha'))}
              aria-label="Ibyiciro byose"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#4B5563] hover:bg-[#F7F8FA] hover:text-[#0B6E4F]"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </nav>
      )}
    </>
  );
};
