import { ArrowRight, BookOpenCheck, Braces, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import AssistantShell from './components/AssistantShell';
import { ASSISTANT_TOOLS } from './toolCatalog';
import { useAssistantRuntime } from './useAssistantRuntime';
import { usePageSeo } from './usePageSeo';

const HUB_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'ElectraSim Electrical Engineering Assistant',
  description: 'A collection of eight free browser-based electrical engineering calculators.',
  url: 'https://electrasim.com/assistant',
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: ASSISTANT_TOOLS.map((tool, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tool.name,
      url: `https://electrasim.com${tool.path}`,
    })),
  },
};

export default function AssistantHub() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;

  usePageSeo({
    title: 'Electrical Engineering Calculators & Assistant | ElectraSim',
    description: 'Use eight free electrical engineering tools for cable sizing, voltage drop, loads, Ohm’s law, circuit protection, three-phase power, energy cost and unit conversion.',
    path: '/assistant',
    keywords: ['electrical calculator', 'engineering assistant', 'cable sizing', 'voltage drop', 'Ohms law'],
    schema: HUB_SCHEMA,
  });

  return (
    <AssistantShell runtime={runtime}>
      <section className={`relative overflow-hidden border-b ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
        <div className="pointer-events-none absolute inset-0 opacity-50" aria-hidden="true">
          <div className="absolute left-[10%] top-[-8rem] h-80 w-80 rounded-full bg-blue-500/15 blur-3xl" />
          <div className="absolute right-[8%] top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-[1600px] px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-4xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-blue-500">
              <Sparkles size={13} /> Eight focused engineering workspaces
            </div>
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Electrical calculations with the reasoning left visible.
            </h1>
            <p className={`mt-5 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Size conductors, estimate loads and protection, solve AC circuit values, compare energy costs, and inspect relevant systems in 3D. Each calculator has its own fast, shareable page.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-[10px] font-bold">
              {['No account', 'Runs in your browser', 'IEC & NEC datasets', 'JSON & report exports'].map((item) => (
                <span key={item} className={`rounded-full border px-3 py-1.5 ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{item}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-3 py-8 sm:px-5 sm:py-12" aria-labelledby="tool-grid-title">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500">Choose a workspace</p>
            <h2 id="tool-grid-title" className="mt-1 text-xl font-black sm:text-2xl">Engineering calculators</h2>
          </div>
          <p className={`max-w-md text-xs leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Dedicated routes keep each tool focused and load only the calculation and visualization code it needs.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ASSISTANT_TOOLS.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.id} href={tool.path} className={`group flex min-h-56 flex-col rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-xl hover:shadow-blue-500/5 ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-white'}`}>
                <div className="mb-5 flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-500/10 text-blue-500 transition group-hover:bg-blue-600 group-hover:text-white"><Icon size={21} /></span>
                  <span className={`font-mono text-[10px] font-bold ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>0{index + 1}</span>
                </div>
                <h3 className="text-sm font-bold">{tool.name}</h3>
                <p className={`mt-2 flex-1 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{tool.description}</p>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <span className={`truncate font-mono text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{tool.badge}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-500">Open <ArrowRight size={13} className="transition group-hover:translate-x-1" /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className={`border-y ${isDark ? 'border-slate-800 bg-slate-900/35' : 'border-slate-200 bg-white'}`}>
        <div className="mx-auto grid max-w-[1600px] gap-4 px-4 py-10 sm:px-5 md:grid-cols-3">
          {[
            { icon: BookOpenCheck, title: 'Transparent results', text: 'Supporting values, assumptions and diagnostics stay visible rather than hiding behind a single answer.' },
            { icon: Braces, title: 'Portable records', text: 'Save calculations to local history and export structured JSON or readable reports for later comparison.' },
            { icon: ShieldCheck, title: 'Engineering boundaries', text: 'Clear caveats distinguish educational estimation from code approval and professional design decisions.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className={`rounded-2xl border p-5 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
              <Icon size={20} className="text-emerald-500" />
              <h2 className="mt-3 text-sm font-bold">{title}</h2>
              <p className={`mt-1.5 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{text}</p>
            </div>
          ))}
        </div>
      </section>
    </AssistantShell>
  );
}
