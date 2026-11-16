import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, Copy, ImagePlus, MessageCircle, QrCode, Save, ShieldCheck } from 'lucide-react';
import { QrCodeModal } from '../components/QrCodeModal';
import { SafeImage } from '../components/SafeImage';
import { useT } from '../context/LangContext';
import { useMarketplace } from '../context/MarketplaceContext';
import { getSectorsForDistrict, RWANDA_DISTRICTS } from '../data/rwandaAreas';
import { RW } from '../i18n/rw';
import { fetchSellerOverview, updateSellerProfile, updateSellerShop, uploadImagePair } from '../lib/api';
import { processProductImage } from '../lib/image';
import { calculateProfileCompletion } from '../lib/profileCompletion';
import { buildWhatsAppLink } from '../lib/whatsapp';
import type { Profile, Shop } from '../types/marketplace';

export const SellerShopSettingsPage: React.FC = () => {
  const { navigate, authSession, refreshBootstrap } = useMarketplace();
  const { t } = useT();
  const [profileMeta, setProfileMeta] = useState<Pick<Profile, 'full_name' | 'avatar_path' | 'bio' | 'identity_status'> | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [districtId, setDistrictId] = useState<number>(1);
  const [sectorId, setSectorId] = useState<string>('');
  const [landmark, setLandmark] = useState('');
  const [hoursText, setHoursText] = useState('');
  const [deliveryText, setDeliveryText] = useState('');
  const [fullName, setFullName] = useState('');
  const [profileBio, setProfileBio] = useState('');
  const [avatarPath, setAvatarPath] = useState('');
  const [logoPath, setLogoPath] = useState('');
  const [coverPath, setCoverPath] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string,string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [verifiedRequested, setVerifiedRequested] = useState(false);

  useEffect(() => {
    if (!authSession) {
      navigate('/injira');
      return;
    }
    fetchSellerOverview()
      .then((res) => {
        setProfileMeta(res.profile);
        setShop(res.shop);
        setName(res.shop.name);
        setAbout(res.shop.about);
        setWhatsapp(res.shop.whatsapp);
        setPhone(res.shop.phone);
        setDistrictId(res.shop.district_id);
        setSectorId(res.shop.sector_id ? String(res.shop.sector_id) : '');
        setLandmark(res.shop.landmark);
        setHoursText(res.shop.hours_text);
        setDeliveryText(res.shop.delivery_text);
        setFullName(res.profile.full_name ?? '');
        setProfileBio(res.profile.bio ?? '');
        setAvatarPath(res.profile.avatar_path ?? '');
        setLogoPath(res.shop.logo_path ?? '');
        setCoverPath(res.shop.cover_path ?? '');
        setSocialLinks(res.shop.social_links ?? {});
        try {
          if (localStorage.getItem(`isoko.verified_req.${res.shop.id}`) === '1') {
            setVerifiedRequested(true);
          }
        } catch {
          // ignore
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ikibazo mu gufungura iduka.'))
      .finally(() => setLoading(false));
  }, [authSession, navigate]);

  const sectors = useMemo(() => getSectorsForDistrict(districtId), [districtId]);

  const uploadBrandImage = async (file: File | undefined, kind: 'shop' | 'profile' | 'logo', setter: (value:string)=>void) => {
    if (!file) return;
    setError(null);
    setSavedMsg(null);
    setUploading(kind);
    try {
      const image = await processProductImage(file);
      const uploaded = await uploadImagePair(image.fullDataUrl, kind);
      if (kind === 'profile') {
        const saved = await updateSellerProfile({ fullName, bio: profileBio, avatarPath: uploaded.url });
        setProfileMeta((current) => current ? { ...current, ...saved.profile } : current);
      } else {
        const saved = await updateSellerShop({
          name,
          logoPath: kind === 'logo' ? uploaded.url : logoPath,
          coverPath: kind === 'shop' ? uploaded.url : coverPath,
          socialLinks, about, whatsapp, phone, district_id: districtId,
          sector_id: sectorId ? Number(sectorId) : null, landmark,
          hours_text: hoursText, delivery_text: deliveryText,
        });
        setShop(saved.shop);
      }
      setter(uploaded.url);
      setSavedMsg('Ifoto yabitswe neza ✓');
      await refreshBootstrap();
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message === 'UPLOAD_DAILY_QUOTA_EXCEEDED'
        ? 'Wageze ku mubare ntarengwa w’amafoto 30 ku munsi. Ongera ugerageze ejo.'
        : message || 'Ifoto ntiyoherejwe cyangwa ngo ibikwe. Ongera ugerageze.');
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);
    setSaving(true);
    try {
      await updateSellerProfile({ fullName, bio: profileBio, avatarPath });
      const res = await updateSellerShop({
        name,
        logoPath,
        coverPath,
        socialLinks,
        about,
        whatsapp,
        phone,
        district_id: districtId,
        sector_id: sectorId ? Number(sectorId) : null,
        landmark,
        hours_text: hoursText,
        delivery_text: deliveryText,
      });
      setShop(res.shop);
      setSavedMsg('Amakuru y’iduka yabitswe neza.');
      refreshBootstrap();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kubika byanze.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-48 animate-pulse rounded-lg bg-[#E9F0EB]" />
      </main>
    );
  }

  const testWaHref = buildWhatsAppLink(
    whatsapp,
    `Muraho ${name}, ndi kugerageza link ya WhatsApp y'iduka ryanjye ku Isoko.`
  );
  const shopUrl = shop ? `${window.location.origin}/s/${shop.slug}` : window.location.origin;
  const completion = calculateProfileCompletion(
    { ...profileMeta, full_name: fullName, avatar_path: avatarPath, bio: profileBio },
    shop
      ? {
          ...shop,
          name,
          logo_path: logoPath,
          cover_path: coverPath,
          about,
          hours_text: hoursText,
          delivery_text: deliveryText,
        }
      : null
  );

  const handleRequestVerified = () => {
    if (shop) {
      try {
        localStorage.setItem(`isoko.verified_req.${shop.id}`, '1');
      } catch {
        // ignore
      }
    }
    setVerifiedRequested(true);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3E0D8] pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/umucuruzi')}
            aria-label={t('back')}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#E3E0D8] hover:bg-[#E9F0EB]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#202724]">Amakuru y’iduka</h1>
            <p className="text-xs text-[#68716D]">
              Vugurura nimero ya WhatsApp, aho uherereye n’amasaha yo gukora
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(shopUrl);
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 2000);
              } catch {
                // ignore
              }
            }}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#E3E0D8] bg-white px-3.5 text-xs font-semibold text-[#202724] hover:bg-[#E9F0EB]"
          >
            <Copy className="h-4 w-4 text-[#214E43]" aria-hidden="true" />
            <span>{copiedUrl ? t('copied') : t('copy_link')}</span>
          </button>
          <a
            href={testWaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-lg bg-[#1A7F43] px-4 text-xs font-semibold text-white hover:bg-[#146635]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Gerageza WhatsApp</span>
          </a>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-[#E3E0D8] bg-white px-3.5 text-xs font-semibold text-[#202724] hover:bg-[#E9F0EB]"
          >
            <QrCode className="h-4 w-4 text-[#214E43]" aria-hidden="true" />
            <span>QR y’iduka</span>
          </button>
        </div>
      </div>

      {/* Live Profile Completion Bar & Optional Verified Badge Request */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E3E0D8] bg-white p-4">
          <div className="flex items-center justify-between text-xs font-semibold text-[#202724]">
            <span>{t('profile_completion', { n: completion.percent })}</span>
            <span className="tabular-nums text-[#214E43]">
              {completion.completedCount}/{completion.totalCount}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E3E0D8]">
            <div
              className="h-full rounded-full bg-[#214E43] transition-all duration-300"
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E3E0D8] bg-white p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#202724]">
              <ShieldCheck className="h-4 w-4 text-[#214E43]" aria-hidden="true" />
              <span>
                {profileMeta?.identity_status === 'verified' ? t('verified') : t('unverified')}
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-[#68716D]">
              {profileMeta?.identity_status === 'verified'
                ? 'Iduka ryawe rifite ikimenyetso cya Verified.'
                : 'Kugenzurwa si itegeko, ariko byongerera icyizere abaguzi.'}
            </p>
          </div>
          {profileMeta?.identity_status !== 'verified' && (
            <button
              type="button"
              disabled={verifiedRequested}
              onClick={handleRequestVerified}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                verifiedRequested
                  ? 'bg-[#E9F0EB] text-[#183B33]'
                  : 'border border-[#214E43] text-[#214E43] hover:bg-[#E9F0EB]'
              }`}
            >
              {verifiedRequested ? t('verified_requested') : t('request_verified')}
            </button>
          )}
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="mt-5 rounded-lg border border-[#E3E0D8] bg-white p-6 space-y-4"
      >
        <section className="overflow-hidden rounded-xl border border-[#E3E0D8] bg-[#FFFEFB]">
          <div className="relative h-28 bg-[#EEECE6] sm:h-36">
            <SafeImage src={coverPath} alt="Ifoto yo hejuru y’iduka" className="h-full w-full object-cover" fallback={<div className="imigongo-surface h-full w-full" aria-hidden="true" />} />
            <label className="absolute bottom-2 right-2 inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#E3E0D8] bg-[#FFFEFB]/95 px-3 text-[10.5px] font-semibold text-[#202724]">
              <ImagePlus className="h-3.5 w-3.5 text-[#214E43]" aria-hidden="true" />
              Hindura cover
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={Boolean(uploading)}
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  e.currentTarget.value = '';
                  void uploadBrandImage(file, 'shop', setCoverPath);
                }}
              />
            </label>
          </div>

          <div className="px-3 pb-4 sm:px-4">
            <div className="-mt-7 flex flex-wrap items-end gap-3">
              <div className="relative shrink-0">
                <SafeImage
                  src={avatarPath}
                  alt="Ifoto ya profile yawe"
                  className="h-[72px] w-[72px] rounded-full border-[3px] border-white bg-white object-cover"
                  fallback={<div className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white bg-[#E8F3EE] text-xl font-semibold text-[#0B6E4F]">{fullName.slice(0, 1).toUpperCase() || 'U'}</div>}
                />
                <label aria-label="Hindura ifoto ya profile" className="absolute -bottom-1 -right-1 grid h-11 w-11 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#0B6E4F] text-white shadow-sm">
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    disabled={Boolean(uploading)}
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      e.currentTarget.value = '';
                      void uploadBrandImage(file, 'profile', setAvatarPath);
                    }}
                  />
                </label>
              </div>

              <div className="min-w-[140px] flex-1 pb-1">
                <p className="text-[10px] font-semibold tracking-[0.08em] text-[#8F493F]">PROFILE PHOTO</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#68716D]">Ifoto igaragaza umucuruzi uri inyuma y’iduka.</p>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[#E3E0D8] bg-[#F7F5F0] p-2">
                <SafeImage
                  src={logoPath}
                  alt="Logo y’iduka"
                  className="h-12 w-12 rounded-md border border-[#E3E0D8] bg-white object-cover"
                  fallback={<div className="grid h-12 w-12 place-items-center rounded-md bg-white text-[10px] font-bold tracking-wide text-[#4B544F]">LOGO</div>}
                />
                <div>
                  <p className="text-[10px] font-semibold text-[#202724]">Shop logo</p>
                  <label className="mt-0.5 inline-flex min-h-[44px] cursor-pointer items-center px-1 text-[11px] font-semibold text-[#0B6E4F] hover:underline">
                    Hindura
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={Boolean(uploading)}
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        e.currentTarget.value = '';
                        void uploadBrandImage(file, 'logo', setLogoPath);
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="seller-profile-name" className="block text-[11px] font-semibold text-[#333D38]">Amazina agaragara kuri profile</label>
                <input id="seller-profile-name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={120} className="mt-1.5 min-h-10 w-full rounded-lg border border-[#D9D6CE] bg-white px-3 text-xs text-[#202724] focus:border-[#214E43] focus:outline-none" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="seller-profile-bio" className="text-[11px] font-semibold text-[#333D38]">Ibyerekeye wowe (Bio)</label>
                  <span className="text-[10px] tabular-nums text-[#68716D]">{profileBio.length}/2500</span>
                </div>
                <textarea id="seller-profile-bio" rows={3} maxLength={2500} value={profileBio} onChange={(e) => setProfileBio(e.target.value)} placeholder="Andika uwo uri we n’ibyo ukora..." className="mt-1.5 w-full rounded-lg border border-[#D9D6CE] bg-white p-3 text-xs text-[#202724] focus:border-[#214E43] focus:outline-none" />
              </div>
            </div>
          </div>
          {uploading && <p role="status" className="border-t border-[#E3E0D8] bg-white px-3 py-2 text-[11px] font-semibold text-[#0B6E4F]">Turimo gutunganya, kohereza no kubika ifoto...</p>}
          {savedMsg && <p role="status" className="border-t border-[#0B6E4F]/20 bg-[#E8F3EE] px-3 py-2 text-[11px] font-semibold text-[#0B6E4F]">{savedMsg}</p>}
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="shop-name" className="block text-sm font-semibold text-[#202724]">
              Izina ry’iduka (2–40)
            </label>
            <input
              id="shop-name"
              required
              minLength={2}
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#214E43] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-hours" className="block text-sm font-semibold text-[#202724]">
              Amasaha yo gukora
            </label>
            <input
              id="shop-hours"
              value={hoursText}
              onChange={(e) => setHoursText(e.target.value)}
              placeholder="08:30 – 19:30"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#214E43] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-wa" className="block text-sm font-semibold text-[#202724]">
              Nimero ya WhatsApp
            </label>
            <input
              id="shop-wa"
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#214E43] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-phone" className="block text-sm font-semibold text-[#202724]">
              Nimero yo guhamagara
            </label>
            <input
              id="shop-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#214E43] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-district" className="block text-sm font-semibold text-[#202724]">
              Akarere
            </label>
            <select
              id="shop-district"
              value={districtId}
              onChange={(e) => {
                setDistrictId(Number(e.target.value));
                setSectorId('');
              }}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm focus:border-[#214E43] focus:outline-none"
            >
              {RWANDA_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.district} ({d.province})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="shop-sector" className="block text-sm font-semibold text-[#202724]">
              Umurenge
            </label>
            <select
              id="shop-sector"
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              disabled={sectors.length === 0}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm disabled:bg-slate-100 focus:border-[#214E43] focus:outline-none"
            >
              <option value="">{sectors.length ? 'Hitamo umurenge' : 'Ntabwo ugenwe'}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.sector}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="shop-landmark" className="block text-sm font-semibold text-[#202724]">
            Ikimenyetso cy’aho iduka riherereye
          </label>
          <input
            id="shop-landmark"
            maxLength={80}
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#214E43] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="shop-delivery" className="block text-sm font-semibold text-[#202724]">
            Uko mutanga ibicuruzwa (kugeza kuri 120)
          </label>
          <input
            id="shop-delivery"
            maxLength={120}
            value={deliveryText}
            onChange={(e) => setDeliveryText(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#214E43] focus:outline-none"
          />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          <h2 className="text-sm font-bold text-[#202724]">Imbuga nkoranyambaga</h2>
          {[
            ['website','Urubuga rwawe'],['facebook','Facebook'],['instagram','Instagram'],['tiktok','TikTok'],['youtube','YouTube'],
          ].map(([key,label])=><div key={key}><label htmlFor={`social-${key}`} className="block text-xs font-semibold text-slate-700">{label}</label><input id={`social-${key}`} type="url" inputMode="url" placeholder="https://" value={socialLinks[key]??''} onChange={(e)=>setSocialLinks((old)=>({...old,[key]:e.target.value}))} className="mt-1 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"/></div>)}
        </section>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="shop-about" className="text-sm font-semibold text-[#202724]">
              Ibyerekeye iduka
            </label>
            <span className="text-xs text-slate-500 tabular-nums">{about.length}/3000</span>
          </div>
          <textarea
            id="shop-about"
            rows={3}
            maxLength={3000}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#214E43] focus:outline-none"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#BD594A]/30 bg-[#BD594A]/10 px-4 py-3 text-sm text-[#BD594A]"
          >
            {error}
          </div>
        )}

        {savedMsg && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-[#214E43]/30 bg-[#E9F0EB] px-4 py-3 text-sm font-medium text-[#214E43]"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{savedMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving || Boolean(uploading)}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#214E43] px-6 text-sm font-semibold text-white hover:bg-[#183B33] disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{uploading ? 'Tegereza ifoto irangize koherezwa...' : saving ? 'Bika...' : RW.save}</span>
        </button>
      </form>

      {shop && (
        <QrCodeModal
          open={qrOpen}
          onClose={() => setQrOpen(false)}
          shopName={shop.name}
          shopUrl={shopUrl}
        />
      )}
    </main>
  );
};
