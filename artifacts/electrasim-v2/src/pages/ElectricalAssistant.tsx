import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Calculator, 
  Zap, 
  Scale, 
  Cpu, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Info, 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Settings2,
  Bookmark,
  Share2,
  HelpCircle,
  Sliders,
  Check,
  X,
  AlertTriangle,
  Activity,
  Gauge,
  Box,
  Flame,
  Menu,
  Sun,
  Moon,
  History,
  FileJson,
  Globe2,
  ArrowRightLeft
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Wire3DVisualizer } from '@/components/Wire3DVisualizer';
import { Cable3DVisualizer } from '@/components/Cable3DVisualizer';
import { Ohms3DVisualizer } from '@/components/Ohms3DVisualizer';
import { CalculationError } from '@/components/CalculationError';
import { ElectricalInputForm, ElectricalFormValues } from '@/components/ElectricalInputForm';
import { CalculationHistoryLog, CalculationLogEntry } from '@/components/CalculationHistoryLog';
import { ResultExportActions } from '@/components/ResultExportActions';
import { 
  ElectricalStandard, 
  STANDARDS_CONFIG, 
  NEC_CABLE_SPECS, 
  IEC_CABLE_SPECS, 
  StandardConductorSpec 
} from '@/lib/standards';
import { StandardComparisonModal } from '@/components/StandardComparisonModal';

type ToolId = 'cablesize' | 'voltagedrop' | 'loadcalc' | 'ohms' | 'mcb_rcbo' | 'threephase' | 'energycost' | 'converter' | 'wire' | 'breaker';
type Mode = 'simple' | 'advanced';

// Help Modal Info Interface
interface HelpInfo {
  title: string;
  category?: string;
  summary: string;
  details: string;
  standard?: string;
  formula?: string;
  example?: string;
}

const HELP_DICTIONARY: Record<string, HelpInfo> = {
  system: {
    title: "Electrical System Type",
    category: "Cable Sizing",
    summary: "Select between Single Phase (1-Phase) or Three Phase (3-Phase) AC power systems.",
    details: "Single phase (e.g. 120V or 230V) uses 2 live conductors (Live + Neutral) plus Earth, commonly used in residential and small commercial circuits. Three phase (e.g. 400V or 480V) uses 3 phase lines (L1, L2, L3) with optional Neutral and Earth, used for heavy commercial loads, large motors, and industrial machinery.",
    standard: "BS 7671 Section 312 / IEC 60364-1",
    formula: "Single Phase: Ib = P / (V × PF) | Three Phase: Ib = P / (√3 × V × PF)",
    example: "Domestic Ring Main: Single Phase 230V | Industrial HVAC: Three Phase 400V"
  },
  voltage: {
    title: "Supply Voltage (V)",
    category: "Cable Sizing",
    summary: "Nominal root-mean-square (RMS) line voltage supplied by utility or transformer.",
    details: "Standard low voltage AC distributions are typically 120V/240V in North America (NEC) or 230V/400V in UK/Europe/International standards (BS 7671 / IEC). Cable size and current draw are inversely proportional to supply voltage.",
    standard: "IEC 60038 Standard Voltages",
    example: "230V AC (UK/EU Residential), 120V AC (US Outlet), 400V AC (Commercial 3-Phase)"
  },
  load_power: {
    title: "Active Load Power (Watts)",
    category: "Electrical Load",
    summary: "Total real power consumed by connected electrical equipment.",
    details: "Real power (P) in Watts (W) or Kilowatts (kW) measures actual energy work performed. If motor or inductive loads are connected, account for starting surges or total rated power plate ratings.",
    formula: "P = V × I × Power Factor (Watts)",
    example: "Electric Shower: 8,500 W | EV Fast Charger: 7,400 W | Heat Pump: 4,000 W"
  },
  power_factor: {
    title: "Power Factor (cos φ)",
    category: "AC Circuits",
    summary: "Ratio of Real Active Power (kW) to Apparent Power (kVA).",
    details: "Purely resistive loads like heating elements have a Power Factor of 1.0. Inductive loads (motors, transformers, fluorescent ballasts) have lagging power factors typically between 0.80 and 0.95, increasing total current draw.",
    formula: "Power Factor (PF) = Active Power (W) / Apparent Power (VA)",
    standard: "IEEE 519 / Utility Penalties apply below 0.90 PF",
    example: "Resistive Heater: PF = 1.00 | Electric Motor: PF = 0.85 | LED Driver: PF = 0.92"
  },
  cable_length: {
    title: "Cable Run Distance (Meters)",
    category: "Voltage Drop",
    summary: "Total linear distance of the cable path from supply panel to furthest load.",
    details: "Longer cable runs introduce cumulative internal conductor resistance, causing voltage drop and thermal heating. If voltage drop exceeds allowable limits (e.g. 3% to 5%), cable diameter must be upsized.",
    formula: "V_drop = (Phase Multiplier × I × Length × R_conductor) / 1000",
    standard: "BS 7671 Appendix 4 / NEC Article 210.19",
    example: "Garden Outbuilding: 35 meters | Commercial Workshop: 60 meters"
  },
  install_method: {
    title: "Installation Method (BS 7671 Reference Methods)",
    category: "Thermal Derating",
    summary: "Physical environment and enclosure layout surrounding the cable run.",
    details: "Cables installed inside insulated walls, plastic conduit, or underground retain heat more than cables clipped direct on open trays in free air. Poor heat dissipation reduces allowable current capacity (ampacity).",
    standard: "BS 7671 Table 4A2 (Method A: Conduit in wall, Method C: Clipped Direct, Method D: Underground)",
    example: "Method C (Clipped Direct) allows highest ampacity due to free air convection."
  },
  cable_material: {
    title: "Conductor Material",
    category: "Material Science",
    summary: "Choose between Annealed Copper (Cu) or Electrical Grade Aluminium (Al).",
    details: "Copper features high electrical conductivity and lower resistance (1.68×10⁻⁸ Ω·m), standard for building wiring. Aluminium is lighter and lower cost, but has higher resistivity (2.82×10⁻⁸ Ω·m) requiring larger cross-sectional area.",
    example: "Copper: 2.5mm² handles ~24A | Aluminium: 4.0mm² required for equivalent 24A capacity."
  },
  cable_type: {
    title: "Cable Construction Type",
    category: "Mechanical Insulation",
    summary: "Select sheath and core arrangement (e.g., Twin & Earth, Steel Wire Armored SWA).",
    details: "Twin & Earth (6242Y) is used indoors for fixed wiring under plaster or clipped direct. Steel Wire Armored (SWA) provides heavy mechanical protection and grounded armor shielding for direct burial or outdoor sub-mains.",
    standard: "BS 6004 (Flat PVC) / BS 5467 (Armored SWA)",
    example: "Indoor Ring Circuit: Twin & Earth | Underground Outbuilding Feed: Armored SWA"
  },
  max_drop: {
    title: "Maximum Allowed Voltage Drop (%)",
    category: "Code Compliance",
    summary: "Maximum permissible percentage loss of supply voltage at full load.",
    details: "Excessive voltage drop causes lighting flicker, motor overheating, sensitive equipment reset, and energy waste. Wiring regulations dictate strict maximum thresholds from origin to load point.",
    standard: "BS 7671: 3% for Lighting, 5% for Power | NEC: 3% Branch, 5% Total",
    example: "At 230V: 3% max drop = 6.9V (min voltage at load = 223.1V)"
  },
  ambient_temp: {
    title: "Ambient Temperature (°C)",
    category: "Thermal Derating (Ca)",
    summary: "Surrounding air or soil temperature along the cable pathway.",
    details: "Standard cable rating tables assume baseline ambient temperature of 30°C (in air) or 20°C (in ground). Operating in high ambient temperatures (e.g. rooftops, boiler rooms) requires thermal derating factors (Ca).",
    standard: "BS 7671 Table 4B1 / NEC Table 310.15(B)(1)",
    formula: "Ca Derating Factor = √[(T_max - T_ambient) / (T_max - 30)]",
    example: "Standard Indoor: 30°C (Ca=1.00) | Rooftop / Boiler Room: 45°C (Ca=0.79)"
  },
  grouping: {
    title: "Grouping Rating Factor (Cg)",
    category: "Thermal Derating",
    summary: "Number of single or multi-core cables bunched together or touching.",
    details: "When multiple loaded cables are bundled together in trunking, conduits, or trays, mutual heating occurs. The Grouping Rating Factor (Cg) reduces cable ampacity to prevent insulation degradation.",
    standard: "BS 7671 Table 4C1 / NEC 310.15(C)(1)",
    example: "1 Cable: Cg = 1.00 | 2 Cables: Cg = 0.80 | 3 Cables: Cg = 0.70 | 6 Cables: Cg = 0.60"
  },
  insulation: {
    title: "Insulation Material & Thermal Limit",
    category: "Temperature Class",
    summary: "Conductor insulation material: Thermoplastic PVC (70°C) or Thermosetting XLPE (90°C).",
    details: "XLPE (Cross-Linked Polyethylene) insulation withstands maximum operating conductor temperatures up to 90°C compared to 70°C for standard PVC. XLPE cables carry significantly higher continuous current for the same conductor size.",
    standard: "BS 7671 Table 4E1 (XLPE 90°C) vs Table 4D1 (PVC 70°C)",
    example: "2.5mm² Copper in Air: PVC = 24A | XLPE = 30A (25% higher capacity!)"
  },
  wire_gauge: {
    title: "Wire Gauge Standards (AWG & mm²)",
    category: "Conductor Sizing",
    summary: "American Wire Gauge (AWG) and Metric Cross-Sectional Area (mm²).",
    details: "AWG is a logarithmic stepped wire gauge system used in North America where smaller gauge numbers represent thicker wires (e.g. 10 AWG is thicker than 14 AWG). Metric standards measure exact cross-sectional conductor area in mm².",
    standard: "ASTM B258 (AWG) / IEC 60228 (Metric Conductor Sizes)",
    example: "14 AWG ≈ 2.08 mm² | 12 AWG ≈ 3.31 mm² | 10 AWG ≈ 5.26 mm²"
  },
  ohms_law: {
    title: "Ohm's & Power Law Formulas",
    category: "Circuit Fundamentals",
    summary: "Mathematical relationships governing Voltage (V), Current (I), Resistance (R), and Power (P).",
    details: "Ohm's Law states that current through a conductor between two points is directly proportional to voltage and inversely proportional to resistance (V = I × R). Power Law links voltage and current to energy dissipation (P = V × I).",
    formula: "V = I × R | I = V / R | R = V / I | P = V × I = I² × R = V² / R",
    example: "If V = 230V and R = 23Ω → Current I = 230 / 23 = 10A → Power P = 230 × 10 = 2300W (2.3 kW)"
  },
  breaker_load: {
    title: "Circuit Breaker & Continuous Load Sizing",
    category: "Overcurrent Protection",
    summary: "Selection of Miniature Circuit Breakers (MCB) with safety factors.",
    details: "Electrical safety codes mandate that circuit protection breakers must be sized to handle 100% of non-continuous loads plus 125% of continuous loads (operating for 3+ hours). The breaker rating (In) must be greater than or equal to Design Current (Ib) and less than or equal to Cable Capacity (Iz).",
    standard: "BS 7671 Regulation 433.1 / NEC Article 210.20",
    formula: "In (Breaker) ≥ Ib (Load × 1.25 Continuous) AND In ≤ Iz (Cable Capacity)",
    example: "Calculated Continuous Load: 12.8A → Required Breaker: 12.8 × 1.25 = 16A MCB"
  },
  mcb_rcbo: {
    title: "MCB / RCBO / RCD Trip Curves & Protection",
    category: "Overcurrent & Leakage",
    summary: "Select Miniature Circuit Breaker (MCB) trip curves and RCD residual current sensitivity.",
    details: "Type B trips at 3-5x rating (resistive loads/sockets). Type C trips at 5-10x rating (motors/pumps). Type D trips at 10-20x rating (transformers/inrush). RCDs provide 30mA earth leakage protection against electrical shock.",
    standard: "IEC/EN 60898-1 (MCBs) / IEC/EN 61009-1 (RCBOs)",
    formula: "Ib ≤ In ≤ Iz (Design Current ≤ Breaker Rating ≤ Cable Ampacity)",
    example: "Domestic Sockets: Type B 32A 30mA RCBO | Workshop Motor: Type C 20A MCB"
  },
  threephase: {
    title: "Three-Phase AC Power Systems",
    category: "Polyphase Power",
    summary: "Star (Wye) and Delta 3-Phase power, voltages, currents, and power factor.",
    details: "In Star (Wye) connection, Line Voltage VL = √3 × Phase Voltage VP, and Line Current IL = Phase Current IP. In Delta connection, VL = VP and IL = √3 × IP. Active power P = √3 × VL × IL × cos φ.",
    standard: "IEEE 141 / IEC 60038",
    formula: "P = √3 × VL × IL × cos φ (Watts) | S = √3 × VL × IL (VA)",
    example: "400V 3-Phase Star System: 230V Phase-to-Neutral | 400V Phase-to-Phase"
  },
  energycost: {
    title: "Electrical Energy & Running Cost",
    category: "Energy Management",
    summary: "Calculate energy consumption in kWh, electricity bill running costs, and carbon footprint.",
    details: "1 Kilowatt-hour (kWh) equals 1000 Watts operating continuously for 1 hour. Multiply usage kWh by local electricity tariff rate ($/kWh) to determine daily, monthly, and annual operating costs.",
    formula: "kWh = (Power in Watts × Hours) / 1000 | Cost = kWh × Tariff Rate ($/kWh)",
    example: "3.5 kW Heat Pump running 8 hrs/day @ $0.18/kWh → 28 kWh/day = $5.04/day ($1,839/year)"
  }
};

// AWG Wire Specifications Data
const AWG_SPECS = [
  { awg: '18 AWG', mm2: 0.82, maxAmpCu: 10, rCuPerKm: 21.4, rAlPerKm: 35.1 },
  { awg: '16 AWG', mm2: 1.31, maxAmpCu: 13, rCuPerKm: 13.5, rAlPerKm: 22.1 },
  { awg: '14 AWG', mm2: 2.08, maxAmpCu: 15, rCuPerKm: 8.45, rAlPerKm: 13.8 },
  { awg: '12 AWG', mm2: 3.31, maxAmpCu: 20, rCuPerKm: 5.31, rAlPerKm: 8.69 },
  { awg: '10 AWG', mm2: 5.26, maxAmpCu: 30, rCuPerKm: 3.34, rAlPerKm: 5.46 },
  { awg: '8 AWG',  mm2: 8.37, maxAmpCu: 40, rCuPerKm: 2.10, rAlPerKm: 3.44 },
  { awg: '6 AWG',  mm2: 13.3, maxAmpCu: 55, rCuPerKm: 1.32, rAlPerKm: 2.16 },
  { awg: '4 AWG',  mm2: 21.2, maxAmpCu: 70, rCuPerKm: 0.83, rAlPerKm: 1.36 },
  { awg: '2 AWG',  mm2: 33.6, maxAmpCu: 95, rCuPerKm: 0.52, rAlPerKm: 0.85 },
  { awg: '1/0 AWG',mm2: 53.5, maxAmpCu: 125, rCuPerKm: 0.33, rAlPerKm: 0.54 },
  { awg: '2/0 AWG',mm2: 67.4, maxAmpCu: 145, rCuPerKm: 0.26, rAlPerKm: 0.42 },
  { awg: '4/0 AWG',mm2: 107,  maxAmpCu: 195, rCuPerKm: 0.16, rAlPerKm: 0.26 },
];

// Cable sizes data structure matching IEC 60364 / BS 7671 standards
interface CableSpec {
  mm2: string;
  awg: string;
  ampCuPvc: number;
  ampCuXlpe: number;
  ampAlPvc: number;
  ampAlXlpe: number;
  rCu: number; // mΩ/m
  rAl: number;
  diameterMm: number;
  recommendedMcb: number;
}

const CABLE_SIZES: CableSpec[] = [
  { mm2: '1.5 mm²', awg: '14 AWG', ampCuPvc: 17.5, ampCuXlpe: 22, ampAlPvc: 0, ampAlXlpe: 0, rCu: 12.1, rAl: 20.0, diameterMm: 6.2, recommendedMcb: 10 },
  { mm2: '2.5 mm²', awg: '12 AWG', ampCuPvc: 24, ampCuXlpe: 30, ampAlPvc: 0, ampAlXlpe: 0, rCu: 7.41, rAl: 12.2, diameterMm: 7.5, recommendedMcb: 16 },
  { mm2: '4.0 mm²', awg: '10 AWG', ampCuPvc: 32, ampCuXlpe: 40, ampAlPvc: 24, ampAlXlpe: 31, rCu: 4.61, rAl: 7.59, diameterMm: 8.8, recommendedMcb: 25 },
  { mm2: '6.0 mm²', awg: '8 AWG', ampCuPvc: 41, ampCuXlpe: 51, ampAlPvc: 31, ampAlXlpe: 40, rCu: 3.08, rAl: 5.07, diameterMm: 10.2, recommendedMcb: 32 },
  { mm2: '10 mm²', awg: '6 AWG', ampCuPvc: 57, ampCuXlpe: 70, ampAlPvc: 44, ampAlXlpe: 54, rCu: 1.83, rAl: 3.01, diameterMm: 12.5, recommendedMcb: 50 },
  { mm2: '16 mm²', awg: '4 AWG', ampCuPvc: 76, ampCuXlpe: 94, ampAlPvc: 58, ampAlXlpe: 73, rCu: 1.15, rAl: 1.91, diameterMm: 14.8, recommendedMcb: 63 },
  { mm2: '25 mm²', awg: '2 AWG', ampCuPvc: 101, ampCuXlpe: 119, ampAlPvc: 77, ampAlXlpe: 89, rCu: 0.727, rAl: 1.20, diameterMm: 17.5, recommendedMcb: 80 },
  { mm2: '35 mm²', awg: '1 AWG', ampCuPvc: 125, ampCuXlpe: 148, ampAlPvc: 96, ampAlXlpe: 111, rCu: 0.524, rAl: 0.868, diameterMm: 19.8, recommendedMcb: 100 },
  { mm2: '50 mm²', awg: '1/0 AWG', ampCuPvc: 151, ampCuXlpe: 180, ampAlPvc: 117, ampAlXlpe: 135, rCu: 0.387, rAl: 0.641, diameterMm: 22.4, recommendedMcb: 125 },
];

export default function ElectricalAssistant() {
  const [location, setLocation] = useLocation();
  const [activeTool, setActiveTool] = useState<ToolId | null>(null); // Default to Tool Hub Menu
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('electrasim_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light'; // Default theme is light
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('electrasim_theme', next);
    }
  };

  // Ensure clicking "Assistant" navbar link opens the Tool Menu Hub
  useEffect(() => {
    if (location === '/assistant' || location === '/electrical-assistant') {
      setActiveTool(null);
    }
  }, [location]);

  // --- Dual-Standard Toggle State (NEC vs IEC) ---
  const [standard, setStandard] = useState<ElectricalStandard>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('electrasim_standard');
      if (saved === 'NEC' || saved === 'IEC') return saved;
    }
    return 'IEC'; // Default standard is IEC / BS 7671
  });
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);

  const handleStandardChange = (newStd: ElectricalStandard) => {
    setStandard(newStd);
    if (typeof window !== 'undefined') {
      localStorage.setItem('electrasim_standard', newStd);
    }

    // Auto-adjust default system voltages to match standard grid defaults
    if (newStd === 'NEC') {
      if (csVoltage === 230) setCsVoltage(120);
      else if (csVoltage === 400) setCsVoltage(480);
      if (wireVoltage === 230) setWireVoltage(120);
      else if (wireVoltage === 400) setWireVoltage(480);
      if (ohmsV === 230) setOhmsV(120);
      else if (ohmsV === 400) setOhmsV(480);
      if (mcbVoltage === 230) setMcbVoltage(120);
      else if (mcbVoltage === 400) setMcbVoltage(480);
      if (tpLineVoltage === 400) setTpLineVoltage(480);
      showPresetToast('Switched to US NEC (NFPA 70) Standard • AWG Sizes & 120/480V Grid');
    } else {
      if (csVoltage === 120) setCsVoltage(230);
      else if (csVoltage === 480) setCsVoltage(400);
      if (wireVoltage === 120) setWireVoltage(230);
      else if (wireVoltage === 480) setWireVoltage(400);
      if (ohmsV === 120) setOhmsV(230);
      else if (ohmsV === 480) setOhmsV(400);
      if (mcbVoltage === 120) setMcbVoltage(230);
      else if (mcbVoltage === 480) setMcbVoltage(400);
      if (tpLineVoltage === 480) setTpLineVoltage(400);
      showPresetToast('Switched to IEC / BS 7671 Standard • mm² Sizes & 230/400V Grid');
    }
  };

  const [mode, setMode] = useState<Mode>('simple');
  const [copiedShare, setCopiedShare] = useState(false);
  const [savedCalc, setSavedCalc] = useState(false);
  const [viewTab, setViewTab] = useState<'visual' | 'cross' | '3d'>('visual');
  const [hideOtherSizes, setHideOtherSizes] = useState(false);
  const [helpModalInfo, setHelpModalInfo] = useState<HelpInfo | null>(null);

  // --- History Log State & LocalStorage Storage ---
  const [history, setHistory] = useState<CalculationLogEntry[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('electrasim_calculation_history');
        return saved ? JSON.parse(saved) : [];
      }
    } catch (e) {}
    return [];
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleSaveToHistory = (entry: CalculationLogEntry) => {
    setHistory((prev) => {
      const filtered = prev.filter((p) => p.summary !== entry.summary);
      const updated = [entry, ...filtered].slice(0, 50);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('electrasim_calculation_history', JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('electrasim_calculation_history');
      }
    } catch (e) {}
  };

  const handleRemoveHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem('electrasim_calculation_history', JSON.stringify(updated));
        }
      } catch (e) {}
      return updated;
    });
  };

  const handleSelectHistoryEntry = (entry: CalculationLogEntry) => {
    setIsHistoryOpen(false);
    if (entry.toolId && toolsList.some((t) => t.id === entry.toolId)) {
      setActiveTool(entry.toolId as ToolId);
      if (entry.inputs) {
        if (entry.inputs.csVoltage) setCsVoltage(Number(entry.inputs.csVoltage));
        if (entry.inputs.csPowerWatts) setCsPowerWatts(Number(entry.inputs.csPowerWatts));
        if (entry.inputs.wireVoltage) setWireVoltage(Number(entry.inputs.wireVoltage));
        if (entry.inputs.wireCurrent) setWireCurrent(Number(entry.inputs.wireCurrent));
        if (entry.inputs.ohmsV) setOhmsV(Number(entry.inputs.ohmsV));
        if (entry.inputs.ohmsI) setOhmsI(Number(entry.inputs.ohmsI));
        if (entry.inputs.ohmsR) setOhmsR(Number(entry.inputs.ohmsR));
        if (entry.inputs.ohmsP) setOhmsP(Number(entry.inputs.ohmsP));
      }
    }
  };

  // --- Cable Size Calculator State ---
  const [csSystem, setCsSystem] = useState<'single' | 'three'>('single');
  const [csVoltage, setCsVoltage] = useState<number>(230);
  const [csPowerWatts, setCsPowerWatts] = useState<number>(3000);
  const [csPowerFactor, setCsPowerFactor] = useState<number>(0.95);
  const [csLengthMeters, setCsLengthMeters] = useState<number>(25);
  const [csInstallMethod, setCsInstallMethod] = useState<string>('Clipped direct');
  const [csMaterial, setCsMaterial] = useState<'copper' | 'aluminium'>('copper');
  const [csCableType, setCsCableType] = useState<string>('Twin & Earth (2C + CPC)');
  const [csMaxDropPct, setCsMaxDropPct] = useState<number>(3);
  const [csTab, setCsTab] = useState<'3d' | 'chart'>('3d');

  // --- Advanced Derating State ---
  const [csAmbientTemp, setCsAmbientTemp] = useState<number>(30);
  const [csGrouping, setCsGrouping] = useState<number>(1);
  const [csInsulation, setCsInsulation] = useState<'pvc' | 'xlpe'>('pvc');

  // --- Wire Gauge Sizer State ---
  const [wireTab, setWireTab] = useState<'sizer' | 'matrix'>('sizer');
  const [wireCurrent, setWireCurrent] = useState<number>(15);
  const [wireVoltage, setWireVoltage] = useState<number>(230);
  const [wireDistance, setWireDistance] = useState<number>(25);
  const [wireMaterial, setWireMaterial] = useState<'copper' | 'aluminium'>('copper');
  const [wireAllowedDrop, setWireAllowedDrop] = useState<number>(3);

  // --- Ohm's Law State ---
  const [ohmsSolveMode, setOhmsSolveMode] = useState<'VI' | 'VR' | 'IR' | 'PV' | 'PI' | 'PR'>('VI');
  const [ohmsV, setOhmsV] = useState<number>(230);
  const [ohmsI, setOhmsI] = useState<number>(10);
  const [ohmsR, setOhmsR] = useState<number>(23);
  const [ohmsP, setOhmsP] = useState<number>(2300);
  const [ohmsPF, setOhmsPF] = useState<number>(0.85);
  const [ohmsInputFormMode, setOhmsInputFormMode] = useState<'standard' | 'unit_form'>('standard');

  // --- Unit Converter State ---
  const [convVal, setConvVal] = useState<number>(1000);
  const [convUnit, setConvUnit] = useState<'W' | 'kW' | 'HP' | 'kVA' | 'BTU'>('W');
  const [convPF, setConvPF] = useState<number>(0.85);
  const [convVolts, setConvVolts] = useState<number>(230);

  // --- Breaker Sizer State ---
  const [appliances, setAppliances] = useState<Array<{ id: string; name: string; watts: number; qty: number }>>([
    { id: '1', name: 'Refrigerator', watts: 600, qty: 1 },
    { id: '2', name: 'LED Lighting', watts: 150, qty: 1 },
    { id: '3', name: 'Microwave Oven', watts: 1200, qty: 1 },
  ]);
  const [diversityFactor, setDiversityFactor] = useState<number>(80);
  const [newAppName, setNewAppName] = useState('');
  const [newAppWatts, setNewAppWatts] = useState('');

  // --- MCB / RCBO / RCD Selection Assistant State ---
  const [mcbLoadCurrent, setMcbLoadCurrent] = useState<number>(24);
  const [mcbVoltage, setMcbVoltage] = useState<number>(230);
  const [mcbApplication, setMcbApplication] = useState<'sockets' | 'lighting' | 'motor' | 'ev' | 'hvac' | 'welder'>('sockets');
  const [mcbInrushMult, setMcbInrushMult] = useState<number>(3);
  const [mcbRequireRcd, setMcbRequireRcd] = useState<boolean>(true);
  const [mcbShortCircuitKa, setMcbShortCircuitKa] = useState<number>(6);

  // --- Three-Phase Power Calculator State ---
  const [tpConfig, setTpConfig] = useState<'star' | 'delta'>('star');
  const [tpLineVoltage, setTpLineVoltage] = useState<number>(400);
  const [tpLineCurrent, setTpLineCurrent] = useState<number>(32);
  const [tpPF, setTpPF] = useState<number>(0.85);
  const [tpTargetPF, setTpTargetPF] = useState<number>(0.98);
  const [tpUnbalanced, setTpUnbalanced] = useState<boolean>(false);
  const [tpCurrentL1, setTpCurrentL1] = useState<number>(35);
  const [tpCurrentL2, setTpCurrentL2] = useState<number>(30);
  const [tpCurrentL3, setTpCurrentL3] = useState<number>(25);

  // --- Energy Cost Calculator State ---
  const [ecPowerKw, setEcPowerKw] = useState<number>(3.5);
  const [ecHoursPerDay, setEcHoursPerDay] = useState<number>(8);
  const [ecDaysPerWeek, setEcDaysPerWeek] = useState<number>(5);
  const [ecTariffRate, setEcTariffRate] = useState<number>(0.18);
  const [ecPeakSplit, setEcPeakSplit] = useState<boolean>(false);
  const [ecPeakRatio, setEcPeakRatio] = useState<number>(40);
  const [ecPeakRate, setEcPeakRate] = useState<number>(0.28);
  const [ecOffPeakRate, setEcOffPeakRate] = useState<number>(0.12);
  const [ecCo2Factor, setEcCo2Factor] = useState<number>(0.385);

  // Preset Scenario Toast Banner
  const [presetToast, setPresetToast] = useState<string | null>(null);

  const showPresetToast = (name: string) => {
    setPresetToast(`Loaded "${name}" Preset Parameters!`);
    setTimeout(() => setPresetToast(null), 3000);
  };

  const loadMcbRcboPreset = (key: 'sockets' | 'lighting' | 'lighting_inrush' | 'motor' | 'ev' | 'hvac_rooftop' | 'heatpump' | 'pool_pump' | 'transformer' | 'ups_server' | 'solar_ac' | 'solar_inv' | 'datacenter' | 'medical_rcd' | 'submain_swg') => {
    if (key === 'sockets') {
      setMcbLoadCurrent(24);
      setMcbVoltage(230);
      setMcbApplication('sockets');
      setMcbInrushMult(3);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(6);
      showPresetToast('Residential Ring Circuit (32A Type B RCBO)');
    } else if (key === 'lighting' || key === 'lighting_inrush') {
      setMcbLoadCurrent(key === 'lighting' ? 6 : 18);
      setMcbVoltage(230);
      setMcbApplication('lighting');
      setMcbInrushMult(key === 'lighting' ? 4 : 8);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(key === 'lighting' ? 6 : 10);
      showPresetToast(key === 'lighting' ? 'LED Lighting Radial (6A Type B)' : 'Commercial High-Bay LED Array (Type C 25A)');
    } else if (key === 'motor') {
      setMcbLoadCurrent(38);
      setMcbVoltage(400);
      setMcbApplication('motor');
      setMcbInrushMult(8);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(10);
      showPresetToast('3-Phase Compressor Motor (Type C 50A)');
    } else if (key === 'ev') {
      setMcbLoadCurrent(32);
      setMcbVoltage(230);
      setMcbApplication('ev');
      setMcbInrushMult(4);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(6);
      showPresetToast('7.4kW EV Fast Charger (Type B / 30mA RCD)');
    } else if (key === 'hvac_rooftop' || key === 'heatpump') {
      setMcbLoadCurrent(key === 'heatpump' ? 20 : 48);
      setMcbVoltage(key === 'heatpump' ? 230 : 400);
      setMcbApplication('hvac');
      setMcbInrushMult(7);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(10);
      showPresetToast(key === 'heatpump' ? 'Air Source Heat Pump (20A Type C)' : 'Rooftop HVAC Chiller (Type C 63A MCB)');
    } else if (key === 'pool_pump') {
      setMcbLoadCurrent(22);
      setMcbVoltage(230);
      setMcbApplication('motor');
      setMcbInrushMult(6);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(6);
      showPresetToast('Pool Heat Pump & Filter (Type C 32A RCBO)');
    } else if (key === 'transformer') {
      setMcbLoadCurrent(80);
      setMcbVoltage(400);
      setMcbApplication('welder');
      setMcbInrushMult(14);
      setMcbRequireRcd(false);
      setMcbShortCircuitKa(16);
      showPresetToast('Heavy Transformer Welder (Type D 100A)');
    } else if (key === 'ups_server' || key === 'datacenter') {
      setMcbLoadCurrent(key === 'datacenter' ? 63 : 40);
      setMcbVoltage(230);
      setMcbApplication('sockets');
      setMcbInrushMult(3);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(10);
      showPresetToast(key === 'datacenter' ? 'Server Room SMPS Feeder (63A Type B/F)' : 'Data Center Critical UPS Feeder (50A)');
    } else if (key === 'solar_ac' || key === 'solar_inv') {
      setMcbLoadCurrent(key === 'solar_inv' ? 25 : 28);
      setMcbVoltage(230);
      setMcbApplication('sockets');
      setMcbInrushMult(2);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(10);
      showPresetToast('Solar PV Inverter AC Isolator (Type B)');
    } else if (key === 'medical_rcd') {
      setMcbLoadCurrent(16);
      setMcbVoltage(230);
      setMcbApplication('sockets');
      setMcbInrushMult(3);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(10);
      showPresetToast('Medical Hydrotherapy (16A 10mA High-Sensitivity RCD)');
    } else if (key === 'submain_swg') {
      setMcbLoadCurrent(80);
      setMcbVoltage(400);
      setMcbApplication('sockets');
      setMcbInrushMult(5);
      setMcbRequireRcd(true);
      setMcbShortCircuitKa(16);
      showPresetToast('Distribution Submain Feeder (80A 100mA Time-Delayed)');
    }
  };

  const loadThreePhasePreset = (key: 'hvac' | 'delta_heater' | 'motor_heavy' | 'unbalanced' | 'agri_pump' | 'ev_hub' | 'transformer_100k' | 'crane' | 'compressor' | 'welder_delta' | 'furnace' | 'chiller' | 'datacenter') => {
    if (key === 'hvac') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(52);
      setTpPF(0.88);
      setTpTargetPF(0.98);
      setTpUnbalanced(false);
      showPresetToast('Commercial HVAC Chiller (52A Star)');
    } else if (key === 'delta_heater') {
      setTpConfig('delta');
      setTpLineVoltage(400);
      setTpLineCurrent(75);
      setTpPF(1.0);
      setTpTargetPF(1.0);
      setTpUnbalanced(false);
      showPresetToast('Industrial Heating Bank (75A Delta)');
    } else if (key === 'motor_heavy') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(95);
      setTpPF(0.84);
      setTpTargetPF(0.98);
      setTpUnbalanced(false);
      showPresetToast('55kW Heavy Induction Motor (95A Star)');
    } else if (key === 'compressor') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(85);
      setTpPF(0.82);
      setTpTargetPF(0.95);
      setTpUnbalanced(false);
      showPresetToast('Rotary Screw Compressor (85A Star)');
    } else if (key === 'welder_delta') {
      setTpConfig('delta');
      setTpLineVoltage(400);
      setTpLineCurrent(110);
      setTpPF(0.75);
      setTpTargetPF(0.95);
      setTpUnbalanced(false);
      showPresetToast('Robotic MIG Welder (110A Delta)');
    } else if (key === 'furnace') {
      setTpConfig('delta');
      setTpLineVoltage(400);
      setTpLineCurrent(220);
      setTpPF(0.98);
      setTpTargetPF(1.0);
      setTpUnbalanced(false);
      showPresetToast('Induction Metals Furnace (220A / 150kW)');
    } else if (key === 'chiller') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(140);
      setTpPF(0.88);
      setTpTargetPF(0.98);
      setTpUnbalanced(false);
      showPresetToast('Centrifugal Water Chiller (140A Star)');
    } else if (key === 'unbalanced') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpPF(0.85);
      setTpUnbalanced(true);
      setTpCurrentL1(72);
      setTpCurrentL2(45);
      setTpCurrentL3(88);
      showPresetToast('Commercial Unbalanced Office Load (L1:72A, L2:45A, L3:88A)');
    } else if (key === 'datacenter') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(160);
      setTpPF(0.98);
      setTpTargetPF(0.99);
      setTpUnbalanced(false);
      showPresetToast('Data Center Server PDU Racks (160A Star)');
    } else if (key === 'agri_pump') {
      setTpConfig('delta');
      setTpLineVoltage(400);
      setTpLineCurrent(52);
      setTpPF(0.82);
      setTpTargetPF(0.95);
      setTpUnbalanced(false);
      showPresetToast('30kW Agricultural Well Pump (Delta)');
    } else if (key === 'ev_hub') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(225);
      setTpPF(0.98);
      setTpTargetPF(0.99);
      setTpUnbalanced(false);
      showPresetToast('150kW Ultra-Fast EV Hub (225A Star)');
    } else if (key === 'transformer_100k') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(144);
      setTpPF(0.90);
      setTpTargetPF(0.98);
      setTpUnbalanced(false);
      showPresetToast('100kVA Distribution Substation (144A)');
    } else if (key === 'crane') {
      setTpConfig('star');
      setTpLineVoltage(400);
      setTpLineCurrent(110);
      setTpPF(0.78);
      setTpTargetPF(0.95);
      setTpUnbalanced(false);
      showPresetToast('Foundry Overhead Crane (110A 0.78PF)');
    }
  };

  const loadEnergyCostPreset = (key: 'hvac' | 'ev_fleet' | 'server' | 'lighting' | 'pool' | 'bakery' | 'heatpump_home' | 'compressor' | 'crypto' | 'supermarket' | 'ev_home_night' | 'crypto_rig' | 'bakery_oven' | 'carwash' | 'cold_storage') => {
    if (key === 'heatpump_home') {
      setEcPowerKw(4.5);
      setEcHoursPerDay(12);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.20);
      setEcPeakSplit(true);
      setEcPeakRatio(40);
      setEcPeakRate(0.26);
      setEcOffPeakRate(0.11);
      showPresetToast('Domestic Heat Pump (4.5 kW)');
    } else if (key === 'hvac') {
      setEcPowerKw(18.0);
      setEcHoursPerDay(14);
      setEcDaysPerWeek(5);
      setEcTariffRate(0.18);
      setEcPeakSplit(false);
      showPresetToast('Commercial HVAC Plant (18 kW)');
    } else if (key === 'ev_fleet') {
      setEcPowerKw(29.6);
      setEcHoursPerDay(6);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.22);
      setEcPeakSplit(true);
      setEcPeakRatio(30);
      setEcPeakRate(0.32);
      setEcOffPeakRate(0.12);
      showPresetToast('EV Commercial Fleet (29.6 kW Overnight)');
    } else if (key === 'ev_home_night') {
      setEcPowerKw(7.4);
      setEcHoursPerDay(4);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.12);
      setEcPeakSplit(true);
      setEcPeakRatio(0);
      setEcPeakRate(0.28);
      setEcOffPeakRate(0.09);
      showPresetToast('Home EV Off-Peak Night (7.4 kW @ 9¢/kWh)');
    } else if (key === 'server') {
      setEcPowerKw(12.0);
      setEcHoursPerDay(24);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.15);
      setEcPeakSplit(false);
      showPresetToast('24/7 Server Room Continuous (12 kW)');
    } else if (key === 'crypto' || key === 'crypto_rig') {
      setEcPowerKw(6.0);
      setEcHoursPerDay(24);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.13);
      setEcPeakSplit(false);
      showPresetToast('Compute / Mining Cluster (6 kW 24/7)');
    } else if (key === 'lighting') {
      setEcPowerKw(3.2);
      setEcHoursPerDay(16);
      setEcDaysPerWeek(6);
      setEcTariffRate(0.18);
      setEcPeakSplit(false);
      showPresetToast('Warehouse High-Bay LED (3.2 kW)');
    } else if (key === 'bakery' || key === 'bakery_oven') {
      setEcPowerKw(24.0);
      setEcHoursPerDay(8);
      setEcDaysPerWeek(6);
      setEcTariffRate(0.24);
      setEcPeakSplit(true);
      setEcPeakRatio(65);
      setEcPeakRate(0.30);
      setEcOffPeakRate(0.12);
      showPresetToast('Commercial Deck Bakery Oven (24 kW)');
    } else if (key === 'carwash') {
      setEcPowerKw(35.0);
      setEcHoursPerDay(10);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.22);
      setEcPeakSplit(true);
      setEcPeakRatio(70);
      setEcPeakRate(0.29);
      setEcOffPeakRate(0.14);
      showPresetToast('Automatic Drive-Thru Car Wash (35 kW)');
    } else if (key === 'cold_storage' || key === 'supermarket') {
      setEcPowerKw(42.0);
      setEcHoursPerDay(20);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.20);
      setEcPeakSplit(true);
      setEcPeakRatio(50);
      setEcPeakRate(0.27);
      setEcOffPeakRate(0.13);
      showPresetToast('Cold Storage Logistics Chillers (42 kW)');
    } else if (key === 'pool') {
      setEcPowerKw(6.5);
      setEcHoursPerDay(14);
      setEcDaysPerWeek(7);
      setEcTariffRate(0.20);
      setEcPeakSplit(false);
      showPresetToast('Heated Commercial Pool & Spa (6.5 kW)');
    } else if (key === 'compressor') {
      setEcPowerKw(30.0);
      setEcHoursPerDay(16);
      setEcDaysPerWeek(5);
      setEcTariffRate(0.16);
      setEcPeakSplit(false);
      showPresetToast('Industrial Screw Compressor (30 kW)');
    }
  };

  // 1-Click Load Scenario Handlers for Cable Sizing
  const loadCablePreset = (key: 'kitchen' | 'ev' | 'shower' | 'outbuilding' | 'ev_commercial' | 'motor' | 'solar' | 'cold_storage' | 'agri_feeder' | 'hvac') => {
    if (key === 'kitchen') {
      setCsSystem('single');
      setCsVoltage(230);
      setCsPowerWatts(7360);
      setCsPowerFactor(1.0);
      setCsLengthMeters(18);
      setCsMaterial('copper');
      setCsInstallMethod('Method C (Clipped Direct)');
      setCsAmbientTemp(30);
      setCsGrouping(1);
      showPresetToast('Residential Kitchen Ring (32A)');
    } else if (key === 'ev') {
      setCsSystem('single');
      setCsVoltage(230);
      setCsPowerWatts(7360);
      setCsPowerFactor(0.98);
      setCsLengthMeters(25);
      setCsMaterial('copper');
      setCsInstallMethod('Method B (In Conduit / Trunking)');
      setCsAmbientTemp(30);
      setCsGrouping(1);
      showPresetToast('Domestic EV Fast Charger (7.4 kW)');
    } else if (key === 'shower') {
      setCsSystem('single');
      setCsVoltage(230);
      setCsPowerWatts(9500);
      setCsPowerFactor(1.0);
      setCsLengthMeters(15);
      setCsMaterial('copper');
      setCsInstallMethod('Method C (Clipped Direct)');
      setCsAmbientTemp(30);
      setCsGrouping(1);
      showPresetToast('Instant Electric Shower (9.5 kW / 41.3A)');
    } else if (key === 'outbuilding') {
      setCsSystem('single');
      setCsVoltage(230);
      setCsPowerWatts(7360);
      setCsPowerFactor(0.95);
      setCsLengthMeters(45);
      setCsMaterial('copper');
      setCsCableType('Steel Wire Armoured (SWA)');
      setCsInstallMethod('Method D (Direct in Ground / Duct)');
      setCsAmbientTemp(20);
      setCsGrouping(1);
      showPresetToast('Garden Studio SWA Submain (45m)');
    } else if (key === 'ev_commercial') {
      setCsSystem('three');
      setCsVoltage(400);
      setCsPowerWatts(22000);
      setCsPowerFactor(0.98);
      setCsLengthMeters(35);
      setCsMaterial('copper');
      setCsInstallMethod('Method B (In Conduit / Trunking)');
      setCsAmbientTemp(30);
      setCsGrouping(1);
      showPresetToast('Commercial Dual EV Charger (22 kW 3-Ph)');
    } else if (key === 'motor') {
      setCsSystem('three');
      setCsVoltage(400);
      setCsPowerWatts(35000);
      setCsPowerFactor(0.85);
      setCsLengthMeters(45);
      setCsMaterial('copper');
      setCsInstallMethod('Method E (In Free Air / Cable Tray)');
      setCsAmbientTemp(35);
      setCsGrouping(2);
      showPresetToast('Industrial 3-Phase Motor (35 kW)');
    } else if (key === 'solar') {
      setCsSystem('three');
      setCsVoltage(400);
      setCsPowerWatts(25000);
      setCsPowerFactor(1.0);
      setCsLengthMeters(35);
      setCsMaterial('copper');
      setCsInstallMethod('Method E (In Free Air / Cable Tray)');
      setCsAmbientTemp(40);
      setCsGrouping(1);
      showPresetToast('Solar Commercial Array (25 kW)');
    } else if (key === 'cold_storage') {
      setCsSystem('three');
      setCsVoltage(400);
      setCsPowerWatts(45000);
      setCsPowerFactor(0.85);
      setCsLengthMeters(55);
      setCsMaterial('copper');
      setCsInstallMethod('Method E (In Free Air / Cable Tray)');
      setCsAmbientTemp(35);
      setCsGrouping(2);
      showPresetToast('Industrial Cold Storage Chiller (45 kW)');
    } else if (key === 'agri_feeder') {
      setCsSystem('three');
      setCsVoltage(400);
      setCsPowerWatts(18000);
      setCsPowerFactor(0.90);
      setCsLengthMeters(85);
      setCsMaterial('aluminium');
      setCsInstallMethod('Method D (Direct in Ground / Duct)');
      setCsAmbientTemp(20);
      setCsGrouping(1);
      showPresetToast('Agricultural Barn Feeder (85m Al)');
    } else if (key === 'hvac') {
      setCsSystem('three');
      setCsVoltage(400);
      setCsPowerWatts(70000);
      setCsPowerFactor(0.88);
      setCsLengthMeters(60);
      setCsMaterial('copper');
      setCsInstallMethod('Method E (In Free Air / Cable Tray)');
      setCsAmbientTemp(30);
      setCsGrouping(1);
      showPresetToast('Commercial HVAC Plant (70 kW)');
    }
  };

  const loadWirePreset = (key: 'lighting' | 'workshop' | 'outbuilding' | 'borehole' | 'rv_hookup' | 'solar_dc' | 'site' | 'industrial' | 'crane') => {
    if (key === 'lighting') {
      setWireVoltage(230);
      setWireCurrent(10);
      setWireDistance(22);
      setWireMaterial('copper');
      setWireAllowedDrop(3);
      showPresetToast('Commercial LED Lighting (10A 3%)');
    } else if (key === 'workshop') {
      setWireVoltage(230);
      setWireCurrent(40);
      setWireDistance(35);
      setWireMaterial('copper');
      setWireAllowedDrop(3);
      showPresetToast('Workshop Sub-Panel Feeder (40A)');
    } else if (key === 'outbuilding') {
      setWireVoltage(230);
      setWireCurrent(32);
      setWireDistance(55);
      setWireMaterial('copper');
      setWireAllowedDrop(3);
      showPresetToast('Garden Studio Long Run (32A 55m)');
    } else if (key === 'borehole') {
      setWireVoltage(230);
      setWireCurrent(22);
      setWireDistance(120);
      setWireMaterial('copper');
      setWireAllowedDrop(5);
      showPresetToast('Deep Borehole Submersible Pump (120m)');
    } else if (key === 'rv_hookup') {
      setWireVoltage(230);
      setWireCurrent(50);
      setWireDistance(45);
      setWireMaterial('copper');
      setWireAllowedDrop(3);
      showPresetToast('Marina / RV Park 50A Pedestal');
    } else if (key === 'solar_dc') {
      setWireVoltage(240);
      setWireCurrent(18);
      setWireDistance(60);
      setWireMaterial('copper');
      setWireAllowedDrop(2);
      showPresetToast('Rooftop Solar DC String (2% Drop)');
    } else if (key === 'site') {
      setWireVoltage(400);
      setWireCurrent(100);
      setWireDistance(75);
      setWireMaterial('aluminium');
      setWireAllowedDrop(5);
      showPresetToast('Construction Site Board (100A Al)');
    } else if (key === 'industrial') {
      setWireVoltage(400);
      setWireCurrent(200);
      setWireDistance(120);
      setWireMaterial('copper');
      setWireAllowedDrop(3);
      showPresetToast('Industrial Switchgear Main Bus (200A)');
    } else if (key === 'crane') {
      setWireVoltage(400);
      setWireCurrent(140);
      setWireDistance(90);
      setWireMaterial('copper');
      setWireAllowedDrop(4);
      showPresetToast('Heavy Construction Tower Crane (140A)');
    }
  };

  const loadOhmsPreset = (key: 'kettle' | 'tankless' | 'motor' | 'led' | 'resistor' | 'ev_battery' | 'usbc_pd' | 'audio' | 'induction' | 'solar_storage') => {
    if (key === 'kettle') {
      setOhmsSolveMode('VI');
      setOhmsV(230);
      setOhmsI(13.04);
      setOhmsR(17.63);
      setOhmsP(3000);
      showPresetToast('Electric Kettle (3000W / 13A)');
    } else if (key === 'tankless') {
      setOhmsSolveMode('PV');
      setOhmsV(230);
      setOhmsP(9000);
      setOhmsI(39.13);
      setOhmsR(5.88);
      showPresetToast('Tankless Water Heater (9000W / 39.1A)');
    } else if (key === 'motor') {
      setOhmsSolveMode('VI');
      setOhmsV(400);
      setOhmsI(21.65);
      setOhmsR(10.67);
      setOhmsP(15000);
      showPresetToast('Workshop Motor (15 kW / 400V)');
    } else if (key === 'led') {
      setOhmsSolveMode('VI');
      setOhmsV(230);
      setOhmsI(0.87);
      setOhmsR(264.5);
      setOhmsP(200);
      showPresetToast('Commercial LED Troffers (200W)');
    } else if (key === 'resistor') {
      setOhmsSolveMode('VR');
      setOhmsV(12);
      setOhmsR(1000);
      setOhmsI(0.012);
      setOhmsP(0.144);
      showPresetToast('PCB Benchtop Resistor (12V 1kΩ)');
    } else if (key === 'ev_battery') {
      setOhmsSolveMode('VI');
      setOhmsV(48);
      setOhmsI(150);
      setOhmsR(0.32);
      setOhmsP(7200);
      showPresetToast('48V EV Traction Battery Pack (7.2 kW)');
    } else if (key === 'usbc_pd') {
      setOhmsSolveMode('VI');
      setOhmsV(20);
      setOhmsI(5);
      setOhmsR(4.0);
      setOhmsP(100);
      showPresetToast('USB-C PD 100W Fast Charger Port');
    } else if (key === 'audio') {
      setOhmsSolveMode('VR');
      setOhmsV(50);
      setOhmsR(8);
      setOhmsI(6.25);
      setOhmsP(312.5);
      showPresetToast('8Ω High-Power Pro Subwoofer (312W)');
    } else if (key === 'induction') {
      setOhmsSolveMode('PI');
      setOhmsP(75000);
      setOhmsI(108.25);
      setOhmsV(400);
      setOhmsR(3.70);
      showPresetToast('75kW Industrial Induction Furnace');
    } else if (key === 'solar_storage') {
      setOhmsSolveMode('VI');
      setOhmsV(24);
      setOhmsI(83.33);
      setOhmsR(0.288);
      setOhmsP(2000);
      showPresetToast('24V Off-Grid Battery Inverter (2kW)');
    }
  };

  const loadBreakerPreset = (key: 'house' | 'coffee' | 'fastfood' | 'medical' | 'retail' | 'gym' | 'workshop' | 'office') => {
    if (key === 'house') {
      setAppliances([
        { id: '1', name: 'Ring Socket Circuits', watts: 7360, qty: 1 },
        { id: '2', name: 'LED House Lighting', watts: 500, qty: 1 },
        { id: '3', name: 'Kitchen Induction Cooker', watts: 7200, qty: 1 },
        { id: '4', name: 'Electric Shower Unit', watts: 9500, qty: 1 },
        { id: '5', name: 'Heat Pump System', watts: 4500, qty: 1 },
        { id: '6', name: 'EV Home Charger', watts: 7400, qty: 1 },
      ]);
      setDiversityFactor(65);
      showPresetToast('All-Electric Smart Home (65% Diversity)');
    } else if (key === 'coffee') {
      setAppliances([
        { id: '1', name: 'Commercial Espresso Machine', watts: 6000, qty: 1 },
        { id: '2', name: 'Steam Wand & Water Boiler', watts: 3000, qty: 1 },
        { id: '3', name: 'Coffee Grinders & POS', watts: 1500, qty: 1 },
        { id: '4', name: 'Commercial Air Conditioning', watts: 4500, qty: 1 },
        { id: '5', name: 'Storefront & Indoor Lighting', watts: 2000, qty: 1 },
        { id: '6', name: 'Commercial Dishwasher', watts: 3500, qty: 1 },
      ]);
      setDiversityFactor(80);
      showPresetToast('Commercial Coffee Shop (80% Diversity)');
    } else if (key === 'fastfood') {
      setAppliances([
        { id: '1', name: 'Twin Commercial Deep Fryers', watts: 14000, qty: 1 },
        { id: '2', name: 'Commercial Griddle Plate', watts: 9000, qty: 1 },
        { id: '3', name: 'Conveyor Pizza Oven', watts: 8000, qty: 1 },
        { id: '4', name: 'Walk-In Chiller & Freezer', watts: 4500, qty: 1 },
        { id: '5', name: 'Extraction Hood Exhaust', watts: 3500, qty: 1 },
        { id: '6', name: 'Sanitizing Dishwasher', watts: 6000, qty: 1 },
      ]);
      setDiversityFactor(75);
      showPresetToast('Commercial Fast Food Kitchen (75% Div)');
    } else if (key === 'medical') {
      setAppliances([
        { id: '1', name: 'Dental Chair Treatment Units', watts: 4000, qty: 1 },
        { id: '2', name: 'Autoclave Sterilizers', watts: 5000, qty: 1 },
        { id: '3', name: 'Digital X-ray Imaging Array', watts: 6000, qty: 1 },
        { id: '4', name: 'Clean-Room HVAC & Filtration', watts: 8000, qty: 1 },
        { id: '5', name: 'Shadowless Clinical Lights', watts: 2000, qty: 1 },
        { id: '6', name: 'IT Server & Diagnostics', watts: 2000, qty: 1 },
      ]);
      setDiversityFactor(70);
      showPresetToast('Medical & Dental Clinic (70% Div)');
    } else if (key === 'retail') {
      setAppliances([
        { id: '1', name: 'Retail Track Lighting Array', watts: 3500, qty: 1 },
        { id: '2', name: 'HVAC Heat Pump Array', watts: 7000, qty: 1 },
        { id: '3', name: 'POS Server & Terminals', watts: 1500, qty: 1 },
        { id: '4', name: 'Illuminated Storefront Sign', watts: 1000, qty: 1 },
        { id: '5', name: 'Background Audio & Security', watts: 800, qty: 1 },
      ]);
      setDiversityFactor(80);
      showPresetToast('High-Street Retail Facility (80% Div)');
    } else if (key === 'gym') {
      setAppliances([
        { id: '1', name: 'Commercial Treadmill Bank', watts: 8000, qty: 1 },
        { id: '2', name: 'Finnish Sauna Heater Unit', watts: 12000, qty: 1 },
        { id: '3', name: 'Booster Water Heaters', watts: 9000, qty: 1 },
        { id: '4', name: 'High-Volume Gym HVAC', watts: 15000, qty: 1 },
        { id: '5', name: 'Sound System & Dynamic LED', watts: 3000, qty: 1 },
      ]);
      setDiversityFactor(70);
      showPresetToast('Fitness Gym & Wellness Center (70% Div)');
    } else if (key === 'workshop') {
      setAppliances([
        { id: '1', name: 'Hydraulic 2-Post Hoists', watts: 6000, qty: 1 },
        { id: '2', name: 'Rotary Screw Air Compressor', watts: 7500, qty: 1 },
        { id: '3', name: 'MIG / TIG Welding Stations', watts: 12000, qty: 1 },
        { id: '4', name: 'Tyre Changer & Balancers', watts: 3000, qty: 1 },
        { id: '5', name: 'Industrial High-Bay Lights', watts: 2500, qty: 1 },
      ]);
      setDiversityFactor(60);
      showPresetToast('Auto Repair & Welding Garage (60% Div)');
    } else if (key === 'office') {
      setAppliances([
        { id: '1', name: 'Workstation Dual-Monitor PC Banks', watts: 12000, qty: 1 },
        { id: '2', name: 'Server Room Precision AC', watts: 8000, qty: 1 },
        { id: '3', name: 'Office Perimeter LED Panels', watts: 4000, qty: 1 },
        { id: '4', name: 'Kitchenette Instant Boilers', watts: 6000, qty: 1 },
        { id: '5', name: 'Elevator Lift Motor Feeder', watts: 15000, qty: 1 },
      ]);
      setDiversityFactor(65);
      showPresetToast('Corporate Office Floor (65% Div)');
    }
  };

  const loadConverterPreset = (key: 'motor_15hp' | 'tractor_50hp' | 'hvac_3ton' | 'hvac_10ton' | 'ev_7kw' | 'ev_150kw' | 'gen_10kva' | 'gen_100kva' | 'espresso_3kw' | 'solar_5kw') => {
    if (key === 'motor_15hp') {
      setConvVal(15);
      setConvUnit('HP');
      setConvPF(0.85);
      setConvVolts(400);
      showPresetToast('15 HP Industrial Motor (11.19 kW)');
    } else if (key === 'tractor_50hp') {
      setConvVal(50);
      setConvUnit('HP');
      setConvPF(0.86);
      setConvVolts(400);
      showPresetToast('50 HP Agricultural Irrigation Pump (37.28 kW)');
    } else if (key === 'hvac_3ton') {
      setConvVal(36000);
      setConvUnit('BTU');
      setConvPF(0.90);
      setConvVolts(240);
      showPresetToast('3-Ton / 36k BTU Residential AC (10.55 kW)');
    } else if (key === 'hvac_10ton') {
      setConvVal(120000);
      setConvUnit('BTU');
      setConvPF(0.88);
      setConvVolts(400);
      showPresetToast('10-Ton / 120k BTU Commercial Chiller (35.17 kW)');
    } else if (key === 'ev_7kw') {
      setConvVal(7.4);
      setConvUnit('kW');
      setConvPF(0.98);
      setConvVolts(230);
      showPresetToast('7.4 kW Level-2 EV Charger (9.92 HP)');
    } else if (key === 'ev_150kw') {
      setConvVal(150);
      setConvUnit('kW');
      setConvPF(0.99);
      setConvVolts(400);
      showPresetToast('150 kW DC Ultra-Fast EV Hub (201.1 HP)');
    } else if (key === 'gen_10kva') {
      setConvVal(10);
      setConvUnit('kVA');
      setConvPF(0.85);
      setConvVolts(230);
      showPresetToast('10 kVA Domestic Standby Generator (8.5 kW)');
    } else if (key === 'gen_100kva') {
      setConvVal(100);
      setConvUnit('kVA');
      setConvPF(0.85);
      setConvVolts(400);
      showPresetToast('100 kVA Commercial Backup Generator (85 kW)');
    } else if (key === 'espresso_3kw') {
      setConvVal(3000);
      setConvUnit('W');
      setConvPF(1.0);
      setConvVolts(230);
      showPresetToast('3000 W Commercial Espresso Machine (3 kW)');
    } else if (key === 'solar_5kw') {
      setConvVal(5000);
      setConvUnit('W');
      setConvPF(1.0);
      setConvVolts(230);
      showPresetToast('5000 W Solar PV Inverter Output (5 kW)');
    }
  };

  // Helper renderer for question mark help buttons
  const renderHelpButton = (topicKey: string) => {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (HELP_DICTIONARY[topicKey]) {
            setHelpModalInfo(HELP_DICTIONARY[topicKey]);
          }
        }}
        className="inline-flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-blue-50"
        title="Click for parameter explanation & electrical code standard"
      >
        <HelpCircle size={13} />
      </button>
    );
  };

  // Real-time Wire Gauge Sizer calculation
  const calculateWireResults = () => {
    const isCu = wireMaterial === 'copper';
    const allowedDropVolts = (wireVoltage * wireAllowedDrop) / 100;

    let selected = AWG_SPECS[3]; // default 12 AWG
    for (let i = 0; i < AWG_SPECS.length; i++) {
      const spec = AWG_SPECS[i];
      const maxAmp = isCu ? spec.maxAmpCu : spec.maxAmpCu * 0.78;
      const rPerKm = isCu ? spec.rCuPerKm : spec.rAlPerKm;
      const vd = (2 * wireCurrent * wireDistance * rPerKm) / 1000;

      if (maxAmp >= wireCurrent && vd <= allowedDropVolts) {
        selected = spec;
        break;
      }
    }

    const rPerKm = isCu ? selected.rCuPerKm : selected.rAlPerKm;
    const maxAmp = isCu ? selected.maxAmpCu : selected.maxAmpCu * 0.78;
    const vDrop = (2 * wireCurrent * wireDistance * rPerKm) / 1000;
    const vDropPct = (vDrop / (wireVoltage || 1)) * 100;
    const endVoltage = wireVoltage - vDrop;
    const rTotal = (2 * wireDistance * rPerKm) / 1000;
    const powerLossWatts = Math.pow(wireCurrent, 2) * rTotal;
    const totalPower = wireVoltage * wireCurrent;
    const powerLossPct = (powerLossWatts / (totalPower || 1)) * 100;
    const isPass = vDropPct <= wireAllowedDrop && maxAmp >= wireCurrent;

    return {
      selected,
      maxAmp,
      vDrop,
      vDropPct,
      endVoltage,
      rTotal,
      powerLossWatts,
      powerLossPct,
      isPass,
      allowedDropVolts
    };
  };

  // Real-time Ohm's Law & Power Law calculation
  const calculateOhmsResults = () => {
    let V = isFinite(ohmsV) ? Math.max(0, ohmsV) : 230;
    let I = isFinite(ohmsI) ? Math.max(0, ohmsI) : 10;
    let R = isFinite(ohmsR) ? Math.max(0, ohmsR) : 23;
    let P = isFinite(ohmsP) ? Math.max(0, ohmsP) : 2300;
    const rawPf = isFinite(ohmsPF) ? ohmsPF : 0.85;
    const pf = Math.min(1.0, Math.max(0.1, rawPf));

    if (ohmsSolveMode === 'VI') {
      R = I > 0 ? V / I : 0;
      P = V * I * pf;
    } else if (ohmsSolveMode === 'VR') {
      I = R > 0 ? V / R : 0;
      P = V * I * pf;
    } else if (ohmsSolveMode === 'IR') {
      V = I * R;
      P = V * I * pf;
    } else if (ohmsSolveMode === 'PV') {
      I = V > 0 ? P / (V * pf) : 0;
      R = I > 0 ? V / I : 0;
    } else if (ohmsSolveMode === 'PI') {
      V = I > 0 ? P / (I * pf) : 0;
      R = I > 0 ? V / I : 0;
    } else if (ohmsSolveMode === 'PR') {
      I = R > 0 ? Math.sqrt(P / (R * pf)) : 0;
      V = I * R;
    }

    if (!isFinite(V)) V = 0;
    if (!isFinite(I)) I = 0;
    if (!isFinite(R)) R = 0;
    if (!isFinite(P)) P = 0;

    const S = V * I; // Apparent power in VA
    const Q = Math.sqrt(Math.max(0, Math.pow(S, 2) - Math.pow(P, 2))); // Reactive power in VAR
    const angleRad = Math.acos(pf);
    const angleDeg = (angleRad * 180) / Math.PI;

    return {
      V: isFinite(V) ? V : 0,
      I: isFinite(I) ? I : 0,
      R: isFinite(R) ? R : 0,
      P: isFinite(P) ? P : 0,
      S: isFinite(S) ? S : 0,
      Q: isFinite(Q) ? Q : 0,
      pf,
      angleDeg: isFinite(angleDeg) ? angleDeg : 0
    };
  };

  // Real-time MCB & RCBO Selection Assistant Engine
  const calculateMcbRcboResults = () => {
    const mcbRatings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125];
    const designCurrent125 = mcbLoadCurrent * 1.25;
    const recommendedMcb = mcbRatings.find(r => r >= designCurrent125) || 125;

    let recommendedCurve: 'Type B' | 'Type C' | 'Type D' = 'Type B';
    let curveDesc = '';
    let inrushTripRange = '';

    if (mcbApplication === 'sockets' || mcbApplication === 'lighting') {
      recommendedCurve = 'Type B';
      curveDesc = 'Resistive & domestic socket/lighting loads. Trips at 3x to 5x rating.';
      inrushTripRange = `${recommendedMcb * 3}A - ${recommendedMcb * 5}A`;
    } else if (mcbApplication === 'motor' || mcbApplication === 'hvac') {
      recommendedCurve = 'Type C';
      curveDesc = 'Motors, pumps & air conditioning. Trips at 5x to 10x rating.';
      inrushTripRange = `${recommendedMcb * 5}A - ${recommendedMcb * 10}A`;
    } else if (mcbApplication === 'ev') {
      recommendedCurve = 'Type B';
      curveDesc = 'EV Chargers with dedicated electronic RCD class protection.';
      inrushTripRange = `${recommendedMcb * 3}A - ${recommendedMcb * 5}A`;
    } else {
      recommendedCurve = 'Type D';
      curveDesc = 'Transformers, X-rays & heavy industrial inrush. Trips at 10x to 20x rating.';
      inrushTripRange = `${recommendedMcb * 10}A - ${recommendedMcb * 20}A`;
    }

    let recommendedRcdType = 'Type AC';
    let rcdSensitivity = '30 mA';
    let rcdDesc = 'Standard shock protection (30mA trip in ≤ 40ms)';

    if (mcbApplication === 'ev') {
      recommendedRcdType = 'Type B / Type A (6mA DC)';
      rcdSensitivity = '30 mA AC / 6 mA DC';
      rcdDesc = 'Detects smooth DC leakage currents from EV onboard batteries.';
    } else if (mcbApplication === 'hvac' || mcbApplication === 'motor') {
      recommendedRcdType = 'Type F / Type A';
      rcdSensitivity = '30 mA';
      rcdDesc = 'Handles variable frequency drives and pulsating DC residual currents.';
    } else if (mcbApplication === 'lighting') {
      recommendedRcdType = 'Type AC / Type A';
      rcdSensitivity = '30 mA';
      rcdDesc = 'Prevents electrical shock on lighting branch circuits.';
    } else {
      recommendedRcdType = 'Type A';
      rcdSensitivity = '30 mA';
      rcdDesc = 'Standard residual current protection for socket outlets.';
    }

    const deviceCombo = mcbRequireRcd
      ? `Integrated RCBO (${recommendedCurve}, ${recommendedMcb}A, ${rcdSensitivity}, ${recommendedRcdType}, ${mcbShortCircuitKa}kA)`
      : `MCB (${recommendedCurve}, ${recommendedMcb}A, ${mcbShortCircuitKa}kA)`;

    return {
      designCurrent125,
      recommendedMcb,
      recommendedCurve,
      curveDesc,
      inrushTripRange,
      recommendedRcdType,
      rcdSensitivity,
      rcdDesc,
      deviceCombo
    };
  };

  // Real-time Three-Phase Power Engine
  const calculateThreePhaseResults = () => {
    const isStar = tpConfig === 'star';
    const VL = tpLineVoltage || 400;
    const IL = tpLineCurrent || 32;
    const pf = Math.min(1.0, Math.max(0.1, tpPF || 0.85));

    const VP = isStar ? VL / Math.sqrt(3) : VL;
    const IP = isStar ? IL : IL / Math.sqrt(3);

    const P_active_kW = (Math.sqrt(3) * VL * IL * pf) / 1000;
    const S_apparent_kVA = (Math.sqrt(3) * VL * IL) / 1000;
    const sinPhi = Math.sin(Math.acos(pf));
    const Q_reactive_kVAR = (Math.sqrt(3) * VL * IL * sinPhi) / 1000;

    let IN = 0;
    if (tpUnbalanced) {
      const I1 = tpCurrentL1;
      const I2 = tpCurrentL2;
      const I3 = tpCurrentL3;
      IN = Math.sqrt(Math.max(0, I1*I1 + I2*I2 + I3*I3 - (I1*I2 + I2*I3 + I3*I1)));
    }

    const targetPF = Math.min(1.0, Math.max(pf, tpTargetPF || 0.98));
    const tanPhiCurrent = Math.tan(Math.acos(pf));
    const tanPhiTarget = Math.tan(Math.acos(targetPF));
    const requiredKVAR = Math.max(0, P_active_kW * (tanPhiCurrent - tanPhiTarget));

    return {
      VP,
      IP,
      P_active_kW,
      S_apparent_kVA,
      Q_reactive_kVAR,
      IN,
      targetPF,
      requiredKVAR
    };
  };

  // Real-time Energy Cost & Emissions Engine
  const calculateEnergyCostResults = () => {
    const kw = Math.max(0, ecPowerKw || 0);
    const hPerDay = Math.min(24, Math.max(0, ecHoursPerDay || 0));
    const dPerWeek = Math.min(7, Math.max(0, ecDaysPerWeek || 0));

    const dailyKwh = kw * hPerDay;
    const weeklyKwh = dailyKwh * dPerWeek;
    const monthlyKwh = weeklyKwh * 4.33;
    const annualKwh = weeklyKwh * 52;

    let effectiveRate = ecTariffRate;
    if (ecPeakSplit) {
      const peakFrac = Math.min(100, Math.max(0, ecPeakRatio)) / 100;
      effectiveRate = (peakFrac * ecPeakRate) + ((1 - peakFrac) * ecOffPeakRate);
    }

    const dailyCost = dailyKwh * effectiveRate;
    const monthlyCost = monthlyKwh * effectiveRate;
    const annualCost = annualKwh * effectiveRate;
    const fiveYearCost = annualCost * 5;

    const annualCo2Kg = annualKwh * ecCo2Factor;
    const annualCo2Tonnes = annualCo2Kg / 1000;

    return {
      dailyKwh,
      monthlyKwh,
      annualKwh,
      effectiveRate,
      dailyCost,
      monthlyCost,
      annualCost,
      fiveYearCost,
      annualCo2Kg,
      annualCo2Tonnes
    };
  };

  // -------------------------------------------------------------
  // Cable Size Calculation Engine
  // -------------------------------------------------------------
  const calculateCableResults = () => {
    // Design Current (Ib)
    let Ib = 0;
    if (csSystem === 'single') {
      Ib = csPowerWatts / (csVoltage * csPowerFactor);
    } else {
      Ib = csPowerWatts / (Math.sqrt(3) * csVoltage * csPowerFactor);
    }

    // Derating calculation
    let fTemp = 1.0;
    if (csAmbientTemp > 30) {
      if (csInsulation === 'pvc') fTemp = Math.max(0.7, 1 - (csAmbientTemp - 30) * 0.015);
      else fTemp = Math.max(0.8, 1 - (csAmbientTemp - 30) * 0.012);
    }

    let fInstall = 1.0;
    if (csInstallMethod.includes('conduit')) fInstall = 0.9;
    else if (csInstallMethod.includes('burial')) fInstall = 0.85;

    let fGroup = 1.0;
    if (csGrouping === 2) fGroup = 0.8;
    else if (csGrouping >= 3) fGroup = 0.7;

    const deratingTotal = fTemp * fInstall * fGroup;
    const requiredCapacity = Ib / deratingTotal;

    // Find recommended cable
    const isCu = csMaterial === 'copper';
    const isPvc = csInsulation === 'pvc';

    let recommended = CABLE_SIZES[1]; // default 2.5mm²
    let undersized = CABLE_SIZES[0];
    let oversized = CABLE_SIZES[3];

    for (let i = 0; i < CABLE_SIZES.length; i++) {
      const c = CABLE_SIZES[i];
      const baseAmp = isCu ? (isPvc ? c.ampCuPvc : c.ampCuXlpe) : (isPvc ? c.ampAlPvc : c.ampAlXlpe);
      if (baseAmp === 0) continue;

      if (baseAmp >= requiredCapacity) {
        // Check voltage drop %
        const phaseMult = csSystem === 'single' ? 2 : 1.732;
        const rPerM = (isCu ? c.rCu : c.rAl) / 1000;
        const vDrop = phaseMult * Ib * csLengthMeters * (rPerM * csPowerFactor);
        const dropPct = (vDrop / csVoltage) * 100;

        recommended = c;
        undersized = i > 0 ? CABLE_SIZES[i - 1] : CABLE_SIZES[0];
        oversized = i < CABLE_SIZES.length - 1 ? CABLE_SIZES[i + 1] : CABLE_SIZES[CABLE_SIZES.length - 1];

        if (dropPct <= csMaxDropPct) {
          break;
        }
      }
    }

    // Recommended cable math
    const phaseMult = csSystem === 'single' ? 2 : 1.732;
    const recRPerM = (isCu ? recommended.rCu : recommended.rAl) / 1000;
    const recVDrop = phaseMult * Ib * csLengthMeters * (recRPerM * csPowerFactor);
    const recDropPct = (recVDrop / csVoltage) * 100;
    const recBaseAmp = isCu ? (isPvc ? recommended.ampCuPvc : recommended.ampCuXlpe) : (isPvc ? recommended.ampAlPvc : recommended.ampAlXlpe);
    const endVoltage = csVoltage - recVDrop;
    const minAllowedVoltage = csVoltage * (1 - csMaxDropPct / 100);

    // Other cables drop calculations for chart
    const getVDropCurve = (c: CableSpec) => {
      const r = (isCu ? c.rCu : c.rAl) / 1000;
      const points = [];
      for (let m = 0; m <= csLengthMeters; m += Math.max(1, Math.floor(csLengthMeters / 5))) {
        const vd = phaseMult * Ib * m * (r * csPowerFactor);
        points.push({ m, v: csVoltage - vd });
      }
      return points;
    };

    return {
      designCurrent: Ib,
      requiredCapacity,
      recommended,
      undersized,
      oversized,
      recBaseAmp,
      recVDrop,
      recDropPct,
      endVoltage,
      minAllowedVoltage,
      mcb: recommended.recommendedMcb,
      curveRec: getVDropCurve(recommended),
      curveUnder: getVDropCurve(undersized),
      curveOver: getVDropCurve(oversized),
      deratingTotal,
    };
  };

  const calc = calculateCableResults();

  const handleReset = () => {
    // 1. Cable Size Calculator
    setCsSystem('single');
    setCsVoltage(230);
    setCsPowerWatts(3000);
    setCsPowerFactor(0.95);
    setCsLengthMeters(25);
    setCsInstallMethod('Clipped direct');
    setCsMaterial('copper');
    setCsCableType('Twin & Earth (2C + CPC)');
    setCsMaxDropPct(3);
    setCsAmbientTemp(30);
    setCsGrouping(1);
    setCsInsulation('pvc');
    setCsTab('3d');

    // 2. Wire Gauge Sizer
    setWireTab('sizer');
    setWireCurrent(15);
    setWireVoltage(230);
    setWireDistance(25);
    setWireMaterial('copper');
    setWireAllowedDrop(3);

    // 3. Ohm's Law
    setOhmsSolveMode('VI');
    setOhmsV(230);
    setOhmsI(10);
    setOhmsR(23);
    setOhmsP(2300);
    setOhmsPF(0.85);

    // 4. Power Unit Converter
    setConvVal(1000);
    setConvUnit('W');
    setConvPF(0.85);
    setConvVolts(230);

    // 5. Breaker & Load Calculator
    setAppliances([
      { id: '1', name: 'Refrigerator', watts: 600, qty: 1 },
      { id: '2', name: 'LED Lighting', watts: 150, qty: 1 },
      { id: '3', name: 'Microwave Oven', watts: 1200, qty: 1 },
    ]);
    setDiversityFactor(80);
    setNewAppName('');
    setNewAppWatts('');

    // 6. MCB / RCBO Sizer
    setMcbLoadCurrent(24);
    setMcbVoltage(230);
    setMcbApplication('sockets');
    setMcbInrushMult(3);
    setMcbRequireRcd(true);
    setMcbShortCircuitKa(6);

    // 7. Three-Phase Power
    setTpConfig('star');
    setTpLineVoltage(400);
    setTpLineCurrent(32);
    setTpPF(0.85);
    setTpTargetPF(0.98);
    setTpUnbalanced(false);

    // 8. Energy Cost
    setEcPowerKw(3.5);
    setEcHoursPerDay(8);
    setEcDaysPerWeek(5);
    setEcTariffRate(0.18);
    setEcPeakSplit(false);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleSave = () => {
    setSavedCalc(true);
    setTimeout(() => setSavedCalc(false), 2000);
  };

  // -------------------------------------------------------------
  // Tool Metadata List
  // -------------------------------------------------------------
  const toolsList = [
    {
      id: 'cablesize' as ToolId,
      name: '🔌 Cable Size Calculator',
      badge: 'BS 7671 & IEC 60364',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: Layers,
      iconBg: 'bg-emerald-500/10 text-emerald-600',
      desc: 'Calculate optimal cable cross-section (mm² / AWG), derating factors (temp, grouping, installation method), and conductor insulation.',
    },
    {
      id: 'voltagedrop' as ToolId,
      name: '📉 Voltage Drop Calculator',
      badge: 'NEC & BS Standards',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Scale,
      iconBg: 'bg-blue-500/10 text-blue-600',
      desc: 'Analyze voltage drop along conductor run length, calculate end voltage, power dissipation, and verify compliance against 3% / 5% limits.',
    },
    {
      id: 'loadcalc' as ToolId,
      name: '⚡ Electrical Load Calculator',
      badge: 'Demand & Diversity',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: Cpu,
      iconBg: 'bg-indigo-500/10 text-indigo-600',
      desc: 'Calculate total connected load, apply demand & diversity factors, calculate 125% continuous safety margins, and size main service feeders.',
    },
    {
      id: 'ohms' as ToolId,
      name: "🔋 Power / Ohm's Law Calculator",
      badge: 'Interactive Matrix',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Zap,
      iconBg: 'bg-amber-500/10 text-amber-600',
      desc: 'Solve Voltage, Current, Resistance, Real Power (kW), Apparent Power (kVA), Reactive Power (kVAR), and Power Factor with real-time feedback.',
    },
    {
      id: 'mcb_rcbo' as ToolId,
      name: '🛡 MCB / RCBO / RCD selection assistant',
      badge: 'Trip Curves B/C/D & RCD',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: ShieldCheck,
      iconBg: 'bg-purple-500/10 text-purple-600',
      desc: 'Determine overcurrent circuit breaker trip ratings, curve characteristics (Type B, C, D), RCD residual leakage sensitivity (30mA), and breaking capacity.',
    },
    {
      id: 'threephase' as ToolId,
      name: '⚡ Three-Phase Power Calculator',
      badge: 'Star / Delta & Neutral',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: Activity,
      iconBg: 'bg-rose-500/10 text-rose-600',
      desc: 'Calculate 3-phase Star (Wye) and Delta systems, line vs phase voltages/currents, active/apparent/reactive power, neutral current, and PF correction.',
    },
    {
      id: 'energycost' as ToolId,
      name: '💰 Energy Cost Calculator',
      badge: 'Tariff & Carbon Estimator',
      badgeColor: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: Calculator,
      iconBg: 'bg-teal-500/10 text-teal-600',
      desc: 'Calculate daily, monthly, and annual operating costs ($/kWh), duty cycle usage, peak/off-peak tariff splits, and carbon emissions (kg CO2).',
    },
    {
      id: 'converter' as ToolId,
      name: '🔄 Electrical Unit Converter',
      badge: 'Multi-Unit Conversion',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      icon: Gauge,
      iconBg: 'bg-cyan-500/10 text-cyan-600',
      desc: 'Convert seamlessly between Watts, Horsepower (HP), Kilowatts (kW), kVA, and Thermal BTUs.',
    },
  ];

  if (!activeTool) {
    const isDark = theme === 'dark';
    return (
      <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-blue-500/20 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      }`}>
        <Navbar theme={theme} />

        <main className="flex-1 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={14} />
                ElectraSim Engineering Suite
              </div>
              <h1 className={`font-serif text-4xl md:text-5xl font-bold mb-4 tracking-tight ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                Electrical Assistant Tools
              </h1>
              <p className={`text-base leading-relaxed ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Select a tool below to perform cable sizing, voltage drop analysis, circuit load calculations, or unit conversions.
              </p>

              {/* Dual-Standard Toggle Banner */}
              <div className={`mt-6 p-4 rounded-2xl border max-w-2xl mx-auto shadow-md transition-all ${
                isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Globe2 size={16} className="text-blue-500" />
                    <span className="text-xs font-bold font-mono uppercase tracking-wider">
                      Active Engineering Standard
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsStandardModalOpen(true)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ArrowRightLeft size={13} />
                    Comparison & Code Matrix
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleStandardChange('NEC')}
                    className={`py-2.5 px-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      standard === 'NEC'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/30'
                        : isDark
                        ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>🇺🇸</span>
                        <span>US Standard (NEC)</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 font-mono ${standard === 'NEC' ? 'text-blue-100' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        NFPA 70 • AWG/kcmil • 120/480V 60Hz
                      </div>
                    </div>
                    {standard === 'NEC' && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStandardChange('IEC')}
                    className={`py-2.5 px-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      standard === 'IEC'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-400/30'
                        : isDark
                        ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>🇬🇧 🇪🇺</span>
                        <span>International (IEC / BS)</span>
                      </div>
                      <div className={`text-[10px] mt-0.5 font-mono ${standard === 'IEC' ? 'text-blue-100' : isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        IEC 60364 / BS 7671 • mm² • 230/400V 50Hz
                      </div>
                    </div>
                    {standard === 'IEC' && (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* Theme Toggle & History Log Button Bar */}
              <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    isDark
                      ? 'bg-slate-900 text-amber-300 border-slate-700 hover:bg-slate-800 shadow-md ring-1 ring-amber-400/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
                  }`}
                  title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                >
                  {isDark ? <Moon size={15} className="text-amber-400" /> : <Sun size={15} className="text-amber-500" />}
                  <span>{isDark ? 'Dark Theme Enabled' : 'Light Theme Enabled'}</span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ml-1 ${
                    isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-50 text-blue-600 border border-blue-200'
                  }`}>
                    {theme}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    isDark
                      ? 'bg-slate-900 text-amber-400 border-slate-700 hover:bg-slate-800 shadow-md'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-sm'
                  }`}
                  title="View Saved Calculation History Log"
                >
                  <History size={15} className="text-amber-500" />
                  <span>Calculation History</span>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-amber-500/20 text-amber-400">
                    {history.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Calculation History Log Modal */}
            <CalculationHistoryLog
              history={history}
              onClearHistory={handleClearHistory}
              onRemoveEntry={handleRemoveHistoryEntry}
              onSelectEntry={handleSelectHistoryEntry}
              isDark={isDark}
              isOpen={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
            />

            {/* Standard Comparison Modal */}
            <StandardComparisonModal
              isOpen={isStandardModalOpen}
              onClose={() => setIsStandardModalOpen(false)}
              currentStandard={standard}
              onSelectStandard={handleStandardChange}
              isDark={isDark}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {toolsList.map((t) => {
                const IconComp = t.icon;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveTool(t.id)}
                    className={`border rounded-2xl p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800 text-slate-100 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-900/20'
                        : 'bg-white border-slate-200 text-slate-900 hover:border-blue-500/50 hover:shadow-lg'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl ${t.iconBg} flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}>
                          <IconComp size={24} />
                        </div>
                        <span className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border ${t.badgeColor}`}>
                          {t.badge}
                        </span>
                      </div>

                      <h3 className={`font-serif text-xl font-bold mb-2 transition-colors ${
                        isDark ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                      }`}>
                        {t.name}
                      </h3>

                      <p className={`text-sm leading-relaxed mb-6 ${
                        isDark ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {t.desc}
                      </p>
                    </div>

                    <div className={`pt-4 border-t flex items-center justify-between text-xs font-semibold ${
                      isDark ? 'border-slate-800 text-blue-400' : 'border-slate-100 text-blue-600'
                    }`}>
                      <span>Launch Tool</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* Global Interactive Help Modal Popup */}
        {helpModalInfo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {helpModalInfo.category || 'Electrical Code Guide'}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                    {helpModalInfo.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setHelpModalInfo(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900">{helpModalInfo.summary}</p>
                <p className="text-slate-600 text-xs leading-relaxed">{helpModalInfo.details}</p>

                {helpModalInfo.standard && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Regulation & Code Standard
                    </div>
                    <div className="text-slate-600 font-mono">{helpModalInfo.standard}</div>
                  </div>
                )}

                {helpModalInfo.formula && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-blue-800 flex items-center gap-1.5">
                      <Zap size={14} className="text-blue-600" />
                      Formula Reference
                    </div>
                    <div className="text-blue-900 font-mono font-semibold">{helpModalInfo.formula}</div>
                  </div>
                )}

                {helpModalInfo.example && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-amber-800 flex items-center gap-1.5">
                      <Info size={14} className="text-amber-600" />
                      Typical Real-World Example
                    </div>
                    <div className="text-amber-900 italic">{helpModalInfo.example}</div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setHelpModalInfo(null)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    );
  }

  // Render Full Screen Workspace when a Tool is Active
  const isDark = theme === 'dark';

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col overflow-hidden font-sans select-none transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
      onClick={() => {
        if (isNavOpen) setIsNavOpen(false);
      }}
    >
      {/* Navigation Overlay Backdrop - Clicking anywhere outside hides navigation menu */}
      {isNavOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setIsNavOpen(false);
          }}
        />
      )}

      {/* Top Fullscreen Header Navigation Bar */}
      <header className={`h-13 px-4 flex items-center justify-between shrink-0 relative z-50 transition-colors border-b ${
        isDark ? 'bg-slate-900 border-slate-800/90 text-white' : 'bg-white border-slate-200/90 text-slate-900 shadow-2xs'
      }`}>
        {/* Left: Logo on left side with three bars (hamburger menu) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsNavOpen(!isNavOpen);
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-2xs group ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700/80 text-slate-200'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
            }`}
            title="Toggle Navigation Menu"
          >
            <Menu size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
            <span className={`font-serif font-bold text-sm flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              ⚡ ElectraSim
            </span>
          </button>

          {/* Navigation Drawer Popup */}
          {isNavOpen && (
            <div 
              className={`absolute top-12 left-4 z-50 w-72 backdrop-blur-md border rounded-2xl p-3 shadow-2xl space-y-1.5 animate-in fade-in zoom-in-95 duration-150 ${
                isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`px-2 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border-b flex items-center justify-between ${
                isDark ? 'text-amber-400 border-slate-800/80' : 'text-amber-600 border-slate-100'
              }`}>
                <span>Simulation Tools</span>
                <Sparkles size={12} />
              </div>

              <div className="space-y-1 pt-1">
                {toolsList.map((tool) => {
                  const IconComp = tool.icon;
                  const isActive = tool.id === activeTool;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        setActiveTool(tool.id);
                        setIsNavOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : isDark ? 'text-slate-300 hover:bg-slate-800 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <IconComp size={15} />
                      {tool.name}
                    </button>
                  );
                })}
              </div>

              {/* Theme Toggle Button inside Navigation Drawer */}
              <div className={`border-t my-1 pt-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    isDark
                      ? 'bg-slate-800/80 text-amber-300 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isDark ? <Moon size={15} className="text-amber-400" /> : <Sun size={15} className="text-amber-500" />}
                    Theme Mode
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                    isDark ? 'bg-amber-400/20 text-amber-300' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {theme}
                  </span>
                </button>
              </div>

              <div className={`border-t my-1 pt-1 space-y-1 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => { setActiveTool(null); setIsNavOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
                    isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <ArrowLeft size={14} />
                  Return to Tools Hub
                </button>

                <button
                  type="button"
                  onClick={() => { setLocation('/'); setIsNavOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-colors ${
                    isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Sparkles size={14} className="text-blue-500" />
                  ElectraSim Home
                </button>
              </div>
            </div>
          )}

          <div className={`hidden md:flex items-center gap-2 border-l pl-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <span className={`text-xs font-bold flex items-center gap-1.5 font-serif ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {toolsList.find(t => t.id === activeTool)?.name}
            </span>
          </div>
        </div>

        {/* Center: View Switcher */}
        {activeTool === 'cablesize' && (
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setCsTab('3d')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                csTab === '3d'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box size={14} />
              3D Cable Simulation
            </button>
            <button
              type="button"
              onClick={() => setCsTab('chart')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                csTab === 'chart'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={14} />
              Voltage Profile Gradient
            </button>
          </div>
        )}

        {activeTool === 'wire' && (
          <div className={`flex items-center gap-1 p-1 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => setWireTab('sizer')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                wireTab === 'sizer'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Box size={14} />
              3D Visual Workspace
            </button>
            <button
              type="button"
              onClick={() => setWireTab('matrix')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                wireTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity size={14} />
              AWG Matrix Table
            </button>
          </div>
        )}

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Dual-Standard Toggle Pill & Modal Trigger */}
          <div className={`flex items-center rounded-lg border p-0.5 ${
            isDark ? 'bg-slate-800 border-slate-700/80' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => handleStandardChange(standard === 'NEC' ? 'IEC' : 'NEC')}
              className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                standard === 'NEC'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-900'
              }`}
              title="Click to toggle between NEC (US) and IEC (International) standard"
            >
              <span>{standard === 'NEC' ? '🇺🇸 NEC' : '🇬🇧 IEC'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsStandardModalOpen(true)}
              className={`p-1 rounded-md transition-colors text-slate-400 hover:text-blue-500 hover:bg-blue-50/10`}
              title="Open Standard Comparison Matrix"
            >
              <Globe2 size={13} />
            </button>
          </div>

          {/* History Log Button */}
          <button
            type="button"
            onClick={() => setIsHistoryOpen(true)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'text-amber-400 bg-slate-800 hover:bg-slate-700 border-slate-700/80 shadow-2xs'
                : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 shadow-2xs'
            }`}
            title="View Calculation History Log"
          >
            <History size={13} className="text-amber-500" />
            <span className="hidden sm:inline font-medium">History</span>
            <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-amber-500/20 text-amber-400">
              {history.length}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDark
                ? 'text-amber-300 bg-slate-800 hover:bg-slate-700 border-slate-700/80 shadow-2xs'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200 shadow-2xs'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Moon size={13} className="text-amber-400" /> : <Sun size={13} className="text-amber-500" />}
            <span className="hidden sm:inline font-medium">{isDark ? 'Dark' : 'Light'}</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
              isDark
                ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700/80'
                : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
            title="Reset active tool parameters"
          >
            <RotateCcw size={13} />
            Reset
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
            title="Share tool configuration link"
          >
            <Share2 size={13} />
            {copiedShare ? 'Copied!' : 'Share'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTool(null)}
            className={`p-1.5 rounded-lg border transition-colors ml-1 ${
              isDark
                ? 'text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700/80'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200'
            }`}
            title="Close Fullscreen / Back to Hub"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Fullscreen Tool Canvas/Workspace Content */}
      <div className="flex-1 overflow-y-auto relative p-3 sm:p-4">
        {/* Preset Notification Toast Banner */}
        {presetToast && (
          <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white px-3.5 py-2 rounded-xl shadow-2xl border border-emerald-400/30 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <CheckCircle2 size={16} />
            <span>{presetToast}</span>
          </div>
        )}

        {/* ========================================================= */}
            {/* TOOL 0: CABLE SIZE CALCULATOR (IEC 60364 & BS 7671 3D) */}
            {/* ========================================================= */}
            {activeTool === 'cablesize' && (() => {
              const calc = calculateCableResults();
              const isPass = calc.recDropPct <= csMaxDropPct && calc.recBaseAmp >= calc.requiredCapacity;
              const phaseMult = csSystem === 'single' ? 2 : 1.732;
              const rPerM = (csMaterial === 'copper' ? calc.recommended.rCu : calc.recommended.rAl) / 1000;
              const powerLossWatts = Math.pow(calc.designCurrent, 2) * (rPerM * csLengthMeters * phaseMult);

              return (
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
                  {/* Column 1: Circuit User Inputs */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between ${
                        isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5 font-mono text-amber-500 font-bold">
                          <Sliders size={14} />
                          Cable Sizing Parameters
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">1/3</span>
                      </div>

                      <div className="space-y-3">
                        {/* 1-Click Real-World Preset Scenarios */}
                        <div className={`p-2 rounded-xl border mb-1 ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadCablePreset('kitchen')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Kitchen Ring Circuit (32A 230V)"
                            >
                              🍳 Kitchen Ring (32A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('ev')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="EV Fast Charger 7.4kW Domestic"
                            >
                              🚗 EV Home (7.4kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('shower')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Instant Electric Shower 9.5kW 41.3A"
                            >
                              🚿 Shower (9.5kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('outbuilding')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Garden Studio SWA Run 45m"
                            >
                              🏡 Studio SWA (45m)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('ev_commercial')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial Dual 3-Phase 22kW EV Charger"
                            >
                              ⚡ Dual EV (22kW 3Φ)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('motor')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Industrial 3-Phase Motor 35kW"
                            >
                              🏭 3Φ Motor (35kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('solar')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Solar Commercial Array 25kW"
                            >
                              ☀️ Solar (25kW 3Φ)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('cold_storage')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Cold Storage Chiller 45kW"
                            >
                              ❄️ Chiller (45kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('agri_feeder')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Agricultural Barn Feeder 85m Aluminum"
                            >
                              🚜 Barn Run (Al 85m)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadCablePreset('hvac')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial HVAC Central Plant 70kW"
                            >
                              🏢 HVAC (70kW)
                            </button>
                          </div>
                        </div>
                        {/* Mode Selector Pill */}
                        <div className={`p-1 rounded-xl flex items-center border ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                        }`}>
                          <button
                            type="button"
                            onClick={() => setMode('simple')}
                            className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                              mode === 'simple'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Simple
                          </button>
                          <button
                            type="button"
                            onClick={() => setMode('advanced')}
                            className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                              mode === 'advanced'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Advanced Derating
                          </button>
                        </div>

                        {/* System Select */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            <span>Phase System</span>
                            <span className="font-mono text-blue-500 font-bold">{csSystem === 'single' ? 'Single (230V)' : 'Three (400V)'}</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => { setCsSystem('single'); setCsVoltage(230); }}
                              className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                                csSystem === 'single'
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                                  : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              Single Phase
                            </button>
                            <button
                              type="button"
                              onClick={() => { setCsSystem('three'); setCsVoltage(400); }}
                              className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                                csSystem === 'three'
                                  ? 'bg-blue-600 text-white border-blue-500 shadow-2xs'
                                  : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              Three Phase
                            </button>
                          </div>
                        </div>

                        {/* Supply Voltage */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Supply Voltage (V)</label>
                          <select
                            value={csVoltage}
                            onChange={(e) => setCsVoltage(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          >
                            <option value={120}>120 V (US Single Phase)</option>
                            <option value={230}>230 V (EU/UK Single Phase)</option>
                            <option value={240}>240 V (US Split Phase)</option>
                            <option value={400}>400 V (EU/UK Three Phase)</option>
                          </select>
                        </div>

                        {/* Load Power Watts */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Active Load Power (W)</span>
                            <span className="font-mono text-amber-500 font-bold">{(csPowerWatts / 1000).toFixed(1)} kW</span>
                          </label>
                          <input
                            type="number"
                            step="100"
                            value={csPowerWatts}
                            onChange={(e) => setCsPowerWatts(Math.max(100, Number(e.target.value)))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono shadow-inner ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          />
                        </div>

                        {/* Power Factor & Cable Length */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Power Factor</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.5"
                              max="1.0"
                              value={csPowerFactor}
                              onChange={(e) => setCsPowerFactor(Number(e.target.value))}
                              className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono ${
                                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                              }`}
                            />
                          </div>
                          <div>
                            <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Length (m)</label>
                            <input
                              type="number"
                              min="1"
                              max="500"
                              value={csLengthMeters}
                              onChange={(e) => setCsLengthMeters(Math.max(1, Number(e.target.value)))}
                              className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono ${
                                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Installation Method & Material */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Installation Method</label>
                          <select
                            value={csInstallMethod}
                            onChange={(e) => setCsInstallMethod(e.target.value)}
                            className={`w-full px-3 py-1.5 border rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500 ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          >
                            <option value="Clipped direct">Method C: Clipped direct in air</option>
                            <option value="In conduit / trunking">Method B: Conduit in wall</option>
                            <option value="On cable tray">Method E: Perforated tray</option>
                            <option value="Direct burial underground">Method D: Direct burial in soil</option>
                          </select>
                        </div>

                        {/* Material Cu/Al */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Conductor Material</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCsMaterial('copper')}
                              className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                                csMaterial === 'copper'
                                  ? 'bg-amber-600/30 text-amber-500 border-amber-500 font-bold'
                                  : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              Copper (Cu)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCsMaterial('aluminium')}
                              className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                                csMaterial === 'aluminium'
                                  ? 'bg-slate-700 text-white border-slate-500 font-bold'
                                  : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              Aluminium (Al)
                            </button>
                          </div>
                        </div>

                        {/* Cable Construction Type & Max Drop */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cable Type</label>
                            <select
                              value={csCableType}
                              onChange={(e) => setCsCableType(e.target.value)}
                              className={`w-full px-2 py-1.5 border rounded-xl text-[11px] font-semibold focus:outline-none focus:border-blue-500 ${
                                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                              }`}
                            >
                              <option value="Twin & Earth (2C + CPC)">Twin & Earth</option>
                              <option value="Multicore Armored (SWA)">Armored (SWA)</option>
                              <option value="Single Core Conduit (6491X)">Single Core</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Drop Limit (%)</label>
                            <input
                              type="number"
                              step="0.5"
                              value={csMaxDropPct}
                              onChange={(e) => setCsMaxDropPct(Number(e.target.value))}
                              className={`w-full px-2 py-1.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono ${
                                isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Advanced Derating parameters */}
                        {mode === 'advanced' && (
                          <div className={`pt-2 border-t space-y-2 text-xs ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-center text-amber-500 font-mono font-bold">
                              <span>DERATING (Ca × Cg)</span>
                              <span>{(calc.deratingTotal).toFixed(2)}x</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Ambient Temp (°C)</label>
                                <select
                                  value={csAmbientTemp}
                                  onChange={(e) => setCsAmbientTemp(Number(e.target.value))}
                                  className={`w-full px-2 py-1 border rounded-lg text-xs font-bold font-mono ${
                                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <option value={25}>25°C</option>
                                  <option value={30}>30°C Baseline</option>
                                  <option value={35}>35°C</option>
                                  <option value={40}>40°C</option>
                                  <option value={45}>45°C</option>
                                </select>
                              </div>
                              <div>
                                <label className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Grouping Cables</label>
                                <select
                                  value={csGrouping}
                                  onChange={(e) => setCsGrouping(Number(e.target.value))}
                                  className={`w-full px-2 py-1 border rounded-lg text-xs font-bold font-mono ${
                                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                                  }`}
                                >
                                  <option value={1}>1 Single</option>
                                  <option value={2}>2 Grouped</option>
                                  <option value={3}>3 Grouped</option>
                                  <option value={4}>4 Grouped</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`pt-3 border-t text-[11px] flex justify-between items-center font-mono mt-2 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>Standards:</span>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {standard === 'NEC' ? 'NEC (NFPA 70) Art. 310' : 'BS 7671 / IEC 60364'}
                      </span>
                    </div>
                  </div>

                  {/* Column 2: Interactive 3D Cable Render / Center Workspace */}
                  <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-[350px] overflow-hidden relative">
                    {csTab === '3d' ? (
                      <Cable3DVisualizer
                        system={csSystem}
                        mm2={parseFloat(calc.recommended.mm2) || 2.5}
                        diameterMm={calc.recommended.diameterMm}
                        material={csMaterial}
                        cableType={csCableType}
                        installMethod={csInstallMethod}
                        designCurrent={calc.designCurrent}
                        requiredCapacity={calc.requiredCapacity}
                        powerLossWatts={powerLossWatts}
                        voltageDropPct={calc.recDropPct}
                        isPass={isPass}
                        standard={standard}
                      />
                    ) : (
                      /* Voltage Drop Profile Gradient Chart */
                      <div className={`w-full h-full border rounded-2xl p-4 flex flex-col justify-between shadow-2xl ${
                        isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                      }`}>
                        <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                          <span className="text-xs font-mono font-bold text-purple-500 uppercase tracking-wider">
                            Voltage Drop Profile Gradient ({csLengthMeters}m Run)
                          </span>
                          <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Limit: {calc.minAllowedVoltage.toFixed(1)}V ({csMaxDropPct}%)
                          </span>
                        </div>

                        <div className={`relative w-full flex-1 my-3 rounded-xl border p-3 flex items-center justify-center ${
                          isDark ? 'bg-slate-900/50 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <svg className="w-full h-full max-h-[250px] overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                            <line x1="40" y1="10" x2="390" y2="10" stroke={isDark ? "#334155" : "#cbd5e1"} strokeWidth="1" />
                            <text x="32" y="14" textAnchor="end" className={`text-[9px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}>{csVoltage}V</text>

                            <line x1="40" y1="90" x2="390" y2="90" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 3" />
                            <text x="385" y="86" textAnchor="end" className="text-[8px] fill-rose-500 font-mono font-bold">Limit ({csMaxDropPct}% = {calc.minAllowedVoltage.toFixed(1)}V)</text>

                            {/* Gradient path for recommended cable */}
                            <path d="M 40,10 L 127,22 L 215,35 L 302,48 L 390,62 L 390,110 L 40,110 Z" fill="url(#cableGreenGrad)" opacity="0.2" />
                            <path d="M 40,10 L 127,22 L 215,35 L 302,48 L 390,62" fill="none" stroke="#10B981" strokeWidth="3" />

                            <defs>
                              <linearGradient id="cableGreenGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>

                        <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between font-mono ${
                          isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <span>Endpoint Voltage ({csLengthMeters}m): <strong className="text-emerald-500">{calc.endVoltage.toFixed(1)} V</strong></span>
                          <span>Total Loss: <strong className="text-amber-500">{calc.recVDrop.toFixed(2)} V ({calc.recDropPct.toFixed(2)}%)</strong></span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column 3: Recommended Cable Specs & Code Compliance */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider font-semibold">Recommended Conductor</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isPass ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' : 'bg-red-500/20 text-red-600 border border-red-500/40'
                        }`}>
                          {standard === 'NEC' ? (isPass ? 'NEC NFPA 70 PASS' : 'EXCEEDS DROP') : (isPass ? 'BS 7671 PASS' : 'EXCEEDS DROP')}
                        </span>
                      </div>

                      <div className="my-3">
                        <div className={`text-3xl sm:text-4xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {standard === 'NEC' ? calc.recommended.awg : calc.recommended.mm2}{' '}
                          <span className={`text-base font-sans font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {standard === 'NEC' ? (calc.recommended.awg.includes('kcmil') ? '' : 'AWG') : 'mm²'}
                          </span>
                        </div>
                        <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {standard === 'NEC' ? `Equiv: ${calc.recommended.mm2} mm²` : `Equiv: ${calc.recommended.awg}`} • {csCableType} ({csMaterial === 'copper' ? 'Copper Cu' : 'Aluminium Al'}), Ø ~{calc.recommended.diameterMm} mm.
                        </p>
                      </div>

                      <div className={`grid grid-cols-2 gap-2.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Design Current (Ib)</div>
                          <div className="text-base font-mono font-bold text-amber-500 mt-0.5">
                            {calc.designCurrent.toFixed(2)} A
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Req. Capacity (Iz)</div>
                          <div className="text-base font-mono font-bold text-sky-500 mt-0.5">
                            {calc.requiredCapacity.toFixed(1)} A
                          </div>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Voltage Drop</div>
                          <div className="text-base font-mono font-bold text-emerald-500 mt-0.5">
                            {calc.recVDrop.toFixed(2)} V
                          </div>
                          <div className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({calc.recDropPct.toFixed(2)}%)</div>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {standard === 'NEC' ? 'OCPD Breaker' : 'Protection MCB'}
                          </div>
                          <div className="text-base font-mono font-bold text-purple-500 mt-0.5">
                            {calc.mcb} A
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`text-[11px] border-t pt-3 flex justify-between items-center font-mono mt-3 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>Heat Loss: <strong className="text-amber-500">{powerLossWatts.toFixed(1)} W</strong></span>
                      <span>Max Base: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{calc.recBaseAmp} A</strong></span>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3">
                      <ResultExportActions
                        toolId="cablesize"
                        toolName="🔌 Cable Size Calculator"
                        summary={`Selected ${standard === 'NEC' ? calc.recommended.awg : `${calc.recommended.mm2} mm²`} ${csMaterial} cable for ${calc.designCurrent.toFixed(1)}A load at ${csVoltage}V (${csLengthMeters}m run)`}
                        inputs={{
                          standard,
                          csSystem,
                          csVoltage,
                          csPowerWatts,
                          csPowerFactor,
                          csLengthMeters,
                          csInstallMethod,
                          csMaterial,
                          csCableType,
                          csAmbientTemp,
                          csGrouping
                        }}
                        outputs={{
                          recommendedConductor: standard === 'NEC' ? `${calc.recommended.awg} (${calc.recommended.mm2} mm²)` : `${calc.recommended.mm2} mm² (${calc.recommended.awg})`,
                          designCurrentIb: `${calc.designCurrent.toFixed(2)} A`,
                          requiredCapacityIz: `${calc.requiredCapacity.toFixed(1)} A`,
                          voltageDrop: `${calc.recVDrop.toFixed(2)} V (${calc.recDropPct.toFixed(2)}%)`,
                          endVoltage: `${calc.endVoltage.toFixed(1)} V`,
                          protectionBreaker: `${calc.mcb} A`,
                          powerLossWatts: `${powerLossWatts.toFixed(1)} W`
                        }}
                        standardsRef={standard === 'NEC' ? 'NEC (NFPA 70) 2023 / UL 486' : 'BS 7671:2018+A3:2024 / IEC 60364'}
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* TOOL 1: WIRE GAUGE & VOLTAGE DROP SIZER (REAL TIME) */}
            {/* ========================================================= */}
            {(activeTool === 'wire' || activeTool === 'voltagedrop') && (() => {
              const wireRes = calculateWireResults();
              return wireTab === 'sizer' ? (
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
                  {/* Column 1: Circuit User Inputs */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between ${
                        isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5 font-mono text-amber-500 font-bold">
                          <Sliders size={14} />
                          Circuit Inputs
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">1/3</span>
                      </div>

                      <div className="space-y-3">
                        {/* 1-Click Real-World Preset Scenarios */}
                        <div className={`p-2 rounded-xl border mb-1 ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadWirePreset('lighting')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial Lighting Run 10A 22m"
                            >
                              💡 Lighting (10A 22m)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('workshop')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Workshop Sub-Panel Feeder 40A 35m"
                            >
                              🔌 Workshop (40A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('outbuilding')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Garden Studio Feeder 32A 55m"
                            >
                              🏡 Studio Run (55m)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('borehole')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Deep Borehole Pump 22A 120m"
                            >
                              💧 Well Pump (120m)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('rv_hookup')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Marina / RV Park 50A Pedestal 45m"
                            >
                              🚐 RV/Marina (50A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('solar_dc')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Solar DC String 18A 60m"
                            >
                              ☀️ Solar DC (60m)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('site')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Construction Site Board 100A Al 75m"
                            >
                              🏗️ Site Board (100A Al)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('crane')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Tower Crane Feeder 140A 90m"
                            >
                              🏗️ Crane (140A 90m)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadWirePreset('industrial')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate col-span-2 ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Industrial Switchgear Main Bus 200A 120m"
                            >
                              ⚡ Industrial Switchgear Bus (200A 120m)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Current Load (A)</span>
                            <span className="font-mono text-blue-500 font-bold">{wireCurrent} A</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="300"
                            value={wireCurrent}
                            onChange={(e) => setWireCurrent(Math.max(1, Number(e.target.value)))}
                            className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono shadow-inner ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Circuit Voltage (V)</span>
                            <span className="font-mono text-blue-500 font-bold">{wireVoltage} V</span>
                          </label>
                          <input
                            type="number"
                            min="12"
                            max="1000"
                            value={wireVoltage}
                            onChange={(e) => setWireVoltage(Math.max(12, Number(e.target.value)))}
                            className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono shadow-inner ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Distance One-Way (m)</span>
                            <span className="font-mono text-blue-500 font-bold">{wireDistance} m</span>
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="1000"
                            value={wireDistance}
                            onChange={(e) => setWireDistance(Math.max(1, Number(e.target.value)))}
                            className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono shadow-inner ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Allowed Drop (%)</span>
                            <span className="font-mono text-blue-500 font-bold">{wireAllowedDrop}%</span>
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min="1"
                            max="10"
                            value={wireAllowedDrop}
                            onChange={(e) => setWireAllowedDrop(Math.max(0.5, Number(e.target.value)))}
                            className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 font-mono shadow-inner ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white'
                            }`}
                          />
                        </div>

                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Conductor Material</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setWireMaterial('copper')}
                              className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all ${
                                wireMaterial === 'copper'
                                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                                  : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              Copper (Cu)
                            </button>
                            <button
                              type="button"
                              onClick={() => setWireMaterial('aluminium')}
                              className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all ${
                                wireMaterial === 'aluminium'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                  : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                              }`}
                            >
                              Aluminium (Al)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`pt-3 border-t text-[11px] flex justify-between items-center font-mono mt-3 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>Loop Conductors:</span>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{wireDistance * 2} m round-trip</span>
                    </div>
                  </div>

                  {/* Column 2: Interactive 3D Cable Render */}
                  <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-[300px] overflow-hidden relative">
                    <Wire3DVisualizer
                      awg={wireRes.selected.awg}
                      mm2={wireRes.selected.mm2}
                      current={wireCurrent}
                      voltage={wireVoltage}
                      distance={wireDistance}
                      material={wireMaterial}
                      vDrop={wireRes.vDrop}
                      vDropPct={wireRes.vDropPct}
                      powerLossWatts={wireRes.powerLossWatts}
                      isPass={wireRes.isPass}
                    />
                  </div>

                  {/* Column 3: Recommended Conductor Specs */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs font-mono text-amber-500 uppercase tracking-wider font-semibold">Recommended Conductor</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          wireRes.isPass ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-600 border border-amber-500/40'
                        }`}>
                          {wireRes.isPass ? (standard === 'NEC' ? 'NEC PASS - Safe Drop' : 'BS 7671 PASS - Safe Drop') : 'EXCEEDS DROP'}
                        </span>
                      </div>

                      <div className="my-4">
                        <div className={`text-3xl sm:text-4xl font-serif font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {standard === 'NEC' ? wireRes.selected.awg : `${wireRes.selected.mm2} mm²`}{' '}
                          <span className={`text-base font-sans font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {standard === 'NEC' ? (wireRes.selected.awg.includes('kcmil') ? '' : 'AWG') : ''}
                          </span>
                        </div>
                        <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {standard === 'NEC' ? `Equiv: ${wireRes.selected.mm2} mm²` : `Equiv: ${wireRes.selected.awg}`} • Sized to maintain voltage drop below <strong className="text-amber-500">{wireAllowedDrop}%</strong> across <strong className={isDark ? 'text-white' : 'text-slate-900'}>{wireDistance}m</strong> run ({wireDistance * 2}m loop length).
                        </p>
                      </div>

                      <div className={`grid grid-cols-2 gap-2.5 pt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Voltage Drop</div>
                          <div className="text-base font-mono font-bold text-emerald-500 mt-0.5">
                            {wireRes.vDrop.toFixed(2)} V
                          </div>
                          <div className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({wireRes.vDropPct.toFixed(2)}%)</div>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Load Endpoint</div>
                          <div className={`text-base font-mono font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {wireRes.endVoltage.toFixed(1)} V
                          </div>
                          <div className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Supply potential</div>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Heat Power Loss</div>
                          <div className="text-base font-mono font-bold text-amber-500 mt-0.5">
                            {wireRes.powerLossWatts.toFixed(1)} W
                          </div>
                          <div className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>({wireRes.powerLossPct.toFixed(2)}% loss)</div>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Max Ampacity</div>
                          <div className="text-base font-mono font-bold text-sky-500 mt-0.5">
                            {wireRes.maxAmp} A
                          </div>
                          <div className={`text-[9px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Thermal Limit</div>
                        </div>
                      </div>
                    </div>

                    <div className={`text-[11px] border-t pt-3 flex justify-between items-center font-mono mt-3 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>{standard === 'NEC' ? 'NEC Table 310.16' : 'BS 7671 / IEC 60364 Table 4D1'}</span>
                      <span>Resistance: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{wireRes.rTotal.toFixed(3)} Ω</strong></span>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3">
                      <ResultExportActions
                        toolId="voltagedrop"
                        toolName="📉 Voltage Drop Calculator"
                        summary={`Recommended ${standard === 'NEC' ? wireRes.selected.awg : `${wireRes.selected.mm2} mm²`} (${standard === 'NEC' ? `${wireRes.selected.mm2} mm²` : wireRes.selected.awg}) for ${wireCurrent}A load at ${wireVoltage}V over ${wireDistance}m (${wireRes.vDropPct.toFixed(2)}% drop)`}
                        inputs={{
                          standard,
                          wireVoltage,
                          wireCurrent,
                          wireDistance,
                          wireMaterial,
                          wireAllowedDrop
                        }}
                        outputs={{
                          recommendedGauge: standard === 'NEC' ? `${wireRes.selected.awg} (${wireRes.selected.mm2} mm²)` : `${wireRes.selected.mm2} mm² (${wireRes.selected.awg})`,
                          voltageDrop: `${wireRes.vDrop.toFixed(2)} V (${wireRes.vDropPct.toFixed(2)}%)`,
                          loadEndpointVoltage: `${wireRes.endVoltage.toFixed(1)} V`,
                          heatPowerLoss: `${wireRes.powerLossWatts.toFixed(1)} W (${wireRes.powerLossPct.toFixed(2)}%)`,
                          maxAmpacity: `${wireRes.maxAmp} A`,
                          circuitResistance: `${wireRes.rTotal.toFixed(3)} Ω`
                        }}
                        standardsRef={standard === 'NEC' ? 'NEC NFPA 70 2023 (Tables 310.16 & Ch. 9)' : 'BS 7671 / IEC 60364 (Tables 4D1 & 4D2)'}
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* AWG Comparison Matrix Table in full screen mode */
                <div className="h-full w-full p-2 overflow-y-auto">
                  <div className={`border rounded-2xl p-5 shadow-2xl max-w-6xl mx-auto ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <h4 className={`text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider font-mono ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      <Activity size={16} className="text-blue-500" />
                      Real-Time AWG Gauge Comparison Matrix ({wireCurrent}A @ {wireVoltage}V, {wireDistance}m)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className={`border-b font-semibold font-mono ${
                            isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}>
                            <th className="py-3 px-3">Gauge</th>
                            <th className="py-3 px-3">Area (mm²)</th>
                            <th className="py-3 px-3">Ampacity</th>
                            <th className="py-3 px-3">Voltage Drop (V)</th>
                            <th className="py-3 px-3">Drop %</th>
                            <th className="py-3 px-3">Power Loss</th>
                            <th className="py-3 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800/80' : 'divide-slate-100'}`}>
                          {AWG_SPECS.map((spec) => {
                            const isCu = wireMaterial === 'copper';
                            const maxAmp = isCu ? spec.maxAmpCu : spec.maxAmpCu * 0.78;
                            const rPerKm = isCu ? spec.rCuPerKm : spec.rAlPerKm;
                            const vd = (2 * wireCurrent * wireDistance * rPerKm) / 1000;
                            const vdp = (vd / wireVoltage) * 100;
                            const rTot = (2 * wireDistance * rPerKm) / 1000;
                            const pLoss = Math.pow(wireCurrent, 2) * rTot;
                            const pass = vdp <= wireAllowedDrop && maxAmp >= wireCurrent;
                            const isSelected = spec.awg === wireRes.selected.awg;

                            return (
                              <tr key={spec.awg} className={`transition-colors ${
                                isSelected
                                  ? isDark ? 'bg-blue-900/40 font-bold text-white' : 'bg-blue-50 font-bold text-blue-900'
                                  : isDark ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-slate-50 text-slate-700'
                              }`}>
                                <td className="py-2.5 px-3 font-mono">{spec.awg} {isSelected && '👈'}</td>
                                <td className="py-2.5 px-3">{spec.mm2} mm²</td>
                                <td className="py-2.5 px-3">{maxAmp} A</td>
                                <td className="py-2.5 px-3 font-mono">{vd.toFixed(2)} V</td>
                                <td className="py-2.5 px-3 font-mono">{vdp.toFixed(2)}%</td>
                                <td className="py-2.5 px-3 font-mono">{pLoss.toFixed(1)} W</td>
                                <td className="py-2.5 px-3">
                                  {pass ? (
                                    <span className="text-emerald-500 font-semibold inline-flex items-center gap-1">
                                      <CheckCircle2 size={12} /> OK
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 font-semibold inline-flex items-center gap-1">
                                      <AlertTriangle size={12} /> High Drop
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* TOOL 2: OHM'S & POWER LAW SIMULATION (FULL-SCREEN 3-COLUMN LAYOUT) */}
            {/* ========================================================= */}
            {activeTool === 'ohms' && (() => {
              const ohms = calculateOhmsResults();

              // Conduction & Sizing Wire Recommendation based on calculated current I
              const recommendedGauge = (() => {
                if (ohms.I <= 15) return { awg: '14 AWG', mm2: 2.08, breaker: '15 A' };
                if (ohms.I <= 20) return { awg: '12 AWG', mm2: 3.31, breaker: '20 A' };
                if (ohms.I <= 30) return { awg: '10 AWG', mm2: 5.26, breaker: '30 A' };
                if (ohms.I <= 40) return { awg: '8 AWG', mm2: 8.37, breaker: '40 A' };
                if (ohms.I <= 55) return { awg: '6 AWG', mm2: 13.3, breaker: '60 A' };
                if (ohms.I <= 70) return { awg: '4 AWG', mm2: 21.2, breaker: '80 A' };
                if (ohms.I <= 95) return { awg: '2 AWG', mm2: 33.6, breaker: '100 A' };
                return { awg: '1/0 AWG', mm2: 53.5, breaker: '125+ A' };
              })();

              // Joule Heating Thermal Risk Assessment
              const jouleHeatingBtu = ohms.P * 3.41214;
              const thermalStatus = ohms.P > 3000 ? 'HIGH HEAT RISK' : ohms.P > 1000 ? 'MODERATE HEAT' : 'NORMAL TEMP';

              return (
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
                  {/* Column 1: Input Controls & Parameter Pair Selector */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between ${
                        isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5 font-mono text-amber-500 font-bold">
                          <Sliders size={14} />
                          Ohm's Circuit Inputs
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">1/3</span>
                      </div>

                      <div className="space-y-3">
                        {/* Centralized Calculation Error Alert for Invalid Inputs */}
                        {(ohmsSolveMode.includes('R') && ohmsR <= 0) && (
                          <CalculationError
                            title="Zero Resistance (Short Circuit)"
                            error="Resistance cannot be zero. In electrical circuits, zero resistance implies an infinite short-circuit current (I = V / 0), causing calculation division errors."
                            suggestion="Enter a positive resistance value (e.g. 10 Ω, 0.5 Ω, or 100 Ω)."
                            onReset={() => setOhmsR(10)}
                            isDark={isDark}
                          />
                        )}

                        {(ohmsV < 0 || ohmsI < 0 || ohmsR < 0 || ohmsP < 0) && (
                          <CalculationError
                            title="Negative Electrical Value Detected"
                            error="Voltage, current, resistance, and power must be non-negative real numbers for DC/AC magnitude calculations."
                            suggestion="Reset negative values to absolute magnitude values."
                            onReset={() => {
                              if (ohmsV < 0) setOhmsV(Math.abs(ohmsV));
                              if (ohmsI < 0) setOhmsI(Math.abs(ohmsI));
                              if (ohmsR < 0) setOhmsR(Math.abs(ohmsR));
                              if (ohmsP < 0) setOhmsP(Math.abs(ohmsP));
                            }}
                            isDark={isDark}
                          />
                        )}

                        {/* Known Parameter Pair Selector */}
                        <div>
                          <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Lock Known Input Pair:
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'VI', label: 'V & I' },
                              { id: 'VR', label: 'V & R' },
                              { id: 'IR', label: 'I & R' },
                              { id: 'PV', label: 'P & V' },
                              { id: 'PI', label: 'P & I' },
                              { id: 'PR', label: 'P & R' },
                            ].map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => setOhmsSolveMode(m.id as any)}
                                className={`py-1.5 px-2 text-[11px] font-bold rounded-xl border transition-all ${
                                  ohmsSolveMode === m.id
                                    ? 'bg-amber-500 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                                    : isDark ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                }`}
                              >
                                {m.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Voltage Input (V) */}
                        <div className={`p-2.5 rounded-xl border transition-all ${
                          ohmsSolveMode.includes('V')
                            ? isDark ? 'bg-blue-950/60 border-blue-600/80 ring-1 ring-blue-500/40' : 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400/40'
                            : isDark ? 'bg-slate-950/60 border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                            <span>Voltage (V)</span>
                            {renderHelpButton('voltage')}
                          </label>
                          <input
                            type="number"
                            disabled={!ohmsSolveMode.includes('V')}
                            value={ohmsV}
                            onChange={(e) => setOhmsV(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 font-mono shadow-inner ${
                              isDark
                                ? 'bg-slate-950 border-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-500'
                                : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400'
                            }`}
                          />
                        </div>

                        {/* Current Input (I) */}
                        <div className={`p-2.5 rounded-xl border transition-all ${
                          ohmsSolveMode.includes('I')
                            ? isDark ? 'bg-amber-950/60 border-amber-600/80 ring-1 ring-amber-500/40' : 'bg-amber-50/80 border-amber-400 ring-1 ring-amber-400/40'
                            : isDark ? 'bg-slate-950/60 border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                            <span>Current (A)</span>
                            {renderHelpButton('load_power')}
                          </label>
                          <input
                            type="number"
                            disabled={!ohmsSolveMode.includes('I')}
                            value={ohmsI}
                            onChange={(e) => setOhmsI(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-amber-500 font-mono shadow-inner ${
                              isDark
                                ? 'bg-slate-950 border-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-500'
                                : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400'
                            }`}
                          />
                        </div>

                        {/* Resistance Input (R) */}
                        <div className={`p-2.5 rounded-xl border transition-all ${
                          ohmsSolveMode.includes('R')
                            ? isDark ? 'bg-emerald-950/60 border-emerald-600/80 ring-1 ring-emerald-500/40' : 'bg-emerald-50/80 border-emerald-400 ring-1 ring-emerald-400/40'
                            : isDark ? 'bg-slate-950/60 border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                            <span>Resistance (Ω)</span>
                            {renderHelpButton('wire_gauge')}
                          </label>
                          <input
                            type="number"
                            disabled={!ohmsSolveMode.includes('R')}
                            value={ohmsR}
                            onChange={(e) => setOhmsR(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-emerald-500 font-mono shadow-inner ${
                              isDark
                                ? 'bg-slate-950 border-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-500'
                                : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400'
                            }`}
                          />
                        </div>

                        {/* Power Input (P) */}
                        <div className={`p-2.5 rounded-xl border transition-all ${
                          ohmsSolveMode.includes('P')
                            ? isDark ? 'bg-purple-950/60 border-purple-600/80 ring-1 ring-purple-500/40' : 'bg-purple-50/80 border-purple-400 ring-1 ring-purple-400/40'
                            : isDark ? 'bg-slate-950/60 border-slate-800 opacity-60' : 'bg-slate-50 border-slate-200 opacity-60'
                        }`}>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                            <span>Real Power (W)</span>
                            {renderHelpButton('load_power')}
                          </label>
                          <input
                            type="number"
                            disabled={!ohmsSolveMode.includes('P')}
                            value={ohmsP}
                            onChange={(e) => setOhmsP(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-sm font-bold focus:outline-none focus:border-purple-500 font-mono shadow-inner ${
                              isDark
                                ? 'bg-slate-950 border-slate-800 text-white disabled:bg-slate-900 disabled:text-slate-500'
                                : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100 disabled:text-slate-400'
                            }`}
                          />
                        </div>

                        {/* AC Power Factor */}
                        <div className={`p-2.5 rounded-xl border space-y-1 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className="flex items-center gap-1">
                              AC Power Factor (cos φ)
                              {renderHelpButton('power_factor')}
                            </span>
                            <span className="font-mono text-blue-500 font-bold">{ohmsPF.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.0"
                            step="0.01"
                            value={ohmsPF}
                            onChange={(e) => setOhmsPF(Number(e.target.value))}
                            className="w-full accent-blue-500 cursor-pointer"
                          />
                        </div>

                        {/* Real-World 1-Click Preset Scenario Bar */}
                        <div className={`p-2 rounded-xl border ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('kettle')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Electric Kettle 230V 3000W (13A)"
                            >
                              🫖 Kettle (3kW / 13A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('tankless')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Tankless Instant Water Heater 230V 9000W (39.1A)"
                            >
                              🚿 Water Heater (9kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('motor')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Workshop 3-Phase Motor 400V 15kW"
                            >
                              ⚙️ Motor (15kW 400V)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('led')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial LED Troffer Lighting 200W"
                            >
                              💡 LED Array (200W)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('usbc_pd')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="USB-C PD 3.0 20V 5A (100W)"
                            >
                              🔌 USB-C PD (100W)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('audio')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Pro Audio Subwoofer 8Ω 50V (312W)"
                            >
                              🔊 Subwoofer (8Ω 312W)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('ev_battery')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="48V EV Traction Battery 150A (7.2kW)"
                            >
                              🔋 EV Pack (48V 7.2kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('solar_storage')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="24V Solar Storage Inverter (2kW)"
                            >
                              ☀️ Inverter (24V 2kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('induction')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Industrial Induction Furnace 75kW 400V"
                            >
                              🔥 Furnace (75kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadOhmsPreset('resistor')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Electronics Bench Resistor 12V 1kΩ (12mA)"
                            >
                              🧪 Resistor (12V 1kΩ)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`pt-3 border-t text-[11px] flex justify-between items-center font-mono mt-3 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>Ohm's & Joule's Laws:</span>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>V = I × R | P = V × I</span>
                    </div>
                  </div>

                  {/* Column 2: Interactive 3D Representation */}
                  <div className="lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-[320px] overflow-hidden relative">
                    <Ohms3DVisualizer
                      voltage={ohms.V}
                      current={ohms.I}
                      resistance={ohms.R}
                      power={ohms.P}
                      solveMode={ohmsSolveMode}
                    />
                  </div>

                  {/* Column 3: Calculated Telemetry & Conduction Recommendations */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs font-mono text-amber-500 uppercase tracking-wider font-semibold">Calculated Telemetry</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          ohms.P > 3000 ? 'bg-rose-500/20 text-rose-600 border border-rose-500/40' : 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/40'
                        }`}>
                          {thermalStatus}
                        </span>
                      </div>

                      {/* Main Calculated Values Grid */}
                      <div className="my-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Voltage (V)</div>
                            <div className="text-lg font-mono font-bold text-blue-500 mt-0.5">
                              {ohms.V.toFixed(1)} V
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Potential</div>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Current (I)</div>
                            <div className="text-lg font-mono font-bold text-amber-500 mt-0.5">
                              {ohms.I.toFixed(2)} A
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Flow Rate</div>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Resistance (R)</div>
                            <div className="text-lg font-mono font-bold text-emerald-500 mt-0.5">
                              {ohms.R.toFixed(2)} Ω
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Opposition</div>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Real Power (P)</div>
                            <div className="text-lg font-mono font-bold text-purple-500 mt-0.5">
                              {ohms.P.toFixed(1)} W
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Work Rate</div>
                          </div>
                        </div>

                        {/* Power Breakdown Sub-Cards */}
                        <div className={`p-2.5 rounded-xl border grid grid-cols-2 gap-2 text-xs font-mono ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div>
                            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Apparent (S):</span>
                            <span className="font-bold text-sky-500">{(ohms.S / 1000).toFixed(2)} kVA</span>
                          </div>
                          <div>
                            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Reactive (Q):</span>
                            <span className="font-bold text-pink-500">{(ohms.Q / 1000).toFixed(2)} kVAR</span>
                          </div>
                        </div>
                      </div>

                      {/* Conduction & Sizing Recommendations */}
                      <div className={`pt-3 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className="text-xs font-mono font-semibold text-amber-500 uppercase tracking-wider">
                          Conduction & Safety Sizing
                        </div>

                        <div className={`p-3 rounded-xl border space-y-2 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between text-xs">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Min Wire Gauge:</span>
                            <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{recommendedGauge.awg} <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>({recommendedGauge.mm2} mm²)</span></span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Recommended Breaker:</span>
                            <span className="font-mono font-bold text-sky-500">{recommendedGauge.breaker} Protection</span>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Joule Heat Loss:</span>
                            <span className="font-mono font-bold text-orange-500">{jouleHeatingBtu.toFixed(0)} BTU/hr</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`text-[11px] border-t pt-3 flex justify-between items-center font-mono mt-3 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>NEC / IEC Conductor Standard</span>
                      <span>Phase Angle: <strong className={isDark ? 'text-white' : 'text-slate-900'}>{ohms.angleDeg.toFixed(1)}°</strong></span>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3">
                      <ResultExportActions
                        toolId="ohms"
                        toolName="🔋 Power / Ohm's Law Calculator"
                        summary={`Calculated ${ohms.V.toFixed(1)}V, ${ohms.I.toFixed(2)}A, ${ohms.R.toFixed(2)}Ω, ${ohms.P.toFixed(1)}W at ${ohmsPF.toFixed(2)} PF`}
                        inputs={{
                          ohmsSolveMode,
                          ohmsV,
                          ohmsI,
                          ohmsR,
                          ohmsP,
                          ohmsPF
                        }}
                        outputs={{
                          voltage: `${ohms.V.toFixed(2)} V`,
                          current: `${ohms.I.toFixed(2)} A`,
                          resistance: `${ohms.R.toFixed(2)} Ω`,
                          realPower: `${ohms.P.toFixed(1)} W`,
                          apparentPower: `${(ohms.S / 1000).toFixed(2)} kVA`,
                          reactivePower: `${(ohms.Q / 1000).toFixed(2)} kVAR`,
                          recommendedGauge: recommendedGauge.awg,
                          jouleHeat: `${jouleHeatingBtu.toFixed(0)} BTU/hr`
                        }}
                        standardsRef="Ohm's Law / Watt's Law Matrix"
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* TOOL 3: ELECTRICAL & POWER UNIT CONVERTER (3-COLUMN LAYOUT) */}
            {/* ========================================================= */}
            {activeTool === 'converter' && (() => {
              let watts = convVal;
              if (convUnit === 'kW') watts = convVal * 1000;
              else if (convUnit === 'HP') watts = convVal * 745.7;
              else if (convUnit === 'kVA') watts = convVal * 1000 * convPF;
              else if (convUnit === 'BTU') watts = convVal / 3.41214;

              const kW = watts / 1000;
              const HP = watts / 745.7;
              const kVA = kW / (convPF || 1);
              const BTU = kW * 3412.14;
              const amps = watts / (convVolts * convPF);
              const kVAR = Math.sqrt(Math.max(0, Math.pow(kVA, 2) - Math.pow(kW, 2)));

              // Estimated operational energy cost ($0.15/kWh default)
              const dailyKwh = kW * 24;
              const dailyCost = dailyKwh * 0.15;
              const monthlyCost = dailyCost * 30;

              // Conduction cable guide
              const wireRec = (() => {
                if (amps <= 15) return '14 AWG (2.08 mm²) / 15A';
                if (amps <= 20) return '12 AWG (3.31 mm²) / 20A';
                if (amps <= 30) return '10 AWG (5.26 mm²) / 30A';
                if (amps <= 40) return '8 AWG (8.37 mm²) / 40A';
                if (amps <= 55) return '6 AWG (13.3 mm²) / 60A';
                if (amps <= 70) return '4 AWG (21.2 mm²) / 80A';
                return '2 AWG+ (33.6 mm²) / 100A+';
              })();

              return (
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
                  {/* Column 1: Power Unit Input Controls */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between ${
                        isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5 font-mono text-purple-500 font-bold">
                          <Calculator size={14} />
                          Power Input Controls
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">1/3</span>
                      </div>

                      <div className="space-y-3">
                        {/* 1-Click Real-World Preset Scenarios */}
                        <div className={`p-2 rounded-xl border mb-1 ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => { setConvVal(11); setConvUnit('kW'); setConvVolts(400); setConvPF(0.9); showPresetToast('Grid Substation Transformer (11 kW)'); }}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                            >
                              ⚡ Substation Grid (11 kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setConvVal(32); setConvUnit('HP'); setConvVolts(400); setConvPF(0.85); showPresetToast('32 HP Industrial Motor (24 kW)'); }}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                            >
                              🐎 32 HP Motor (24 kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setConvVal(36000); setConvUnit('BTU'); setConvVolts(230); setConvPF(0.92); showPresetToast('3 Ton HVAC Heat Pump (36k BTU)'); }}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                            >
                              ❄️ 3 Ton HVAC (36k BTU)
                            </button>
                            <button
                              type="button"
                              onClick={() => { setConvVal(10); setConvUnit('kVA'); setConvVolts(230); setConvPF(0.9); showPresetToast('10 kVA Backup Generator'); }}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                            >
                              🔌 10 kVA Generator
                            </button>
                          </div>
                        </div>

                        {/* Numerical Power Value Input */}
                        <div className={`p-3 border rounded-xl space-y-1 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className={`text-xs font-semibold block uppercase font-mono ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                            Input Load Magnitude:
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={convVal}
                            onChange={(e) => setConvVal(Math.max(0, Number(e.target.value)))}
                            className={`w-full text-xl font-mono font-bold border rounded-lg px-3 py-1.5 focus:outline-none focus:border-purple-500 shadow-inner ${
                              isDark ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          />
                        </div>

                        {/* Input Unit Selector Grid */}
                        <div>
                          <label className={`text-[11px] font-bold uppercase tracking-wider mb-1.5 block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Input Unit Format:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { id: 'W', label: 'Watts (W)', icon: '⚡' },
                              { id: 'kW', label: 'Kilowatts (kW)', icon: '🔋' },
                              { id: 'HP', label: 'Horsepower (HP)', icon: '🐎' },
                              { id: 'kVA', label: 'kVA (Apparent)', icon: '🔌' },
                              { id: 'BTU', label: 'BTU / Hour', icon: '🔥' },
                            ].map((unit) => (
                              <button
                                key={unit.id}
                                type="button"
                                onClick={() => setConvUnit(unit.id as any)}
                                className={`p-2 rounded-xl text-left border transition-all text-xs ${
                                  convUnit === unit.id
                                    ? 'bg-purple-600 text-white border-purple-400 font-bold ring-2 ring-purple-500/30'
                                    : isDark
                                      ? 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className="mr-1">{unit.icon}</span>
                                {unit.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Voltage Selection */}
                        <div className={`p-2.5 rounded-xl border space-y-1 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className={`text-xs font-semibold flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Circuit Voltage (V)</span>
                            {renderHelpButton('voltage')}
                          </label>
                          <select
                            value={convVolts}
                            onChange={(e) => setConvVolts(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-lg text-xs font-bold cursor-pointer font-mono ${
                              isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value={120}>120 V AC (US Standard)</option>
                            <option value={208}>208 V AC (3-Phase Network)</option>
                            <option value={230}>230 V AC (EU/IEC Line)</option>
                            <option value={240}>240 V AC (Split-Phase)</option>
                            <option value={400}>400 V AC (Industrial 3-Phase)</option>
                            <option value={480}>480 V AC (Commercial High Volts)</option>
                          </select>
                        </div>

                        {/* Power Factor Slider */}
                        <div className={`p-2.5 rounded-xl border space-y-1 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className={`flex items-center justify-between text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className="flex items-center gap-1">
                              Power Factor (cos φ)
                              {renderHelpButton('power_factor')}
                            </span>
                            <span className="font-mono text-purple-500 font-bold">{convPF.toFixed(2)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="1.0"
                            step="0.01"
                            value={convPF}
                            onChange={(e) => setConvPF(Number(e.target.value))}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                        </div>

                        {/* 1-Click Preset Scenarios */}
                        <div className={`p-2 rounded-xl border mb-1 ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('motor_15hp')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="15 HP Industrial Motor (11.19 kW)"
                            >
                              🐎 15 HP Motor
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('tractor_50hp')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="50 HP Agricultural Pump (37.28 kW)"
                            >
                              🚜 50 HP Agri Pump
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('hvac_3ton')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="3 Ton / 36k BTU Residential AC (10.55 kW)"
                            >
                              ❄️ 3-Ton AC (36k BTU)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('hvac_10ton')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="10 Ton / 120k BTU Commercial Chiller (35.17 kW)"
                            >
                              🏢 10-Ton Chiller
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('ev_7kw')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="7.4 kW Level-2 EV Charger"
                            >
                              🚗 7.4 kW EV Charger
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('ev_150kw')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="150 kW DC Fast Hub (201 HP)"
                            >
                              ⚡ 150 kW DC Fast
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('gen_10kva')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="10 kVA Domestic Standby Generator"
                            >
                              ⚡ 10 kVA Standby
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('gen_100kva')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="100 kVA Commercial Backup Generator"
                            >
                              ⚡ 100 kVA Gen
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('espresso_3kw')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="3000 W Commercial Espresso Machine"
                            >
                              ☕ Espresso (3kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadConverterPreset('solar_5kw')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="5000 W Solar Inverter Peak"
                            >
                              ☀️ Solar (5kW)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`pt-3 border-t text-[11px] flex justify-between items-center font-mono mt-3 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>Equivalency Standard:</span>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>1 HP = 745.7 W | 1 kW = 3412 BTU</span>
                    </div>
                  </div>

                  {/* Column 2: Center Interactive Power Flow Matrix & Visualization */}
                  <div className={`lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-[320px] overflow-hidden border rounded-2xl p-4 shadow-2xl relative justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    {/* Header */}
                    <div className={`flex items-center justify-between border-b pb-3 z-10 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <Activity className="text-purple-500" size={16} />
                          Power Conversion Vector & Thermal Energy Matrix
                        </h4>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Proportional equivalency breakdown across active work, complex power, mechanical torque, and thermal heat.
                        </p>
                      </div>
                    </div>

                    {/* Proportional Power Spectrum Visualizer */}
                    <div className="my-auto py-4 space-y-4">
                      {/* Real Active Power Bar (kW) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                            <Zap size={14} className="text-purple-500" /> Real Active Power (kW)
                          </span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{kW.toFixed(2)} kW</span>
                        </div>
                        <div className={`h-3.5 border rounded-full overflow-hidden p-0.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                          <div 
                            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500 shadow-xs"
                            style={{ width: `${Math.min(100, (kW / Math.max(kW, kVA, 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Apparent Power Bar (kVA) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                            <Box size={14} className="text-sky-500" /> Apparent Supply Power (kVA)
                          </span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{kVA.toFixed(2)} kVA</span>
                        </div>
                        <div className={`h-3.5 border rounded-full overflow-hidden p-0.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                          <div 
                            className="h-full bg-gradient-to-r from-sky-600 to-blue-500 rounded-full transition-all duration-500 shadow-xs"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      {/* Mechanical Power Output (HP) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                            <Cpu size={14} className="text-amber-500" /> Mechanical Motor Output (HP)
                          </span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{HP.toFixed(2)} HP</span>
                        </div>
                        <div className={`h-3.5 border rounded-full overflow-hidden p-0.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                          <div 
                            className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 rounded-full transition-all duration-500 shadow-xs"
                            style={{ width: `${Math.min(100, (HP / (kW * 1.5 || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Thermal Heat Output (BTU/hr) */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>
                            <Flame size={14} className="text-rose-500" /> Thermal Energy Dissipation (BTU/hr)
                          </span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{BTU.toFixed(0)} BTU/hr</span>
                        </div>
                        <div className={`h-3.5 border rounded-full overflow-hidden p-0.5 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                          <div 
                            className="h-full bg-gradient-to-r from-rose-600 to-red-500 rounded-full transition-all duration-500 shadow-xs"
                            style={{ width: `${Math.min(100, (BTU / Math.max(BTU, 50000)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Power Triangle Vector Box */}
                      <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="space-y-0.5">
                          <div className={`text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reactive Component (kVAR)</div>
                          <div className="text-sm font-mono font-bold text-amber-500">{kVAR.toFixed(2)} kVAR</div>
                          <div className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Inductive phase shift delay</div>
                        </div>

                        <div className="text-right space-y-0.5">
                          <div className={`text-[10px] uppercase font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Equivalent AC Current</div>
                          <div className="text-base font-mono font-bold text-emerald-500">{amps.toFixed(2)} Amps</div>
                          <div className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>@ {convVolts}V Line Voltage</div>
                        </div>
                      </div>
                    </div>

                    {/* Operational Energy Cost Estimator Widget */}
                    <div className={`p-3 rounded-xl border grid grid-cols-3 gap-2 text-center ${
                      isDark
                        ? 'bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-purple-900/40'
                        : 'bg-purple-50/60 border-purple-200'
                    }`}>
                      <div>
                        <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>24h Energy</div>
                        <div className={`text-sm font-mono font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{dailyKwh.toFixed(1)} kWh</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Daily Cost Est.</div>
                        <div className="text-sm font-mono font-bold text-emerald-500 mt-0.5">${dailyCost.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Monthly Cost Est.</div>
                        <div className="text-sm font-mono font-bold text-amber-500 mt-0.5">${monthlyCost.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Multi-Unit Output Grid & Conductor Recommendations */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`flex items-center justify-between border-b pb-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs font-mono text-purple-500 uppercase tracking-wider font-semibold">Unit Equivalency Grid</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {convUnit} Selected
                        </span>
                      </div>

                      {/* Main Converted Output Cards */}
                      <div className="my-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Watts (W)</div>
                            <div className="text-base font-mono font-bold text-purple-500 mt-0.5">
                              {watts.toFixed(1)} W
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Active Power</div>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Kilowatts (kW)</div>
                            <div className="text-base font-mono font-bold text-blue-500 mt-0.5">
                              {kW.toFixed(3)} kW
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Real Load</div>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Horsepower (HP)</div>
                            <div className="text-base font-mono font-bold text-amber-500 mt-0.5">
                              {HP.toFixed(2)} HP
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mechanical</div>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Apparent (kVA)</div>
                            <div className="text-base font-mono font-bold text-sky-500 mt-0.5">
                              {kVA.toFixed(2)} kVA
                            </div>
                            <div className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Grid Complex</div>
                          </div>
                        </div>

                        {/* Thermal & AC Current Highlight */}
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex justify-between items-center text-xs">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Thermal Output:</span>
                            <span className="font-mono font-bold text-rose-500">{BTU.toFixed(0)} BTU/hr</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Air Conditioning Eq:</span>
                            <span className="font-mono font-bold text-sky-500">{(BTU / 12000).toFixed(2)} Tons</span>
                          </div>
                        </div>

                        {/* Conductor & Wire Sizing Guideline */}
                        <div className={`p-3 rounded-xl border space-y-1.5 ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="text-[10px] font-mono text-purple-500 font-bold uppercase">
                            Conductor & Protection Guideline
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Line Current:</span>
                            <span className="font-mono font-bold text-emerald-500">{amps.toFixed(2)} A</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>Min Cable Size:</span>
                            <span className={`font-mono font-bold text-[11px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{wireRec}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`pt-3 border-t text-[11px] flex justify-between items-center font-mono mt-3 ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>NEC Wire & Protection</span>
                      <span className="font-bold text-purple-500">PF {convPF.toFixed(2)}</span>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3">
                      <ResultExportActions
                        toolId="converter"
                        toolName="⚡ Electrical Unit Converter"
                        summary={`Converted ${convVal} ${convUnit} to ${watts.toFixed(1)}W / ${kW.toFixed(2)}kW / ${HP.toFixed(2)}HP (${amps.toFixed(2)}A at ${convVolts}V)`}
                        inputs={{
                          convVal,
                          convUnit,
                          convVolts,
                          convPF
                        }}
                        outputs={{
                          watts: `${watts.toFixed(1)} W`,
                          kilowatts: `${kW.toFixed(3)} kW`,
                          horsepower: `${HP.toFixed(2)} HP`,
                          apparentPowerKva: `${kVA.toFixed(2)} kVA`,
                          thermalBtu: `${BTU.toFixed(0)} BTU/hr`,
                          acTons: `${(BTU / 12000).toFixed(2)} Tons`,
                          equivalentCurrent: `${amps.toFixed(2)} A`,
                          minCableSize: wireRec
                        }}
                        standardsRef="NEC / IEEE Power Standards"
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* TOOL 4: BREAKER & LOAD SIZER */}
            {/* ========================================================= */}
            {(activeTool === 'breaker' || activeTool === 'loadcalc') && (() => {
              const totalRawWatts = appliances.reduce((sum, a) => sum + a.watts * a.qty, 0);
              const diversifiedWatts = totalRawWatts * (diversityFactor / 100);
              const fullLoadCurrent = diversifiedWatts / 230;
              const continuousSafetyCurrent = fullLoadCurrent * 1.25;

              let recommendedMcb = 6;
              const mcbSteps = [6, 10, 16, 20, 25, 32, 40, 50, 63];
              for (const step of mcbSteps) {
                if (step >= continuousSafetyCurrent) {
                  recommendedMcb = step;
                  break;
                }
              }

              const handleAddAppliance = () => {
                if (!newAppName.trim() || !newAppWatts || Number(newAppWatts) <= 0) return;
                setAppliances([
                  ...appliances,
                  {
                    id: Date.now().toString(),
                    name: newAppName.trim(),
                    watts: Number(newAppWatts),
                    qty: 1
                  }
                ]);
                setNewAppName('');
                setNewAppWatts('');
              };

              const handleRemoveAppliance = (id: string) => {
                setAppliances(appliances.filter(a => a.id !== id));
              };

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className={`lg:col-span-7 border rounded-2xl p-6 shadow-xs space-y-5 ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    {/* 1-Click Real-World Preset Scenarios */}
                    <div className={`p-3 rounded-xl border ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <label className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono ${
                        isDark ? 'text-slate-200' : 'text-slate-800'
                      }`}>
                        <Zap size={14} className="text-amber-500" />
                        1-Click Real-World Preset Scenarios
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('house')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="All-Electric Smart Home (65% Diversity)"
                        >
                          🏠 Smart Home (65% Div)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('coffee')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="Commercial Coffee Shop (80% Diversity)"
                        >
                          ☕ Coffee Shop (80% Div)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('fastfood')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="Commercial Fast Food Kitchen (75% Diversity)"
                        >
                          🍔 Fast Food Kitchen (75%)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('medical')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="Medical & Dental Clinic (70% Diversity)"
                        >
                          🏥 Medical Clinic (70%)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('retail')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="High-Street Retail Facility (80% Diversity)"
                        >
                          🏬 Retail Store (80% Div)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('gym')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="Fitness Gym & Wellness Center (70% Diversity)"
                        >
                          🏋️ Fitness Gym (70% Div)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('workshop')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="Auto Repair & Welding Garage (60% Diversity)"
                        >
                          🔧 Auto Workshop (60%)
                        </button>
                        <button
                          type="button"
                          onClick={() => loadBreakerPreset('office')}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer text-left truncate border ${
                            isDark
                              ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                          }`}
                          title="Corporate Office Floor (65% Diversity)"
                        >
                          🏢 Corporate Office (65%)
                        </button>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between border-b pb-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                      <h3 className={`font-serif text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        <Cpu className="text-indigo-500" size={20} />
                        Connected Branch Load & Appliances
                      </h3>
                      {renderHelpButton('breaker_load')}
                    </div>

                    <div className="space-y-2">
                      {appliances.map(app => (
                        <div key={app.id} className={`flex justify-between items-center p-3 rounded-xl border ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div>
                            <span className={`text-sm font-bold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{app.name}</span>
                            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Qty: {app.qty} × {app.watts} W</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-mono font-bold text-blue-500">{app.watts * app.qty} W</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAppliance(app.id)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                              title="Remove appliance"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add New Appliance */}
                    <div className={`p-3 rounded-xl border space-y-2 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <span className={`text-xs font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Add Custom Load Appliance:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="Appliance name (e.g. EV Charger)"
                          value={newAppName}
                          onChange={(e) => setNewAppName(e.target.value)}
                          title="Enter custom appliance or equipment name"
                          className={`px-3 py-2 border rounded-lg text-xs font-semibold sm:col-span-1 ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <input
                          type="number"
                          placeholder="Power (Watts)"
                          value={newAppWatts}
                          onChange={(e) => setNewAppWatts(e.target.value)}
                          title="Enter appliance power rating in Watts (W)"
                          className={`px-3 py-2 border rounded-lg text-xs font-semibold sm:col-span-1 font-mono ${
                            isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={handleAddAppliance}
                          title="Add load to circuit breaker sizing list"
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 sm:col-span-1 cursor-pointer"
                        >
                          <Plus size={14} /> Add Load
                        </button>
                      </div>
                    </div>

                    {/* Diversity Factor Slider */}
                    <div className={`p-4 border rounded-xl space-y-1 ${
                      isDark ? 'bg-indigo-950/40 border-indigo-800/60' : 'bg-indigo-50/60 border-indigo-200'
                    }`}>
                      <div className={`flex items-center justify-between text-xs font-bold ${isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>
                        <span 
                          className="cursor-help flex items-center gap-1"
                          title="Diversity Factor (%): Estimated probability or ratio of appliances running simultaneously at full load on the branch."
                        >
                          Diversity Factor (% Simultaneous Usage)
                        </span>
                        <span className="font-mono text-indigo-500 font-bold">{diversityFactor}%</span>
                      </div>
                      <input
                        type="range"
                        min="30"
                        max="100"
                        step="5"
                        value={diversityFactor}
                        onChange={(e) => setDiversityFactor(Number(e.target.value))}
                        title="Adjust anticipated simultaneous load factor percentage"
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-indigo-300/70' : 'text-indigo-800/70'}`}>100% = All loads operating continuously | 60% = Standard household diversity</p>
                    </div>
                  </div>

                  {/* Right Column: Calculated Breaker */}
                  <div className={`lg:col-span-5 border rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6 ${
                    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-900 border-slate-800 text-white'
                  }`}>
                    <div>
                      <div className="text-xs font-mono text-amber-400 uppercase tracking-wider mb-2 font-semibold">
                        Recommended Protection MCB
                      </div>
                      <div className="text-4xl font-serif font-bold text-white mb-4">
                        {recommendedMcb} A MCB <span className="text-sm font-sans font-normal text-slate-400">(Type B/C)</span>
                      </div>

                      <div className="space-y-3 text-xs border-t border-slate-800 pt-4 text-slate-300">
                        <div className="flex justify-between py-1 border-b border-slate-800/80">
                          <span>Total Connected Load:</span>
                          <span className="font-mono font-bold text-white">{totalRawWatts} W</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800/80">
                          <span>Diversified Operating Power:</span>
                          <span className="font-mono font-bold text-amber-400">{diversifiedWatts.toFixed(0)} W</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800/80">
                          <span>Full Load Current (Ib):</span>
                          <span className="font-mono font-bold text-white">{fullLoadCurrent.toFixed(2)} A</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-800/80">
                          <span>125% Safety Limit (In):</span>
                          <span className="font-mono font-bold text-emerald-400">{continuousSafetyCurrent.toFixed(2)} A</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Recommended Cable:</span>
                          <span className="font-mono font-bold text-blue-400">
                            {recommendedMcb <= 16 ? '2.5 mm²' : recommendedMcb <= 25 ? '4.0 mm²' : recommendedMcb <= 32 ? '6.0 mm²' : '10 mm²'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs text-slate-300 space-y-1">
                      <div className="font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck size={14} /> Code Compliant Overcurrent Protection
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Applies 125% continuous duty rule per BS 7671 Reg 433.1 & NEC Article 210.20 to prevent nuisance trip.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60">
                      <ResultExportActions
                        toolId="loadcalc"
                        toolName="⚡ Electrical Load Calculator"
                        summary={`Calculated ${recommendedMcb}A MCB breaker for total load of ${totalRawWatts}W (${fullLoadCurrent.toFixed(1)}A at ${diversityFactor}% diversity)`}
                        inputs={{
                          totalRawWatts,
                          diversifiedWatts: Math.round(diversifiedWatts),
                          diversityFactor,
                          applianceCount: appliances.length
                        }}
                        outputs={{
                          recommendedMcb: `${recommendedMcb} A MCB (Type B/C)`,
                          fullLoadCurrent: `${fullLoadCurrent.toFixed(2)} A`,
                          continuousSafetyLimit: `${continuousSafetyCurrent.toFixed(2)} A`,
                          recommendedCable: recommendedMcb <= 16 ? '2.5 mm²' : recommendedMcb <= 25 ? '4.0 mm²' : recommendedMcb <= 32 ? '6.0 mm²' : '10 mm²'
                        }}
                        standardsRef="BS 7671 Reg 433.1 / NEC Article 210.20"
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* TOOL 5: MCB / RCBO / RCD SELECTION ASSISTANT */}
            {/* ========================================================= */}
            {activeTool === 'mcb_rcbo' && (() => {
              const res = calculateMcbRcboResults();
              return (
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
                  {/* Column 1: Load & Circuit Inputs */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between ${
                        isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5 font-mono text-purple-500 font-bold">
                          <ShieldCheck size={14} />
                          Circuit Protection Inputs
                        </span>
                        {renderHelpButton('mcb_rcbo')}
                      </div>

                      <div className="space-y-3">
                        {/* 1-Click Presets */}
                        <div className={`p-2 rounded-xl border mb-1 ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('sockets')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Domestic Socket Ring Circuit 32A Type B 30mA Type A"
                            >
                              🔌 Sockets (32A Type B)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('lighting')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="LED Lighting Radial 6A Type B 30mA"
                            >
                              💡 Lighting (6A Type B)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('motor')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Workshop Compressor / Induction Motor 28A Type C"
                            >
                              ⚙️ Motor (32A Type C)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('ev')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="EV Charger 32A Type B RCD Type B (6mA DC)"
                            >
                              🚘 EV (32A / Type B RCD)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('heatpump')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Air Source Heat Pump Inverter 20A Type C"
                            >
                              ♨️ Heat Pump (20A Type C)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('solar_inv')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Solar PV Inverter AC Side 25A Type B/Type A RCD"
                            >
                              ☀️ Solar AC (25A Type B)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('transformer')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Industrial Transformer / Spot Welder 45A Type D"
                            >
                              ⚡ Welder (50A Type D)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('datacenter')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Server Room High-Frequency SMPS 63A Type F/B"
                            >
                              🖥️ Server Room (63A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('medical_rcd')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Medical / Hydrotherapy 16A High-Sensitivity 10mA RCD"
                            >
                              🏥 Medical (10mA RCD)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadMcbRcboPreset('submain_swg')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Distribution Submain Feeder 80A 100mA Time-Delayed RCD"
                            >
                              🏢 Submain (100mA 'S')
                            </button>
                          </div>
                        </div>

                        {/* Load Current Input */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Continuous Load Current (Ib)</span>
                            <span className="font-mono text-purple-500 font-bold">{mcbLoadCurrent} A</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={mcbLoadCurrent}
                            onChange={(e) => setMcbLoadCurrent(Number(e.target.value))}
                            className="w-full accent-purple-500 cursor-pointer"
                          />
                        </div>

                        {/* Application Type */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Load Application Category</label>
                          <select
                            value={mcbApplication}
                            onChange={(e) => setMcbApplication(e.target.value as any)}
                            className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold focus:outline-none focus:border-purple-500 ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value="sockets">Sockets & General Power (Type B)</option>
                            <option value="lighting">Lighting Circuits (Type B/C)</option>
                            <option value="motor">Electric Motors & Pumps (Type C)</option>
                            <option value="hvac">HVAC & Air Conditioners (Type C)</option>
                            <option value="ev">EV Charger Stations (Type B/A/RCD)</option>
                            <option value="welder">Transformers & Welders (Type D)</option>
                          </select>
                        </div>

                        {/* RCD Toggle */}
                        <div className={`p-3 rounded-xl border flex items-center justify-between ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div>
                            <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>RCD / Residual Protection</span>
                            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Earth leakage shock protection (30mA)</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={mcbRequireRcd}
                            onChange={(e) => setMcbRequireRcd(e.target.checked)}
                            className="w-4 h-4 accent-purple-500 cursor-pointer"
                          />
                        </div>

                        {/* Short Circuit Breaking Capacity */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Short Circuit Rating (Icn)</label>
                          <select
                            value={mcbShortCircuitKa}
                            onChange={(e) => setMcbShortCircuitKa(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold font-mono ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value={6}>6 kA (Domestic Consumer Unit)</option>
                            <option value={10}>10 kA (Commercial Board)</option>
                            <option value={16}>16 kA (Industrial Main Distribution)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className={`text-[11px] font-mono border-t pt-2 mt-3 flex items-center justify-between ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>Standard: IEC 60898-1</span>
                      <span className="text-purple-500 font-bold">125% Rule Active</span>
                    </div>
                  </div>

                  {/* Column 2: Trip Curve Diagram & Characteristic Visualizer */}
                  <div className={`lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-[320px] overflow-hidden border rounded-2xl p-4 shadow-2xl relative justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <Activity className="text-purple-500" size={16} />
                          MCB Trip Curve & Operating Characteristic (IEC 60898)
                        </h4>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Thermal bi-metal overload region (0.1s - 100s) and Instantaneous magnetic trip threshold.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {res.recommendedCurve} Curve
                      </span>
                    </div>

                    {/* Trip Curve SVG Illustration */}
                    <div className={`my-3 p-4 border rounded-xl flex-1 flex flex-col justify-center items-center relative ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <svg className="w-full h-full max-h-[220px]" viewBox="0 0 400 160">
                        {/* Axes */}
                        <line x1="40" y1="20" x2="40" y2="130" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="1.5" />
                        <line x1="40" y1="130" x2="380" y2="130" stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="1.5" />
                        
                        <text x="35" y="15" textAnchor="end" className={`text-[9px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}>Time (s)</text>
                        <text x="380" y="145" textAnchor="end" className={`text-[9px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}>Current Multiple (× In)</text>

                        {/* Thermal Region */}
                        <path
                          d="M 60,30 Q 90,80 140,100 L 370,100"
                          fill="none"
                          stroke={isDark ? "#38bdf8" : "#0284c7"}
                          strokeWidth="2"
                          strokeDasharray="3 3"
                        />
                        <text x="90" y="50" className="text-[9px] font-mono fill-sky-400">Thermal Overload</text>

                        {/* Active Curve Envelope */}
                        {res.recommendedCurve === 'Type B' && (
                          <path d="M 60,30 Q 85,85 110,100 L 110,130 L 370,130" fill="none" stroke="#a855f7" strokeWidth="3" />
                        )}
                        {res.recommendedCurve === 'Type C' && (
                          <path d="M 60,30 Q 110,85 180,100 L 180,130 L 370,130" fill="none" stroke="#a855f7" strokeWidth="3" />
                        )}
                        {res.recommendedCurve === 'Type D' && (
                          <path d="M 60,30 Q 150,85 270,100 L 270,130 L 370,130" fill="none" stroke="#a855f7" strokeWidth="3" />
                        )}

                        <text x="210" y="40" className="text-[10px] font-mono font-bold fill-purple-400">
                          {res.recommendedCurve} Magnetic Trip Threshold
                        </text>
                        <text x="210" y="55" className={`text-[9px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}>
                          Range: {res.inrushTripRange}
                        </text>
                      </svg>
                    </div>

                    <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <strong className="text-purple-400">{res.recommendedCurve} Curve Application Note:</strong> {res.curveDesc}
                    </div>
                  </div>

                  {/* Column 3: Recommended Devices Grid */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs font-mono text-purple-500 uppercase tracking-wider font-semibold">Protection Specification</span>
                        <span className="text-[10px] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Verified
                        </span>
                      </div>

                      <div className="my-3 space-y-2">
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Design Load (Ib × 1.25)</div>
                          <div className="text-lg font-mono font-bold text-amber-500 mt-0.5">{res.designCurrent125.toFixed(1)} A</div>
                        </div>

                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recommended MCB Rating</div>
                          <div className="text-xl font-mono font-bold text-purple-400 mt-0.5">{res.recommendedMcb} A ({res.recommendedCurve})</div>
                        </div>

                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>RCD Sensitivity & Type</div>
                          <div className="text-sm font-mono font-bold text-sky-400 mt-0.5">{res.rcdSensitivity} ({res.recommendedRcdType})</div>
                          <p className={`text-[10px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{res.rcdDesc}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-950/40 border border-purple-800/50 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-purple-300 flex items-center gap-1">
                        <ShieldCheck size={14} /> Recommended Hardware Part
                      </div>
                      <p className="text-[11px] font-mono text-purple-200">{res.deviceCombo}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3">
                      <ResultExportActions
                        toolId="mcb_rcbo"
                        toolName="🛡 MCB / RCBO / RCD Selection Assistant"
                        summary={`Specified ${res.recommendedMcb}A Type ${res.recommendedCurve} MCB (${mcbShortCircuitKa}kA) + ${res.recommendedRcdType} RCD (${res.rcdSensitivity})`}
                        inputs={{
                          mcbLoadCurrent,
                          mcbVoltage,
                          mcbApplication,
                          mcbInrushMult,
                          mcbRequireRcd,
                          mcbShortCircuitKa
                        }}
                        outputs={{
                          recommendedMcb: `${res.recommendedMcb} A`,
                          recommendedCurve: `${res.recommendedCurve} Curve`,
                          designCurrent125: `${res.designCurrent125.toFixed(1)} A`,
                          rcdSensitivity: res.rcdSensitivity,
                          recommendedRcdType: res.recommendedRcdType,
                          recommendedDeviceCombo: res.deviceCombo
                        }}
                        standardsRef="IEC 60898-1 / BS 7671 Reg 433"
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* TOOL 6: THREE-PHASE POWER CALCULATOR */}
            {/* ========================================================= */}
            {activeTool === 'threephase' && (() => {
              const res = calculateThreePhaseResults();
              return (
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
                  {/* Column 1: Config Inputs */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between ${
                        isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5 font-mono text-rose-500 font-bold">
                          <Activity size={14} />
                          3-Phase Parameters
                        </span>
                        {renderHelpButton('threephase')}
                      </div>

                      <div className="space-y-3">
                        {/* 1-Click Presets */}
                        <div className={`p-2 rounded-xl border mb-1 ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('hvac')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial HVAC Central Plant Star 52A (31.4 kW)"
                            >
                              ❄️ HVAC Star (52A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('delta_heater')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Industrial Process Duct Heater Delta 75A (52 kW)"
                            >
                              🔥 Heater Delta (75A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('compressor')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Heavy Rotary Screw Compressor Star 85A PF 0.82"
                            >
                              🏭 Compressor Star (85A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('welder_delta')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Automated Robotic MIG Welder Delta 110A PF 0.75"
                            >
                              ⚡ Welder Delta (110A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('furnace')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Metals Melting Induction Furnace Delta 220A 150 kW"
                            >
                              🔥 Furnace (220A / 150kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('chiller')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Centrifugal Water Chiller Star 140A PF 0.88"
                            >
                              🌊 Water Chiller (140A)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('unbalanced')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial Unbalanced 3-Phase Office Load (L1:72A, L2:45A, L3:88A)"
                            >
                              ⚖️ Office Unbalanced
                            </button>
                            <button
                              type="button"
                              onClick={() => loadThreePhasePreset('datacenter')}
                              className={`px-2 py-1 text-[10px] font-bold border rounded-lg transition-colors cursor-pointer text-left truncate ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Server Room Server PDU Racks Star 160A PF 0.98"
                            >
                              🖥️ Data Center PDU
                            </button>
                          </div>
                        </div>

                        {/* Star / Delta Connection */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Winding Wye (Star) / Delta</label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setTpConfig('star')}
                              className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                tpConfig === 'star'
                                  ? 'bg-rose-600 text-white border-rose-500'
                                  : isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              ⭐ Star (Y - 4 Wire)
                            </button>
                            <button
                              type="button"
                              onClick={() => setTpConfig('delta')}
                              className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                                tpConfig === 'delta'
                                  ? 'bg-rose-600 text-white border-rose-500'
                                  : isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              Δ Delta (3 Wire)
                            </button>
                          </div>
                        </div>

                        {/* Line Voltage */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Line-to-Line Voltage (VL)</label>
                          <select
                            value={tpLineVoltage}
                            onChange={(e) => setTpLineVoltage(Number(e.target.value))}
                            className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold font-mono ${
                              isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                            }`}
                          >
                            <option value={208}>208 V (US 3-Phase Commercial)</option>
                            <option value={400}>400 V (EU / UK Industrial)</option>
                            <option value={480}>480 V (US High Volts Industrial)</option>
                          </select>
                        </div>

                        {/* Line Current Slider */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Line Current (IL)</span>
                            <span className="font-mono text-rose-500 font-bold">{tpLineCurrent} A</span>
                          </label>
                          <input
                            type="range"
                            min="5"
                            max="200"
                            step="1"
                            value={tpLineCurrent}
                            onChange={(e) => setTpLineCurrent(Number(e.target.value))}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>

                        {/* Power Factor Slider */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Power Factor (cos φ)</span>
                            <span className="font-mono text-rose-500 font-bold">{tpPF.toFixed(2)}</span>
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max="1.0"
                            step="0.01"
                            value={tpPF}
                            onChange={(e) => setTpPF(Number(e.target.value))}
                            className="w-full accent-rose-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className={`text-[11px] font-mono border-t pt-2 mt-3 flex items-center justify-between ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>Active Vector Math</span>
                      <span className="text-rose-500 font-bold">P = √3·VL·IL·cosφ</span>
                    </div>
                  </div>

                  {/* Column 2: 3-Phase Vector Diagram */}
                  <div className={`lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-[320px] overflow-hidden border rounded-2xl p-4 shadow-2xl relative justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <Activity className="text-rose-500" size={16} />
                          120° Polyphase Phasor Vector Geometry
                        </h4>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Phase displacement relationship for L1 (Red), L2 (Yellow/Green), L3 (Blue) and Neutral vector sum.
                        </p>
                      </div>
                    </div>

                    {/* SVG Vector Graphic */}
                    <div className={`my-3 p-4 border rounded-xl flex-1 flex items-center justify-center relative ${
                      isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <svg className="w-full h-full max-h-[220px]" viewBox="0 0 300 200">
                        {/* Center origin (150, 100) */}
                        <circle cx="150" cy="100" r="75" fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3 3" />
                        
                        {/* L1 Vector (90 deg up) */}
                        <line x1="150" y1="100" x2="150" y2="30" stroke="#EF4444" strokeWidth="3" />
                        <text x="155" y="25" className="text-[10px] font-mono font-bold fill-rose-500">L1 (0°)</text>

                        {/* L2 Vector (210 deg bottom left) */}
                        <line x1="150" y1="100" x2="85" y2="137" stroke="#EAB308" strokeWidth="3" />
                        <text x="65" y="150" className="text-[10px] font-mono font-bold fill-amber-500">L2 (120°)</text>

                        {/* L3 Vector (330 deg bottom right) */}
                        <line x1="150" y1="100" x2="215" y2="137" stroke="#3B82F6" strokeWidth="3" />
                        <text x="220" y="150" className="text-[10px] font-mono font-bold fill-blue-500">L3 (240°)</text>

                        {/* Center Neutral Dot */}
                        <circle cx="150" cy="100" r="5" fill={isDark ? "#FFFFFF" : "#0F172A"} />
                      </svg>
                    </div>

                    <div className={`p-3 rounded-xl border text-xs grid grid-cols-2 gap-2 font-mono ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div>Phase Voltage (VP): <strong className="text-rose-400">{res.VP.toFixed(1)} V</strong></div>
                      <div>Phase Current (IP): <strong className="text-amber-400">{res.IP.toFixed(1)} A</strong></div>
                    </div>
                  </div>

                  {/* Column 3: Output Power Breakdown */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs font-mono text-rose-500 uppercase tracking-wider font-semibold">Power Output Summary</span>
                        <span className="text-[10px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                          {tpConfig.toUpperCase()} Wye/Delta
                        </span>
                      </div>

                      <div className="my-3 space-y-2">
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Real Power (P)</div>
                          <div className="text-xl font-mono font-bold text-rose-400 mt-0.5">{res.P_active_kW.toFixed(2)} kW</div>
                        </div>

                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Apparent Power (S)</div>
                          <div className="text-lg font-mono font-bold text-sky-400 mt-0.5">{res.S_apparent_kVA.toFixed(2)} kVA</div>
                        </div>

                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Reactive Power (Q)</div>
                          <div className="text-sm font-mono font-bold text-amber-400 mt-0.5">{res.Q_reactive_kVAR.toFixed(2)} kVAR</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-rose-300 flex items-center gap-1">
                        <Zap size={14} /> Power Factor Correction
                      </div>
                      <p className="text-[11px] font-mono text-rose-200">
                        Capacitor bank required to reach {res.targetPF} PF: <strong className="text-emerald-400">{res.requiredKVAR.toFixed(1)} kVAR</strong>
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3">
                      <ResultExportActions
                        toolId="threephase"
                        toolName="⚡ Three-Phase Power Calculator"
                        summary={`Calculated 3-Phase ${tpConfig.toUpperCase()} power: ${res.P_active_kW.toFixed(2)}kW, ${res.S_apparent_kVA.toFixed(2)}kVA at ${tpLineVoltage}V / ${tpLineCurrent}A`}
                        inputs={{
                          tpLineVoltage,
                          tpLineCurrent,
                          tpPF,
                          tpConfig
                        }}
                        outputs={{
                          activePowerKw: `${res.P_active_kW.toFixed(2)} kW`,
                          apparentPowerKva: `${res.S_apparent_kVA.toFixed(2)} kVA`,
                          reactivePowerKvar: `${res.Q_reactive_kVAR.toFixed(2)} kVAR`,
                          pfCorrectionReq: `${res.requiredKVAR.toFixed(1)} kVAR`
                        }}
                        standardsRef="IEC 60038 / IEEE 141 3-Phase Math"
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ========================================================= */}
            {/* TOOL 7: ENERGY COST CALCULATOR */}
            {/* ========================================================= */}
            {activeTool === 'energycost' && (() => {
              const res = calculateEnergyCostResults();
              return (
                <div className="h-full w-full grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch overflow-hidden">
                  {/* Column 1: Power & Tariff Inputs */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b flex items-center justify-between ${
                        isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
                      }`}>
                        <span className="flex items-center gap-1.5 font-mono text-teal-500 font-bold">
                          <Calculator size={14} />
                          Consumption & Tariff
                        </span>
                        {renderHelpButton('energycost')}
                      </div>

                      <div className="space-y-3">
                        {/* 1-Click Presets */}
                        <div className={`p-2 rounded-xl border mb-1 ${
                          isDark ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
                            <Zap size={11} />
                            1-Click Preset Scenarios
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('heatpump_home')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Domestic Heat Pump 4.5kW (12h/day)"
                            >
                              ♨️ Heat Pump (4.5kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('hvac')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial HVAC Plant 18kW (14h/day)"
                            >
                              🏢 HVAC Plant (18kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('ev_fleet')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="EV Commercial Fleet 4x 7.4kW = 29.6kW (6h overnight)"
                            >
                              🚘 EV Fleet (29.6kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('ev_home_night')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Home EV Off-Peak Night Tariff 7.4kW (4h)"
                            >
                              🚗 EV Off-Peak (7.4kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('server')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Data Server Room 24/7 12kW continuous"
                            >
                              💻 Server Room (24/7)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('crypto_rig')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Compute / Mining Cluster 6kW continuous"
                            >
                              ⚡ Mining Rig (6kW 24/7)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('lighting')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Warehouse High-Bay LED Conversion 3.2kW (16h/day)"
                            >
                              💡 Warehouse LED (3.2kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('bakery_oven')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Commercial Deck Bakery Oven 24kW (8h/day)"
                            >
                              🥐 Bakery Oven (24kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('carwash')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Automatic Drive-thru Car Wash 35kW (10h/day)"
                            >
                              🚙 Car Wash (35kW)
                            </button>
                            <button
                              type="button"
                              onClick={() => loadEnergyCostPreset('cold_storage')}
                              className={`py-1 px-2 text-[10px] font-bold rounded-lg border text-left truncate transition-colors cursor-pointer ${
                                isDark
                                  ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                                  : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
                              }`}
                              title="Cold Storage Logistics Chillers 42kW (20h/day)"
                            >
                              ❄️ Cold Storage (42kW)
                            </button>
                          </div>
                        </div>

                        {/* Power Kw Slider */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Equipment Power (kW)</span>
                            <span className="font-mono text-teal-500 font-bold">{ecPowerKw.toFixed(1)} kW</span>
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="50"
                            step="0.1"
                            value={ecPowerKw}
                            onChange={(e) => setEcPowerKw(Number(e.target.value))}
                            className="w-full accent-teal-500 cursor-pointer"
                          />
                        </div>

                        {/* Hours Per Day */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Usage Duty Cycle (Hours / Day)</span>
                            <span className="font-mono text-teal-500 font-bold">{ecHoursPerDay} hrs</span>
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="24"
                            step="1"
                            value={ecHoursPerDay}
                            onChange={(e) => setEcHoursPerDay(Number(e.target.value))}
                            className="w-full accent-teal-500 cursor-pointer"
                          />
                        </div>

                        {/* Tariff Rate */}
                        <div>
                          <label className={`text-xs font-semibold mb-1 flex items-center justify-between ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span>Electricity Rate ($ / kWh)</span>
                            <span className="font-mono text-emerald-500 font-bold">${ecTariffRate.toFixed(2)}</span>
                          </label>
                          <input
                            type="range"
                            min="0.05"
                            max="0.60"
                            step="0.01"
                            value={ecTariffRate}
                            onChange={(e) => setEcTariffRate(Number(e.target.value))}
                            className="w-full accent-emerald-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    <div className={`text-[11px] font-mono border-t pt-2 mt-3 flex items-center justify-between ${
                      isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-600'
                    }`}>
                      <span>CO₂ Factor: 0.385 kg/kWh</span>
                      <span className="text-teal-500 font-bold">${res.effectiveRate.toFixed(3)}/kWh</span>
                    </div>
                  </div>

                  {/* Column 2: Financial Projection Bar Breakdown */}
                  <div className={`lg:col-span-6 xl:col-span-6 flex flex-col h-full min-h-[320px] overflow-hidden border rounded-2xl p-4 shadow-2xl relative justify-between ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
                      <div>
                        <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <Calculator className="text-teal-500" size={16} />
                          Cumulative Operating Expenditure & Carbon Footprint
                        </h4>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Energy consumption vs financial expense projection over standard utility billing windows.
                        </p>
                      </div>
                    </div>

                    <div className="my-auto py-3 space-y-3">
                      {/* Daily */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Daily Running Cost</span>
                          <span className="font-bold text-teal-400">${res.dailyCost.toFixed(2)} ({res.dailyKwh.toFixed(1)} kWh)</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: '15%' }} />
                        </div>
                      </div>

                      {/* Monthly */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Monthly Electricity Bill</span>
                          <span className="font-bold text-amber-400">${res.monthlyCost.toFixed(2)} ({res.monthlyKwh.toFixed(0)} kWh)</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }} />
                        </div>
                      </div>

                      {/* Annual */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>Annual Total OPEX</span>
                          <span className="font-bold text-rose-400">${res.annualCost.toFixed(2)} ({res.annualKwh.toFixed(0)} kWh)</span>
                        </div>
                        <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-100'}`}>
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: '90%' }} />
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border text-xs flex justify-between items-center font-mono ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <span>🌱 Annual CO₂ Footprint:</span>
                      <strong className="text-emerald-400">{res.annualCo2Tonnes.toFixed(2)} Metric Tonnes CO₂</strong>
                    </div>
                  </div>

                  {/* Column 3: Billing Summary Cards */}
                  <div className={`lg:col-span-3 xl:col-span-3 border rounded-2xl p-4 flex flex-col justify-between overflow-y-auto shadow-xl ${
                    isDark ? 'bg-slate-900/90 border-slate-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}>
                    <div>
                      <div className={`flex items-center justify-between border-b pb-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs font-mono text-teal-500 uppercase tracking-wider font-semibold">Financial Forecast</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Live Tariff
                        </span>
                      </div>

                      <div className="my-3 space-y-2">
                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Daily Expenditure</div>
                          <div className="text-lg font-mono font-bold text-teal-400 mt-0.5">${res.dailyCost.toFixed(2)}</div>
                        </div>

                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Monthly Expenditure</div>
                          <div className="text-xl font-mono font-bold text-amber-400 mt-0.5">${res.monthlyCost.toFixed(2)}</div>
                        </div>

                        <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`text-[10px] uppercase font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>5-Year Life Cycle OPEX</div>
                          <div className="text-2xl font-mono font-bold text-emerald-400 mt-0.5">${res.fiveYearCost.toFixed(2)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-teal-950/40 border border-teal-800/50 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-teal-300 flex items-center gap-1">
                        <Zap size={14} /> Energy Saving Tip
                      </div>
                      <p className="text-[11px] text-teal-200">
                        Improving equipment power factor to 0.98 reduces peak demand surcharges by up to 15%.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/60 mt-3">
                      <ResultExportActions
                        toolId="energycost"
                        toolName="💰 Energy Cost Calculator"
                        summary={`Calculated energy costs for ${ecPowerKw}kW load running ${ecHoursPerDay}h/day at ${ecTariffRate}/kWh: ${res.dailyCost.toFixed(2)}/day, ${res.monthlyCost.toFixed(2)}/mo`}
                        inputs={{
                          ecPowerKw,
                          ecHoursPerDay,
                          ecDaysPerWeek,
                          ecTariffRate
                        }}
                        outputs={{
                          dailyCost: `${res.dailyCost.toFixed(2)} (${res.dailyKwh.toFixed(1)} kWh)`,
                          monthlyCost: `${res.monthlyCost.toFixed(2)} (${res.monthlyKwh.toFixed(0)} kWh)`,
                          annualCost: `${res.annualCost.toFixed(2)} (${res.annualKwh.toFixed(0)} kWh)`,
                          fiveYearCost: `${res.fiveYearCost.toFixed(2)}`,
                          annualCo2Emissions: `${res.annualCo2Tonnes.toFixed(2)} Metric Tonnes`
                        }}
                        standardsRef="Utility Tariff & Greenhouse Gas Equivalencies"
                        onSaveToHistory={handleSaveToHistory}
                        isDark={isDark}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

        {/* Footer Container Watermark Logo on Bottom Right */}
        <div className="fixed bottom-3 right-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 text-slate-300 text-xs font-mono shadow-xl">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span className="font-bold text-white font-serif">⚡ ElectraSim</span>
          <span className="text-[10px] text-slate-500 font-mono">Workspace</span>
        </div>
      </div>

      {/* Global Interactive Help Modal Popup */}
      {helpModalInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  {helpModalInfo.category || 'Electrical Code Guide'}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                  {helpModalInfo.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setHelpModalInfo(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <p className="font-semibold text-slate-900">{helpModalInfo.summary}</p>
              <p className="text-slate-600 text-xs leading-relaxed">{helpModalInfo.details}</p>

              {helpModalInfo.standard && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    Regulation & Code Standard
                  </div>
                  <div className="text-slate-600 font-mono">{helpModalInfo.standard}</div>
                </div>
              )}

              {helpModalInfo.formula && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Zap size={14} className="text-blue-600" />
                    Formula Reference
                  </div>
                  <div className="text-blue-900 font-mono font-semibold">{helpModalInfo.formula}</div>
                </div>
              )}

              {helpModalInfo.example && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-amber-800 flex items-center gap-1.5">
                    <Info size={14} className="text-amber-600" />
                    Typical Real-World Example
                  </div>
                  <div className="text-amber-900 italic">{helpModalInfo.example}</div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setHelpModalInfo(null)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
