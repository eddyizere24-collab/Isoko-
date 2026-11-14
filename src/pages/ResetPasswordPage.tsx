import React, { useState } from 'react';
import { ArrowLeft, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { resetAccountPassword } from '../lib/api';

export const ResetPasswordPage: React.FC = () => {
  const { navigate } = useMarketplace();
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Ijambo ry’ibanga rigomba kugira nibura inyuguti 8.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Amagambo y’ibanga ntiyahuye. Yandike kimwe.');
      return;
    }
    setSubmitting(true);
    try {
      await resetAccountPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntitwashoboye guhindura ijambo ry’ibanga.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F6F3] text-[#0B6E4F]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1B1F23]">Shyiraho ijambo ry’ibanga rishya</h1>
        {done ? (
          <>
            <div role="status" className="mt-4 rounded-xl border border-[#0B6E4F]/25 bg-[#F1F6F3] p-4 text-sm leading-6 text-slate-700">
              Ijambo ry’ibanga ryawe ryahinduwe. Izindi sessions za konti yawe zasohowe ku zindi devices.
            </div>
            <button
              type="button"
              onClick={() => navigate('/injira')}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D]"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Injira muri konti yawe
            </button>
          </>
        ) : !token ? (
          <>
            <p className="mt-3 text-sm leading-6 text-[#C0392B]">
              Link yo guhindura ijambo ry’ibanga ntabwo ibonetse cyangwa yararengeje igihe.
            </p>
            <button
              type="button"
              onClick={() => navigate('/ibagiwe-ijambo')}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D]"
            >
              Saba indi link
            </button>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">Hitamo ijambo ry’ibanga rishya. Rikoreshe nibura inyuguti 8.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-semibold text-[#1B1F23]">Ijambo ry’ibanga rishya</label>
                <div className="relative mt-1.5">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#1B1F23]">Subiramo ijambo ry’ibanga</label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="mt-1.5 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
                />
              </div>
              {error && (
                <div role="alert" className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/5 px-4 py-3 text-sm text-[#C0392B]">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D] disabled:opacity-60"
              >
                {submitting ? 'Tegereza...' : 'Hindura ijambo ry’ibanga'}
              </button>
            </form>
          </>
        )}
        <button
          type="button"
          onClick={() => navigate('/injira')}
          className="mt-5 inline-flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#0B6E4F] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Subira ku kwinjira
        </button>
      </section>
    </main>
  );
};
