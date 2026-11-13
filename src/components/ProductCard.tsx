import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { calculateDiscountPercent, getLowStockCount } from '../lib/algorithm';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { Product } from '../types/marketplace';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, compact = false }) => {
  const { navigate } = useMarketplace();
  const [imgError, setImgError] = useState(false);

  const thumb = product.images[0]?.path_thumb || product.images[0]?.path_full || '';
  const discountPct = calculateDiscountPercent(product.price, product.old_price);
  const lowStock = product.status === 'active' ? getLowStockCount(product.variants) : null;
  const isSoldOut = product.status === 'sold_out';

  const conditionLabel = product.condition === 'new' ? RW.condition_new : RW.condition_used;
  const shopName = product.shop?.name ?? 'Iduka';
  const districtName = product.shop?.district_name ?? 'Kigali';

  return (
    <article
      className={`group flex flex-col rounded-xl border border-slate-200/90 bg-white overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        compact ? 'w-[172px] sm:w-[210px] shrink-0' : 'w-full'
      }`}
    >
      <a
        href={`/p/${product.id}`}
        onClick={(e) => {
          e.preventDefault();
          navigate(`/p/${product.id}`);
        }}
        className="flex flex-1 flex-col text-left"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-[#F1F6F3]">
          {thumb && !imgError ? (
            <img
              src={thumb}
              alt={product.name}
              loading="lazy"
              width={400}
              height={400}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                isSoldOut ? 'opacity-45 grayscale' : ''
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F1F6F3] p-4 text-center text-slate-500">
              <Package className="h-8 w-8 text-[#0B6E4F]/60" aria-hidden="true" />
              <span className="text-xs font-medium line-clamp-2">{product.name}</span>
            </div>
          )}

          {isSoldOut && (
            <div className="absolute inset-x-0 bottom-0 bg-[#1B1F23]/80 px-2.5 py-1 text-center text-xs font-semibold text-white">
              {RW.sold_out}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3">
          {/* Unboxed clean metadata (Zero-Pill Rule) */}
          <div className="flex items-center gap-1.5 text-[12px] text-slate-600 truncate">
            <span>{conditionLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{districtName}</span>
            {discountPct >= 5 && !isSoldOut && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#C0392B]">-{discountPct}%</span>
              </>
            )}
          </div>

          <h3 className="mt-1 text-[15px] font-semibold leading-snug text-[#1B1F23] line-clamp-2 min-h-[40px]">
            {product.name}
          </h3>

          <div className="mt-auto pt-2">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-[17px] font-bold text-[#0B6E4F] tabular-nums">
                {formatRwfCurrency(product.price)}
              </span>
              {discountPct >= 5 && product.old_price && (
                <span className="text-xs text-slate-500 line-through tabular-nums">
                  {formatRwfCurrency(product.old_price)}
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center justify-between gap-2 text-[12px]">
              <span className="truncate text-slate-600">{shopName}</span>
              {lowStock !== null && (
                <span className="font-semibold text-[#B45309] shrink-0">
                  {RW.only_left.replace('{n}', String(lowStock))}
                </span>
              )}
            </div>
          </div>
        </div>
      </a>
    </article>
  );
};
