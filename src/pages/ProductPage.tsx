import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  MessageCircle,
  Phone,
  Ruler,
  Share2,
  ShieldAlert,
  ShoppingCart,
  Store,
  Truck,
} from 'lucide-react';
import { IsokoVerifiedSeal } from '../components/IsokoLogo';
import { ProductCard } from '../components/ProductCard';
import { ReportModal } from '../components/ReportModal';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { calculateDiscountPercent, getLowStockCount, interleaveBySeller } from '../lib/algorithm';
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

const SHOE_SIZE_CHART = [
  { eu: '36', cm: '22.5' },
  { eu: '37', cm: '23.0' },
  { eu: '38', cm: '24.0' },
  { eu: '39', cm: '24.5' },
  { eu: '40', cm: '25.0' },
  { eu: '41', cm: '26.0' },
  { eu: '42', cm: '26.5' },
  { eu: '43', cm: '27.5' },
  { eu: '44', cm: '28.0' },
  { eu: '45', cm: '29.0' },
  { eu: '46', cm: '29.5' },
];

const CLOTHES_SIZE_CHART = [
  { size: 'XS', chest: '84–88 cm' },
  { size: 'S', chest: '88–94 cm' },
  { size: 'M', chest: '94–100 cm' },
  { size: 'L', chest: '100–106 cm' },
  { size: 'XL', chest: '106–112 cm' },
  { size: 'XXL', chest: '112–118 cm' },
];

export const ProductPage: React.FC<ProductPageProps> = ({ productId }) => {
  const { navigate, addToCart, cartCount, location, markProductViewed, recents, bootstrap } =
    useMarketplace();
  const { t } = useT();

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
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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

  const allProducts = bootstrap?.products ?? [];

  // Fallback/complement up to 24 similar items from bootstrap so "Bisa n'ibi" renders rich 3-col density
  const similarItems = useMemo(() => {
    if (!product) return [];
    const seen = new Set<string>([product.id]);
    const list: Product[] = [];
    for (const p of similar) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    const sameCat = allProducts.filter(
      (p) =>
        !seen.has(p.id) &&
        p.status === 'active' &&
        (p.category_id === product.category_id ||
          p.parent_category?.id === product.parent_category?.id)
    );
    for (const p of interleaveBySeller(sameCat, { maxConsecutiveSameShop: 1 })) {
      if (list.length >= 24) break;
      seen.add(p.id);
      list.push(p);
    }
    if (list.length < 24) {
      const rest = allProducts.filter((p) => !seen.has(p.id) && p.status === 'active');
      for (const p of interleaveBySeller(rest, { maxConsecutiveSameShop: 1 })) {
        if (list.length >= 24) break;
        list.push(p);
      }
    }
    return list.slice(0, 24);
  }, [product, similar, allProducts]);

  // "Ibindi mu iduka ryabo" from buyTogether + same-shop items in bootstrap
  const moreFromShop = useMemo(() => {
    if (!product) return [];
    const seen = new Set<string>([product.id]);
    const list: Product[] = [];
    for (const p of buyTogether) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push(p);
      }
    }
    for (const p of allProducts) {
      if (!seen.has(p.id) && p.shop_id === product.shop_id && p.status === 'active') {
        seen.add(p.id);
        list.push(p);
      }
    }
    return list.slice(0, 12);
  }, [product, buyTogether, allProducts]);

  // "Wabonye vuba"
  const recentlyViewedProducts = useMemo(() => {
    const byId = new Map(allProducts.map((p) => [p.id, p]));
    return recents
      .filter((r) => r.productId !== productId)
      .map((r) => byId.get(r.productId))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .slice(0, 9);
  }, [allProducts, recents, productId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-2 py-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="aspect-[4/3] max-h-[46vh] animate-pulse rounded-md bg-white border border-[#E3E0D8] lg:col-span-6" />
          <div className="space-y-3 lg:col-span-6">
            <div className="h-6 w-3/4 animate-pulse rounded bg-white" />
            <div className="h-8 w-1/3 animate-pulse rounded bg-white" />
            <div className="h-24 w-full animate-pulse rounded bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-10 sm:px-6">
        <div className="rounded-lg border border-[#E3E0D8] bg-[#E9F0EB] p-6 text-center">
          <h1 className="text-[18px] font-semibold text-[#202724]">{t('product_missing')}</h1>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-4 h-10 rounded-md bg-[#214E43] px-5 text-xs font-semibold text-white"
          >
            {t('back_home')}
          </button>
        </div>

        {alternatives.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[15px] font-semibold text-[#202724]">{t('similar')}</h2>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-2.5">
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
  const isShopVerified = shop?.status === 'approved' || shop?.identity_status === 'verified';

  const productUrl = `${window.location.origin}/p/${product.id}`;
  // WhatsApp messages stay in Kinyarwanda (rw) per Multi-Language Specification
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

  const performAddToCart = (goToCart = false) => {
    if (isSoldOut) return;
    const sizeToUse =
      selectedSize ||
      product.variants.find((v) => v.in_stock && (v.qty === null || v.qty > 0))?.size_label ||
      'Bisanzwe';
    if (!selectedSize && product.variants.length > 1) {
      setFeedback('Banza uhitemo ingano (size) mbere yo gukomeza.');
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
        size: sizeToUse,
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
    } else if (goToCart) {
      navigate('/igare');
    } else {
      setFeedback('Byashyizwe mu gare.');
    }
  };

  const handleShare = async () => {
    trackEvent('share', product.id, product.shop_id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} — ${formatRwfCurrency(product.price)}`,
          url: productUrl,
        });
        return;
      } catch {
        // fall through to copy
      }
    }
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
  const sizeSet = product.category?.size_set ?? product.parent_category?.size_set ?? '';
  const isShoe = sizeSet.includes('shoe') || product.parent_category?.slug === 'inkweto';
  const isClothing = sizeSet.includes('cloth') || product.parent_category?.slug === 'imyenda';

  return (
    <div className="mx-auto max-w-6xl px-2 py-3 pb-20 sm:px-6 lg:pb-12">
      {/* Compact Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-[11.5px] text-[#68716D] overflow-hidden">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="shrink-0 hover:text-[#214E43] hover:underline"
        >
          {t('home')}
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
              className="shrink-0 hover:text-[#214E43] hover:underline"
            >
              {product.parent_category.name_rw}
            </a>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="truncate font-medium text-[#202724]">{product.name}</span>
      </nav>

      <div className="grid gap-4 lg:grid-cols-12 lg:gap-8">
        {/* Left: 4:3 (<=46vh) Gallery + 48px Thumbnails */}
        <div className="lg:col-span-6">
          <div className="relative aspect-[4/3] max-h-[46vh] w-full overflow-hidden rounded-md border border-[#E3E0D8] bg-[#EEECE6]">
            {activeImg && (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                aria-label={product.name}
                className="block h-full w-full cursor-zoom-in"
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
                  aria-label={t('back')}
                  onClick={() => setActiveImgIdx((i) => (i === 0 ? images.length - 1 : i - 1))}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#202724] border border-[#E3E0D8] hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label={t('continue_btn')}
                  onClick={() => setActiveImgIdx((i) => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#202724] border border-[#E3E0D8] hover:bg-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <span className="absolute bottom-2 right-2 rounded bg-[#202724]/75 px-2 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                  {activeImgIdx + 1}/{images.length}
                </span>
              </>
            )}

            {isSoldOut && (
              <div className="absolute inset-x-0 bottom-0 bg-[#202724]/85 py-1.5 text-center text-xs font-semibold text-white">
                {t('sold_out')}
              </div>
            )}
          </div>

          {/* 48px Thumbnail Strip */}
          {images.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImgIdx(idx)}
                  aria-label={`${product.name} ${idx + 1}`}
                  className={`h-12 w-12 shrink-0 overflow-hidden rounded border-2 transition-colors ${
                    idx === activeImgIdx ? 'border-[#214E43]' : 'border-[#E3E0D8]'
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

        {/* Right: Title (15/20 600), Price (20/24 700), 12px Meta, 52px Shop Row, 32px Size/Color Chips, Specs */}
        <div className="lg:col-span-6 space-y-3.5">
          <div>
            <h1 className="text-[15px] font-semibold leading-[20px] text-[#202724] line-clamp-2 sm:text-[18px] sm:leading-[24px]">
              {product.name}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-baseline gap-2.5">
              <span className="text-[20px] font-bold leading-[24px] text-[#214E43] tabular-nums">
                {formatRwfCurrency(product.price)}
              </span>
              {discountPct >= 5 && product.old_price && (
                <>
                  <span className="text-xs text-[#68716D] line-through tabular-nums">
                    {formatRwfCurrency(product.old_price)}
                  </span>
                  <span className="rounded bg-[#BD594A] px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums">
                    -{discountPct}%
                  </span>
                </>
              )}
            </div>

            {/* 12px Meta line */}
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#68716D]">
              <span className="font-medium text-[#202724]">
                {product.condition === 'new' ? t('condition_new') : t('condition_used')}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {product.brand
                  ? `${product.brand}${product.authentic ? ` (${t('original_badge')})` : ''}`
                  : t('no_brand')}
              </span>
              {lowStock !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#BD594A]">
                    {t('only_left', { n: lowStock })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* 52px Shop Row (36px avatar, name, Verified if approved, district, "Reba iduka") */}
          {shop && (
            <div className="flex min-h-[52px] items-center justify-between gap-2.5 rounded-md border border-[#E3E0D8] bg-white px-2.5 py-1.5">
              <div className="flex min-w-0 items-center gap-2.5">
                {shop.logo_path ? (
                  <img
                    src={shop.logo_path}
                    alt={shop.name}
                    className="h-9 w-9 shrink-0 rounded-full border border-[#E3E0D8] object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#214E43] text-xs font-bold text-white">
                    {shop.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="truncate text-[13px] font-semibold text-[#202724]">
                      {shop.name}
                    </span>
                    {isShopVerified ? (
                      <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-[#214E43]">
                        <IsokoVerifiedSeal className="h-3.5 w-3.5" />
                        <span>{t('verified')}</span>
                      </span>
                    ) : (
                      <span className="shrink-0 text-[10.5px] text-[#68716D]">
                        {t('unverified')}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[11px] text-[#68716D]">
                    {shop.district_name}
                    {shop.sector_name ? `, ${shop.sector_name}` : ''}
                  </p>
                </div>
              </div>
              <a
                href={`/i/${shop.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/i/${shop.slug}`);
                }}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md border border-[#214E43] px-2.5 text-[11.5px] font-semibold text-[#214E43] hover:bg-[#214E43] hover:text-white transition-colors"
              >
                <Store className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('view_shop')}</span>
              </a>
            </div>
          )}

          {/* 32px Visible Variant / Size Buttons (NO drop-down!) */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-semibold text-[#202724]">
                {t('choose_size')}
              </span>
              {(isShoe || isClothing) && (
                <button
                  type="button"
                  onClick={() => setShowSizeGuide((s) => !s)}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#214E43] hover:underline"
                >
                  <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t('size_guide')}</span>
                </button>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {product.variants.map((v) => {
                const available = !isSoldOut && v.in_stock && (v.qty === null || v.qty > 0);
                const active = selectedSize === v.size_label;
                return (
                  <button
                    key={v.id}
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      setSelectedSize(v.size_label);
                      setFeedback(null);
                    }}
                    className={`h-8 min-w-[40px] rounded border px-2.5 text-xs font-semibold transition-colors ${
                      !available
                        ? 'border-[#E3E0D8] bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                        : active
                          ? 'border-[#214E43] bg-[#214E43] text-white'
                          : 'border-[#C9CEC7] bg-white text-[#202724] hover:border-[#214E43]'
                    }`}
                  >
                    {v.size_label}
                  </button>
                );
              })}
            </div>

            {/* Baymard Footwear / Apparel Sizing Chart */}
            {showSizeGuide && (isShoe || isClothing) && (
              <div className="mt-2 rounded-md border border-[#E3E0D8] bg-[#F7F5F0] p-2.5 text-[11.5px]">
                <p className="font-semibold text-[#202724]">{t('size_guide')}</p>
                {isShoe ? (
                  <>
                    <p className="mt-0.5 text-[11px] text-[#68716D]">{t('size_guide_shoe_note')}</p>
                    <div className="mt-2 grid grid-cols-4 gap-1 sm:grid-cols-6">
                      {SHOE_SIZE_CHART.map((row) => (
                        <div key={row.eu} className="rounded bg-white border border-[#E3E0D8] px-1.5 py-1 text-center tabular-nums">
                          <span className="font-semibold text-[#202724]">EU {row.eu}</span>
                          <span className="block text-[10px] text-[#68716D]">{row.cm} cm</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 grid grid-cols-3 gap-1 sm:grid-cols-6">
                    {CLOTHES_SIZE_CHART.map((row) => (
                      <div key={row.size} className="rounded bg-white border border-[#E3E0D8] px-1.5 py-1 text-center tabular-nums">
                        <span className="font-semibold text-[#202724]">{row.size}</span>
                        <span className="block text-[10px] text-[#68716D]">{row.chest}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 32px Visible Color Chips */}
          {product.colors.length > 0 && (
            <div>
              <span className="block text-[12.5px] font-semibold text-[#202724]">
                {t('color_label')}:{' '}
                <span className="font-normal text-[#68716D]">{selectedColor || product.colors[0]}</span>
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {product.colors.map((c) => {
                  const active = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`h-8 rounded border px-2.5 text-xs font-semibold transition-colors ${
                        active
                          ? 'border-[#214E43] bg-[#E9F0EB] text-[#214E43]'
                          : 'border-[#C9CEC7] bg-white text-[#202724] hover:border-[#214E43]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Desktop Primary Actions */}
          <div className="hidden lg:flex gap-2.5 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                recordCategoryInterest(product.category_id, 5);
                trackEvent('wa_click', product.id, product.shop_id);
              }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-md border border-[#1A7F43] bg-white px-4 text-sm font-semibold text-[#1A7F43] hover:bg-[#E9F0EB] transition-colors"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>{t('chat_seller')} (WhatsApp)</span>
            </a>
            <button
              type="button"
              disabled={isSoldOut}
              onClick={() => performAddToCart(false)}
              aria-label={t('add_to_cart')}
              className="inline-flex h-11 w-12 items-center justify-center rounded-md border border-[#214E43] bg-white text-[#214E43] hover:bg-[#E9F0EB] disabled:opacity-40 transition-colors"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={isSoldOut}
              onClick={() => performAddToCart(true)}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-[#214E43] px-5 text-sm font-semibold text-white hover:bg-[#183B33] disabled:bg-slate-300 transition-colors"
            >
              {isSoldOut ? t('sold_out') : t('buy_now')}
            </button>
          </div>

          {feedback && (
            <div role="status" className="rounded-md border border-[#214E43]/30 bg-[#E9F0EB] px-3 py-2 text-xs font-medium text-[#214E43]">
              {feedback}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-[13px] leading-relaxed text-[#49524D] whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* Baymard Specifications & Delivery/Return Table */}
          <div className="rounded-md border border-[#E3E0D8] bg-white p-3">
            <h2 className="text-[13px] font-semibold text-[#202724]">{t('specs_title')}</h2>
            <dl className="mt-2 divide-y divide-[#E3E0D8] text-[12px]">
              <div className="flex justify-between gap-2 py-1.5">
                <dt className="text-[#68716D]">{t('category_label')}</dt>
                <dd className="font-medium text-[#202724] text-right">
                  {product.parent_category?.name_rw ?? product.category?.name_rw ?? '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2 py-1.5">
                <dt className="text-[#68716D]">{t('condition_label')}</dt>
                <dd className="font-medium text-[#202724]">
                  {product.condition === 'new' ? t('condition_new') : t('condition_used')}
                </dd>
              </div>
              <div className="flex justify-between gap-2 py-1.5">
                <dt className="text-[#68716D]">{t('brand_label')}</dt>
                <dd className="font-medium text-[#202724]">{product.brand || t('no_brand')}</dd>
              </div>
              <div className="flex justify-between gap-2 py-1.5">
                <dt className="text-[#68716D] flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
                  <span>{t('delivery_label')}</span>
                </dt>
                <dd className="font-medium text-[#202724] text-right max-w-[60%]">
                  {shop?.delivery_text || 'Kigali & Intara · Kuri WhatsApp'}
                </dd>
              </div>
              <div className="flex justify-between gap-2 py-1.5">
                <dt className="text-[#68716D]">{t('return_label')}</dt>
                <dd className="font-medium text-[#202724] text-right max-w-[60%]">
                  {t('return_policy_default')}
                </dd>
              </div>
            </dl>
          </div>

          {/* Share & Report Bar */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[#E3E0D8] pt-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E3E0D8] bg-white px-3 text-xs font-semibold text-[#202724] hover:border-[#214E43]"
            >
              <Share2 className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
              <span>{copiedLink ? t('copied') : t('share')}</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(productUrl).catch(() => undefined);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E3E0D8] bg-white px-3 text-xs font-semibold text-[#202724] hover:border-[#214E43]"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('copy_link')}</span>
            </button>
            {shop?.phone && (
              <a
                href={`tel:+${shop.phone}`}
                onClick={() => trackEvent('call_click', product.id, product.shop_id)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E3E0D8] bg-white px-3 text-xs font-semibold text-[#202724] hover:border-[#214E43]"
              >
                <Phone className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
                <span>{t('call')}</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              className="ml-auto inline-flex h-9 items-center gap-1 rounded-md px-2.5 text-xs font-semibold text-[#BD594A] hover:bg-[#FAF0ED]"
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('report')}</span>
            </button>
          </div>

          {/* Safety tips */}
          <div className="rounded-md border border-[#E3E0D8] bg-[#F7F5F0] p-3 text-[11.5px] text-[#68716D] space-y-1">
            <p className="flex items-center gap-1.5 font-semibold text-[#202724]">
              <ShieldAlert className="h-3.5 w-3.5 text-[#BD594A]" aria-hidden="true" />
              <span>{t('safety_title')}</span>
            </p>
            <p>1. {t('safety_short')}</p>
            <p>2. {t('payment_note')}</p>
          </div>
        </div>
      </div>

      {/* Bottom Section (1): "Ibindi mu iduka ryabo" — horizontal scroll, 3 visible */}
      {moreFromShop.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#202724]">{t('more_from_shop')}</h2>
            {shop && (
              <a
                href={`/i/${shop.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/i/${shop.slug}`);
                }}
                className="text-xs font-semibold text-[#214E43] hover:underline"
              >
                {t('view_shop')}
              </a>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar sm:gap-2.5">
            {moreFromShop.map((p) => (
              <div key={p.id} className="w-[31%] min-w-[106px] shrink-0 sm:w-[22%] lg:w-[15.5%]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bottom Section (2): "Bisa n'ibi" — 3-col grid, 24 items + "Reba byinshi" */}
      {similarItems.length > 0 && (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-[15px] font-semibold text-[#202724]">{t('similar')}</h2>
            <button
              type="button"
              onClick={() =>
                navigate(
                  product.parent_category
                    ? `/c/${product.parent_category.slug}`
                    : '/shakisha'
                )
              }
              className="text-xs font-semibold text-[#214E43] hover:underline"
            >
              {t('load_more')}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-2.5">
            {similarItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Bottom Section (3): "Wabonye vuba" — Recently viewed */}
      {recentlyViewedProducts.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-[15px] font-semibold text-[#202724]">{t('recent')}</h2>
          <div className="grid grid-cols-3 gap-1.5 min-[480px]:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 sm:gap-2.5">
            {recentlyViewedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 52px Sticky Bottom Bar: [Vugana | Igare (icon) | Gura] (§8) */}
      <div className="fixed bottom-0 inset-x-0 z-40 h-[52px] border-t border-[#E3E0D8] bg-white px-2.5 flex items-center gap-2 lg:hidden">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            recordCategoryInterest(product.category_id, 5);
            trackEvent('wa_click', product.id, product.shop_id);
          }}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border border-[#1A7F43] bg-white px-3 text-xs font-semibold text-[#1A7F43]"
        >
          <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t('chat_seller')}</span>
        </a>

        <button
          type="button"
          disabled={isSoldOut}
          onClick={() => performAddToCart(false)}
          aria-label={t('add_to_cart')}
          className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#C9CEC7] bg-white text-[#202724] disabled:opacity-40"
        >
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#BD594A] px-1 text-[9px] font-bold text-white tabular-nums">
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          disabled={isSoldOut}
          onClick={() => performAddToCart(true)}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-[#214E43] px-4 text-xs font-semibold text-white hover:bg-[#183B33] disabled:bg-slate-300"
        >
          {isSoldOut ? t('sold_out') : t('buy_now')}
        </button>
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
            className="max-h-[90vh] max-w-full rounded-md object-contain"
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
