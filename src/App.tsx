import React, { useEffect } from 'react';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LocationSheet } from './components/LocationSheet';
import { OfflineAndPwaBar } from './components/OfflineAndPwaBar';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { AdminPage } from './pages/AdminPage';
import { CartPage } from './pages/CartPage';
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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignore service worker registration errors in restricted iframes
      });
    }
  }, []);

  const renderRoute = () => {
    if (pathname === '/' || pathname === '') {
      return <HomePage />;
    }
    if (pathname === '/shakisha' || pathname.startsWith('/icyiciro/')) {
      return <SearchPage />;
    }
    if (pathname.startsWith('/p/')) {
      const id = decodeURIComponent(pathname.slice(3).split('/')[0]);
      return <ProductPage productId={id} />;
    }
    if (pathname.startsWith('/i/')) {
      const slug = decodeURIComponent(pathname.slice(3).split('/')[0]);
      return <ShopPage slug={slug} />;
    }
    if (pathname === '/igare') {
      return <CartPage />;
    }
    if (pathname === '/injira') {
      return <LoginPage />;
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

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1B1F23]">
      <OfflineAndPwaBar />
      <Header />
      <div className="flex-1">{renderRoute()}</div>
      <Footer />
      <LocationSheet />
    </div>
  );
};

export default function App() {
  return (
    <MarketplaceProvider>
      <AppRouter />
    </MarketplaceProvider>
  );
}
