import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { subscribeUpdates } from '../lib/api';
import { buildWhatsAppLink } from '../lib/whatsapp';
import { IsokoWordmark, RwandanGeometricPattern } from './IsokoLogo';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Footer: React.FC = () => {
  const { navigate, bootstrap, location } = useMarketplace();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const supportPhone = (bootstrap?.settings.SUPPORT_WHATSAPP ?? '').trim();
  const supportUrl = supportPhone
    ? buildWhatsAppLink(supportPhone, 'Muraho ikipe ya Isoko, nkeneye ubufasha ku rubuga.')
    : null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !consent) {
      setSubMessage('Andika imeri yawe kandi wemeze ko wifuza amakuru.');
      return;
    }
    setSubLoading(true);
    try {
      await subscribeUpdates({
        kind: 'email',
        externalId: email.trim(),
        districtId: location?.districtId ?? null,
      });
      setSubMessage('Byakozwe! Uzajya ubona ibicuruzwa bishya kuri imeri.');
      setEmail('');
    } catch (err) {
      setSubMessage(err instanceof Error ? err.message : 'Habaye ikibazo.');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <footer className="mt-8 border-t border-[#E3E0D8] bg-[#F7F5F0] text-[#202724]">
      {/* 12px 100%-opacity SVG Imigongo strip above footer (§9) */}
      <RwandanGeometricPattern size="footer" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid gap-6 md:grid-cols-4 md:gap-8">
          <div>
            <IsokoWordmark
              variant="default"
              markClassName="h-6 w-6"
              wordmarkClassName="h-[17px] w-auto"
            />
            <p className="mt-2.5 max-w-xs text-[12.5px] leading-relaxed text-[#68716D]">
              {t('app_tagline')} — {t('hero_subtitle')}
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
              {supportUrl && (
                <a
                  href={supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-full bg-[#214E43] px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#183B33]"
                >
                  <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  <span>{t('help_whatsapp')}</span>
                </a>
              )}
              <LanguageSwitcher variant="header" />
            </div>
            {supportUrl && bootstrap?.settings.SUPPORT_HOURS && (
              <p className="mt-2 text-[10.5px] text-[#68716D]">
                {bootstrap.settings.SUPPORT_HOURS}
              </p>
            )}
          </div>

          <details className="group border-t border-[#E3E0D8] pt-3 md:border-0 md:pt-0" open>
            <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between text-[13px] font-semibold text-[#202724] md:cursor-default">
              <span>{t('app_name')}</span>
              <ChevronDown className="h-4 w-4 text-[#68716D] transition-transform group-open:rotate-180 md:hidden" />
            </summary>
            <ul className="mt-2 space-y-2 text-[12.5px] text-[#68716D]">
              <li>
                <a
                  href="/abacuruzi"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/abacuruzi');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {t('sell_on_platform')}
                </a>
              </li>
              <li>
                <a
                  href="/ibyerekeye"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/ibyerekeye');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {t('about')}
                </a>
              </li>
              <li>
                <a
                  href="/ubufasha"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/ubufasha');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {t('help')}
                </a>
              </li>
              <li>
                <a
                  href="/brand-preview"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/brand-preview');
                  }}
                  className="hover:text-white hover:underline"
                >
                  Brand Preview
                </a>
              </li>
            </ul>
          </details>

          <details className="group border-t border-[#E3E0D8] pt-3 md:border-0 md:pt-0">
            <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between text-[13px] font-semibold text-[#202724] md:cursor-default">
              <span>{t('terms')}</span>
              <ChevronDown className="h-4 w-4 text-[#68716D] transition-transform group-open:rotate-180 md:hidden" />
            </summary>
            <ul className="mt-2 space-y-2 text-[12.5px] text-[#68716D] md:block">
              <li>
                <a
                  href="/amategeko"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/amategeko');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {t('terms')}
                </a>
              </li>
              <li>
                <a
                  href="/ibanga"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/ibanga');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {t('privacy')}
                </a>
              </li>
              <li>
                <a
                  href="/amabwiriza-y-abacuruzi"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/amabwiriza-y-abacuruzi');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {t('seller_rules')}
                </a>
              </li>
            </ul>
          </details>

          <div className="border-t border-[#E3E0D8] pt-4 md:border-0 md:pt-0">
            <h3 className="text-[13px] font-semibold text-white">{t('newsletter_title')}</h3>
            <p className="mt-1 text-[12px] text-[#68716D]">{t('newsletter_desc')}</p>
            <form onSubmit={handleSubscribe} className="mt-2.5 space-y-2">
              <div className="flex gap-2">
                <label htmlFor="footer-email" className="sr-only">
                  {t('email')}
                </label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="imeri@urugero.rw"
                  className="h-9 min-w-0 flex-1 rounded-md border border-[#D9D6CE] bg-white px-3 text-[12.5px] text-[#202724] placeholder:text-[#929A95] focus:border-[#214E43] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subLoading}
                  className="h-9 rounded-md bg-[#BD594A] px-3.5 text-[12px] font-semibold text-white hover:bg-[#A94C40] disabled:opacity-60"
                >
                  {t('confirm')}
                </button>
              </div>
              <label className="flex items-start gap-2 text-[11px] text-[#68716D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 accent-[#BD594A]"
                />
                <span>{t('terms')} &amp; {t('privacy')}</span>
              </label>
              {subMessage && <p className="text-[12px] font-medium text-[#68716D]">{subMessage}</p>}
            </form>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1.5 border-t border-[#E3E0D8] pt-5 text-[11.5px] text-[#68716D] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t('app_name')} Rwanda.</p>
          <p>{t('footer_disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
};
