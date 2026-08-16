import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Calculator,
  Cpu,
  Gauge,
  Layers3,
  Scale,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export type AssistantToolId =
  | 'cable-size'
  | 'voltage-drop'
  | 'load-calculator'
  | 'ohms-law'
  | 'circuit-protection'
  | 'three-phase'
  | 'energy-cost'
  | 'unit-converter';

export interface AssistantToolDefinition {
  id: AssistantToolId;
  path: string;
  legacyIds: string[];
  name: string;
  shortName: string;
  title: string;
  description: string;
  eyebrow: string;
  badge: string;
  accent: string;
  icon: LucideIcon;
  keywords: string[];
}

export const ASSISTANT_TOOLS: AssistantToolDefinition[] = [
  {
    id: 'cable-size', path: '/assistant/cable-size', legacyIds: ['cablesize'],
    name: 'Cable Size Calculator', shortName: 'Cable Size', icon: Layers3,
    title: 'Cable Size Calculator — IEC & NEC Conductor Sizing | ElectraSim',
    description: 'Estimate IEC or NEC conductor size, corrected ampacity, voltage drop, heat loss and compatible circuit protection with an interactive 3D cable view.',
    eyebrow: 'Conductor engineering', badge: 'IEC 60364 · BS 7671 · NEC', accent: 'emerald',
    keywords: ['cable size calculator', 'wire ampacity', 'IEC cable sizing', 'NEC conductor size', 'voltage drop'],
  },
  {
    id: 'voltage-drop', path: '/assistant/voltage-drop', legacyIds: ['voltagedrop', 'wire'],
    name: 'Voltage Drop Calculator', shortName: 'Voltage Drop', icon: Scale,
    title: 'Voltage Drop & Wire Gauge Calculator | ElectraSim',
    description: 'Calculate conductor voltage drop, end voltage, power loss and a suitable IEC or NEC wire gauge for a two-conductor circuit.',
    eyebrow: 'Route and conductor analysis', badge: 'IEC · NEC · AWG · mm²', accent: 'blue',
    keywords: ['voltage drop calculator', 'wire gauge calculator', 'AWG calculator', 'end voltage'],
  },
  {
    id: 'load-calculator', path: '/assistant/load-calculator', legacyIds: ['loadcalc', 'breaker'],
    name: 'Electrical Load Calculator', shortName: 'Load Calculator', icon: Cpu,
    title: 'Electrical Load & Breaker Calculator | ElectraSim',
    description: 'Add connected loads, apply a diversity factor and estimate design current and a standard overcurrent protection rating.',
    eyebrow: 'Demand and diversity', badge: 'Load schedule · OCPD', accent: 'indigo',
    keywords: ['electrical load calculator', 'breaker size calculator', 'demand factor', 'diversity factor'],
  },
  {
    id: 'ohms-law', path: '/assistant/ohms-law', legacyIds: ['ohms'],
    name: "Ohm's Law & AC Power Calculator", shortName: "Ohm's Law", icon: Zap,
    title: "Ohm's Law, Impedance & AC Power Calculator | ElectraSim",
    description: 'Solve voltage, current, equivalent series resistance, impedance, real power, apparent power and reactive power in a consistent single-phase AC model.',
    eyebrow: 'Circuit fundamentals', badge: 'V · I · R · Z · P · S · Q', accent: 'amber',
    keywords: ['ohms law calculator', 'impedance calculator', 'AC power calculator', 'power factor'],
  },
  {
    id: 'circuit-protection', path: '/assistant/circuit-protection', legacyIds: ['mcb_rcbo'],
    name: 'MCB, RCBO & RCD Selection Assistant', shortName: 'Circuit Protection', icon: ShieldCheck,
    title: 'MCB, RCBO & RCD Selection Assistant | ElectraSim',
    description: 'Estimate a standard breaker rating, B/C/D trip curve, residual-current device type and breaking capacity for common load categories.',
    eyebrow: 'Overcurrent and leakage', badge: 'MCB · RCBO · RCD', accent: 'purple',
    keywords: ['MCB calculator', 'RCBO selection', 'RCD type', 'breaker trip curve'],
  },
  {
    id: 'three-phase', path: '/assistant/three-phase', legacyIds: ['threephase'],
    name: 'Three-Phase Power Calculator', shortName: 'Three Phase', icon: Activity,
    title: 'Three-Phase Star & Delta Power Calculator | ElectraSim',
    description: 'Calculate star or delta phase values, active, apparent and reactive power, neutral current and power-factor correction.',
    eyebrow: 'Polyphase systems', badge: 'Star · Delta · PF correction', accent: 'rose',
    keywords: ['three phase calculator', 'star delta calculator', 'kVAR correction', 'neutral current'],
  },
  {
    id: 'energy-cost', path: '/assistant/energy-cost', legacyIds: ['energycost'],
    name: 'Energy Cost Calculator', shortName: 'Energy Cost', icon: Calculator,
    title: 'Electricity Energy Cost & Carbon Calculator | ElectraSim',
    description: 'Estimate daily, monthly and annual electricity consumption, tariff cost, peak/off-peak blending and carbon emissions.',
    eyebrow: 'Energy and operating cost', badge: 'kWh · Tariff · CO₂', accent: 'teal',
    keywords: ['energy cost calculator', 'electricity bill calculator', 'kWh cost', 'carbon emissions'],
  },
  {
    id: 'unit-converter', path: '/assistant/unit-converter', legacyIds: ['converter'],
    name: 'Electrical Unit Converter', shortName: 'Unit Converter', icon: Gauge,
    title: 'Electrical Power Unit Converter — W, kW, HP, kVA & BTU | ElectraSim',
    description: 'Convert watts, kilowatts, horsepower, kVA and BTU per hour while estimating current and reactive power from voltage and power factor.',
    eyebrow: 'Power unit conversion', badge: 'W · kW · HP · kVA · BTU', accent: 'cyan',
    keywords: ['electrical unit converter', 'watts to horsepower', 'kVA to kW', 'BTU to watts'],
  },
];

export const TOOL_BY_ID = Object.fromEntries(
  ASSISTANT_TOOLS.map((tool) => [tool.id, tool]),
) as Record<AssistantToolId, AssistantToolDefinition>;

export function routeForLegacyToolId(id?: string) {
  return ASSISTANT_TOOLS.find((tool) => tool.legacyIds.includes(id ?? ''))?.path;
}
