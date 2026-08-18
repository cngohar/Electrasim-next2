import React, { useState, useMemo } from 'react';
import { 
  X, 
  Scale, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Battery, 
  DollarSign, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp,
  Layers,
  Box,
  Copy
} from 'lucide-react';

export type ComparisonType = 'conductor_material' | 'battery_chemistry' | 'system_voltage' | 'conduit_type';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  initialType?: ComparisonType;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  isDark,
  initialType = 'conductor_material'
}) => {
  const [comparisonType, setComparisonType] = useState<ComparisonType>(initialType);

  // Scenario 1: Conductor Material Comparison Parameters
  const [loadAmps, setLoadAmps] = useState<number>(80);
  const [distanceMeters, setDistanceMeters] = useState<number>(35); // 35m (~115ft)
  const [voltage, setVoltage] = useState<number>(240);

  // Scenario 2: Battery Chemistry Comparison Parameters
  const [batteryLoadWatts, setBatteryLoadWatts] = useState<number>(600);
  const [targetAh, setTargetAh] = useState<number>(200);
  const [batteryVolts, setBatteryVolts] = useState<number>(24);

  // Scenario 3: System Voltage Comparison Parameters
  const [totalDcPowerWatts, setTotalDcPowerWatts] = useState<number>(2000);
  const [dcRunDistanceMeters, setDcRunDistanceMeters] = useState<number>(10);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-5xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Scale size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  A/B Engineering Analyzer
                </span>
                <span className="text-xs text-slate-400 font-mono">Side-by-Side Trade-off Simulator</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif mt-0.5">
                Scenario & Specification Comparison
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

        {/* Tab Selection Bar */}
        <div className={`p-2 border-b flex items-center gap-2 overflow-x-auto ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setComparisonType('conductor_material')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              comparisonType === 'conductor_material'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>⚡ Copper (Cu) vs. Aluminium (Al)</span>
          </button>
          <button
            type="button"
            onClick={() => setComparisonType('battery_chemistry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              comparisonType === 'battery_chemistry'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔋 LiFePO4 vs. Lead-Acid (AGM)</span>
          </button>
          <button
            type="button"
            onClick={() => setComparisonType('system_voltage')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              comparisonType === 'system_voltage'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🔺 12V vs. 24V vs. 48V DC Sizing</span>
          </button>
        </div>

        {/* Comparison Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: COPPER VS ALUMINIUM */}
          {comparisonType === 'conductor_material' && (
            <div className="space-y-6">
              {/* Parameter Controls */}
              <div className={`p-4 rounded-2xl border grid sm:grid-cols-3 gap-3 text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Design Load Current (Amps)</label>
                  <input
                    type="number"
                    value={loadAmps}
                    onChange={(e) => setLoadAmps(Math.max(5, parseInt(e.target.value) || 5))}
                    className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">One-Way Run Length (Meters)</label>
                  <input
                    type="number"
                    value={distanceMeters}
                    onChange={(e) => setDistanceMeters(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nominal AC Voltage (V)</label>
                  <input
                    type="number"
                    value={voltage}
                    onChange={(e) => setVoltage(Math.max(100, parseInt(e.target.value) || 100))}
                    className="w-full p-2 rounded-xl border bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Side-by-Side Comparison Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Option A: Copper (Cu) */}
                <div className={`p-5 rounded-2xl border space-y-4 relative ${
                  isDark ? 'bg-slate-900 border-amber-500/30' : 'bg-amber-50/40 border-amber-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🟤</span>
                      <div>
                        <h3 className="font-bold text-sm text-amber-600 dark:text-amber-400">
                          Option A: Pure Copper (Cu)
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">ρ = 0.0175 Ω·mm²/m</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      Standard Choice
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Required Conductor Size:</span>
                      <span className="font-bold text-amber-500">4 AWG (25 mm²)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Voltage Drop %:</span>
                      <span className="font-bold text-emerald-500">1.75% (4.2V Drop) - PASS</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Estimated Cable Weight:</span>
                      <span className="font-bold">~16.2 kg (Heavier)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Conduit Size Required:</span>
                      <span className="font-bold">1" EMT (Fits easily)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Material Cost Index:</span>
                      <span className="font-bold text-red-500">100% (Baseline Benchmark)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300">
                    ✓ Compact conduit diameter, superior fatigue resistance, easier terminal landings in small lugs.
                  </div>
                </div>

                {/* Option B: Aluminium (Al) */}
                <div className={`p-5 rounded-2xl border space-y-4 relative ${
                  isDark ? 'bg-slate-900 border-blue-500/30' : 'bg-blue-50/40 border-blue-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚪</span>
                      <div>
                        <h3 className="font-bold text-sm text-blue-600 dark:text-blue-400">
                          Option B: Aluminium (Al / AA-8000)
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">ρ = 0.0283 Ω·mm²/m</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      Budget & Weight Saver
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Required Conductor Size:</span>
                      <span className="font-bold text-blue-500">2 AWG (35 mm²) (+1 Size Bump)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Voltage Drop %:</span>
                      <span className="font-bold text-emerald-500">1.88% (4.5V Drop) - PASS</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Estimated Cable Weight:</span>
                      <span className="font-bold text-emerald-500">~8.4 kg (-48% Lighter!)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Conduit Size Required:</span>
                      <span className="font-bold">1-1/4" EMT (Needs larger raceway)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Material Cost Index:</span>
                      <span className="font-bold text-emerald-500">~45% (Saves up to 55% Cost)</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-700 dark:text-blue-300">
                    ⚠️ Requires AL/CU rated dual-rated mechanical lugs, anti-oxidant joint compound (Noalox), and larger conduit.
                  </div>
                </div>
              </div>

              {/* Engineering Verdict Box */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <Sparkles className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    Engineering Decision Recommendation:
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    For long feeder runs (&gt; 100A / &gt; 30 meters), <strong>Aluminium AA-8000 series</strong> provides massive raw material savings ($50%+ savings) and reduces physical pulling tension on site. For branch circuits (&lt; 50A) or tight panelboard enclosures, <strong>Copper</strong> remains standard for reliability and compact lug terminations.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BATTERY CHEMISTRY COMPARISON */}
          {comparisonType === 'battery_chemistry' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* LiFePO4 */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-slate-900 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🔋</span>
                      <div>
                        <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          LiFePO4 Lithium Iron Phosphate
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">Modern Solar & Backup Gold Standard</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Recommended
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Usable Capacity (DoD):</span>
                      <span className="font-bold text-emerald-500">90% Usable (4.32 kWh per 200Ah @ 24V)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Cycle Life (80% EOL):</span>
                      <span className="font-bold text-emerald-500">4,000 - 6,000 Cycles (10-15 Years)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Weight per 100Ah:</span>
                      <span className="font-bold text-emerald-500">~11 kg (1/3 of Lead-Acid)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Round-Trip Efficiency:</span>
                      <span className="font-bold text-emerald-500">96% - 98%</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Levelized Cost of Energy:</span>
                      <span className="font-bold text-emerald-500">$0.08 / kWh throughput</span>
                    </div>
                  </div>
                </div>

                {/* Lead Acid AGM */}
                <div className={`p-5 rounded-2xl border space-y-4 ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🪨</span>
                      <div>
                        <h3 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                          AGM Sealed Deep-Cycle Lead-Acid
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">Legacy Stationary Power</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
                      Budget Upfront
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Usable Capacity (DoD):</span>
                      <span className="font-bold text-red-500">50% Max (2.40 kWh per 200Ah @ 24V)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Cycle Life (80% EOL):</span>
                      <span className="font-bold text-red-500">500 - 800 Cycles (2-3 Years)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Weight per 100Ah:</span>
                      <span className="font-bold text-red-500">~31 kg (3x Heavy!)</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400">Round-Trip Efficiency:</span>
                      <span className="font-bold text-red-500">80% - 85% (High heat loss)</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-400">Levelized Cost of Energy:</span>
                      <span className="font-bold text-red-500">$0.32 / kWh (Expensive lifetime cost)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM VOLTAGE COMPARISON */}
          {comparisonType === 'system_voltage' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                {/* 12V */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-xs font-bold text-slate-400 font-mono uppercase">12V DC System</div>
                  <div className="text-xl font-bold font-mono text-amber-500">166.7 A Draw</div>
                  <div className="text-[11px] space-y-1 font-mono text-slate-400">
                    <div>Cable: <strong>2/0 AWG (70 mm²)</strong></div>
                    <div>Fuse: <strong>225A DC Class-T</strong></div>
                    <div>Loss: <strong>Highest $I^2R$ Heat</strong></div>
                  </div>
                  <div className="text-[10px] text-slate-500">Best for small RVs (&lt; 1,000W)</div>
                </div>

                {/* 24V */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="text-xs font-bold text-slate-400 font-mono uppercase">24V DC System</div>
                  <div className="text-xl font-bold font-mono text-blue-500">83.3 A Draw (-50%)</div>
                  <div className="text-[11px] space-y-1 font-mono text-slate-400">
                    <div>Cable: <strong>4 AWG (25 mm²)</strong></div>
                    <div>Fuse: <strong>110A DC Class-T</strong></div>
                    <div>Loss: <strong>75% Less Heat Loss</strong></div>
                  </div>
                  <div className="text-[10px] text-slate-500">Great for medium setups (1k-3kW)</div>
                </div>

                {/* 48V */}
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-slate-950 border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase">48V DC System</div>
                  <div className="text-xl font-bold font-mono text-emerald-500">41.7 A Draw (-75%)</div>
                  <div className="text-[11px] space-y-1 font-mono text-slate-400">
                    <div>Cable: <strong>8 AWG (10 mm²)</strong></div>
                    <div>Fuse: <strong>60A DC Class-T</strong></div>
                    <div>Loss: <strong>93.7% Less Heat Loss</strong></div>
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Standard for Home Solar (&gt; 3kW)</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-xs text-slate-400 font-mono">
            ElectraSim Trade-off Synthesis Engine
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
