import React, { useState } from 'react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { requestAccountPasswordReset } from '../lib/api';

export const RequestPasswordResetPage: React.FC = () => {
  const { navigate } = useMarketplace();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const redirectTo = `${window.location.origin}/ongera-ijambo`;
      await requestAccountPasswordReset(email, redirectTo);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntitwashoboye kwakira ubusabe bwawe.');
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
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1B1F23]">
          Garura ijambo ry’ibanga
        </h1>
        {sent ? (
          <div role="status" className="mt-4 rounded-xl border border-[#0B6E4F]/25 bg-[#F1F6F3] p-4 text-sm leading-6 text-slate-700">
            Niba iyi email ifite konti ya ISOKO, twohereje amabwiriza yo guhindura ijambo ry’ibanga. Reba Inbox na Spam.
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Andika email wakoresheje ufungura konti. Tuzohereza link yo guhindura ijambo ry’ibanga.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-semibold text-[#1B1F23]">Email ya konti yawe</label>
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id="reset-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="izina@gmail.com"
                    className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
                  />
                </div>
              </div>
              {error && (
                <div role="alert" className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/5 px-4 py-3 text-sm text-[#C0392B]">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white transition hover:bg-[#08553D] disabled:opacity-60"
              >
                {submitting ? 'Tegereza...' : 'Ohereza link yo guhindura password'}
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
