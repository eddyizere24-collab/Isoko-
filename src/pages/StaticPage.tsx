import React from 'react';
import { MessageCircle, ShieldCheck, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { buildWhatsAppLink } from '../lib/whatsapp';

export const StaticPage: React.FC = () => {
  const { pathname, navigate, bootstrap } = useMarketplace();
  const supportWa = (bootstrap?.settings.SUPPORT_WHATSAPP ?? '').trim();
  const supportHours = (bootstrap?.settings.SUPPORT_HOURS ?? '').trim();

  if (pathname === '/ibyerekeye') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#202724]">Ibyerekeye Isoko</h1>
        <p className="text-sm leading-relaxed text-slate-700">
          Isoko ni urubuga rw’ubucuruzi rwo mu Rwanda ruhuza abacuruzi b’imyenda, inkweto,
          amasogisi n’ibindi byo kwambara n’abaguzi bo mu Rwanda.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#E3E0D8] bg-white p-5">
            <h2 className="text-base font-bold text-[#214E43]">Uko ikora ku muguzi</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Shakisha igicuruzwa ukoresheje izina, size cyangwa akarere, ugishyire mu gare,
              maze wohereze urutonde rwawe kuri WhatsApp y’umucuruzi cyangwa umuhamagare.
              Ntibisaba gufungura konti.
            </p>
          </div>
          <div className="rounded-lg border border-[#E3E0D8] bg-white p-5">
            <h2 className="text-base font-bold text-[#214E43]">Icyo urubuga rudakora</h2>
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
    const waHref = supportWa
      ? buildWhatsAppLink(
          supportWa,
          'Muraho Ubufasha bwa Isoko, mfite ikibazo nashakaga kubaza.'
        )
      : null;
    return (
      <main className="mx-auto max-w-3xl px-3 py-8 sm:px-6 space-y-5">
        <h1 className="text-lg font-semibold text-[#202724] sm:text-xl">Ubufasha & Ibibazo bikunze kubazwa</h1>
        <div className="rounded-xl border border-[#E3E0D8] bg-[#FFFEFB] p-5">
          {waHref ? (
            <>
              <p className="text-sm font-semibold text-[#202724]">Vugana natwe kuri WhatsApp</p>
              {supportHours && (
                <p className="mt-1 text-[11px] text-[#68716D]">
                  Amasaha y’ubufasha: {supportHours}
                </p>
              )}
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#214E43] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#183B33]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>{RW.help_whatsapp}</span>
              </a>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-[#202724]">Ubufasha bwa WhatsApp burimo gutegurwa.</p>
              <p className="mt-1 max-w-xl text-[11px] leading-relaxed text-[#68716D]">
                Uburyo bwemejwe bwo kuvugana n’itsinda rya Isoko buzatangazwa hano nibumara gushyirwaho.
              </p>
            </>
          )}
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
              a: 'Amaduka mashya ashobora kugaragara ataragenzurwa. Reba status yanditse ku iduka: ikimenyetso cya “Verified” gitangwa gusa nyuma y’uko Admin arigenzuye koko; “Ritaragenzurwa” bivuze ko igenzura ritarakorwa.',
            },
          ].map((faq) => (
            <div key={faq.q} className="rounded-lg border border-[#E3E0D8] bg-white p-4">
              <p className="text-sm font-bold text-[#202724]">{faq.q}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (pathname === '/amategeko') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#202724]">Amategeko y’Urubuga (Terms of Service)</h1>
        <p className="text-xs text-slate-500">Verisiyo: v1 · Urubuga rw’ubucuruzi rwa Isoko (Rwanda)</p>
        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            1. <strong>Uruhare rw’Urubuga:</strong> Isoko ni urubuga ruhuza abaguzi n’abacuruzi. Urubuga ntirugurisha ibicuruzwa byarwo, ntirwakira ubwishyu, kandi ntirutanga
            serivisi yo gutwara ibicuruzwa.
          </p>
          <p>
            2. <strong>Inshingano z’Umucuruzi:</strong> Umucuruzi agomba gutanga amakuru y’ukuri,
            igiciro nyacyo mu mafaranga y’u Rwanda (RWF), n’amafoto y’igicuruzwa afite koko.
          </p>
          <p>
            3. <strong>Guhagarika konti:</strong> Uburiganya, kugurisha impimbano nka Original,
            cyangwa gukoresha ibicuruzwa bibujijwe bivamo guhagarikwa burundu no gushyikirizwa
            inzego zibishinzwe bibaye ngombwa.
          </p>
        </div>
      </main>
    );
  }

  if (pathname === '/ibanga') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
        <div className="flex items-center gap-2 text-[#214E43]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#202724]">
            Politiki y’Ibanga (Privacy Policy — Itegeko N° 058/2021)
          </h1>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            <strong>1. Abaguzi (ntibakenera konti):</strong> Amakuru y’igare ryawe, ibicuruzwa
            waherukaga kureba, size yawe n’aho uherereye bibikwa muri{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">localStorage</code> ya
            telefoni cyangwa mudasobwa yawe gusa. Ntibibikwa ku mazina yawe.
          </p>
          <p>
            <strong>2. Igenzura ry’abacuruzi:</strong> Kwiyandikisha kw’ibanze ntigusaba
            indangamuntu, TIN, selfie cyangwa amafoto y’ibyangombwa. Igenzura ry’irangamuntu
            rizakorwa gusa mu gihe uburyo bwaryo bwemejwe kandi rikazasobanurirwa umucuruzi
            mbere yo gusaba amakuru ayo ari yo yose. Ntutwohereze ibyangombwa by’ibanga kuri WhatsApp.
          </p>
          <p>
            <strong>3. Uburenganzira bwawe:</strong> Ushobora gusaba kureba, gukosora cyangwa
            gusiba amakuru yawe hakurikijwe amategeko akurikizwa mu Rwanda. Isoko izasobanura
            uburyo bwo gutanga no gukurikirana ubusabe mu nzira zayo zemejwe.
          </p>
          <p>
            <strong>Ibibazo ku mabanga:</strong> Uburyo bwo kuvugana n’ushinzwe ubuzima bwite
            buzashyirwa hano igihe contact yemejwe izaba yashyizweho.
          </p>
        </div>
      </main>
    );
  }

  if (pathname === '/amabwiriza-y-abacuruzi') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#202724]">
          Amabwiriza y’Abacuruzi & Ibicuruzwa Bibujijwe
        </h1>
        <div className="rounded-lg border border-[#BD594A]/30 bg-[#BD594A]/5 p-5 text-sm text-slate-700 space-y-2">
          <p className="font-bold text-[#BD594A]">Ibicuruzwa bibujijwe burundu (§10.5):</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>Impimbano zigurishwa nka “Original” cyangwa “Authentic”.</li>
            <li>Imiti n’ibindi bikoresho byo kwa muganga bisaba uruhushya rwa Rwanda FDA.</li>
            <li>Intwaro, ibiyobyabwenge, amafaranga y’amiganano cyangwa ibikoresho byibwe.</li>
            <li>Ibikoresho by’urukozasoni cyangwa ibinyuranyije n’amategeko y’u Rwanda.</li>
            <li>Amafoto afite nimero ya telefoni yanditseho cyangwa amafoto yakuwe ahandi atari ayawe.</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={() => navigate('/abacuruzi')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#214E43] px-5 text-sm font-semibold text-white"
        >
          <Store className="h-4 w-4" aria-hidden="true" />
          <span>Iyandikishe nk’umucuruzi</span>
        </button>
      </main>
    );
  }

  // 404 Fallback
  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-[#202724]">Uru rupapuro ntirubonetse (404)</h1>
      <p className="mt-2 text-sm text-slate-600">
        Aho wagiye ntihabaho cyangwa hahinduwe. Subira ku isoko urebe ibicuruzwa biboneka.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-[#214E43] px-6 text-sm font-semibold text-white hover:bg-[#183B33]"
      >
        Subira ahabanza
      </button>
    </main>
  );
};
