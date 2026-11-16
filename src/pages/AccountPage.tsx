import React, { useState } from 'react';
import { KeyRound, LogOut, ShieldCheck, Smartphone, UserRound } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useT } from '../context/LangContext';
import {
  changeAccountPassword,
  revokeOtherAccountSessions,
  supportsOtherAccountSessionRevocation,
} from '../lib/neon';

export const AccountPage: React.FC = () => {
  const { authSession, authProfile, logout, navigate } = useMarketplace();
  const { t } = useT();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('Ijambo ry’ibanga rishya n’iryo usubiyemo ntibihura.');
      return;
    }
    setBusy(true);
    try {
      await changeAccountPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setNotice('Ijambo ry’ibanga ryahinduwe neza. Izindi sessions zirasohowe.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibyashobotse guhindura ijambo ry’ibanga.');
    } finally {
      setBusy(false);
    }
  };

  const signOutOtherDevices = async () => {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const done = await revokeOtherAccountSessions();
      setNotice(done ? 'Wavuye muri konti ku bindi bikoresho.' : 'Iyi Neon Auth ntishyigikira gusohoka ku bindi bikoresho.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibyashobotse gusohoka ku bindi bikoresho.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setError(null);
    await logout();
  };

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      <header className="rounded-xl border border-[#DCE4DE] bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#0B6E4F]">ISOKO</p>
        <h1 className="mt-1 text-2xl font-bold text-[#1A1F1C]">Konte yanjye</h1>
        <p className="mt-1 text-sm text-[#4B544F]">Reba uko konti yawe ihagaze kandi ucunge umutekano wayo.</p>
      </header>

      {!authSession || !authProfile ? (
        <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
          <p className="text-sm text-[#4B544F]">
            {authSession ? 'Turimo kugenzura konti yawe. Tegereza gato cyangwa wongere ufungure uru rupapuro.' : 'Nta konti irimo kuri iki gikoresho.'}
          </p>
          {!authSession && (
            <button type="button" onClick={() => navigate('/injira')} className="mt-4 min-h-[44px] rounded-lg bg-[#0B6E4F] px-5 text-sm font-semibold text-white">
              {t('login')}
            </button>
          )}
        </section>
      ) : (
        <>
          <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#E8F3EE] text-[#0B6E4F]">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-[#1A1F1C]">{authProfile.full_name || authProfile.email || 'Konti ya Isoko'}</h2>
                <p className="truncate text-sm text-[#4B544F]">{authProfile.email || 'Email ntiyashyizwe kuri iyi konti.'}</p>
              </div>
            </div>
            {(authProfile.role === 'seller' || authProfile.role === 'admin' || authProfile.role === 'moderator') && (
              <button
                type="button"
                onClick={() => navigate(authProfile.role === 'seller' ? '/umucuruzi' : '/admin')}
                className="mt-4 min-h-[48px] w-full rounded-lg bg-[#0B6E4F] px-4 text-sm font-bold text-white"
              >
                {authProfile.role === 'seller' ? 'Fungura iduka ryanjye' : 'Fungura Admin'}
              </button>
            )}
            <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#DCE4DE] p-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#0B6E4F]" />
              <div>
                <p className="text-sm font-semibold text-[#1A1F1C]">Kwemeza email</p>
                <p className="mt-1 text-sm text-[#4B544F]">
                  {authProfile.email_verified ? 'Email yawe yaremejwe.' : 'Email yawe ntiremezwa. Kugeza ubu Isoko ntirashyiraho email verification ku buryo bwo kwiyandikisha.'}
                </p>
              </div>
            </div>
          </section>

          <form onSubmit={changePassword} className="space-y-3 rounded-xl border border-[#DCE4DE] bg-white p-5">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#0B6E4F]" />
              <h2 className="text-base font-bold text-[#1A1F1C]">Hindura ijambo ry’ibanga</h2>
            </div>
            <label className="block text-sm font-semibold text-[#1A1F1C]">
              Ijambo ry’ibanga ririho
              <input required type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-[#C8D2CB] px-3 text-sm" />
            </label>
            <label className="block text-sm font-semibold text-[#1A1F1C]">
              Ijambo ry’ibanga rishya (nibura 8)
              <input required minLength={8} type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-[#C8D2CB] px-3 text-sm" />
            </label>
            <label className="block text-sm font-semibold text-[#1A1F1C]">
              Ongera wandike irishya
              <input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 min-h-[44px] w-full rounded-lg border border-[#C8D2CB] px-3 text-sm" />
            </label>
            <button disabled={busy} type="submit" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#0B6E4F] px-5 text-sm font-semibold text-white disabled:opacity-50">
              <KeyRound className="h-4 w-4" /> Bika ijambo ry’ibanga
            </button>
          </form>

          {supportsOtherAccountSessionRevocation() && (
            <section className="rounded-xl border border-[#DCE4DE] bg-white p-5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-[#0B6E4F]" />
                <h2 className="text-base font-bold text-[#1A1F1C]">Ibindi bikoresho</h2>
              </div>
              <p className="mt-1 text-sm text-[#4B544F]">Sohora konti yawe ku bindi bikoresho, usigarane iki ukoresha ubu.</p>
              <button type="button" disabled={busy} onClick={() => void signOutOtherDevices()} className="mt-3 min-h-[44px] rounded-lg border border-[#0B6E4F] px-4 text-sm font-semibold text-[#0B6E4F] disabled:opacity-50">
                Sohoka ku bindi bikoresho
              </button>
            </section>
          )}

          {notice && <p role="status" className="rounded-lg border border-[#0B6E4F]/20 bg-[#E8F3EE] p-3 text-sm font-semibold text-[#0B6E4F]">{notice}</p>}
          {error && <p role="alert" className="rounded-lg border border-[#C0392B]/25 bg-[#FBEAE8] p-3 text-sm font-semibold text-[#9B2C22]">{error}</p>}

          <section className="rounded-xl border border-[#C0392B]/25 bg-white p-5">
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-[#C0392B]" />
              <h2 className="text-base font-bold text-[#1A1F1C]">Sohoka</h2>
            </div>
            <p className="mt-1 text-sm text-[#4B544F]">Uzasohoka kuri iki gikoresho kandi amakuru ya konti azavanwa muri cache yacyo.</p>
            <button type="button" disabled={busy} onClick={() => void handleLogout()} className="mt-3 inline-flex min-h-[48px] items-center gap-2 rounded-lg bg-[#C0392B] px-5 text-sm font-bold text-white disabled:opacity-50">
              <LogOut className="h-4 w-4" /> Sohoka muri konti
            </button>
          </section>
        </>
      )}
    </main>
  );
};
