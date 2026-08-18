export interface ScenarioItem {
  id: string;
  title: string;
  description?: string;
  toolId: string;
  createdAt: string;
  updatedAt: string;
  isBookmarked: boolean;
  tags: string[];
  state: Record<string, any>;
}

const STORAGE_KEY = 'electrasim_saved_scenarios';

// Curated Engineering Industry Templates & Presets
export const CURATED_SCENARIOS: ScenarioItem[] = [
  // 1. Battery Backup Presets
  {
    id: 'curated_battery_offgrid_cabin',
    title: '🏡 Off-Grid Solar Cabin 48V (15kWh LiFePO4)',
    description: '48V 300Ah LiFePO4 battery bank powering refrigerator, Starlink, LED lights, and water pump for 24+ hours.',
    toolId: 'battery_backup',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: true,
    tags: ['Solar', 'LiFePO4', 'Off-Grid', '48V'],
    state: {
      calcMode: 'runtime',
      systemVoltage: 48,
      batteryAh: 300,
      chemistryKey: 'lifepo4',
      dodPct: 90,
      inverterEfficiency: 94,
      inverterTareWatts: 35,
      desiredBackupHours: 24,
      activeAppliances: {
        fridge: 1,
        lights: 6,
        laptop: 2,
        wifi: 1,
        tv: 1
      },
      customWattage: 180,
      agingMarginPct: 15,
      tempDeratePct: 0
    }
  },
  {
    id: 'curated_battery_medical_clinic',
    title: '🏥 Medical Clinic Emergency UPS (10kVA Pure Sine)',
    description: 'Critical vaccine storage refrigerators, oxygen concentrators, and emergency lights with 8-hour autonomy.',
    toolId: 'battery_backup',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: true,
    tags: ['Healthcare', 'Critical UPS', '48V', 'LiFePO4'],
    state: {
      calcMode: 'sizing',
      systemVoltage: 48,
      batteryAh: 400,
      chemistryKey: 'lifepo4',
      dodPct: 90,
      inverterEfficiency: 95,
      inverterTareWatts: 45,
      desiredBackupHours: 8,
      activeAppliances: {
        fridge: 2,
        lights: 12,
        pc: 3,
        wifi: 1
      },
      customWattage: 650,
      agingMarginPct: 20,
      tempDeratePct: 5
    }
  },
  {
    id: 'curated_battery_telecom_tower',
    title: '📡 48V Telecom Cell Site Backup (AGM Deep Cycle)',
    description: 'Telecom standard 48V DC battery string powering radio base transceiver stations (BTS) at 50% DoD.',
    toolId: 'battery_backup',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: false,
    tags: ['Telecom', '48V', 'AGM', 'Industrial'],
    state: {
      calcMode: 'runtime',
      systemVoltage: 48,
      batteryAh: 500,
      chemistryKey: 'agm',
      dodPct: 50,
      inverterEfficiency: 92,
      inverterTareWatts: 40,
      desiredBackupHours: 12,
      activeAppliances: {
        wifi: 2,
        pc: 1
      },
      customWattage: 950,
      agingMarginPct: 20,
      tempDeratePct: 10
    }
  },

  // 2. Conduit Fill Presets
  {
    id: 'curated_conduit_commercial_emt',
    title: '🏢 Commercial 3-Phase Subpanel Feed (2" EMT Conduit)',
    description: 'Three 4/0 AWG phase conductors + 4/0 neutral + 4 AWG ground in 2" EMT complying with NEC 40% fill rule.',
    toolId: 'conduit',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: true,
    tags: ['NEC Ch9', 'EMT', 'Subpanel', 'Commercial'],
    state: {
      standard: 'NEC',
      conduitTypeKey: 'emt',
      conduitTradeSize: '2"',
      customConduitIdMm: 52.5,
      systemMode: 'conduit',
      conductors: [
        { id: '1', name: '4/0 AWG THHN Phases', size: '4/0 AWG', outerDiameterMm: 16.3, count: 3, color: '#ef4444' },
        { id: '2', name: '4/0 AWG THHN Neutral', size: '4/0 AWG', outerDiameterMm: 16.3, count: 1, color: '#ffffff' },
        { id: '3', name: '4 AWG THHN Equipment Ground', size: '4 AWG', outerDiameterMm: 8.2, count: 1, color: '#22c55e' }
      ]
    }
  },
  {
    id: 'curated_conduit_industrial_trunking',
    title: '🏭 Industrial Multi-Radial Trunking (100x50mm Steel)',
    description: '12 radial lighting and socket circuits in cable trunking complying with BS 7671 45% Space Factor.',
    toolId: 'conduit',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: false,
    tags: ['BS 7671', 'Trunking', 'Industrial', 'Multi-circuit'],
    state: {
      standard: 'IEC',
      conduitTypeKey: 'trunking',
      conduitTradeSize: '100x50mm',
      customConduitIdMm: 70.7,
      systemMode: 'trunking',
      trunkingWidthMm: 100,
      trunkingHeightMm: 50,
      conductors: [
        { id: '1', name: '2.5 mm² Twin & Earth', size: '2.5 mm²', outerDiameterMm: 8.5, count: 8, color: '#3b82f6' },
        { id: '2', name: '4.0 mm² Radial Feeder', size: '4.0 mm²', outerDiameterMm: 10.2, count: 4, color: '#eab308' }
      ]
    }
  },

  // 3. Cable Sizing Presets
  {
    id: 'curated_cablesize_ev_subpanel',
    title: '⚡ Level 2 Dual EV Charger Subpanel (100A Feeder)',
    description: '240V Single Phase 80A continuous load over 45m (148ft) designed for < 2.5% voltage drop.',
    toolId: 'cablesize',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: true,
    tags: ['EV Charging', 'NEC', 'Subpanel', 'Voltage Drop'],
    state: {
      csSystem: 'single',
      csVoltage: 240,
      csPowerWatts: 19200,
      csPowerFactor: 1.0,
      csLengthMeters: 45,
      csInstallMethod: 'In conduit in wall',
      csMaterial: 'copper',
      csCableType: 'XLPE Insulated SWA',
      csMaxDropPct: 2.5,
      csAmbientTemp: 35,
      csGrouping: 1,
      csInsulation: 'xlpe'
    }
  },
  {
    id: 'curated_cablesize_datacenter_hvac',
    title: '❄️ Data Center Chiller 3-Phase 400V (75kW Feeder)',
    description: '400V 3-Phase 75kW continuous chiller load with XLPE multi-core copper in cable ladder.',
    toolId: 'cablesize',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: false,
    tags: ['HVAC', 'IEC 60364', '3-Phase', '400V'],
    state: {
      csSystem: 'three',
      csVoltage: 400,
      csPowerWatts: 75000,
      csPowerFactor: 0.88,
      csLengthMeters: 60,
      csInstallMethod: 'On cable ladder',
      csMaterial: 'copper',
      csCableType: 'XLPE Insulated SWA',
      csMaxDropPct: 3.0,
      csAmbientTemp: 40,
      csGrouping: 2,
      csInsulation: 'xlpe'
    }
  },

  // 4. MCB / RCBO Sizing Presets
  {
    id: 'curated_mcb_induction_motor',
    title: '🌀 15kW Heavy Inrush Induction Motor (Type D MCB)',
    description: '400V 3-Phase motor with 8x inrush multiplier requiring Type D magnetic trip curve to prevent nuisance trips.',
    toolId: 'mcb_rcbo',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: true,
    tags: ['Motor Protection', 'Type D', 'Inrush', '400V'],
    state: {
      mcbLoadCurrent: 32,
      mcbVoltage: 400,
      mcbApplication: 'motor',
      mcbInrushMult: 8,
      mcbRequireRcd: true,
      mcbShortCircuitKa: 10
    }
  },

  // 5. Three-Phase Power & PFC Presets
  {
    id: 'curated_threephase_factory_pfc',
    title: '🏭 Industrial Factory Power Factor Correction (0.75 → 0.98)',
    description: '400V 3-Phase 160A inductive load requiring shunt capacitor bank sizing to avoid utility penalty charges.',
    toolId: 'threephase',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isBookmarked: true,
    tags: ['PFC', 'kVAR', 'Capacitor', '3-Phase'],
    state: {
      tpConfig: 'star',
      tpLineVoltage: 400,
      tpLineCurrent: 160,
      tpPF: 0.75,
      tpTargetPF: 0.98,
      tpUnbalanced: false
    }
  }
];

export function getSavedScenarios(): ScenarioItem[] {
  if (typeof window === 'undefined') return CURATED_SCENARIOS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return CURATED_SCENARIOS;
    const parsed: ScenarioItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return CURATED_SCENARIOS;
    return parsed;
  } catch (e) {
    console.error('Failed to load scenarios from localStorage', e);
    return CURATED_SCENARIOS;
  }
}

export function saveScenario(scenario: Omit<ScenarioItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): ScenarioItem {
  const existing = getSavedScenarios();
  const now = new Date().toISOString();
  
  if (scenario.id && existing.some(s => s.id === scenario.id)) {
    const updated = existing.map(item => {
      if (item.id === scenario.id) {
        return {
          ...item,
          ...scenario,
          updatedAt: now
        };
      }
      return item;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated.find(s => s.id === scenario.id)!;
  } else {
    const newItem: ScenarioItem = {
      id: scenario.id || `scenario_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: scenario.title || 'Untitled Scenario',
      description: scenario.description || '',
      toolId: scenario.toolId,
      createdAt: now,
      updatedAt: now,
      isBookmarked: !!scenario.isBookmarked,
      tags: scenario.tags || [],
      state: scenario.state || {}
    };
    const updated = [newItem, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newItem;
  }
}

export function toggleScenarioBookmark(id: string): ScenarioItem[] {
  const scenarios = getSavedScenarios();
  const updated = scenarios.map(s => s.id === id ? { ...s, isBookmarked: !s.isBookmarked } : s);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function deleteScenario(id: string): ScenarioItem[] {
  const scenarios = getSavedScenarios();
  const updated = scenarios.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function exportScenariosAsJson(scenariosToExport?: ScenarioItem[]): void {
  const data = scenariosToExport || getSavedScenarios();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ElectraSim_Scenarios_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importScenariosFromJson(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { success: false, count: 0, error: 'JSON payload must be an array of scenarios.' };
    }
    const current = getSavedScenarios();
    const existingIds = new Set(current.map(c => c.id));
    const newItems: ScenarioItem[] = [];
    
    for (const item of parsed) {
      if (item && item.title && item.toolId && item.state) {
        if (!existingIds.has(item.id)) {
          newItems.push({
            id: item.id || `imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            title: item.title,
            description: item.description || '',
            toolId: item.toolId,
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isBookmarked: !!item.isBookmarked,
            tags: Array.isArray(item.tags) ? item.tags : [],
            state: item.state
          });
        }
      }
    }

    const merged = [...newItems, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { success: true, count: newItems.length };
  } catch (e: any) {
    return { success: false, count: 0, error: e.message || 'Invalid JSON format' };
  }
}
