import React, { useMemo, useState } from 'react';
import { MapPin, Search, ShoppingBag, Menu, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { IsokoWordmark, RwandanGeometricPattern } from './IsokoLogo';

export const Header: React.FC = () => {
  const {
    pathname,
    navigate,
    cartCount,
    location,
    setLocationModalOpen,
    bootstrap,
    authProfile,
  } = useMarketplace();

  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8">
          {/* Zone 1: Single-line brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Funga menu' : 'Fungura menu'}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#1B1F23] hover:bg-[#F1F6F3] md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              aria-label="Isoko Ahabanza"
              className="inline-flex min-h-[44px] items-center whitespace-nowrap shrink-0"
            >
              <IsokoWordmark />
            </a>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Ibyiciro by'urubuga"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1B1F23]/80"
          >
            <a
              href="/c/inkweto"
              onClick={(e) => {
                e.preventDefault();
                navigate('/c/inkweto');
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#0B6E4F] transition-colors ${
                pathname.startsWith('/c/inkweto') ? 'text-[#0B6E4F] font-semibold' : ''
              }`}
            >
              Inkweto
            </a>
            <a
              href="/c/imyenda"
              onClick={(e) => {
                e.preventDefault();
                navigate('/c/imyenda');
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#0B6E4F] transition-colors ${
                pathname.startsWith('/c/imyenda') ? 'text-[#0B6E4F] font-semibold' : ''
              }`}
            >
              Imyenda
            </a>
            <a
              href="/shakisha"
              onClick={(e) => {
                e.preventDefault();
                navigate('/shakisha');
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#0B6E4F] transition-colors ${
                pathname === '/shakisha' ? 'text-[#0B6E4F] font-semibold' : ''
              }`}
            >
              Shakisha
            </a>
            <a
              href="/abacuruzi"
              onClick={(e) => {
                e.preventDefault();
                navigate('/abacuruzi');
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#0B6E4F] transition-colors ${
                pathname === '/abacuruzi' ? 'text-[#0B6E4F] font-semibold' : ''
              }`}
            >
              Gucuruza
            </a>
            <a
              href={accountHref}
              onClick={(e) => {
                e.preventDefault();
                navigate(accountHref);
              }}
              className={`whitespace-nowrap shrink-0 hover:text-[#0B6E4F] transition-colors ${
                pathname.startsWith('/umucuruzi') || pathname.startsWith('/admin') || pathname === '/injira'
                  ? 'text-[#0B6E4F] font-semibold'
                  : ''
              }`}
            >
              {accountLabel}
            </a>
          </nav>

          {/* Zone 3: Single primary action (Cart) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => navigate('/igare')}
              aria-label={`${RW.cart} (${cartCount})`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#08553D] transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>{RW.cart}</span>
              <span className="tabular-nums">({cartCount})</span>
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1 text-base font-medium">
              {[
                { to: '/', label: 'Ahabanza' },
                { to: '/c/inkweto', label: 'Inkweto' },
                { to: '/c/imyenda', label: 'Imyenda' },
                { to: '/c/amasogisi', label: "Amasogisi n'imyenda y'imbere" },
                { to: '/c/ibindi', label: 'Ibindi byo kwambara' },
                { to: '/abacuruzi', label: RW.sell_on_platform },
                { to: accountHref, label: accountLabel },
              ].map((item) => (
                <a
                  key={item.to}
                  href={item.to}
                  onClick={(e) => {
                    e.preventDefault();
                    setMobileMenuOpen(false);
                    navigate(item.to);
                  }}
                  className="flex min-h-[44px] items-center rounded-lg px-3 text-[#1B1F23] hover:bg-[#F1F6F3]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Non-sticky Search & Location Strip (keeps mobile sticky <= 15% cap) */}
      {!pathname.startsWith('/umucuruzi') && !pathname.startsWith('/admin') && (
        <div className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-2xl">
              <label htmlFor="global-search" className="sr-only">
                {RW.search_placeholder}
              </label>
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-500" aria-hidden="true" />
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
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-24 text-sm text-[#1B1F23] placeholder:text-slate-500 focus:border-[#0B6E4F] focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 h-8 rounded-lg bg-[#0B6E4F] px-3 text-xs font-semibold text-white hover:bg-[#08553D] transition-colors"
                >
                  Shakisha
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-12 z-30 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={`${sug.to}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowSuggestions(false);
                        navigate(sug.to);
                      }}
                      className="flex min-h-[44px] w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-[#F1F6F3]"
                    >
                      <span className="font-medium text-[#1B1F23] truncate">{sug.label}</span>
                      {sug.sub && <span className="text-xs text-slate-500 ml-3 shrink-0">{sug.sub}</span>}
                    </button>
                  ))}
                </div>
              )}
            </form>

            <button
              type="button"
              onClick={() => setLocationModalOpen(true)}
              className="inline-flex min-h-[44px] items-center justify-between sm:justify-start gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-[#1B1F23] hover:border-[#0B6E4F] transition-colors shrink-0"
            >
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#0B6E4F] shrink-0" aria-hidden="true" />
                <span className="text-slate-600">{RW.choose_location}</span>
                <span className="font-semibold text-[#1B1F23]">
                  {location
                    ? `${location.districtName}${location.sectorName ? `, ${location.sectorName}` : ''}`
                    : 'Kigali / Hitamo'}
                </span>
              </span>
            </button>
          </div>
        </div>
      )}
      <RwandanGeometricPattern className="pointer-events-none h-1.5 w-full opacity-70" />
    </>
  );
};
