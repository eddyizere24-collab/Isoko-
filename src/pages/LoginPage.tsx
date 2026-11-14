import React, { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, Lock, Mail, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { loginAccount, loginWithCurrentSession, startGoogleSignIn } from '../lib/api';

export const LoginPage: React.FC = () => {
  const { navigate, setAuthData, authProfile } = useMarketplace();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('oauth') !== 'google') return;
    setSubmitting(true);
    loginWithCurrentSession().then(result => {
      setAuthData({ token: result.token, userId: result.profile.id, role: result.profile.role, expiresAt: result.expiresAt }, result.profile, result.shop);
      navigate(result.profile.role === 'admin' || result.profile.role === 'moderator' ? '/admin' : '/umucuruzi');
    }).catch(() => navigate('/abacuruzi?oauth=google')).finally(() => setSubmitting(false));
  }, [navigate, setAuthData]);

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try { await startGoogleSignIn('/injira?oauth=google'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in ntiyabashije gutangira.'); setSubmitting(false); }
  };

  const performLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const result = await loginAccount(identifier, password);
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
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">ISOKO · Konti yawe</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1B1F23]">Injira muri konti yawe</h1>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Koresha email wandikishije n’ijambo ry’ibanga. Abafite konti za Admin za mbere bashobora gukomeza gukoresha nimero ya telefoni.
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

          <button type="button" onClick={() => void handleGoogle()} disabled={submitting} className="mb-4 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50 disabled:opacity-60"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 font-bold text-[#4285F4]">G</span> Komeza ukoreshe Google</button>
          <div className="mb-4 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/>cyangwa ukoreshe email<span className="h-px flex-1 bg-slate-200"/></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-identifier" className="block text-sm font-semibold text-[#1B1F23]">Email</label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="login-identifier"
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="izina@gmail.com"
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-pass" className="block text-sm font-semibold text-[#1B1F23]">{RW.password}</label>
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
                  className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
                />
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/5 px-4 py-3 text-sm font-medium text-[#C0392B]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white transition hover:bg-[#08553D] disabled:opacity-60"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Tegereza...' : RW.login}</span>
            </button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
            <span className="text-sm text-slate-600">Ntabwo urafungura iduka ryawe?</span>
            <button
              type="button"
              onClick={() => navigate('/abacuruzi')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#0B6E4F] px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3]"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              <span>Fungura iduka</span>
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-[#F7FAF8] p-6 lg:col-span-5">
          <h2 className="text-base font-bold text-[#1B1F23]">Abaguzi ntibakenera konti</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Ushobora kureba amaduka n’ibicuruzwa no kuvugana n’umucuruzi kuri WhatsApp utinjiye. Konti ikenewe gusa ku muntu ushaka gucuruza no gucunga iduka rye.
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
            <p className="text-xs leading-5 text-slate-600">
              Email ni yo izakoreshwa mu kurinda no kugarura konti yawe.
            </p>
            <button
              type="button"
              onClick={() => navigate('/ibagiwe-ijambo')}
              className="mt-2 inline-flex min-h-[40px] items-center gap-2 text-sm font-semibold text-[#0B6E4F] hover:underline"
            >
              Wibagiwe ijambo ry’ibanga?
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};
