import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

interface FormulaCodeAccordionProps {
  title?: string;
  standardRef: string;
  formula: string;
  substitution: string;
  result: string;
  notes?: string;
  isDark?: boolean;
}

export const FormulaCodeAccordion: React.FC<FormulaCodeAccordionProps> = ({
  title = 'Engineering Formula & Code Calculation Steps',
  standardRef,
  formula,
  substitution,
  result,
  notes,
  isDark = true
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
    } overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen size={16} className="text-blue-500 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {title}
            </div>
            <div className="text-[10px] font-mono text-slate-400">
              Standard: {standardRef}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-[11px] font-mono">{isOpen ? 'Hide math' : 'Show math'}</span>
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {isOpen && (
        <div className={`p-4 border-t space-y-3 text-xs font-mono animate-in fade-in duration-150 ${
          isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
        }`}>
          <div>
            <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Governing Formula:</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold mt-1">
              {formula}
            </div>
          </div>

          <div>
            <span className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">Exact Step Substitution:</span>
            <div className="p-2.5 rounded-xl bg-slate-200/60 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-200 mt-1">
              {substitution}
            </div>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
            <span>Resultant Value:</span>
            <span>{result}</span>
          </div>

          {notes && (
            <p className="text-[10px] text-slate-400 font-sans leading-relaxed pt-1">
              ℹ️ {notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
