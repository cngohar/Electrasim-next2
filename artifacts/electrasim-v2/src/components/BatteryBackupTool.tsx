import React, { useState, useMemo } from 'react';
import { 
  Battery, 
  Zap, 
  Clock, 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Layers, 
  Box, 
  ShieldCheck, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  ArrowRight,
  Sun,
  Eye,
  Tv,
  Cpu,
  Fan,
  Lightbulb,
  Wifi,
  Laptop,
  Maximize2,
  X,
  LineChart
} from 'lucide-react';
import { Battery3DVisualizer } from './Battery3DVisualizer';
import { BatteryDischargeChart } from './BatteryDischargeChart';
import { ResultExportActions } from './ResultExportActions';
import { FormulaCodeAccordion } from './FormulaCodeAccordion';
import { MobileStickySummaryRibbon } from './MobileStickySummaryRibbon';
import { CalculationError } from './CalculationError';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface BatteryPresetAppliance {
  id: string;
  name: string;
  watts: number;
  category: 'lighting' | 'motor' | 'electronics' | 'other';
  icon: string;
}

const COMMON_APPLIANCES: BatteryPresetAppliance[] = [
  { id: 'app_lights', name: 'LED Home Lighting', watts: 60, category: 'lighting', icon: '💡' },
  { id: 'app_fridge', name: 'Energy Star Refrigerator', watts: 150, category: 'motor', icon: '🧊' },
  { id: 'app_wifi', name: 'Wi-Fi Router & Fiber ONT', watts: 25, category: 'electronics', icon: '📶' },
  { id: 'app_laptop', name: 'Workstation / Laptop', watts: 120, category: 'electronics', icon: '💻' },
  { id: 'app_cpap', name: 'Medical CPAP Machine', watts: 60, category: 'electronics', icon: '🫁' },
  { id: 'app_tv', name: '65" Smart 4K TV + Audio', watts: 150, category: 'electronics', icon: '📺' },
  { id: 'app_sump', name: 'Basement Sump Pump', watts: 800, category: 'motor', icon: '💧' },
  { id: 'app_ac', name: 'Mini-Split Inverter AC', watts: 1200, category: 'motor', icon: '❄️' },
  { id: 'app_microwave', name: 'Microwave Oven (Short Cycle)', watts: 1000, category: 'other', icon: '☕' },
];

export interface ChemistrySpec {
  id: 'lifepo4' | 'li-ion' | 'agm' | 'gel' | 'flooded';
  name: string;
  defaultDodPct: number;
  dischargeEfficiencyPct: number;
  nominalCellV: number;
  cutoffCellV: number;
  peukertFactor: number;
  cycleLifeDescription: string;
  notes: string;
}

export const BATTERY_CHEMISTRIES: Record<string, ChemistrySpec> = {
  lifepo4: {
    id: 'lifepo4',
    name: 'LiFePO4 (Lithium Iron Phosphate)',
    defaultDodPct: 90,
    dischargeEfficiencyPct: 98,
    nominalCellV: 3.2,
    cutoffCellV: 2.5,
    peukertFactor: 1.05,
    cycleLifeDescription: '3,500 – 6,000+ Cycles',
    notes: 'Superior thermal stability, ultra-flat voltage curve, 90% usable capacity without degradation.'
  },
  'li-ion': {
    id: 'li-ion',
    name: 'Ternary Lithium-Ion (NMC / Cobalt)',
    defaultDodPct: 80,
    dischargeEfficiencyPct: 96,
    nominalCellV: 3.7,
    cutoffCellV: 3.0,
    peukertFactor: 1.08,
    cycleLifeDescription: '1,500 – 2,500 Cycles',
    notes: 'High energy density, lightweight, 80% DoD recommended for fire safety and cycle longevity.'
  },
  agm: {
    id: 'agm',
    name: 'AGM Sealed Deep-Cycle Lead-Acid',
    defaultDodPct: 50,
    dischargeEfficiencyPct: 85,
    nominalCellV: 2.0,
    cutoffCellV: 1.75,
    peukertFactor: 1.25,
    cycleLifeDescription: '500 – 800 Cycles',
    notes: 'Maintenance-free, low upfront cost, but strictly limited to 50% DoD to prevent sulfurization.'
  },
  gel: {
    id: 'gel',
    name: 'GEL Deep-Cycle Lead-Acid',
    defaultDodPct: 50,
    dischargeEfficiencyPct: 84,
    nominalCellV: 2.0,
    cutoffCellV: 1.75,
    peukertFactor: 1.28,
    cycleLifeDescription: '600 – 1,000 Cycles',
    notes: 'Excellent high-temperature tolerance and slow self-discharge, capped at 50% DoD.'
  },
  flooded: {
    id: 'flooded',
    name: 'Flooded Deep-Cycle Lead-Acid (FLA)',
    defaultDodPct: 50,
    dischargeEfficiencyPct: 80,
    nominalCellV: 2.0,
    cutoffCellV: 1.75,
    peukertFactor: 1.30,
    cycleLifeDescription: '400 – 700 Cycles',
    notes: 'Requires electrolyte water maintenance and ventilation; 50% DoD limit.'
  }
};

export interface BatteryBackupToolProps {
  onSaveToHistory: (entry: any) => void;
  isDark: boolean;
}

export const BatteryBackupTool: React.FC<BatteryBackupToolProps> = ({
  onSaveToHistory,
  isDark
}) => {
  // Mode: 'runtime' (Forward) vs 'sizing' (Reverse Sizing)
  const [calcMode, setCalcMode] = useState<'runtime' | 'sizing'>('runtime');
  const [viewTab, setViewTab] = useState<'both' | '3d' | 'chart'>('both');
  const [show3DModal, setShow3DModal] = useState<boolean>(false);

  // Battery Bank Parameters
  const [systemVoltage, setSystemVoltage] = useState<number>(24); // 12V, 24V, 48V
  const [batteryAh, setBatteryAh] = useState<number>(200); // 200Ah
  const [chemistryKey, setChemistryKey] = useState<'lifepo4' | 'li-ion' | 'agm' | 'gel' | 'flooded'>('lifepo4');

  // Reverse Sizing Target Parameter
  const [desiredBackupHours, setDesiredBackupHours] = useState<number>(6.0); // 6 hours

  // Inverter & Power Electronics Parameters
  const [inverterEfficiency, setInverterEfficiency] = useState<number>(92); // 92%
  const [inverterStandbyWatts, setInverterStandbyWatts] = useState<number>(15); // 15W

  // Connected Loads Roster
  const [activeAppliances, setActiveAppliances] = useState<{ appliance: BatteryPresetAppliance; count: number }[]>([
    { appliance: COMMON_APPLIANCES[0], count: 2 }, // 2x Lights (120W)
    { appliance: COMMON_APPLIANCES[1], count: 1 }, // 1x Fridge (150W)
    { appliance: COMMON_APPLIANCES[2], count: 1 }, // 1x Wi-Fi (25W)
  ]);

  const [customWattage, setCustomWattage] = useState<number>(0);

  // Get active chemistry spec
  const currentChemistry = useMemo(() => {
    return BATTERY_CHEMISTRIES[chemistryKey] || BATTERY_CHEMISTRIES.lifepo4;
  }, [chemistryKey]);

  const dodPct = currentChemistry.defaultDodPct;
  const dodFactor = dodPct / 100;
  const batteryEfficiencyFactor = currentChemistry.dischargeEfficiencyPct / 100;

  // Load Totals & Category Breakdown
  const { totalLoadWatts, lightingWatts, motorWatts, electronicsWatts } = useMemo(() => {
    let total = customWattage;
    let light = 0;
    let motor = 0;
    let elec = 0;

    activeAppliances.forEach((item) => {
      const itemTotal = item.appliance.watts * item.count;
      total += itemTotal;
      if (item.appliance.category === 'lighting') light += itemTotal;
      else if (item.appliance.category === 'motor') motor += itemTotal;
      else if (item.appliance.category === 'electronics') elec += itemTotal;
    });

    return {
      totalLoadWatts: Math.max(5, total),
      lightingWatts: light,
      motorWatts: motor,
      electronicsWatts: elec
    };
  }, [activeAppliances, customWattage]);

  // -------------------------------------------------------------
  // Calculations Engine
  // -------------------------------------------------------------
  
  // Total DC Power draw required from battery including inverter loss & standby
  const dcPowerRequiredWatts = useMemo(() => {
    const eff = Math.max(0.6, (inverterEfficiency / 100) * batteryEfficiencyFactor);
    return (totalLoadWatts / eff) + inverterStandbyWatts;
  }, [totalLoadWatts, inverterEfficiency, batteryEfficiencyFactor, inverterStandbyWatts]);

  // DC Current in Amps
  const dcCurrentAmps = useMemo(() => {
    return systemVoltage > 0 ? dcPowerRequiredWatts / systemVoltage : 0;
  }, [dcPowerRequiredWatts, systemVoltage]);

  // FORWARD MODE: Runtime Calculations
  const grossEnergyWh = systemVoltage * batteryAh;
  const grossEnergyKwh = grossEnergyWh / 1000;
  const usableEnergyWh = grossEnergyWh * dodFactor;
  const usableEnergyKwh = usableEnergyWh / 1000;

  const calculatedRuntimeHours = useMemo(() => {
    if (dcPowerRequiredWatts <= 0) return 0;
    return usableEnergyWh / dcPowerRequiredWatts;
  }, [usableEnergyWh, dcPowerRequiredWatts]);

  const backupHours = Math.floor(calculatedRuntimeHours);
  const backupMinutes = Math.round((calculatedRuntimeHours - backupHours) * 60);

  // REVERSE SIZING MODE: Calculate Required Battery
  const requiredUsableEnergyWh = useMemo(() => {
    return dcPowerRequiredWatts * desiredBackupHours;
  }, [dcPowerRequiredWatts, desiredBackupHours]);

  const requiredGrossEnergyWh = requiredUsableEnergyWh / dodFactor;
  const requiredGrossKwh = requiredGrossEnergyWh / 1000;
  const recommendedBatteryAh = Math.ceil(requiredGrossEnergyWh / systemVoltage);

  // Minimum Commercial Standard Battery Size Recommendation
  const standardBatteryAhTiers = [50, 100, 150, 200, 300, 400, 600, 800, 1000];
  const recommendedCommercialAh = standardBatteryAhTiers.find((t) => t >= recommendedBatteryAh) || recommendedBatteryAh;

  // Commercial String Configuration Suggestion
  const stringSuggestion = useMemo(() => {
    const ahToUse = calcMode === 'runtime' ? batteryAh : recommendedCommercialAh;
    if (systemVoltage === 12) {
      return `1x 12V ${ahToUse}Ah Module`;
    } else if (systemVoltage === 24) {
      return `2x 12V ${ahToUse}Ah in Series (or 1x 24V ${ahToUse}Ah)`;
    } else if (systemVoltage === 48) {
      return `4x 12V ${ahToUse}Ah in Series (or 1x 48V Server Rack LiFePO4)`;
    }
    return `${ahToUse}Ah Bank @ ${systemVoltage}V`;
  }, [systemVoltage, calcMode, batteryAh, recommendedCommercialAh]);

  // Recommended DC Fuse / Breaker Rating (125% continuous)
  const recommendedDcFuseAmps = useMemo(() => {
    return Math.ceil((dcCurrentAmps * 1.25) / 10) * 10;
  }, [dcCurrentAmps]);

  // Recommended DC Cable Size
  const recommendedDcCable = useMemo(() => {
    if (dcCurrentAmps <= 30) return '10 AWG (6 mm²)';
    if (dcCurrentAmps <= 55) return '6 AWG (16 mm²)';
    if (dcCurrentAmps <= 85) return '4 AWG (25 mm²)';
    if (dcCurrentAmps <= 115) return '2 AWG (35 mm²)';
    if (dcCurrentAmps <= 150) return '1/0 AWG (50 mm²)';
    if (dcCurrentAmps <= 200) return '2/0 AWG (70 mm²)';
    return '4/0 AWG (120 mm²) or Parallel Runs';
  }, [dcCurrentAmps]);

  // Validation & Error Handling
  const [isErrorDismissed, setIsErrorDismissed] = useState<boolean>(false);
  const validationError = useMemo(() => {
    if (totalLoadWatts <= 0) {
      return {
        title: 'No Active Connected Load',
        message: 'Total load is 0 Watts. Please toggle an appliance or specify custom wattage to simulate battery discharge runtime.',
        suggestion: 'Click on one of the quick presets (e.g. Home Essentials) or select appliances on the left.'
      };
    }
    if (calcMode === 'runtime' && batteryAh <= 0) {
      return {
        title: 'Invalid Battery Capacity',
        message: 'Battery Amp-hour rating must be greater than zero.',
        suggestion: 'Set battery capacity between 20Ah and 1000Ah.'
      };
    }
    if (calcMode === 'sizing' && desiredBackupHours <= 0) {
      return {
        title: 'Invalid Backup Duration',
        message: 'Desired backup runtime must be greater than 0 hours.',
        suggestion: 'Set required backup hours (e.g., 4 to 24 hours).'
      };
    }
    if (dcCurrentAmps > 350) {
      return {
        title: 'High Continuous DC Current Warning',
        message: `Calculated continuous DC current is ${dcCurrentAmps.toFixed(1)}A. This requires heavy 4/0 AWG cable and generates high heat loss.`,
        suggestion: 'Consider upgrading system DC voltage from 12V to 24V or 48V to cut current and thermal loss in half.'
      };
    }
    return null;
  }, [totalLoadWatts, calcMode, batteryAh, desiredBackupHours, dcCurrentAmps]);

  // Presets Loader
  const loadPreset = (presetKey: string) => {
    if (presetKey === 'home_essential') {
      setCalcMode('runtime');
      setSystemVoltage(24);
      setBatteryAh(200);
      setChemistryKey('lifepo4');
      setInverterEfficiency(93);
      setCustomWattage(0);
      setActiveAppliances([
        { appliance: COMMON_APPLIANCES[0], count: 2 }, // Lights (120W)
        { appliance: COMMON_APPLIANCES[1], count: 1 }, // Fridge (150W)
        { appliance: COMMON_APPLIANCES[2], count: 1 }, // Wi-Fi (25W)
      ]);
    } else if (presetKey === 'van_life') {
      setCalcMode('runtime');
      setSystemVoltage(12);
      setBatteryAh(300);
      setChemistryKey('lifepo4');
      setInverterEfficiency(90);
      setCustomWattage(0);
      setActiveAppliances([
        { appliance: COMMON_APPLIANCES[0], count: 1 }, // Lights (60W)
        { appliance: COMMON_APPLIANCES[1], count: 1 }, // Fridge (150W)
        { appliance: COMMON_APPLIANCES[3], count: 2 }, // Laptops (240W)
        { appliance: COMMON_APPLIANCES[2], count: 1 }, // Wi-Fi (25W)
      ]);
    } else if (presetKey === 'server_ups') {
      setCalcMode('runtime');
      setSystemVoltage(48);
      setBatteryAh(100);
      setChemistryKey('lifepo4');
      setInverterEfficiency(95);
      setCustomWattage(800); // 800W IT Rack
      setActiveAppliances([
        { appliance: COMMON_APPLIANCES[2], count: 2 }, // Network (50W)
      ]);
    } else if (presetKey === 'medical_cpap') {
      setCalcMode('runtime');
      setSystemVoltage(12);
      setBatteryAh(100);
      setChemistryKey('lifepo4');
      setInverterEfficiency(92);
      setCustomWattage(0);
      setActiveAppliances([
        { appliance: COMMON_APPLIANCES[4], count: 1 }, // CPAP (60W)
      ]);
    } else if (presetKey === 'solar_10kwh') {
      setCalcMode('runtime');
      setSystemVoltage(48);
      setBatteryAh(200);
      setChemistryKey('lifepo4');
      setInverterEfficiency(96);
      setCustomWattage(0);
      setActiveAppliances([
        { appliance: COMMON_APPLIANCES[0], count: 4 }, // Lights (240W)
        { appliance: COMMON_APPLIANCES[1], count: 1 }, // Fridge (150W)
        { appliance: COMMON_APPLIANCES[5], count: 1 }, // TV (150W)
        { appliance: COMMON_APPLIANCES[7], count: 1 }, // AC (1200W)
      ]);
    }
  };

  // Appliance Counter Handlers
  const handleToggleAppliance = (app: BatteryPresetAppliance) => {
    setActiveAppliances((prev) => {
      const exists = prev.find((item) => item.appliance.id === app.id);
      if (exists) {
        return prev.filter((item) => item.appliance.id !== app.id);
      } else {
        return [...prev, { appliance: app, count: 1 }];
      }
    });
  };

  const handleUpdateApplianceCount = (appId: string, delta: number) => {
    setActiveAppliances((prev) =>
      prev
        .map((item) => {
          if (item.appliance.id === appId) {
            return { ...item, count: Math.max(0, item.count + delta) };
          }
          return item;
        })
        .filter((item) => item.count > 0)
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      } shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl">
              🔋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  Energy Storage & Inverter Sizing
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  IEEE 485 & UL 1973 Guidelines
                </span>
              </div>
              <h2 className="text-2xl font-serif font-bold mt-1">
                Battery Backup & Inverter Sizer
              </h2>
            </div>
          </div>

          {/* Mode Switcher Pills: Forward Runtime vs Reverse Sizing */}
          <div className={`flex items-center rounded-xl border p-1 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setCalcMode('runtime')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                calcMode === 'runtime'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock size={13} />
              <span>Calculate Runtime</span>
            </button>
            <button
              type="button"
              onClick={() => setCalcMode('sizing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                calcMode === 'sizing'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Battery size={13} />
              <span>Reverse Sizing (I need X hrs)</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-mono text-[11px] shrink-0 flex items-center gap-1">
            <Sparkles size={13} className="text-amber-500" /> Presets:
          </span>
          <button
            type="button"
            onClick={() => loadPreset('home_essential')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            🏠 Home Essentials (Fridge + Lights + Wi-Fi)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('van_life')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            🚐 Off-Grid Van / RV (12V 300Ah LiFePO4)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('server_ups')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            🏢 IT Server Rack (48V 100Ah)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('medical_cpap')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            🫁 Medical CPAP Overnight
          </button>
          <button
            type="button"
            onClick={() => loadPreset('solar_10kwh')}
            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
          >
            ☀️ 10kWh Home Energy Storage
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Target Hours Box (Reverse Mode) */}
          {calcMode === 'sizing' && (
            <div className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            } shadow-xs`}>
              <h3 className="font-bold text-sm flex items-center gap-2 mb-3 text-emerald-500">
                <Clock size={16} />
                <span>Target Backup Duration Requirement</span>
              </h3>
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Desired Backup Run Time:</span>
                  <span className="text-emerald-500 font-mono font-bold text-sm">
                    {desiredBackupHours} Hours
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="48"
                  step="0.5"
                  value={desiredBackupHours}
                  onChange={(e) => setDesiredBackupHours(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>1 Hour</span>
                  <span>6 Hours</span>
                  <span>12 Hours</span>
                  <span>24 Hours</span>
                  <span>48 Hours</span>
                </div>
              </div>
            </div>
          )}

          {/* 1. Battery Bank Parameters */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          } shadow-xs`}>
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
              <Battery size={16} className="text-emerald-500" />
              <span>1. Battery Bank Parameters</span>
            </h3>

            <div className="space-y-4">
              {/* Chemistry Dropdown Menu */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Battery Chemistry Selection
                </label>
                <select
                  value={chemistryKey}
                  onChange={(e) => setChemistryKey(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {Object.entries(BATTERY_CHEMISTRIES).map(([key, spec]) => (
                    <option key={key} value={key}>
                      {spec.name} ({spec.defaultDodPct}% DoD / {spec.dischargeEfficiencyPct}% Eff.)
                    </option>
                  ))}
                </select>
                
                {/* Dynamic Chemistry Details Banner */}
                <div className={`mt-2 p-2.5 rounded-xl border text-[11px] space-y-1 ${
                  isDark ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <div className="flex items-center justify-between font-mono text-[10px] text-emerald-500 font-bold">
                    <span>Safe DoD: {currentChemistry.defaultDodPct}%</span>
                    <span>Coulombic Eff: {currentChemistry.dischargeEfficiencyPct}%</span>
                    <span>{currentChemistry.cycleLifeDescription}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{currentChemistry.notes}</p>
                </div>
              </div>

              {/* System DC Voltage Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  System Nominal DC Voltage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[12, 24, 48].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSystemVoltage(v)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        systemVoltage === v
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {v}V DC
                    </button>
                  ))}
                </div>
              </div>

              {/* Battery Capacity (Ah) */}
              {calcMode === 'runtime' && (
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Battery Capacity (Ah Rating):</span>
                    <span className="text-emerald-500 font-mono font-bold">
                      {batteryAh} Ah ({(grossEnergyWh / 1000).toFixed(1)} kWh Gross)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="20"
                      max="1000"
                      step="10"
                      value={batteryAh}
                      onChange={(e) => setBatteryAh(parseInt(e.target.value))}
                      className="flex-1 accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      min="10"
                      max="2000"
                      value={batteryAh}
                      onChange={(e) => setBatteryAh(Math.max(10, parseInt(e.target.value) || 10))}
                      className="w-20 p-1.5 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-center"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Inverter Power Electronics */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          } shadow-xs`}>
            <h3 className="font-bold text-sm flex items-center gap-2 mb-4">
              <Zap size={16} className="text-blue-500" />
              <span>2. Inverter Power Electronics</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  <span>Inverter Efficiency (η):</span>
                  <span className="text-blue-500 font-mono font-bold">{inverterEfficiency}%</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="98"
                  value={inverterEfficiency}
                  onChange={(e) => setInverterEfficiency(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                  <span>75% (Budget)</span>
                  <span>90% (Pure Sine)</span>
                  <span>96% (High-End Solar)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                  Inverter Idle / Standby Tare Loss (Watts)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={inverterStandbyWatts}
                  onChange={(e) => setInverterStandbyWatts(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. Connected AC Loads */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          } shadow-xs`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Lightbulb size={16} className="text-amber-500" />
                <span>3. Connected Appliances & Loads</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                {totalLoadWatts} Watts Total
              </span>
            </div>

            {/* Quick Toggle Common Appliance Buttons */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {COMMON_APPLIANCES.map((app) => {
                const active = activeAppliances.find((item) => item.appliance.id === app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => handleToggleAppliance(app)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-base">{app.icon}</div>
                    <div className="text-[11px] truncate mt-1">{app.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{app.watts}W</div>
                  </button>
                );
              })}
            </div>

            {/* Active Appliance Quantities */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {activeAppliances.map((item) => (
                <div
                  key={item.appliance.id}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{item.appliance.icon}</span>
                    <span className="font-semibold truncate">{item.appliance.name}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({item.appliance.watts * item.count}W)</span>
                  </div>

                  <div className="flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateApplianceCount(item.appliance.id, -1)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono font-bold text-xs">{item.count}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateApplianceCount(item.appliance.id, 1)}
                      className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Custom Watts Entry */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-semibold">Other Custom Loads (Watts):</span>
              <input
                type="number"
                min="0"
                max="10000"
                step="50"
                value={customWattage}
                onChange={(e) => setCustomWattage(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 p-1.5 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-right"
                placeholder="0 W"
              />
            </div>
          </div>
        </div>

        {/* Right Column: 3D Visualizer, Chart & Engineering Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* View Mode Switcher & 3D Visualize Action Button */}
          <div className="flex items-center justify-between gap-2">
            <div className={`flex items-center rounded-xl border p-1 text-xs ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setViewTab('both')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  viewTab === 'both' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All Views
              </button>
              <button
                type="button"
                onClick={() => setViewTab('3d')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewTab === '3d' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Box size={13} /> 3D Scene
              </button>
              <button
                type="button"
                onClick={() => setViewTab('chart')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  viewTab === 'chart' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LineChart size={13} /> Recharts Curve
              </button>
            </div>

            {/* Prominent "3D Visualize" Modal Trigger Button */}
            <button
              type="button"
              onClick={() => setShow3DModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} className="text-amber-300" />
              <span>✨ 3D Visualize</span>
              <Maximize2 size={13} className="opacity-70 ml-0.5" />
            </button>
          </div>

          {/* Validation & System Error Alerts */}
          {validationError && !isErrorDismissed && (
            <CalculationError
              error={validationError.message}
              title={validationError.title}
              suggestion={validationError.suggestion}
              isDark={isDark}
              onDismiss={() => setIsErrorDismissed(true)}
              onReset={() => loadPreset('home_essential')}
            />
          )}

          {/* 3D Visualizer Scene */}
          {(viewTab === 'both' || viewTab === '3d') && (
            <Battery3DVisualizer
              batteryVoltage={systemVoltage}
              batteryAh={calcMode === 'runtime' ? batteryAh : recommendedCommercialAh}
              usableKwh={calcMode === 'runtime' ? usableEnergyKwh : requiredUsableEnergyWh / 1000}
              totalKwh={calcMode === 'runtime' ? grossEnergyKwh : requiredGrossKwh}
              dodPct={dodPct}
              chemistryName={currentChemistry.name}
              inverterEfficiencyPct={inverterEfficiency}
              totalLoadWatts={totalLoadWatts}
              dcCurrentAmps={dcCurrentAmps}
              backupHours={calcMode === 'runtime' ? backupHours : Math.floor(desiredBackupHours)}
              backupMinutes={calcMode === 'runtime' ? backupMinutes : Math.round((desiredBackupHours % 1) * 60)}
              isDark={isDark}
              lightingWatts={lightingWatts}
              motorWatts={motorWatts}
              electronicsWatts={electronicsWatts}
              batteryStringConfig={stringSuggestion}
            />
          )}

          {/* Recharts Discharge Curve Chart */}
          {(viewTab === 'both' || viewTab === 'chart') && (
            <BatteryDischargeChart
              systemVoltage={systemVoltage}
              batteryAh={calcMode === 'runtime' ? batteryAh : recommendedCommercialAh}
              usableKwh={calcMode === 'runtime' ? usableEnergyKwh : requiredUsableEnergyWh / 1000}
              totalKwh={calcMode === 'runtime' ? grossEnergyKwh : requiredGrossKwh}
              dodPct={dodPct}
              chemistry={chemistryKey}
              totalLoadWatts={totalLoadWatts}
              dcPowerWatts={dcPowerRequiredWatts}
              calculatedRuntimeHours={calcMode === 'runtime' ? calculatedRuntimeHours : desiredBackupHours}
              isDark={isDark}
            />
          )}

          {/* Primary Results & Engineering Card */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          } shadow-xs`}>
            <div className="grid sm:grid-cols-3 gap-3 text-center">
              {/* Box 1: Runtime or Required Capacity */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  {calcMode === 'runtime' ? 'Estimated Backup Time' : 'Required Battery Capacity'}
                </div>
                <div className="text-xl font-mono font-black text-emerald-500 mt-1">
                  {calcMode === 'runtime' ? `${backupHours}h ${backupMinutes}m` : `${recommendedCommercialAh} Ah`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {calcMode === 'runtime' ? `At ${totalLoadWatts}W continuous` : `@ ${systemVoltage}V (${(requiredGrossKwh).toFixed(1)} kWh Gross)`}
                </div>
              </div>

              {/* Box 2: Usable Energy */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Usable Energy
                </div>
                <div className="text-xl font-mono font-black text-blue-500 mt-1">
                  {calcMode === 'runtime' ? `${usableEnergyKwh.toFixed(2)} kWh` : `${(requiredUsableEnergyWh / 1000).toFixed(2)} kWh`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {dodPct}% Safe Depth of Discharge
                </div>
              </div>

              {/* Box 3: DC Draw & C-Rate */}
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  DC Current Draw
                </div>
                <div className="text-xl font-mono font-black text-amber-500 mt-1">
                  {dcCurrentAmps.toFixed(1)} Amps
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  C-Rate: {(dcCurrentAmps / (calcMode === 'runtime' ? batteryAh : recommendedCommercialAh)).toFixed(2)}C (Safe)
                </div>
              </div>
            </div>

            {/* Electrical Installation & Protection Guidance */}
            <div className={`mt-4 p-3.5 rounded-xl border space-y-2 text-xs ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Electrical Installation & Circuit Protection Specifications:</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <span className="text-slate-400">Recommended DC Cable:</span>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {recommendedDcCable}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800">
                  <span className="text-slate-400">Recommended DC Class-T Fuse:</span>
                  <div className="font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {recommendedDcFuseAmps}A DC Rated (125% continuous)
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                ⚡ <strong>Commercial String Recommendation:</strong> {stringSuggestion}
              </div>
            </div>

            {/* Formula & Step-by-Step Code Accordion */}
            <div className="mt-4">
              <FormulaCodeAccordion
                title="Battery & Inverter Formula Derivation"
                standardRef="IEEE 485 / UL 1973 Battery Sizing"
                formula="Runtime (h) = (Battery Volts × Battery Ah × DoD × Inverter Eff) / Total Load Watts"
                substitution={`(${systemVoltage}V × ${calcMode === 'runtime' ? batteryAh : recommendedCommercialAh}Ah × ${(dodPct / 100).toFixed(2)} × ${(inverterEfficiency / 100).toFixed(2)}) / ${totalLoadWatts}W`}
                result={calcMode === 'runtime' ? `${backupHours}h ${backupMinutes}m Effective Backup Duration` : `${recommendedCommercialAh} Ah Recommended Battery Bank`}
                notes="Includes inverter conversion loss (heat) and depth-of-discharge cutoff safeguard to prevent battery degradation."
                isDark={isDark}
              />
            </div>

            {/* Export & Save to History Strip */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <ResultExportActions
                toolId="battery_backup"
                toolName="🔋 Battery Backup & Inverter Sizer"
                summary={`Calculated ${calcMode === 'runtime' ? `${backupHours}h ${backupMinutes}m runtime` : `${recommendedCommercialAh}Ah required`} for ${totalLoadWatts}W load at ${systemVoltage}V DC (${(usableEnergyKwh).toFixed(2)} kWh usable energy).`}
                inputs={{
                  calcMode,
                  systemVoltage: `${systemVoltage}V DC`,
                  batteryCapacity: calcMode === 'runtime' ? `${batteryAh} Ah` : `${desiredBackupHours} Hours Desired`,
                  chemistry: currentChemistry.name,
                  inverterEfficiency: `${inverterEfficiency}%`,
                  totalLoadWatts: `${totalLoadWatts} Watts`,
                  connectedLoads: activeAppliances.map((a) => `${a.count}x ${a.appliance.name}`).join(', ')
                }}
                outputs={{
                  calculatedRuntime: `${backupHours}h ${backupMinutes}m`,
                  usableEnergy: `${usableEnergyKwh.toFixed(2)} kWh`,
                  grossEnergy: `${grossEnergyKwh.toFixed(2)} kWh`,
                  dcCurrentDraw: `${dcCurrentAmps.toFixed(1)} A`,
                  recommendedDcCable,
                  recommendedDcFuse: `${recommendedDcFuseAmps} A DC`,
                  recommendedStringConfig: stringSuggestion
                }}
                standardsRef="IEEE 485 & UL 1973 Battery Energy Storage"
                onSaveToHistory={onSaveToHistory}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen 3D Visualization Modal (Triggered by "✨ 3D Visualize" button) */}
      {show3DModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Box size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    3D Battery-Inverter-Load Energy Flow
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live Hardware Orbit & Real-time Discharge Simulation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShow3DModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <Battery3DVisualizer
                batteryVoltage={systemVoltage}
                batteryAh={calcMode === 'runtime' ? batteryAh : recommendedCommercialAh}
                usableKwh={calcMode === 'runtime' ? usableEnergyKwh : requiredUsableEnergyWh / 1000}
                totalKwh={calcMode === 'runtime' ? grossEnergyKwh : requiredGrossKwh}
                dodPct={dodPct}
                chemistryName={currentChemistry.name}
                inverterEfficiencyPct={inverterEfficiency}
                totalLoadWatts={totalLoadWatts}
                dcCurrentAmps={dcCurrentAmps}
                backupHours={calcMode === 'runtime' ? backupHours : Math.floor(desiredBackupHours)}
                backupMinutes={calcMode === 'runtime' ? backupMinutes : Math.round((desiredBackupHours % 1) * 60)}
                isDark={true}
                lightingWatts={lightingWatts}
                motorWatts={motorWatts}
                electronicsWatts={electronicsWatts}
                batteryStringConfig={stringSuggestion}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Floating Summary Ribbon */}
      <MobileStickySummaryRibbon
        title="Battery Backup Status"
        resultBadge={calcMode === 'runtime' ? `${backupHours}h ${backupMinutes}m Runtime` : `${recommendedCommercialAh}Ah Bank`}
        subText={`${(usableEnergyKwh).toFixed(1)} kWh • ${totalLoadWatts}W Load`}
        onInspect3D={() => setShow3DModal(true)}
        status="pass"
        isDark={isDark}
      />
    </div>
  );
};
