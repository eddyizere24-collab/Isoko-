import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Clock,
  Flag,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Search,
  Share2,
  Truck,
  Store,
} from 'lucide-react';
import { IsokoVerifiedSeal, RwandanGeometricPattern } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { QrCodeModal } from '../components/QrCodeModal';
import { ReportModal } from '../components/ReportModal';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { fetchShopDetail, subscribeUpdates } from '../lib/api';
import { trackEvent } from '../lib/track';
import { buildWhatsAppLink } from '../lib/whatsapp';
import type { Product, Shop } from '../types/marketplace';

interface ShopPageProps {
  slug: string;
}

export const ShopPage: React.FC<ShopPageProps> = ({ slug }) => {
  const { navigate, followedShops, toggleFollowShop } = useMarketplace();
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
        if (active) setError(err instanceof Error ? err.message : RW.shop_missing);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

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
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        <div className="h-56 animate-pulse rounded-2xl bg-[#F1F6F3]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-xl bg-[#F1F6F3]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-display text-xl font-bold text-[#1B1F23]">{RW.shop_missing}</h1>
        <p className="mt-2 text-sm text-slate-600">{error || 'Iri duka ntiribonetse.'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 min-h-[44px] rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
        >
          Subira ahabanza
        </button>
      </div>
    );
  }

  const shopUrl = `${window.location.origin}/i/${shop.slug}`;
  const isFollowing = followedShops.includes(shop.id);
  const memberDays = shop.approved_at
    ? Math.max(1, Math.floor((Date.now() - new Date(shop.approved_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;
  const waUrl = buildWhatsAppLink(
    shop.whatsapp,
    `Muraho ${shop.name}, nabonye iduka ryanyu ku Isoko.`
  );

  const handleShare = async () => {
    trackEvent('share', null, shop.id);
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-8">
      {/* Storefront Hero Banner + Verified Merchant Profile */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        {shop.cover_path ? (
          <div className="relative h-40 w-full bg-[#0F1E18] sm:h-52">
            <img
              src={shop.cover_path}
              alt={`Ifoto y'iduka ${shop.name}`}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent"
            />
            <div className="absolute bottom-3 hidden text-xs font-medium text-white/95 sm:left-[120px] sm:block">
              Iduka riri kuri ISOKO · {shop.district_name}
            </div>
          </div>
        ) : (
          <div className="imigongo-surface relative flex h-40 w-full items-center justify-center sm:h-52">
            <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/85 px-5 py-3 shadow-sm">
              <Store className="h-8 w-8 text-[#0B6E4F]" aria-hidden="true" />
              <span className="font-display text-sm font-bold text-[#0B6E4F]">Iduka riri kuri ISOKO</span>
            </div>
          </div>
        )}
        <RwandanGeometricPattern className="h-2 w-full text-[#0B6E4F]/20 bg-[#F1F6F3]" />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {shop.logo_path ? (
                <img
                  src={shop.logo_path}
                  alt={shop.name}
                  className="-mt-12 sm:-mt-14 relative z-10 h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
                />
              ) : (
                <div className="-mt-12 sm:-mt-14 relative z-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-[#0B6E4F] text-xl font-bold text-white shadow-md">
                  {shop.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="font-display text-2xl font-extrabold text-[#1B1F23]">{shop.name}</h1>
                  {shop.identity_status === 'verified' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0B6E4F]">
                      <IsokoVerifiedSeal className="h-4 w-4" />
                      <span>{RW.verified}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-slate-500">Konti ntiragenzurwa mu byangombwa</span>
                  )}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#0B6E4F]" aria-hidden="true" />
                    {shop.district_name}
                    {shop.sector_name ? `, ${shop.sector_name}` : ''}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{RW.member_since.replace('{n}', String(memberDays))}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums font-medium">{products.length} ibicuruzwa</span>
                </div>

                {shop.about && <p className="mt-2.5 text-sm text-slate-700 max-w-xl">{shop.about}</p>}
                <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#F7FAF8] p-4 sm:flex-row sm:items-start">
                  {shop.seller_avatar_path?<img src={shop.seller_avatar_path} alt={shop.seller_name||'Umucuruzi'} className="h-16 w-16 shrink-0 rounded-full border-2 border-white object-cover shadow-sm"/>:<div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-xl font-bold text-[#0B6E4F]">{(shop.seller_name||shop.name).slice(0,1).toUpperCase()}</div>}
                  <div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-[#0B6E4F]">Uwo mu mucuruzi</p><p className="mt-0.5 text-sm font-bold text-[#1B1F23]">{shop.seller_name||shop.name}</p>{shop.seller_bio&&<p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">{shop.seller_bio}</p>}
                  {Object.entries(shop.social_links??{}).filter(([,url])=>/^https:\/\//i.test(url)).length>0&&<div className="mt-2 flex flex-wrap gap-2">{Object.entries(shop.social_links??{}).filter(([,url])=>/^https:\/\//i.test(url)).map(([key,url])=><a key={key} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold capitalize text-[#0B6E4F] hover:bg-[#F1F6F3]">{key}</a>)}</div>}</div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-600">
                  {shop.delivery_text && (
                    <span className="inline-flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-[#0B6E4F]" aria-hidden="true" />
                      <span>{shop.delivery_text}</span>
                    </span>
                  )}
                  {shop.hours_text && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[#0B6E4F]" aria-hidden="true" />
                      <span>{shop.hours_text}</span>
                    </span>
                  )}
                  {shop.landmark && <span>Aho biherereye: {shop.landmark}</span>}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('wa_click', null, shop.id)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white hover:bg-[#1FB858]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`tel:+${shop.phone}`}
                onClick={() => trackEvent('call_click', null, shop.id)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50"
              >
                <Phone className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
                <span>{RW.call}</span>
              </a>
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
                <span>{copied ? RW.copied : RW.share_shop}</span>
              </button>
              <button
                type="button"
                onClick={() => setQrOpen(true)}
                aria-label="QR Code y'iduka"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50"
              >
                <QrCode className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
                <span>QR</span>
              </button>
              <button
                type="button"
                onClick={handleFollow}
                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3.5 text-sm font-semibold transition-colors ${
                  isFollowing
                    ? 'border-[#0B6E4F] bg-[#0B6E4F] text-white'
                    : 'border-slate-300 bg-white text-[#1B1F23] hover:border-[#0B6E4F]'
                }`}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span>{isFollowing ? 'Ukurikira iri duka' : 'Kurikira iduka'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* In-Shop Search, Category Filter Bar & Report */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#F1F6F3] p-1">
          <button
            type="button"
            onClick={() => setFilterCat('')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold ${
              filterCat === '' ? 'bg-white text-[#0B6E4F] shadow-xs' : 'text-slate-600'
            }`}
          >
            {RW.all} ({products.length})
          </button>
          {parentCategories.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setFilterCat(c.slug)}
              className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold ${
                filterCat === c.slug ? 'bg-white text-[#0B6E4F] shadow-xs' : 'text-slate-600'
              }`}
            >
              {c.name_rw}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              placeholder="Shakisha muri iri duka..."
              aria-label="Shakisha muri iri duka"
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#C0392B] hover:underline shrink-0"
          >
            <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{RW.report}</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="rounded-2xl bg-[#F1F6F3] p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            Nta bicuruzwa bihuye n'ibyo wasabye muri iri duka.
          </p>
          {(filterCat || shopSearch) && (
            <button
              type="button"
              onClick={() => {
                setFilterCat('');
                setShopSearch('');
              }}
              className="mt-3 min-h-[44px] rounded-xl bg-[#0B6E4F] px-4 text-xs font-semibold text-white"
            >
              Reba byose ({products.length})
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-5">
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
