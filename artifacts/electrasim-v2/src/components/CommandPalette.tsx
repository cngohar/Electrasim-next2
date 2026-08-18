import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Command, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Battery, 
  Box, 
  ShieldCheck, 
  Activity, 
  Gauge, 
  Sliders, 
  RotateCcw, 
  X, 
  Layers, 
  Globe2, 
  Clock, 
  FileText,
  Bookmark,
  Check
} from 'lucide-react';

export interface CommandItem {
  id: string;
  toolId?: string;
  title: string;
  category: 'Conductors & Sizing' | 'Power Systems & Storage' | 'Protection & Analysis' | 'Energy & Units' | 'Quick Presets' | 'Electrical Codes';
  description: string;
  badge?: string;
  icon: string;
  keywords: string[];
  actionType: 'tool' | 'preset' | 'standard' | 'action';
  payload?: any;
}

const COMMAND_ITEMS: CommandItem[] = [
  // 1. CONDUCTORS & SIZING
  {
    id: 'tool_cablesize',
    toolId: 'cablesize',
    title: 'Cable Size Calculator',
    category: 'Conductors & Sizing',
    description: 'Determine exact conductor size (AWG / mm²) for NEC & IEC standards with thermal derating.',
    badge: 'Core Tool',
    icon: '⚡',
    keywords: ['cable', 'wire', 'ampacity', 'gauge', 'derating', 'temperature', 'copper', 'aluminum', 'nec', 'iec'],
    actionType: 'tool'
  },
  {
    id: 'tool_voltagedrop',
    toolId: 'voltagedrop',
    title: 'Voltage Drop Calculator',
    category: 'Conductors & Sizing',
    description: 'Calculate voltage drop %, maximum allowable circuit run distance, and terminal voltages.',
    badge: '3% / 5% Limit',
    icon: '📉',
    keywords: ['voltage drop', 'distance', 'length', 'feeder', 'branch', 'loss', 'resistance', 'reactance'],
    actionType: 'tool'
  },
  {
    id: 'tool_wire',
    toolId: 'wire',
    title: 'AWG to mm² Metric Wire Converter',
    category: 'Conductors & Sizing',
    description: 'Direct bidirectional conversion between AWG/kcmil and metric mm² with resistance specs.',
    badge: 'Cross-Standard',
    icon: '📏',
    keywords: ['awg', 'metric', 'mm2', 'kcmil', 'conversion', 'cross-section', 'diameter', 'resistance'],
    actionType: 'tool'
  },
  {
    id: 'tool_conduit',
    toolId: 'conduit',
    title: 'Conduit & Trunking Fill Sizer',
    category: 'Conductors & Sizing',
    description: 'Determine raceway fill % (40%/45% limits), 3-wire jamming ratios, and 2D/3D packing.',
    badge: '2D/3D Packing',
    icon: '📦',
    keywords: ['conduit', 'trunking', 'fill', 'emt', 'pvc', 'rmc', 'jamming', 'packing', 'bundle', 'raceway'],
    actionType: 'tool'
  },

  // 2. POWER SYSTEMS & STORAGE
  {
    id: 'tool_battery_backup',
    toolId: 'battery_backup',
    title: 'Battery Backup & Inverter Sizer',
    category: 'Power Systems & Storage',
    description: 'Calculate backup runtime, reverse size battery banks (Ah/kWh), and view 3D energy flow.',
    badge: '3D Energy Flow',
    icon: '🔋',
    keywords: ['battery', 'inverter', 'backup', 'ups', 'lifepo4', 'agm', 'lead-acid', 'runtime', 'solar', 'storage'],
    actionType: 'tool'
  },
  {
    id: 'tool_threephase',
    toolId: 'threephase',
    title: 'Three-Phase Power Calculator',
    category: 'Power Systems & Storage',
    description: 'Solve active kW, apparent kVA, reactive kVAR, power factor, and neutral imbalance current.',
    badge: 'Delta / Wye',
    icon: '🔺',
    keywords: ['three phase', '3-phase', 'delta', 'wye', 'star', 'neutral', 'imbalance', 'power factor', 'kva', 'kvar'],
    actionType: 'tool'
  },
  {
    id: 'tool_loadcalc',
    toolId: 'loadcalc',
    title: 'Electrical Load Estimator',
    category: 'Power Systems & Storage',
    description: 'Calculate total connected load, demand diversity factors, and main panel sizing.',
    badge: 'NEC Art. 220',
    icon: '🏢',
    keywords: ['load', 'estimator', 'demand factor', 'panel', 'residential', 'commercial', 'watts', 'amps'],
    actionType: 'tool'
  },

  // 3. CIRCUIT PROTECTION & ANALYSIS
  {
    id: 'tool_mcb_rcbo',
    toolId: 'mcb_rcbo',
    title: 'MCB & RCBO Trip Curves',
    category: 'Protection & Analysis',
    description: 'Interactive time-current trip curves for Type B, C, D breakers and RCD earth leakage.',
    badge: 'Trip Curves',
    icon: '🛡️',
    keywords: ['mcb', 'rcbo', 'rcd', 'breaker', 'trip curve', 'type b', 'type c', 'type d', 'inrush', 'fault'],
    actionType: 'tool'
  },
  {
    id: 'tool_ohms',
    toolId: 'ohms',
    title: "Ohm's Law & AC Impedance Solver",
    category: 'Protection & Analysis',
    description: 'Interactive Ohm’s wheel, AC RLC series/parallel impedance, and power triangle solver.',
    badge: 'V = I × R',
    icon: '💡',
    keywords: ['ohms law', 'voltage', 'current', 'resistance', 'impedance', 'rlc', 'power triangle', 'reactance'],
    actionType: 'tool'
  },
  {
    id: 'tool_breaker',
    toolId: 'breaker',
    title: 'Circuit Breaker Sizer',
    category: 'Protection & Analysis',
    description: 'Select standard breaker amp ratings, conductor matching, and 125% continuous duty rule.',
    badge: '125% Rule',
    icon: '🔌',
    keywords: ['circuit breaker', 'overcurrent', 'ocpd', 'continuous', 'fuse', 'amps', 'rating'],
    actionType: 'tool'
  },

  // 4. ENERGY & MULTI-UNIT CONVERSION
  {
    id: 'tool_energycost',
    toolId: 'energycost',
    title: 'Energy Running Cost & CO₂',
    category: 'Energy & Units',
    description: 'Calculate daily, monthly, and annual operating costs ($/kWh) and greenhouse emissions.',
    badge: 'Cost & CO₂',
    icon: '💰',
    keywords: ['energy', 'cost', 'kwh', 'bill', 'carbon', 'co2', 'tariff', 'operating cost', 'electricity'],
    actionType: 'tool'
  },
  {
    id: 'tool_converter',
    toolId: 'converter',
    title: 'Multi-Unit Electrical Converter',
    category: 'Energy & Units',
    description: 'Convert seamlessly between Watts, Horsepower (HP), kW, kVA, Joules, and BTUs.',
    badge: 'HP ↔ kW ↔ kVA',
    icon: '🔄',
    keywords: ['converter', 'horsepower', 'hp', 'watts', 'kilowatts', 'kw', 'kva', 'btu', 'joules'],
    actionType: 'tool'
  },

  // 5. QUICK PRESETS
  {
    id: 'preset_ev_charger',
    toolId: 'cablesize',
    title: 'Preset: 48A Dedicated Level-2 EV Charger',
    category: 'Quick Presets',
    description: '60A Breaker, 6 AWG / 16 mm² Copper, 240V Continuous Duty calculation.',
    badge: '60A / 6 AWG',
    icon: '🚗',
    keywords: ['ev', 'tesla', 'charger', 'level 2', '48a', '60a', 'electric vehicle', 'preset'],
    actionType: 'preset',
    payload: { current: 48, voltage: 240, continuous: true, loadType: 'ev' }
  },
  {
    id: 'preset_home_service',
    toolId: 'cablesize',
    title: 'Preset: 200A Whole-Home Residential Service',
    category: 'Quick Presets',
    description: '2/0 AWG Copper or 4/0 AWG Aluminum 120/240V split-phase main feeder.',
    badge: '200A Service',
    icon: '🏠',
    keywords: ['200a', 'residential', 'service entrance', 'feeder', 'home', 'main breaker', 'preset'],
    actionType: 'preset',
    payload: { current: 200, voltage: 240, continuous: false }
  },
  {
    id: 'preset_subpanel_100a',
    toolId: 'cablesize',
    title: 'Preset: 100A Garage / Workshop Subpanel',
    category: 'Quick Presets',
    description: '3 AWG Copper / 1 AWG Aluminum feeder for 100ft detached outbuilding.',
    badge: '100A Feeder',
    icon: '🛠️',
    keywords: ['100a', 'subpanel', 'feeder', 'garage', 'workshop', 'preset'],
    actionType: 'preset',
    payload: { current: 100, voltage: 240, distance: 30 }
  },
  {
    id: 'preset_solar_battery',
    toolId: 'battery_backup',
    title: 'Preset: 10kWh Home Energy Storage Bank',
    category: 'Quick Presets',
    description: '48V 200Ah LiFePO4 battery bank powering 1,500W critical household loads.',
    badge: '48V 200Ah',
    icon: '☀️',
    keywords: ['solar', 'battery', 'storage', '10kwh', 'lifepo4', '48v', 'inverter', 'preset'],
    actionType: 'preset',
    payload: { systemVoltage: 48, batteryAh: 200, chemistry: 'lifepo4' }
  },
  {
    id: 'preset_motor_3phase',
    toolId: 'threephase',
    title: 'Preset: 50 HP 480V 3-Phase Industrial Motor',
    category: 'Quick Presets',
    description: '65A Full Load Amps (FLA) with 0.88 Power Factor inductive load.',
    badge: '50 HP @ 480V',
    icon: '⚙️',
    keywords: ['motor', '50 hp', '480v', '3-phase', 'industrial', 'fla', 'inductive', 'preset'],
    actionType: 'preset',
    payload: { voltage: 480, hp: 50, powerFactor: 0.88 }
  }
];

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (toolId: string, payload?: any) => void;
  onSelectStandard?: (std: 'NEC' | 'IEC') => void;
  currentStandard?: 'NEC' | 'IEC';
  isDark?: boolean;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onSelectStandard,
  currentStandard = 'NEC',
  isDark = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global Keyboard Listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return COMMAND_ITEMS;
    }
    const q = searchQuery.toLowerCase().trim();
    return COMMAND_ITEMS.filter((item) => {
      return (
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q)) ||
        (item.badge && item.badge.toLowerCase().includes(q))
      );
    });
  }, [searchQuery]);

  // Reset selected index on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectItem = (item: CommandItem) => {
    if (item.actionType === 'tool' && item.toolId) {
      onSelectTool(item.toolId);
    } else if (item.actionType === 'preset' && item.toolId) {
      onSelectTool(item.toolId, item.payload);
    }
    onClose();
  };

  // Group filtered items by category
  const groupedCategories = useMemo(() => {
    const map: Record<string, CommandItem[]> = {};
    filteredItems.forEach((item) => {
      if (!map[item.category]) map[item.category] = [];
      map[item.category].push(item);
    });
    return map;
  }, [filteredItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-700 text-white' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className={`p-4 border-b flex items-center gap-3 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <Search size={20} className="text-blue-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools, calculations, presets, or electrical codes... (e.g. 'EV charger', 'battery', 'voltage drop')"
            className="flex-1 bg-transparent border-none outline-hidden text-sm font-medium placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">
            <span>ESC to close</span>
          </div>
        </div>

        {/* Quick Filter Standard Pills */}
        {onSelectStandard && (
          <div className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
            isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-200'
          }`}>
            <span className="text-slate-400 font-mono text-[11px]">Governing Code Standard:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onSelectStandard('NEC')}
                className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  currentStandard === 'NEC'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                NEC (US / NFPA 70)
              </button>
              <button
                type="button"
                onClick={() => onSelectStandard('IEC')}
                className={`px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold transition-all cursor-pointer ${
                  currentStandard === 'IEC'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                IEC / BS 7671 (UK / Global)
              </button>
            </div>
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Sparkles size={28} className="mx-auto mb-2 opacity-40 text-blue-500" />
              <p className="text-sm font-semibold">No matching electrical tools found</p>
              <p className="text-xs text-slate-500 mt-1">Try searching for "conduit", "breaker", "battery", or "cable size"</p>
            </div>
          ) : (
            Object.entries(groupedCategories).map(([category, items]) => (
              <div key={category} className="py-2 first:pt-0 last:pb-0">
                <div className="px-3 py-1 text-[10px] font-mono uppercase font-bold tracking-wider text-slate-400">
                  {category}
                </div>
                <div className="space-y-1 mt-1">
                  {items.map((item) => {
                    const globalIdx = filteredItems.findIndex((x) => x.id === item.id);
                    const isSelected = globalIdx === selectedIndex;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full p-2.5 rounded-2xl flex items-center justify-between gap-3 text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                          }`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm truncate">
                                {item.title}
                              </span>
                              {item.badge && (
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                                  isSelected
                                    ? 'bg-white/25 text-white'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                }`}>
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className={`text-xs truncate mt-0.5 ${
                              isSelected ? 'text-blue-100' : 'text-slate-400'
                            }`}>
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className={`flex items-center gap-1 text-xs font-mono shrink-0 ${
                          isSelected ? 'text-white' : 'text-slate-400'
                        }`}>
                          <span>Launch</span>
                          <ArrowRight size={13} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info bar */}
        <div className={`p-3 border-t flex items-center justify-between text-[11px] font-mono ${
          isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1 text-blue-500 font-bold">
            <Zap size={13} />
            <span>ElectraSim Command Hub</span>
          </div>
        </div>
      </div>
    </div>
  );
};
