import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  BookOpen,
  ChevronRight,
  Grid2X2,
  History,
  Home,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import CalculationHistoryLog from '@/components/CalculationHistoryLog';
import type { AssistantRuntime } from '../useAssistantRuntime';
import { ASSISTANT_TOOLS, type AssistantToolDefinition } from '../toolCatalog';

interface AssistantShellProps {
  runtime: AssistantRuntime;
  tool?: AssistantToolDefinition;
  children: ReactNode;
}

export default function AssistantShell({ runtime, tool, children }: AssistantShellProps) {
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const { isDark } = runtime;

  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    return () => { document.documentElement.style.colorScheme = ''; };
  }, [isDark]);

  const activeTool = tool;

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-xl ${isDark ? 'border-slate-800 bg-slate-950/92' : 'border-slate-200 bg-white/92'}`}>
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-2 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="ElectraSim home">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-black text-white shadow-lg shadow-blue-500/20">E</span>
              <span className="hidden text-sm font-black tracking-tight sm:block">ElectraSim</span>
            </Link>
            <ChevronRight size={14} className="hidden text-slate-500 sm:block" />
            <Link href="/assistant" className="truncate text-xs font-bold text-blue-500 hover:text-blue-400">
              Engineering Assistant
            </Link>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => runtime.setIsHistoryOpen(true)}
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-amber-500/50' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-400'}`}
              title="Calculation history"
            >
              <History size={15} /><span className="hidden md:inline">History</span>
              {runtime.history.length > 0 && <span className="font-mono text-[9px] text-amber-500">{runtime.history.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setIsHelpOpen(true)}
              className={`grid h-9 w-9 place-items-center rounded-xl border transition ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300 hover:border-blue-500/50' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400'}`}
              title="About these calculations"
              aria-label="About these calculations"
            >
              <BookOpen size={15} />
            </button>
            <button
              type="button"
              onClick={runtime.toggleTheme}
              className={`grid h-9 w-9 place-items-center rounded-xl border transition ${isDark ? 'border-slate-800 bg-slate-900 text-amber-400 hover:border-amber-500/50' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400'}`}
              aria-label={isDark ? 'Use light theme' : 'Use dark theme'}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button
              type="button"
              onClick={() => setIsToolMenuOpen((open) => !open)}
              className={`grid h-9 w-9 place-items-center rounded-xl border lg:hidden ${isDark ? 'border-slate-800 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-600'}`}
              aria-label="Open tool menu"
              aria-expanded={isToolMenuOpen}
            >
              {isToolMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        <nav aria-label="Assistant tools" className={`hidden border-t lg:block ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-5 py-1.5">
            <Link href="/assistant" className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold transition ${!activeTool ? 'bg-blue-600 text-white' : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
              <Grid2X2 size={13} /> All tools
            </Link>
            {ASSISTANT_TOOLS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTool?.id === item.id;
              return (
                <Link key={item.id} href={item.path} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-bold transition ${isActive ? 'bg-blue-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Icon size={13} />{item.shortName}
                </Link>
              );
            })}
          </div>
        </nav>

        {isToolMenuOpen && (
          <nav aria-label="Mobile assistant tools" className={`absolute inset-x-0 top-full border-b p-3 shadow-2xl lg:hidden ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/assistant" onClick={() => setIsToolMenuOpen(false)} className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${!activeTool ? 'border-blue-500 bg-blue-600 text-white' : isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <Grid2X2 size={15} /> All tools
              </Link>
              {ASSISTANT_TOOLS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.id} href={item.path} onClick={() => setIsToolMenuOpen(false)} className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-bold ${activeTool?.id === item.id ? 'border-blue-500 bg-blue-600 text-white' : isDark ? 'border-slate-800 bg-slate-900 text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                    <Icon size={15} />{item.shortName}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {activeTool && (
        <section className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/35' : 'border-slate-200 bg-white'}`}>
          <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500">{activeTool.eyebrow}</span>
                  <span className={`rounded-full border px-2 py-0.5 font-mono text-[9px] ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>{activeTool.badge}</span>
                </div>
                <h1 className="text-xl font-black tracking-tight sm:text-2xl">{activeTool.name}</h1>
                <p className={`mt-1 max-w-3xl text-xs leading-relaxed sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{activeTool.description}</p>
              </div>
              <div className={`flex shrink-0 items-center gap-1 rounded-xl border p-1 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}>
                {(['IEC', 'NEC'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => runtime.setStandard(item)}
                    aria-pressed={runtime.standard === item}
                    className={`rounded-lg px-3 py-1.5 font-mono text-[10px] font-bold transition ${runtime.standard === item ? 'bg-blue-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-slate-900' : 'text-slate-500 hover:bg-white'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <main>{children}</main>

      <footer className={`mt-8 border-t ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
        <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-3 px-4 py-6 text-[10px] sm:flex-row sm:items-center sm:px-5">
          <div>
            <p className="font-bold">ElectraSim Engineering Assistant</p>
            <p className={isDark ? 'text-slate-500' : 'text-slate-400'}>Browser-based educational calculations. No sign-up required.</p>
          </div>
          <div className="flex items-center gap-4 font-semibold text-blue-500">
            <Link href="/"><span className="flex items-center gap-1"><Home size={12} />Home</span></Link>
            <Link href="/assistant"><span className="flex items-center gap-1"><Grid2X2 size={12} />All calculators</span></Link>
          </div>
        </div>
      </footer>

      <CalculationHistoryLog
        history={runtime.history}
        onClearHistory={runtime.clearHistory}
        onSelectEntry={runtime.selectHistoryEntry}
        onRemoveEntry={runtime.removeHistoryEntry}
        isDark={isDark}
        isOpen={runtime.isHistoryOpen}
        onClose={() => runtime.setIsHistoryOpen(false)}
      />

      {isHelpOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="assistant-help-title">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <header className={`flex items-center justify-between border-b p-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-500">Calculation guidance</p>
                <h2 id="assistant-help-title" className="text-base font-bold">Using the Engineering Assistant</h2>
              </div>
              <button type="button" onClick={() => setIsHelpOpen(false)} className={`grid h-8 w-8 place-items-center rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} aria-label="Close help"><X size={15} /></button>
            </header>
            <div className={`space-y-3 p-4 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <p>Choose the IEC or NEC dataset where offered, enter known design values, and review both the main result and its supporting diagnostics. Results update immediately as inputs change.</p>
              <p>Example scenario buttons are starting points, not design recommendations. Save a result to history when you want to compare or restore it later; export actions produce portable engineering records.</p>
              <p className={`rounded-xl border p-3 ${isDark ? 'border-amber-500/30 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>These tools are educational estimates and do not replace code verification, installation instructions, manufacturer data, or professional engineering judgment.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
