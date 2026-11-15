import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { calculateDiscountPercent, getLowStockCount } from '../lib/algorithm';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { Product } from '../types/marketplace';
import { IsokoVerifiedSeal } from './IsokoLogo';

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

  const shopName = product.shop?.name ?? 'Iduka';
  const districtName = product.shop?.district_name ?? 'Kigali';
  const isVerified = product.shop?.status === 'approved';

  if (compact) {
    return (
      <article className="group flex w-full flex-col bg-white overflow-hidden">
        <a
          href={`/p/${product.id}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/p/${product.id}`);
          }}
          className="flex flex-1 flex-col text-left"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#F4F6F5] border border-[#E5E7EB]">
            {thumb && !imgError ? (
              <img
                src={thumb}
                alt={product.name}
                loading="lazy"
                decoding="async"
                width={400}
                height={400}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                  isSoldOut ? 'opacity-45 grayscale' : ''
                }`}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F4F6F5] text-[#6B7280]">
                <Package className="h-6 w-6 text-[#0B6E4F]/50" strokeWidth={1.5} aria-hidden="true" />
              </div>
            )}
            {discountPct >= 5 && !isSoldOut && (
              <span className="absolute left-1.5 top-1.5 rounded bg-[#C0392B] px-1 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums">
                -{discountPct}%
              </span>
            )}
            {isSoldOut && (
              <span className="absolute inset-x-0 bottom-0 bg-[#1B1F23]/80 py-0.5 text-center text-[10px] font-semibold text-white">
                {RW.sold_out}
              </span>
            )}
          </div>
          <div className="pt-1.5">
            <p className="text-[13px] font-bold leading-tight text-[#1B1F23] tabular-nums truncate">
              {formatRwfCurrency(product.price)}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-[#6B7280] truncate">
              {product.name}
            </p>
          </div>
        </a>
      </article>
    );
  }

  return (
    <article className="group flex w-full flex-col rounded-lg border border-[#E5E7EB] bg-white overflow-hidden transition-colors hover:border-[#0B6E4F]/50">
      <a
        href={`/p/${product.id}`}
        onClick={(e) => {
          e.preventDefault();
          navigate(`/p/${product.id}`);
        }}
        className="flex flex-1 flex-col text-left"
      >
        <div className="relative aspect-square w-full overflow-hidden bg-[#F4F6F5]">
          {thumb && !imgError ? (
            <img
              src={thumb}
              alt={product.name}
              loading="lazy"
              decoding="async"
              width={400}
              height={400}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${
                isSoldOut ? 'opacity-45 grayscale' : ''
              }`}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#F4F6F5] p-3 text-center text-[#6B7280]">
              <Package className="h-7 w-7 text-[#0B6E4F]/55" strokeWidth={1.5} aria-hidden="true" />
              <span className="text-[11px] font-medium line-clamp-2">{product.name}</span>
            </div>
          )}

          {discountPct >= 5 && !isSoldOut && (
            <span className="absolute left-1.5 top-1.5 rounded bg-[#C0392B] px-1.5 py-0.5 text-[10.5px] font-semibold leading-none text-white tabular-nums">
              -{discountPct}%
            </span>
          )}

          {isSoldOut && (
            <div className="absolute inset-x-0 bottom-0 bg-[#1B1F23]/80 px-2 py-0.5 text-center text-[10.5px] font-semibold text-white">
              {RW.sold_out}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-2.5">
          <h3 className="text-[12.5px] font-medium leading-[1.35] text-[#1B1F23] line-clamp-2 min-h-[34px]">
            {product.name}
          </h3>

          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-[14.5px] font-bold leading-tight text-[#0B6E4F] tabular-nums">
              {formatRwfCurrency(product.price)}
            </span>
            {discountPct >= 5 && product.old_price && (
              <span className="text-[11px] text-[#6B7280] line-through tabular-nums">
                {formatRwfCurrency(product.old_price)}
              </span>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-1.5 pt-1.5 text-[11px] text-[#6B7280]">
            <span className="inline-flex min-w-0 items-center gap-1 truncate">
              <span className="truncate">{shopName}</span>
              {isVerified && <IsokoVerifiedSeal className="h-3 w-3 shrink-0" />}
              <span aria-hidden="true">·</span>
              <span className="shrink-0">{districtName}</span>
            </span>
            {lowStock !== null && (
              <span className="font-semibold text-[#8E2A20] shrink-0 tabular-nums">
                {RW.only_left.replace('{n}', String(lowStock))}
              </span>
            )}
          </div>
        </div>
      </a>
    </article>
  );
};
