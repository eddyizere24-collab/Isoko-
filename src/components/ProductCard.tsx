import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { calculateDiscountPercent } from '../lib/algorithm';
import { isShopIdentityVerified } from '../lib/shopVerification';
import { formatRwf } from '../lib/whatsapp';
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
 * - Price 18px mobile / 20px tablet / 24px desktop, bold
 * - Title 13px mobile / 15px tablet, two readable lines
 * - Shop / district 11px
 * - No fixed maximum height; keep the three-column mobile grid
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
    <article className="group flex w-full min-w-0 flex-col rounded-lg border border-[#D7DED8] bg-white overflow-hidden transition-colors hover:border-[#0B6E4F]">
      <a
        href={`/p/${product.id}`}
        onClick={(e) => {
          e.preventDefault();
          navigate(`/p/${product.id}`);
        }}
        className="flex flex-1 flex-col text-left"
      >
        <div className="relative aspect-square w-full shrink-0 overflow-hidden bg-[#FAFAF7]">
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
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[#FAFAF7] p-2 text-center text-[#68716D]">
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
          <span className="flex items-baseline gap-1 whitespace-nowrap text-[#0B6E4F] tabular-nums">
            <span className="text-[16px] max-[374px]:text-[14px] font-extrabold leading-[22px] sm:text-[20px] sm:leading-[24px] lg:text-[24px] lg:leading-[28px]">
              {formatRwf(product.price)}
            </span>
            <span className="text-[10px] font-bold leading-[22px] sm:text-[12px]">RWF</span>
          </span>

          <h3 className="mt-1 text-[13px] font-semibold leading-[17px] text-[#1A1F1C] line-clamp-2 min-h-[34px] sm:text-[15px] sm:leading-[20px] sm:min-h-[40px]">
            {product.name}
          </h3>

          <div className="mt-1 flex items-center gap-1 text-[11px] leading-[14px] text-[#4B544F] min-w-0">
            <span className="truncate">{shopName}</span>
            {isVerified && <IsokoVerifiedSeal className="h-3 w-3 shrink-0" />}
            {districtName && (
              <>
                <span aria-hidden="true">·</span>
                <span className="shrink-0 truncate max-w-[44%]">{districtName}</span>
              </>
            )}
          </div>
        </div>
      </a>
    </article>
  );
};
