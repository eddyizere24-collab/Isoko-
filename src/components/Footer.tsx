import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { subscribeUpdates } from '../lib/api';
import { buildWhatsAppLink } from '../lib/whatsapp';
import { IsokoWordmark, RwandanGeometricPattern } from './IsokoLogo';

export const Footer: React.FC = () => {
  const { navigate, bootstrap, location } = useMarketplace();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [subMessage, setSubMessage] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);

  const supportPhone = bootstrap?.settings.SUPPORT_WHATSAPP || '250788000000';
  const supportUrl = buildWhatsAppLink(
    supportPhone,
    'Muraho ikipe ya Isoko, nkeneye ubufasha ku rubuga.'
  );

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
    <footer className="mt-10 bg-[#064E3B] text-white">
      <RwandanGeometricPattern />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="grid gap-6 md:grid-cols-4 md:gap-8">
          <div>
            <IsokoWordmark
              variant="white"
              markClassName="h-6 w-6"
              wordmarkClassName="h-[17px] w-auto"
            />
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#E8F3EE]/85 max-w-xs">
              Isoko ry’abacuruzi benshi ryo kuri interineti ry’u Rwanda: imyambaro, inkweto,
              amasogisi n’ibyo kwambara. Nta komisiyo, uvugana n’umucuruzi kuri WhatsApp.
            </p>
            <a
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3.5 inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1A7F43] px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-[#146635] transition-colors"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              <span>{RW.help_whatsapp}</span>
            </a>
            <p className="mt-2 text-[11.5px] text-[#E8F3EE]/70">
              {bootstrap?.settings.SUPPORT_HOURS || 'Buri munsi · 08:00 – 20:00 (CAT)'}
            </p>
          </div>

          {/* Mobile accordion / Desktop column */}
          <details className="group border-t border-white/15 pt-3 md:border-0 md:pt-0" open>
            <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between text-[13px] font-semibold text-white md:cursor-default">
              <span>Amakuru y’urubuga</span>
              <ChevronDown className="h-4 w-4 text-white/70 transition-transform group-open:rotate-180 md:hidden" />
            </summary>
            <ul className="mt-2 space-y-2 text-[12.5px] text-[#E8F3EE]/85">
              <li>
                <a
                  href="/abacuruzi"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/abacuruzi');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {RW.sell_on_platform}
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
                  {RW.about}
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
                  Ubufasha
                </a>
              </li>
            </ul>
          </details>

          <details className="group border-t border-white/15 pt-3 md:border-0 md:pt-0">
            <summary className="flex min-h-[36px] cursor-pointer list-none items-center justify-between text-[13px] font-semibold text-white md:cursor-default">
              <span>Amategeko</span>
              <ChevronDown className="h-4 w-4 text-white/70 transition-transform group-open:rotate-180 md:hidden" />
            </summary>
            <ul className="mt-2 space-y-2 text-[12.5px] text-[#E8F3EE]/85 md:block">
              <li>
                <a
                  href="/amategeko"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/amategeko');
                  }}
                  className="hover:text-white hover:underline"
                >
                  {RW.terms}
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
                  {RW.privacy}
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
                  {RW.seller_rules}
                </a>
              </li>
            </ul>
          </details>

          <div className="border-t border-white/15 pt-4 md:border-0 md:pt-0">
            <h3 className="text-[13px] font-semibold text-white">Akira amakuru y’ibishya</h3>
            <p className="mt-1 text-[12px] text-[#E8F3EE]/80">
              Ibicuruzwa bishya n’ibiciro byagabanyijwe rimwe mu cyumweru.
            </p>
            <form onSubmit={handleSubscribe} className="mt-2.5 space-y-2">
              <div className="flex gap-2">
                <label htmlFor="footer-email" className="sr-only">
                  Imeri yawe
                </label>
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="imeri@urugero.rw"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-white/25 bg-white/10 px-3 text-[12.5px] text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subLoading}
                  className="h-9 rounded-lg bg-[#C0392B] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#A93226] disabled:opacity-60"
                >
                  Emeza
                </button>
              </div>
              <label className="flex items-start gap-2 text-[11.5px] text-[#E8F3EE]/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 accent-[#C0392B]"
                />
                <span>Nemeye kwakira amakuru kuri imeri nk’uko bisobanuwe muri Politiki y’ibanga.</span>
              </label>
              {subMessage && <p className="text-[12px] font-medium text-[#E8F3EE]">{subMessage}</p>}
            </form>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-1.5 border-t border-white/15 pt-5 text-[11.5px] text-[#E8F3EE]/75 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {RW.app_name} Rwanda. Uburenganzira bwose burarinzwe.</p>
          <p>Urubuga ntirwakira amafaranga; ibiganiro byose bikorwa hagati y’umukiriya n’umucuruzi.</p>
        </div>
      </div>
    </footer>
  );
};
