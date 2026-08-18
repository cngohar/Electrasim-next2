import React, { useState } from 'react';
import { 
  X, 
  FolderPlus, 
  FileText, 
  Printer, 
  Download, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Building2, 
  User, 
  Calendar, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CalculationLogEntry } from './CalculationHistoryLog';

interface ProjectWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  historyEntries: CalculationLogEntry[];
  onClearHistory: () => void;
  isDark: boolean;
}

export const ProjectWorkspaceModal: React.FC<ProjectWorkspaceModalProps> = ({
  isOpen,
  onClose,
  historyEntries,
  onClearHistory,
  isDark
}) => {
  const [projectName, setProjectName] = useState('New Electrical Installation Project');
  const [clientName, setClientName] = useState('Client / Facility Manager');
  const [engineerName, setEngineerName] = useState('Lead Electrical Engineer');
  const [projectLocation, setProjectLocation] = useState('Site Job 104, Building B');
  const [notes, setNotes] = useState('All calculations verified in compliance with NEC NFPA 70 / BS 7671 standards.');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const reportData = {
      project: {
        name: projectName,
        client: clientName,
        engineer: engineerName,
        location: projectLocation,
        date: new Date().toISOString(),
        notes
      },
      calculations: historyEntries
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${projectName.toLowerCase().replace(/\s+/g, '_')}_submittal.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Building2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Project Workspace
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {historyEntries.length} Circuits / Sizing Records
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif mt-0.5">
                Engineering Submittal & Project Dossier
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Meta details */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className={`p-4 rounded-2xl border grid sm:grid-cols-2 gap-3 text-xs ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Project / Job Name:</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Client / Facility:</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Design Engineer / Inspector:</label>
              <input
                type="text"
                value={engineerName}
                onChange={(e) => setEngineerName(e.target.value)}
                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Site Location:</label>
              <input
                type="text"
                value={projectLocation}
                onChange={(e) => setProjectLocation(e.target.value)}
                className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-bold"
              />
            </div>
          </div>

          {/* Included Calculations List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <FileText size={16} className="text-blue-500" />
                <span>Included Circuit Calculations ({historyEntries.length})</span>
              </h3>
              {historyEntries.length > 0 && (
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 size={13} />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {historyEntries.length === 0 ? (
              <div className="p-8 text-center border rounded-2xl border-dashed border-slate-300 dark:border-slate-800 text-slate-400">
                <Sparkles size={28} className="mx-auto mb-2 text-blue-500 opacity-40" />
                <p className="text-xs font-semibold">No calculations added to project dossier yet</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Perform any calculation in the tools and click "Save Calculation to History" to bundle it here.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {historyEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold truncate">{entry.toolName}</div>
                        <div className="text-[11px] text-slate-400 truncate">{entry.summary}</div>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compliance & Sign-off Stamp Preview */}
          <div className={`p-4 rounded-2xl border border-emerald-500/30 text-xs space-y-2 ${
            isDark ? 'bg-emerald-950/20 text-emerald-300' : 'bg-emerald-50/50 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Engineering Compliance & Quality Assurance Stamp:</span>
            </div>
            <p className="text-[11px] text-slate-400">
              This submittal packet compiles calculation logs generated with ElectraSim v2 under IEEE, NEC NFPA 70, and BS 7671 formulas.
            </p>
          </div>
        </div>

        {/* Export Action Strip */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-xs text-slate-400 font-mono">
            ElectraSim Submittal Dossier Generator
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} />
              <span>Export JSON</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
