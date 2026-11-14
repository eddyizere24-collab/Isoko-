import React, { useEffect } from 'react';
import { Footer } from './components/Footer';
import { SellerAuthGate } from './components/SellerAuthGate';
import { Header } from './components/Header';
import { LocationSheet } from './components/LocationSheet';
import { OfflineAndPwaBar } from './components/OfflineAndPwaBar';
import { MarketplaceProvider, useMarketplace } from './context/MarketplaceContext';
import { AdminPage } from './pages/AdminPage';
import { AdminSetupPage } from './pages/AdminSetupPage';
import { CartPage } from './pages/CartPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RequestPasswordResetPage } from './pages/RequestPasswordResetPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ProductPage } from './pages/ProductPage';
import { SearchPage } from './pages/SearchPage';
import { SellerAddProductPage } from './pages/SellerAddProductPage';
import { SellerAnalyticsPage } from './pages/SellerAnalyticsPage';
import { SellerApplyPage } from './pages/SellerApplyPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SellerBulkAddProductsPage } from './pages/SellerBulkAddProductsPage';
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
    if (pathname === '/ibagiwe-ijambo') {
      return <RequestPasswordResetPage />;
    }
    if (pathname === '/ongera-ijambo') {
      return <ResetPasswordPage />;
    }
    if (pathname === '/abacuruzi') {
      return <SellerApplyPage />;
    }
    if (pathname === '/umucuruzi') {
      return (
        <SellerAuthGate>
          <SellerDashboardPage />
        </SellerAuthGate>
      );
    }
    if (pathname === '/umucuruzi/ibicuruzwa') {
      return (
        <SellerAuthGate>
          <SellerProductsPage />
        </SellerAuthGate>
      );
    }
    if (pathname === '/umucuruzi/ongeraho') {
      return (
        <SellerAuthGate>
          <SellerAddProductPage />
        </SellerAuthGate>
      );
    }
    if (pathname === '/umucuruzi/ongeraho-byinshi') {
      return (
        <SellerAuthGate>
          <SellerBulkAddProductsPage />
        </SellerAuthGate>
      );
    }
    if (pathname === '/umucuruzi/iduka') {
      return (
        <SellerAuthGate>
          <SellerShopSettingsPage />
        </SellerAuthGate>
      );
    }
    if (pathname === '/umucuruzi/imibare') {
      return (
        <SellerAuthGate>
          <SellerAnalyticsPage />
        </SellerAuthGate>
      );
    }
    if (pathname === '/admin/setup') {
      return <AdminSetupPage />;
    }
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return <AdminPage />;
    }
    return <StaticPage />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1B1F23]">
      <OfflineAndPwaBar />
      {import.meta.env.VITE_ISOKO_PREVIEW === 'true' && (
        <div role="status" className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs leading-5 text-amber-950">
          <strong>ISOKO PREVIEW:</strong> uru ni urubuga rw’igerageza. Ntushyiremo National ID, amafoto ya KYC, cyangwa andi makuru yawe bwite. Amaduka azafungurwa ku rubuga rwa Production nyuma y’isuzuma rya nyuma.
        </div>
      )}
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
