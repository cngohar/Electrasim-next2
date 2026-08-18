import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bookmark, 
  Star, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Play, 
  Sparkles, 
  Search, 
  Battery, 
  Layers, 
  Cpu, 
  Zap, 
  Sliders, 
  Scale, 
  Check, 
  AlertCircle,
  Tag,
  Copy
} from 'lucide-react';
import { 
  ScenarioItem, 
  getSavedScenarios, 
  saveScenario, 
  toggleScenarioBookmark, 
  deleteScenario, 
  exportScenariosAsJson, 
  importScenariosFromJson 
} from '@/lib/scenarioStorage';

interface ScenarioBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  activeToolId?: string | null;
  currentToolState?: Record<string, any>;
  onLoadScenario: (scenario: ScenarioItem) => void;
}

export const ScenarioBookmarksModal: React.FC<ScenarioBookmarksModalProps> = ({
  isOpen,
  onClose,
  isDark,
  activeToolId,
  currentToolState,
  onLoadScenario
}) => {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [filterTool, setFilterTool] = useState<string>(activeToolId || 'all');
  const [onlyBookmarks, setOnlyBookmarks] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Save New Scenario Form State
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newTags, setNewTags] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setScenarios(getSavedScenarios());
      if (activeToolId) {
        setFilterTool(activeToolId);
      }
    }
  }, [isOpen, activeToolId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isOpen) return null;

  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = toggleScenarioBookmark(id);
    setScenarios(updated);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteScenario(id);
    setScenarios(updated);
    showToast('Scenario removed from local storage');
  };

  const handleSaveCurrentAsScenario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (!currentToolState || !activeToolId) {
      showToast('No active tool state found to save');
      return;
    }

    const tagsArray = newTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const saved = saveScenario({
      title: newTitle.trim(),
      description: newDescription.trim(),
      toolId: activeToolId,
      isBookmarked: true,
      tags: tagsArray,
      state: currentToolState
    });

    setScenarios(getSavedScenarios());
    setIsCreating(false);
    setNewTitle('');
    setNewDescription('');
    setNewTags('');
    showToast(`Saved "${saved.title}" successfully!`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = importScenariosFromJson(content);
      if (result.success) {
        setScenarios(getSavedScenarios());
        showToast(`Imported ${result.count} scenarios!`);
      } else {
        showToast(`Import error: ${result.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Filtered list
  const filteredScenarios = scenarios.filter(s => {
    const matchesTool = filterTool === 'all' || s.toolId === filterTool;
    const matchesStar = !onlyBookmarks || s.isBookmarked;
    const matchesQuery = !searchQuery.trim() || 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTool && matchesStar && matchesQuery;
  });

  const getToolBadge = (toolId: string) => {
    switch (toolId) {
      case 'battery_backup':
        return { label: '🔋 Battery & Inverter', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'conduit':
        return { label: '⭕ Conduit & Trunking', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' };
      case 'cablesize':
        return { label: '🔌 Cable Sizer', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'mcb_rcbo':
        return { label: '⚡ MCB / RCBO', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'threephase':
        return { label: '⚙️ Three-Phase PFC', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' };
      default:
        return { label: toolId, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold shadow-xs">
              <Bookmark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Local Storage Scenarios & Bookmarks
                </span>
                <span className="text-xs text-slate-400 font-mono">({scenarios.length} Saved)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif mt-0.5">
                Saved Simulation Scenarios & Presets
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export JSON */}
            <button
              type="button"
              onClick={() => exportScenariosAsJson(scenarios)}
              title="Export all scenarios to JSON"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Import JSON */}
            <label 
              title="Import scenarios from JSON"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">Import</span>
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toast alert */}
        {toastMessage && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between animate-in slide-in-from-top duration-150">
            <span>⚡ {toastMessage}</span>
            <button onClick={() => setToastMessage(null)}><X size={14} /></button>
          </div>
        )}

        {/* Toolbar & Filters */}
        <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-2.5 ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search scenarios or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none transition-all ${
                isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* Tool filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTool('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTool === 'all' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Tools
            </button>
            <button
              type="button"
              onClick={() => setFilterTool('battery_backup')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTool === 'battery_backup' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔋 Battery
            </button>
            <button
              type="button"
              onClick={() => setFilterTool('conduit')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTool === 'conduit' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ⭕ Conduit
            </button>
            <button
              type="button"
              onClick={() => setFilterTool('cablesize')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTool === 'cablesize' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🔌 Cable
            </button>
          </div>

          {/* Bookmarks Only Toggle */}
          <button
            type="button"
            onClick={() => setOnlyBookmarks(!onlyBookmarks)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              onlyBookmarks 
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-xs' 
                : isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star size={13} className={onlyBookmarks ? 'fill-slate-950' : ''} />
            <span>Favorites</span>
          </button>

          {/* Bookmark Current State Button */}
          {currentToolState && activeToolId && (
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Bookmark Current Simulation</span>
            </button>
          )}
        </div>

        {/* Save Current Simulation Form Modal Drawer */}
        {isCreating && currentToolState && activeToolId && (
          <form onSubmit={handleSaveCurrentAsScenario} className={`p-4 border-b space-y-3 animate-in slide-in-from-top-2 duration-150 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-amber-50/50 border-amber-200'
          }`}>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5 font-mono">
              <Sparkles size={14} />
              <span>Save Current {activeToolId} Setup to Local Storage</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Scenario Name / Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Solar Cabin LiFePO4 48V 15kWh"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tags (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Solar, 48V, Off-Grid, LiFePO4"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className={`w-full p-2 rounded-xl border text-xs outline-none ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Notes / Description (Optional)</label>
              <input
                type="text"
                placeholder="Key engineering observations or client specifications..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className={`w-full p-2 rounded-xl border text-xs outline-none ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-600 text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check size={14} />
                <span>Save Scenario Bookmark</span>
              </button>
            </div>
          </form>
        )}

        {/* Scenarios Grid List */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3">
          {filteredScenarios.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bookmark size={36} className="mx-auto opacity-30" />
              <div className="text-sm font-semibold">No scenarios match your search filters</div>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                Click "Bookmark Current Simulation" or choose another tool filter above.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3.5">
              {filteredScenarios.map((scenario) => {
                const badge = getToolBadge(scenario.toolId);
                const isCurated = scenario.id.startsWith('curated_');

                return (
                  <div
                    key={scenario.id}
                    className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between group hover:shadow-lg ${
                      isDark ? 'bg-slate-950/70 border-slate-800 hover:border-slate-600' : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      {/* Top row: Badge & Star */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}>
                          {badge.label}
                        </span>

                        <div className="flex items-center gap-1">
                          {isCurated && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              Industry Preset
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(scenario.id, e)}
                            title={scenario.isBookmarked ? 'Remove bookmark' : 'Bookmark as favorite'}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-400 cursor-pointer transition-colors"
                          >
                            <Star 
                              size={16} 
                              className={scenario.isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-slate-400'} 
                            />
                          </button>

                          {!isCurated && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(scenario.id, e)}
                              title="Delete scenario"
                              className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                        {scenario.title}
                      </h3>

                      {/* Description */}
                      {scenario.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                          {scenario.description}
                        </p>
                      )}

                      {/* Tags */}
                      {scenario.tags && scenario.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {scenario.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom action row */}
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(scenario.updatedAt).toLocaleDateString()}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          onLoadScenario(scenario);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer group-hover:scale-102"
                      >
                        <Play size={12} className="fill-white" />
                        <span>Load Simulation</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
