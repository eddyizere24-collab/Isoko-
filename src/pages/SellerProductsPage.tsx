import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileEdit,
  ImagePlus,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import {
  copySellerProduct,
  deleteSellerProduct,
  fetchSellerOverview,
  setSellerProductVisibility,
  updateSellerProduct,
  uploadImagePair,
  trackMarketplaceEvent,
} from '../lib/api';
import { validateProductForm } from '../lib/validation';
import { processProductImage } from '../lib/image';
import { buildWhatsAppLink, formatRwfCurrency } from '../lib/whatsapp';
import type { Product, ProductCondition, ProductStatus, ProductVariant } from '../types/marketplace';

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

  // Full Edit Product Modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editOldPrice, setEditOldPrice] = useState('');
  const [editCondition, setEditCondition] = useState<ProductCondition>('new');
  const [editBrand, setEditBrand] = useState('');
  const [editAuthentic, setEditAuthentic] = useState(false);
  const [editDesc, setEditDesc] = useState('');
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
  const [editPhotos, setEditPhotos] = useState<Product['images']>([]);
  const [editUploadingPhotos, setEditUploadingPhotos] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);

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

  const openFullEdit = (p: Product) => {
    setEditProduct(p);
    setEditName(p.name);
    setEditPrice(String(p.price));
    setEditOldPrice(p.old_price ? String(p.old_price) : '');
    setEditCondition(p.condition);
    setEditBrand(p.brand ?? '');
    setEditAuthentic(p.authentic);
    setEditDesc(p.description);
    setEditVariants(p.variants.map((v) => ({ ...v })));
    setEditPhotos(p.images.map((image) => ({ ...image })));
    setEditError(null);
  };

  const handleEditPhotoFiles = async (files: FileList | null) => {
    if (!files?.length || !editProduct) return;
    setEditError(null);
    setEditUploadingPhotos(true);
    try {
      const nextPhotos = [...editPhotos];
      for (const file of Array.from(files)) {
        if (nextPhotos.length >= 5) break;
        const compressed = await processProductImage(file);
        const full = await uploadImagePair(compressed.fullDataUrl, 'full');
        const thumb = await uploadImagePair(compressed.thumbDataUrl, 'thumb');
        nextPhotos.push({
          id: 'new-' + Date.now() + '-' + nextPhotos.length,
          product_id: editProduct.id,
          position: nextPhotos.length,
          path_full: full.url,
          path_thumb: thumb.url,
          width: compressed.width,
          height: compressed.height,
          bytes: full.bytes,
        });
      }
      setEditPhotos(nextPhotos);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Amafoto ntiyashoboye kubikwa.');
    } finally {
      setEditUploadingPhotos(false);
    }
  };

  const moveEditPhoto = (index: number, direction: -1 | 1) => {
    setEditPhotos((previous) => {
      const next = [...previous];
      const target = index + direction;
      if (target < 0 || target >= next.length) return previous;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((photo, position) => ({ ...photo, position }));
    });
  };

  const removeEditPhoto = (index: number) => {
    setEditPhotos((previous) =>
      previous.filter((_, photoIndex) => photoIndex !== index)
        .map((photo, position) => ({ ...photo, position }))
    );
  };

  const handleSaveFullEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    const priceNum = Number(editPrice.replace(/\D/g, ''));
    const oldPriceNum = editOldPrice.trim() ? Number(editOldPrice.replace(/\D/g, '')) : null;

    const validationErrors = validateProductForm({
      photosCount: editPhotos.length,
      categoryId: editProduct.category_id,
      name: editName,
      price: priceNum,
      oldPrice: oldPriceNum,
      condition: editCondition,
      brand: editBrand,
      authentic: editAuthentic,
      variants: editVariants.map((v) => ({
        size_label: v.size_label,
        in_stock: v.in_stock,
        qty: v.qty,
      })),
      colors: editProduct.colors,
      description: editDesc,
    });

    if (Object.keys(validationErrors).length > 0) {
      setEditError(Object.values(validationErrors)[0]);
      return;
    }

    setBusyId(editProduct.id);
    setEditError(null);
    await runAction(
      () =>
        updateSellerProduct(editProduct.id, {
          name: editName.trim(),
          price: priceNum,
          old_price: oldPriceNum,
          condition: editCondition,
          brand: editBrand.trim() || null,
          authentic: editAuthentic,
          description: editDesc.trim(),
          images: editPhotos.map((photo) => ({ ...photo })),
          variants: editVariants.map((v) => ({
            size_label: v.size_label,
            in_stock: v.in_stock,
            qty: v.qty,
          })),
        }).then(() => undefined),
      'Amakuru y’igicuruzwa yavuguruwe neza.'
    );
    setBusyId(null);
    setEditProduct(null);
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
            <h1 className="font-display text-xl font-bold text-[#1B1F23]">Ibicuruzwa byanjye</h1>
            <p className="text-xs text-slate-500 tabular-nums">
              Byose hamwe: {products.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/umucuruzi/ongeraho-byinshi')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#0B6E4F] px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3]"
          >
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            <span>Ongeraho byinshi</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/umucuruzi/ongeraho')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Ongeraho kimwe</span>
          </button>
        </div>
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
{p.status === 'active' && (
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
                )}
                {(p.status === 'sold_out' || p.status === 'draft') && (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => {
                      setBusyId(p.id);
                      runAction(
                        () => updateSellerProduct(p.id, { action: 'restore' }).then(() => undefined),
                        'Igicuruzwa cyasubijwe mu bubiko.'
                      ).finally(() => setBusyId(null));
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#0B6E4F] px-3 text-xs font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3] disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{RW.restore_stock}</span>
                  </button>
                )}

                {(p.status === 'active' || p.status === 'draft' || p.status === 'sold_out') && (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => {
                      setBusyId(p.id);
                      runAction(
                        () => setSellerProductVisibility(p.id, 'hide').then(() => undefined),
                        'Igicuruzwa cyahishwe. Abaguzi ntibagikibona.'
                      ).finally(() => setBusyId(null));
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-slate-300 px-3 text-xs font-semibold text-[#1B1F23] hover:bg-slate-100 disabled:opacity-50"
                  >
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Hisha</span>
                  </button>
                )}
                {p.status === 'hidden' && p.hidden_reason === 'Yahishwe n’umucuruzi' && (
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => {
                      setBusyId(p.id);
                      runAction(
                        () => setSellerProductVisibility(p.id, 'unhide').then(() => undefined),
                        'Igicuruzwa cyongeye kugaragara ku isoko.'
                      ).finally(() => setBusyId(null));
                    }}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#0B6E4F] px-3 text-xs font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3] disabled:opacity-50"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Garagaza</span>
                  </button>
                )}
                {p.status === 'hidden' && p.hidden_reason !== 'Yahishwe n’umucuruzi' && (
                  <span className="inline-flex min-h-[44px] items-center rounded-xl bg-slate-100 px-3 text-xs text-slate-500">
                    Yahishwe na Admin
                  </span>
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
                  onClick={() => openFullEdit(p)}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#0B6E4F]/40 bg-[#F1F6F3] px-3 text-xs font-semibold text-[#0B6E4F] hover:bg-[#0B6E4F] hover:text-white transition-colors"
                >
                  <FileEdit className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Hindura</span>
                </button>

                <a
                  href={buildWhatsAppLink('', `Reba ${p.name} (${formatRwfCurrency(p.price)}) kuri ISOKO: ${window.location.origin}/p/${p.id}`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { void trackMarketplaceEvent('share', p.id, p.shop_id); }}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#25D366]/40 bg-[#25D366]/10 px-3 text-xs font-semibold text-[#177A3B] hover:bg-[#25D366]/20"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sangiza</span>
                </a>

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
                  onClick={() => setDeleteCandidate(p)}
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

      {deleteCandidate && (
        <div role="dialog" aria-modal="true" aria-labelledby="delete-product-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 id="delete-product-title" className="text-lg font-bold text-[#1B1F23]">Siba igicuruzwa?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Ugiye gusiba <strong>{deleteCandidate.name}</strong>. Iki gikorwa ntigishobora gusubizwa inyuma.
              Niba ushaka ko abaguzi batakibona gusa, koresha Hisha aho kugisiba.
            </p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={()=>setDeleteCandidate(null)} className="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700">Reka</button>
              <button
                type="button"
                disabled={busyId===deleteCandidate.id}
                onClick={()=>{
                  const id=deleteCandidate.id;
                  setBusyId(id);
                  runAction(()=>deleteSellerProduct(id).then(()=>undefined),'Igicuruzwa cyasibwe.').finally(()=>{
                    setBusyId(null);
                    setDeleteCandidate(null);
                  });
                }}
                className="min-h-[44px] flex-1 rounded-xl bg-[#C0392B] px-4 text-sm font-semibold text-white disabled:opacity-50"
              >Siba burundu</button>
            </div>
          </section>
        </div>
      )}

      {/* Quick Price Edit Modal */}
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

      {/* Full Edit Product Modal */}
      {editProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="full-edit-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
        >
          <form
            onSubmit={handleSaveFullEdit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 id="full-edit-title" className="font-display text-lg font-bold text-[#1B1F23]">
                Hindura amakuru y’igicuruzwa
              </h2>
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                aria-label="Funga"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-[#F1F6F3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editError && (
              <p role="alert" className="rounded-xl bg-[#C0392B]/10 px-3.5 py-2 text-xs font-semibold text-[#C0392B]">
                {editError}
              </p>
            )}

            <div>
              <label htmlFor="edit-prod-name" className="block text-xs font-semibold text-[#1B1F23]">
                Izina ry’igicuruzwa (5–60)
              </label>
              <input
                id="edit-prod-name"
                type="text"
                required
                minLength={5}
                maxLength={60}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-prod-price" className="block text-xs font-semibold text-[#1B1F23]">
                  Igiciro (RWF)
                </label>
                <input
                  id="edit-prod-price"
                  type="number"
                  min={500}
                  max={5000000}
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#0B6E4F] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="edit-prod-old-price" className="block text-xs font-semibold text-[#1B1F23]">
                  Igiciro cya kera (si itegeko)
                </label>
                <input
                  id="edit-prod-old-price"
                  type="number"
                  min={0}
                  max={5000000}
                  value={editOldPrice}
                  onChange={(e) => setEditOldPrice(e.target.value)}
                  placeholder="Nta na kimwe"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#0B6E4F] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-prod-condition" className="block text-xs font-semibold text-[#1B1F23]">
                  Imiterere
                </label>
                <select
                  id="edit-prod-condition"
                  value={editCondition}
                  onChange={(e) => setEditCondition(e.target.value as ProductCondition)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm bg-white"
                >
                  <option value="new">{RW.condition_new}</option>
                  <option value="used">{RW.condition_used}</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-prod-brand" className="block text-xs font-semibold text-[#1B1F23]">
                  Ikirango (Brand)
                </label>
                <input
                  id="edit-prod-brand"
                  type="text"
                  maxLength={40}
                  value={editBrand}
                  onChange={(e) => setEditBrand(e.target.value)}
                  placeholder="Urugero: Nike"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm"
                />
              </div>
            </div>

            {editBrand.trim().length > 0 && (
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editAuthentic}
                  onChange={(e) => setEditAuthentic(e.target.checked)}
                  className="h-4 w-4 accent-[#0B6E4F]"
                />
                <span>Ndemeza ko iki gicuruzwa ari Original (nyacyo)</span>
              </label>
            )}

            <div>
              <label htmlFor="edit-prod-desc" className="block text-xs font-semibold text-[#1B1F23]">
                Ibisobanuro (ntibirenze inyuguti 300)
              </label>
              <textarea
                id="edit-prod-desc"
                rows={3}
                maxLength={300}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
              />
            </div>

            <section className="space-y-3 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1B1F23]">Amafoto y’igicuruzwa</h3>
                  <p className="text-xs text-slate-500">Nibura 1, ntarenze 5. Ifoto ya mbere ni yo igaragara ku ikarita.</p>
                </div>
                <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl border border-[#0B6E4F] px-3 text-xs font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3]">
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                  <span>Ongeraho</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={editUploadingPhotos || editPhotos.length >= 5}
                    className="sr-only"
                    onChange={(event) => {
                      void handleEditPhotoFiles(event.target.files);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>
              </div>
              {editUploadingPhotos && <p className="text-xs font-medium text-[#0B6E4F]">Turimo gutunganya amafoto...</p>}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {editPhotos.map((photo,index) => (
                  <div key={photo.id} className="overflow-hidden rounded-xl border border-slate-200">
                    <img src={photo.path_thumb || photo.path_full} alt={`Ifoto ${index+1}`} className="aspect-square w-full object-cover" />
                    <div className="flex flex-wrap items-center justify-between gap-1 bg-white p-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">{index === 0 ? 'Ibanza' : `Ifoto ${index+1}`}</span>
                      <div className="flex gap-1">
                        <button type="button" disabled={index===0} onClick={()=>moveEditPhoto(index,-1)} aria-label="Shyira ifoto imbere" className="min-h-[30px] min-w-[30px] rounded-md border border-slate-200 text-xs disabled:opacity-30">←</button>
                        <button type="button" disabled={index===editPhotos.length-1} onClick={()=>moveEditPhoto(index,1)} aria-label="Subiza ifoto inyuma" className="min-h-[30px] min-w-[30px] rounded-md border border-slate-200 text-xs disabled:opacity-30">→</button>
                        <button type="button" onClick={()=>removeEditPhoto(index)} aria-label="Kuraho ifoto" className="min-h-[30px] min-w-[30px] rounded-md text-[#C0392B] hover:bg-[#C0392B]/10">×</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div>
              <p className="text-xs font-semibold text-[#1B1F23]">Imibare / Sizes mu bubiko</p>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-1">
                {editVariants.map((v, idx) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  >
                    <label className="inline-flex items-center gap-2 font-semibold text-[#1B1F23] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={v.in_stock}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditVariants((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, in_stock: checked, qty: checked ? Math.max(1, item.qty ?? 1) : 0 }
                                : item
                            )
                          );
                        }}
                        className="h-4 w-4 accent-[#0B6E4F]"
                      />
                      <span>Size: {v.size_label}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Ibisigaye:</span>
                      <input
                        type="number"
                        min={0}
                        max={999}
                        value={v.qty ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const nextQty = raw === '' ? null : Number(raw);
                          setEditVariants((prev) =>
                            prev.map((item, i) =>
                              i === idx
                                ? { ...item, qty: nextQty, in_stock: nextQty === 0 ? false : item.in_stock }
                                : item
                            )
                          );
                        }}
                        aria-label={`Umubare wa size ${v.size_label}`}
                        className="h-9 w-16 rounded-lg border border-slate-300 px-2 text-center tabular-nums"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditProduct(null)}
                className="min-h-[44px] flex-1 rounded-xl border border-slate-300 text-sm font-semibold text-[#1B1F23]"
              >
                {RW.cancel}
              </button>
              <button
                type="submit"
                disabled={busyId === editProduct.id}
                className="min-h-[44px] flex-1 rounded-xl bg-[#0B6E4F] text-sm font-semibold text-white hover:bg-[#08553D] disabled:opacity-50"
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
