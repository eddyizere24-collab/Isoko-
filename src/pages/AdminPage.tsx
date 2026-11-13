import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  Flag,
  Package,
  Settings,
  Shield,
  Store,
  Trash2,
  X,
} from 'lucide-react';
import { useMarketplace } from '../context/MarketplaceContext';
import { RW } from '../i18n/rw';
import {
  addAdminSynonym,
  deleteAdminSynonym,
  fetchAdminKyc,
  fetchAdminOverview,
  moderateAdminProduct,
  resolveAdminReport,
  reviewAdminSeller,
  updateAdminSettings,
  type AdminOverviewResponse,
} from '../lib/api';
import { formatRwfCurrency } from '../lib/whatsapp';
import { loadAuthSession } from '../lib/storage';
import type { SellerKyc } from '../types/marketplace';

type AdminTab = 'overview' | 'sellers' | 'products' | 'reports' | 'settings';

const REJECTION_TEMPLATES = [
  'Ifoto y’indangamuntu ntisobanutse. Nyamuneka ongera uyifate neza ahantu habona.',
  'Nimero ya telefoni cyangwa WhatsApp ntabwo yabashije kuboneka.',
  'Selfie ufite indangamuntu ntabwo igaragara neza isura.',
  'Izina ry’iduka cyangwa ibisobanuro birimo ibicuruzwa bitemewe ku rubuga.',
];

export const AdminPage: React.FC = () => {
  const { pathname, navigate, authSession, authProfile, refreshBootstrap } = useMarketplace();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // KYC Modal state
  const [kycModalSellerId, setKycModalSellerId] = useState<string | null>(null);
  const [kycDoc, setKycDoc] = useState<SellerKyc | null>(null);
  const [kycTtl, setKycTtl] = useState<number>(60);
  const [reviewReason, setReviewReason] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(true);
  const [waVerified, setWaVerified] = useState(true);

  // Products & Reports filters
  const [productQuery, setProductQuery] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'new' | 'resolved'>('all');

  // Synonym form
  const [synTerm, setSynTerm] = useState('');
  const [synCanonical, setSynCanonical] = useState('');

  const activeTab: AdminTab = pathname.startsWith('/admin/abacuruzi')
    ? 'sellers'
    : pathname.startsWith('/admin/ibicuruzwa')
      ? 'products'
      : pathname.startsWith('/admin/ibirego')
        ? 'reports'
        : pathname.startsWith('/admin/imiterere')
          ? 'settings'
          : 'overview';

  const load = async () => {
    try {
      setError(null);
      const res = await fetchAdminOverview();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uburenganzira bwa Admin burakenewe.');
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

  const openKycModal = async (sellerId: string) => {
    setFeedback(null);
    setKycModalSellerId(sellerId);
    setKycDoc(null);
    setReviewReason('');
    try {
      const res = await fetchAdminKyc(sellerId);
      setKycDoc(res.kyc);
      setKycTtl(res.signedUrlExpiresIn);
      await load(); // refreshes audit_log with view_kyc entry
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Ntibishobotse gufungura ibyangombwa.');
    }
  };

  const handleSellerDecision = async (status: 'approved' | 'needs_changes' | 'rejected' | 'suspended') => {
    if (!kycModalSellerId) return;
    try {
      await reviewAdminSeller(kycModalSellerId, {
        status,
        reason: reviewReason,
        phoneVerified,
        whatsappVerified: waVerified,
      });
      setKycModalSellerId(null);
      setFeedback(`Umucuruzi yashyizwe mu cyiciro: ${RW.seller_statuses[status]}.`);
      await load();
      refreshBootstrap();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Gufata icyemezo byanze.');
    }
  };

  const handleModerateProduct = async (productId: string, action: 'hide' | 'restore') => {
    const reason = action === 'hide' ? 'Yahishwe na Admin nyuma y’igenzura' : undefined;
    await moderateAdminProduct(productId, action, reason);
    setFeedback(action === 'hide' ? 'Igicuruzwa cyahishwe.' : 'Igicuruzwa cyasubijweho.');
    await load();
    refreshBootstrap();
  };

  const handleResolveReport = async (reportId: string, hideTarget: boolean) => {
    await resolveAdminReport(reportId, {
      status: 'resolved',
      resolution: hideTarget ? 'Igicuruzwa cyahishwe nyuma y’ikibazo' : 'Ikibazo cyasuzumwe kiranogerezwa',
      hideTarget,
    });
    setFeedback('Ikibazo cyarakemutse.');
    await load();
    refreshBootstrap();
  };

  const handleAddSynonym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!synTerm.trim() || !synCanonical.trim()) return;
    await addAdminSynonym(synTerm.trim(), synCanonical.trim());
    setSynTerm('');
    setSynCanonical('');
    setFeedback('Impuzanyito yongeweho.');
    await load();
    refreshBootstrap();
  };

  const handleToggleSetting = async (key: 'PHONE_ACCESSORIES_ENABLED' | 'ADS_ENABLED', val: boolean) => {
    await updateAdminSettings({ [key]: val });
    setFeedback('Imiterere y’urubuga yavuguruwe.');
    await load();
    refreshBootstrap();
  };

  const handleExportCsv = async () => {
    try {
      const sess = loadAuthSession();
      const res = await fetch('/api/admin/export.csv', {
        headers: sess?.token ? { Authorization: `Bearer ${sess.token}` } : {},
      });
      if (!res.ok) throw new Error('Ntibishobotse gukuramo dosiye ya CSV.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'isoko-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Ikosa mu gukuramo CSV.');
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-40 animate-pulse rounded-2xl bg-[#F1F6F3]" />
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-sm font-semibold text-[#C0392B]">{error}</p>
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

  const tabs: Array<{ id: AdminTab; path: string; label: string; count?: number }> = [
    { id: 'overview', path: '/admin', label: 'Incamake' },
    { id: 'sellers', path: '/admin/abacuruzi', label: 'Abacuruzi (KYC)', count: data.kpis.pendingSellers },
    { id: 'products', path: '/admin/ibicuruzwa', label: 'Ibicuruzwa', count: data.products.length },
    { id: 'reports', path: '/admin/ibirego', label: 'Ibirego', count: data.kpis.newReports },
    { id: 'settings', path: '/admin/imiterere', label: 'Imiterere & Audit' },
  ];

  const filteredProducts = data.products.filter((p) => {
    if (!productQuery.trim()) return true;
    const q = productQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.shop?.name ?? '').toLowerCase().includes(q);
  });

  const filteredReports = data.reports.filter((r) =>
    reportFilter === 'all' ? true : r.status === reportFilter
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">
            Ubuyobozi bw’Urubuga
          </p>
          <h1 className="text-2xl font-bold text-[#1B1F23]">
            Ibiro bya Admin {authProfile ? `— ${authProfile.full_name}` : ''}
          </h1>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-[#1B1F23] hover:bg-[#F1F6F3]"
        >
          <Download className="h-4 w-4 text-[#0B6E4F]" aria-hidden="true" />
          <span>Kuramo imibare (CSV)</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <nav aria-label="Admin tabs" className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => navigate(t.path)}
            className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${
              activeTab === t.id
                ? 'bg-[#0B6E4F] text-white'
                : 'border border-slate-200 bg-white text-[#1B1F23] hover:bg-[#F1F6F3]'
            }`}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                className={`tabular-nums text-[11px] ${
                  activeTab === t.id ? 'text-white/90' : 'text-slate-500'
                }`}
              >
                ({t.count})
              </span>
            )}
          </button>
        ))}
      </nav>

      {feedback && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-[#0B6E4F]/30 bg-[#F1F6F3] px-4 py-2.5 text-sm font-medium text-[#0B6E4F]"
        >
          {feedback}
        </div>
      )}

      {/* TAB 1: Overview */}
      {activeTab === 'overview' && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Abacuruzi bategereje KYC</p>
              <p className="mt-1 text-2xl font-bold text-[#B45309] tabular-nums">
                {data.kpis.pendingSellers}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Ibirego bishya</p>
              <p className="mt-1 text-2xl font-bold text-[#C0392B] tabular-nums">
                {data.kpis.newReports}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Ibicuruzwa ahagaragara</p>
              <p className="mt-1 text-2xl font-bold text-[#0B6E4F] tabular-nums">
                {data.kpis.totalActiveProducts}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs text-slate-500">Abakanze WhatsApp (bose)</p>
              <p className="mt-1 text-2xl font-bold text-[#1B1F23] tabular-nums">
                {data.kpis.wa_clicks}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1B1F23]">
                  Abacuruzi bategereje kugenzurwa
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/admin/abacuruzi')}
                  className="text-xs font-semibold text-[#0B6E4F] hover:underline"
                >
                  Reba bose
                </button>
              </div>
              <div className="mt-3 space-y-2.5">
                {data.sellers.filter((s) => s.status === 'pending').length === 0 ? (
                  <p className="text-xs text-slate-500">Nta mucuruzi utegereje kwemezwa.</p>
                ) : (
                  data.sellers
                    .filter((s) => s.status === 'pending')
                    .map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1B1F23]">
                            {s.shop?.name || s.full_name}
                          </p>
                          <p className="text-xs text-slate-500 tabular-nums">{s.phone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openKycModal(s.id)}
                          className="min-h-[40px] rounded-xl bg-[#0B6E4F] px-3.5 text-xs font-semibold text-white"
                        >
                          Suzuma KYC
                        </button>
                      </div>
                    ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#1B1F23]">Ibikorwa bya vuba (Audit Log)</h2>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {data.auditLog.slice(0, 6).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl bg-[#F1F6F3] px-3 py-2"
                  >
                    <span>
                      <strong className="text-[#1B1F23]">{a.actor_name}</strong> · {a.action} ({a.target_id})
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {new Date(a.created_at).toLocaleTimeString('rw-RW', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
                {data.auditLog.length === 0 && (
                  <p className="text-slate-500">Nta bikorwa birandikwa muri Audit Log uyu munsi.</p>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: Sellers KYC Queue */}
      {activeTab === 'sellers' && (
        <section className="mt-6 space-y-3">
          {data.sellers.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F1F6F3] text-[#0B6E4F]">
                  <Store className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1B1F23]">
                    {s.shop?.name || s.full_name}
                  </p>
                  <p className="text-xs text-slate-600 tabular-nums">
                    {s.full_name} · {s.phone} · {s.shop?.district_name || ''}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0B6E4F]">
                    Imiterere: {RW.seller_statuses[s.status]}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {s.hasKyc && (
                  <button
                    type="button"
                    onClick={() => openKycModal(s.id)}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0B6E4F] px-4 text-xs font-semibold text-white hover:bg-[#08553D]"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    <span>Reba KYC & Fata icyemezo</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* TAB 3: Products Moderation */}
      {activeTab === 'products' && (
        <section className="mt-6 space-y-4">
          <input
            type="search"
            value={productQuery}
            onChange={(e) => setProductQuery(e.target.value)}
            placeholder="Shakisha igicuruzwa cyangwa iduka..."
            className="min-h-[44px] w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 text-sm focus:border-[#0B6E4F] focus:outline-none"
          />

          <div className="space-y-2.5">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={p.images[0]?.path_thumb || p.images[0]?.path_full}
                    alt={p.name}
                    className="h-14 w-14 rounded-xl object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1B1F23]">{p.name}</p>
                    <p className="text-xs text-slate-600 tabular-nums">
                      {p.shop?.name} · {formatRwfCurrency(p.price)} · Imiterere: {p.status}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {p.status !== 'hidden' ? (
                    <button
                      type="button"
                      onClick={() => handleModerateProduct(p.id, 'hide')}
                      className="min-h-[44px] rounded-xl border border-[#C0392B] px-3.5 text-xs font-semibold text-[#C0392B] hover:bg-[#C0392B]/10"
                    >
                      Hisha igicuruzwa
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleModerateProduct(p.id, 'restore')}
                      className="min-h-[44px] rounded-xl bg-[#0B6E4F] px-3.5 text-xs font-semibold text-white"
                    >
                      Subiza ahagaragara
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 4: Reports Queue */}
      {activeTab === 'reports' && (
        <section className="mt-6 space-y-4">
          <div className="flex gap-2">
            {[
              { id: 'all' as const, label: 'Byose' },
              { id: 'new' as const, label: 'Ibishya' },
              { id: 'resolved' as const, label: 'Ibyakemutse' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setReportFilter(f.id)}
                className={`min-h-[40px] rounded-xl px-3.5 text-xs font-semibold ${
                  reportFilter === f.id
                    ? 'bg-[#0B6E4F] text-white'
                    : 'border border-slate-200 bg-white text-[#1B1F23]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-600">
              Nta birego bihari muri iki gice.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((rep) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <Flag className="mt-0.5 h-4 w-4 text-[#C0392B]" aria-hidden="true" />
                      <div>
                        <p className="text-sm font-bold text-[#1B1F23]">
                          {rep.target_name || rep.target_id} ({rep.target_type})
                        </p>
                        <p className="text-xs font-semibold text-[#C0392B]">
                          {RW.report_types[rep.type] || rep.type}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">
                      {rep.status === 'resolved' ? 'Cyakemutse' : 'Gishya'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700">{rep.details}</p>

                  {rep.status !== 'resolved' ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id, false)}
                        className="min-h-[44px] rounded-xl border border-[#0B6E4F] px-3.5 text-xs font-semibold text-[#0B6E4F] hover:bg-[#F1F6F3]"
                      >
                        Kemura (rekera aho)
                      </button>
                      {rep.target_type === 'product' && (
                        <button
                          type="button"
                          onClick={() => handleResolveReport(rep.id, true)}
                          className="min-h-[44px] rounded-xl bg-[#C0392B] px-3.5 text-xs font-semibold text-white hover:bg-[#A93226]"
                        >
                          Hisha igicuruzwa & Kemura
                        </button>
                      )}
                    </div>
                  ) : (
                    rep.resolution && (
                      <p className="text-xs text-[#0B6E4F]">Umwanzuro: {rep.resolution}</p>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 5: Settings, Synonyms (K-06), Phase Flags & Audit Log */}
      {activeTab === 'settings' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#0B6E4F]" aria-hidden="true" />
              <h2 className="text-base font-bold text-[#1B1F23]">
                Amahitamo y’Urubuga (Phase Flags)
              </h2>
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-[#1B1F23]">
                  P3: Ibikoresho by’amatelefoni
                </p>
                <p className="text-xs text-slate-500">
                  Fungura icyiciro cya 5 (cases, chargers, earphones) ku rubuga
                </p>
              </div>
              <input
                type="checkbox"
                checked={data.settings.PHONE_ACCESSORIES_ENABLED}
                onChange={(e) =>
                  handleToggleSetting('PHONE_ACCESSORIES_ENABLED', e.target.checked)
                }
                className="h-5 w-5 rounded border-slate-300 text-[#0B6E4F]"
              />
            </label>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-[#1B1F23]">
                  P4: Kwamamaza mu ishakiro (Ads)
                </p>
                <p className="text-xs text-slate-500">
                  Kwemerera amaduka yamamaza kugaragara imbere (Ntibigomba kurenga 1 muri 8)
                </p>
              </div>
              <input
                type="checkbox"
                checked={data.settings.ADS_ENABLED}
                onChange={(e) => handleToggleSetting('ADS_ENABLED', e.target.checked)}
                className="h-5 w-5 rounded border-slate-300 text-[#0B6E4F]"
              />
            </label>

            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-sm font-bold text-[#1B1F23]">
                Impuzanyito z’ishakiro (Synonyms)
              </h3>
              <form onSubmit={handleAddSynonym} className="mt-2.5 flex gap-2">
                <input
                  value={synTerm}
                  onChange={(e) => setSynTerm(e.target.value)}
                  placeholder="Ijambo (urugero: nayiki)"
                  className="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-3 text-xs"
                />
                <input
                  value={synCanonical}
                  onChange={(e) => setSynCanonical(e.target.value)}
                  placeholder="Ijambo nyaryo (nike)"
                  className="min-h-[44px] flex-1 rounded-xl border border-slate-300 px-3 text-xs"
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#0B6E4F] px-4 text-xs font-semibold text-white"
                >
                  Ongeraho
                </button>
              </form>

              <div className="mt-3 max-h-56 overflow-y-auto space-y-1.5">
                {data.synonyms.map((s) => (
                  <div
                    key={s.term}
                    className="flex items-center justify-between rounded-lg bg-[#F1F6F3] px-3 py-1.5 text-xs"
                  >
                    <span>
                      <strong>{s.term}</strong> → {s.canonical}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteAdminSynonym(s.term);
                        await load();
                        refreshBootstrap();
                      }}
                      aria-label={`Siba ${s.term}`}
                      className="text-[#C0392B] hover:underline"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#0B6E4F]" aria-hidden="true" />
              <h2 className="text-base font-bold text-[#1B1F23]">
                Audit Log (Ibikorwa byose bya Admin)
              </h2>
            </div>
            <div className="mt-4 max-h-[460px] overflow-y-auto space-y-2 text-xs">
              {data.auditLog.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-100 bg-[#F1F6F3] p-3">
                  <div className="flex justify-between font-semibold text-[#1B1F23]">
                    <span>
                      {a.actor_name} · {a.action}
                    </span>
                    <span className="text-slate-500 tabular-nums">
                      {new Date(a.created_at).toLocaleString('rw-RW')}
                    </span>
                  </div>
                  <p className="mt-0.5 text-slate-600">
                    Target: {a.target_type} ({a.target_id})
                  </p>
                </div>
              ))}
              {data.auditLog.length === 0 && (
                <p className="text-slate-500">Nta bikorwa birabikwa.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* KYC Review Modal (K-02 & S9) */}
      {kycModalSellerId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kyc-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 id="kyc-modal-title" className="text-lg font-bold text-[#1B1F23]">
                  Igenzura ry’ibyangombwa (KYC)
                </h2>
                <p className="text-xs text-slate-500">
                  Kureba iyi dosiye byanditswe muri Audit Log (Igihe cyo gufungura: {kycTtl}s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setKycModalSellerId(null)}
                aria-label="Funga"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-[#F1F6F3]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!kycDoc ? (
              <div className="h-40 animate-pulse rounded-xl bg-[#F1F6F3]" />
            ) : (
              <>
                <div className="grid gap-3 rounded-xl bg-[#F1F6F3] p-4 text-xs sm:grid-cols-2">
                  <p>
                    <strong>Amazina ku ndangamuntu:</strong> {kycDoc.full_name_on_id}
                  </p>
                  <p className="tabular-nums">
                    <strong>Indangamuntu:</strong> {kycDoc.national_id_number}
                  </p>
                  <p>
                    <strong>Ubwoko bw’ubucuruzi:</strong> {kycDoc.business_type}
                  </p>
                  <p className="tabular-nums">
                    <strong>TIN:</strong> {kycDoc.tin || 'Ntabwo yatanzwe'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Indangamuntu (Imbere)', src: kycDoc.id_front_path },
                    { label: 'Indangamuntu (Inyuma)', src: kycDoc.id_back_path },
                    { label: 'Selfie', src: kycDoc.selfie_path },
                    { label: 'Iduka', src: kycDoc.shop_photo_path },
                  ].map((doc) => (
                    <div key={doc.label} className="rounded-xl border border-slate-200 p-2">
                      <img
                        src={doc.src}
                        alt={doc.label}
                        className="aspect-4/3 w-full rounded-lg object-cover"
                      />
                      <p className="mt-1 text-center text-[11px] font-medium text-slate-600">
                        {doc.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B1F23] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={phoneVerified}
                      onChange={(e) => setPhoneVerified(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0B6E4F]"
                    />
                    <span>Telefoni yagenzuwe (yitabye)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#1B1F23] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waVerified}
                      onChange={(e) => setWaVerified(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#0B6E4F]"
                    />
                    <span>WhatsApp ikora</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="kyc-reason" className="block text-xs font-semibold text-[#1B1F23]">
                    Impamvu / Ubutumwa (niba wanga cyangwa usaba gukosora)
                  </label>
                  <textarea
                    id="kyc-reason"
                    rows={2}
                    value={reviewReason}
                    onChange={(e) => setReviewReason(e.target.value)}
                    placeholder="Andika ubutumwa bugufi cyangwa uhitemo muri izi nteruro..."
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                  />
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {REJECTION_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl}
                        type="button"
                        onClick={() => setReviewReason(tpl)}
                        className="rounded-lg border border-slate-200 bg-[#F1F6F3] px-2.5 py-1 text-[11px] text-slate-700 hover:border-[#0B6E4F]"
                      >
                        {tpl.slice(0, 42)}…
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleSellerDecision('approved')}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0B6E4F] px-4 text-xs font-semibold text-white hover:bg-[#08553D]"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>Emeza (Approve)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSellerDecision('needs_changes')}
                    className="min-h-[44px] rounded-xl border border-[#E8A33D] bg-[#E8A33D]/15 px-4 text-xs font-semibold text-[#9A5B00]"
                  >
                    Saba gukosora
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSellerDecision('rejected')}
                    className="inline-flex min-h-[44px] items-center gap-1 rounded-xl border border-[#C0392B] px-4 text-xs font-semibold text-[#C0392B] hover:bg-[#C0392B]/10"
                  >
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <span>Anga (Reject)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
