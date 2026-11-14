import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  ImagePlus,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { COLORS_LIST, INITIAL_CATEGORIES, POPULAR_BRANDS, SIZE_SETS } from '../data/categories';
import { RW } from '../i18n/rw';
import { createSellerProduct, uploadImagePair } from '../lib/api';
import { processProductImage } from '../lib/image';
import { loadProductDraft, saveProductDraft } from '../lib/storage';
import { validateProductForm } from '../lib/validation';
import { buildWhatsAppLink, formatRwfCurrency } from '../lib/whatsapp';
import type { Product, ProductCondition } from '../types/marketplace';

interface DraftPhoto {
  path_full: string;
  path_thumb: string;
  width: number;
  height: number;
  bytes: number;
}

interface WizardDraft {
  step: 1 | 2 | 3 | 4;
  photos: DraftPhoto[];
  topCategoryId: number | null;
  categoryId: number | null;
  name: string;
  price: string;
  oldPrice: string;
  selectedSizes: Array<{ size_label: string; in_stock: boolean; qty: number | null }>;
  colors: string[];
  condition: ProductCondition;
  brand: string;
  authentic: boolean;
  description: string;
}

const EMPTY_DRAFT: WizardDraft = {
  step: 1,
  photos: [],
  topCategoryId: null,
  categoryId: null,
  name: '',
  price: '',
  oldPrice: '',
  selectedSizes: [],
  colors: [],
  condition: 'new',
  brand: '',
  authentic: false,
  description: '',
};

export const SellerAddProductPage: React.FC = () => {
  const { navigate, authSession, authShop, bootstrap, refreshBootstrap } = useMarketplace();
  const [draft, setDraft] = useState<WizardDraft>(() => loadProductDraft<WizardDraft>() ?? EMPTY_DRAFT);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedProduct, setSavedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!authSession) {
      navigate('/injira');
    }
  }, [authSession, navigate]);

  useEffect(() => {
    if (!savedProduct) {
      saveProductDraft(draft);
    }
  }, [draft, savedProduct]);

  const categories = bootstrap?.categories ?? INITIAL_CATEGORIES;
  const topCategories = useMemo(
    () => categories.filter((c) => c.parent_id === null && c.active),
    [categories]
  );
  const subCategories = useMemo(
    () => categories.filter((c) => c.parent_id === draft.topCategoryId && c.active),
    [categories, draft.topCategoryId]
  );
  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === draft.categoryId) ?? categories.find((c) => c.id === draft.topCategoryId),
    [categories, draft.categoryId, draft.topCategoryId]
  );

  const availableSizes = useMemo(() => {
    const setKey = selectedCategory?.size_set ?? 'shoes_adult';
    return SIZE_SETS[setKey] ?? SIZE_SETS.shoes_adult;
  }, [selectedCategory]);

  const handlePhotoFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploadingPhoto(true);
    try {
      const nextPhotos = [...draft.photos];
      for (const file of Array.from(files)) {
        if (nextPhotos.length >= 5) break;
        const compressed = await processProductImage(file);
        const [fullUp, thumbUp] = await Promise.all([
          uploadImagePair(compressed.fullDataUrl, 'full'),
          uploadImagePair(compressed.thumbDataUrl, 'thumb'),
        ]);
        nextPhotos.push({
          path_full: fullUp.url,
          path_thumb: thumbUp.url,
          width: compressed.width,
          height: compressed.height,
          bytes: fullUp.bytes,
        });
      }
      setDraft((d) => ({ ...d, photos: nextPhotos }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ifoto ntiyabashije kujyaho.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const makeCover = (idx: number) => {
    if (idx === 0) return;
    setDraft((d) => {
      const copy = [...d.photos];
      const [chosen] = copy.splice(idx, 1);
      copy.unshift(chosen);
      return { ...d, photos: copy };
    });
  };

  const removePhoto = (idx: number) => {
    setDraft((d) => ({
      ...d,
      photos: d.photos.filter((_, i) => i !== idx),
    }));
  };

  const toggleSize = (size: string) => {
    setDraft((d) => {
      const exists = d.selectedSizes.some((s) => s.size_label === size);
      if (exists) {
        return { ...d, selectedSizes: d.selectedSizes.filter((s) => s.size_label !== size) };
      }
      return {
        ...d,
        selectedSizes: [...d.selectedSizes, { size_label: size, in_stock: true, qty: null }],
      };
    });
  };

  const setSizeQty = (size: string, qtyRaw: string) => {
    const qty = qtyRaw.trim() === '' ? null : Math.max(0, Math.min(999, Number(qtyRaw)));
    setDraft((d) => ({
      ...d,
      selectedSizes: d.selectedSizes.map((s) =>
        s.size_label === size ? { ...s, qty, in_stock: qty === 0 ? false : true } : s
      ),
    }));
  };

  const toggleColor = (colorName: string) => {
    setDraft((d) => {
      if (d.colors.includes(colorName)) {
        return { ...d, colors: d.colors.filter((c) => c !== colorName) };
      }
      if (d.colors.length >= 5) return d;
      return { ...d, colors: [...d.colors, colorName] };
    });
  };

  const goNext = () => {
    setError(null);
    if (draft.step === 1 && draft.photos.length === 0) {
      setError('Shyiraho nibura ifoto 1 mbere yo gukomeza.');
      return;
    }
    if (draft.step === 2) {
      if (!draft.categoryId) {
        setError('Hitamo icyiciro cy’igicuruzwa.');
        return;
      }
      const priceVal = Number(draft.price.replace(/\D/g, ''));
      const oldPriceVal = draft.oldPrice ? Number(draft.oldPrice.replace(/\D/g, '')) : null;
      const partialErrs = validateProductForm({
        photosCount: draft.photos.length,
        categoryId: draft.categoryId,
        name: draft.name,
        price: priceVal,
        oldPrice: oldPriceVal,
        condition: draft.condition,
        brand: '',
        authentic: false,
        variants: [{ size_label: 'temp', in_stock: true, qty: null }],
        colors: [],
        description: '',
      });
      if (partialErrs.name || partialErrs.price || partialErrs.oldPrice) {
        setError(partialErrs.name || partialErrs.price || partialErrs.oldPrice);
        return;
      }
    }
    if (draft.step === 3) {
      if (draft.selectedSizes.length === 0) {
        setError('Hitamo nibura size 1 iboneka.');
        return;
      }
      if (draft.brand.trim().length > 0 && !draft.authentic) {
        setError('Emeza ko igicuruzwa ari Original kugira ngo ukoreshe izina ry’ikirango.');
        return;
      }
    }
    setDraft((d) => ({ ...d, step: Math.min(4, d.step + 1) as 1 | 2 | 3 | 4 }));
  };

  const handlePublish = async (isDraft: boolean) => {
    setError(null);
    const priceVal = Number(draft.price.replace(/\D/g, ''));
    const oldPriceVal = draft.oldPrice ? Number(draft.oldPrice.replace(/\D/g, '')) : null;

    const errs = validateProductForm({
      photosCount: draft.photos.length,
      categoryId: draft.categoryId,
      name: draft.name,
      price: priceVal,
      oldPrice: oldPriceVal,
      condition: draft.condition,
      brand: draft.brand,
      authentic: draft.authentic,
      variants: draft.selectedSizes,
      colors: draft.colors,
      description: draft.description,
    });

    if (Object.keys(errs).length > 0) {
      setError(Object.values(errs)[0]);
      return;
    }

    setSubmitting(true);
    try {
      const res = await createSellerProduct({
        category_id: draft.categoryId,
        name: draft.name.trim(),
        description: draft.description.trim(),
        price: priceVal,
        old_price: oldPriceVal,
        condition: draft.condition,
        brand: draft.brand.trim() || null,
        authentic: draft.authentic,
        colors: draft.colors,
        isDraft,
        images: draft.photos,
        variants: draft.selectedSizes,
      });
      saveProductDraft(null);
      setSavedProduct(res.product);
      refreshBootstrap();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kubika igicuruzwa byanze.');
    } finally {
      setSubmitting(false);
    }
  };

  // Post-save success screen (Section 6.4)
  if (savedProduct) {
    const prodUrl = `${window.location.origin}/p/${savedProduct.id}`;
    const shareWaUrl = buildWhatsAppLink(
      '',
      `Reba iki gicuruzwa gishya muri ${authShop?.name || 'iduka ryacu'}: ${savedProduct.name} (${formatRwfCurrency(savedProduct.price)}) — ${prodUrl}`
    );

    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-2xl border border-[#0B6E4F]/30 bg-white p-6 text-center shadow-xs sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F6F3] text-[#0B6E4F]">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-[#1B1F23]">
            {savedProduct.status === 'draft'
              ? 'Igicuruzwa cyabitswe nk’igitabo!'
              : 'Igicuruzwa cyashyizwe ahagaragara!'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">{savedProduct.name}</p>
          <p className="mt-1 text-base font-bold text-[#0B6E4F] tabular-nums">
            {formatRwfCurrency(savedProduct.price)}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <a
              href={shareWaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 text-sm font-semibold text-white hover:bg-[#1FB857]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Sangiza kuri WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setSavedProduct(null);
                setDraft({
                  ...EMPTY_DRAFT,
                  step: 1,
                  topCategoryId: draft.topCategoryId,
                  categoryId: draft.categoryId,
                  condition: draft.condition,
                });
              }}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#0B6E4F] px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3]"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              <span>{RW.copy_product} / Shyiraho ikindi</span>
            </button>
          </div>

          <div className="mt-4 flex justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => navigate(`/p/${savedProduct.id}`)}
              className="min-h-[44px] font-semibold text-[#0B6E4F] hover:underline"
            >
              Reba uko abaguzi bakibona
            </button>
            <button
              type="button"
              onClick={() => navigate('/umucuruzi/ibicuruzwa')}
              className="min-h-[44px] font-semibold text-slate-600 hover:underline"
            >
              Ibicuruzwa byanjye
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      {/* Header & Stepper */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-200">
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
            <h1 className="text-lg font-bold text-[#1B1F23]">{RW.add_product}</h1>
            <p className="text-xs text-slate-500">Intambwe {draft.step} / 4 · Irabikwa mu buryo bwikora</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            saveProductDraft(null);
            setDraft(EMPTY_DRAFT);
          }}
          className="min-h-[44px] text-xs font-semibold text-slate-500 hover:text-[#C0392B]"
        >
          Tangira bushya
        </button>
      </div>

      {/* 4-Step Progress Bar */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        {[
          { s: 1, label: '1. Ifoto' },
          { s: 2, label: '2. Icyo ari cyo' },
          { s: 3, label: '3. Sizes n’amabara' },
          { s: 4, label: '4. Suzuma' },
        ].map((item) => (
          <button
            key={item.s}
            type="button"
            onClick={() => {
              if (item.s < draft.step) setDraft((d) => ({ ...d, step: item.s as 1 | 2 | 3 | 4 }));
            }}
            className={`min-h-[40px] rounded-xl px-2 text-xs font-semibold transition ${
              draft.step === item.s
                ? 'bg-[#0B6E4F] text-white'
                : item.s < draft.step
                  ? 'bg-[#F1F6F3] text-[#0B6E4F]'
                  : 'bg-slate-100 text-slate-500'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        {/* STEP 1: Photos */}
        {draft.step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#1B1F23]">
                Shyiraho amafoto (1 kugeza kuri 5)
              </h2>
              <p className="mt-1 text-xs text-slate-600">
                Koresha ifoto isobanutse kandi itagira nimero ya telefoni yanditseho. Amafoto
                akurwaho GPS akanagabanywa uburemere mu buryo bwikora.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#0B6E4F] bg-[#F1F6F3] p-4 text-center hover:bg-[#E5EFE9]">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                />
                <Camera className="h-7 w-7 text-[#0B6E4F]" aria-hidden="true" />
                <span className="mt-2 text-sm font-bold text-[#0B6E4F]">{RW.take_photo}</span>
                <span className="text-xs text-slate-600">Koresha kamera ya telefoni</span>
              </label>

              <label className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-4 text-center hover:border-[#0B6E4F]">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => handlePhotoFiles(e.target.files)}
                />
                <ImagePlus className="h-7 w-7 text-slate-600" aria-hidden="true" />
                <span className="mt-2 text-sm font-bold text-[#1B1F23]">{RW.pick_gallery}</span>
                <span className="text-xs text-slate-500">Hitamo kugeza kuri 5</span>
              </label>
            </div>

            {uploadingPhoto && (
              <p className="text-xs font-medium text-[#0B6E4F]">
                Turimo gutunganya no kugabanya uburemere bw’ifoto...
              </p>
            )}

            {draft.photos.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">
                  Amafoto washyizeho ({draft.photos.length}/5) — Kanda kuri “Ibanza” uhitemo
                  iyigaragara ku ikarita:
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  {draft.photos.map((ph, idx) => (
                    <div
                      key={`${ph.path_full}-${idx}`}
                      className="relative overflow-hidden rounded-xl border border-slate-200 bg-[#F1F6F3]"
                    >
                      <img
                        src={ph.path_thumb || ph.path_full}
                        alt={`Ifoto ${idx + 1}`}
                        className="aspect-square w-full object-cover"
                      />
                      <div className="flex items-center justify-between gap-1 bg-white p-1.5">
                        <button
                          type="button"
                          onClick={() => makeCover(idx)}
                          className={`min-h-[32px] flex-1 rounded-lg px-1.5 text-[11px] font-semibold ${
                            idx === 0
                              ? 'bg-[#0B6E4F] text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {idx === 0 ? 'Ibanza' : 'Gira ibanza'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          aria-label="Kuraho ifoto"
                          className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}


          </div>
        )}

        {/* STEP 2: Category, Name, Price */}
        {draft.step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#1B1F23]">Hitamo icyiciro cy’igicuruzwa *</h2>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {topCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        topCategoryId: cat.id,
                        categoryId: null,
                        selectedSizes: [],
                      }))
                    }
                    className={`min-h-[56px] rounded-xl border p-3 text-left text-xs font-bold transition ${
                      draft.topCategoryId === cat.id
                        ? 'border-[#0B6E4F] bg-[#0B6E4F] text-white'
                        : 'border-slate-200 bg-white text-[#1B1F23] hover:bg-[#F1F6F3]'
                    }`}
                  >
                    {cat.name_rw}
                  </button>
                ))}
              </div>
            </div>

            {subCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600">Icyiciro cyihariye *</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {subCategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          categoryId: sub.id,
                          selectedSizes: [],
                        }))
                      }
                      className={`min-h-[44px] rounded-xl px-3.5 text-xs font-semibold transition ${
                        draft.categoryId === sub.id
                          ? 'bg-[#0B6E4F] text-white'
                          : 'border border-slate-200 bg-[#F1F6F3] text-[#1B1F23] hover:border-[#0B6E4F]'
                      }`}
                    >
                      {sub.name_rw}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="wiz-name" className="text-sm font-semibold text-[#1B1F23]">
                  Izina ry’igicuruzwa *
                </label>
                <span className="text-xs text-slate-500 tabular-nums">{draft.name.length}/60</span>
              </div>
              <input
                id="wiz-name"
                maxLength={60}
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Urugero: Inkweto za Nike Air Force 1 zera"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="wiz-price" className="block text-sm font-semibold text-[#1B1F23]">
                  Igiciro (RWF) *
                </label>
                <input
                  id="wiz-price"
                  type="number"
                  inputMode="numeric"
                  min={500}
                  max={5000000}
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                  placeholder="35000"
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm font-semibold tabular-nums focus:border-[#0B6E4F] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="wiz-old-price" className="block text-sm font-semibold text-[#1B1F23]">
                  Igiciro cya kera (niba wagabanyije)
                </label>
                <input
                  id="wiz-old-price"
                  type="number"
                  inputMode="numeric"
                  value={draft.oldPrice}
                  onChange={(e) => setDraft((d) => ({ ...d, oldPrice: e.target.value }))}
                  placeholder="45000"
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#0B6E4F] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Sizes, Colors, Condition, Brand, Description */}
        {draft.step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-[#1B1F23]">Hitamo size ziboneka *</h2>
              <p className="mt-0.5 text-xs text-slate-600">
                Kanda kuri size buri yose ufite. Ushobora no kwandikamo umubare w’ibisigaye (1-3
                bituma igaragara nka “Hasigaye N”).
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {availableSizes.map((sz) => {
                  const chosen = draft.selectedSizes.find((s) => s.size_label === sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`min-h-[44px] min-w-[48px] rounded-xl px-3 text-xs font-semibold transition ${
                        chosen
                          ? 'bg-[#0B6E4F] text-white'
                          : 'border border-slate-200 bg-white text-[#1B1F23] hover:bg-[#F1F6F3]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              {draft.selectedSizes.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {draft.selectedSizes.map((sz) => (
                    <div
                      key={sz.size_label}
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-[#F1F6F3] px-3 py-2"
                    >
                      <span className="text-xs font-bold text-[#1B1F23]">Size {sz.size_label}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={999}
                        value={sz.qty ?? ''}
                        onChange={(e) => setSizeQty(sz.size_label, e.target.value)}
                        placeholder="Umubare"
                        aria-label={`Umubare kuri size ${sz.size_label}`}
                        className="min-h-[36px] w-24 rounded-lg border border-slate-300 bg-white px-2 text-xs tabular-nums"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#1B1F23]">Amabara (kugeza kuri 5)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLORS_LIST.map((col) => {
                  const active = draft.colors.includes(col.name);
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => toggleColor(col.name)}
                      className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 text-xs font-medium transition ${
                        active
                          ? 'border-[#0B6E4F] bg-[#F1F6F3] font-bold text-[#0B6E4F]'
                          : 'border-slate-200 bg-white text-[#1B1F23]'
                      }`}
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-slate-300"
                        style={{ background: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[#1B1F23]">Imiterere *</p>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { id: 'new' as const, label: RW.condition_new },
                  { id: 'used' as const, label: RW.condition_used },
                ].map((cond) => (
                  <button
                    key={cond.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, condition: cond.id }))}
                    className={`min-h-[48px] rounded-xl border text-sm font-semibold transition ${
                      draft.condition === cond.id
                        ? 'border-[#0B6E4F] bg-[#0B6E4F] text-white'
                        : 'border-slate-200 bg-white text-[#1B1F23]'
                    }`}
                  >
                    {cond.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 space-y-3">
              <div>
                <label htmlFor="wiz-brand" className="block text-sm font-semibold text-[#1B1F23]">
                  Ikirango / Brand (niba gihari)
                </label>
                <input
                  id="wiz-brand"
                  list="popular-brands-list"
                  maxLength={40}
                  value={draft.brand}
                  onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
                  placeholder="Urugero: Nike, Adidas, Zara cyangwa bireke ubusa"
                  className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
                />
                <datalist id="popular-brands-list">
                  {POPULAR_BRANDS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              {draft.brand.trim().length > 0 && (
                <label className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.authentic}
                    onChange={(e) => setDraft((d) => ({ ...d, authentic: e.target.checked }))}
                    className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#0B6E4F]"
                  />
                  <span>
                    Ndemeza ko iki gicuruzwa ari <strong>Original (nyacyo)</strong> koko.
                    Impimbano zigurishwa nk’original zihita zivanwa ku rubuga kandi konti
                    igahagarikwa.
                  </span>
                </label>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="wiz-desc" className="text-sm font-semibold text-[#1B1F23]">
                  Ibisobanuro by’inyongera
                </label>
                <span className="text-xs text-slate-500 tabular-nums">
                  {draft.description.length}/300
                </span>
              </div>
              <textarea
                id="wiz-desc"
                rows={3}
                maxLength={300}
                value={draft.description}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Vuga ubwiza bw’igicuruzwa, uko kimeze cyangwa uko gitangwa (ntushyiremo nimero ya telefoni)..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Review & Publish */}
        {draft.step === 4 && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#1B1F23]">
              Suzuma uko igicuruzwa kizagaragara
            </h2>

            <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="aspect-square bg-[#F1F6F3]">
                {draft.photos[0] && (
                  <img
                    src={draft.photos[0].path_full}
                    alt={draft.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="p-3.5">
                <p className="text-sm font-semibold text-[#1B1F23]">{draft.name}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-base font-bold text-[#0B6E4F] tabular-nums">
                    {formatRwfCurrency(Number(draft.price || 0))}
                  </span>
                  {draft.oldPrice && Number(draft.oldPrice) > Number(draft.price) && (
                    <span className="text-xs text-slate-400 line-through tabular-nums">
                      {formatRwfCurrency(Number(draft.oldPrice))}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {authShop?.name || 'Iduka ryawe'} · {draft.condition === 'new' ? RW.condition_new : RW.condition_used}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Sizes: {draft.selectedSizes.map((s) => s.size_label).join(', ')}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handlePublish(true)}
                className="min-h-[48px] rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-[#F1F6F3] disabled:opacity-60"
              >
                {RW.save_draft}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handlePublish(false)}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D] disabled:opacity-60"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{submitting ? 'Bika...' : RW.save_publish}</span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-sm font-medium text-[#C0392B]"
          >
            {error}
          </div>
        )}

        {/* Stepper Footer Navigation */}
        {draft.step < 4 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <button
              type="button"
              disabled={draft.step === 1}
              onClick={() =>
                setDraft((d) => ({ ...d, step: Math.max(1, d.step - 1) as 1 | 2 | 3 | 4 }))
              }
              className="min-h-[44px] rounded-xl border border-slate-300 px-4 text-sm font-semibold text-[#1B1F23] disabled:opacity-40"
            >
              Subira inyuma
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D]"
            >
              <span>Komeza</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </section>
    </main>
  );
};
