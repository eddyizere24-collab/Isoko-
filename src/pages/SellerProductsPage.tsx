import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Edit3,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import {
  copySellerProduct,
  deleteSellerProduct,
  fetchSellerOverview,
  updateSellerProduct,
} from '../lib/api';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { Product, ProductStatus } from '../types/marketplace';

export const SellerProductsPage: React.FC = () => {
  const { navigate, authSession, refreshBootstrap } = useMarketplace();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProductStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Price edit modal state
  const [priceModalProduct, setPriceModalProduct] = useState<Product | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [useOldPrice, setUseOldPrice] = useState(true);

  const load = async () => {
    try {
      const res = await fetchSellerOverview();
      setProducts(res.products);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authSession) {
      navigate('/injira');
      return;
    }
    load();
  }, [authSession, navigate]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [products, statusFilter, search]);

  const runAction = async (fn: () => Promise<void>, msg: string) => {
    setFeedback(null);
    try {
      await fn();
      await load();
      refreshBootstrap();
      setFeedback(msg);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Habaye ikibazo.');
    }
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalProduct) return;
    const val = Number(newPrice.replace(/\D/g, ''));
    setBusyId(priceModalProduct.id);
    await runAction(
      () =>
        updateSellerProduct(priceModalProduct.id, {
          action: 'update_price',
          price: val,
          useOldPrice,
        }).then(() => undefined),
      'Igiciro cyavuguruwe neza.'
    );
    setBusyId(null);
    setPriceModalProduct(null);
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/umucuruzi')}
            aria-label="Subira inyuma"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 hover:bg-[#F1F6F3]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1B1F23]">Ibicuruzwa byanjye</h1>
            <p className="text-xs text-slate-500 tabular-nums">
              Byose hamwe: {products.length}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/umucuruzi/ongeraho')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>{RW.add_product}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Shakisha mu bicuruzwa byawe..."
            className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'all', label: 'Byose' },
              { id: 'active', label: 'Biriho' },
              { id: 'sold_out', label: RW.sold_out },
              { id: 'draft', label: 'Ibitabo' },
              { id: 'hidden', label: 'Byahishwe' },
            ] as Array<{ id: 'all' | ProductStatus; label: string }>
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`min-h-[44px] rounded-xl px-3.5 text-xs font-semibold transition ${
                statusFilter === tab.id
                  ? 'bg-[#0B6E4F] text-white'
                  : 'border border-slate-200 bg-white text-[#1B1F23] hover:bg-[#F1F6F3]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-[#0B6E4F]/30 bg-[#F1F6F3] px-4 py-2.5 text-sm font-medium text-[#0B6E4F]"
        >
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-2xl bg-[#F1F6F3]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-600">Nta bicuruzwa bibonetse muri iki gice.</p>
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.map((p) => (
            <article
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <img
                  src={p.images[0]?.path_thumb || p.images[0]?.path_full}
                  alt={p.name}
                  className="h-18 w-18 rounded-xl object-cover shrink-0 bg-[#F1F6F3]"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1B1F23]">{p.name}</p>
                  <p className="mt-0.5 text-sm font-bold text-[#0B6E4F] tabular-nums">
                    {formatRwfCurrency(p.price)}{' '}
                    {p.old_price && p.old_price > p.price && (
                      <span className="ml-1 text-xs font-normal text-slate-400 line-through">
                        {formatRwfCurrency(p.old_price)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 tabular-nums">
                    {p.status === 'active'
                      ? 'Ahagaragara'
                      : p.status === 'sold_out'
                        ? 'Cyashize'
                        : p.status === 'draft'
                          ? 'Igitabo'
                          : `Yahishwe${p.hidden_reason ? `: ${p.hidden_reason}` : ''}`}{' '}
                    · {p.views_7d ?? 0} barebye · {p.wa_clicks_7d ?? 0} WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {p.status === 'active' ? (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => {
                      setBusyId(p.id);
                      runAction(
                        () => updateSellerProduct(p.id, { action: 'mark_sold' }).then(() => undefined),
                        'Igicuruzwa cyashyizwe nka cyashize.'
                      ).finally(() => setBusyId(null));
                    }}
                    className="min-h-[44px] rounded-xl border border-slate-300 px-3 text-xs font-semibold text-[#1B1F23] hover:bg-slate-100"
                  >
                    {RW.mark_sold}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === p.id || p.status === 'hidden'}
                    onClick={() => {
                      setBusyId(p.id);
                      runAction(
                        () => updateSellerProduct(p.id, { action: 'restore' }).then(() => undefined),
                        'Igicuruzwa cyasubijwe ahagaragara.'
                      ).finally(() => setBusyId(null));
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#0B6E4F] px-3 text-xs font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3] disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{RW.restore_stock}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setPriceModalProduct(p);
                    setNewPrice(String(p.price));
                    setUseOldPrice(true);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
                >
                  <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{RW.edit_price}</span>
                </button>

                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => {
                    setBusyId(p.id);
                    runAction(
                      () => copySellerProduct(p.id).then(() => undefined),
                      'Kopi y’igicuruzwa yongeweho.'
                    ).finally(() => setBusyId(null));
                  }}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{RW.copy_product}</span>
                </button>

                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => {
                    setBusyId(p.id);
                    runAction(
                      () => deleteSellerProduct(p.id).then(() => undefined),
                      'Igicuruzwa cyasibwe.'
                    ).finally(() => setBusyId(null));
                  }}
                  aria-label={`Siba ${p.name}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-[#C0392B] hover:bg-[#C0392B]/10"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Quick Price Edit Modal (Section 6.6) */}
      {priceModalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-price-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <form
            onSubmit={handleSavePrice}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 id="edit-price-title" className="text-base font-bold text-[#1B1F23]">
                {RW.edit_price}
              </h2>
              <button
                type="button"
                onClick={() => setPriceModalProduct(null)}
                aria-label="Funga"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-[#F1F6F3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm font-medium text-slate-700">{priceModalProduct.name}</p>
            <p className="text-xs text-slate-500 tabular-nums">
              Igiciro gisanzwe: {formatRwfCurrency(priceModalProduct.price)}
            </p>

            <div>
              <label htmlFor="modal-new-price" className="block text-xs font-semibold text-[#1B1F23]">
                Igiciro gishya (RWF)
              </label>
              <input
                id="modal-new-price"
                type="number"
                inputMode="numeric"
                min={500}
                max={5000000}
                required
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm font-semibold tabular-nums focus:border-[#0B6E4F] focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={useOldPrice}
                onChange={(e) => setUseOldPrice(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#0B6E4F]"
              />
              <span>
                Niba igiciro gishya ari gito, garagaza igiciro cya kera giciyeho akarongo
              </span>
            </label>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPriceModalProduct(null)}
                className="min-h-[44px] flex-1 rounded-xl border border-slate-300 text-sm font-semibold text-[#1B1F23]"
              >
                {RW.cancel}
              </button>
              <button
                type="submit"
                className="min-h-[44px] flex-1 rounded-xl bg-[#0B6E4F] text-sm font-semibold text-white hover:bg-[#08553D]"
              >
                {RW.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
