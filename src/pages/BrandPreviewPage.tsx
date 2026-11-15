import React from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import {
  AuthBrandHeader,
  ImigongoHeroCorner,
  IsokoWordmarkOptionA,
  IsokoWordmarkOptionB,
  IsokoWordmarkOptionC,
  RwandanGeometricPattern,
} from '../components/IsokoLogo';
import { useMarketplace } from '../context/MarketplaceContext';

export const BrandPreviewPage: React.FC = () => {
  const { navigate } = useMarketplace();

  const wordmarkChoices = [
    {
      id: 'A',
      name: 'Hitamo A — Irimo diyama itukura muri "o"',
      note: 'Inyuguti ya "o" ya nyuma irimo akamenyetso k’imigongo gatukura (#C0392B). Karoroha kumenyekana niyo kari gato muri 24px.',
      active: true,
      render: (variant: 'default' | 'white') => (
        <IsokoWordmarkOptionA
          variant={variant}
          markClassName="h-8 w-8"
          wordmarkClassName="h-6 w-auto"
        />
      ),
    },
    {
      id: 'B',
      name: 'Hitamo B — Igisenge cy’isoko kuri "k"',
      note: 'Hejuru ya "k" hari igisenge cy’iduka ry’isoko rifite akayoboro k’icyatsi n’umutuku. Bigaragaza ubucuruzi ako kanya.',
      active: false,
      render: (variant: 'default' | 'white') => (
        <IsokoWordmarkOptionB
          variant={variant}
          markClassName="h-8 w-8"
          wordmarkClassName="h-7 w-auto"
        />
      ),
    },
    {
      id: 'C',
      name: 'Hitamo C — Umurongo w’Imigongo munsi',
      note: 'Ijambo "isoko" rishimangiwe n’umurongo muto w’imigongo utukura hasi yaryo.',
      active: false,
      render: (variant: 'default' | 'white') => (
        <IsokoWordmarkOptionC
          variant={variant}
          markClassName="h-8 w-8"
          wordmarkClassName="h-7 w-auto"
        />
      ),
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#0B6E4F]">
            ISOKO · Brand Preview (§9)
          </p>
          <h1 className="text-[20px] font-semibold leading-[26px] text-[#1B1F23]">
            Isuzuma ry’ibirango (Wordmarks 3 n’Imigongo ya SVG)
          </h1>
          <p className="mt-1 text-xs text-[#6B7280]">
            Uru rupapuro rwereka uko ikirango n’imigongo ya Kinyarwanda bigaragara ku mabara y’icyatsi n’umweru.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#1B1F23] hover:border-[#0B6E4F]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Subira ahabanza</span>
        </button>
      </div>

      {/* 3 Wordmark Options */}
      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-[#1B1F23]">
          1. Amahitamo 3 ya Wordmark (SVG yashushanyijwe)
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {wordmarkChoices.map((opt) => (
            <article
              key={opt.id}
              className="overflow-hidden rounded-lg border border-[#E5E7EB] bg-white flex flex-col"
            >
              <div className="p-4 border-b border-[#E5E7EB]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1B1F23]">{opt.name}</span>
                  {opt.active && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#E8F3EE] px-1.5 py-0.5 text-[10px] font-semibold text-[#0B6E4F]">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      <span>Ikoreshwa</span>
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-[#6B7280]">{opt.note}</p>
              </div>

              {/* Light surface */}
              <div className="flex flex-1 flex-col justify-center gap-3 p-5 bg-white">
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-[#6B7280]">
                  Kuri fondo y’umweru
                </span>
                <div>{opt.render('default')}</div>
              </div>

              {/* Forest green surface */}
              <div className="flex flex-1 flex-col justify-center gap-3 p-5 bg-[#0B6E4F]">
                <span className="text-[10.5px] font-medium uppercase tracking-wider text-[#E8F3EE]/80">
                  Kuri fondo y’icyatsi (#0B6E4F)
                </span>
                <div>{opt.render('white')}</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Authentic 48x12px Imigongo Applications */}
      <section className="space-y-4">
        <h2 className="text-[15px] font-semibold text-[#1B1F23]">
          2. Imigongo ya SVG (48×12px) aho ikoreshwa hose
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-[#1B1F23]">(a) Umurongo wo munsi ya Header (8px, 100%)</p>
            <RwandanGeometricPattern size="header" />
            <p className="text-xs font-semibold text-[#1B1F23] pt-2">(b) Umurongo wo hejuru ya Footer (12px, 100%)</p>
            <RwandanGeometricPattern size="footer" />
          </div>

          <div className="relative overflow-hidden rounded-lg border border-[#E5E7EB] bg-white p-4 min-h-[120px] flex flex-col justify-center">
            <p className="text-xs font-semibold text-[#1B1F23] relative z-10">
              (c) Imfuruka y’ahabanza (Hero 120px · opacity 14%)
            </p>
            <p className="mt-1 text-xs text-[#6B7280] relative z-10 max-w-xs">
              Ishyirwa mu mfuruka y’iburyo kugira ngo itabangamira gusoma.
            </p>
            <ImigongoHeroCorner className="absolute right-0 top-0" />
          </div>
        </div>

        <AuthBrandHeader
          title="(d) Umutwe wa Auth w’icyatsi (#0B6E4F) ku mapaji ya /injira na /abacuruzi"
          subtitle="Urefu 96–112px hamwe n’imigongo y’umweru n’umutuku ku mpera."
        />

        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
          <div className="imigongo-surface h-28 flex items-center justify-center px-4 text-center">
            <p className="rounded bg-[#064E3B]/85 px-3 py-1.5 text-xs font-semibold text-white">
              (e) Ifoto ya Banner y’iduka ry’umucuruzi mu gihe atarashyiraho cover ye
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
