import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ImagePlus, Loader2, Plus, Trash2 } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { INITIAL_CATEGORIES, SIZE_SETS } from '../data/categories';
import { RW } from '../i18n/rw';
import { createSellerProduct, uploadImagePair } from '../lib/api';
import { processProductImage } from '../lib/image';
import { validateProductForm } from '../lib/validation';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { Category, ProductCondition, ProductVariant } from '../types/marketplace';

interface BulkPhoto {
  path_full: string;
  path_thumb: string;
  width: number;
  height: number;
  bytes: number;
}

interface BulkProductDraft {
  key: string;
  name: string;
  price: string;
  oldPrice: string;
  description: string;
  photos: BulkPhoto[];
  savedId?: string;
  error?: string;
}

const MAX_PRODUCTS_PER_BATCH = 50;
const MAX_PHOTOS_PER_PRODUCT = 5;

function makeKey(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

export const SellerBulkAddProductsPage: React.FC = () => {
  const { navigate, authSession, bootstrap, refreshBootstrap: refreshMarketplace } = useMarketplace();
  const categories: Category[] = bootstrap?.categories ?? INITIAL_CATEGORIES;
  const sellableCategories = useMemo(
    () => categories.filter((category) => category.active && category.parent_id !== null),
    [categories]
  );

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [condition, setCondition] = useState<ProductCondition>('new');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [rows, setRows] = useState<BulkProductDraft[]>([]);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [complete, setComplete] = useState(false);

  const selectedCategory = useMemo(
    () => sellableCategories.find((category) => category.id === categoryId) ?? null,
    [sellableCategories, categoryId]
  );
  const availableSizes = useMemo(
    () => SIZE_SETS[selectedCategory?.size_set ?? 'accessories'] ?? SIZE_SETS.accessories,
    [selectedCategory]
  );

  useEffect(() => {
    if (!authSession) navigate('/injira');
  }, [authSession, navigate]);

  useEffect(() => {
    if (availableSizes.includes('Ubunini bumwe')) setSelectedSizes(['Ubunini bumwe']);
    else setSelectedSizes([]);
  }, [categoryId]);

  const addBlankRow = () => {
    if (rows.length >= MAX_PRODUCTS_PER_BATCH) {
      setFeedback('Batch imwe ntirenze ibicuruzwa 50. Bika ibi, utangire indi batch.');
      return;
    }
    setRows((previous) => [...previous, {
      key: makeKey(),
      name: '',
      price: '',
      oldPrice: '',
      description: '',
      photos: [],
    }]);
    setFeedback(null);
  };

  const updateRow = (key: string, patch: Partial<BulkProductDraft>) => {
    setRows((previous) => previous.map((row) =>
      row.key === key && !row.savedId ? { ...row, ...patch, error: undefined } : row
    ));
  };

  const addPhotos = async (key: string, files: FileList | null) => {
    if (!files?.length) return;
    setFeedback(null);
    setUploadingKey(key);
    try {
      const current = rows.find((row) => row.key === key);
      if (!current) return;
      const nextPhotos = [...current.photos];
      for (const file of Array.from(files)) {
        if (nextPhotos.length >= MAX_PHOTOS_PER_PRODUCT) break;
        const compressed = await processProductImage(file);
        const full = await uploadImagePair(compressed.fullDataUrl, 'full');
        const thumb = await uploadImagePair(compressed.thumbDataUrl, 'thumb');
        nextPhotos.push({
          path_full: full.url,
          path_thumb: thumb.url,
          width: compressed.width,
          height: compressed.height,
          bytes: full.bytes,
        });
        setRows((previous) => previous.map((row) =>
          row.key === key ? { ...row, photos: [...nextPhotos] } : row
        ));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Amafoto ntiyashoboye kujya kuri ISOKO.';
      setRows((previous) => previous.map((row) => row.key === key ? { ...row, error: message } : row));
    } finally {
      setUploadingKey(null);
    }
  };

  const addManyProductsFromPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const slots = MAX_PRODUCTS_PER_BATCH - rows.length;
    if (slots <= 0) {
      setFeedback('Batch yuzuye ibicuruzwa 50. Bika ibi, utangire indi batch.');
      return;
    }
    const chosen = Array.from(files).slice(0, slots);
    if (files.length > slots) {
      setFeedback('Hitamo amafoto 50 cyangwa munsi yayo kuri batch imwe. Amafoto arenzeho yasimbutswe.');
    } else {
      setFeedback(null);
    }
    for (const file of chosen) {
      const key = makeKey();
      setRows((previous) => [...previous, {
        key,
        name: '',
        price: '',
        oldPrice: '',
        description: '',
        photos: [],
      }]);
      setUploadingKey(key);
      try {
        const compressed = await processProductImage(file);
        const full = await uploadImagePair(compressed.fullDataUrl, 'full');
        const thumb = await uploadImagePair(compressed.thumbDataUrl, 'thumb');
        setRows((previous) => previous.map((row) => row.key === key ? {
          ...row,
          photos: [{
            path_full: full.url,
            path_thumb: thumb.url,
            width: compressed.width,
            height: compressed.height,
            bytes: full.bytes,
          }],
        } : row));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Ifoto ntiyashoboye kujya kuri ISOKO.';
        setRows((previous) => previous.map((row) => row.key === key ? { ...row, error: message } : row));
      }
    }
    setUploadingKey(null);
  };

  const removePhoto = (key: string, index: number) => {
    setRows((previous) => previous.map((row) =>
      row.key === key && !row.savedId
        ? { ...row, photos: row.photos.filter((_, photoIndex) => photoIndex !== index) }
        : row
    ));
  };

  const removeRow = (key: string) => {
    setRows((previous) => previous.filter((row) => row.key !== key || row.savedId));
  };

  const saveBatch = async () => {
    if (!categoryId) {
      setFeedback('Banza uhitemo icyiciro cy’ibicuruzwa.');
      return;
    }
    if (selectedSizes.length === 0) {
      setFeedback('Hitamo nibura size imwe izaboneka kuri ibi bicuruzwa.');
      return;
    }
    const pending = rows.filter((row) => !row.savedId);
    if (pending.length === 0) {
      setFeedback('Nta bicuruzwa bishya bisigaye kubikwa.');
      return;
    }
    if (pending.some((row) => row.photos.length === 0)) {
      setFeedback('Buri gicuruzwa kigomba kugira nibura ifoto imwe.');
      return;
    }

    setSaving(true);
    setFeedback(null);
    let savedCount = 0;
    let failedCount = 0;
    const variants: ProductVariant[] = selectedSizes.map((size) => ({
      id: '',
      product_id: '',
      size_label: size,
      color: null,
      in_stock: true,
      qty: null,
    }));

    for (const row of pending) {
      const price = Number(row.price.replace(/\D/g, ''));
      const oldPrice = row.oldPrice.trim() ? Number(row.oldPrice.replace(/\D/g, '')) : null;
      const validation = validateProductForm({
        photosCount: row.photos.length,
        categoryId,
        name: row.name,
        price,
        oldPrice,
        condition,
        brand: '',
        authentic: false,
        variants,
        colors: [],
        description: row.description,
      });
      if (Object.keys(validation).length > 0) {
        failedCount += 1;
        setRows((previous) => previous.map((item) =>
          item.key === row.key ? { ...item, error: Object.values(validation)[0] } : item
        ));
        continue;
      }

      try {
        const result = await createSellerProduct({
          category_id: categoryId,
          name: row.name.trim(),
          description: row.description.trim(),
          price,
          old_price: oldPrice,
          condition,
          brand: null,
          authentic: false,
          colors: [],
          isDraft: false,
          images: row.photos,
          variants: selectedSizes.map((size) => ({ size_label: size, in_stock: true, qty: null })),
        });
        savedCount += 1;
        setRows((previous) => previous.map((item) =>
          item.key === row.key ? { ...item, savedId: result.product.id, error: undefined } : item
        ));
      } catch (err) {
        failedCount += 1;
        const message = err instanceof Error ? err.message : 'Igicuruzwa nticyabitswe.';
        setRows((previous) => previous.map((item) =>
          item.key === row.key ? { ...item, error: message } : item
        ));
      }
    }

    setSaving(false);
    refreshMarketplace();
    if (savedCount > 0 && failedCount === 0) {
      setFeedback('Byagenze neza: ibicuruzwa ' + savedCount + ' byabitswe.');
      setComplete(true);
    } else if (savedCount > 0) {
      setFeedback('Byabitswe: ' + savedCount + ' · Byanze: ' + failedCount + '. Kosora ibifite ikosa, wongere ubike ibisigaye.');
    } else {
      setFeedback('Nta gicuruzwa kibitswe. Reba amakosa kuri buri gicuruzwa.');
    }
  };

  const resetBatch = () => {
    setRows([]);
    setCategoryId(null);
    setSelectedSizes([]);
    setCondition('new');
    setFeedback(null);
    setComplete(false);
  };

  if (!authSession) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/umucuruzi/ibicuruzwa')} aria-label="Subira ku bicuruzwa" className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">ISOKO · Batch</p>
            <h1 className="text-xl font-bold text-[#1B1F23]">Ongeraho ibicuruzwa byinshi</h1>
            <p className="text-xs text-slate-500">Batch imwe: ibicuruzwa 1–50, buri kimwe gifite ifoto 1–5</p>
          </div>
        </div>
        <button type="button" onClick={addBlankRow} disabled={rows.length >= MAX_PRODUCTS_PER_BATCH || saving} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#0B6E4F] px-4 text-sm font-semibold text-[#0B6E4F] disabled:opacity-40">
          <Plus className="h-4 w-4" aria-hidden="true" /> Ongeraho umurongo
        </button>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <h2 className="text-sm font-bold text-[#1B1F23]">1. Ibyo ibicuruzwa bifitanye isano</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="bulk-category" className="block text-xs font-semibold text-slate-700">Icyiciro *</label>
            <select id="bulk-category" value={categoryId ?? ''} disabled={saving || rows.some((row) => row.savedId)} onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : null)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100">
              <option value="">Hitamo icyiciro</option>
              {sellableCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name_rw}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="bulk-condition" className="block text-xs font-semibold text-slate-700">Imiterere</label>
            <select id="bulk-condition" value={condition} disabled={saving || rows.some((row) => row.savedId)} onChange={(event) => setCondition(event.target.value as ProductCondition)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm">
              <option value="new">{RW.condition_new}</option>
              <option value="used">{RW.condition_used}</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-slate-700">Sizes ziboneka kuri ibi bicuruzwa byose *</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableSizes.map((size) => {
              const chosen = selectedSizes.includes(size);
              return (
                <button key={size} type="button" disabled={saving || rows.some((row) => row.savedId)} onClick={() => setSelectedSizes((previous) => chosen ? previous.filter((value) => value !== size) : [...previous, size])} className={`min-h-10 rounded-lg px-3 text-xs font-semibold ${chosen ? 'bg-[#0B6E4F] text-white' : 'border border-slate-200 bg-white text-slate-700'} disabled:opacity-40`}>
                  {size}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">Iyi batch iba ifite icyiciro, imiterere na sizes bihuriweho. Ku kindi cyiciro cyangwa sizes zitandukanye, fungura indi batch.</p>
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-dashed border-[#0B6E4F]/50 bg-[#F7FAF8] p-4 sm:p-6">
        <h2 className="text-sm font-bold text-[#1B1F23]">2. Hitamo amafoto y’ibicuruzwa</h2>
        <p className="mt-1 text-xs leading-5 text-slate-600">Hitamo amafoto menshi icyarimwe. Buri foto izatangiza igicuruzwa gishya gifite ifoto yacyo. Ushobora kongeraho andi mafoto kuri buri gicuruzwa hasi.</p>
        <label className="mt-3 inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white">
          <ImagePlus className="h-4 w-4" aria-hidden="true" />
          Hitamo amafoto menshi
          <input type="file" accept="image/*" multiple disabled={saving || rows.length >= MAX_PRODUCTS_PER_BATCH} className="sr-only" onChange={(event) => { void addManyProductsFromPhotos(event.target.files); event.currentTarget.value=''; }} />
        </label>
        <p className="mt-2 text-xs text-slate-500">Amafoto ntarenza 50 mu gutangiza batch imwe. Uyashyira kuri server amaze kugabanywa uburemere.</p>
      </section>

      <section className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#1B1F23]">3. Uzuza amakuru ya buri gicuruzwa</h2>
          <span className="text-xs tabular-nums text-slate-500">{rows.length}/{MAX_PRODUCTS_PER_BATCH}</span>
        </div>
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <ImagePlus className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-slate-700">Nta bicuruzwa urashyiramo.</p>
            <p className="mt-1 text-xs text-slate-500">Hitamo amafoto menshi cyangwa ukande “Ongeraho umurongo”.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {rows.map((row,index) => (
              <article key={row.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-[#1B1F23]">Igicuruzwa {index+1}</p>
                  {row.savedId ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B6E4F]"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Byabitswe</span>
                  ) : (
                    <button type="button" disabled={saving || uploadingKey===row.key} onClick={()=>removeRow(row.key)} aria-label="Kuraho igicuruzwa muri batch" className="flex min-h-9 min-w-9 items-center justify-center rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10"><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {row.photos.map((photo,photoIndex)=>(
                    <div key={photo.path_full} className="relative overflow-hidden rounded-lg border border-slate-200">
                      <img src={photo.path_thumb || photo.path_full} alt={`Igicuruzwa ${index+1}, ifoto ${photoIndex+1}`} className="aspect-square w-full object-cover" />
                      {!row.savedId && <button type="button" disabled={saving} onClick={()=>removePhoto(row.key,photoIndex)} aria-label="Kuraho ifoto" className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#C0392B]">×</button>}
                    </div>
                  ))}
                  {!row.savedId && row.photos.length<MAX_PHOTOS_PER_PRODUCT && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-center text-xs font-semibold text-slate-600 hover:border-[#0B6E4F]">
                      <ImagePlus className="h-5 w-5" aria-hidden="true" />
                      Andi mafoto
                      <input type="file" accept="image/*" multiple disabled={saving || uploadingKey===row.key} className="sr-only" onChange={(event)=>{void addPhotos(row.key,event.target.files); event.currentTarget.value='';}} />
                    </label>
                  )}
                </div>
                {uploadingKey===row.key && <p className="mt-2 text-xs font-medium text-[#0B6E4F]"><Loader2 className="mr-1 inline h-3.5 w-3.5 animate-spin" /> Turimo kohereza amafoto...</p>}
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Izina ry’igicuruzwa *</label>
                    <input value={row.name} disabled={saving || Boolean(row.savedId)} onChange={(event)=>updateRow(row.key,{name:event.target.value})} maxLength={60} placeholder="Urugero: Inkweto z’abagabo" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm disabled:bg-slate-50" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Igiciro (RWF) *</label>
                      <input type="number" inputMode="numeric" min={500} max={5000000} value={row.price} disabled={saving || Boolean(row.savedId)} onChange={(event)=>updateRow(row.key,{price:event.target.value})} placeholder="35000" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm tabular-nums disabled:bg-slate-50" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700">Igiciro cya kera</label>
                      <input type="number" inputMode="numeric" value={row.oldPrice} disabled={saving || Boolean(row.savedId)} onChange={(event)=>updateRow(row.key,{oldPrice:event.target.value})} placeholder="Si itegeko" className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm tabular-nums disabled:bg-slate-50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Ibisobanuro (si itegeko)</label>
                    <textarea rows={2} maxLength={2000} value={row.description} disabled={saving || Boolean(row.savedId)} onChange={(event)=>updateRow(row.key,{description:event.target.value})} placeholder="Andika ibisobanuro bigufi..." className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm disabled:bg-slate-50" />
                  </div>
                </div>
                {row.error && <p role="alert" className="mt-3 rounded-lg bg-[#C0392B]/10 p-2.5 text-xs font-medium text-[#C0392B]">{row.error}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      {feedback && <p role="status" className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{feedback}</p>}

      <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-200 pt-5">
        <button type="button" onClick={() => navigate('/umucuruzi/ibicuruzwa')} disabled={saving} className="min-h-12 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700">Bika nyuma</button>
        <button type="button" onClick={saveBatch} disabled={saving || rows.length===0 || Boolean(uploadingKey)} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white disabled:opacity-50">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Turimo kubika...</> : <><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Bika ibicuruzwa byose</>}
        </button>
      </div>
      {complete && (
        <div className="mt-4 rounded-2xl border border-[#0B6E4F]/30 bg-[#F1F6F3] p-4">
          <p className="text-sm font-bold text-[#0B6E4F]">Batch yabitswe neza.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/umucuruzi/ibicuruzwa')} className="min-h-10 rounded-xl bg-[#0B6E4F] px-4 text-xs font-semibold text-white">Reba ibicuruzwa</button>
            <button type="button" onClick={resetBatch} className="min-h-10 rounded-xl border border-[#0B6E4F] bg-white px-4 text-xs font-semibold text-[#0B6E4F]">Tangira indi batch</button>
          </div>
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-slate-500">Buri gicuruzwa kibikwa ukwacyo. Iyo kimwe cyanze, ibindi byabitswe biguma kuri ISOKO; ushobora gukosora gusa ibyatarabitswe, ukongera ukabika.</p>
    </main>
  );
};
