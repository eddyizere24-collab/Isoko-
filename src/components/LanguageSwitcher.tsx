import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import { useT } from '../context/LangContext';
import { SUPPORTED_LANGUAGES } from '../i18n';

interface LanguageSwitcherProps {
  variant?: 'header' | 'footer';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ variant = 'header' }) => {
  const { lang, meta, setLang, t } = useT();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const isFooter = variant === 'footer';

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`${t('language_label')}: ${meta.label}`}
        className={`inline-flex h-9 items-center gap-1 rounded-md border px-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
          isFooter
            ? 'border-white/25 bg-white/10 text-white hover:bg-white/20'
            : 'border-[#E5E7EB] bg-[#F7F8FA] text-[#1B1F23] hover:border-[#0B6E4F]'
        }`}
      >
        <Globe
          className={`h-5 w-5 shrink-0 ${isFooter ? 'text-white' : 'text-[#0B6E4F]'}`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className="tabular-nums tracking-wide">{meta.shortCode}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('language_label')}
          className={`absolute z-50 w-52 rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-lg ${
            isFooter ? 'bottom-11 left-0' : 'right-0 top-10'
          }`}
        >
          <p className="px-2.5 py-1 text-[11px] font-semibold text-[#6B7280] border-b border-[#E5E7EB] mb-1">
            {t('language_label')}
          </p>
          {SUPPORTED_LANGUAGES.map((item) => {
            const active = item.code === lang;
            return (
              <button
                key={item.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setLang(item.code);
                  setOpen(false);
                }}
                className={`flex min-h-[38px] w-full items-center justify-between gap-2 rounded-md px-2.5 text-left text-[12.5px] transition-colors ${
                  active
                    ? 'bg-[#E8F3EE] font-semibold text-[#0B6E4F]'
                    : 'text-[#1B1F23] hover:bg-[#F7F8FA]'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="inline-block w-6 text-[11px] font-bold text-[#6B7280] tabular-nums">
                    {item.shortCode}
                  </span>
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {active && <Check className="h-3.5 w-3.5 text-[#0B6E4F]" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
