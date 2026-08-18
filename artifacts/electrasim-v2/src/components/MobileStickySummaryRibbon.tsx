import React from 'react';
import { Sparkles, ArrowUp, Box, Eye, CheckCircle2 } from 'lucide-react';

interface MobileStickySummaryRibbonProps {
  title: string;
  resultBadge: string;
  subText?: string;
  onInspect3D?: () => void;
  status?: 'pass' | 'warning' | 'info';
  isDark?: boolean;
}

export const MobileStickySummaryRibbon: React.FC<MobileStickySummaryRibbonProps> = ({
  title,
  resultBadge,
  subText,
  onInspect3D,
  status = 'pass',
  isDark = true
}) => {
  return (
    <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 animate-in slide-in-from-bottom-3 duration-200">
      <div className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 ${
        isDark 
          ? 'bg-slate-900/95 border-slate-700 text-white' 
          : 'bg-white/95 border-slate-200 text-slate-900'
      }`}>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase font-mono font-bold text-slate-400 truncate">
            {title}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`font-mono font-bold text-sm truncate ${
              status === 'pass' ? 'text-emerald-500' : status === 'warning' ? 'text-amber-500' : 'text-blue-500'
            }`}>
              {resultBadge}
            </span>
            {subText && (
              <span className="text-[10px] text-slate-400 truncate hidden xs:inline">
                {subText}
              </span>
            )}
          </div>
        </div>

        {onInspect3D && (
          <button
            type="button"
            onClick={onInspect3D}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
          >
            <Box size={13} />
            <span>3D View</span>
          </button>
        )}
      </div>
    </div>
  );
};
