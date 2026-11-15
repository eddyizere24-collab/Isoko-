import React, { useState } from 'react';
import {
  ChevronRight,
  Home,
  LayoutGrid,
  Search,
  ShoppingCart,
  Store,
  User,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';

interface BottomNavProps {
  categoriesOpen: boolean;
  setCategoriesOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BottomNav: React.FC<BottomNavProps> = ({ categoriesOpen, setCategoriesOpen }) => {
  const { pathname, navigate, cartCount, bootstrap, authProfile } = useMarketplace();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  if (pathname.startsWith('/p/')) return null;

  const accountHref = authProfile
    ? authProfile.role === 'admin' || authProfile.role === 'moderator'
      ? '/admin'
      : '/umucuruzi'
    : '/injira';

  const isHome = pathname === '/' || pathname === '';
  const isSearch = pathname === '/shakisha';
  const isCart = pathname === '/igare';
  const isAccount =
    pathname === '/injira' ||
    pathname === '/abacuruzi' ||
    pathname.startsWith('/umucuruzi') ||
    pathname.startsWith('/admin');

  const showSignInStrip =
    !authProfile &&
    !bannerDismissed &&
    !isAccount &&
    !isCart &&
    !pathname.startsWith('/ubufasha');

  const topCategories = (bootstrap?.categories ?? []).filter((c) => c.parent_id === null);
  const allCategories = bootstrap?.categories ?? [];

  return (
    <>
      {categoriesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/45 md:items-center md:justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Ibyiciro byose"
          onClick={() => setCategoriesOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-xl bg-white p-4 max-h-[80vh] overflow-y-auto md:rounded-xl md:border md:border-[#E5E7EB]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2.5">
              <h2 className="text-[15px] font-bold text-[#1B1F23]">Ibyiciro byose</h2>
              <button
                type="button"
                onClick={() => setCategoriesOpen(false)}
                aria-label="Funga ibyiciro"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4B5563] hover:bg-[#F7F8FA]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 divide-y divide-[#E5E7EB]">
              <button
                type="button"
                onClick={() => {
                  setCategoriesOpen(false);
                  navigate('/shakisha');
                }}
                className="flex min-h-[44px] w-full items-center justify-between py-2 text-left text-[13px] font-semibold text-[#0B6E4F]"
              >
                <span>Ibicuruzwa byose</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
              {(topCategories.length > 0 ? topCategories : allCategories).map((cat) => {
                const children = allCategories.filter((c) => c.parent_id === cat.id);
                return (
                  <div key={cat.id} className="py-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoriesOpen(false);
                        navigate(`/c/${cat.slug}`);
                      }}
                      className="flex min-h-[42px] w-full items-center justify-between text-left text-[13px] font-semibold text-[#1B1F23]"
                    >
                      <span>{cat.name_rw}</span>
                      <ChevronRight className="h-4 w-4 text-[#6B7280]" aria-hidden="true" />
                    </button>
                    {children.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5 pb-1">
                        {children.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setCategoriesOpen(false);
                              navigate(`/c/${sub.slug}`);
                            }}
                            className="inline-flex min-h-[32px] items-center rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-2.5 text-[11.5px] font-medium text-[#1B1F23] hover:border-[#0B6E4F]"
                          >
                            {sub.name_rw}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Soft Tinted Sign-In Prompt Bar above mobile bottom nav (ISOKO green tint + pill button) */}
      {showSignInStrip && (
        <div className="fixed bottom-14 inset-x-0 z-30 border-t border-[#CFE3D9] bg-[#E8F3EE] px-3 py-2 md:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#0B6E4F] border border-[#CFE3D9]">
                <Store className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <p className="truncate text-[12px] font-medium text-[#1B1F23]">
                Injira cyangwa ufungure iduka ryawe
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/injira')}
                className="inline-flex h-7 items-center rounded-full bg-[#0B6E4F] px-3 text-[11.5px] font-semibold text-white hover:bg-[#08553D]"
              >
                Injira
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                aria-label="Hisha"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#4B5563] hover:bg-white/70"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed 56px 5-tab Mobile Bottom Nav */}
      <nav
        aria-label="Ibice by'ingenzi"
        className="fixed bottom-0 inset-x-0 z-40 h-14 border-t border-[#E5E7EB] bg-white md:hidden"
      >
        <div className="grid h-full grid-cols-5">
          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate('/');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isHome ? 'font-semibold text-[#0B6E4F]' : 'font-medium text-[#4B5563]'
            }`}
          >
            <Home className="h-[19px] w-[19px]" strokeWidth={isHome ? 2.1 : 1.6} aria-hidden="true" />
            <span>Ahabanza</span>
          </button>

          <button
            type="button"
            onClick={() => setCategoriesOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              categoriesOpen || pathname.startsWith('/c/')
                ? 'font-semibold text-[#0B6E4F]'
                : 'font-medium text-[#4B5563]'
            }`}
          >
            <LayoutGrid
              className="h-[19px] w-[19px]"
              strokeWidth={categoriesOpen || pathname.startsWith('/c/') ? 2.1 : 1.6}
              aria-hidden="true"
            />
            <span>Ibyiciro</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate('/shakisha');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isSearch ? 'font-semibold text-[#0B6E4F]' : 'font-medium text-[#4B5563]'
            }`}
          >
            <Search className="h-[19px] w-[19px]" strokeWidth={isSearch ? 2.1 : 1.6} aria-hidden="true" />
            <span>Shakisha</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate('/igare');
            }}
            aria-label={`${RW.cart} (${cartCount})`}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isCart ? 'font-semibold text-[#0B6E4F]' : 'font-medium text-[#4B5563]'
            }`}
          >
            <span className="relative">
              <ShoppingCart className="h-[19px] w-[19px]" strokeWidth={isCart ? 2.1 : 1.6} aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C0392B] px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
            <span>Igare</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate(accountHref);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isAccount ? 'font-semibold text-[#0B6E4F]' : 'font-medium text-[#4B5563]'
            }`}
          >
            <User className="h-[19px] w-[19px]" strokeWidth={isAccount ? 2.1 : 1.6} aria-hidden="true" />
            <span>Konti</span>
          </button>
        </div>
      </nav>
    </>
  );
};
