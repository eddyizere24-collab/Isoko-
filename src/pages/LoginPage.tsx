import React, { useState } from 'react';
import { ArrowRight, KeyRound, Lock, Phone, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { loginAccount } from '../lib/api';

export const LoginPage: React.FC = () => {
  const { navigate, setAuthData, authProfile } = useMarketplace();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginAccount(phone, password);
      setAuthData(
        {
          token: result.token,
          userId: result.profile.id,
          role: result.profile.role,
          expiresAt: result.expiresAt,
        },
        result.profile,
        result.shop
      );
      navigate(result.profile.role === 'admin' || result.profile.role === 'moderator' ? '/admin' : '/umucuruzi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kwinjira byanze. Ongera ugerageze.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void performLogin();
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 lg:col-span-7">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#1B1F23]">
              Injira muri konti yawe
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Injira ukoresheje nimero ya telefoni n’ijambo ry’ibanga wakoresheje wiyandikisha.
            </p>
          </div>

          {authProfile && (
            <div className="mb-6 rounded-xl border border-[#0B6E4F]/30 bg-[#F1F6F3] p-4 text-sm">
              <p className="font-semibold text-[#1B1F23]">Usanzwe winjiye nka {authProfile.full_name}</p>
              <button
                type="button"
                onClick={() => navigate(authProfile.role === 'admin' || authProfile.role === 'moderator' ? '/admin' : '/umucuruzi')}
                className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D]"
              >
                <span>Jya ku rupapuro rwawe</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-phone" className="block text-sm font-semibold text-[#1B1F23]">
                {RW.phone}
              </label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0788 123 456 cyangwa 250788123456"
                  className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-sm font-semibold text-[#1B1F23]">
                {RW.password}
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="login-pass"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nibura inyuguti 8"
                  className="min-h-[46px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-sm font-medium text-[#C0392B]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white transition hover:bg-[#08553D] disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Tegereza...' : RW.login}</span>
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <span className="text-sm text-slate-600">Ntabwo urandikisha iduka ryawe?</span>
            <button
              type="button"
              onClick={() => navigate('/abacuruzi')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#0B6E4F] px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3]"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              <span>Iyandikishe nk’umucuruzi</span>
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-[#F1F6F3] p-6 lg:col-span-5">
          <h2 className="text-base font-bold text-[#1B1F23]">Konti yawe irinzwe</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Isoko ikoresha uburyo bwihariye bwo gucunga konti. Nimero yawe ya telefoni ni yo ikoreshwa mu kwinjira; abaguzi bashobora kureba ibicuruzwa n’amaduka batabanje kwiyandikisha.
          </p>
          <p className="mt-4 rounded-xl border border-[#0B6E4F]/20 bg-white/80 p-3 text-xs leading-5 text-slate-600">
            Niba ari ubwa mbere ucuruza kuri Isoko, banza wandikishe iduka ryawe. Rizatangira kugaragara ku baguzi nyuma yo kugenzurwa no kwemezwa.
          </p>
        </aside>
      </div>
    </main>
  );
};
