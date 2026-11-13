import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, BarChart3, RefreshCw, Search, ShieldAlert, Store, TrendingUp } from 'lucide-react';
import { fetchAdminControlCenter, type AdminControlCenterSnapshot } from '../../lib/api';

interface Props {
  onNavigate: (path: string) => void;
}

interface Answer {
  title: string;
  body: string;
  facts: string[];
  path?: string;
  caution?: string;
}

const QUICK_QUESTIONS = [
  'Urubuga ruri gukora rute?',
  'Ni abahe bacuruzi bakeneye kugenzurwa?',
  'Ibibazo bishya ni bingahe?',
  'Ni ayahe maduka akurura abantu cyane?',
  'Ibicuruzwa bihagaze bite?',
  'Ni ibihe byiciro by’ibibazo bikunze gutangwa?',
  'Ni ibihe bicuruzwa bikurura abantu cyane?',
];

function normalizeQuestion(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fmt(value: number): string {
  return new Intl.NumberFormat('rw-RW').format(Number.isFinite(value) ? value : 0);
}

function answerQuestion(question: string, data: AdminControlCenterSnapshot): Answer {
  const q = normalizeQuestion(question);
  const noRecords = data.coverage.sellers === 0 && data.coverage.shops === 0 && data.coverage.products === 0;
  const trafficReady = data.coverage.shop_stat_days > 0;

  if (/umucuruzi|abacuruzi|seller|sellers/.test(q)) {
    return {
      title: 'Abacuruzi n’amaduka',
      body: 'Iyi ni imibare yasomwe muri database ya ISOKO mu kanya ka ' + new Date(data.generatedAt).toLocaleString('rw-RW') + '.',
      facts: [
        'Abacuruzi bose: ' + fmt(data.sellers.total),
        'Bemejwe: ' + fmt(data.sellers.approved),
        'Bategereje igenzura: ' + fmt(data.sellers.pending),
        'Basabwe gukosora: ' + fmt(data.sellers.needs_changes),
        'Bahagaritswe: ' + fmt(data.sellers.suspended),
        'Amaduka yose: ' + fmt(data.shops.total) + ' (akora: ' + fmt(data.shops.approved) + ')',
      ],
      path: '/admin/abacuruzi',
      caution: noRecords ? 'Nta mucuruzi nyakuri urandikwa muri iyi database. Iyi mibare ni 0, si uko hari abacuruzi twabuze.' : undefined,
    };
  }

  if (/ikibazo|ibibazo|ikirego|ibirego|complaint|report/.test(q)) {
    return {
      title: 'Ibibazo n’ibirego byatanzwe',
      body: 'Raporo zibikwa kuri ISOKO zerekeye iduka cyangwa igicuruzwa. Ibisobanuro bwite n’imibare ya telefoni ntibijya muri iri sesengura.',
      facts: [
        'Ibirego byose: ' + fmt(data.reports.total),
        'Bishya: ' + fmt(data.reports.new),
        'Biri gukorwaho: ' + fmt(data.reports.in_progress),
        'Byakemuwe: ' + fmt(data.reports.resolved),
        'Ibibazo bikunze gutangwa: ' + (data.reportsByType.length
          ? data.reportsByType.slice(0, 3).map((item) => item.type + ' (' + fmt(item.count) + ')').join(', ')
          : 'Nta cyiciro cy’ikirego kirabikwa.'),
        data.riskShops.length ? 'Iduka rifite ibirego byinshi: ' + data.riskShops[0].shopName + ' (' + fmt(data.riskShops[0].totalReports) + ' byose, ' + fmt(data.riskShops[0].openReports) + ' biracyafunguye)' : 'Nta duka rifite ibirego byanditswe.',
      ],
      path: '/admin/ibirego',
      caution: 'Ikirego ni ikimenyetso gisaba igenzura, si gihamya y’uko umucuruzi yakoze amakosa.',
    };
  }

  if (/nabi|kwitwara|uriganya|uburiganya|bad seller|untrusted|shidikanya|risk/.test(q)) {
    const firstRisk = data.riskShops[0];
    return {
      title: 'Amaduka akeneye kwitabwaho',
      body: firstRisk
        ? 'Iri rutonde rushingiye ku mubare w’ibirego byafunguwe n’ibyabanje. Fungura ibirego usome ibimenyetso mbere yo gufata icyemezo.'
        : 'Nta raporo ihari yerekana iduka risaba kugenzurwa. Ntibihagije kuvuga ko amaduka yose yitwara neza; nta makuru ahagije aracyaboneka.',
      facts: firstRisk
        ? data.riskShops.slice(0, 5).map((shop, index) =>
            (index + 1) + '. ' + shop.shopName + ' · ' + shop.district + ' · ibirego ' + fmt(shop.totalReports) + ' · bifunguye ' + fmt(shop.openReports))
        : ['Nta raporo z’amaduka ziri muri database.'],
      path: '/admin/ibirego',
      caution: 'Ishakiro ntirita umuntu umunyamakosa rishingiye ku birego gusa. Admin ni we ugenzura ibimenyetso kandi agafata icyemezo.',
    };
  }

  if (/amashusho|traffic|visits|views|imikorere|urubuga|ruri gukora|performance|imibare/.test(q)) {
    return {
      title: 'Imikorere y’urubuga mu minsi 30',
      body: trafficReady
        ? 'Imibare ikubiyemo ibikorwa byabitswe muri shop_daily_stats mu minsi 30 ishize.'
        : 'Nta mibare y’imikoreshereze ibitswe muri iyi database muri iki gihe.',
      facts: [
        'Views: ' + fmt(data.traffic.views),
        'Abakanze WhatsApp: ' + fmt(data.traffic.waClicks),
        'Abahamagaye: ' + fmt(data.traffic.callClicks),
        'Ibicuruzwa byashyizwe mu gare: ' + fmt(data.traffic.cartAdds),
        'Shares: ' + fmt(data.traffic.shares),
      ],
      path: '/admin',
      caution: trafficReady ? undefined : 'Ntitwahimba umubare w’abasura urubuga. Imibare izatangira kugaragara nyuma y’uko urubuga rwakiriye abantu kandi tracking ikabika ibikorwa.',
    };
  }

  if (/iduka|amaduka|shop|shops|popular|cyane|gukundwa|akunzwe/.test(q)) {
    const best = data.topShops[0];
    return {
      title: 'Amaduka akurura abantu',
      body: best
        ? 'Urutonde rukurikira rushingiye kuri WhatsApp clicks, views n’ibikorwa byabitswe mu minsi 30.'
        : 'Nta maduka yemejwe cyangwa nta mibare y’ibikorwa iraboneka.',
      facts: best
        ? data.topShops.slice(0, 5).map((shop, index) =>
            (index + 1) + '. ' + shop.shopName + ' · ' + shop.district + ' · views ' + fmt(shop.views) + ' · WhatsApp ' + fmt(shop.waClicks))
        : ['Amaduka azagaragara hano amaze kwiyandikisha, kwemezwa no kwakira ibikorwa.'],
      path: '/admin/abacuruzi',
      caution: trafficReady ? undefined : 'Ukoresheje imibare iriho ubu, ntiturabona ibikorwa bihagije byo kugereranya amaduka.',
    };
  }

  if (/igicuruzwa|ibicuruzwa|product|products|stock/.test(q)) {
    const wantsPopular = /gikurura|bikunzwe|gikunzwe|cyane|popular|top/.test(q);
    return {
      title: wantsPopular ? 'Ibicuruzwa bikurura abantu' : 'Imiterere y’ibicuruzwa',
      body: wantsPopular
        ? 'Urutonde rushingiye kuri WhatsApp clicks, views na cart adds byanditswe mu minsi 30. Si ugupima ubuziranenge bw’igicuruzwa.'
        : 'Iyi mibare ikomoka kuri status z’ibicuruzwa biri muri database.',
      facts: wantsPopular
        ? data.topProducts.length
          ? data.topProducts.slice(0, 5).map((item, index) =>
              (index + 1) + '. ' + item.productName + ' · ' + item.shopName + ' · views ' + fmt(item.views) + ' · WhatsApp ' + fmt(item.waClicks))
          : ['Nta bicuruzwa biri ku isoko cyangwa nta mibare y’ibikorwa iraboneka.']
        : [
            'Ibicuruzwa byose: ' + fmt(data.products.total),
            'Biri ku isoko: ' + fmt(data.products.active),
            'Draft: ' + fmt(data.products.draft),
            'Byashizeho stock: ' + fmt(data.products.sold_out),
            'Byahishwe: ' + fmt(data.products.hidden),
            'Byarengeje igihe: ' + fmt(data.products.expired),
            data.topProducts.length
              ? 'Igicuruzwa cya mbere: ' + data.topProducts[0].productName + ' (' + fmt(data.topProducts[0].waClicks) + ' WhatsApp clicks)'
              : 'Nta gicuruzwa kirimo imibare y’imikoreshereze.',
          ],
      path: '/admin/ibicuruzwa',
      caution: noRecords ? 'Nta bicuruzwa by’umucuruzi nyakuri byinjijwe muri database kugeza ubu.' : wantsPopular && !trafficReady ? 'Nta traffic ihagije irabikwa ngo hamenyekane ibicuruzwa bikurura abantu.' : undefined,
    };
  }

  if (/Kwamamaza|campaign|promotion|itangazo|amatangazo/.test(q)) {
    return {
      title: 'Kwamamaza kuri ISOKO',
      body: 'Imibare y’amamaza yakuwe kuri campaigns.',
      facts: [
        'Amatangazo yose: ' + fmt(data.campaigns.total),
        'Akora: ' + fmt(data.campaigns.active),
        'Impressions: ' + fmt(data.campaigns.impressions),
        'Clicks: ' + fmt(data.campaigns.clicks),
      ],
      path: '/admin/kwamamaza',
    };
  }

  return {
    title: 'Incamake y’ibyo nzi ubu',
    body: 'Nshobora gusubiza neza ku mibare iri muri database. Andika ikibazo kigufi mu Kinyarwanda, English cyangwa Français, cyangwa ukoreshe urugero ruri hejuru.',
    facts: [
      'Abacuruzi: ' + fmt(data.sellers.total) + ' · Amaduka: ' + fmt(data.shops.total),
      'Ibicuruzwa: ' + fmt(data.products.total) + ' · Ibirego: ' + fmt(data.reports.total),
      'Views mu minsi 30: ' + fmt(data.traffic.views) + ' · WhatsApp clicks: ' + fmt(data.traffic.waClicks),
    ],
    path: '/admin',
    caution: 'Iri ni ishakiro rishingiye ku mibare yemejwe, si generative AI model. Ntirivuga ko ryabonye amakuru atari muri database.',
  };
}

export const AdminAssistantPanel: React.FC<Props> = ({ onNavigate }) => {
  const [snapshot, setSnapshot] = useState<AdminControlCenterSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAdminControlCenter();
      setSnapshot(result);
      if (!question.trim()) setAnswer(answerQuestion('incamake', result));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ntibyashobotse gusoma imibare y’urubuga.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const noLiveActivity = useMemo(
    () => snapshot ? snapshot.coverage.shop_stat_days === 0 : false,
    [snapshot]
  );

  const recommendations = useMemo(() => {
    if (!snapshot) return [];
    const items: Array<{ title: string; detail: string; path: string }> = [];
    if (snapshot.reports.new > 0) {
      items.push({
        title: 'Suzuma ibirego bishya',
        detail: snapshot.reports.new + ' biracyategereje ko Admin abisuzuma.',
        path: '/admin/ibirego',
      });
    }
    if (snapshot.riskShops.some((shop) => shop.openReports > 0)) {
      items.push({
        title: 'Genzura amaduka afite ibirego bifunguye',
        detail: 'Reba ibimenyetso n’ibisubizo mbere yo gufata icyemezo ku mucuruzi.',
        path: '/admin/ibirego',
      });
    }
    if (snapshot.sellers.pending > 0) {
      items.push({
        title: 'Suzuma abacuruzi bategereje',
        detail: snapshot.sellers.pending + ' bakeneye ko KYC isuzumwa.',
        path: '/admin/abacuruzi',
      });
    }
    if (snapshot.products.active === 0 && snapshot.shops.approved > 0) {
      items.push({
        title: 'Reba ibicuruzwa by’amaduka',
        detail: 'Hari amaduka yemejwe ariko nta bicuruzwa biri ku isoko.',
        path: '/admin/ibicuruzwa',
      });
    }
    if (snapshot.coverage.shops === 0 || snapshot.coverage.sellers === 0) {
      items.push({
        title: 'Tegura kwakira abacuruzi ba mbere',
        detail: 'Database y’igerageza ntirimo amaduka cyangwa abacuruzi nyakuri.',
        path: '/admin/abacuruzi',
      });
    }
    if (noLiveActivity) {
      items.push({
        title: 'Tegura gukurikirana traffic',
        detail: 'Nta mibare y’abasura amaduka yanditswe mu minsi 30 ishize.',
        path: '/admin',
      });
    }
    return items;
  }, [snapshot, noLiveActivity]);

  const ask = (value: string) => {
    setQuestion(value);
    if (snapshot) setAnswer(answerQuestion(value, snapshot));
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (snapshot && question.trim()) setAnswer(answerQuestion(question, snapshot));
  };

  if (loading && !snapshot) {
    return <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Turimo gusoma imibare nyayo ya ISOKO...</section>;
  }

  if (error && !snapshot) {
    return (
      <section className="mt-6 rounded-2xl border border-rose-200 bg-white p-6">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button type="button" onClick={() => void refresh()} className="mt-3 min-h-10 rounded-xl bg-[#0B6E4F] px-4 text-sm font-semibold text-white">Ongera ugerageze</button>
      </section>
    );
  }

  if (!snapshot) return null;

  const metrics = [
    { label: 'Abacuruzi', value: fmt(snapshot.sellers.total), detail: fmt(snapshot.sellers.pending) + ' bategereje', icon: Store },
    { label: 'Amaduka', value: fmt(snapshot.shops.approved), detail: fmt(snapshot.shops.pending) + ' ategereje', icon: Activity },
    { label: 'Ibicuruzwa biri ku isoko', value: fmt(snapshot.products.active), detail: fmt(snapshot.products.total) + ' byose', icon: BarChart3 },
    { label: 'Ibirego bishya', value: fmt(snapshot.reports.new), detail: fmt(snapshot.reports.total) + ' byose', icon: AlertCircle },
  ];

  return (
    <section className="mt-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#0B6E4F]">ISOKO · ADMIN INTELLIGENCE</p>
          <h2 className="mt-1 text-xl font-bold text-[#1B1F23]">Ishakiro ry’Ubuyobozi</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Baza uko amaduka, abacuruzi, ibicuruzwa n’ibibazo bihagaze. Ibisubizo biva muri database ya ISOKO kandi bigaragaza aho amakuru akiri make.
          </p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 disabled:opacity-50">
          <RefreshCw className={'h-4 w-4 ' + (loading ? 'animate-spin' : '')} /> Vugurura imibare
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">{label}</p>
              <Icon className="h-4 w-4 text-[#0B6E4F]" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#1B1F23]">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{detail}</p>
          </article>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-[#0B6E4F]" />
          <h3 className="text-base font-bold text-[#1B1F23]">Baza ikibazo cy’urubuga</h3>
        </div>
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Urugero: Ni ayahe maduka afite ibirego byinshi?"
            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/15"
          />
          <button type="submit" className="min-h-12 rounded-xl bg-[#0B6E4F] px-5 text-sm font-semibold text-white hover:bg-[#08553D]">Shakisha</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((item) => (
            <button key={item} type="button" onClick={() => ask(item)} className="min-h-9 rounded-full border border-slate-200 bg-[#F8FAF9] px-3 text-xs font-medium text-slate-700 hover:border-[#0B6E4F]">{item}</button>
          ))}
        </div>

        {answer && (
          <div className="mt-5 rounded-2xl bg-[#F1F6F3] p-4 sm:p-5">
            <div className="flex items-start gap-2">
              <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#0B6E4F]" />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#1B1F23]">{answer.title}</h4>
                <p className="mt-1 text-sm leading-6 text-slate-700">{answer.body}</p>
                <ul className="mt-3 space-y-1.5">
                  {answer.facts.map((fact) => <li key={fact} className="text-sm text-slate-800">• {fact}</li>)}
                </ul>
                {answer.caution && <p className="mt-3 rounded-xl border border-amber-200 bg-white p-3 text-xs leading-5 text-amber-900">{answer.caution}</p>}
                {answer.path && <button type="button" onClick={() => onNavigate(answer.path!)} className="mt-3 min-h-10 rounded-xl border border-[#0B6E4F] bg-white px-4 text-xs font-semibold text-[#0B6E4F]">Fungura icyo gice</button>}
              </div>
            </div>
          </div>
        )}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-bold text-[#1B1F23]">Ibyihutirwa n’inama zishingiye ku mibare</h3>
        {recommendations.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#F8FAF9] p-3 text-sm text-slate-600">Nta kibazo cyihariye cyagaragaye mu mibare iriho. Komeza gukurikirana ibishya uko urubuga ruzatangira gukoreshwa.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {recommendations.map((item) => (
              <button key={item.title} type="button" onClick={() => onNavigate(item.path)} className="rounded-xl border border-slate-200 p-3 text-left hover:border-[#0B6E4F]">
                <p className="text-sm font-semibold text-[#1B1F23]">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-700" />
            <h3 className="text-base font-bold text-[#1B1F23]">Amaduka asaba igenzura</h3>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">Urutonde rushingiye ku birego byanditswe. Ntirwemeza ko iduka rifite amakosa.</p>
          {snapshot.riskShops.length === 0 ? (
            <p className="mt-4 rounded-xl bg-[#F8FAF9] p-4 text-sm text-slate-600">Nta raporo z’amaduka zirandikwa.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {snapshot.riskShops.slice(0, 6).map((shop) => (
                <div key={shop.shopId} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[#1B1F23]">{shop.shopName}</p>
                    <span className="text-xs font-semibold text-amber-800">{fmt(shop.openReports)} bifunguye / {fmt(shop.totalReports)} byose</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{shop.sellerName} · {shop.district}</p>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => onNavigate('/admin/ibirego')} className="mt-3 min-h-10 rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700">Reba ibirego</button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#0B6E4F]" />
            <h3 className="text-base font-bold text-[#1B1F23]">Amaduka akurura abantu</h3>
          </div>
          {snapshot.topShops.length === 0 ? (
            <p className="mt-4 rounded-xl bg-[#F8FAF9] p-4 text-sm text-slate-600">Amaduka yemejwe n’imibare yayo bizagaragara hano.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {snapshot.topShops.slice(0, 6).map((shop, index) => (
                <div key={shop.shopId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1B1F23]">{index + 1}. {shop.shopName}</p>
                    <p className="text-xs text-slate-500">{shop.district} · {fmt(shop.views)} views</p>
                  </div>
                  <p className="text-xs font-semibold text-[#0B6E4F]">{fmt(shop.waClicks)} WhatsApp</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-bold text-[#1B1F23]">Ibicuruzwa bikurura abantu</h3>
        <p className="mt-1 text-xs text-slate-500">Bigereranywa hakurikijwe views, WhatsApp clicks na cart adds mu minsi 30.</p>
        {snapshot.topProducts.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#F8FAF9] p-3 text-sm text-slate-600">Nta bicuruzwa cyangwa traffic ihagije iraboneka ubu.</p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {snapshot.topProducts.slice(0, 10).map((product, index) => (
              <article key={product.productId} className="rounded-xl border border-slate-100 p-3">
                <p className="text-sm font-semibold text-[#1B1F23]">{index + 1}. {product.productName}</p>
                <p className="mt-1 text-xs text-slate-500">{product.shopName} · {product.district}</p>
                <p className="mt-1 text-xs font-medium text-[#0B6E4F]">{fmt(product.views)} views · {fmt(product.waClicks)} WhatsApp · {fmt(product.cartAdds)} cart adds</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <h3 className="text-base font-bold text-[#1B1F23]">Ibyiciro by’ibirego</h3>
        {snapshot.reportsByType.length === 0 ? (
          <p className="mt-3 rounded-xl bg-[#F8FAF9] p-3 text-sm text-slate-600">Nta birego birabikwa.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {snapshot.reportsByType.map((item) => (
              <div key={item.type} className="rounded-xl border border-slate-100 bg-[#F8FAF9] px-3 py-2">
                <p className="text-xs text-slate-600">{item.type}</p>
                <p className="text-lg font-bold tabular-nums text-[#1B1F23]">{fmt(item.count)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
        <p className="font-semibold text-[#1B1F23]">Icyo iri shakiro rizi n’aho rigarukira</p>
        <p className="mt-1">Amakuru y’ibarurishamibare asomwa muri database. Igihe nta bikorwa byanditswe, risubiza ko nta makuru ahari aho guhimba ibisubizo.</p>
        {noLiveActivity && <p className="mt-1 text-amber-800">Kugeza ubu nta mibare ya traffic yanditswe muri iyi database.</p>}
        <p className="mt-1">Generative AI model ntirafungurwa kuko Neon AI Gateway isaba prepaid credits. Nta mafaranga yakoreshejwe cyangwa yemejwe muri iyi mirimo.</p>
        {error && <p className="mt-1 text-rose-700">{error} · Amakuru werekwa ni ayo iheruka gusomwa.</p>}
        <p className="mt-2">Ibarura ryasomwe: {new Date(snapshot.generatedAt).toLocaleString('rw-RW')} · Igihe cyasuzumwe: iminsi 30.</p>
      </div>
    </section>
  );
};
