import React, { useEffect, useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LocationSheet } from './components/LocationSheet';
import { OfflineAndPwaBar } from './components/OfflineAndPwaBar';
import { LangProvider } from './context/LangContext';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { AdminPage } from './pages/AdminPage';
import { AccountPage } from './pages/AccountPage';
import { BrandPreviewPage } from './pages/BrandPreviewPage';
import { CartPage } from './pages/CartPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProductPage } from './pages/ProductPage';
import { SearchPage } from './pages/SearchPage';
import { SellerAddProductPage } from './pages/SellerAddProductPage';
import { SellerAnalyticsPage } from './pages/SellerAnalyticsPage';
import { SellerApplyPage } from './pages/SellerApplyPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SellerProductsPage } from './pages/SellerProductsPage';
import { SellerShopSettingsPage } from './pages/SellerShopSettingsPage';
import { ShopPage } from './pages/ShopPage';
import { StaticPage } from './pages/StaticPage';

const AppRouter: React.FC = () => {
  const { pathname } = useMarketplace();
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore service worker registration errors in restricted iframes
      });
    }
  }, []);

  const renderRoute = () => {
    if (pathname === '/' || pathname === '') {
      return <HomePage onOpenCategories={() => setCategoriesOpen(true)} />;
    }
    if (pathname === '/ibyiciro') {
      return <CategoriesPage />;
    }
    if (pathname === '/brand-preview') {
      return <BrandPreviewPage />;
    }
    if (pathname === '/shakisha') {
      return <SearchPage />;
    }
    if (pathname.startsWith('/c/') || pathname.startsWith('/icyiciro/')) {
      const prefixLen = pathname.startsWith('/c/') ? 3 : 10;
      const slug = decodeURIComponent(pathname.slice(prefixLen).split('/')[0]);
      return <SearchPage initialCategorySlug={slug} />;
    }
    if (pathname.startsWith('/p/')) {
      const id = decodeURIComponent(pathname.slice(3).split('/')[0]);
      return <ProductPage productId={id} />;
    }
    if (pathname.startsWith('/i/') || pathname.startsWith('/s/')) {
      const slug = decodeURIComponent(pathname.slice(3).split('/')[0]);
      return <ShopPage slug={slug} />;
    }
    if (pathname === '/igare') {
      return <CartPage />;
    }
    if (pathname === '/injira') {
      return <LoginPage />;
    }
    if (pathname === '/konti') {
      return <AccountPage />;
    }
    if (pathname === '/abacuruzi') {
      return <SellerApplyPage />;
    }
    if (pathname === '/umucuruzi') {
      return <SellerDashboardPage />;
    }
    if (pathname === '/umucuruzi/ibicuruzwa') {
      return <SellerProductsPage />;
    }
    if (pathname === '/umucuruzi/ongeraho') {
      return <SellerAddProductPage />;
    }
    if (pathname === '/umucuruzi/iduka') {
      return <SellerShopSettingsPage />;
    }
    if (pathname === '/umucuruzi/imibare') {
      return <SellerAnalyticsPage />;
    }
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return <AdminPage />;
    }
    return <StaticPage />;
  };

  const hasBottomNav = !pathname.startsWith('/p/');

  return (
    <div
      className={`flex min-h-screen flex-col bg-[#F7F8FA] text-[#1B1F23] ${
        hasBottomNav ? 'pb-16 md:pb-0' : ''
      }`}
    >
      <OfflineAndPwaBar />
      <Header onOpenCategories={() => setCategoriesOpen(true)} />
      <div className="flex-1">{renderRoute()}</div>
      <Footer />
      <BottomNav categoriesOpen={categoriesOpen} setCategoriesOpen={setCategoriesOpen} />
      <LocationSheet />
    </div>
  );
};

export default function App() {
  return (
    <LangProvider>
      <MarketplaceProvider>
        <AppRouter />
      </MarketplaceProvider>
    </LangProvider>
  );
}
