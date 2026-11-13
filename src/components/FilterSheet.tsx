import React from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { COLORS_LIST, SIZE_SETS } from '../data/categories';
import { RWANDA_DISTRICTS } from '../data/rwandaAreas';
import { RW } from '../i18n/rw';
import type { Category, MySizePreference } from '../types/marketplace';

export interface ActiveFilters {
  categorySlug: string;
  minPrice: string;
  maxPrice: string;
  size: string;
  color: string;
  condition: '' | 'new' | 'used';
  districtId: string;
  inStockOnly: boolean;
  discountedOnly: boolean;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'nearby';
}

interface FilterPanelProps {
  filters: ActiveFilters;
  onChange: (next: ActiveFilters) => void;
  onClear: () => void;
  categories: Category[];
  mySize: MySizePreference;
  onSaveMySize: (pref: MySizePreference) => void;
  isMobileSheet?: boolean;
  open?: boolean;
  onClose?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onChange,
  onClear,
  categories,
  mySize,
  onSaveMySize,
  isMobileSheet = false,
  open = true,
  onClose,
}) => {
  if (isMobileSheet && !open) return null;

  const topCategories = categories.filter((c) => c.parent_id === null);
  const allSizes = Array.from(
    new Set([
      ...SIZE_SETS.shoes_adult,
      ...SIZE_SETS.clothes_letters,
      ...SIZE_SETS.socks.slice(0, 3),
    ])
  );

  const content = (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
          <h2 className="text-base font-bold text-[#1B1F23]">{RW.filter}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[#0B6E4F] hover:underline min-h-[36px] px-2"
          >
            {RW.clear_filters}
          </button>
          {isMobileSheet && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Funga ibyungurura"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-[#F1F6F3]"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Size yanjye (B-08) */}
      <div className="rounded-xl bg-[#F1F6F3] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#1B1F23]">{RW.my_size}</span>
          <label className="flex items-center gap-2 text-xs font-medium text-[#0B6E4F] cursor-pointer">
            <input
              type="checkbox"
              checked={mySize.enabled}
              onChange={(e) => onSaveMySize({ ...mySize, enabled: e.target.checked })}
              className="h-4 w-4 accent-[#0B6E4F]"
            />
            <span>Koresha ubwayo</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="mysize-shoe" className="block text-[11px] text-slate-600">
              Inkweto
            </label>
            <select
              id="mysize-shoe"
              value={mySize.shoeSize}
              onChange={(e) => onSaveMySize({ ...mySize, shoeSize: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="">Ntayo</option>
              {SIZE_SETS.shoes_adult.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mysize-cloth" className="block text-[11px] text-slate-600">
              Imyenda
            </label>
            <select
              id="mysize-cloth"
              value={mySize.clothingSize}
              onChange={(e) => onSaveMySize({ ...mySize, clothingSize: e.target.value })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="">Ntayo</option>
              {SIZE_SETS.clothes_letters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Category */}
      <div>
        <label htmlFor="filter-cat" className="block text-xs font-bold text-[#1B1F23]">
          Icyiciro
        </label>
        <select
          id="filter-cat"
          value={filters.categorySlug}
          onChange={(e) => onChange({ ...filters, categorySlug: e.target.value })}
          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Ibyiciro byose</option>
          {topCategories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name_rw}
            </option>
          ))}
        </select>
      </div>

      {/* Price range */}
      <div>
        <span className="block text-xs font-bold text-[#1B1F23]">Igiciro (RWF)</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="filter-min-price" className="sr-only">
              Kuva
            </label>
            <input
              id="filter-min-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              placeholder="Kuva"
              value={filters.minPrice}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm tabular-nums"
            />
          </div>
          <div>
            <label htmlFor="filter-max-price" className="sr-only">
              Kugeza
            </label>
            <input
              id="filter-max-price"
              type="number"
              inputMode="numeric"
              min={0}
              step={500}
              placeholder="Kugeza"
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Condition */}
      <div>
        <span className="block text-xs font-bold text-[#1B1F23]">Imiterere</span>
        <div className="mt-1.5 grid grid-cols-3 gap-1.5 rounded-xl bg-[#F1F6F3] p-1">
          {[
            { val: '', label: RW.all },
            { val: 'new', label: RW.condition_new },
            { val: 'used', label: RW.condition_used },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => onChange({ ...filters, condition: opt.val as ActiveFilters['condition'] })}
              className={`min-h-[38px] rounded-lg text-xs font-semibold transition-colors ${
                filters.condition === opt.val
                  ? 'bg-white text-[#0B6E4F] shadow-sm'
                  : 'text-slate-600 hover:text-[#1B1F23]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div>
        <label htmlFor="filter-size" className="block text-xs font-bold text-[#1B1F23]">
          Size
        </label>
        <select
          id="filter-size"
          value={filters.size}
          onChange={(e) => onChange({ ...filters, size: e.target.value })}
          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Size zose</option>
          {allSizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Color */}
      <div>
        <label htmlFor="filter-color" className="block text-xs font-bold text-[#1B1F23]">
          Ibara
        </label>
        <select
          id="filter-color"
          value={filters.color}
          onChange={(e) => onChange({ ...filters, color: e.target.value })}
          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Amabara yose</option>
          {COLORS_LIST.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label htmlFor="filter-district" className="block text-xs font-bold text-[#1B1F23]">
          Akarere
        </label>
        <select
          id="filter-district"
          value={filters.districtId}
          onChange={(e) => onChange({ ...filters, districtId: e.target.value })}
          className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Uturere twose</option>
          {RWANDA_DISTRICTS.map((d) => (
            <option key={d.id} value={String(d.id)}>
              {d.district}
            </option>
          ))}
        </select>
      </div>

      {/* Checkboxes */}
      <div className="space-y-2.5 pt-1">
        <label className="flex min-h-[40px] items-center gap-2.5 text-sm text-[#1B1F23] cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="h-4 w-4 accent-[#0B6E4F]"
          />
          <span>{RW.in_stock_only}</span>
        </label>
        <label className="flex min-h-[40px] items-center gap-2.5 text-sm text-[#1B1F23] cursor-pointer">
          <input
            type="checkbox"
            checked={filters.discountedOnly}
            onChange={(e) => onChange({ ...filters, discountedOnly: e.target.checked })}
            className="h-4 w-4 accent-[#0B6E4F]"
          />
          <span>{RW.discounted_only}</span>
        </label>
      </div>

      {isMobileSheet && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] w-full rounded-xl bg-[#0B6E4F] text-sm font-semibold text-white hover:bg-[#08553D]"
        >
          Emeza ibyungurura
        </button>
      )}
    </div>
  );

  if (isMobileSheet) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={RW.filter}
        className="fixed inset-0 z-50 flex items-end bg-black/50 lg:hidden"
      >
        <div className="w-full max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300" />
          {content}
        </div>
      </div>
    );
  }

  return <div className="rounded-2xl border border-slate-200 bg-white p-5">{content}</div>;
};
