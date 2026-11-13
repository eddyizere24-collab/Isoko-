import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  Eye,
  Flag,
  Megaphone,
  PauseCircle,
  PlayCircle,
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
  createAdminCampaign,
  deleteAdminCampaign,
  deleteAdminSynonym,
  fetchAdminKyc,
  fetchAdminOverview,
  moderateAdminProduct,
  resolveAdminReport,
  reviewAdminSeller,
  updateAdminCampaign,
  updateAdminSettings,
  type AdminOverviewResponse,
} from '../lib/api';
import { formatRwfCurrency } from '../lib/whatsapp';
import type { PromoCampaign } from '../types/marketplace';
import { processProductImage } from '../lib/image';
import { processProductImage } from '../lib/image';

interface AdminKycReview {
  seller_id: string;
  full_name_on_id: string;
  business_type: string;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  selfieUrl: string | null;
  shopPhotoUrl: string | null;
  submitted_at: string;
}

type AdminTab = 'overview' | 'sellers' | 'products' | 'reports' | 'campaigns' | 'settings';

const CAMPAIGN_BANNER_PRESETS = [
  {
    label: 'Isoko ry’Inkweto (Kimironko)',
    url: '/src/assets/images/promo_kigali_market_1794567241262.jpg',
  },
  {
    label: 'Imyenda ya Ankara (Nyamirambo)',
    url: '/src/assets/images/promo_ankara_craft_1794567240592.jpg',
  },
  {
    label: 'Isoko rya Kigali (Hero)',
    url: '/src/assets/images/hero_kigali_fashion_1794551814589.jpg',
  },
];

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
  const [kycDoc, setKycDoc] = useState<AdminKycReview | null>(null);
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

  // Campaign creation form
  const [campKicker, setCampKicker] = useState('Kwamamaza · Kigali');
  const [campTitle, setCampTitle] = useState('');
  const [campSubtitle, setCampSubtitle] = useState('');
  const [campCta, setCampCta] = useState('Reba ibicuruzwa');
  const [campTarget, setCampTarget] = useState('/c/inkweto');
  const [campImage, setCampImage] = useState('');
  const [campImageBusy, setCampImageBusy] = useState(false);
  const [campShopId, setCampShopId] = useState('');

  const activeTab: AdminTab = pathname.startsWith('/admin/abacuruzi')
    ? 'sellers'
    : pathname.startsWith('/admin/ibicuruzwa')
      ? 'products'
      : pathname.startsWith('/admin/ibirego')
        ? 'reports'
        : pathname.startsWith('/admin/kwamamaza')
          ? 'campaigns'
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

  const handleCampaignImage = async (file?: File) => {
    if (!file) return;
    setFeedback(null);
    setCampImageBusy(true);
    try {
      const image = await processProductImage(file);
      setCampImage(image.fullDataUrl);
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Ifoto y’itangazo ntiyemewe.');
      setCampImage('');
    } finally {
      setCampImageBusy(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle.trim()) return;
    if (!campImage) {
      setFeedback('Banza wohereze ifoto y’itangazo.');
      return;
    }
    try {
      await createAdminCampaign({
        kicker: campKicker.trim(),
        title: campTitle.trim(),
        subtitle: campSubtitle.trim(),
        ctaLabel: campCta.trim() || 'Reba ibicuruzwa',
        targetPath: campTarget.trim() || '/shakisha',
        imageUrl: campImage,
        shopId: campShopId || null,
      });
      setCampTitle('');
      setCampSubtitle('');
      setFeedback('Itangazo rishya ryashyizwe kuri carousel.');
      await load();
      refreshBootstrap();
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : 'Ntibishobotse gushyiraho itangazo.');
    }
  };

  const handleToggleCampaign = async (c: PromoCampaign) => {
    await updateAdminCampaign(c.id, { active: !c.active });
    setFeedback(c.active ? 'Itangazo ryahagaritswe.' : 'Itangazo ryasubijwe kuri carousel.');
    await load();
    refreshBootstrap();
  };

  const handleShiftCampaignOrder = async (c: PromoCampaign, delta: number) => {
    await updateAdminCampaign(c.id, { sortOrder: Math.max(1, c.sortOrder + delta) });
    await load();
    refreshBootstrap();
  };

  const handleDeleteCampaign = async (id: string) => {
    await deleteAdminCampaign(id);
    setFeedback('Itangazo ryasibwe.');
    await load();
    refreshBootstrap();
  };

  const handleExportCsv = () => {
    try {
      if (!data) throw new Error('Nta makuru ahari yo gukuramo.');
      const escapeCsv = (value: unknown) => {
        const text = value == null ? '' : String(value);
        return '"' + text.replace(/"/g, '""') + '"';
      };
      const rows = [
        ['Ubwoko', 'ID', 'Izina', 'Akarere', 'WhatsApp/Telefoni', 'Status', 'Itariki'],
        ...data.sellers.map((seller) => [
          'Umucuruzi', seller.id, seller.full_name, seller.shop?.district_name ?? '',
          seller.phone, seller.status, seller.created_at,
        ]),
        ...data.products.map((product) => [
          'Igicuruzwa', product.id, product.name, product.shop?.district_name ?? '',
          product.shop?.whatsapp ?? '', product.status, product.created_at,
        ]),
      ];
      const csv = '\\uFEFF' + rows.map((row) => row.map(escapeCsv).join(',')).join('\\r\\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'isoko-admin-export.csv';
      anchor.click();
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
    {
      id: 'campaigns',
      path: '/admin/kwamamaza',
      label: 'Kwamamaza',
      count: data.campaigns.filter((c) => c.active).length,
    },
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

      {/* TAB 5: Kwamamaza / Carousel Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <section className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-[#0B6E4F]" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-[#1B1F23]">
                Ongeraho itangazo kuri Carousel
              </h2>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3">
              <div>
                <label htmlFor="camp-kicker" className="block text-xs font-semibold text-[#1B1F23]">
                  Akanyamakuru (Kicker)
                </label>
                <input
                  id="camp-kicker"
                  type="text"
                  value={campKicker}
                  onChange={(e) => setCampKicker(e.target.value)}
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="camp-title" className="block text-xs font-semibold text-[#1B1F23]">
                  Umutwe w’itangazo *
                </label>
                <input
                  id="camp-title"
                  type="text"
                  required
                  minLength={4}
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  placeholder="Urugero: Inkweto za siporo zageze i Kigali"
                  className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                />
              </div>

              <div>
                <label htmlFor="camp-subtitle" className="block text-xs font-semibold text-[#1B1F23]">
                  Ibisobanuro bigufi
                </label>
                <textarea
                  id="camp-subtitle"
                  rows={2}
                  value={campSubtitle}
                  onChange={(e) => setCampSubtitle(e.target.value)}
                  placeholder="Sobanura igiciro cyangwa agashya..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="camp-cta" className="block text-xs font-semibold text-[#1B1F23]">
                    Buto (CTA)
                  </label>
                  <input
                    id="camp-cta"
                    type="text"
                    value={campCta}
                    onChange={(e) => setCampCta(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="camp-target" className="block text-xs font-semibold text-[#1B1F23]">
                    Aho bigana (URL)
                  </label>
                  <input
                    id="camp-target"
                    type="text"
                    value={campTarget}
                    onChange={(e) => setCampTarget(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 px-3 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="camp-shop" className="block text-xs font-semibold text-[#1B1F23]">
                    Iduka ryamamaza
                  </label>
                  <select
                    id="camp-shop"
                    value={campShopId}
                    onChange={(e) => setCampShopId(e.target.value)}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  >
                    <option value="">Isoko Rusange</option>
                    {data.sellers
                      .filter((s) => s.status === 'approved' && s.shop)
                      .map((s) => (
                        <option key={s.shop!.id} value={s.shop!.id}>
                          {s.shop!.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="camp-image" className="block text-xs font-semibold text-[#1B1F23]">
                    Ifoto y’itangazo
                  </label>
                  <input
                    id="camp-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => void handleCampaignImage(e.target.files?.[0])}
                    className="mt-1 min-h-[44px] w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  />
                  {campImage && (
                    <img src={campImage} alt="Ifoto y’itangazo" className="mt-2 h-28 w-full rounded-xl object-cover" />
                  )}
                  <p className="mt-1 text-[11px] text-slate-500">JPEG, PNG cyangwa WebP; ifoto izabikwa muri Object Storage ya Isoko.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={campImageBusy || !campImage}
                className="min-h-[44px] w-full rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white hover:bg-[#08553D] disabled:opacity-50"
              >
                {campImageBusy ? 'Tegereza...' : 'Shyira kuri Carousel'}
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 space-y-3">
            <h2 className="font-display text-base font-bold text-[#1B1F23]">
              Amatangazo ari kuri Carousel ({data.campaigns.length})
            </h2>
            {[...data.campaigns]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((camp) => {
                const ctr =
                  camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(1) : '0.0';
                return (
                  <article
                    key={camp.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <img
                        src={camp.imageUrl}
                        alt={camp.title}
                        className="h-18 w-28 shrink-0 rounded-xl object-cover bg-[#F1F6F3]"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0B6E4F]">
                          #{camp.sortOrder} · {camp.active ? 'Kirakora' : 'Gihagaze'}
                          {camp.shopName ? ` · ${camp.shopName}` : ''}
                        </p>
                        <h3 className="mt-0.5 text-sm font-bold text-[#1B1F23] line-clamp-1">
                          {camp.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">{camp.targetPath}</p>
                        <p className="mt-1 text-xs text-slate-500 tabular-nums">
                          {camp.impressions} barebye · {camp.clicks} bakanze · CTR {ctr}%
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleShiftCampaignOrder(camp, -1)}
                        aria-label={`Zamura ${camp.title}`}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-[#F1F6F3]"
                      >
                        <ArrowUp className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShiftCampaignOrder(camp, 1)}
                        aria-label={`Manura ${camp.title}`}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-[#F1F6F3]"
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleCampaign(camp)}
                        className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold ${
                          camp.active
                            ? 'border-[#E8A33D] bg-[#E8A33D]/10 text-[#9A5B00]'
                            : 'border-[#0B6E4F] bg-[#0B6E4F] text-white'
                        }`}
                      >
                        {camp.active ? (
                          <>
                            <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Hagarika</span>
                          </>
                        ) : (
                          <>
                            <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Tangiza</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(camp.id)}
                        aria-label={`Siba ${camp.title}`}
                        className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-slate-200 text-[#C0392B] hover:bg-[#C0392B]/10"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
          </section>
        </div>
      )}

      {/* TAB 6: Settings, Synonyms (K-06), Phase Flags & Audit Log */}
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
                  <p>
                    <strong>Ubwoko bw’ubucuruzi:</strong> {kycDoc.business_type}
                  </p>
                  <p className="text-slate-600">
                    Nimero y’indangamuntu ibikwa mu buryo bw’ibanga; Admin ntabona nimero yuzuye kuri uru rupapuro.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Indangamuntu (Imbere)', src: kycDoc.idFrontUrl },
                    { label: 'Indangamuntu (Inyuma)', src: kycDoc.idBackUrl },
                    { label: 'Selfie', src: kycDoc.selfieUrl },
                    { label: 'Iduka', src: kycDoc.shopPhotoUrl },
                  ].map((doc) => (
                    <div key={doc.label} className="rounded-xl border border-slate-200 p-2">
                      {doc.src ? (
                        <img
                          src={doc.src}
                          alt={doc.label}
                          referrerPolicy="no-referrer"
                          className="aspect-4/3 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex aspect-4/3 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500">Nta foto ibonetse</div>
                      )}
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
