import React from 'react';
import {
  ChevronRight,
  Home,
  LayoutGrid,
  Search,
  ShoppingCart,
  User,
  X,
} from 'lucide-react';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';

interface BottomNavProps {
  categoriesOpen: boolean;
  setCategoriesOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const BottomNav: React.FC<BottomNavProps> = ({ categoriesOpen, setCategoriesOpen }) => {
  const { pathname, navigate, cartCount, bootstrap, authProfile } = useMarketplace();
  const { t } = useT();

  if (pathname.startsWith('/p/')) return null;

  const accountHref = '/konti';

  const isHome = pathname === '/' || pathname === '';
  const isCategories = pathname === '/ibyiciro' || pathname.startsWith('/c/') || pathname.startsWith('/icyiciro/');
  const isSearch = pathname === '/shakisha';
  const isCart = pathname === '/igare';
  const isAccount =
    pathname === '/konti' ||
    pathname.startsWith('/konti/') ||
    pathname === '/injira' ||
    pathname === '/abacuruzi' ||
    pathname.startsWith('/umucuruzi') ||
    pathname.startsWith('/admin');

  const topCategories = (bootstrap?.categories ?? []).filter((c) => c.parent_id === null);
  const allCategories = bootstrap?.categories ?? [];

  return (
    <>
      {categoriesOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/45 md:items-center md:justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={t('all_categories')}
          onClick={() => setCategoriesOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-xl bg-white p-4 max-h-[80vh] overflow-y-auto md:rounded-xl md:border md:border-[#E3E0D8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E3E0D8] pb-2.5">
              <h2 className="text-[15px] font-semibold text-[#202724]">{t('all_categories')}</h2>
              <button
                type="button"
                onClick={() => setCategoriesOpen(false)}
                aria-label={t('cancel')}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#68716D] hover:bg-[#F7F5F0]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-2 divide-y divide-[#E3E0D8]">
              <button
                type="button"
                onClick={() => {
                  setCategoriesOpen(false);
                  navigate('/ibyiciro');
                }}
                className="flex min-h-[44px] w-full items-center justify-between py-2 text-left text-[13px] font-semibold text-[#214E43]"
              >
                <span>{t('all_categories')}</span>
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
                      className="flex min-h-[42px] w-full items-center justify-between text-left text-[13px] font-semibold text-[#202724]"
                    >
                      <span>{cat.name_rw}</span>
                      <ChevronRight className="h-4 w-4 text-[#68716D]" aria-hidden="true" />
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
                            className="inline-flex min-h-[32px] items-center rounded-md border border-[#E3E0D8] bg-[#F7F5F0] px-2.5 text-[11.5px] font-medium text-[#202724] hover:border-[#214E43]"
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

      {/* Fixed 56px 5-tab Mobile Bottom Nav */}
      <nav
        aria-label={t('categories')}
        className="fixed bottom-0 inset-x-0 z-40 h-14 border-t border-[#E3E0D8] bg-white md:hidden"
      >
        <div className="grid h-full grid-cols-5">
          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate('/');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isHome ? 'font-semibold text-[#214E43]' : 'font-medium text-[#68716D]'
            }`}
          >
            <Home className="h-[19px] w-[19px]" strokeWidth={isHome ? 2.1 : 1.6} aria-hidden="true" />
            <span>{t('home')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate('/ibyiciro');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isCategories ? 'font-semibold text-[#214E43]' : 'font-medium text-[#68716D]'
            }`}
          >
            <LayoutGrid
              className="h-[19px] w-[19px]"
              strokeWidth={isCategories ? 2.1 : 1.6}
              aria-hidden="true"
            />
            <span>{t('categories')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate('/shakisha');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isSearch ? 'font-semibold text-[#214E43]' : 'font-medium text-[#68716D]'
            }`}
          >
            <Search className="h-[19px] w-[19px]" strokeWidth={isSearch ? 2.1 : 1.6} aria-hidden="true" />
            <span>{t('search_btn')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate('/igare');
            }}
            aria-label={`${t('cart')} (${cartCount})`}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isCart ? 'font-semibold text-[#214E43]' : 'font-medium text-[#68716D]'
            }`}
          >
            <span className="relative">
              <ShoppingCart className="h-[19px] w-[19px]" strokeWidth={isCart ? 2.1 : 1.6} aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#BD594A] px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </span>
            <span>{t('cart')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoriesOpen(false);
              navigate(accountHref);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 text-[10.5px] ${
              isAccount ? 'font-semibold text-[#214E43]' : 'font-medium text-[#68716D]'
            }`}
          >
            <User className="h-[19px] w-[19px]" strokeWidth={isAccount ? 2.1 : 1.6} aria-hidden="true" />
            <span>{t('account')}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
