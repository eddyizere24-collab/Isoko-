import React, { useState } from 'react';
import { KeyRound, Lock, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { claimFirstAdminAccount } from '../lib/api';

export const AdminSetupPage: React.FC = () => {
  const { navigate, setAuthData } = useMarketplace();
  const [fullName,setFullName]=useState('');
  const [phone,setPhone]=useState('');
  const [password,setPassword]=useState('');
  const [code,setCode]=useState('');
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);

  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();
    setError(null);
    setBusy(true);
    try{
      const result=await claimFirstAdminAccount({fullName,phone,password,bootstrapCode:code});
      setAuthData(
        {token:result.token,userId:result.userId,role:result.role,expiresAt:result.expiresAt},
        result.profile,
        null
      );
      navigate('/admin');
    }catch(err){
      setError(err instanceof Error?err.message:'Gushyiraho Admin wa mbere byanze.');
    }finally{
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F1F6F3] text-[#0B6E4F]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1B1F23]">Gutangiza Admin wa mbere</h1>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Iyi nzira ikoreshwa rimwe gusa mu gutangiza ubuyobozi bwa Isoko. Code yemewe izakoreshwa rimwe, igahita isibwa.
            </p>
          </div>
        </div>
        <form onSubmit={(e)=>void submit(e)} className="space-y-4">
          <div>
            <label htmlFor="admin-fullname" className="block text-sm font-semibold text-[#1B1F23]">Amazina yuzuye</label>
            <div className="relative mt-1.5">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/>
              <input id="admin-fullname" required minLength={2} maxLength={100} value={fullName}
                onChange={e=>setFullName(e.target.value)} autoComplete="name"
                className="min-h-[46px] w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none"/>
            </div>
          </div>
          <div>
            <label htmlFor="admin-phone" className="block text-sm font-semibold text-[#1B1F23]">Nimero ya telefoni</label>
            <div className="relative mt-1.5">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/>
              <input id="admin-phone" required type="tel" inputMode="tel" autoComplete="tel" value={phone}
                onChange={e=>setPhone(e.target.value)} placeholder="0788 123 456"
                className="min-h-[46px] w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none"/>
            </div>
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm font-semibold text-[#1B1F23]">Ijambo ry’ibanga</label>
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/>
              <input id="admin-password" required type="password" minLength={12} autoComplete="new-password" value={password}
                onChange={e=>setPassword(e.target.value)} placeholder="Nibura inyuguti 12"
                className="min-h-[46px] w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm focus:border-[#0B6E4F] focus:outline-none"/>
            </div>
          </div>
          <div>
            <label htmlFor="admin-code" className="block text-sm font-semibold text-[#1B1F23]">One-time Admin setup code</label>
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true"/>
              <input id="admin-code" required type="password" autoComplete="off" spellCheck={false} value={code}
                onChange={e=>setCode(e.target.value)} placeholder="Shyiramo code wahawe"
                className="min-h-[46px] w-full rounded-xl border border-slate-300 pl-10 pr-4 text-sm font-mono focus:border-[#0B6E4F] focus:outline-none"/>
            </div>
          </div>
          {error && <div role="alert" className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-sm font-medium text-[#C0392B]">{error}</div>}
          <button type="submit" disabled={busy}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D] disabled:opacity-60">
            <ShieldCheck className="h-4 w-4" aria-hidden="true"/>
            {busy?'Tegereza...':'Emeza Admin wa mbere'}
          </button>
        </form>
        <p className="mt-5 rounded-xl bg-[#F1F6F3] p-3 text-xs leading-5 text-slate-600">
          Gushyiraho Admin wa mbere ni igikorwa cya one-time. Nyuma yo gutsinda, code irasibwa muri private secrets kandi nta wundi muntu ushobora kongera kwiyandikisha nka Admin akoresheje iyo code.
        </p>
      </section>
    </main>
  );
};
