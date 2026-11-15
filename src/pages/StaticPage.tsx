import React from 'react';
import { MessageCircle, ShieldCheck, Store } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { useT } from '../context/LangContext';
import { STATIC_PAGE_COPY } from '../i18n/staticPages';
import { buildWhatsAppLink } from '../lib/whatsapp';

export const StaticPage: React.FC = () => {
  const { pathname, navigate, bootstrap } = useMarketplace();
  const { lang, t } = useT();
  const copy = STATIC_PAGE_COPY[lang] ?? STATIC_PAGE_COPY.rw;
  const supportWa = bootstrap?.settings.SUPPORT_WHATSAPP ?? '250788000000';
  const supportHours = bootstrap?.settings.SUPPORT_HOURS ?? '08:00 – 20:00';

  if (pathname === '/ibyerekeye') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#1B1F23]">{copy.about.title}</h1>
        <p className="text-sm leading-relaxed text-slate-700">{copy.about.intro}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-base font-bold text-[#0B6E4F]">{copy.about.buyerTitle}</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{copy.about.buyerBody}</p>
          </div>
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-5">
            <h2 className="text-base font-bold text-[#0B6E4F]">{copy.about.platformTitle}</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">{copy.about.platformBody}</p>
          </div>
        </div>
      </main>
    );
  }

  if (pathname === '/ubufasha') {
    const waHref = buildWhatsAppLink(supportWa, copy.help.whatsappMessage);
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-6">
        <h1 className="text-2xl font-bold text-[#1B1F23]">{copy.help.title}</h1>
        <div className="rounded-lg border border-[#E5E7EB] bg-[#E8F3EE]/50 p-6">
          <p className="text-sm font-bold text-[#1B1F23]">{copy.help.whatsappTitle}</p>
          <p className="mt-1 text-xs text-slate-600">{copy.help.hoursPrefix} {supportHours}</p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1A7F43] px-5 text-sm font-semibold text-white hover:bg-[#146635]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>{t('help_whatsapp')}</span>
          </a>
        </div>

        <div className="space-y-3">
          {copy.help.faqs.map((faq) => (
            <div key={faq.question} className="rounded-lg border border-[#E5E7EB] bg-white p-4">
              <p className="text-sm font-bold text-[#1B1F23]">{faq.question}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (pathname === '/amategeko') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#1B1F23]">{copy.terms.title}</h1>
        <p className="text-xs text-slate-500">{copy.terms.version}</p>
        <p className="rounded-md bg-[#F7F8FA] px-3 py-2 text-xs leading-relaxed text-[#4B544F]">{copy.terms.sourceNote}</p>
        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          {copy.terms.points.map((point, index) => (
            <p key={point.heading}>
              {index + 1}. <strong>{point.heading}:</strong> {point.body}
            </p>
          ))}
        </div>
      </main>
    );
  }

  if (pathname === '/ibanga') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
        <div className="flex items-center gap-2 text-[#0B6E4F]">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#1B1F23]">{copy.privacy.title}</h1>
        </div>
        <p className="rounded-md bg-[#F7F8FA] px-3 py-2 text-xs leading-relaxed text-[#4B544F]">{copy.privacy.sourceNote}</p>
        <div className="space-y-4 text-sm leading-relaxed text-slate-700">
          {copy.privacy.sections.map((section, index) => (
            <p key={section.heading}>
              <strong>{index + 1}. {section.heading}:</strong> {section.body}
            </p>
          ))}
          <p>
            <strong>{copy.privacy.contactHeading}:</strong> {copy.privacy.contactBody}
          </p>
        </div>
      </main>
    );
  }

  if (pathname === '/amabwiriza-y-abacuruzi') {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 space-y-5">
        <h1 className="text-2xl font-bold text-[#1B1F23]">{copy.sellerRules.title}</h1>
        <p className="rounded-md bg-[#F7F8FA] px-3 py-2 text-xs leading-relaxed text-[#4B544F]">
          {copy.terms.sourceNote}
        </p>
        <div className="rounded-lg border border-[#C0392B]/30 bg-[#C0392B]/5 p-5 text-sm text-slate-700 space-y-2">
          <p className="font-bold text-[#C0392B]">{copy.sellerRules.prohibitedTitle}</p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            {copy.sellerRules.prohibitedItems.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => navigate('/abacuruzi')}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
        >
          <Store className="h-4 w-4" aria-hidden="true" />
          <span>{copy.sellerRules.signup}</span>
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-[#1B1F23]">{copy.notFound.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{copy.notFound.body}</p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-[#0B6E4F] px-6 text-sm font-semibold text-white hover:bg-[#08553D]"
      >
        {copy.notFound.home}
      </button>
    </main>
  );
};
