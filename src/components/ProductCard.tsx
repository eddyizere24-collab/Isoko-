import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { calculateDiscountPercent } from '../lib/algorithm';
import { isShopIdentityVerified } from '../lib/shopVerification';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { Product } from '../types/marketplace';
import { IsokoVerifiedSeal } from './IsokoLogo';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

/**
 * Rulebook §5 Compliant Product Card:
 * - 1:1 square photo
 * - 6px body padding (p-1.5)
 * - Price 13px 700 #214E43
 * - Title 11.5px / 14px line-height (2 lines clamped)
 * - Shop / district 10.5px
 * - Discount badge 10px
 * - Max height <= 185px on mobile, zero drop shadow
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { navigate } = useMarketplace();
  const { t } = useT();
  const [imgError, setImgError] = useState(false);

  const thumb = product.images[0]?.path_thumb || product.images[0]?.path_full || '';
  const discountPct = calculateDiscountPercent(product.price, product.old_price);
  const isSoldOut = product.status === 'sold_out';

  const shopName = product.shop?.name ?? 'Iduka';
  const districtName = product.shop?.district_name ?? '';
  const isVerified = isShopIdentityVerified(product.shop);

  return (
    <article className="group flex w-full max-h-[185px] sm:max-h-none flex-col rounded-lg border border-[#E3E0D8] bg-[#FFFEFB] overflow-hidden transition-colors hover:border-[#214E43]/60">
      <a
        href={`/p/${product.id}`}
        onClick={(e) => {
          e.preventDefault();
          navigate(`/p/${product.id}`);
        }}
        className="flex flex-1 flex-col text-left"
      >
        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#EEECE6]">
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
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#EEECE6] p-2 text-center text-[#68716D]">
              <Package className="h-6 w-6 text-[#214E43]/55" strokeWidth={1.5} aria-hidden="true" />
              <span className="text-[10.5px] font-medium line-clamp-2">{product.name}</span>
            </div>
          )}

          {discountPct >= 5 && !isSoldOut && (
            <span className="absolute left-1 top-1 rounded bg-[#BD594A] px-1 py-0.5 text-[10px] font-semibold leading-none text-white tabular-nums">
              -{discountPct}%
            </span>
          )}

          {isSoldOut && (
            <div className="absolute inset-x-0 bottom-0 bg-[#202724]/80 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
              {t('sold_out')}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-[6px]">
          <span className="text-[13px] font-bold leading-[15px] text-[#214E43] tabular-nums truncate">
            {formatRwfCurrency(product.price)}
          </span>

          <h3 className="mt-0.5 text-[11.5px] font-medium leading-[14px] text-[#202724] line-clamp-2 h-[28px]">
            {product.name}
          </h3>

          <div className="mt-0.5 flex items-center gap-1 text-[10.5px] leading-[12px] text-[#68716D] min-w-0">
            <span className="truncate">{shopName}</span>
            {isVerified && <IsokoVerifiedSeal className="h-3 w-3 shrink-0" />}
            <span aria-hidden="true">·</span>
            <span className="shrink-0 truncate max-w-[44%]">{districtName}</span>
          </div>
        </div>
      </a>
    </article>
  );
};
