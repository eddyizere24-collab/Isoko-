import React, { useState } from 'react';
import { ArrowRight, KeyRound, Lock, Phone, ShieldCheck, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { loginAccount } from '../lib/api';

const DEMO_ACCOUNTS = [
  {
    label: 'Umucuruzi 1 — Iduka rya Mugisha (Yemejwe)',
    phone: '250788100001',
    pass: 'mugisha123',
    role: 'seller',
  },
  {
    label: 'Umucuruzi 2 — Iduka rya Aline (Yemejwe)',
    phone: '250788100002',
    pass: 'aline123',
    role: 'seller',
  },
  {
    label: 'Umucuruzi 4 — Nyarugenge Style (Itegereje KYC)',
    phone: '250788100004',
    pass: 'style123',
    role: 'seller',
  },
  {
    label: 'Admin — Ubuyobozi bw’Urubuga',
    phone: '250788000000',
    pass: 'admin123',
    role: 'admin',
  },
];

export const LoginPage: React.FC = () => {
  const { navigate, setAuthData, authProfile } = useMarketplace();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (p: string, pw: string) => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await loginAccount(p, pw);
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
    performLogin(phone, password);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 lg:col-span-7">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-[#1B1F23]">
              Injira muri konti yawe
            </h1>
            <p className="mt-1.5 text-sm text-slate-600">
              Abaguzi ntibakenera konti — bashobora kugura ako kanya. Aha ni ah’abacuruzi bemejwe
              n’abayobozi b’urubuga.
            </p>
          </div>

          {authProfile && (
            <div className="mb-6 rounded-xl border border-[#0B6E4F]/30 bg-[#F1F6F3] p-4 text-sm">
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
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D]"
                >
                  <span>Jya ku rupapuro rwawe</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-phone" className="block text-sm font-semibold text-[#1B1F23]">
                {RW.phone}
              </label>
              <div className="relative mt-1.5">
                <Phone
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0788 100 001 cyangwa 250788100001"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-sm font-semibold text-[#1B1F23]">
                {RW.password}
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
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
                  placeholder="Nibura inyuguti cyangwa imibare 6"
                  className="min-h-[44px] w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/20"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-sm font-medium text-[#C0392B]"
              >
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

          <p className="mt-4 text-xs text-slate-500">
            Iyo winjiye, ukomeza kuba uri muri konti iminsi 30 kuri iyi telefoni cyangwa mudasobwa
            keretse ukanda Sohoka. Wibagiwe ijambo ry’ibanga? Twandikire kuri WhatsApp y’ubufasha.
          </p>

          <div className="mt-6 border-t border-slate-200 pt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-slate-600">Ntabwo urandikisha iduka ryawe?</span>
            <a
              href="/abacuruzi"
              onClick={(e) => {
                e.preventDefault();
                navigate('/abacuruzi');
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#0B6E4F] px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3]"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              <span>Iyandikishe nk’umucuruzi</span>
            </a>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-[#F1F6F3] p-6 lg:col-span-5">
          <div className="flex items-center gap-2 text-[#0B6E4F]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-base font-bold text-[#1B1F23]">
              Konti zo kugerageza (Demo)
            </h2>
          </div>
          <p className="mt-1.5 text-xs text-slate-600">
            Kanda kuri imwe muri izi konti winjire ako kanya urebe iby’abacuruzi cyangwa Admin:
          </p>

          <div className="mt-4 space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.phone}
                type="button"
                disabled={submitting}
                onClick={() => {
                  setPhone(acc.phone);
                  setPassword(acc.pass);
                  performLogin(acc.phone, acc.pass);
                }}
                className="flex min-h-[52px] w-full flex-col items-start justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left transition hover:border-[#0B6E4F]"
              >
                <span className="text-sm font-semibold text-[#1B1F23]">{acc.label}</span>
                <span className="mt-0.5 text-xs text-slate-500 tabular-nums">
                  {acc.phone} · Ijambo ry’ibanga: {acc.pass}
                </span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
};
