import React from 'react';
import { MessageCircle, ShieldCheck, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useT } from '../context/LangContext';
import { LEGAL_TEXTS } from '../i18n/legal';
import { RW } from '../i18n/rw';
import { buildWhatsAppLink } from '../lib/whatsapp';

export const StaticPage: React.FC = () => {
  const { pathname, navigate, bootstrap } = useMarketplace();
  const { lang } = useT();
  const legal = LEGAL_TEXTS[lang];
  const supportWa = bootstrap?.settings.SUPPORT_WHATSAPP ?? '250788000000';
  const supportHours = bootstrap?.settings.SUPPORT_HOURS ?? '08:00 – 20:00';

  if (pathname === '/ibyerekeye') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#1B1F23]">Ibyerekeye Isoko</h1>
        <p className="text-sm leading-relaxed text-slate-700">
          Isoko ni urubuga rw’ubucuruzi rwo mu Rwanda ruhuza abacuruzi b’imyenda, inkweto,
          amasogisi n’ibindi byo kwambara n’abaguzi mu turere twose 30 tw’igihugu.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-base font-bold text-[#0B6E4F]">Uko ikora ku muguzi</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Shakisha igicuruzwa ukoresheje izina, size cyangwa akarere, ugishyire mu gare,
              maze wohereze urutonde rwawe kuri WhatsApp y’umucuruzi cyangwa umuhamagare.
              Ntibisaba gufungura konti.
            </p>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-base font-bold text-[#0B6E4F]">Icyo urubuga rudakora</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Urubuga ntirwakira amafaranga (nta MoMo cyangwa ikarita iri ku rubuga) kandi
              ntirutanga serivisi yo kugeza ibicuruzwa ku muguzi. Kwishyura no gutanga bikorwa
              hagati y’umuguzi n’umucuruzi.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (pathname === '/ubufasha') {
    const waHref = buildWhatsAppLink(
      supportWa,
      'Muraho Ubufasha bwa Isoko, mfite ikibazo nashakaga kubaza.'
    );
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#1B1F23]">Ubufasha & Ibibazo bikunze kubazwa</h1>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#E8F3EE]/50 p-6">
          <p className="text-sm font-bold text-[#1B1F23]">Vugana natwe kuri WhatsApp</p>
          <p className="mt-1 text-xs text-slate-600">
            Amasaha y’ubufasha buri munsi: {supportHours}
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1A7F43] px-5 text-sm font-semibold text-white hover:bg-[#146635]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{RW.help_whatsapp}</span>
          </a>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Nshobora kwishyurira kuri uru rubuga?',
              a: 'Oya. Uwishyura n’umucuruzi bumvikana uko bishyura (Mobile Money cyangwa amafaranga mu ntoki) bamaze kuvugana kuri WhatsApp cyangwa kuri telefoni.',
            },
            {
              q: 'Mbese mbere yo kwishyura nshobora kubanza kureba igicuruzwa?',
              a: 'Yego, turabigira inama cyane cyane i Kigali. Banza urebe igicuruzwa cyangwa uhure n’umucuruzi ahantu hazwi mbere yo kohereza amafaranga.',
            },
            {
              q: 'Nabona nte iduka ryemewe?',
              a: 'Amaduka yose agaragara ku rubuga yabanje kugenzurwa na Admin (indangamuntu, aho akorera na telefoni) agahabwa ikimenyetso cy’uko yagenzuwe.',
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-sm font-bold text-[#1B1F23]">{faq.q}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (pathname === '/amategeko') {
    return <main className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6"><h1 className="text-2xl font-bold text-[#1A1F1C]">{legal.termsTitle}</h1><p className="rounded-lg border border-[#DCE4DE] bg-white p-3 text-xs font-semibold text-[#0B6E4F]">{legal.notice}</p><ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-[#1A1F1C]">{legal.terms.map((x)=><li key={x}>{x}</li>)}</ol></main>;
  }
  if (pathname === '/ibanga') {
    return <main className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6"><h1 className="text-2xl font-bold text-[#1A1F1C]">{legal.privacyTitle}</h1><p className="rounded-lg border border-[#DCE4DE] bg-white p-3 text-xs font-semibold text-[#0B6E4F]">{legal.notice}</p><ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-[#1A1F1C]">{legal.privacy.map((x)=><li key={x}>{x}</li>)}</ol></main>;
  }
  if (pathname === '/amabwiriza-y-abacuruzi') {
    return <main className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6"><h1 className="text-2xl font-bold text-[#1A1F1C]">{legal.sellerRulesTitle}</h1><p className="rounded-lg border border-[#DCE4DE] bg-white p-3 text-xs font-semibold text-[#0B6E4F]">{legal.notice}</p><section className="space-y-2 rounded-lg border border-[#C0392B]/30 bg-white p-5"><h2 className="font-bold text-[#C0392B]">{legal.sellerRulesTitle}</h2><ul className="list-disc space-y-2 pl-5 text-sm text-[#1A1F1C]">{legal.prohibited.map((x)=><li key={x}>{x}</li>)}</ul></section><section className="rounded-lg border border-[#DCE4DE] bg-white p-5"><h2 className="font-bold text-[#1A1F1C]">{legal.sellerRulesTitle}</h2><ul className="list-disc space-y-2 pl-5 text-sm text-[#1A1F1C]">{legal.agreement.map((x)=><li key={x}>{x}</li>)}</ul></section><button type="button" onClick={()=>navigate('/abacuruzi')} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"><Store className="h-4 w-4" aria-hidden="true" /><span>{lang === 'en' ? 'Register as a seller' : 'Iyandikishe nk’umucuruzi'}</span></button></main>;
  }
  // 404 Fallback
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-[#1B1F23]">Uru rupapuro ntirubonetse (404)</h1>
      <p className="mt-2 text-sm text-slate-600">
        Aho wagiye ntihabaho cyangwa hahinduwe. Subira ku isoko urebe ibicuruzwa biboneka.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-[#0B6E4F] px-6 text-sm font-semibold text-white hover:bg-[#08553D]"
      >
        Subira ahabanza
      </button>
    </main>
  );
};
