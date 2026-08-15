import React from 'react';
import { AlertTriangle, X, RefreshCw, Info } from 'lucide-react';

export interface CalculationErrorProps {
  error: string | null;
  title?: string;
  suggestion?: string;
  onDismiss?: () => void;
  onReset?: () => void;
  isDark?: boolean;
  className?: string;
}

export const CalculationError: React.FC<CalculationErrorProps> = ({
  error,
  title = 'Invalid Input Parameter',
  suggestion,
  onDismiss,
  onReset,
  isDark = true,
  className = '',
}) => {
  if (!error) return null;

  return (
    <div
      id="calculation-error-alert"
      className={`p-3.5 rounded-xl border transition-all animate-fade-in shadow-lg ${
        isDark
          ? 'bg-rose-950/80 border-rose-800/80 text-rose-100'
          : 'bg-rose-50 border-rose-200 text-rose-900'
      } ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${isDark ? 'bg-rose-900/60 text-rose-300' : 'bg-rose-100 text-rose-600'}`}>
          <AlertTriangle size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-bold uppercase tracking-wider font-mono text-rose-400">
              {title}
            </h5>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-rose-900/50 text-rose-300' : 'hover:bg-rose-100 text-rose-600'
                }`}
                title="Dismiss warning"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <p className="text-xs font-semibold mt-1 leading-snug">
            {error}
          </p>

          {suggestion && (
            <div className={`mt-2 text-[11px] flex items-start gap-1.5 p-2 rounded-lg font-mono ${
              isDark ? 'bg-rose-950/90 text-rose-200 border border-rose-800/40' : 'bg-rose-100/70 text-rose-800 border border-rose-200'
            }`}>
              <Info size={13} className="shrink-0 mt-0.5" />
              <span>{suggestion}</span>
            </div>
          )}

          {onReset && (
            <div className="mt-2.5 flex justify-end">
              <button
                type="button"
                onClick={onReset}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                  isDark
                    ? 'bg-rose-900 hover:bg-rose-800 text-white border border-rose-700'
                    : 'bg-rose-600 hover:bg-rose-700 text-white'
                }`}
              >
                <RefreshCw size={12} />
                Reset Defaults
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculationError;
