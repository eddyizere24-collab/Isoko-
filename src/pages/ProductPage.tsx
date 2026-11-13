import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  MessageCircle,
  Phone,
  Share2,
  ShieldAlert,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { ReportModal } from '../components/ReportModal';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { calculateDiscountPercent, getLowStockCount } from '../lib/algorithm';
import { fetchProductDetail } from '../lib/api';
import { recordCategoryInterest } from '../lib/storage';
import { trackEvent } from '../lib/track';
import {
  buildSingleProductWhatsAppMessage,
  buildWhatsAppLink,
  formatRwfCurrency,
} from '../lib/whatsapp';
import type { Product } from '../types/marketplace';

interface ProductPageProps {
  productId: string;
}

export const ProductPage: React.FC<ProductPageProps> = ({ productId }) => {
  const { navigate, addToCart, location, markProductViewed } = useMarketplace();

  const [product, setProduct] = useState<Product | null>(null);
  const [similar, setSimilar] = useState<Product[]>([]);
  const [buyTogether, setBuyTogether] = useState<Product[]>([]);
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    setActiveImgIdx(0);
    setFeedback(null);

    fetchProductDetail(productId)
      .then((res) => {
        if (!active) return;
        setProduct(res.product);
        setSimilar(res.similar);
        setBuyTogether(res.buyTogether);
        const firstAvailable = res.product.variants.find(
          (v) => v.in_stock && (v.qty === null || v.qty > 0)
        );
        setSelectedSize(firstAvailable?.size_label ?? '');
        setSelectedColor(res.product.colors[0] ?? '');
        markProductViewed(res.product.id, res.product.shop_id, res.product.category_id);

        // Section 8.8: Product JSON-LD for SEO
        const scriptId = 'product-jsonld';
        let script = document.getElementById(scriptId) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement('script');
          script.id = scriptId;
          script.type = 'application/ld+json';
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify({
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: res.product.name,
          description: res.product.description,
          image: res.product.images.map((i) => i.path_full),
          brand: res.product.brand ? { '@type': 'Brand', name: res.product.brand } : undefined,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'RWF',
            price: res.product.price,
            availability:
              res.product.status === 'active'
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
          },
        });
      })
      .catch((err: Error & { alternatives?: Product[] }) => {
        if (!active) return;
        setNotFound(true);
        setAlternatives(err.alternatives ?? []);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId, markProductViewed]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="aspect-square animate-pulse rounded-2xl bg-[#F1F6F3] lg:col-span-6" />
          <div className="space-y-4 lg:col-span-6">
            <div className="h-8 w-3/4 animate-pulse rounded bg-[#F1F6F3]" />
            <div className="h-10 w-1/3 animate-pulse rounded bg-[#F1F6F3]" />
            <div className="h-28 w-full animate-pulse rounded-xl bg-[#F1F6F3]" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-[#F1F6F3] p-8 text-center">
          <h1 className="text-xl font-bold text-[#1B1F23]">{RW.product_missing}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Iki gicuruzwa gishobora kuba cyaravanyweho cyangwa cyashize. Reba ibindi bisa na cyo hasi.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 min-h-[44px] rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
          >
            Subira ahabanza
          </button>
        </div>

        {alternatives.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#1B1F23]">Ibindi bicuruzwa biriho</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-5">
              {alternatives.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const isSoldOut = product.status === 'sold_out';
  const discountPct = calculateDiscountPercent(product.price, product.old_price);
  const lowStock = product.status === 'active' ? getLowStockCount(product.variants) : null;
  const shop = product.shop;
  const memberDays = shop?.approved_at
    ? Math.max(1, Math.floor((Date.now() - new Date(shop.approved_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  const productUrl = `${window.location.origin}/p/${product.id}`;
  const waMsg = buildSingleProductWhatsAppMessage({
    shopName: shop?.name ?? 'Umucuruzi',
    productName: product.name,
    size: selectedSize || product.variants[0]?.size_label || 'Bisanzwe',
    color: selectedColor || product.colors[0] || '',
    price: product.price,
    productUrl,
    location,
  });
  const waUrl = buildWhatsAppLink(shop?.whatsapp ?? '250788000000', waMsg);

  const handleAddToCart = () => {
    if (isSoldOut) return;
    if (!selectedSize) {
      setFeedback('Banza uhitemo size mbere yo gushyira mu gare.');
      return;
    }
    const res = addToCart(
      {
        productId: product.id,
        shopId: product.shop_id,
        shopName: shop?.name ?? 'Iduka',
        shopSlug: shop?.slug ?? '',
        shopWhatsapp: shop?.whatsapp ?? '',
        shopPhone: shop?.phone ?? '',
        productName: product.name,
        thumbUrl: product.images[0]?.path_thumb ?? product.images[0]?.path_full ?? '',
        size: selectedSize,
        color: selectedColor,
        priceSeen: product.price,
        currentPrice: product.price,
        qty: 1,
        status: product.status,
        sizeInStock: true,
        addedAt: Date.now(),
      },
      product.category_id
    );
    if (!res.ok) {
      setFeedback(res.error ?? 'Ntibishobotse gushyira mu gare.');
    } else {
      setFeedback('Byashyizwe mu gare! Kanda Igare hejuru kugira ngo wohereze kuri WhatsApp.');
    }
  };

  const handleCopyShare = async () => {
    trackEvent('share', product.id, product.shop_id);
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  const images = product.images;
  const activeImg = images[activeImgIdx] ?? images[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:pb-12">
      {/* Breadcrumb */}
      <nav aria-label="Aho uherereye" className="mb-4 flex items-center gap-2 text-xs text-slate-600">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="hover:text-[#0B6E4F] hover:underline"
        >
          Ahabanza
        </a>
        {product.parent_category && (
          <>
            <span aria-hidden="true">/</span>
            <a
              href={`/c/${product.parent_category.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/c/${product.parent_category!.slug}`);
              }}
              className="hover:text-[#0B6E4F] hover:underline"
            >
              {product.parent_category.name_rw}
            </a>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="truncate text-[#1B1F23] font-medium">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Product Image Gallery */}
        <div className="lg:col-span-6">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-[#F1F6F3]">
            {activeImg && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label="Agura ifoto"
                className="h-full w-full block cursor-zoom-in"
              >
                <img
                  src={activeImg.path_full}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className={`h-full w-full object-cover ${isSoldOut ? 'opacity-50 grayscale' : ''}`}
                />
              </button>
            )}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Ifoto ibanza"
                  onClick={() => setActiveImgIdx((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1B1F23] shadow hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Ifoto ikurikira"
                  onClick={() => setActiveImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#1B1F23] shadow hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 right-3 rounded-lg bg-[#1B1F23]/75 px-2.5 py-1 text-xs font-semibold text-white tabular-nums">
                  {activeImgIdx + 1}/{images.length}
                </span>
              </>
            )}

            {isSoldOut && (
              <div className="absolute inset-x-0 bottom-0 bg-[#1B1F23]/85 py-2 text-center text-sm font-bold text-white">
                {RW.sold_out}
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    idx === activeImgIdx ? 'border-[#0B6E4F]' : 'border-slate-200'
                  }`}
                >
                  <img
                    src={img.path_thumb}
                    alt={`${product.name} ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="font-semibold text-[#1B1F23]">
                {product.condition === 'new' ? RW.condition_new : RW.condition_used}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {product.brand
                  ? `${product.brand} (${RW.original_badge})`
                  : RW.no_brand}
              </span>
              {lowStock !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#B45309]">
                    {RW.only_left.replace('{n}', String(lowStock))}
                  </span>
                </>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold text-[#1B1F23] sm:text-3xl text-balance">
              {product.name}
            </h1>

            <div className="mt-3 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-bold text-[#0B6E4F] tabular-nums sm:text-3xl">
                {formatRwfCurrency(product.price)}
              </span>
              {discountPct >= 5 && product.old_price && (
                <>
                  <span className="text-base text-slate-500 line-through tabular-nums">
                    {formatRwfCurrency(product.old_price)}
                  </span>
                  <span className="text-sm font-bold text-[#C0392B] tabular-nums">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* C-03: Size selector */}
          <div>
            <span className="block text-sm font-bold text-[#1B1F23]">{RW.choose_size}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const available = !isSoldOut && v.in_stock && (v.qty === null || v.qty > 0);
                const active = selectedSize === v.size_label;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!available}
                    onClick={() => setSelectedSize(v.size_label)}
                    className={`min-h-[44px] min-w-[48px] rounded-xl border px-3.5 text-sm font-semibold transition-colors ${
                      !available
                        ? 'border-slate-200 bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                        : active
                          ? 'border-[#0B6E4F] bg-[#0B6E4F] text-white'
                          : 'border-slate-300 bg-white text-[#1B1F23] hover:border-[#0B6E4F]'
                    }`}
                  >
                    {v.size_label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* C-04: Color selector */}
          {product.colors.length > 0 && (
            <div>
              <span className="block text-sm font-bold text-[#1B1F23]">
                Ibara: <span className="font-normal text-slate-600">{selectedColor || product.colors[0]}</span>
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.colors.map((c) => {
                  const active = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`min-h-[40px] rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[#0B6E4F] bg-[#F1F6F3] text-[#0B6E4F]'
                          : 'border-slate-200 bg-white text-[#1B1F23] hover:border-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* Desktop primary actions */}
          <div className="hidden lg:flex flex-col gap-3 pt-1">
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSoldOut}
                onClick={handleAddToCart}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-bold text-white hover:bg-[#08553D] disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>{isSoldOut ? RW.sold_out : RW.add_to_cart}</span>
              </button>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  recordCategoryInterest(product.category_id, 5);
                  trackEvent('wa_click', product.id, product.shop_id);
                }}
                className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white hover:bg-[#1FB858] transition-colors"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>{RW.whatsapp_btn}</span>
              </a>
              {shop?.phone && (
                <a
                  href={`tel:+${shop.phone}`}
                  onClick={() => trackEvent('call_click', product.id, product.shop_id)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50"
                >
                  <Phone className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
                  <span>{RW.call}</span>
                </a>
              )}
            </div>
          </div>

          {feedback && (
            <div role="status" className="rounded-xl border border-[#0B6E4F]/30 bg-[#F1F6F3] px-4 py-3 text-sm font-medium text-[#0B6E4F]">
              {feedback}
            </div>
          )}

          {/* C-12: Share actions */}
          <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={handleCopyShare}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{copiedLink ? RW.copied : 'Koporora link'}</span>
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${product.name} - ${formatRwfCurrency(product.price)} ${productUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('share', product.id, product.shop_id)}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
            >
              <Share2 className="h-3.5 w-3.5 text-[#0B6E4F]" aria-hidden="true" />
              <span>Sangiza kuri WhatsApp</span>
            </a>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-[#C0392B] hover:bg-red-50 ml-auto"
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{RW.report}</span>
            </button>
          </div>

          {/* C-07: Verified Shop Card */}
          {shop && (
            <div className="rounded-2xl border border-slate-200 bg-[#F1F6F3] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-[#1B1F23]">{shop.name}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B6E4F]">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                      <span>{RW.verified}</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {shop.district_name}
                    {shop.sector_name ? `, ${shop.sector_name}` : ''} ·{' '}
                    {RW.member_since.replace('{n}', String(memberDays))}
                  </p>
                  {shop.delivery_text && (
                    <p className="mt-1 text-xs text-slate-700">{shop.delivery_text}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/i/${shop.slug}`)}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#0B6E4F] bg-white px-3.5 text-xs font-semibold text-[#0B6E4F] hover:bg-[#0B6E4F] hover:text-white transition-colors shrink-0"
                >
                  <Store className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{RW.view_shop}</span>
                </button>
              </div>
            </div>
          )}

          {/* C-11 & 10.4: Safety tips */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-1.5">
            <p className="flex items-center gap-1.5 font-semibold text-[#1B1F23]">
              <ShieldAlert className="h-4 w-4 text-[#E8A33D]" aria-hidden="true" />
              <span>{RW.safety_title}</span>
            </p>
            <p>1. {RW.safety_short}</p>
            <p>2. Ntukishyure amafaranga menshi mbere ku mucuruzi utazi; emeza izina kuri MoMo.</p>
            <p>3. {RW.payment_note}</p>
          </div>
        </div>
      </div>

      {/* C-09: Bigurwa hamwe (from same shop) */}
      {buyTogether.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-[#1B1F23]">
            {RW.buy_together} muri {shop?.name}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-5">
            {buyTogether.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* C-10: Ibisa na cyo */}
      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-bold text-[#1B1F23]">{RW.similar}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-5">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile bottom CTA bar (C-08, <= 15% mobile height) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 p-2.5 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <button
            type="button"
            disabled={isSoldOut}
            onClick={handleAddToCart}
            className="min-h-[44px] flex-1 rounded-xl bg-[#0B6E4F] px-3 text-xs font-bold text-white disabled:bg-slate-300"
          >
            {isSoldOut ? RW.sold_out : RW.add_to_cart}
          </button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              recordCategoryInterest(product.category_id, 5);
              trackEvent('wa_click', product.id, product.shop_id);
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#25D366] px-4 text-xs font-bold text-white"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>WhatsApp</span>
          </a>
          {shop?.phone && (
            <a
              href={`tel:+${shop.phone}`}
              aria-label={RW.call}
              onClick={() => trackEvent('call_click', product.id, product.shop_id)}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white text-[#1B1F23]"
            >
              <Phone className="h-4 w-4 text-[#0B6E4F]" />
            </a>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && activeImg && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <img
            src={activeImg.path_full}
            alt={product.name}
            className="max-h-[90vh] max-w-full rounded-xl object-contain"
          />
        </div>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="product"
        targetId={product.id}
        targetName={product.name}
      />
    </div>
  );
};
