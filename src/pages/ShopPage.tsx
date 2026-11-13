import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Flag,
  MapPin,
  MessageCircle,
  Phone,
  QrCode,
  Share2,
} from 'lucide-react';
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
    if (!filterCat) return products;
    return products.filter(
      (p) => p.parent_category?.slug === filterCat || p.category?.slug === filterCat
    );
  }, [products, filterCat]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 space-y-6">
        <div className="h-44 animate-pulse rounded-2xl bg-[#F1F6F3]" />
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
        <h1 className="text-xl font-bold text-[#1B1F23]">{RW.shop_missing}</h1>
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
      {/* Shop Header (D-01, D-02) */}
      <section className="rounded-2xl border border-slate-200 bg-[#F1F6F3] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {shop.logo_path ? (
              <img
                src={shop.logo_path}
                alt={shop.name}
                className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 bg-white object-cover sm:h-20 sm:w-20"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0B6E4F] text-xl font-bold text-white">
                {shop.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-[#1B1F23]">{shop.name}</h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B6E4F]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>{RW.verified}</span>
                </span>
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
                <span className="tabular-nums">{products.length} ibicuruzwa</span>
              </div>

              {shop.about && <p className="mt-2 text-sm text-slate-700 max-w-xl">{shop.about}</p>}

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                {shop.delivery_text && <span>{shop.delivery_text}</span>}
                {shop.hours_text && <span>Amasaha: {shop.hours_text}</span>}
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
      </section>

      {/* Filter bar + Report link */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-[#F1F6F3] p-1">
          <button
            type="button"
            onClick={() => setFilterCat('')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold ${
              filterCat === '' ? 'bg-white text-[#0B6E4F] shadow-sm' : 'text-slate-600'
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
                filterCat === c.slug ? 'bg-white text-[#0B6E4F] shadow-sm' : 'text-slate-600'
              }`}
            >
              {c.name_rw}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="inline-flex min-h-[40px] items-center gap-1.5 text-xs font-semibold text-[#C0392B] hover:underline"
        >
          <Flag className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{RW.report}</span>
        </button>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <p className="rounded-xl bg-[#F1F6F3] p-8 text-center text-sm text-slate-600">
          Nta bicuruzwa biri muri iki cyiciro ubu.
        </p>
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
