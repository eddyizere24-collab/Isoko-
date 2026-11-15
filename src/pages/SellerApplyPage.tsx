import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Mail, MapPin, MessageCircle, Store, User } from 'lucide-react';
import { AuthBrandHeader } from '../components/IsokoLogo';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { RWANDA_DISTRICTS } from '../data/rwandaAreas';
import { registerSellerAccount, updateSellerShop } from '../lib/api';
import { isValidRwandaPhone } from '../lib/whatsapp';

export const SellerApplyPage: React.FC = () => {
  const { navigate, setAuthData } = useMarketplace();
  const { t } = useT();

  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 (~30s): Account credentials
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 (~30s): Shop details + terms
  const [shopName, setShopName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [districtId, setDistrictId] = useState<number>(1);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateStep1 = (): boolean => {
    if (fullName.trim().length > 0 && fullName.trim().length < 2) {
      setError('Amazina wanditse agomba kugira nibura inyuguti 2, cyangwa uyasige ubusa.');
      return false;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email.trim().toLowerCase())) {
      setError('Andika email nyayo, urugero: izina@gmail.com.');
      return false;
    }
    if (password.length < 8) {
      setError("Ijambo ry'ibanga rigomba kugira nibura inyuguti 8.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      handleNextStep();
      return;
    }
    setError(null);

    if (shopName.trim().length < 2) {
      setError("Andika izina ry'iduka ryawe.");
      return;
    }
    if (!isValidRwandaPhone(whatsapp)) {
      setError('Nimero ya WhatsApp igomba kuba iya MTN cyangwa Airtel mu Rwanda (07XXXXXXXX).');
      return;
    }
    if (!termsAccepted) {
      setError("Emeza amategeko n'amabwiriza y'abacuruzi mbere yo gukomeza.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerSellerAccount({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: whatsapp,
        whatsapp,
        password,
        shopName: shopName.trim(),
        districtId,
        termsAccepted: true,
      });

      let finalShop = res.shop;
      if (districtId && res.shop.district_id !== districtId) {
        try {
          const updated = await updateSellerShop({ district_id: districtId });
          finalShop = updated.shop;
        } catch {
          // Best-effort district persistence — must never block instant onboarding
        }
      }

      setAuthData(
        {
          token: res.token,
          userId: res.profile.id,
          role: res.profile.role,
          expiresAt: res.expiresAt,
        },
        res.profile,
        finalShop
      );
      navigate('/umucuruzi');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kwiyandikisha byanze.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-3 py-4 sm:px-6 sm:py-6">
      <AuthBrandHeader
        title={t('onboarding_title')}
        subtitle={t('onboarding_sub')}
      />

      {/* Step Indicator */}
      <div className="mt-4 grid grid-cols-2 gap-2" aria-label="Intambwe zo gufungura iduka">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setStep(1);
          }}
          className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${
            step === 1
              ? 'border-[#214E43] bg-[#E9F0EB] text-[#183B33]'
              : 'border-[#E3E0D8] bg-white text-[#58615C]'
          }`}
        >
          {step === 2 && <CheckCircle2 className="h-4 w-4 text-[#214E43]" aria-hidden="true" />}
          <span>{t('onboarding_step1')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (validateStep1()) setStep(2);
          }}
          className={`flex min-h-[42px] items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${
            step === 2
              ? 'border-[#214E43] bg-[#E9F0EB] text-[#183B33]'
              : 'border-[#E3E0D8] bg-white text-[#68716D]'
          }`}
        >
          <span>{t('onboarding_step2')}</span>
        </button>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSubmit}
        className="mt-3 rounded-lg border border-[#E3E0D8] bg-white p-5 sm:p-6 space-y-4"
      >
        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="reg-fullname" className="block text-[13px] font-semibold text-[#202724]">
                {t('full_name')} (ntibisabwa)
              </label>
              <div className="relative mt-1.5">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68716D]"
                  aria-hidden="true"
                />
                <input
                  id="reg-fullname"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mugisha Jean Paul"
                  className="min-h-[44px] w-full rounded-lg border border-[#E3E0D8] bg-white pl-10 pr-3.5 text-sm text-[#202724] focus:border-[#214E43] focus:outline-none focus:ring-2 focus:ring-[#214E43]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-[13px] font-semibold text-[#202724]">
                {t('email')} *
              </label>
              <div className="relative mt-1.5">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68716D]"
                  aria-hidden="true"
                />
                <input
                  id="reg-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="izina@gmail.com"
                  className="min-h-[44px] w-full rounded-lg border border-[#E3E0D8] bg-white pl-10 pr-3.5 text-sm text-[#202724] focus:border-[#214E43] focus:outline-none focus:ring-2 focus:ring-[#214E43]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-pass" className="block text-[13px] font-semibold text-[#202724]">
                {t('password')} (nibura 8) *
              </label>
              <div className="relative mt-1.5">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68716D]"
                  aria-hidden="true"
                />
                <input
                  id="reg-pass"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nibura inyuguti cyangwa imibare 8"
                  className="min-h-[44px] w-full rounded-lg border border-[#E3E0D8] bg-white pl-10 pr-3.5 text-sm text-[#202724] focus:border-[#214E43] focus:outline-none focus:ring-2 focus:ring-[#214E43]/20"
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-[#BD594A]/30 bg-[#FAF0ED] px-4 py-3 text-sm font-medium text-[#BD594A]"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#214E43] px-5 text-sm font-semibold text-white transition hover:bg-[#183B33]"
            >
              <span>{t('continue_btn')}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="reg-shopname" className="block text-[13px] font-semibold text-[#202724]">
                {t('shop_name')} *
              </label>
              <div className="relative mt-1.5">
                <Store
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68716D]"
                  aria-hidden="true"
                />
                <input
                  id="reg-shopname"
                  type="text"
                  required
                  minLength={2}
                  maxLength={40}
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="Iduka rya Mugisha"
                  className="min-h-[44px] w-full rounded-lg border border-[#E3E0D8] bg-white pl-10 pr-3.5 text-sm text-[#202724] focus:border-[#214E43] focus:outline-none focus:ring-2 focus:ring-[#214E43]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-wa" className="block text-[13px] font-semibold text-[#202724]">
                {t('whatsapp_number')} *
              </label>
              <div className="relative mt-1.5">
                <MessageCircle
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A7F43]"
                  aria-hidden="true"
                />
                <input
                  id="reg-wa"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="0788 123 456"
                  className="min-h-[44px] w-full rounded-lg border border-[#E3E0D8] bg-white pl-10 pr-3.5 text-sm text-[#202724] tabular-nums focus:border-[#214E43] focus:outline-none focus:ring-2 focus:ring-[#214E43]/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-district" className="block text-[13px] font-semibold text-[#202724]">
                {t('district')} *
              </label>
              <div className="relative mt-1.5">
                <MapPin
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#68716D]"
                  aria-hidden="true"
                />
                <select
                  id="reg-district"
                  value={districtId}
                  onChange={(e) => setDistrictId(Number(e.target.value))}
                  className="min-h-[44px] w-full rounded-lg border border-[#E3E0D8] bg-white pl-10 pr-3.5 text-sm text-[#202724] focus:border-[#214E43] focus:outline-none focus:ring-2 focus:ring-[#214E43]/20"
                >
                  {RWANDA_DISTRICTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.district} ({d.province})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-lg border border-[#E3E0D8] bg-[#F7F5F0] p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 accent-[#214E43]"
              />
              <span className="text-xs leading-relaxed text-[#58615C]">
                {t('onboarding_terms_prefix')}{' '}
                <a
                  href="/amategeko"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/amategeko');
                  }}
                  className="font-semibold text-[#214E43] underline"
                >
                  {t('terms')}
                </a>
                ,{' '}
                <a
                  href="/ibanga"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/ibanga');
                  }}
                  className="font-semibold text-[#214E43] underline"
                >
                  {t('privacy')}
                </a>{' '}
                na{' '}
                <a
                  href="/amabwiriza-y-abacuruzi"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/amabwiriza-y-abacuruzi');
                  }}
                  className="font-semibold text-[#214E43] underline"
                >
                  {t('seller_rules')}
                </a>
                .
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-[#BD594A]/30 bg-[#FAF0ED] px-4 py-3 text-sm font-medium text-[#BD594A]"
              >
                {error}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="inline-flex min-h-[46px] items-center justify-center gap-1.5 rounded-lg border border-[#E3E0D8] bg-white px-4 text-sm font-semibold text-[#202724] hover:bg-[#F7F5F0]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>{t('back')}</span>
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-lg bg-[#214E43] px-5 text-sm font-semibold text-white transition hover:bg-[#183B33] disabled:opacity-60"
              >
                <span>{submitting ? '...' : t('onboarding_submit')}</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E3E0D8] pt-4 text-[13px]">
          <span className="text-[#58615C]">{t('already_have_account')}</span>
          <a
            href="/injira"
            onClick={(e) => {
              e.preventDefault();
              navigate('/injira');
            }}
            className="font-semibold text-[#214E43] hover:underline"
          >
            {t('login')} →
          </a>
        </div>
      </form>
    </main>
  );
};
