import React, { useMemo, useState } from 'react';
import { Camera, CheckCircle2, ShieldCheck, Store, Upload } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { getSectorsForDistrict, RWANDA_DISTRICTS } from '../data/rwandaAreas';
import { registerSellerAccount } from '../lib/api';
import { processProductImage } from '../lib/image';
import { isValidRwandaPhone } from '../lib/whatsapp';

type DocField = 'idFront' | 'idBack' | 'selfie' | 'shopPhoto';

export const SellerApplyPage: React.FC = () => {
  const { navigate, setAuthData } = useMarketplace();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [districtId, setDistrictId] = useState<number>(1);
  const [sectorId, setSectorId] = useState<string>('');
  const [landmark, setLandmark] = useState('');
  const [deliveryText, setDeliveryText] = useState('Dutanga i Kigali mu masaha 2-4');
  const [about, setAbout] = useState('');
  const [businessType, setBusinessType] = useState('Iduka risanzwe');
  const [nationalIdNumber, setNationalIdNumber] = useState('');
  const [tin, setTin] = useState('');
  const [docs, setDocs] = useState<Record<DocField, string>>({
    idFront: '',
    idBack: '',
    selfie: '',
    shopPhoto: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sectors = useMemo(() => getSectorsForDistrict(districtId), [districtId]);

  if (import.meta.env.VITE_ISOKO_PREVIEW === 'true') {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-[#1B1F23]">Gufungura iduka kuri ISOKO</h1>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Urimo kureba urubuga rw’igerageza. Kwiyandikisha kw’abacuruzi n’amafoto y’ibyangombwa bizafungurwa kuri Production imaze guhabwa umutekano wa nyuma. Ntushyire hano nimero y’indangamuntu cyangwa amafoto yawe bwite.
          </p>
          <button type="button" onClick={() => navigate('/')} className="mt-4 min-h-11 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white">Subira ku isoko</button>
        </section>
      </main>
    );
  }

  const handleFileChange = async (field: DocField, file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const processed = await processProductImage(file);
      setDocs((prev) => ({ ...prev, [field]: processed.fullDataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibishobotse gusoma ifoto.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const waValue = sameAsPhone ? phone : whatsapp;
    if (!isValidRwandaPhone(phone)) {
      setError('Nimero ya telefoni igomba kuba iya MTN cyangwa Airtel mu Rwanda (07XXXXXXXX).');
      return;
    }
    if (!isValidRwandaPhone(waValue)) {
      setError('Nimero ya WhatsApp igomba kuba iya MTN cyangwa Airtel mu Rwanda (07XXXXXXXX).');
      return;
    }
    if (password.length < 8) {
      setError('Ijambo ry’ibanga rigomba kugira nibura inyuguti/imibare 8.');
      return;
    }
    if (nationalIdNumber.replace(/\D/g, '').length < 16) {
      setError('Nimero y’indangamuntu yuzuye igomba kugira imibare 16.');
      return;
    }
    if (!docs.idFront || !docs.idBack || !docs.selfie || !docs.shopPhoto) {
      setError('Shyiraho amafoto ane asabwa: imbere y’indangamuntu, inyuma yayo, selfie uyifashe, n’ifoto y’iduka.');
      return;
    }
    if (!termsAccepted) {
      setError('Emeza amategeko n’amabwiriza y’abacuruzi mbere yo kohereza.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await registerSellerAccount({
        fullName: fullName.trim(),
        phone,
        whatsapp: waValue,
        password,
        shopName: shopName.trim(),
        districtId,
        sectorId: sectorId ? Number(sectorId) : null,
        landmark: landmark.trim(),
        deliveryText: deliveryText.trim(),
        about: about.trim(),
        nationalIdNumber: nationalIdNumber.trim(),
        businessType,
        tin: tin.trim() || null,
        idFrontDataUrl: docs.idFront || undefined,
        idBackDataUrl: docs.idBack || undefined,
        selfieDataUrl: docs.selfie || undefined,
        shopPhotoDataUrl: docs.shopPhoto || undefined,
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
      setError(err instanceof Error ? err.message : 'Kwiyandikisha byanze.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 rounded-2xl border border-slate-200 bg-[#F1F6F3] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">
              Kuri abacuruzi b’u Rwanda
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1B1F23] sm:text-3xl">
              Curuza kuri Isoko — Uburyo bworoshye kandi bwizewe
            </h1>
            <p className="mt-2 text-sm text-slate-700">
              Andikisha iduka ryawe mu minota mike. Abaguzi barakuvugisha kuri WhatsApp cyangwa
              baguhamagare, mukishyurana nta kiguzi urubuga rugukata.
            </p>
          </div>
          <a
            href="/injira"
            onClick={(e) => {
              e.preventDefault();
              navigate('/injira');
            }}
            className="inline-flex min-h-[44px] items-center rounded-xl border border-[#0B6E4F] bg-white px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#0B6E4F] hover:text-white"
          >
            Usanzwe ufite konti? Injira
          </a>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          {[
            { title: 'Ubuntu 100%', desc: 'Gufungura iduka no gushyiraho ibicuruzwa ni ubuntu.' },
            { title: 'Amasegonda 60', desc: 'Fata ifoto kuri telefoni ushyireho igicuruzwa vuba.' },
            { title: 'Kuri WhatsApp', desc: 'Abaguzi bohereza ibyo bahisemo birimo size n’aho bari.' },
            { title: 'Abagenzuwe gusa', desc: 'Kugenzura KYC bituma abaguzi bagirira icyizere iduka ryawe.' },
          ].map((b) => (
            <div key={b.title} className="rounded-xl bg-white p-4 border border-slate-200">
              <p className="text-sm font-bold text-[#1B1F23]">{b.title}</p>
              <p className="mt-1 text-xs text-slate-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 space-y-6"
      >
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
          <Store className="h-5 w-5 text-[#0B6E4F]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[#1B1F23]">
            Fishi yo kwiyandikisha no kugenzurwa (KYC)
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reg-fullname" className="block text-sm font-semibold text-[#1B1F23]">
              Amazina yose (nk’uko ari ku ndangamuntu) *
            </label>
            <input
              id="reg-fullname"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Urugero: Mugisha Jean Paul"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-shopname" className="block text-sm font-semibold text-[#1B1F23]">
              Izina ry’iduka *
            </label>
            <input
              id="reg-shopname"
              required
              maxLength={40}
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Urugero: Iduka rya Mugisha"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-sm font-semibold text-[#1B1F23]">
              Nimero ya telefoni (MTN / Airtel) *
            </label>
            <input
              id="reg-phone"
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0788 123 456"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="reg-wa" className="block text-sm font-semibold text-[#1B1F23]">
                Nimero ya WhatsApp *
              </label>
              <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="rounded border-slate-300 text-[#0B6E4F]"
                />
                <span>Ni imwe na telefoni</span>
              </label>
            </div>
            <input
              id="reg-wa"
              type="tel"
              inputMode="tel"
              required
              disabled={sameAsPhone}
              value={sameAsPhone ? phone : whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="0788 123 456"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm disabled:bg-slate-100 focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-pass" className="block text-sm font-semibold text-[#1B1F23]">
              Ijambo ry’ibanga (nibura 8) *
            </label>
            <input
              id="reg-pass"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-btype" className="block text-sm font-semibold text-[#1B1F23]">
              Ubwoko bw’ubucuruzi *
            </label>
            <select
              id="reg-btype"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            >
              <option value="Iduka risanzwe">Iduka risanzwe</option>
              <option value="Isoko rusange / Boutique">Isoko rusange / Boutique</option>
              <option value="Umucuruzi ku giti cye (Online)">Umucuruzi ku giti cye (Online)</option>
              <option value="Sosiyete (RDB)">Sosiyete yanditse muri RDB</option>
            </select>
          </div>

          <div>
            <label htmlFor="reg-district" className="block text-sm font-semibold text-[#1B1F23]">
              Akarere *
            </label>
            <select
              id="reg-district"
              value={districtId}
              onChange={(e) => {
                setDistrictId(Number(e.target.value));
                setSectorId('');
              }}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            >
              {RWANDA_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.district} ({d.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reg-sector" className="block text-sm font-semibold text-[#1B1F23]">
              Umurenge (niba uri i Kigali)
            </label>
            <select
              id="reg-sector"
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              disabled={sectors.length === 0}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm disabled:bg-slate-100 focus:border-[#0B6E4F] focus:outline-none"
            >
              <option value="">{sectors.length ? 'Hitamo umurenge' : 'Ntabwo ugenwe'}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sector}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="reg-landmark" className="block text-sm font-semibold text-[#1B1F23]">
              Aho uherereye (hafi ya...)
            </label>
            <input
              id="reg-landmark"
              maxLength={80}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Urugero: Nyabugogo hafi ya gare, etaje ya 2"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-delivery" className="block text-sm font-semibold text-[#1B1F23]">
              Uko mutanga ibicuruzwa
            </label>
            <input
              id="reg-delivery"
              maxLength={120}
              value={deliveryText}
              onChange={(e) => setDeliveryText(e.target.value)}
              placeholder="Dutanga i Kigali mu masaha 2, intara binyura muri gare"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-nid" className="block text-sm font-semibold text-[#1B1F23]">
              Nimero y’indangamuntu (16) *
            </label>
            <input
              id="reg-nid"
              required
              inputMode="numeric"
              value={nationalIdNumber}
              onChange={(e) => setNationalIdNumber(e.target.value)}
              placeholder="1199080012345678"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="reg-tin" className="block text-sm font-semibold text-[#1B1F23]">
              TIN / RDB (niba uyifite)
            </label>
            <input
              id="reg-tin"
              inputMode="numeric"
              value={tin}
              onChange={(e) => setTin(e.target.value)}
              placeholder="100123456"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="reg-about" className="block text-sm font-semibold text-[#1B1F23]">
            Ibyerekeye iduka ryawe (byibuze mu nteruro 1)
          </label>
          <textarea
            id="reg-about"
            rows={2}
            maxLength={200}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="Urugero: Tucuruza inkweto z’original za siporo n’imyenda mishya i Kigali."
            className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#F1F6F3] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1B1F23]">
            <ShieldCheck className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
            <span>Amafoto y’igenzura (KYC) — abikwa mu ibanga na Admin gusa</span>
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Amafoto yawe akurwaho amakuru ya GPS mbere yo koherezwa kandi ntabwo agaragara ku mugaragaro.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                { key: 'idFront', label: 'Indangamuntu (imbere)' },
                { key: 'idBack', label: 'Indangamuntu (inyuma)' },
                { key: 'selfie', label: 'Selfie ufite indangamuntu' },
                { key: 'shopPhoto', label: 'Ifoto y’iduka / ibicuruzwa (ibikwa mu ibanga)' },
              ] as Array<{ key: DocField; label: string }>
            ).map((item) => (
              <label
                key={item.key}
                className="flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-3 text-center hover:border-[#0B6E4F]"
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => handleFileChange(item.key, e.target.files?.[0])}
                />
                {docs[item.key] ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <img
                      src={docs[item.key]}
                      alt={item.label}
                      className="h-12 w-16 rounded-lg object-cover border border-slate-200"
                    />
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B6E4F]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Byagezeho
                    </span>
                  </div>
                ) : (
                  <>
                    {item.key === 'selfie' ? (
                      <Camera className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    ) : (
                      <Upload className="h-5 w-5 text-slate-400" aria-hidden="true" />
                    )}
                    <span className="mt-1.5 text-xs font-medium text-[#1B1F23]">{item.label}</span>
                    <span className="mt-0.5 text-[11px] text-slate-500">Kanda ushyireho</span>
                  </>
                )}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded border-slate-300 text-[#0B6E4F]"
          />
          <span className="text-xs leading-relaxed text-slate-700">
            Nemeye{' '}
            <a
              href="/amategeko"
              onClick={(e) => {
                e.preventDefault();
                navigate('/amategeko');
              }}
              className="font-semibold text-[#0B6E4F] underline"
            >
              Amategeko
            </a>
            ,{' '}
            <a
              href="/ibanga"
              onClick={(e) => {
                e.preventDefault();
                navigate('/ibanga');
              }}
              className="font-semibold text-[#0B6E4F] underline"
            >
              Politiki y’ibanga
            </a>{' '}
            na{' '}
            <a
              href="/amabwiriza-y-abacuruzi"
              onClick={(e) => {
                e.preventDefault();
                navigate('/amabwiriza-y-abacuruzi');
              }}
              className="font-semibold text-[#0B6E4F] underline"
            >
              Amabwiriza y’abacuruzi
            </a>
            . Ndemeza ko ntazacuruza ibinyuranyije n’amategeko y’u Rwanda cyangwa impimbano
            nkazita original.
          </span>
        </label>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-sm font-medium text-[#C0392B]"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl bg-[#0B6E4F] px-6 text-sm font-semibold text-white transition hover:bg-[#08553D] disabled:opacity-60"
        >
          {submitting ? 'Kohereza ubusabe...' : 'Ohereza ubusabe bwo gucuruza'}
        </button>
      </form>
    </main>
  );
};
