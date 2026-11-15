import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import {
  changeAccountPassword,
  signOutOtherDevices,
  supportsAccountPasswordChange,
  supportsSignOutOtherDevices,
} from '../lib/api';

export const AccountPage: React.FC = () => {
  const { authReady, authSession, authProfile, navigate, logout } = useMarketplace();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibishobotse gusohoka. Ongera ugerageze.');
    } finally {
      setSigningOut(false);
    }
  };

  if (!authReady) {
    return (
      <main className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600" role="status">
          Turagenzura konti yawe...
        </div>
      </main>
    );
  }

  if (!authSession || !authProfile) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F3EE] text-[#0B6E4F]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#1A1F1C]">Konti</h1>
          <p className="mt-2 text-sm leading-6 text-[#4B544F]">
            Abaguzi bashobora gushakisha ibicuruzwa no kuvugana n’umucuruzi kuri WhatsApp batabanje gufungura konti.
            Konti irakenerwa cyane cyane ku bashaka gufungura iduka.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => navigate('/injira')}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
            >
              Injira muri konti
            </button>
            <button
              type="button"
              onClick={() => navigate('/abacuruzi')}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#0B6E4F] bg-white px-5 text-sm font-semibold text-[#0B6E4F]"
            >
              Fungura iduka
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isAdmin = authProfile.role === 'admin' || authProfile.role === 'moderator';

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F3EE] text-[#0B6E4F]">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-[#1A1F1C]">Konti</h1>
            <p className="mt-0.5 break-all text-sm text-[#4B544F]">{authProfile.email || authProfile.phone}</p>
            <p className="mt-1 text-xs font-medium text-[#4B544F]">
              {isAdmin ? 'Ubuyobozi bwa Isoko' : authProfile.role === 'seller' ? 'Konti y’umucuruzi' : 'Konti ya Isoko'}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate('/konti/yanjye')}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D6E3DB] bg-white px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#F5FAF7]"
          >
            <KeyRound className="h-4 w-4" aria-hidden="true" />
            Konte yanjye
          </button>
          <button
            type="button"
            onClick={() => navigate(isAdmin ? '/admin' : '/umucuruzi')}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1A1F1C]"
          >
            <Store className="h-4 w-4" aria-hidden="true" />
            {isAdmin ? 'Ibiro bya Admin' : 'Ibiro by’iduka'}
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/5 p-3 text-sm text-[#C0392B]">
            {error}
          </p>
        )}

        <div className="mt-6 border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C0392B] px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Turagusohora...' : 'Sohoka'}
          </button>
          <p className="mt-2 text-center text-xs text-[#4B544F]">
            Gusohoka birakuraho konti kuri iyi telefoni, ariko ntibisiba konti yawe kuri Isoko.
          </p>
        </div>
      </section>
    </main>
  );
};

export const MyAccountPage: React.FC = () => {
  const { authReady, authSession, authProfile, navigate, logout } = useMarketplace();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [revokingSessions, setRevokingSessions] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const passwordSupported = supportsAccountPasswordChange();
  const otherSessionsSupported = supportsSignOutOtherDevices();

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 8) {
      setError('Ijambo ry’ibanga rishya rigomba kugira nibura inyuguti 8.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Amagambo y’ibanga mashya ntiyahuye.');
      return;
    }
    setSavingPassword(true);
    try {
      await changeAccountPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Ijambo ry’ibanga ryahinduwe neza.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibishobotse guhindura ijambo ry’ibanga.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setError(null);
    setMessage(null);
    setRevokingSessions(true);
    try {
      await signOutOtherDevices();
      setMessage('Izindi devices zasohowe. Iyi telefoni iracyakoresha konti yawe.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibishobotse gusohora izindi devices.');
    } finally {
      setRevokingSessions(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibishobotse gusohoka. Ongera ugerageze.');
    } finally {
      setSigningOut(false);
    }
  };

  if (!authReady || !authSession || !authProfile) {
    return (
      <main className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-[#4B544F]" role="status">
          {!authReady ? 'Turagenzura konti yawe...' : 'Injira muri konti yawe kugira ngo urebe imiterere yayo.'}
        </div>
      </main>
    );
  }

  const emailVerified = authProfile.email_verified === true;

  return (
    <main className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <button
        type="button"
        onClick={() => navigate('/konti')}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#0B6E4F]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Subira kuri Konti
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h1 className="text-2xl font-bold text-[#1A1F1C]">Konte yanjye</h1>
        <p className="mt-1 text-sm text-[#4B544F]">Reba uko konti yawe ihagaze kandi uyirinde.</p>

        <div className="mt-5 rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#4B544F]">Email ya konti</p>
              <p className="mt-1 break-all text-sm font-semibold text-[#1A1F1C]">{authProfile.email || 'Nta email yagaragajwe'}</p>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${emailVerified ? 'bg-[#E7F4EB] text-[#0B6E4F]' : 'bg-[#FFF1EF] text-[#C0392B]'}`}>
              {emailVerified ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />}
              {emailVerified ? 'Yemejwe' : 'Ntiyemejwe'}
            </span>
          </div>
          {!emailVerified && (
            <p className="mt-2 text-xs leading-5 text-[#4B544F]">
              Email ntiyemejwe muri Isoko. Iyi page irakwereka uko ihagaze; kwemeza email ntibirahuzwa n’ikorwa ryo kohereza verification link muri iyi PR.
            </p>
          )}
        </div>

        {message && (
          <p role="status" className="mt-4 rounded-lg border border-[#0B6E4F]/25 bg-[#0B6E4F]/5 p-3 text-sm text-[#0B6E4F]">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/5 p-3 text-sm text-[#C0392B]">
            {error}
          </p>
        )}

        <div className="mt-6">
          <h2 className="text-base font-bold text-[#1A1F1C]">Hindura ijambo ry’ibanga</h2>
          {passwordSupported ? (
            <form onSubmit={handlePasswordChange} className="mt-3 space-y-3">
              <div>
                <label htmlFor="account-current-password" className="block text-sm font-semibold text-[#1A1F1C]">Ijambo ry’ibanga rikoreshwa ubu</label>
                <input id="account-current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-[#1A1F1C] focus:border-[#0B6E4F] focus:outline-none" />
              </div>
              <div>
                <label htmlFor="account-new-password" className="block text-sm font-semibold text-[#1A1F1C]">Ijambo ry’ibanga rishya</label>
                <input id="account-new-password" type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-[#1A1F1C] focus:border-[#0B6E4F] focus:outline-none" />
              </div>
              <div>
                <label htmlFor="account-confirm-password" className="block text-sm font-semibold text-[#1A1F1C]">Subiramo ijambo rishya</label>
                <input id="account-confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-[#1A1F1C] focus:border-[#0B6E4F] focus:outline-none" />
              </div>
              <button type="submit" disabled={savingPassword} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#0B6E4F] px-4 text-sm font-semibold text-white disabled:opacity-60">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                {savingPassword ? 'Turabika...' : 'Bika ijambo ry’ibanga rishya'}
              </button>
            </form>
          ) : (
            <div className="mt-3 rounded-lg border border-slate-200 bg-[#FAFAF7] p-3">
              <p className="text-sm leading-5 text-[#4B544F]">
                Guhindura password ako kanya ntibiragaragara muri iyi verisiyo ya Neon Auth.
              </p>
              <button type="button" onClick={() => navigate('/ibagiwe-ijambo')} className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#0B6E4F]">
                Saba link yo guhindura password
              </button>
            </div>
          )}
        </div>

        {otherSessionsSupported && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <h2 className="text-base font-bold text-[#1A1F1C]">Izindi devices</h2>
            <p className="mt-1 text-sm text-[#4B544F]">Sohora izindi telefoni cyangwa mudasobwa zinjiye muri konti yawe.</p>
            <button type="button" onClick={handleRevokeOtherSessions} disabled={revokingSessions} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#C0392B]/40 bg-white px-4 text-sm font-semibold text-[#C0392B] disabled:opacity-60">
              {revokingSessions ? 'Turimo gusohora izindi devices...' : 'Sohora izindi devices'}
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-slate-200 pt-5">
          <button type="button" onClick={handleLogout} disabled={signingOut} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C0392B] px-5 text-sm font-semibold text-white disabled:opacity-60">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Turagusohora...' : 'Sohoka kuri iyi telefoni'}
          </button>
        </div>
      </section>
    </main>
  );
};
