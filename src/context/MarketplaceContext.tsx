import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchBootstrap, fetchMe, type BootstrapResponse } from '../lib/api';
import { getNeonJwt, neon } from '../lib/neon';
import {
  addItemToCart,
  incrementVisitCount,
  loadAuthSession,
  loadCart,
  loadFollowedShops,
  loadLocation,
  loadMySize,
  loadRecents,
  recordCategoryInterest,
  recordRecentProduct,
  saveAuthSession,
  saveCart,
  saveLocation,
  saveMySize,
  toggleFollowedShop,
  type StoredAuthSession,
} from '../lib/storage';
import { trackEvent } from '../lib/track';
import type {
  BuyerLocation,
  CartItem,
  MySizePreference,
  Profile,
  RecentItem,
  Shop,
} from '../types/marketplace';

interface MarketplaceContextValue {
  pathname: string;
  searchParams: URLSearchParams;
  navigate: (to: string) => void;
  bootstrap: BootstrapResponse | null;
  loading: boolean;
  error: string | null;
  refreshBootstrap: () => Promise<void>;
  cart: CartItem[];
  cartCount: number;
  addToCart: (item: CartItem, categoryId?: number) => { ok: boolean; error?: string };
  updateCartQty: (productId: string, size: string, color: string, delta: number) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  removeSellerFromCart: (shopId: string) => void;
  replaceCart: (items: CartItem[]) => void;
  location: BuyerLocation | null;
  setLocation: (loc: BuyerLocation | null) => void;
  locationModalOpen: boolean;
  setLocationModalOpen: (open: boolean) => void;
  mySize: MySizePreference;
  setMySize: (pref: MySizePreference) => void;
  recents: RecentItem[];
  markProductViewed: (productId: string, shopId?: string, categoryId?: number) => void;
  followedShops: string[];
  toggleFollowShop: (shopId: string) => void;
  authSession: StoredAuthSession | null;
  authProfile: Profile | null;
  authShop: Shop | null;
  setAuthData: (sess: StoredAuthSession | null, profile: Profile | null, shop: Shop | null) => void;
  logout: () => void;
  visitCount: number;
}

const MarketplaceContext = createContext<MarketplaceContextValue | null>(null);

export const MarketplaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [urlState, setUrlState] = useState(() => ({
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
  }));

  const [bootstrap, setBootstrap] = useState<BootstrapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => loadCart());
  const [location, setLocationState] = useState<BuyerLocation | null>(() => loadLocation());
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [mySize, setMySizeState] = useState<MySizePreference>(() => loadMySize());
  const [recents, setRecents] = useState<RecentItem[]>(() => loadRecents());
  const [followedShops, setFollowedShops] = useState<string[]>(() => loadFollowedShops());
  const [visitCount] = useState<number>(() => incrementVisitCount());

  const [authSession, setAuthSession] = useState<StoredAuthSession | null>(() => loadAuthSession());
  const [authProfile, setAuthProfile] = useState<Profile | null>(null);
  const [authShop, setAuthShop] = useState<Shop | null>(null);

  const navigate = useCallback((to: string) => {
    if (to === `${window.location.pathname}${window.location.search}`) return;
    window.history.pushState({}, '', to);
    setUrlState({
      pathname: window.location.pathname || '/',
      search: window.location.search || '',
    });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      setUrlState({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
      });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshBootstrap = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchBootstrap();
      setBootstrap(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Habaye ikibazo mu gufungura amakuru.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  // A saved local marker is only a display cache. Re-check the actual Better Auth
  // session and JWT on every app load before restoring a seller account.
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        await getNeonJwt();
        const res = await fetchMe();
        if (!active) return;
        const session: StoredAuthSession = {
          token: 'managed-neon-auth',
          userId: res.profile.id,
          role: res.profile.role,
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        };
        saveAuthSession(session);
        setAuthSession(session);
        setAuthProfile(res.profile);
        setAuthShop(res.shop);
      } catch {
        if (!active) return;
        // Never keep a provisional seller session when a real profile/JWT is absent.
        saveAuthSession(null);
        setAuthSession(null);
        setAuthProfile(null);
        setAuthShop(null);
      }
    };
    void restore();
    return () => { active = false; };
  }, []);

  const addToCart = useCallback((item: CartItem, categoryId?: number) => {
    const res = addItemToCart(cart, item);
    if (res.error) return { ok: false, error: res.error };
    setCart(res.items);
    if (categoryId) recordCategoryInterest(categoryId, 3);
    trackEvent('cart_add', item.productId, item.shopId);
    return { ok: true };
  }, [cart]);

  const updateCartQty = useCallback((productId: string, size: string, color: string, delta: number) => {
    setCart((prev) => {
      const next = prev
        .map((it) => {
          if (it.productId === productId && it.size === size && it.color === color) {
            return { ...it, qty: Math.max(0, Math.min(10, it.qty + delta)) };
          }
          return it;
        })
        .filter((it) => it.qty > 0);
      saveCart(next);
      return next;
    });
  }, []);

  const removeFromCart = useCallback((productId: string, size: string, color: string) => {
    setCart((prev) => {
      const next = prev.filter(
        (it) => !(it.productId === productId && it.size === size && it.color === color)
      );
      saveCart(next);
      return next;
    });
  }, []);

  const removeSellerFromCart = useCallback((shopId: string) => {
    setCart((prev) => {
      const next = prev.filter((it) => it.shopId !== shopId);
      saveCart(next);
      return next;
    });
  }, []);

  const replaceCart = useCallback((items: CartItem[]) => {
    saveCart(items);
    setCart(items);
  }, []);

  const setLocation = useCallback((loc: BuyerLocation | null) => {
    saveLocation(loc);
    setLocationState(loc);
  }, []);

  const setMySize = useCallback((pref: MySizePreference) => {
    saveMySize(pref);
    setMySizeState(pref);
  }, []);

  const markProductViewed = useCallback((productId: string, shopId?: string, categoryId?: number) => {
    const nextRecents = recordRecentProduct(productId);
    setRecents(nextRecents);
    if (categoryId) recordCategoryInterest(categoryId, 1);
    trackEvent('view', productId, shopId);
  }, []);

  const toggleFollowShop = useCallback((shopId: string) => {
    setFollowedShops(toggleFollowedShop(shopId));
  }, []);

  const setAuthData = useCallback(
    (sess: StoredAuthSession | null, profile: Profile | null, shop: Shop | null) => {
      saveAuthSession(sess);
      setAuthSession(sess);
      setAuthProfile(profile);
      setAuthShop(shop);
    },
    []
  );

  const logout = useCallback(() => {
    void neon.auth.signOut();
    saveAuthSession(null);
    setAuthSession(null);
    setAuthProfile(null);
    setAuthShop(null);
    navigate('/');
  }, [navigate]);

  const cartCount = cart.reduce((sum, it) => sum + it.qty, 0);

  return (
    <MarketplaceContext.Provider
      value={{
        pathname: urlState.pathname,
        searchParams: new URLSearchParams(urlState.search),
        navigate,
        bootstrap,
        loading,
        error,
        refreshBootstrap,
        cart,
        cartCount,
        addToCart,
        updateCartQty,
        removeFromCart,
        removeSellerFromCart,
        replaceCart,
        location,
        setLocation,
        locationModalOpen,
        setLocationModalOpen,
        mySize,
        setMySize,
        recents,
        markProductViewed,
        followedShops,
        toggleFollowShop,
        authSession,
        authProfile,
        authShop,
        setAuthData,
        logout,
        visitCount,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
};

export function useMarketplace(): MarketplaceContextValue {
  const ctx = useContext(MarketplaceContext);
  if (!ctx) throw new Error('useMarketplace must be used inside MarketplaceProvider');
  return ctx;
}
