import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Clock,
  ExternalLink,
  Flag,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Search,
  Share2,
  Truck,
} from 'lucide-react';
import { IsokoVerifiedSeal, RwandanGeometricPattern } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { SafeImage } from '../components/SafeImage';
import { QrCodeModal } from '../components/QrCodeModal';
import { ReportModal } from '../components/ReportModal';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { fetchShopDetail, subscribeUpdates } from '../lib/api';
import { trackEvent } from '../lib/track';
import { buildWhatsAppLink } from '../lib/whatsapp';
import { isShopIdentityVerified } from '../lib/shopVerification';
import type { Product, Shop } from '../types/marketplace';

interface ShopPageProps {
  slug: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({ slug }) => {
  const { navigate, followedShops, toggleFollowShop } = useMarketplace();
  const { t } = useT();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [shopSearch, setShopSearch] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetchShopDetail(slug)
      .then((res) => {
        if (!active) return;
        setShop(res.shop);
        setProducts(res.products);
        trackEvent('view', null, res.shop.id);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : t('shop_missing'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug, t]);

  const filteredProducts = useMemo(() => {
    const q = shopSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCat && p.parent_category?.slug !== filterCat && p.category?.slug !== filterCat) {
        return false;
      }
      if (q) {
        const hay = `${p.name} ${p.description} ${p.brand ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [products, filterCat, shopSearch]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-2 py-4 sm:px-6 space-y-4">
        <div className="h-44 animate-pulse rounded-md bg-white border border-[#E3E0D8]" />
        <div className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[175px] animate-pulse rounded-md bg-white border border-[#E3E0D8]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="mx-auto max-w-xl px-4 py-14 text-center">
        <h1 className="text-lg font-semibold text-[#202724]">{t('shop_missing')}</h1>
        <p className="mt-2 text-xs text-[#68716D]">{error || t('shop_missing')}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 h-10 rounded-md bg-[#214E43] px-5 text-xs font-semibold text-white"
        >
          {t('back_home')}
        </button>
      </div>
    );
  }

  const shopUrl = `${window.location.origin}/i/${shop.slug}`;
  const isFollowing = followedShops.includes(shop.id);
  const isVerified = isShopIdentityVerified(shop);
  const memberDays = shop.approved_at
    ? Math.max(1, Math.floor((Date.now() - new Date(shop.approved_at).getTime()) / (1000 * 60 * 60 * 24)))
    : null;
  const waUrl = buildWhatsAppLink(
    shop.whatsapp,
    `Muraho ${shop.name}, nabonye iduka ryanyu ku Isoko.`
  );

  const handleShare = async () => {
    trackEvent('share', null, shop.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text: `${shop.name} — Isoko Rwanda`,
          url: shopUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleFollow = () => {
    toggleFollowShop(shop.id);
    subscribeUpdates({
      kind: 'shop_follow',
      externalId: `shop_follow_${shop.id}`,
      shopId: shop.id,
      unsubscribe: isFollowing,
    }).catch(() => undefined);
  };

  const parentCategories = Array.from(
    new Map(
      products
        .map((p) => p.parent_category)
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .map((c) => [c.slug, c])
    ).values()
  );

  const socialEntries = Object.entries(shop.social_links ?? {}).filter(
    ([, url]) => typeof url === 'string' && url.trim().length > 0
  );

  return (
    <div className="mx-auto max-w-7xl px-2 py-4 sm:px-6 space-y-5">
      {/* Storefront Hero Banner (True SVG Imigongo fallback when cover_path is absent) */}
      <section className="overflow-hidden rounded-lg border border-[#E3E0D8] bg-white">
        <div className="relative h-32 sm:h-44 w-full bg-[#EEECE6]">
          {shop.cover_path ? (
            <>
              <SafeImage src={shop.cover_path} alt={shop.name} className="h-full w-full object-cover" fallback={<div className="imigongo-surface h-full w-full" aria-hidden="true" />} />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent"
              />
            </>
          ) : (
            <div className="imigongo-surface h-full w-full" aria-hidden="true" />
          )}
          <div className="absolute bottom-2.5 sm:left-[110px] hidden sm:block text-xs font-medium text-white/95">
            {isVerified ? t('verified') : t('unverified')} · {shop.district_name}
          </div>
        </div>
        <RwandanGeometricPattern size="header" />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative z-10 flex shrink-0 flex-col items-center gap-1">
                <SafeImage
                  src={shop.seller_avatar_path}
                  alt={shop.seller_name || 'Ifoto ya profile y’umucuruzi'}
                  className="h-[72px] w-[72px] rounded-full border-[3px] border-white bg-white object-cover"
                  fallback={<div className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white bg-[#E8F3EE] text-lg font-semibold text-[#0B6E4F]">{(shop.seller_name || shop.name).slice(0, 1).toUpperCase()}</div>}
                />
                <span className="text-[10px] font-semibold text-[#4B544F]">Umucuruzi</span>
              </div>
              <SafeImage
                src={shop.logo_path}
                alt={'Logo ya ' + shop.name}
                className="relative z-10 h-[72px] w-[72px] shrink-0 rounded-lg border-2 border-white bg-white object-cover"
                fallback={<div className="relative z-10 flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg border-2 border-white bg-[#0B6E4F] text-lg font-bold text-white">{shop.name.slice(0, 2).toUpperCase()}</div>}
              />

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-[19px] font-semibold text-[#202724] sm:text-2xl">{shop.name}</h1>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#214E43]">
                      <IsokoVerifiedSeal className="h-4 w-4" />
                      <span>{t('verified')}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-[#68716D]">{t('unverified')}</span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#68716D]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
                    {shop.district_name}
                    {shop.sector_name ? `, ${shop.sector_name}` : ''}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{t('member_since', { n: memberDays })}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-medium">{products.length} {t('products')}</span>
                </div>

                {shop.about && <p className="mt-2 text-xs leading-relaxed text-[#49524D] max-w-xl">{shop.about}</p>}
                {shop.seller_bio && (
                  <div className="mt-3 max-w-xl rounded-lg border border-[#E3E0D8] bg-[#F7F5F0] px-3 py-2.5">
                    <p className="text-[9px] font-semibold tracking-[0.08em] text-[#8F493F]">IBYEREKEYE UMUCURUZI</p>
                    <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-[#49524D]">{shop.seller_bio}</p>
                  </div>
                )}

                <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#68716D]">
                  {shop.delivery_text && (
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
                      <span>{shop.delivery_text}</span>
                    </span>
                  )}
                  {shop.hours_text && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
                      <span>{shop.hours_text}</span>
                    </span>
                  )}
                  {shop.landmark && <span>{shop.landmark}</span>}
                </div>

                {socialEntries.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {socialEntries.map(([key, url]) => (
                      <a
                        key={key}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-[#E3E0D8] bg-[#F7F5F0] px-2 py-1 text-[11px] font-medium capitalize text-[#214E43] hover:border-[#214E43]"
                      >
                        <span>{key}</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('wa_click', null, shop.id)}
                className="inline-flex h-10 items-center gap-1.5 rounded-md bg-[#1A7F43] px-3.5 text-xs font-semibold text-white hover:bg-[#146635]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`tel:+${shop.phone}`}
                onClick={() => trackEvent('call_click', null, shop.id)}
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#C9CEC7] bg-white px-3 text-xs font-semibold text-[#202724] hover:bg-[#F7F5F0]"
              >
                <Phone className="h-4 w-4 text-[#214E43]" aria-hidden="true" />
                <span>{t('call')}</span>
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#C9CEC7] bg-white px-3 text-xs font-semibold text-[#202724] hover:bg-[#F7F5F0]"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                <span>{copied ? t('copied') : t('share_shop')}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                aria-label="QR Code"
                className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#C9CEC7] bg-white px-3 text-xs font-semibold text-[#202724] hover:bg-[#F7F5F0]"
              >
                <QrCode className="h-4 w-4 text-[#214E43]" aria-hidden="true" />
                <span>QR</span>
              </button>
              <button
                type="button"
                onClick={handleFollow}
                className={`inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors ${
                  isFollowing
                    ? 'border-[#214E43] bg-[#214E43] text-white'
                    : 'border-[#C9CEC7] bg-white text-[#202724] hover:border-[#214E43]'
                }`}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span>{isFollowing ? t('following_shop') : t('follow_shop')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* In-Shop Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-white border border-[#E3E0D8] p-1">
          <button
            type="button"
            onClick={() => setFilterCat('')}
            className={`h-8 rounded px-3 text-xs font-semibold ${
              filterCat === '' ? 'bg-[#214E43] text-white' : 'text-[#68716D]'
            }`}
          >
            {t('all')} ({products.length})
          </button>
          {parentCategories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilterCat(c.slug)}
              className={`h-8 rounded px-3 text-xs font-semibold ${
                filterCat === c.slug ? 'bg-[#214E43] text-white' : 'text-[#68716D]'
              }`}
            >
              {c.name_rw}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68716D]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              aria-label={t('search_placeholder')}
              className="h-10 w-full rounded-md border border-[#E3E0D8] bg-white pl-8 pr-3 text-xs focus:border-[#214E43] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex h-10 items-center gap-1 text-xs font-semibold text-[#BD594A] hover:underline shrink-0"
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('report')}</span>
          </button>
        </div>
      </div>

      {/* Product Grid — 3/4/5/6/7 columns */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-md bg-[#E9F0EB] p-6 text-center">
          <p className="text-xs font-medium text-[#49524D]">{t('no_results')}</p>
          {(filterCat || shopSearch) && (
            <button
              type="button"
              onClick={() => {
                setFilterCat('');
                setShopSearch('');
              }}
              className="mt-3 h-9 rounded-md bg-[#214E43] px-4 text-xs font-semibold text-white"
            >
              {t('clear_filters')}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-2.5">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      <QrCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        shopName={shop.name}
        shopUrl={shopUrl}
      />

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="shop"
        targetId={shop.id}
        targetName={shop.name}
      />
    </div>
  );
};
