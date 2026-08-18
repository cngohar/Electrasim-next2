import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sparkles, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Box, 
  Gauge, 
  ShieldCheck, 
  Sliders, 
  ArrowRight,
  Flame,
  ArrowRightLeft
} from 'lucide-react';
import { 
  ConduitStandard, 
  NecRacewayType, 
  ConductorItem, 
  NEC_RACEWAYS, 
  IEC_CONDUITS, 
  IEC_TRUNKINGS, 
  NEC_CONDUCTOR_SPECS, 
  IEC_CONDUCTOR_SPECS, 
  getNecDeratingFactor, 
  getBsGroupingFactor, 
  checkJamRatio, 
  ConductorDimensionSpec 
} from '@/lib/conduitData';
import { ConduitPackingVisualizer } from './ConduitPackingVisualizer';
import { ResultExportActions } from './ResultExportActions';
import { FormulaCodeAccordion } from './FormulaCodeAccordion';
import { MobileStickySummaryRibbon } from './MobileStickySummaryRibbon';
import { CalculationError } from './CalculationError';

interface ConduitFillToolProps {
  standard: ConduitStandard;
  onStandardChange: (std: ConduitStandard) => void;
  onSaveToHistory: (entry: any) => void;
  isDark: boolean;
}

export const ConduitFillTool: React.FC<ConduitFillToolProps> = ({
  standard,
  onStandardChange,
  onSaveToHistory,
  isDark
}) => {
  // --- Raceway Selection State ---
  const [necRacewayType, setNecRacewayType] = useState<NecRacewayType>('EMT');
  const [iecRacewayCategory, setIecRacewayCategory] = useState<'CONDUIT' | 'TRUNKING'>('CONDUIT');
  const [isNippleRun, setIsNippleRun] = useState<boolean>(false); // NEC <= 24" / 600mm 60% fill
  const [iecBendsCount, setIecBendsCount] = useState<0 | 1 | 2 | 3>(1);

  const [sizingMode, setSizingMode] = useState<'auto' | 'manual'>('auto');
  const [manualTradeSize, setManualTradeSize] = useState<string>('3/4"');
  const [manualIecConduitSize, setManualIecConduitSize] = useState<number>(25);
  const [manualTrunkingIndex, setManualTrunkingIndex] = useState<number>(1); // 75x50mm

  // --- Active Conductors Roster ---
  const [conductors, setConductors] = useState<ConductorItem[]>(() => {
    if (standard === 'NEC') {
      return [
        { id: '1', gauge: '10 AWG', insulation: 'THHN', count: 3, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '10 AWG', insulation: 'THHN', count: 1, type: 'ground', isCurrentCarrying: false }
      ];
    } else {
      return [
        { id: '1', gauge: '4.0 mm²', insulation: 'PVC', count: 3, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '4.0 mm²', insulation: 'PVC', count: 1, type: 'ground', isCurrentCarrying: false }
      ];
    }
  });

  // --- Add New Conductor Form State ---
  const [addGauge, setAddGauge] = useState<string>(standard === 'NEC' ? '12 AWG' : '2.5 mm²');
  const [addInsulation, setAddInsulation] = useState<string>(standard === 'NEC' ? 'THHN' : 'PVC');
  const [addCount, setAddCount] = useState<number>(1);
  const [addType, setAddType] = useState<'phase' | 'neutral' | 'ground' | 'control'>('phase');

  // --- Map of specs for rapid lookup ---
  const specsMap = useMemo(() => {
    const map: Record<string, ConductorDimensionSpec> = {};
    NEC_CONDUCTOR_SPECS.forEach((s) => {
      map[`${s.gauge}_${s.insulation}`] = s;
    });
    IEC_CONDUCTOR_SPECS.forEach((s) => {
      map[`${s.gauge}_${s.insulation}`] = s;
    });
    return map;
  }, []);

  // Available Guages list based on active standard
  const availableGauges = useMemo(() => {
    if (standard === 'NEC') {
      return Array.from(new Set(NEC_CONDUCTOR_SPECS.map((s) => s.gauge)));
    } else {
      return Array.from(new Set(IEC_CONDUCTOR_SPECS.map((s) => s.gauge)));
    }
  }, [standard]);

  // Available Insulations list based on active standard
  const availableInsulations = useMemo(() => {
    if (standard === 'NEC') {
      return ['THHN', 'XHHW'];
    } else {
      return ['PVC', 'XLPE'];
    }
  }, [standard]);

  // -------------------------------------------------------------
  // Preset Scenarios
  // -------------------------------------------------------------
  const loadPreset = (presetName: string) => {
    if (presetName === 'nec_100a_feeder') {
      setNecRacewayType('EMT');
      setSizingMode('auto');
      setIsNippleRun(false);
      setConductors([
        { id: '1', gauge: '4 AWG', insulation: 'THHN', count: 2, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '4 AWG', insulation: 'THHN', count: 1, type: 'neutral', isCurrentCarrying: true },
        { id: '3', gauge: '8 AWG', insulation: 'THHN', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    } else if (presetName === 'nec_200a_service') {
      setNecRacewayType('PVC_40');
      setSizingMode('auto');
      setIsNippleRun(false);
      setConductors([
        { id: '1', gauge: '2/0 AWG', insulation: 'THHN', count: 2, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '2/0 AWG', insulation: 'THHN', count: 1, type: 'neutral', isCurrentCarrying: true },
        { id: '3', gauge: '4 AWG', insulation: 'THHN', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    } else if (presetName === 'nec_rtu_3phase') {
      setNecRacewayType('EMT');
      setSizingMode('auto');
      setIsNippleRun(false);
      setConductors([
        { id: '1', gauge: '6 AWG', insulation: 'THHN', count: 3, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '10 AWG', insulation: 'THHN', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    } else if (presetName === 'nec_evse_48a') {
      setNecRacewayType('EMT');
      setSizingMode('auto');
      setIsNippleRun(false);
      setConductors([
        { id: '1', gauge: '6 AWG', insulation: 'THHN', count: 2, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '10 AWG', insulation: 'THHN', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    } else if (presetName === 'nec_home_runs') {
      setNecRacewayType('EMT');
      setSizingMode('auto');
      setIsNippleRun(false);
      setConductors([
        { id: '1', gauge: '12 AWG', insulation: 'THHN', count: 6, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '12 AWG', insulation: 'THHN', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    } else if (presetName === 'iec_3p_submain') {
      setIecRacewayCategory('CONDUIT');
      setSizingMode('auto');
      setConductors([
        { id: '1', gauge: '35.0 mm²', insulation: 'XLPE', count: 4, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '16.0 mm²', insulation: 'XLPE', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    } else if (presetName === 'iec_trunking_bundle') {
      setIecRacewayCategory('TRUNKING');
      setSizingMode('auto');
      setConductors([
        { id: '1', gauge: '2.5 mm²', insulation: 'PVC', count: 8, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '1.5 mm²', insulation: 'PVC', count: 6, type: 'phase', isCurrentCarrying: true },
        { id: '3', gauge: '2.5 mm²', insulation: 'PVC', count: 2, type: 'ground', isCurrentCarrying: false }
      ]);
    }
  };

  // -------------------------------------------------------------
  // Conductor Roster Management Handlers
  // -------------------------------------------------------------
  const handleAddConductor = () => {
    if (addCount <= 0) return;
    const newItem: ConductorItem = {
      id: Date.now().toString(),
      gauge: addGauge,
      insulation: addInsulation,
      count: addCount,
      type: addType,
      isCurrentCarrying: addType === 'phase' || addType === 'neutral'
    };
    setConductors((prev) => [...prev, newItem]);
  };

  const handleRemoveConductor = (id: string) => {
    setConductors((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCount = (id: string, delta: number) => {
    setConductors((prev) =>
      prev
        .map((c) => {
          if (c.id === id) {
            const newCount = Math.max(0, c.count + delta);
            return { ...c, count: newCount };
          }
          return c;
        })
        .filter((c) => c.count > 0)
    );
  };

  // -------------------------------------------------------------
  // Mathematical Sizing & Fill Calculations
  // -------------------------------------------------------------
  const totalConductorCount = conductors.reduce((acc, c) => acc + c.count, 0);
  const currentCarryingCount = conductors.reduce((acc, c) => acc + (c.isCurrentCarrying ? c.count : 0), 0);

  // Total Conductor Cross-Sectional Area mm² and in²
  const totalConductorAreaMm2 = useMemo(() => {
    return conductors.reduce((acc, c) => {
      const key = `${c.gauge}_${c.insulation}`;
      const spec = specsMap[key];
      const areaPerWire = spec ? spec.areaMm2 : 10;
      return acc + areaPerWire * c.count;
    }, 0);
  }, [conductors, specsMap]);

  const totalConductorAreaIn2 = totalConductorAreaMm2 / 645.16;

  // BS 7671 Cable Factor Sums
  const totalBsConduitFactor = useMemo(() => {
    return conductors.reduce((acc, c) => {
      const key = `${c.gauge}_${c.insulation}`;
      const spec = specsMap[key];
      const factor = spec ? spec.bsConduitFactor : 30;
      return acc + factor * c.count;
    }, 0);
  }, [conductors, specsMap]);

  const totalBsTrunkingFactor = useMemo(() => {
    return conductors.reduce((acc, c) => {
      const key = `${c.gauge}_${c.insulation}`;
      const spec = specsMap[key];
      const factor = spec ? spec.bsTrunkingFactor : 10;
      return acc + factor * c.count;
    }, 0);
  }, [conductors, specsMap]);

  // Max Allowed Fill Percentage (NEC Ch 9 Table 1 or BS 7671)
  const maxAllowedFillPct = useMemo(() => {
    if (standard === 'NEC') {
      if (isNippleRun) return 60;
      if (totalConductorCount === 1) return 53;
      if (totalConductorCount === 2) return 31;
      return 40; // 3 or more conductors
    } else {
      if (iecRacewayCategory === 'TRUNKING') return 45; // 45% Space factor
      return 40;
    }
  }, [standard, isNippleRun, totalConductorCount, iecRacewayCategory]);

  // -------------------------------------------------------------
  // Determine Selected Raceway Spec
  // -------------------------------------------------------------
  const racewayCalc = useMemo(() => {
    if (standard === 'NEC') {
      const racewaysOfType = NEC_RACEWAYS.filter((r) => r.type === necRacewayType);

      if (sizingMode === 'auto') {
        // Find smallest conduit size where conductor area <= allowable area
        const suitable = racewaysOfType.find((r) => {
          let allowableIn2 = r.threePlusAreaIn2;
          if (isNippleRun) allowableIn2 = r.nippleAreaIn2;
          else if (totalConductorCount === 1) allowableIn2 = r.oneWireAreaIn2;
          else if (totalConductorCount === 2) allowableIn2 = r.twoWireAreaIn2;
          return totalConductorAreaIn2 <= allowableIn2;
        });

        const selected = suitable || racewaysOfType[racewaysOfType.length - 1];
        const fillPct = selected.totalAreaIn2 > 0 ? (totalConductorAreaIn2 / selected.totalAreaIn2) * 100 : 0;

        return {
          racewayName: `${selected.tradeSize} ${selected.typeName}`,
          shape: 'circle' as const,
          tradeSize: selected.tradeSize,
          insideDiameterMm: selected.insideDiameterMm,
          totalAreaMm2: selected.totalAreaMm2,
          fillPercentage: fillPct,
          isPass: fillPct <= maxAllowedFillPct,
          spec: selected
        };
      } else {
        // Manual mode
        const selected = racewaysOfType.find((r) => r.tradeSize === manualTradeSize) || racewaysOfType[0];
        const fillPct = selected.totalAreaIn2 > 0 ? (totalConductorAreaIn2 / selected.totalAreaIn2) * 100 : 0;

        return {
          racewayName: `${selected.tradeSize} ${selected.typeName}`,
          shape: 'circle' as const,
          tradeSize: selected.tradeSize,
          insideDiameterMm: selected.insideDiameterMm,
          totalAreaMm2: selected.totalAreaMm2,
          fillPercentage: fillPct,
          isPass: fillPct <= maxAllowedFillPct,
          spec: selected
        };
      }
    } else {
      // IEC / BS 7671 Standard
      if (iecRacewayCategory === 'TRUNKING') {
        if (sizingMode === 'auto') {
          // Find trunking where total cable area <= 45% of trunking area
          const suitable = IEC_TRUNKINGS.find((t) => totalConductorAreaMm2 <= t.maxFillAreaMm2);
          const selected = suitable || IEC_TRUNKINGS[IEC_TRUNKINGS.length - 1];
          const fillPct = (totalConductorAreaMm2 / selected.totalAreaMm2) * 100;

          return {
            racewayName: selected.name,
            shape: 'rectangle' as const,
            trunkingWidthMm: selected.widthMm,
            trunkingHeightMm: selected.heightMm,
            insideDiameterMm: Math.sqrt((selected.widthMm * selected.heightMm * 4) / Math.PI), // Equivalent circle diameter
            totalAreaMm2: selected.totalAreaMm2,
            fillPercentage: fillPct,
            isPass: fillPct <= 45,
            spec: selected
          };
        } else {
          const selected = IEC_TRUNKINGS[manualTrunkingIndex] || IEC_TRUNKINGS[0];
          const fillPct = (totalConductorAreaMm2 / selected.totalAreaMm2) * 100;

          return {
            racewayName: selected.name,
            shape: 'rectangle' as const,
            trunkingWidthMm: selected.widthMm,
            trunkingHeightMm: selected.heightMm,
            insideDiameterMm: Math.sqrt((selected.widthMm * selected.heightMm * 4) / Math.PI),
            totalAreaMm2: selected.totalAreaMm2,
            fillPercentage: fillPct,
            isPass: fillPct <= 45,
            spec: selected
          };
        }
      } else {
        // IEC Conduit Unit Factor Method
        if (sizingMode === 'auto') {
          const suitable = IEC_CONDUITS.find((c) => {
            let limitFactor = c.straightFactor;
            if (iecBendsCount === 1) limitFactor = c.oneBendFactor;
            else if (iecBendsCount === 2) limitFactor = c.twoBendsFactor;
            else if (iecBendsCount === 3) limitFactor = c.threeBendsFactor;
            return totalBsConduitFactor <= limitFactor;
          });

          const selected = suitable || IEC_CONDUITS[IEC_CONDUITS.length - 1];
          const fillPct = (totalConductorAreaMm2 / selected.totalAreaMm2) * 100;

          return {
            racewayName: selected.name,
            shape: 'circle' as const,
            insideDiameterMm: selected.insideDiameterMm,
            totalAreaMm2: selected.totalAreaMm2,
            fillPercentage: fillPct,
            isPass: fillPct <= 40,
            spec: selected
          };
        } else {
          const selected = IEC_CONDUITS.find((c) => c.sizeMm === manualIecConduitSize) || IEC_CONDUITS[0];
          const fillPct = (totalConductorAreaMm2 / selected.totalAreaMm2) * 100;

          return {
            racewayName: selected.name,
            shape: 'circle' as const,
            insideDiameterMm: selected.insideDiameterMm,
            totalAreaMm2: selected.totalAreaMm2,
            fillPercentage: fillPct,
            isPass: fillPct <= 40,
            spec: selected
          };
        }
      }
    }
  }, [
    standard, 
    necRacewayType, 
    iecRacewayCategory, 
    sizingMode, 
    manualTradeSize, 
    manualIecConduitSize, 
    manualTrunkingIndex, 
    isNippleRun, 
    totalConductorCount, 
    totalConductorAreaIn2, 
    totalConductorAreaMm2, 
    totalBsConduitFactor, 
    iecBendsCount, 
    maxAllowedFillPct
  ]);

  // Ampacity Derating factor
  const deratingFactor = standard === 'NEC' 
    ? getNecDeratingFactor(currentCarryingCount) 
    : getBsGroupingFactor(Math.ceil(currentCarryingCount / 2));

  // Jam Ratio Check for 3 Conductors
  const largestConductorDiameter = useMemo(() => {
    let maxD = 0;
    conductors.forEach((c) => {
      const spec = specsMap[`${c.gauge}_${c.insulation}`];
      if (spec && spec.outerDiameterMm > maxD) {
        maxD = spec.outerDiameterMm;
      }
    });
    return maxD;
  }, [conductors, specsMap]);

  const jamRatio = useMemo(() => {
    return checkJamRatio(racewayCalc.insideDiameterMm, largestConductorDiameter, totalConductorCount);
  }, [racewayCalc.insideDiameterMm, largestConductorDiameter, totalConductorCount]);

  // Error & Warning Handling
  const [isErrorDismissed, setIsErrorDismissed] = useState<boolean>(false);
  const conduitValidationError = useMemo(() => {
    if (totalConductorCount === 0) {
      return {
        title: 'No Conductors in Raceway',
        message: 'No wires have been added to the raceway. Add at least one phase, neutral, or ground conductor to calculate fill capacity.',
        suggestion: 'Use the "Add Conductor" form below or click on the default quick preset.'
      };
    }
    if (!racewayCalc.isPass) {
      return {
        title: 'Raceway Fill Limit Exceeded',
        message: `Calculated fill ratio is ${racewayCalc.fillPercentage.toFixed(1)}%, exceeding the maximum allowable code limit of ${maxAllowedFillPct}%.`,
        suggestion: standard === 'NEC' 
          ? 'Switch to Auto-Sizing or select a larger Trade Size raceway (e.g., 1" or 1-1/4") to prevent conductor jamming and overheating.'
          : 'Select a larger conduit (e.g., 32mm) or switch to a commercial cable trunking raceway.'
      };
    }
    if (jamRatio.isHazard) {
      return {
        title: 'High 3-Conductor Jam Hazard',
        message: `Conduit-to-conductor diameter ratio is ${jamRatio.jamRatio.toFixed(2)} (between 2.8 and 3.2). When pulling 3 conductors through bends, they can cross over and jam severely.`,
        suggestion: 'Select one nominal trade size larger or smaller to move away from the critical 2.8–3.2 jam threshold.'
      };
    }
    return null;
  }, [totalConductorCount, racewayCalc, maxAllowedFillPct, standard, jamRatio]);

  const handleResetConductors = () => {
    if (standard === 'NEC') {
      setConductors([
        { id: '1', gauge: '10 AWG', insulation: 'THHN', count: 3, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '10 AWG', insulation: 'THHN', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    } else {
      setConductors([
        { id: '1', gauge: '2.5 mm²', insulation: '70°C PVC', count: 3, type: 'phase', isCurrentCarrying: true },
        { id: '2', gauge: '2.5 mm²', insulation: '70°C PVC', count: 1, type: 'ground', isCurrentCarrying: false }
      ]);
    }
    setIsErrorDismissed(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Tool Title & Standard Switcher */}
      <div className={`p-5 rounded-2xl border ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      } shadow-sm`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xl">
              📏
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  NEC Chapter 9 & BS 7671
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {standard === 'NEC' ? 'NFPA 70 Tables 1, 4 & 5' : 'IET On-Site Guide Section 5'}
                </span>
              </div>
              <h2 className="text-2xl font-serif font-bold mt-1">
                Conduit & Trunking Fill Sizer
              </h2>
            </div>
          </div>

          {/* Dual Standard Switcher Pill */}
          <div className={`flex items-center rounded-xl border p-1 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={() => onStandardChange('NEC')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                standard === 'NEC'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇺🇸 US Standard (NEC)</span>
            </button>
            <button
              type="button"
              onClick={() => onStandardChange('IEC')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                standard === 'IEC'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>🇬🇧 🇪🇺 International (BS / IEC)</span>
            </button>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-mono text-[11px] shrink-0 flex items-center gap-1">
            <Sparkles size={13} className="text-amber-500" /> Presets:
          </span>
          {standard === 'NEC' ? (
            <>
              <button
                type="button"
                onClick={() => loadPreset('nec_100a_feeder')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                100A Feeder (4 AWG in EMT)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('nec_200a_service')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                200A Service (2/0 in PVC 40)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('nec_rtu_3phase')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                3-Phase RTU (6 AWG in EMT)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('nec_evse_48a')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                48A EVSE Charger
              </button>
              <button
                type="button"
                onClick={() => loadPreset('nec_home_runs')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                Multi-Wire Home Run (12 AWG)
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => loadPreset('iec_3p_submain')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                3-Phase Submain (35mm² XLPE)
              </button>
              <button
                type="button"
                onClick={() => loadPreset('iec_trunking_bundle')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-medium whitespace-nowrap cursor-pointer transition-colors"
              >
                Commercial Trunking Bundle (2.5 & 1.5mm²)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Calculation Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Raceway Selection Card */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          } shadow-xs`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Box size={16} className="text-blue-500" />
                <span>1. Select Raceway Type</span>
              </h3>

              {/* Sizing Mode Toggle */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setSizingMode('auto')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    sizingMode === 'auto'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Auto-Size
                </button>
                <button
                  type="button"
                  onClick={() => setSizingMode('manual')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                    sizingMode === 'manual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Manual Test
                </button>
              </div>
            </div>

            {standard === 'NEC' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Conduit Material & Schedule
                  </label>
                  <select
                    value={necRacewayType}
                    onChange={(e) => setNecRacewayType(e.target.value as NecRacewayType)}
                    className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                  >
                    <option value="EMT">EMT (Electrical Metallic Tubing)</option>
                    <option value="PVC_40">PVC Schedule 40 (Rigid Standard Wall)</option>
                    <option value="PVC_80">PVC Schedule 80 (Heavy Wall / Underground)</option>
                    <option value="RMC">RMC / GRC (Rigid Galvanized Steel)</option>
                    <option value="FMC">FMC (Flexible Metal Conduit)</option>
                  </select>
                </div>

                {sizingMode === 'manual' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Conduit Trade Size
                    </label>
                    <select
                      value={manualTradeSize}
                      onChange={(e) => setManualTradeSize(e.target.value)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    >
                      {NEC_RACEWAYS.filter((r) => r.type === necRacewayType).map((r) => (
                        <option key={r.tradeSize} value={r.tradeSize}>
                          {r.tradeSize} (Metric {r.metricDesignator}) — ID {r.insideDiameterInches}" ({r.insideDiameterMm} mm)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Short Run / Nipple 60% Fill Checkbox */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNippleRun}
                      onChange={(e) => setIsNippleRun(e.target.checked)}
                      className="rounded accent-blue-600 w-4 h-4"
                    />
                    <div>
                      <span className="font-semibold">Nipple / Short Run (≤ 24 inches / 600 mm)</span>
                      <span className="block text-[10px] text-slate-400">
                        Allows 60% fill limit and waives thermal derating (NEC Ch 9 Note 4 / 310.15(C)(1))
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              /* IEC Standards */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIecRacewayCategory('CONDUIT')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      iecRacewayCategory === 'CONDUIT'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Circular Conduit
                  </button>
                  <button
                    type="button"
                    onClick={() => setIecRacewayCategory('TRUNKING')}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      iecRacewayCategory === 'TRUNKING'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Rectangular Trunking
                  </button>
                </div>

                {iecRacewayCategory === 'CONDUIT' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Conduit Bends in Run
                    </label>
                    <select
                      value={iecBendsCount}
                      onChange={(e) => setIecBendsCount(Number(e.target.value) as any)}
                      className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden"
                    >
                      <option value={0}>Straight Run (0 Bends)</option>
                      <option value={1}>Run with 1 Bend</option>
                      <option value={2}>Run with 2 Bends (Standard)</option>
                      <option value={3}>Run with 3 Bends</option>
                    </select>
                  </div>
                )}

                {sizingMode === 'manual' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      {iecRacewayCategory === 'CONDUIT' ? 'Conduit Size' : 'Trunking Size'}
                    </label>
                    {iecRacewayCategory === 'CONDUIT' ? (
                      <select
                        value={manualIecConduitSize}
                        onChange={(e) => setManualIecConduitSize(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                      >
                        {IEC_CONDUITS.map((c) => (
                          <option key={c.sizeMm} value={c.sizeMm}>
                            {c.name} — ID {c.insideDiameterMm} mm ({c.totalAreaMm2} mm²)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={manualTrunkingIndex}
                        onChange={(e) => setManualTrunkingIndex(Number(e.target.value))}
                        className="w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                      >
                        {IEC_TRUNKINGS.map((t, idx) => (
                          <option key={t.name} value={idx}>
                            {t.name} — Max 45% Fill: {t.maxFillAreaMm2} mm²
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Conductor Roster Management Card */}
          <div className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          } shadow-xs`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Layers size={16} className="text-blue-500" />
                <span>2. Conductors in Raceway</span>
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                {totalConductorCount} Wires
              </span>
            </div>

            {/* List of Current Conductors */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {conductors.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  No conductors added. Use the form below to add wires.
                </div>
              ) : (
                conductors.map((c) => {
                  const key = `${c.gauge}_${c.insulation}`;
                  const spec = specsMap[key];
                  return (
                    <div
                      key={c.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border border-slate-700"
                          style={{
                            backgroundColor:
                              c.type === 'phase'
                                ? (standard === 'NEC' ? '#ef4444' : '#854d0e')
                                : c.type === 'neutral'
                                ? (standard === 'NEC' ? '#e2e8f0' : '#3b82f6')
                                : c.type === 'ground'
                                ? '#10b981'
                                : '#f59e0b'
                          }}
                        />
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {c.gauge} ({c.insulation})
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            <span className="capitalize">{c.type}</span> • OD: {spec ? spec.outerDiameterMm : 4.0} mm
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quantity Increment / Decrement */}
                        <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(c.id, -1)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-xs">{c.count}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(c.id, 1)}
                            className="w-5 h-5 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveConductor(c.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer transition-colors"
                          title="Remove Conductor"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Conductor Inline Form */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Add Conductor
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <select
                    value={addGauge}
                    onChange={(e) => setAddGauge(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-mono font-medium outline-hidden"
                  >
                    {availableGauges.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <select
                    value={addInsulation}
                    onChange={(e) => setAddInsulation(e.target.value)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-medium outline-hidden"
                  >
                    {availableInsulations.map((ins) => (
                      <option key={ins} value={ins}>
                        {ins}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-4">
                  <select
                    value={addType}
                    onChange={(e) => setAddType(e.target.value as any)}
                    className="w-full p-2 rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-medium outline-hidden"
                  >
                    <option value="phase">Phase (Hot)</option>
                    <option value="neutral">Neutral</option>
                    <option value="ground">Ground / CPC</option>
                    <option value="control">Control / Signal</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1.5 text-xs">
                  <span className="text-slate-400">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={addCount}
                    onChange={(e) => setAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center font-mono font-bold bg-transparent outline-hidden"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddConductor}
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus size={14} />
                  <span>Add to Raceway</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Visualizer & Engineering Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Validation & Code Violation Alert */}
          {conduitValidationError && !isErrorDismissed && (
            <CalculationError
              error={conduitValidationError.message}
              title={conduitValidationError.title}
              suggestion={conduitValidationError.suggestion}
              isDark={isDark}
              onDismiss={() => setIsErrorDismissed(true)}
              onReset={handleResetConductors}
            />
          )}

          {/* Main Visualizer (2D Cross-Section + 3D Tube) */}
          <ConduitPackingVisualizer
            standard={standard}
            racewayShape={racewayCalc.shape}
            racewayName={racewayCalc.racewayName}
            insideDiameterMm={racewayCalc.insideDiameterMm}
            trunkingWidthMm={(racewayCalc as any).trunkingWidthMm}
            trunkingHeightMm={(racewayCalc as any).trunkingHeightMm}
            totalConduitAreaMm2={racewayCalc.totalAreaMm2}
            totalConductorsAreaMm2={totalConductorAreaMm2}
            fillPercentage={racewayCalc.fillPercentage}
            maxAllowedFillPct={maxAllowedFillPct}
            conductorsList={conductors}
            conductorSpecsMap={specsMap}
            isDark={isDark}
          />

          {/* Quick Engineering Summary Strip */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          } shadow-xs`}>
            <div className="grid sm:grid-cols-3 gap-3 text-center">
              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Recommended Size
                </div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {racewayCalc.tradeSize || (racewayCalc as any).trunkingWidthMm ? `${(racewayCalc as any).trunkingWidthMm}×${(racewayCalc as any).trunkingHeightMm} mm` : `${racewayCalc.insideDiameterMm.toFixed(0)} mm`}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {racewayCalc.racewayName}
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Current-Carrying
                </div>
                <div className="text-lg font-bold text-amber-500 mt-1">
                  {currentCarryingCount} Conductor{currentCarryingCount === 1 ? '' : 's'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Thermal Factor: <strong>{(deratingFactor * 100).toFixed(0)}%</strong>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="text-[10px] uppercase font-mono font-bold text-slate-400">
                  Compliance Status
                </div>
                <div className={`text-base font-bold mt-1.5 flex items-center justify-center gap-1 ${
                  racewayCalc.isPass ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {racewayCalc.isPass ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{racewayCalc.isPass ? 'CODE PASS' : 'OVERFILLED'}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {standard === 'NEC' ? 'NEC Ch 9 Table 1' : 'BS 7671 Factor Limit'}
                </div>
              </div>
            </div>

            {/* Formula & Step-by-Step Code Accordion */}
            <div className="mt-4">
              <FormulaCodeAccordion
                title="Conduit Raceway Fill Formula & Jamming Ratios"
                standardRef={standard === 'NEC' ? 'NEC Chapter 9 Table 1 & Table 4' : 'BS 7671 Appendix 5 Trunking Factors'}
                formula="Fill % = (Σ Conductor Cross-Sectional Areas) / (Total Inside Raceway Area) × 100"
                substitution={`${totalConductorAreaMm2.toFixed(1)} mm² / ${racewayCalc.totalAreaMm2.toFixed(1)} mm² × 100`}
                result={`${racewayCalc.fillPercentage.toFixed(1)}% Fill (${maxAllowedFillPct}% Max Permitted Limit)`}
                notes={standard === 'NEC' 
                  ? 'NEC limits fill to 53% for 1 conductor, 31% for 2 conductors, and 40% for 3+ conductors (60% for nipples ≤ 24").' 
                  : 'BS 7671 sets conduit space factor at 45% and trunking factor unit capacity for thermal dissipation.'}
                isDark={isDark}
              />
            </div>

            {/* Export & Save Actions */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <ResultExportActions
                toolId="conduit"
                toolName="📏 Conduit & Trunking Fill Sizer"
                summary={`Calculated ${racewayCalc.racewayName} for ${totalConductorCount} conductors (${totalConductorAreaMm2.toFixed(1)} mm² conductor area, ${racewayCalc.fillPercentage.toFixed(1)}% fill vs ${maxAllowedFillPct}% code limit).`}
                inputs={{
                  standard,
                  racewayType: standard === 'NEC' ? necRacewayType : iecRacewayCategory,
                  totalConductorCount,
                  currentCarryingCount,
                  isNippleRun,
                  conductors: conductors.map((c) => `${c.count}x ${c.gauge} ${c.insulation} (${c.type})`).join(', ')
                }}
                outputs={{
                  recommendedRaceway: racewayCalc.racewayName,
                  calculatedFill: `${racewayCalc.fillPercentage.toFixed(2)}%`,
                  codeMaxAllowableFill: `${maxAllowedFillPct}%`,
                  totalConductorArea: `${totalConductorAreaMm2.toFixed(1)} mm² (${totalConductorAreaIn2.toFixed(3)} in²)`,
                  racewayInsideDiameter: `${racewayCalc.insideDiameterMm.toFixed(1)} mm`,
                  thermalAmpacityDeratingFactor: `${(deratingFactor * 100).toFixed(0)}%`,
                  complianceStatus: racewayCalc.isPass ? 'PASS' : 'FAIL (OVERFILL)'
                }}
                standardsRef={standard === 'NEC' ? 'NEC NFPA 70 2023 (Chapter 9 Tables 1, 4 & 5)' : 'BS 7671:2018+A3:2024 (Appendix 5)'}
                onSaveToHistory={onSaveToHistory}
                isDark={isDark}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Floating Summary Ribbon */}
      <MobileStickySummaryRibbon
        title="Raceway Sizing Summary"
        resultBadge={racewayCalc.racewayName}
        subText={`${racewayCalc.fillPercentage.toFixed(1)}% Fill (${totalConductorCount} Wires)`}
        status={racewayCalc.isPass ? 'pass' : 'warning'}
        isDark={isDark}
      />
    </div>
  );
};
