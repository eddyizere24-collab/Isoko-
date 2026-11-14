import React, { useEffect, useState } from 'react';
import { useMarketplace } from '../context/MarketplaceContext';
import { fetchMe } from '../lib/api';
import { getNeonJwt } from '../lib/neon';
import { saveAuthSession, type StoredAuthSession } from '../lib/storage';

export const SellerAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { navigate, setAuthData } = useMarketplace();
  const [state, setState] = useState<'checking' | 'ready' | 'retry'>('checking');
  const [message, setMessage] = useState('');

  const verify = async () => {
    setState('checking');
    setMessage('');
    try {
      await getNeonJwt();
    } catch {
      saveAuthSession(null);
      setAuthData(null, null, null);
      navigate('/injira?reason=session');
      return;
    }

    try {
      const result = await fetchMe();
      if (result.profile.role !== 'seller' || !result.shop) {
        setState('retry');
        setMessage('Konti yawe ntirafungura iduka. Fungura iduka mbere yo kongeramo ibicuruzwa.');
        return;
      }
      const session: StoredAuthSession = {
        token: 'managed-neon-auth',
        userId: result.profile.id,
        role: result.profile.role,
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      };
      setAuthData(session, result.profile, result.shop);
      setState('ready');
    } catch {
      setState('retry');
      setMessage('Ntibyashobotse kugenzura konti yawe. Reba internet wongere ugerageze.');
    }
  };

  useEffect(() => {
    void verify();
    // The guard validates once whenever a protected seller route is entered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'ready') return <>{children}</>;

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        {state === 'checking' ? (
          <>
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#0B6E4F]/20 border-t-[#0B6E4F]" />
            <h1 className="mt-4 text-lg font-bold text-[#1B1F23]">Turimo kugenzura konti yawe</h1>
            <p className="mt-2 text-sm text-slate-600">Tegereza gato mbere yo gucunga iduka.</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-bold text-[#1B1F23]">Konti ntiyagenzuwe</h1>
            <p role="alert" className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
            <button type="button" onClick={() => void verify()} className="mt-5 min-h-11 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white">Ongera ugerageze</button>
            <button type="button" onClick={() => navigate('/abacuruzi')} className="ml-2 mt-5 min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-semibold text-[#1B1F23]">Fungura iduka</button>
          </>
        )}
      </section>
    </main>
  );
};
