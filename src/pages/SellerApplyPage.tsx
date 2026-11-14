import React, { useEffect, useState } from 'react';
import { ArrowRight, Lock, Mail, MessageCircle, ShieldCheck, Store, UserRound } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { registerSellerAccount, startGoogleSignIn } from '../lib/api';
import { getNeonUser } from '../lib/neon';
import { isValidRwandaPhone } from '../lib/whatsapp';

export const SellerApplyPage: React.FC = () => {
  const { navigate, setAuthData } = useMarketplace();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [shopName, setShopName] = useState('');
  const [fullName, setFullName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleSession, setGoogleSession] = useState(false);

  useEffect(() => {
    getNeonUser().then(user => {
      if (user?.email) { setEmail(String(user.email)); setGoogleSession(true); }
    }).catch(() => undefined);
  }, []);

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try { await startGoogleSignIn('/abacuruzi?oauth=google'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in ntiyabashije gutangira.'); setSubmitting(false); }
  };

  if (import.meta.env.VITE_ISOKO_PREVIEW === 'true') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-[#1B1F23]">Gufungura iduka kuri ISOKO</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Ubu uri kuri Preview. Koresha Production kugira ngo ufungure iduka ryawe. Ntushyiremo amakuru ya konti kuri uru rubuga rw’igerageza.
          </p>
          <button type="button" onClick={() => navigate('/')} className="mt-4 min-h-11 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white">Subira ku isoko</button>
        </section>
      </main>
    );
  }

  if (import.meta.env.VITE_ISOKO_SELLER_REGISTRATION_ENABLED !== 'true') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">ISOKO · Production</p>
          <h1 className="mt-2 text-xl font-bold text-[#1B1F23]">Kwiyandikisha birimo gutegurwa</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">Urubuga ruri online. Kwiyandikisha ku iduka kuzakomeza gukoresha email, password na WhatsApp gusa.</p>
          <button type="button" onClick={() => navigate('/')} className="mt-4 min-h-11 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white">Subira ku isoko</button>
        </section>
      </main>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Andika email nyayo, urugero: izina@gmail.com.');
      return;
    }
    if (!googleSession && password.length < 8) {
      setError('Ijambo ry’ibanga rigomba kugira nibura inyuguti 8.');
      return;
    }
    if (!isValidRwandaPhone(phone)) {
      setError('Nimero ya WhatsApp igomba kuba iya MTN cyangwa Airtel mu Rwanda (07XXXXXXXX).');
      return;
    }
    if (shopName.trim().length < 2) {
      setError('Andika izina ry’iduka ryawe.');
      return;
    }
    if (!termsAccepted) {
      setError('Emeza amategeko n’amabwiriza ya ISOKO mbere yo gukomeza.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerSellerAccount({
        email: cleanEmail,
        password,
        phone,
        shopName: shopName.trim(),
        fullName: fullName.trim(),
        termsAccepted: true,
      });
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
      navigate('/umucuruzi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gufungura iduka byanze. Ongera ugerageze.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-[#F7FAF8] px-5 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B6E4F] text-white">
              <Store className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">ISOKO · Abacuruzi</p>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1B1F23]">Fungura iduka ryawe</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-700">
            Tangira ukoresheje email yawe na nimero ya WhatsApp. Ushobora kuzuzuza amakuru arambuye y’iduka n’umwirondoro wawe nyuma, igihe ubishakiye.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <Mail className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
              <p className="mt-2 text-xs font-semibold text-[#1B1F23]">Email yawe</p>
              <p className="mt-0.5 text-xs text-slate-500">Yo kwinjira muri ISOKO</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <MessageCircle className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
              <p className="mt-2 text-xs font-semibold text-[#1B1F23]">WhatsApp</p>
              <p className="mt-0.5 text-xs text-slate-500">Abaguzi ni ho bazakuvugishiriza</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <Store className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
              <p className="mt-2 text-xs font-semibold text-[#1B1F23]">Izina ry’iduka</p>
              <p className="mt-0.5 text-xs text-slate-500">Rigaragara ku isoko</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-5 py-6 sm:px-8">
          {!googleSession && <><button type="button" onClick={() => void handleGoogle()} disabled={submitting} className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-slate-50 disabled:opacity-60"><span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 font-bold text-[#4285F4]">G</span> Komeza ukoreshe Google</button><div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/>cyangwa ukoreshe email<span className="h-px flex-1 bg-slate-200"/></div></>}
          {googleSession && <div className="rounded-xl border border-[#0B6E4F]/30 bg-[#F1F6F3] p-3 text-sm text-[#0B6E4F]">Google yemeje konti yawe. Uzuza WhatsApp n’izina ry’iduka kugira ngo urifungure.</div>}
          <div>
            <label htmlFor="seller-email" className="block text-sm font-semibold text-[#1B1F23]">Email *</label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="seller-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="izina@gmail.com"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
              />
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Koresha email ushobora kugeraho. Ni yo uzakoresha winjira kandi igufashe kugarura password igihe uyibagiwe.</p>
          </div>

          {!googleSession && <div>
            <label htmlFor="seller-password" className="block text-sm font-semibold text-[#1B1F23]">Ijambo ry’ibanga *</label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="seller-password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nibura inyuguti 8"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
              />
            </div>
          </div>}

          <div>
            <label htmlFor="seller-whatsapp" className="block text-sm font-semibold text-[#1B1F23]">Nimero ya WhatsApp *</label>
            <div className="relative mt-1.5">
              <MessageCircle className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="seller-whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0788 123 456"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
              />
            </div>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">Iyi nimero ni na yo ishobora gukoreshwa mu guhamagara. Ntukeneye kuyandika kabiri.</p>
          </div>

          <div>
            <label htmlFor="seller-shop-name" className="block text-sm font-semibold text-[#1B1F23]">Izina ry’iduka *</label>
            <div className="relative mt-1.5">
              <Store className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="seller-shop-name"
                required
                minLength={2}
                maxLength={40}
                value={shopName}
                onChange={(event) => setShopName(event.target.value)}
                placeholder="Urugero: Isoko Fashion"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none focus:ring-2 focus:ring-[#0B6E4F]/15"
              />
            </div>
          </div>

          <details className="rounded-xl border border-slate-200 bg-[#FAFCFB] p-4">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-slate-700">
              <UserRound className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
              Amazina yawe (ntabwo ari ngombwa ubu)
            </summary>
            <div className="mt-3">
              <label htmlFor="seller-full-name" className="block text-xs font-medium text-slate-600">Amazina yose</label>
              <input
                id="seller-full-name"
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Urugero: Mugisha Jean Paul"
                className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
              />
            </div>
          </details>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0B6E4F] focus:ring-[#0B6E4F]"
            />
            <span className="text-xs leading-5 text-slate-600">Nemeye amategeko n’amabwiriza y’abacuruzi ba ISOKO. Ngomba gutanga amakuru y’ukuri kandi nshobora kuzuza umwirondoro wanjye mu gihe kizaza.</span>
          </label>

          {error && <div role="alert" className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/5 px-4 py-3 text-sm font-medium text-[#C0392B]">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white transition hover:bg-[#08553D] disabled:opacity-60"
          >
            <span>{submitting ? 'Turimo gufungura iduka...' : 'Fungura iduka ryanjye'}</span>
            {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
          <p className="flex items-start gap-2 text-xs leading-5 text-slate-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0B6E4F]" aria-hidden="true" />
            Indangamuntu, amafoto y’ibyangombwa, aho uherereye n’andi makuru arambuye si ngombwa mu gufungura iduka. Uzayuzuza nyuma niba bibaye ngombwa.
          </p>
          <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">
            Usanzwe ufite konti?
            <button type="button" onClick={() => navigate('/injira')} className="ml-1 font-semibold text-[#0B6E4F] hover:underline">Injira</button>
          </div>
        </form>
      </section>
    </main>
  );
};
