import React, { useState } from 'react';
import { MapPin, Navigation, Trash2, X } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RWANDA_DISTRICTS, getSectorsForDistrict } from '../data/rwandaAreas';
import { RW } from '../i18n/rw';

export const LocationSheet: React.FC = () => {
  const { location, setLocation, locationModalOpen, setLocationModalOpen } = useMarketplace();

  const [districtId, setDistrictId] = useState<number>(location?.districtId ?? 1);
  const [sectorId, setSectorId] = useState<number | ''>(location?.sectorId ?? '');
  const [landmark, setLandmark] = useState<string>(location?.landmark ?? '');
  const [lat, setLat] = useState<number | undefined>(location?.lat);
  const [lng, setLng] = useState<number | undefined>(location?.lng);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  if (!locationModalOpen) return null;

  const sectors = getSectorsForDistrict(districtId);
  const selectedDistrict = RWANDA_DISTRICTS.find((d) => d.id === districtId);

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('GPS ntishoboka kuri uyu mushakisha.');
      return;
    }
    setGpsStatus('Birimo gushaka aho uri...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setGpsStatus('Aho uri habonetse (kuri telefoni yawe gusa).');
      },
      () => {
        setGpsStatus('Ntibishobotse kubona GPS. Hitamo akarere mu rutonde.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict) return;
    const sec = sectorId ? sectors.find((s) => s.id === Number(sectorId)) : undefined;
    setLocation({
      districtId: selectedDistrict.id,
      districtName: selectedDistrict.district,
      sectorId: sec?.id ?? null,
      sectorName: sec?.sector ?? null,
      landmark: landmark.trim().slice(0, 80),
      lat,
      lng,
    });
    setLocationModalOpen(false);
  };

  const handleClear = () => {
    setLocation(null);
    setLocationModalOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
    >
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[#0B6E4F]" aria-hidden="true" />
            <h2 id="location-modal-title" className="text-lg font-bold text-[#1B1F23]">
              {RW.choose_location}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setLocationModalOpen(false)}
            aria-label="Funga"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-[#F1F6F3]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <p className="text-xs leading-relaxed text-slate-600">
            Aho uri habikwa kuri telefoni yawe gusa. Bidufasha kukwereka amaduka akwegereye
            no gushyiramo aho umucuruzi azakugezaho igicuruzwa kuri WhatsApp.
          </p>

          <div>
            <label htmlFor="loc-district" className="block text-sm font-semibold text-[#1B1F23]">
              Akarere (Uturere 30 tw'u Rwanda)
            </label>
            <select
              id="loc-district"
              value={districtId}
              onChange={(e) => {
                setDistrictId(Number(e.target.value));
                setSectorId('');
              }}
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none"
            >
              {RWANDA_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.district} ({d.province})
                </option>
              ))}
            </select>
          </div>

          {sectors.length > 0 && (
            <div>
              <label htmlFor="loc-sector" className="block text-sm font-semibold text-[#1B1F23]">
                Umurenge (i Kigali)
              </label>
              <select
                id="loc-sector"
                value={sectorId}
                onChange={(e) => setSectorId(e.target.value ? Number(e.target.value) : '')}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-[#1B1F23] focus:border-[#0B6E4F] focus:outline-none"
              >
                <option value="">Hitamo umurenge (si itegeko)</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sector}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="loc-landmark" className="block text-sm font-semibold text-[#1B1F23]">
              Akarango (si itegeko, ntarenze inyuguti 80)
            </label>
            <input
              id="loc-landmark"
              type="text"
              maxLength={80}
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="Urugero: Hafi ya Gare ya Kimironko"
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
            />
          </div>

          <div className="rounded-xl bg-[#F1F6F3] p-3">
            <button
              type="button"
              onClick={handleUseGps}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#0B6E4F] bg-white px-4 text-sm font-semibold text-[#0B6E4F] hover:bg-[#0B6E4F]/5"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              <span>{RW.use_gps} (GPS · si itegeko)</span>
            </button>
            {gpsStatus && <p className="mt-2 text-xs text-slate-700">{gpsStatus}</p>}
            {typeof lat === 'number' && typeof lng === 'number' && (
              <p className="mt-1 text-xs font-medium text-[#0B6E4F] tabular-nums">
                Link y'ikarita yiteguye: {lat.toFixed(4)}, {lng.toFixed(4)}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            {location && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span>Siba</span>
              </button>
            )}
            <button
              type="submit"
              className="min-h-[44px] flex-1 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D]"
            >
              {RW.save} aho ndi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
