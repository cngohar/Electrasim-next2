import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  Layers, 
  Zap, 
  Scale, 
  ArrowRightLeft, 
  Activity, 
  Info, 
  Globe2, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { 
  ElectricalStandard, 
  STANDARDS_CONFIG, 
  COMPARISON_TOPICS,
  NEC_CABLE_SPECS,
  IEC_CABLE_SPECS
} from '@/lib/standards';

interface StandardComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStandard: ElectricalStandard;
  onSelectStandard: (standard: ElectricalStandard) => void;
  isDark?: boolean;
}

export const StandardComparisonModal: React.FC<StandardComparisonModalProps> = ({
  isOpen,
  onClose,
  currentStandard,
  onSelectStandard,
  isDark = true,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'matrix' | 'colorcodes' | 'clauses'>('overview');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className={`p-5 sm:p-6 border-b flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <ArrowRightLeft size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  Global Standards Suite
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Active: <strong className={currentStandard === 'NEC' ? 'text-blue-400' : 'text-emerald-400'}>{STANDARDS_CONFIG[currentStandard].shortName}</strong>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif mt-0.5">
                Dual-Standard Electrical Reference: NEC vs. IEC / BS 7671
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
            }`}
            title="Close Standards Guide"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs Bar */}
        <div className={`px-6 py-2.5 border-b flex items-center gap-2 overflow-x-auto shrink-0 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          {[
            { id: 'overview', label: '⚡ Standards Switcher & Summary' },
            { id: 'matrix', label: '📏 AWG ↔ Metric mm² Matrix' },
            { id: 'colorcodes', label: '🎨 Wiring Color Codes' },
            { id: 'clauses', label: '📜 Code Clauses Cross-Reference' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW & ACTIVE STANDARD SWITCHER */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-5">
                {/* NEC Standard Card */}
                <div 
                  className={`p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer ${
                    currentStandard === 'NEC'
                      ? isDark 
                        ? 'bg-blue-950/30 border-blue-500 shadow-xl shadow-blue-950/50 ring-2 ring-blue-500/20'
                        : 'bg-blue-50/50 border-blue-600 shadow-md ring-2 ring-blue-500/20'
                      : isDark
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => onSelectStandard('NEC')}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{STANDARDS_CONFIG.NEC.flag}</span>
                        <span className="font-serif font-bold text-lg">{STANDARDS_CONFIG.NEC.shortName}</span>
                      </div>
                      {currentStandard === 'NEC' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white flex items-center gap-1 shadow-2xs">
                          <Check size={13} /> Active Standard
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onSelectStandard('NEC'); }}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-colors"
                        >
                          Switch to NEC
                        </button>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {STANDARDS_CONFIG.NEC.name} — Primary electrical installation code across the United States, Canada, and North American installations.
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">System Voltages:</span>
                        <span className="font-bold text-blue-400">120V / 240V (1-Ph) • 208V / 480V (3-Ph) @ 60 Hz</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Conductor Sizing:</span>
                        <span className="font-bold font-mono">AWG / kcmil (NEC Table 310.16)</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Insulations:</span>
                        <span className="font-semibold">THHN / THWN-2 (90°C), Romex NM-B (60°C), XHHW-2</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Continuous Load Rule:</span>
                        <span className="font-bold text-amber-400">125% Breaker Sizing (NEC 210.20)</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Shock Protection:</span>
                        <span className="font-semibold">GFCI Class A (4-6 mA) & AFCI Arc-Fault</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Authority: <strong>NFPA (National Fire Protection Assn)</strong></span>
                    <span>Region: <strong>US / CA / Americas</strong></span>
                  </div>
                </div>

                {/* IEC Standard Card */}
                <div 
                  className={`p-5 rounded-2xl border-2 transition-all relative flex flex-col justify-between cursor-pointer ${
                    currentStandard === 'IEC'
                      ? isDark 
                        ? 'bg-emerald-950/30 border-emerald-500 shadow-xl shadow-emerald-950/50 ring-2 ring-emerald-500/20'
                        : 'bg-emerald-50/50 border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                      : isDark
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => onSelectStandard('IEC')}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{STANDARDS_CONFIG.IEC.flag}</span>
                        <span className="font-serif font-bold text-lg">{STANDARDS_CONFIG.IEC.shortName}</span>
                      </div>
                      {currentStandard === 'IEC' ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                          <Check size={13} /> Active Standard
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onSelectStandard('IEC'); }}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-colors"
                        >
                          Switch to IEC
                        </button>
                      )}
                    </div>

                    <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {STANDARDS_CONFIG.IEC.name} — Global electrical standard mandated in the UK (BS 7671 18th Edition), European Union, Australia, and International markets.
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">System Voltages:</span>
                        <span className="font-bold text-emerald-400">230V (1-Ph) • 400V / 690V (3-Ph) @ 50 Hz</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Conductor Sizing:</span>
                        <span className="font-bold font-mono">Metric mm² (IEC 60228 / BS 7671 Table 4D1)</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Insulations:</span>
                        <span className="font-semibold">Twin & Earth (PVC 70°C), SWA Armoured (XLPE 90°C)</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Coordination Rule:</span>
                        <span className="font-bold text-emerald-400">Ib ≤ In ≤ Iz (BS 7671 Reg 433.1)</span>
                      </div>

                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-slate-400 font-mono">Shock Protection:</span>
                        <span className="font-semibold">30mA RCD / RCBO (BS 7671 Reg 411.3.3)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Authority: <strong>IET & BSI / IEC (IEC 60364)</strong></span>
                    <span>Region: <strong>UK / EU / Global</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Feature Highlights */}
              <div className={`p-4 rounded-2xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-amber-400" />
                  <h4 className="font-bold text-xs uppercase font-mono tracking-wider">
                    How ElectraSim Dynamic Dual-Standard Engine Works
                  </h4>
                </div>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  When you toggle between <strong>NEC (US)</strong> and <strong>IEC / BS 7671 (UK/EU)</strong>, all calculation formulas, nominal voltages (120V/240V/480V vs 230V/400V), frequency, cable gauge specifications (AWG vs mm²), insulation types, thermal derating factors, breaker standard sizes, and 3D conductor color codes automatically adapt across the entire simulator suite.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: AWG <-> METRIC MM² COMPARISON MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-serif font-bold text-base">
                    AWG (American Wire Gauge) to Metric mm² Cross-Reference Table
                  </h3>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Exact physical dimensions, resistance @ 20°C & 75°C, and standard breaker matching per NEC 310.16 vs BS 7671.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Filter wire gauge (e.g. 12 AWG or 2.5 mm²)..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className={`px-3 py-1.5 text-xs rounded-xl border font-mono outline-hidden ${
                    isDark ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className={`border rounded-2xl overflow-hidden ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`font-mono text-[11px] uppercase tracking-wider border-b ${
                      isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      <tr>
                        <th className="py-3 px-3.5">US AWG Gauge</th>
                        <th className="py-3 px-3.5">Metric Area</th>
                        <th className="py-3 px-3.5">Diameter</th>
                        <th className="py-3 px-3.5">NEC Ampacity (75°C / 90°C)</th>
                        <th className="py-3 px-3.5">IEC Closest Metric & Ampacity</th>
                        <th className="py-3 px-3.5">Cu Resistance</th>
                        <th className="py-3 px-3.5">Standard Breaker</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                      {NEC_CABLE_SPECS
                        .filter(s => searchFilter === '' || s.label.toLowerCase().includes(searchFilter.toLowerCase()) || s.secondaryUnit.toLowerCase().includes(searchFilter.toLowerCase()))
                        .map((nec) => {
                          const matchingIec = IEC_CABLE_SPECS.find(iec => Math.abs(iec.mm2 - nec.mm2) / nec.mm2 < 0.4) || IEC_CABLE_SPECS[0];
                          return (
                            <tr key={nec.id} className={`hover:bg-blue-500/5 transition-colors ${
                              currentStandard === 'NEC' ? 'bg-blue-500/[0.02]' : ''
                            }`}>
                              <td className="py-2.5 px-3.5 font-bold text-blue-400">
                                {nec.label}
                              </td>
                              <td className="py-2.5 px-3.5">
                                {nec.mm2.toFixed(2)} mm²
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-400">
                                {nec.diameterMm.toFixed(2)} mm
                              </td>
                              <td className="py-2.5 px-3.5 font-semibold">
                                <span className="text-slate-300">{nec.ampCuPvc75}A (75°)</span> / <span className="text-emerald-400">{nec.ampCuXlpe90}A (90°)</span>
                              </td>
                              <td className="py-2.5 px-3.5 text-emerald-400 font-bold">
                                {matchingIec.label} ({matchingIec.ampCuPvc75}A PVC / {matchingIec.ampCuXlpe90}A XLPE)
                              </td>
                              <td className="py-2.5 px-3.5 text-slate-400">
                                {nec.rCuPerKm.toFixed(2)} Ω/km ({nec.rCuPer1000Ft.toFixed(2)} Ω/kFt)
                              </td>
                              <td className="py-2.5 px-3.5 font-bold text-amber-400">
                                {nec.recommendedBreakerNec}A (US) / {matchingIec.recommendedMcbIec}A (IEC)
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WIRING COLOR CODES COMPARISON */}
          {activeTab === 'colorcodes' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-serif font-bold text-base">
                  Conductor Insulation Color Standards: US NEC vs. International IEC
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Visual reference of line, neutral, and earth conductor identification. Crucial for avoiding hazardous wiring misidentifications.
                </p>
              </div>

              {/* Single Phase Comparison */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  Single-Phase AC Wiring Schemes (120V US vs. 230V UK/EU)
                </h4>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* NEC Single Phase */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-xs text-blue-400 mb-3">
                      <span>🇺🇸 NEC (US / North America - 120V / 240V)</span>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-4 rounded-sm bg-slate-950 border border-slate-700"></div>
                        <span className="font-bold">Black</span>
                        <span className="text-slate-400">→ Hot / Phase Line 1 (120V)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-4 rounded-sm bg-red-600 border border-red-700"></div>
                        <span className="font-bold">Red</span>
                        <span className="text-slate-400">→ Hot / Phase Line 2 (in 240V circuits)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-4 rounded-sm bg-white border border-slate-300"></div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">White</span>
                        <span className="text-slate-400">→ Grounded Neutral (0V)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-4 rounded-sm bg-emerald-600 border border-emerald-700"></div>
                        <span className="font-bold">Green / Bare</span>
                        <span className="text-slate-400">→ Equipment Grounding Conductor (PE)</span>
                      </div>
                    </div>
                  </div>

                  {/* IEC Single Phase */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-400 mb-3">
                      <span>🇬🇧 🇪🇺 IEC / BS 7671 (UK / Europe / Global - 230V)</span>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-4 rounded-sm bg-amber-900 border border-amber-950"></div>
                        <span className="font-bold">Brown</span>
                        <span className="text-slate-400">→ Phase / Live (230V)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-4 rounded-sm bg-blue-600 border border-blue-700"></div>
                        <span className="font-bold">Blue</span>
                        <span className="text-slate-400">→ Neutral (0V)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-4 rounded-sm bg-gradient-to-r from-emerald-600 via-yellow-400 to-emerald-600 border border-emerald-700"></div>
                        <span className="font-bold">Green & Yellow</span>
                        <span className="text-slate-400">→ Protective Earth (PE)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Three Phase Comparison */}
              <div className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <Activity size={16} className="text-rose-500" />
                  Three-Phase AC Wiring Schemes (208V/480V US vs. 400V UK/EU)
                </h4>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* NEC 3-Phase */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="font-bold text-xs text-blue-400 mb-2">
                      🇺🇸 US NEC 3-Phase Systems
                    </div>
                    <div className="text-[11px] text-slate-400 mb-3">
                      120/208V (Black-Red-Blue) & 277/480V (Brown-Orange-Yellow)
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-black border border-slate-600"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-900 border border-amber-950"></span>
                        <span className="font-bold">Phase A:</span> Black (208V) or Brown (480V)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-600 border border-red-700"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
                        <span className="font-bold">Phase B:</span> Red (208V) or Orange (480V)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700"></span>
                        <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500"></span>
                        <span className="font-bold">Phase C:</span> Blue (208V) or Yellow (480V)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-white border border-slate-300"></span>
                        <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-500"></span>
                        <span className="font-bold">Neutral:</span> White (208V) or Gray (480V)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-700"></span>
                        <span className="font-bold">Ground:</span> Green or Bare Copper
                      </div>
                    </div>
                  </div>

                  {/* IEC 3-Phase */}
                  <div className={`p-4 rounded-xl border ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className="font-bold text-xs text-emerald-400 mb-2">
                      🇬🇧 🇪🇺 IEC / BS 7671 Harmonized 3-Phase
                    </div>
                    <div className="text-[11px] text-slate-400 mb-3">
                      400V / 230V Wye System (BS 7671 / IEC 60446)
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-900 border border-amber-950"></span>
                        <span className="font-bold">Phase L1:</span> Brown (400V L-L / 230V L-N)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-black border border-slate-600"></span>
                        <span className="font-bold">Phase L2:</span> Black
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-500 border border-slate-600"></span>
                        <span className="font-bold">Phase L3:</span> Grey
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700"></span>
                        <span className="font-bold">Neutral:</span> Blue (0V)
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-emerald-600 to-yellow-400 border border-emerald-700"></span>
                        <span className="font-bold">Earth (PE):</span> Green-Yellow Striped
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLAUSES & CODE RULES CROSS-REFERENCE */}
          {activeTab === 'clauses' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif font-bold text-base">
                  Code Clauses Cross-Reference: NEC (NFPA 70) vs. BS 7671 / IEC 60364
                </h3>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Side-by-side breakdown across fundamental electrical installation rules, deratings, and protection standards.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {COMPARISON_TOPICS.map((topic) => (
                  <div 
                    key={topic.id}
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b pb-2 border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{topic.icon}</span>
                        <h4 className="font-bold text-xs sm:text-sm">{topic.title}</h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {topic.category}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <span className="font-bold text-blue-400 flex items-center gap-1 mb-0.5">
                          🇺🇸 NEC Rule:
                        </span>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{topic.necRule}</p>
                      </div>

                      <div className={`p-2 rounded-xl border ${
                        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                      }`}>
                        <span className="font-bold text-emerald-400 flex items-center gap-1 mb-0.5">
                          🇬🇧 🇪🇺 IEC / BS 7671 Rule:
                        </span>
                        <p className={isDark ? 'text-slate-300' : 'text-slate-700'}>{topic.iecRule}</p>
                      </div>

                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                        <strong>Practical Impact:</strong> {topic.practicalImpact}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between shrink-0 ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <Globe2 size={15} className="text-blue-500" />
            <span className="text-slate-400">Current Standard:</span>
            <strong className={currentStandard === 'NEC' ? 'text-blue-400' : 'text-emerald-400'}>
              {STANDARDS_CONFIG[currentStandard].name}
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectStandard(currentStandard === 'NEC' ? 'IEC' : 'NEC')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentStandard === 'NEC'
                  ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-600 hover:text-white'
                  : 'bg-blue-600/10 text-blue-400 border-blue-500/30 hover:bg-blue-600 hover:text-white'
              }`}
            >
              <ArrowRightLeft size={13} />
              Switch to {currentStandard === 'NEC' ? 'IEC / UK & EU' : 'NEC (US)'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Close Reference
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
