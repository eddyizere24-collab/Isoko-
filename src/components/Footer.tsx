import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';
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

  const supportPhone = bootstrap?.settings.SUPPORT_WHATSAPP?.trim() ?? '';
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
      setSubMessage('Byakozwe! Uzajya ubona ibicuruzwa bishya kuri imeri. Ushobora kwikuraho igihe cyose.');
      setEmail('');
    } catch (err) {
      setSubMessage(err instanceof Error ? err.message : 'Habaye ikibazo.');
    } finally {
      setSubLoading(false);
    }
  };

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white text-[#1B1F23]">
      <RwandanGeometricPattern className="pointer-events-none h-2 w-full opacity-70" />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <IsokoWordmark />
            <p className="mt-3 text-sm leading-relaxed text-slate-600 max-w-xs">
              Isoko ry’abacuruzi benshi ryo kuri interineti ry’u Rwanda: imyambaro, inkweto,
              amasogisi n’ibyo kwambara. Nta komisiyo, uvugana n’umucuruzi kuri WhatsApp.
            </p>
            {supportUrl ? (
              <a
                href={supportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1FB858]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>{RW.help_whatsapp}</span>
              </a>
            ) : (
              <p className="mt-4 text-xs leading-5 text-slate-600">
                Nimero yemewe y’ubufasha izashyirwa hano imaze kwemezwa.
              </p>
            )}
            {supportUrl && bootstrap?.settings.SUPPORT_HOURS?.trim() && (
              <p className="mt-2 text-xs text-slate-600">{bootstrap.settings.SUPPORT_HOURS}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-[#1B1F23]">Amakuru y’urubuga</h3>
              <ul className="mt-3 space-y-2.5 text-slate-600">
                <li>
                  <a
                    href="/abacuruzi"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/abacuruzi');
                    }}
                    className="hover:text-[#0B6E4F] hover:underline"
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
                    className="hover:text-[#0B6E4F] hover:underline"
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
                    className="hover:text-[#0B6E4F] hover:underline"
                  >
                    Ubufasha
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-[#1B1F23]">Amategeko</h3>
              <ul className="mt-3 space-y-2.5 text-slate-600">
                <li>
                  <a
                    href="/amategeko"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/amategeko');
                    }}
                    className="hover:text-[#0B6E4F] hover:underline"
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
                    className="hover:text-[#0B6E4F] hover:underline"
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
                    className="hover:text-[#0B6E4F] hover:underline"
                  >
                    {RW.seller_rules}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#1B1F23]">Akira amakuru y’ibishya (si itegeko)</h3>
            <p className="mt-1.5 text-xs text-slate-600">
              Ibicuruzwa bishya n’ibiciro byagabanyijwe rimwe mu cyumweru.
            </p>
            <form onSubmit={handleSubscribe} className="mt-3 space-y-2.5">
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
                  className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={subLoading}
                  className="min-h-[44px] rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D] disabled:opacity-60"
                >
                  Emeza
                </button>
              </div>
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#0B6E4F]"
                />
                <span>
                  Nemeye kwakira amakuru kuri imeri nk’uko bisobanuwe muri Politiki y’ibanga.
                </span>
              </label>
              {subMessage && <p className="text-xs font-medium text-[#0B6E4F]">{subMessage}</p>}
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200/80 pt-6 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {RW.app_name} Rwanda. Uburenganzira bwose burarinzwe.</p>
          <p>Urubuga ntirwakira amafaranga; ibiganiro byose bikorwa hagati y’umukiriya n’umucuruzi.</p>
        </div>
      </div>
    </footer>
  );
};
