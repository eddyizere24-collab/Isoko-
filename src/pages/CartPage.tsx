import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Copy,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { validateCartItems } from '../lib/api';
import { trackEvent } from '../lib/track';
import { buildCartWhatsAppMessages, formatRwfCurrency } from '../lib/whatsapp';
import type { CartItem } from '../types/marketplace';

export const CartPage: React.FC = () => {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    removeSellerFromCart,
    replaceCart,
    location,
    setLocationModalOpen,
    navigate,
  } = useMarketplace();

  const [copiedShopId, setCopiedShopId] = useState<string | null>(null);
  const [sentShopId, setSentShopId] = useState<string | null>(null);

  // E-05: Live price & stock re-check on cart open
  useEffect(() => {
    if (cart.length === 0) return;
    validateCartItems(
      cart.map((c) => ({ productId: c.productId, size: c.size, priceSeen: c.priceSeen }))
    )
      .then((res) => {
        const valMap = new Map(res.validated.map((v) => [v.productId, v]));
        let changed = false;
        const next = cart.map((item) => {
          const v = valMap.get(item.productId);
          if (!v) return item;
          if (
            v.currentPrice !== item.currentPrice ||
            v.status !== item.status ||
            v.sizeInStock !== item.sizeInStock
          ) {
            changed = true;
            return {
              ...item,
              currentPrice: v.currentPrice,
              status: v.status,
              sizeInStock: v.sizeInStock,
            };
          }
          return item;
        });
        if (changed) replaceCart(next);
      })
      .catch(() => undefined);
    // Only re-validate on initial cart page entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group strictly per seller (E-02)
  const sellerGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        shopId: string;
        shopName: string;
        shopSlug: string;
        shopWhatsapp: string;
        shopPhone: string;
        items: CartItem[];
      }
    >();

    for (const item of cart) {
      const existing = groups.get(item.shopId);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.shopId, {
          shopId: item.shopId,
          shopName: item.shopName,
          shopSlug: item.shopSlug,
          shopWhatsapp: item.shopWhatsapp,
          shopPhone: item.shopPhone,
          items: [item],
        });
      }
    }
    return Array.from(groups.values());
  }, [cart]);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-slate-200 bg-[#F1F6F3] p-8">
          <h1 className="text-xl font-bold text-[#1B1F23]">{RW.empty_cart}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hitamo ibicuruzwa ukunda ubyongere mu gare, hanyuma uvugane n’umucuruzi kuri WhatsApp.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-5 min-h-[44px] rounded-xl bg-[#0B6E4F] px-6 text-sm font-semibold text-white"
          >
            Shakisha ibicuruzwa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1B1F23]">
            {RW.cart} ({cart.reduce((s, i) => s + i.qty, 0)})
          </h1>
          <p className="text-xs text-slate-600">
            Igare rigabanywa ku mucuruzi: wohereza ubutumwa kuri buri duka ukwayo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setLocationModalOpen(true)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-[#F1F6F3] px-4 text-sm font-medium text-[#1B1F23] hover:border-[#0B6E4F]"
        >
          <MapPin className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
          <span>
            {location
              ? `Aho uri: ${location.districtName}${location.sectorName ? `, ${location.sectorName}` : ''}`
              : 'Hitamo aho uri (si itegeko)'}
          </span>
        </button>
      </div>

      {/* Permanent Trust Notice (E-07) */}
      <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-[#F1F6F3] p-4 text-xs leading-relaxed text-[#1B1F23]">
        <ShieldCheck className="h-4 w-4 text-[#0B6E4F] shrink-0 mt-0.5" aria-hidden="true" />
        <span>{RW.payment_note}</span>
      </div>

      {/* Grouped by Seller (E-02: NO combined cross-seller grand total!) */}
      <div className="space-y-6">
        {sellerGroups.map((group) => {
          const batches = buildCartWhatsAppMessages({
            shopName: group.shopName,
            shopWhatsapp: group.shopWhatsapp,
            items: group.items,
            location,
            baseUrl: window.location.origin,
          });
          const groupSubtotal = group.items
            .filter((it) => it.status !== 'sold_out' && it.sizeInStock !== false)
            .reduce((sum, it) => sum + (it.currentPrice ?? it.priceSeen) * it.qty, 0);

          return (
            <section
              key={group.shopId}
              className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <a
                  href={`/i/${group.shopSlug}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/i/${group.shopSlug}`);
                  }}
                  className="text-lg font-bold text-[#0B6E4F] hover:underline"
                >
                  {group.shopName}
                </a>
                <span className="text-base font-bold text-[#1B1F23] tabular-nums">
                  Igiteranyo: {formatRwfCurrency(groupSubtotal)}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map((item) => {
                  const unitPrice = item.currentPrice ?? item.priceSeen;
                  const priceChanged = item.currentPrice !== undefined && item.currentPrice !== item.priceSeen;
                  const unavailable = item.status === 'sold_out' || item.sizeInStock === false;

                  return (
                    <div
                      key={`${item.productId}-${item.size}-${item.color}`}
                      className="flex items-start gap-3 py-3.5"
                    >
                      <img
                        src={item.thumbUrl}
                        alt={item.productName}
                        className={`h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover ${
                          unavailable ? 'opacity-45 grayscale' : ''
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <a
                          href={`/p/${item.productId}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/p/${item.productId}`);
                          }}
                          className="text-sm font-semibold text-[#1B1F23] hover:text-[#0B6E4F] line-clamp-2"
                        >
                          {item.productName}
                        </a>
                        <p className="mt-0.5 text-xs text-slate-600">
                          Size: {item.size}
                          {item.color ? ` · Ibara: ${item.color}` : ''}
                        </p>

                        {unavailable ? (
                          <p className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#C0392B]">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{RW.sold_out} (ntikibarwa mu giteranyo)</span>
                          </p>
                        ) : (
                          <p className="mt-1 text-sm font-bold text-[#0B6E4F] tabular-nums">
                            {formatRwfCurrency(unitPrice)}
                          </p>
                        )}

                        {priceChanged && !unavailable && (
                          <p className="mt-0.5 text-xs font-semibold text-[#B45309] tabular-nums">
                            {RW.price_changed}: {formatRwfCurrency(item.priceSeen)} →{' '}
                            {formatRwfCurrency(unitPrice)}
                          </p>
                        )}

                        <div className="mt-2 flex items-center gap-3">
                          {!unavailable && (
                            <div className="inline-flex items-center rounded-xl border border-slate-200">
                              <button
                                type="button"
                                aria-label={`Gabanya umubare wa ${item.productName}`}
                                onClick={() =>
                                  updateCartQty(item.productId, item.size, item.color, -1)
                                }
                                className="flex h-9 w-9 items-center justify-center text-[#1B1F23] hover:bg-[#F1F6F3]"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold tabular-nums">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                aria-label={`Ongera umubare wa ${item.productName}`}
                                onClick={() =>
                                  updateCartQty(item.productId, item.size, item.color, 1)
                                }
                                className="flex h-9 w-9 items-center justify-center text-[#1B1F23] hover:bg-[#F1F6F3]"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            aria-label={`Kuraho ${item.productName}`}
                            onClick={() =>
                              removeFromCart(item.productId, item.size, item.color)
                            }
                            className="inline-flex min-h-[36px] items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#C0392B]"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{RW.remove}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons for this seller */}
              <div className="flex flex-col gap-2.5 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap">
                {batches.map((batch, idx) => (
                  <a
                    key={idx}
                    href={batch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      setSentShopId(group.shopId);
                      group.items.forEach((it) => trackEvent('wa_click', it.productId, group.shopId));
                    }}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-bold text-white hover:bg-[#1FB858] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>
                      {batches.length > 1
                        ? `${RW.send_whatsapp_to.replace('{iduka}', group.shopName)} (${idx + 1}/${batches.length})`
                        : RW.send_whatsapp_to.replace('{iduka}', group.shopName)}
                    </span>
                  </a>
                ))}

                {group.shopPhone && (
                  <a
                    href={`tel:+${group.shopPhone}`}
                    onClick={() => trackEvent('call_click', null, group.shopId)}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50"
                  >
                    <Phone className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
                    <span>{RW.call}</span>
                  </a>
                )}

                {batches[0] && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(batches[0].message);
                        setCopiedShopId(group.shopId);
                        setTimeout(() => setCopiedShopId(null), 2000);
                      } catch {
                        // ignore
                      }
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50"
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    <span>{copiedShopId === group.shopId ? RW.copied : RW.copy_message}</span>
                  </button>
                )}
              </div>

              {sentShopId === group.shopId && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F1F6F3] px-4 py-2.5 text-xs">
                  <span className="text-[#1B1F23] font-medium">
                    Ubutumwa bwafungutse kuri WhatsApp. Urashaka gukura ibi mu gare?
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSellerFromCart(group.shopId)}
                    className="font-bold text-[#0B6E4F] hover:underline shrink-0"
                  >
                    {RW.remove_sent}
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};
