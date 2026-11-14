import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Eye,
  MessageCircle,
  Package,
  Plus,
  QrCode,
  Settings,
  Store,
} from 'lucide-react';
import { QrCodeModal } from '../components/QrCodeModal';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import { fetchSellerOverview, updateSellerProduct } from '../lib/api';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { Product, Profile, Shop } from '../types/marketplace';

export const SellerDashboardPage: React.FC = () => {
  const { navigate, authSession, refreshBootstrap } = useMarketplace();
  const [data, setData] = useState<{
    profile: Pick<Profile, 'id' | 'full_name' | 'status' | 'status_reason' | 'email' | 'email_verified' | 'identity_status'>;
    shop: Shop;
    products: Product[];
    staleProducts: Product[];
    stats7d: { views: number; wa_clicks: number; call_clicks: number; cart_adds: number; shares: number };
    stats30d: { views: number; wa_clicks: number; call_clicks: number; cart_adds: number; shares: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const res = await fetchSellerOverview();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibishobotse gufungura ibiro by’umucuruzi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authSession) {
      navigate('/injira');
      return;
    }
    load();
  }, [authSession, navigate]);

  const handleStaleAction = async (productId: string, action: 'confirm_available' | 'mark_sold') => {
    setBusyId(productId);
    try {
      await updateSellerProduct(productId, { action });
      await load();
      refreshBootstrap();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="h-32 animate-pulse rounded-2xl bg-[#F1F6F3]" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-sm font-medium text-[#C0392B]">{error || 'Injira nk’umucuruzi.'}</p>
        <button
          type="button"
          onClick={() => navigate('/injira')}
          className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white"
        >
          {RW.login}
        </button>
      </main>
    );
  }

  const activeCount = data.products.filter((p) => p.status === 'active').length;
  const shopUrl = `${window.location.origin}/i/${data.shop.slug}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Seller Status Banner (Pending / Needs Changes / Rejected / Suspended) */}
      {data.profile.status !== 'approved' && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-[#E8A33D]/50 bg-[#E8A33D]/15 p-4 text-sm text-[#1B1F23]"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#B45309]" aria-hidden="true" />
            <div>
              <p className="font-bold">
                {data.profile.status === 'pending'
                  ? RW.pending_review
                  : `Imiterere ya konti: ${RW.seller_statuses[data.profile.status]}`}
              </p>
              {data.profile.status_reason && (
                <p className="mt-1 text-slate-700">Impamvu: {data.profile.status_reason}</p>
              )}
              <p className="mt-1 text-xs text-slate-600">
                Ushobora gutangira gutegura ibicuruzwa byawe nk’ibitabo; bizajya ahagaragara konti
                yawe imaze kwemezwa.
              </p>
            </div>
          </div>
        </div>
      )}

      {data.profile.identity_status !== 'verified' && data.profile.status === 'approved' && (
        <div role="status" className="mb-5 rounded-xl border border-slate-200 bg-[#F7FAF8] px-4 py-3 text-xs leading-5 text-slate-700">
          Konti yawe irakora. Indangamuntu n’andi makuru y’inyongera ntibiragenzurwa. Kuzuza Profile birambuye bizongerwaho mu kindi cyiciro; ushobora gutangira gushyiraho ibicuruzwa ubu.
        </div>
      )}

      {/* Header + Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-semibold text-[#0B6E4F]">Ibiro by’umucuruzi</p>
          <h1 className="text-2xl font-bold text-[#1B1F23]">{data.shop.name}</h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {data.shop.district_name}
            {data.shop.sector_name ? ` · ${data.shop.sector_name}` : ''} ·{' '}
            <span className="font-semibold text-[#0B6E4F]">
              {data.profile.status === 'approved' ? 'Konti irakora' : RW.seller_statuses[data.profile.status]}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
          >
            <QrCode className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
            <span>QR y’iduka</span>
          </button>
          <a
            href={`/i/${data.shop.slug}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(`/i/${data.shop.slug}`);
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
          >
            <Store className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
            <span>{RW.view_shop}</span>
          </a>
          <button
            type="button"
            onClick={() => navigate('/umucuruzi/ongeraho')}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>{RW.add_product}</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Ibicuruzwa biri ahagaragara</p>
          <p className="mt-1 text-2xl font-bold text-[#1B1F23] tabular-nums">
            {activeCount} <span className="text-sm font-normal text-slate-400">/ {data.shop.product_limit}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Abarebye (iminsi 7)</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#1B1F23] tabular-nums">
            <Eye className="h-5 w-5 text-[#0B6E4F]" aria-hidden="true" />
            {data.stats7d.views}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Abakanze WhatsApp (iminsi 7)</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#0B6E4F] tabular-nums">
            <MessageCircle className="h-5 w-5 text-[#25D366]" aria-hidden="true" />
            {data.stats7d.wa_clicks}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium text-slate-500">Abashyize mu gare (iminsi 7)</p>
          <p className="mt-1 text-2xl font-bold text-[#1B1F23] tabular-nums">
            {data.stats7d.cart_adds}
          </p>
        </div>
      </div>

      {/* Seller Navigation Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => navigate('/umucuruzi/ibicuruzwa')}
          className="flex min-h-[76px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#0B6E4F]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F6F3] text-[#0B6E4F]">
            <Package className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1B1F23]">
              Ibicuruzwa byanjye ({data.products.length})
            </p>
            <p className="text-xs text-slate-600">Hindura igiciro, kopora cyangwa shyiraho cyashize</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/umucuruzi/iduka')}
          className="flex min-h-[76px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#0B6E4F]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F6F3] text-[#0B6E4F]">
            <Settings className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1B1F23]">Amakuru y’iduka</p>
            <p className="text-xs text-slate-600">Aho uri, amasaha, WhatsApp no kuyigerageza</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigate('/umucuruzi/imibare')}
          className="flex min-h-[76px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-[#0B6E4F]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F6F3] text-[#0B6E4F]">
            <BarChart3 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1B1F23]">Imibare y’ubucuruzi</p>
            <p className="text-xs text-slate-600">Iminsi 7 n’iminsi 30, ibicuruzwa bikunzwe</p>
          </div>
        </button>
      </div>

      {/* Section 9.6: Stale product 30-day check ("Iracyahari?") */}
      {data.staleProducts.length > 0 && (
        <section className="mt-8 rounded-2xl border border-[#E8A33D]/50 bg-[#FFFBEB] p-5">
          <h2 className="text-base font-bold text-[#1B1F23]">
            {RW.still_available} — Ibicuruzwa bimaze iminsi 30 bitavuguruwe ({data.staleProducts.length})
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Emeza niba bikiri mu bubiko kugira ngo bikomeze kugera imbere mu ishakiro.
          </p>

          <div className="mt-4 space-y-3">
            {data.staleProducts.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.images[0]?.path_thumb || p.images[0]?.path_full}
                    alt={p.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[#1B1F23]">{p.name}</p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {formatRwfCurrency(p.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => handleStaleAction(p.id, 'confirm_available')}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#0B6E4F] px-3.5 text-xs font-semibold text-white hover:bg-[#08553D]"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Yego, iracyahari</span>
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => handleStaleAction(p.id, 'mark_sold')}
                    className="inline-flex min-h-[44px] items-center rounded-xl border border-slate-300 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {RW.mark_sold}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Products Quick Preview */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1B1F23]">Ibicuruzwa byawe biheruka</h2>
          <button
            type="button"
            onClick={() => navigate('/umucuruzi/ibicuruzwa')}
            className="min-h-[44px] text-sm font-semibold text-[#0B6E4F] hover:underline"
          >
            {RW.see_all}
          </button>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.products.slice(0, 6).map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <img
                src={p.images[0]?.path_thumb || p.images[0]?.path_full}
                alt={p.name}
                className="h-16 w-16 rounded-lg object-cover shrink-0 bg-[#F1F6F3]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#1B1F23]">{p.name}</p>
                <p className="text-xs font-bold text-[#0B6E4F] tabular-nums">
                  {formatRwfCurrency(p.price)}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500 tabular-nums">
                  {p.status === 'active'
                    ? 'Ahagaragara'
                    : p.status === 'sold_out'
                      ? RW.sold_out
                      : p.status === 'draft'
                        ? 'Igitabo'
                        : 'Yahishwe'}{' '}
                  · {p.views_7d ?? 0} barebye · {p.wa_clicks_7d ?? 0} WhatsApp
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <QrCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        shopName={data.shop.name}
        shopUrl={shopUrl}
      />
    </main>
  );
};
