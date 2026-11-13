import React from 'react';
import { MessageCircle, ShieldCheck, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { buildWhatsAppLink } from '../lib/whatsapp';

export const StaticPage: React.FC = () => {
  const { pathname, navigate, bootstrap } = useMarketplace();
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-[#0B6E4F]">Uko ikora ku muguzi</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Shakisha igicuruzwa ukoresheje izina, size cyangwa akarere, ugishyire mu gare,
              maze wohereze urutonde rwawe kuri WhatsApp y’umucuruzi cyangwa umuhamagare.
              Ntibisaba gufungura konti.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
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
        <div className="rounded-2xl border border-[#25D366]/40 bg-[#F1F6F3] p-6">
          <p className="text-sm font-bold text-[#1B1F23]">Vugana natwe kuri WhatsApp</p>
          <p className="mt-1 text-xs text-slate-600">
            Amasaha y’ubufasha buri munsi: {supportHours}
          </p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-semibold text-white hover:bg-[#1FB857]"
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
            <div key={faq.q} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-bold text-[#1B1F23]">{faq.q}</p>
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
        <h1 className="text-2xl font-bold text-[#1B1F23]">Amategeko y’Urubuga (Terms of Service)</h1>
        <p className="text-xs text-slate-500">Verisiyo: v1 · Urubuga rw’ubucuruzi rwa Isoko (Rwanda)</p>
        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          <p>
            1. <strong>Uruhare rw’Urubuga:</strong> Isoko ni urubuga ruhuza abacuruzi bemejwe
            n’abaguzi. Urubuga ntirugurisha ibicuruzwa byarwo, ntirwakira ubwishyu, kandi ntirutanga
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
        <div className="flex items-center gap-2 text-[#0B6E4F]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#1B1F23]">
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
            <strong>2. Ibyangombwa by’Abacuruzi (KYC):</strong> Indangamuntu n’amafoto yo kugenzura
            abacuruzi bibikwa ahantu harinzwe, bikarebwa n’Ubuyobozi (Admin) gusa kandi buri gihe
            bikandikwa muri Audit Log. Amafoto yose akurwaho amakuru ya GPS (EXIF) mbere yo
            kubikwa.
          </p>
          <p>
            <strong>3. Uburenganzira bwawe (Itegeko N° 058/2021):</strong> Ufite uburenganzira bwo
            kubona, gukosora cyangwa gusaba ko amakuru yawe asibwa. Mu gihe habaho ikibazo ku
            mutekano w’amakuru, ubuyobozi bumenyesha inzego zibishinzwe (NCSA) n’abo bireba mu
            masaha atarenze 48.
          </p>
          <p>
            <strong>DPO / Ubufasha ku mabanga:</strong> Twandikire kuri WhatsApp y’ubufasha cyangwa
            imeri ya <span className="font-semibold">privacy@isoko.rw</span>.
          </p>
        </div>
      </main>
    );
  }

  if (pathname === '/amabwiriza-y-abacuruzi') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#1B1F23]">
          Amabwiriza y’Abacuruzi & Ibicuruzwa Bibujijwe
        </h1>
        <div className="rounded-2xl border border-[#C0392B]/30 bg-[#C0392B]/5 p-5 text-sm text-slate-700 space-y-2">
          <p className="font-bold text-[#C0392B]">Ibicuruzwa bibujijwe burundu (§10.5):</p>
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
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
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
