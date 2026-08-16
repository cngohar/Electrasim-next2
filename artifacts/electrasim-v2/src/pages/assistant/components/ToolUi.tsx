import type { ReactNode, SelectHTMLAttributes } from 'react';
import { AlertTriangle, CheckCircle2, Info, Sparkles } from 'lucide-react';

export function Panel({
  children,
  className = '',
  isDark,
  as = 'section',
}: {
  children: ReactNode;
  className?: string;
  isDark: boolean;
  as?: 'section' | 'aside' | 'div';
}) {
  const Component = as;
  return (
    <Component className={`rounded-2xl border shadow-sm ${isDark ? 'border-slate-800 bg-slate-900/92' : 'border-slate-200 bg-white'} ${className}`}>
      {children}
    </Component>
  );
}

export function PanelHeading({
  icon,
  title,
  eyebrow,
  isDark,
}: {
  icon?: ReactNode;
  title: string;
  eyebrow?: string;
  isDark: boolean;
}) {
  return (
    <header className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-blue-500">{eyebrow}</p>}
        <h2 className={`flex items-center gap-2 text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{icon}{title}</h2>
      </div>
    </header>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 'any',
  help,
  isDark,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number | 'any';
  help?: string;
  isDark: boolean;
}) {
  return (
    <label className="block">
      <span className={`mb-1.5 flex items-center justify-between gap-2 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        <span>{label}</span>
        {unit && <span className="font-mono text-[10px] font-bold text-blue-500">{unit}</span>}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`h-10 w-full rounded-xl border px-3 font-mono text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 ${isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-300 bg-slate-50 text-slate-900'}`}
      />
      {help && <span className={`mt-1 block text-[10px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{help}</span>}
    </label>
  );
}

export function SelectField({
  label,
  isDark,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; isDark: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className={`mb-1.5 block text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</span>
      <select
        {...props}
        className={`h-10 w-full rounded-xl border px-3 text-xs font-semibold outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 ${isDark ? 'border-slate-700 bg-slate-950 text-white' : 'border-slate-300 bg-slate-50 text-slate-900'}`}
      >
        {children}
      </select>
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  isDark,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  isDark: boolean;
}) {
  return (
    <fieldset>
      <legend className={`mb-1.5 text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{label}</legend>
      <div className={`grid gap-1 rounded-xl border p-1 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-bold transition ${value === option.value ? 'bg-blue-600 text-white shadow-sm' : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PresetBar({ children, isDark }: { children: ReactNode; isDark: boolean }) {
  return (
    <div className={`rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-500">
        <Sparkles size={12} /> Example scenarios
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

export function PresetButton({ children, onClick, isDark }: { children: ReactNode; onClick: () => void; isDark: boolean }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold transition ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700'}`}>
      {children}
    </button>
  );
}

export function Metric({
  label,
  value,
  detail,
  tone = 'blue',
  isDark,
}: {
  label: string;
  value: string;
  detail?: string;
  tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'cyan';
  isDark: boolean;
}) {
  const tones = {
    blue: 'text-blue-500', emerald: 'text-emerald-500', amber: 'text-amber-500',
    rose: 'text-rose-500', purple: 'text-purple-500', cyan: 'text-cyan-500',
  };
  return (
    <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
      <p className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-1 font-mono text-lg font-bold ${tones[tone]}`}>{value}</p>
      {detail && <p className={`mt-0.5 text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{detail}</p>}
    </div>
  );
}

export function ResultStatus({
  ok,
  label,
  message,
  isDark,
}: {
  ok: boolean;
  label: string;
  message: string;
  isDark: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 ${ok ? isDark ? 'border-emerald-500/35 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50' : isDark ? 'border-rose-500/35 bg-rose-500/10' : 'border-rose-200 bg-rose-50'}`}>
      <div className={`flex items-center gap-2 text-xs font-bold ${ok ? 'text-emerald-500' : 'text-rose-500'}`}>
        {ok ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}{label}
      </div>
      <p className={`mt-1 text-[10px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{message}</p>
    </div>
  );
}

export function EngineeringNotice({ isDark }: { isDark: boolean }) {
  return (
    <div className={`flex gap-2 rounded-xl border px-3 py-2 text-[10px] leading-relaxed ${isDark ? 'border-amber-500/25 bg-amber-500/5 text-slate-400' : 'border-amber-200 bg-amber-50 text-slate-600'}`}>
      <Info size={14} className="mt-0.5 shrink-0 text-amber-500" />
      Educational engineering estimate. Verify final conductor, protection and installation decisions against the applicable code edition and a qualified designer.
    </div>
  );
}
