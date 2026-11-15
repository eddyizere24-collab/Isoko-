import React, { useState } from 'react';
import { ArrowRight, KeyRound, Lock, Mail, ShieldCheck, Store } from 'lucide-react';
import { AuthBrandHeader } from '../components/IsokoLogo';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { loginAccount } from '../lib/api';

export const LoginPage: React.FC = () => {
  const { navigate, setAuthData, authProfile } = useMarketplace();
  const { t } = useT();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (idValue: string, pw: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await loginAccount(idValue, pw);
      setAuthData(
        {
          token: res.token,
          userId: res.profile.id,
          role: res.profile.role,
          expiresAt: res.expiresAt,
        },
        res.profile,
        res.shop
      );
      if (res.profile.role === 'admin' || res.profile.role === 'moderator') {
        navigate('/admin');
      } else {
        navigate('/umucuruzi');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kwinjira byanze. Ongera ugerageze.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(identifier, password);
  };

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-6">
      <AuthBrandHeader
        title={t('login')}
        subtitle="Abaguzi ntibakenera konti — abacuruzi binjira hano kugira ngo bashyireho ibicuruzwa."
      />

      <div className="mt-4 grid gap-5 lg:grid-cols-12">
        <section className="rounded-lg border border-[#E5E7EB] bg-white p-5 sm:p-6 lg:col-span-7">
          {authProfile && (
            <div className="mb-5 rounded-lg border border-[#0B6E4F]/30 bg-[#E8F3EE] p-4 text-sm">
              <p className="font-semibold text-[#1B1F23]">
                Usanzwe winjiye nka {authProfile.full_name}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      authProfile.role === 'admin' || authProfile.role === 'moderator'
                        ? '/admin'
                        : '/umucuruzi'
                    )
                  }
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#064E3B]"
                >
                  <span>Jya ku rupapuro rwawe</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="block text-[13px] font-semibold text-[#1B1F23]">
                {t('email')} / {t('phone')}
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
                  aria-hidden="true"
                />
                <input
                  id="login-identifier"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="izina@gmail.com cyangwa 0788 100 001"
                  className="min-h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-[13px] font-semibold text-[#1B1F23]">
                {t('password')}
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]"
                  aria-hidden="true"
                />
                <input
                  id="login-pass"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nibura inyuguti cyangwa imibare 8"
                  className="min-h-[44px] w-full rounded-lg border border-[#E5E7EB] bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-[#C0392B]/30 bg-[#FBEAE8] px-4 py-3 text-sm font-medium text-[#C0392B]"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#0B6E4F] px-5 text-sm font-semibold text-white transition hover:bg-[#064E3B] disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? '...' : t('login')}</span>
            </button>
          </form>

          <p className="mt-4 text-xs text-[#64748B]">
            Iyo winjiye, ukomeza kuba uri muri konti iminsi 30 kuri iyi telefoni keretse ukanda {t('logout')}.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E7EB] pt-4">
            <span className="text-[13px] text-[#475569]">Ntabwo urafungura iduka ryawe?</span>
            <a
              href="/abacuruzi"
              onClick={(e) => {
                e.preventDefault();
                navigate('/abacuruzi');
              }}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-lg border border-[#0B6E4F] px-4 text-[13px] font-semibold text-[#0B6E4F] hover:bg-[#E8F3EE]"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              <span>{t('register_seller')}</span>
            </a>
          </div>
        </section>

        <aside className="rounded-lg border border-[#E5E7EB] bg-white p-5 lg:col-span-5">
          <div className="flex items-center gap-2 text-[#0B6E4F]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-[15px] font-semibold text-[#1B1F23]">
              Uko Isoko ikora
            </h2>
          </div>

          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="font-semibold text-[#1B1F23]">Ku baguzi</p>
              <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                Ushobora kureba ibicuruzwa, gushakisha amaduka no gukoresha igare utabanje gufungura konti.
                Iyo uhisemo igicuruzwa, uvugana n’umucuruzi kuri WhatsApp.
              </p>
            </div>
            <div className="border-t border-[#E5E7EB] pt-3">
              <p className="font-semibold text-[#1B1F23]">Ku bacuruzi</p>
              <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                Konti yawe ikoreshwa mu gucunga iduka, gushyiraho ibicuruzwa, amafoto n’amakuru y’ubucuruzi.
                Buri mucuruzi agomba gukoresha konti ye bwite.
              </p>
              <button
                type="button"
                onClick={() => navigate('/abacuruzi')}
                className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-md border border-[#0B6E4F] px-3 text-xs font-semibold text-[#0B6E4F] hover:bg-[#E8F3EE]"
              >
                <Store className="h-4 w-4" aria-hidden="true" />
                Fungura iduka
              </button>
            </div>
            <p className="border-t border-[#E5E7EB] pt-3 text-[11px] leading-relaxed text-[#64748B]">
              Isoko ihuza umuguzi n’umucuruzi. Kwishyura no gutanga ibicuruzwa byumvikanwaho hagati yabo.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
};
