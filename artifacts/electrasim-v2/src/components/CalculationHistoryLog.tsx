import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  Zap, 
  FileJson,
  X,
  Filter
} from 'lucide-react';

export interface CalculationLogEntry {
  id: string;
  timestamp: string;
  toolId: string;
  toolName: string;
  summary: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  standardsRef?: string;
}

export interface CalculationHistoryLogProps {
  history: CalculationLogEntry[];
  onClearHistory: () => void;
  onSelectEntry?: (entry: CalculationLogEntry) => void;
  onRemoveEntry?: (id: string) => void;
  isDark?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export const CalculationHistoryLog: React.FC<CalculationHistoryLogProps> = ({
  history,
  onClearHistory,
  onSelectEntry,
  onRemoveEntry,
  isDark = true,
  isOpen = false,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedToolFilter, setSelectedToolFilter] = useState<string>('all');

  const copyToClipboard = (entry: CalculationLogEntry) => {
    const payload = JSON.stringify(entry, null, 2);
    navigator.clipboard.writeText(payload);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadJson = (entry: CalculationLogEntry) => {
    const payload = JSON.stringify(entry, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrasim-${entry.toolId}-${entry.id.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllHistory = () => {
    const payload = JSON.stringify(history, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `electrasim-calculation-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.toolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTool = selectedToolFilter === 'all' || item.toolId === selectedToolFilter;
    return matchesSearch && matchesTool;
  });

  if (!isOpen) return null;

  return (
    <div
      id="calculation-history-modal"
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 animate-fade-in"
    >
      <div
        className={`w-full max-w-lg h-full max-h-[92vh] border rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <History size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2 font-mono">
                Calculation History Log
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono">
                  {history.length} saved
                </span>
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Recent electrical specification logs & exports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {history.length > 0 && (
              <button
                type="button"
                onClick={downloadAllHistory}
                className={`p-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}
                title="Download full history JSON"
              >
                <Download size={13} />
                Export
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className={`p-3 border-b flex gap-2 ${isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="relative flex-1">
            <Search size={14} className={`absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter history..."
              className={`w-full pl-8 pr-3 py-1.5 border rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className={`px-2.5 py-1.5 border rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border-rose-800/80'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
              }`}
              title="Clear all history"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredHistory.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-center p-6 border border-dashed rounded-2xl ${
              isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
            }`}>
              <Zap size={32} className="mb-2 opacity-50 text-amber-500" />
              <p className="text-xs font-bold font-mono">No calculation history found</p>
              <p className="text-[11px] mt-1 max-w-xs">
                Perform calculations in any electrical tool to automatically record parameters and specification logs.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all hover:border-amber-500/50 ${
                  isDark ? 'bg-slate-950 border-slate-800/90' : 'bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.toolName}
                    </span>
                    <span className={`text-[10px] font-mono ml-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {item.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(item)}
                      className={`p-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                        copiedId === item.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Copy JSON"
                    >
                      {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadJson(item)}
                      className={`p-1 rounded-lg border text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer ${
                        isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Download JSON file"
                    >
                      <Download size={12} />
                    </button>

                    {onRemoveEntry && (
                      <button
                        type="button"
                        onClick={() => onRemoveEntry(item.id)}
                        className={`p-1 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
                          isDark ? 'bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border-slate-800' : 'bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border-slate-300'
                        }`}
                        title="Delete log"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <p className={`text-xs font-semibold leading-snug ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {item.summary}
                </p>

                {item.standardsRef && (
                  <p className="text-[10px] font-mono text-amber-500/90 mt-1">
                    Standard: {item.standardsRef}
                  </p>
                )}

                {/* Outputs breakdown preview */}
                <div className={`mt-2 p-2 rounded-lg text-[11px] font-mono grid grid-cols-2 gap-1.5 ${
                  isDark ? 'bg-slate-900/80 text-slate-300 border border-slate-800/50' : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  {Object.entries(item.outputs).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>{k}: </span>
                      <strong className="text-amber-400">{String(v)}</strong>
                    </div>
                  ))}
                </div>

                {onSelectEntry && (
                  <button
                    type="button"
                    onClick={() => onSelectEntry(item)}
                    className={`mt-2.5 w-full py-1 px-2 rounded-lg text-[11px] font-mono font-bold flex items-center justify-center gap-1 border transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/30'
                        : 'bg-white hover:bg-slate-100 text-amber-700 border-amber-300'
                    }`}
                  >
                    Restore To Calculator
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`p-3 border-t text-center text-[10px] font-mono ${
          isDark ? 'border-slate-800 bg-slate-950/80 text-slate-500' : 'border-slate-100 bg-slate-50 text-slate-400'
        }`}>
          ElectraSim-V2 History Engine • Standard JSON Spec Format
        </div>
      </div>
    </div>
  );
};

export default CalculationHistoryLog;
