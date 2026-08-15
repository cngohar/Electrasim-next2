import React, { useState } from 'react';
import { Copy, Download, Bookmark, Check, Share2, FileJson } from 'lucide-react';

export interface ResultExportActionsProps {
  toolId: string;
  toolName: string;
  summary: string;
  inputs: Record<string, any>;
  outputs: Record<string, any>;
  standardsRef?: string;
  onSaveToHistory?: (entryPayload: any) => void;
  isDark?: boolean;
  className?: string;
}

export const ResultExportActions: React.FC<ResultExportActionsProps> = ({
  toolId,
  toolName,
  summary,
  inputs,
  outputs,
  standardsRef,
  onSaveToHistory,
  isDark = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const exportPayload = {
    app: 'ElectraSim-V2 Electrical Assistant',
    toolId,
    toolName,
    timestamp: new Date().toLocaleString(),
    summary,
    standardsRef: standardsRef || 'BS 7671 / IEC 60364 / NEC',
    inputs,
    outputs,
  };

  const handleCopy = () => {
    const text = `⚡ ${toolName} Specification\n` +
      `Summary: ${summary}\n` +
      `Standard: ${exportPayload.standardsRef}\n` +
      `Timestamp: ${exportPayload.timestamp}\n\n` +
      `OUTPUTS:\n` +
      Object.entries(outputs).map(([k, v]) => `- ${k}: ${v}`).join('\n') +
      `\n\nINPUTS:\n` +
      Object.entries(inputs).map(([k, v]) => `- ${k}: ${v}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const payloadStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([payloadStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${toolId}-calculation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveHistory = () => {
    if (onSaveToHistory) {
      onSaveToHistory({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolId,
        toolName,
        summary,
        inputs,
        outputs,
        standardsRef,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div
      id={`result-export-actions-${toolId}`}
      className={`flex items-center gap-1.5 flex-wrap ${className}`}
    >
      {/* Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
          copied
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            : isDark
            ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80 shadow-2xs'
            : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
        }`}
        title="Copy calculation summary to clipboard"
      >
        {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
        <span>{copied ? 'Copied Specs!' : 'Copy Specs'}</span>
      </button>

      {/* Download JSON Button */}
      <button
        type="button"
        onClick={handleDownloadJson}
        className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/30 shadow-2xs'
            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-2xs'
        }`}
        title="Download JSON specification file"
      >
        <Download size={13} />
        <span>Download JSON</span>
      </button>

      {/* Save to History Button */}
      {onSaveToHistory && (
        <button
          type="button"
          onClick={handleSaveHistory}
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
            saved
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : isDark
              ? 'bg-slate-900 hover:bg-slate-800 text-purple-400 border-purple-500/30 shadow-2xs'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-300 shadow-2xs'
          }`}
          title="Save calculation to history log"
        >
          {saved ? <Check size={13} className="text-emerald-400" /> : <Bookmark size={13} />}
          <span>{saved ? 'Saved to Log!' : 'Save Log'}</span>
        </button>
      )}
    </div>
  );
};

export default ResultExportActions;
