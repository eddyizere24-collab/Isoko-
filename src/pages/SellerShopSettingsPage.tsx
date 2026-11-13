import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, MessageCircle, QrCode, Save } from 'lucide-react';
import { QrCodeModal } from '../components/QrCodeModal';
import { useMarketplace } from '../context/MarketplaceContext';
import { getSectorsForDistrict, RWANDA_DISTRICTS } from '../data/rwandaAreas';
import { RW } from '../i18n/rw';
import { fetchSellerOverview, updateSellerShop } from '../lib/api';
import { buildWhatsAppLink } from '../lib/whatsapp';
import type { Shop } from '../types/marketplace';

export const SellerShopSettingsPage: React.FC = () => {
  const { navigate, authSession, refreshBootstrap } = useMarketplace();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!authSession) {
      navigate('/injira');
      return;
    }
    fetchSellerOverview()
      .then((res) => {
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
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Ikibazo mu gufungura iduka.'))
      .finally(() => setLoading(false));
  }, [authSession, navigate]);

  const sectors = useMemo(() => getSectorsForDistrict(districtId), [districtId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);
    setSaving(true);
    try {
      const res = await updateSellerShop({
        name,
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
        <div className="h-48 animate-pulse rounded-2xl bg-[#F1F6F3]" />
      </main>
    );
  }

  const testWaHref = buildWhatsAppLink(
    whatsapp,
    `Muraho ${name}, ndi kugerageza link ya WhatsApp y'iduka ryanjye ku Isoko.`
  );
  const shopUrl = shop ? `${window.location.origin}/i/${shop.slug}` : window.location.origin;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/umucuruzi')}
            aria-label="Subira inyuma"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 hover:bg-[#F1F6F3]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#1B1F23]">Amakuru y’iduka</h1>
            <p className="text-xs text-slate-500">
              Vugurura nimero ya WhatsApp, aho uherereye n’amasaha yo gukora
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={testWaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#25D366] px-4 text-xs font-semibold text-white hover:bg-[#1FB857]"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Gerageza link ya WhatsApp yanjye</span>
          </a>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
          >
            <QrCode className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
            <span>QR y’iduka</span>
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="shop-name" className="block text-sm font-semibold text-[#1B1F23]">
              Izina ry’iduka (2–40)
            </label>
            <input
              id="shop-name"
              required
              minLength={2}
              maxLength={40}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-hours" className="block text-sm font-semibold text-[#1B1F23]">
              Amasaha yo gukora
            </label>
            <input
              id="shop-hours"
              value={hoursText}
              onChange={(e) => setHoursText(e.target.value)}
              placeholder="08:30 – 19:30"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-wa" className="block text-sm font-semibold text-[#1B1F23]">
              Nimero ya WhatsApp
            </label>
            <input
              id="shop-wa"
              type="tel"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-phone" className="block text-sm font-semibold text-[#1B1F23]">
              Nimero yo guhamagara
            </label>
            <input
              id="shop-phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm tabular-nums focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="shop-district" className="block text-sm font-semibold text-[#1B1F23]">
              Akarere
            </label>
            <select
              id="shop-district"
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
            <label htmlFor="shop-sector" className="block text-sm font-semibold text-[#1B1F23]">
              Umurenge
            </label>
            <select
              id="shop-sector"
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
        </div>

        <div>
          <label htmlFor="shop-landmark" className="block text-sm font-semibold text-[#1B1F23]">
            Ikimenyetso cy’aho iduka riherereye
          </label>
          <input
            id="shop-landmark"
            maxLength={80}
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="shop-delivery" className="block text-sm font-semibold text-[#1B1F23]">
            Uko mutanga ibicuruzwa (kugeza kuri 120)
          </label>
          <input
            id="shop-delivery"
            maxLength={120}
            value={deliveryText}
            onChange={(e) => setDeliveryText(e.target.value)}
            className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-300 px-3.5 text-sm focus:border-[#0B6E4F] focus:outline-none"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="shop-about" className="text-sm font-semibold text-[#1B1F23]">
              Ibyerekeye iduka
            </label>
            <span className="text-xs text-slate-500 tabular-nums">{about.length}/200</span>
          </div>
          <textarea
            id="shop-about"
            rows={3}
            maxLength={200}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-[#C0392B]/30 bg-[#C0392B]/10 px-4 py-3 text-sm text-[#C0392B]"
          >
            {error}
          </div>
        )}

        {savedMsg && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-[#0B6E4F]/30 bg-[#F1F6F3] px-4 py-3 text-sm font-medium text-[#0B6E4F]"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            <span>{savedMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B6E4F] px-6 text-sm font-semibold text-white hover:bg-[#08553D] disabled:opacity-60"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          <span>{saving ? 'Bika...' : RW.save}</span>
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
