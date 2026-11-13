import React, { useEffect, useState } from 'react';
import { ArrowLeft, Eye, MessageCircle, Phone, Share2, ShoppingBag } from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { fetchSellerOverview } from '../lib/api';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { Product } from '../types/marketplace';

export const SellerAnalyticsPage: React.FC = () => {
  const { navigate, authSession } = useMarketplace();
  const [period, setPeriod] = useState<'7d' | '30d'>('7d');
  const [data, setData] = useState<{
    stats7d: { views: number; wa_clicks: number; call_clicks: number; cart_adds: number; shares: number };
    stats30d: { views: number; wa_clicks: number; call_clicks: number; cart_adds: number; shares: number };
    topViewed: Product[];
    topWa: Product | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authSession) {
      navigate('/injira');
      return;
    }
    fetchSellerOverview()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [authSession, navigate]);

  const stats = period === '7d' ? data?.stats7d : data?.stats30d;

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
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
            <h1 className="text-xl font-bold text-[#1B1F23]">Imibare y’ubucuruzi</h1>
            <p className="text-xs text-slate-500">
              Uko abaguzi basuye ibicuruzwa byawe n’uko bahisemo kukuvugisha
            </p>
          </div>
        </div>

        <div className="flex rounded-xl border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setPeriod('7d')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold ${
              period === '7d' ? 'bg-[#0B6E4F] text-white' : 'text-slate-600'
            }`}
          >
            Iminsi 7 ishize
          </button>
          <button
            type="button"
            onClick={() => setPeriod('30d')}
            className={`min-h-[38px] rounded-lg px-3.5 text-xs font-semibold ${
              period === '30d' ? 'bg-[#0B6E4F] text-white' : 'text-slate-600'
            }`}
          >
            Iminsi 30 ishize
          </button>
        </div>
      </div>

      {loading || !stats || !data ? (
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-[#F1F6F3]" />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              { label: 'Ababirebye', value: stats.views, icon: Eye },
              { label: 'Abakanze WhatsApp', value: stats.wa_clicks, icon: MessageCircle },
              { label: 'Abahamagaye', value: stats.call_clicks, icon: Phone },
              { label: 'Bashyize mu gare', value: stats.cart_adds, icon: ShoppingBag },
              { label: 'Ababisangije', value: stats.shares, icon: Share2 },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium text-slate-500">{item.label}</span>
                    <Icon className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[#1B1F23] tabular-nums">{item.value}</p>
                </div>
              );
            })}
          </div>

          {data.topWa && (
            <section className="mt-6 rounded-2xl border border-[#25D366]/40 bg-[#F1F6F3] p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">
                Igicuruzwa cyakunzwe kuri WhatsApp kurusha ibindi
              </p>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={data.topWa.images[0]?.path_thumb || data.topWa.images[0]?.path_full}
                    alt={data.topWa.name}
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-[#1B1F23]">{data.topWa.name}</p>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {formatRwfCurrency(data.topWa.price)} · {data.topWa.wa_clicks_7d ?? 0} inshuro
                      kuri WhatsApp (iminsi 7)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/p/${data.topWa?.id}`)}
                  className="min-h-[44px] rounded-xl bg-white px-4 text-xs font-semibold text-[#0B6E4F] border border-[#0B6E4F]"
                >
                  Reba
                </button>
              </div>
            </section>
          )}

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-bold text-[#1B1F23]">
              Ibicuruzwa 5 byasuwe cyane (iminsi 7)
            </h2>
            <div className="mt-4 divide-y divide-slate-100">
              {data.topViewed.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-bold text-slate-400 tabular-nums">
                      {idx + 1}.
                    </span>
                    <img
                      src={p.images[0]?.path_thumb || p.images[0]?.path_full}
                      alt={p.name}
                      className="h-11 w-11 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1B1F23]">{p.name}</p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {formatRwfCurrency(p.price)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-600 tabular-nums shrink-0">
                    <p className="font-bold text-[#1B1F23]">{p.views_7d ?? 0} barebye</p>
                    <p>{p.wa_clicks_7d ?? 0} WhatsApp</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
};
