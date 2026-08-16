import {
  IEC_CABLE_SPECS,
  NEC_CABLE_SPECS,
  type ElectricalStandard,
  type StandardConductorSpec,
} from '@/lib/standards';

export type { ElectricalStandard } from '@/lib/standards';

export interface NormalizedConductorSpec {
  raw: StandardConductorSpec;
  label: string;
  secondaryLabel: string;
  areaMm2: number;
  copperPvcAmpacity: number;
  copperXlpeAmpacity: number;
  aluminiumPvcAmpacity: number;
  aluminiumXlpeAmpacity: number;
  copperResistanceOhmKm: number;
  aluminiumResistanceOhmKm: number;
  recommendedBreaker: number;
}

const IEC_BREAKER_RATINGS = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
const NEC_BREAKER_RATINGS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400];

const finite = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;
const positive = (value: number, fallback = 0) => Math.max(fallback, finite(value, fallback));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, finite(value, min)));

function normalizeConductor(spec: StandardConductorSpec, standard: ElectricalStandard): NormalizedConductorSpec {
  const isNec = standard === 'NEC';
  const breakerLimit = spec.recommendedBreakerNec;
  return {
    raw: spec,
    label: spec.primaryUnit,
    secondaryLabel: spec.secondaryUnit,
    areaMm2: spec.mm2,
    copperPvcAmpacity: isNec ? Math.min(spec.ampCuPvc60, breakerLimit) : spec.ampCuPvc75,
    copperXlpeAmpacity: isNec ? Math.min(spec.ampCuPvc75, breakerLimit) : spec.ampCuXlpe90,
    aluminiumPvcAmpacity: isNec ? Math.min(spec.ampAlPvc75, breakerLimit) : spec.ampAlPvc75,
    aluminiumXlpeAmpacity: isNec ? Math.min(spec.ampAlXlpe90, breakerLimit) : spec.ampAlXlpe90,
    copperResistanceOhmKm: spec.rCuPerKm,
    aluminiumResistanceOhmKm: spec.rAlPerKm,
    recommendedBreaker: isNec ? spec.recommendedBreakerNec : spec.recommendedMcbIec,
  };
}

function normalizedSpecifications(standard: ElectricalStandard) {
  return (standard === 'NEC' ? NEC_CABLE_SPECS : IEC_CABLE_SPECS)
    .map((spec) => normalizeConductor(spec, standard));
}

export function getCableSpecifications(standard: ElectricalStandard) {
  return normalizedSpecifications(standard);
}

export function getConductorSizeMm2(spec: NormalizedConductorSpec | null) {
  return spec?.areaMm2 ?? 0;
}

function ampacityFor(spec: NormalizedConductorSpec, material: 'copper' | 'aluminium', insulation: 'pvc' | 'xlpe') {
  if (material === 'copper') return insulation === 'pvc' ? spec.copperPvcAmpacity : spec.copperXlpeAmpacity;
  return insulation === 'pvc' ? spec.aluminiumPvcAmpacity : spec.aluminiumXlpeAmpacity;
}

function resistanceFor(spec: NormalizedConductorSpec, material: 'copper' | 'aluminium') {
  return material === 'copper' ? spec.copperResistanceOhmKm : spec.aluminiumResistanceOhmKm;
}

// Cable sizing ----------------------------------------------------------------

export type CableSystem = 'single' | 'three';
export interface CableInputs {
  standard: ElectricalStandard;
  system: CableSystem;
  powerWatts: number;
  voltage: number;
  powerFactor: number;
  lengthMeters: number;
  material: 'copper' | 'aluminium';
  installationMethod: string;
  ambientTemperature: number;
  groupingCircuits: number;
  maxVoltageDropPct: number;
  insulation?: 'pvc' | 'xlpe';
}

export interface CableCandidateEvaluation {
  spec: NormalizedConductorSpec;
  baseAmpacity: number;
  correctedAmpacity: number;
  voltageDrop: number;
  voltageDropPct: number;
  ampacityPass: boolean;
  voltageDropPass: boolean;
}

export interface CableCalculationResult {
  designCurrent: number;
  temperatureFactor: number;
  groupingFactor: number;
  installationFactor: number;
  combinedFactor: number;
  requiredAmpacity: number;
  selectedSize: NormalizedConductorSpec | null;
  selectedEvaluation: CableCandidateEvaluation | null;
  correctedAmpacity: number;
  voltageDrop: number;
  voltageDropPct: number;
  endVoltage: number;
  recommendedBreaker: number | null;
  powerLossWatts: number;
  energyLossKwhYear: number;
  isPass: boolean;
  noSolution: boolean;
  diagnostics: string[];
  evaluations: CableCandidateEvaluation[];
  standardsReference: string;
}

function temperatureDerating(standard: ElectricalStandard, ambient: number, insulation: 'pvc' | 'xlpe') {
  if (standard === 'NEC') {
    if (ambient <= 30) return 1;
    if (ambient <= 35) return 0.91;
    if (ambient <= 40) return 0.82;
    if (ambient <= 45) return 0.71;
    if (ambient <= 50) return 0.58;
    if (ambient <= 55) return 0.41;
    return 0;
  }
  if (insulation === 'pvc') {
    if (ambient <= 30) return 1;
    if (ambient <= 35) return 0.94;
    if (ambient <= 40) return 0.87;
    if (ambient <= 45) return 0.79;
    if (ambient <= 50) return 0.71;
    if (ambient <= 55) return 0.61;
    return 0.5;
  }
  if (ambient <= 30) return 1;
  if (ambient <= 35) return 0.96;
  if (ambient <= 40) return 0.91;
  if (ambient <= 45) return 0.87;
  if (ambient <= 50) return 0.82;
  if (ambient <= 55) return 0.76;
  return 0.71;
}

function groupingDerating(circuits: number) {
  if (circuits <= 1) return 1;
  if (circuits === 2) return 0.8;
  if (circuits === 3) return 0.7;
  return 0.65;
}

function installationDerating(method: string) {
  const normalized = method.toLowerCase();
  if (normalized.includes('burial') || normalized.includes('buried') || normalized.includes('underground')) return 0.85;
  if (normalized.includes('conduit')) return 0.9;
  if (normalized.includes('tray')) return 0.95;
  return 1;
}

export function calculateCableSize(input: CableInputs): CableCalculationResult {
  const insulation = input.insulation ?? 'pvc';
  const voltage = positive(input.voltage, 1);
  const power = positive(input.powerWatts);
  const pf = clamp(input.powerFactor, 0.1, 1);
  const length = positive(input.lengthMeters);
  const maxDrop = positive(input.maxVoltageDropPct, 0.1);
  const designCurrent = input.system === 'single'
    ? power / (voltage * pf)
    : power / (Math.sqrt(3) * voltage * pf);
  const temperatureFactor = temperatureDerating(input.standard, input.ambientTemperature, insulation);
  const groupingFactor = groupingDerating(Math.max(1, Math.round(input.groupingCircuits)));
  const installationFactor = installationDerating(input.installationMethod);
  const combinedFactor = temperatureFactor * groupingFactor * installationFactor;
  const requiredAmpacity = combinedFactor > 0 ? designCurrent / combinedFactor : Number.POSITIVE_INFINITY;
  const resistanceCoefficient = input.material === 'copper' ? 0.00393 : 0.00403;
  const resistanceMultiplier = 1 + resistanceCoefficient * (Math.max(-20, finite(input.ambientTemperature, 30)) - 20);
  const phaseMultiplier = input.system === 'single' ? 2 : Math.sqrt(3);
  const reactanceOhmKm = 0.08;
  const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));

  const evaluations = normalizedSpecifications(input.standard).map<CableCandidateEvaluation>((spec) => {
    const baseAmpacity = ampacityFor(spec, input.material, insulation);
    const correctedAmpacity = baseAmpacity * combinedFactor;
    const resistanceAtTemperature = resistanceFor(spec, input.material) * resistanceMultiplier;
    const voltageDrop = phaseMultiplier * designCurrent * (length / 1000)
      * ((resistanceAtTemperature * pf) + (reactanceOhmKm * sinPhi));
    const voltageDropPct = voltageDrop / voltage * 100;
    return {
      spec,
      baseAmpacity,
      correctedAmpacity,
      voltageDrop,
      voltageDropPct,
      ampacityPass: baseAmpacity > 0 && correctedAmpacity >= designCurrent,
      voltageDropPass: voltageDropPct <= maxDrop,
    };
  });

  const selectedEvaluation = evaluations.find((candidate) => candidate.ampacityPass && candidate.voltageDropPass) ?? null;
  const selectedSize = selectedEvaluation?.spec ?? null;
  const correctedAmpacity = selectedEvaluation?.correctedAmpacity ?? 0;
  const voltageDrop = selectedEvaluation?.voltageDrop ?? 0;
  const voltageDropPct = selectedEvaluation?.voltageDropPct ?? 0;
  const breakerRatings = input.standard === 'NEC' ? NEC_BREAKER_RATINGS : IEC_BREAKER_RATINGS;
  const breakerCeiling = selectedSize ? Math.min(selectedSize.recommendedBreaker, correctedAmpacity) : 0;
  const recommendedBreaker = selectedSize
    ? breakerRatings.find((rating) => rating >= designCurrent && rating <= breakerCeiling) ?? null
    : null;
  const resistanceAtTemperature = selectedSize ? resistanceFor(selectedSize, input.material) * resistanceMultiplier : 0;
  const carryingConductors = input.system === 'single' ? 2 : 3;
  const powerLossWatts = selectedSize
    ? carryingConductors * designCurrent ** 2 * resistanceAtTemperature * (length / 1000)
    : 0;
  const diagnostics: string[] = [];
  if (!selectedSize) diagnostics.push(`No ${input.standard} table conductor satisfies both corrected ampacity and ${maxDrop.toFixed(1)}% voltage drop.`);
  if (combinedFactor <= 0) diagnostics.push('Ambient-temperature correction reaches zero for this standard and insulation assumption.');
  if (selectedSize && !recommendedBreaker) diagnostics.push('No listed standard breaker is both above design current and at or below the conductor protection ceiling.');
  if (selectedEvaluation && selectedEvaluation.voltageDropPct > maxDrop * 0.85) diagnostics.push('Voltage drop is close to the selected design limit; consider route growth and connection losses.');
  diagnostics.push('Resistance is adjusted from 20°C using ambient temperature as an approximation; final design should use expected conductor operating temperature.');

  const noSolution = !selectedSize;
  const isPass = !!selectedSize && !!recommendedBreaker && correctedAmpacity >= designCurrent && voltageDropPct <= maxDrop;
  return {
    designCurrent, temperatureFactor, groupingFactor, installationFactor, combinedFactor, requiredAmpacity,
    selectedSize, selectedEvaluation, correctedAmpacity, voltageDrop, voltageDropPct,
    endVoltage: selectedSize ? voltage - voltageDrop : voltage,
    recommendedBreaker, powerLossWatts, energyLossKwhYear: powerLossWatts * 8 * 365 / 1000,
    isPass, noSolution, diagnostics, evaluations,
    standardsReference: input.standard === 'NEC'
      ? 'NEC Table 310.16, 240.4(D), 240.6(A), and voltage-drop informational notes'
      : 'BS 7671 / IEC 60364 conductor ampacity, correction factors, protection, and voltage drop',
  };
}

// Voltage drop and wire gauge --------------------------------------------------

export interface WireInputs {
  standard: ElectricalStandard;
  system: CableSystem;
  voltage: number;
  current: number;
  distanceMeters: number;
  material: 'copper' | 'aluminium';
  maxVoltageDropPct: number;
}

export interface WireCalculationResult {
  selectedSize: NormalizedConductorSpec | null;
  designCurrent: number;
  voltageDrop: number;
  voltageDropPct: number;
  endVoltage: number;
  resistanceOhms: number;
  powerLossWatts: number;
  energyLossKwhYear: number;
  ampacityUtilizationPct: number;
  isPass: boolean;
  noSolution: boolean;
  diagnostics: string[];
  standardsReference: string;
}

export function calculateWireGauge(input: WireInputs): WireCalculationResult {
  const voltage = positive(input.voltage, 1);
  const current = positive(input.current);
  const distance = positive(input.distanceMeters);
  const maxDrop = positive(input.maxVoltageDropPct, 0.1);
  const routeMultiplier = input.system === 'single' ? 2 : Math.sqrt(3);
  const candidates = normalizedSpecifications(input.standard).map((spec) => {
    const ampacity = input.material === 'copper' ? spec.copperPvcAmpacity : spec.aluminiumPvcAmpacity;
    const resistance = resistanceFor(spec, input.material);
    const resistanceOhms = routeMultiplier * distance * resistance / 1000;
    const voltageDrop = current * resistanceOhms;
    const voltageDropPct = voltageDrop / voltage * 100;
    return { spec, ampacity, resistanceOhms, voltageDrop, voltageDropPct, pass: ampacity > 0 && ampacity >= current && voltageDropPct <= maxDrop };
  });
  const selected = candidates.find((candidate) => candidate.pass) ?? null;
  const diagnostics: string[] = [];
  if (!selected) diagnostics.push(`No ${input.standard} table conductor meets ${current.toFixed(1)} A and ${maxDrop.toFixed(1)}% maximum voltage drop for this route.`);
  diagnostics.push('This quick route model uses DC resistance and does not include AC reactance, harmonic heating, installation derating, terminals, or parallel conductors.');
  return {
    selectedSize: selected?.spec ?? null,
    designCurrent: current,
    voltageDrop: selected?.voltageDrop ?? 0,
    voltageDropPct: selected?.voltageDropPct ?? 0,
    endVoltage: selected ? voltage - selected.voltageDrop : voltage,
    resistanceOhms: selected?.resistanceOhms ?? 0,
    powerLossWatts: selected ? current ** 2 * selected.resistanceOhms : 0,
    energyLossKwhYear: selected ? current ** 2 * selected.resistanceOhms * 8 * 365 / 1000 : 0,
    ampacityUtilizationPct: selected ? current / selected.ampacity * 100 : 0,
    isPass: !!selected,
    noSolution: !selected,
    diagnostics,
    standardsReference: input.standard === 'NEC'
      ? 'NEC Chapter 9 conductor resistance and 310.16 ampacity context'
      : 'IEC 60228 resistance and BS 7671 / IEC 60364 ampacity context',
  };
}

// Ohm's law and AC power -------------------------------------------------------

export type OhmSolveMode = 'VI' | 'VR' | 'IR' | 'PV' | 'PR' | 'PI';
export interface OhmInputs {
  solveMode: OhmSolveMode;
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  powerFactor: number;
  efficiency: number;
  frequency: number;
}
export interface OhmCalculationResult {
  voltage: number; current: number; resistance: number; impedance: number; reactance: number;
  outputPower: number; realPower: number; apparentPower: number; reactivePower: number;
  powerFactor: number; efficiency: number; frequency: number; phaseAngleDeg: number;
  valid: boolean; error?: string;
}

export function calculateOhmsLaw(input: OhmInputs): OhmCalculationResult {
  const pf = clamp(input.powerFactor, 0.01, 1);
  const efficiency = clamp(input.efficiency, 0.1, 100) / 100;
  const frequency = positive(input.frequency);
  let voltage = positive(input.voltage);
  let current = positive(input.current);
  let resistance = positive(input.resistance);
  let outputPower = positive(input.power);
  let error: string | undefined;
  const requirePositive = (values: Array<[string, number]>) => {
    const missing = values.find(([, value]) => value <= 0);
    if (missing) error = `${missing[0]} must be greater than zero for this solve mode.`;
  };
  if (input.solveMode === 'VI') {
    requirePositive([['Voltage', voltage], ['Current', current]]);
    const impedance = current > 0 ? voltage / current : 0;
    resistance = impedance * pf;
    outputPower = voltage * current * pf * efficiency;
  } else if (input.solveMode === 'VR') {
    requirePositive([['Voltage', voltage], ['Resistance', resistance]]);
    const impedance = resistance / pf;
    current = impedance > 0 ? voltage / impedance : 0;
    outputPower = current ** 2 * resistance * efficiency;
  } else if (input.solveMode === 'IR') {
    requirePositive([['Current', current], ['Resistance', resistance]]);
    voltage = current * (resistance / pf);
    outputPower = current ** 2 * resistance * efficiency;
  } else if (input.solveMode === 'PV') {
    requirePositive([['Power', outputPower], ['Voltage', voltage]]);
    const inputRealPower = outputPower / efficiency;
    current = voltage > 0 ? inputRealPower / (voltage * pf) : 0;
    resistance = current > 0 ? inputRealPower / current ** 2 : 0;
  } else if (input.solveMode === 'PI') {
    requirePositive([['Power', outputPower], ['Current', current]]);
    const inputRealPower = outputPower / efficiency;
    voltage = current > 0 ? inputRealPower / (current * pf) : 0;
    resistance = current > 0 ? inputRealPower / current ** 2 : 0;
  } else {
    requirePositive([['Power', outputPower], ['Resistance', resistance]]);
    const inputRealPower = outputPower / efficiency;
    current = resistance > 0 ? Math.sqrt(inputRealPower / resistance) : 0;
    voltage = current * (resistance / pf);
  }
  voltage = finite(voltage); current = finite(current); resistance = finite(resistance); outputPower = finite(outputPower);
  const impedance = current > 0 ? voltage / current : 0;
  const realPower = voltage * current * pf;
  const apparentPower = voltage * current;
  const reactivePower = Math.sqrt(Math.max(0, apparentPower ** 2 - realPower ** 2));
  const reactance = Math.sqrt(Math.max(0, impedance ** 2 - resistance ** 2));
  const valid = !error && [voltage, current, resistance, impedance, realPower].every(Number.isFinite);
  return {
    voltage, current, resistance, impedance, reactance, outputPower, realPower, apparentPower, reactivePower,
    powerFactor: pf, efficiency: efficiency * 100, frequency,
    phaseAngleDeg: Math.acos(pf) * 180 / Math.PI,
    valid,
    error: valid ? undefined : error ?? 'The entered quantities do not produce a finite circuit solution.',
  };
}

// Circuit protection -----------------------------------------------------------

export type LoadCategory = 'general' | 'lighting' | 'motor' | 'transformer' | 'heater' | 'ev_charger' | 'solar';
export type RcdSensitivity = '30mA' | '100mA' | '300mA';
export interface ProtectionInputs {
  loadCurrent: number; loadCategory: LoadCategory; voltage: number; faultCurrentKa: number;
  rcdSensitivity: RcdSensitivity; cableLengthMeters: number;
}
export interface ProtectionCalculationResult {
  designCurrentWithMargin: number; suggestedRating: number; curve: 'B' | 'C' | 'D'; curveReason: string;
  deviceType: 'MCB' | 'RCBO'; rcdType: 'AC' | 'A' | 'F' | 'B'; rcdTypeReason: string;
  sensitivity: string; sensitivityReason: string; breakingCapacityKa: number; poles: number;
  valid: boolean; diagnostics: string[];
}

export function calculateProtection(input: ProtectionInputs): ProtectionCalculationResult {
  const current = positive(input.loadCurrent);
  const margin = input.loadCategory === 'motor' || input.loadCategory === 'transformer' ? 1.25 : 1.2;
  const designCurrentWithMargin = current * margin;
  const ratings = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
  const suggestedRating = ratings.find((rating) => rating >= designCurrentWithMargin) ?? 0;
  let curve: 'B' | 'C' | 'D' = 'B';
  let curveReason = 'Typical low-inrush resistive, lighting, or general-purpose load.';
  if (input.loadCategory === 'motor' || input.loadCategory === 'ev_charger' || input.loadCategory === 'solar') {
    curve = 'C'; curveReason = 'Moderate inrush or power-electronic equipment commonly requires additional instantaneous-trip headroom.';
  }
  if (input.loadCategory === 'transformer') {
    curve = 'D'; curveReason = 'High transformer magnetizing inrush may require a high instantaneous-trip threshold after coordination checks.';
  }
  let rcdType: 'AC' | 'A' | 'F' | 'B' = 'A';
  let rcdTypeReason = 'Type A detects sinusoidal AC and pulsating DC residual current from common electronic loads.';
  if (input.loadCategory === 'motor') { rcdType = 'F'; rcdTypeReason = 'Type F is commonly considered for single-phase variable-speed motor drives after manufacturer review.'; }
  if (input.loadCategory === 'ev_charger' || input.loadCategory === 'solar') { rcdType = 'B'; rcdTypeReason = 'DC-producing power electronics may require Type B or a permitted Type A device with integral 6 mA DC detection.'; }
  const breakingOptions = [4.5, 6, 10, 15, 25, 36, 50];
  const breakingCapacityKa = breakingOptions.find((rating) => rating >= positive(input.faultCurrentKa)) ?? 0;
  const diagnostics: string[] = [];
  if (!suggestedRating) diagnostics.push('Required current exceeds the assistant standard-rating list.');
  if (!breakingCapacityKa) diagnostics.push('Prospective fault current exceeds the assistant breaking-capacity list.');
  diagnostics.push('Confirm cable ampacity, earth-fault loop impedance, disconnection time, selectivity, and manufacturer trip curves before device selection.');
  return {
    designCurrentWithMargin, suggestedRating, curve, curveReason,
    deviceType: input.rcdSensitivity ? 'RCBO' : 'MCB', rcdType, rcdTypeReason,
    sensitivity: input.rcdSensitivity.replace('mA', ' mA'),
    sensitivityReason: input.rcdSensitivity === '30mA' ? 'Common additional personal-shock protection level.' : 'Higher residual settings are generally for fire protection or coordinated upstream protection, not direct personal protection.',
    breakingCapacityKa, poles: input.voltage > 300 ? 3 : 1,
    valid: current > 0 && !!suggestedRating && !!breakingCapacityKa,
    diagnostics,
  };
}

// Three-phase power ------------------------------------------------------------

export type ThreePhaseSystem = 'star' | 'delta';
export interface ThreePhaseInputs {
  system: ThreePhaseSystem; lineVoltage: number; lineCurrent: number; powerFactor: number;
  efficiency: number; imbalancePct: number; targetPowerFactor: number;
}
export interface ThreePhaseResult {
  phaseVoltage: number; phaseCurrent: number; apparentPowerKva: number; realPowerKw: number;
  outputPowerKw: number; reactivePowerKvar: number; neutralCurrent: number; correctionKvar: number;
  phaseAngleDeg: number; valid: boolean; error?: string;
}
export function calculateThreePhasePower(input: ThreePhaseInputs): ThreePhaseResult {
  const lineVoltage = positive(input.lineVoltage);
  const lineCurrent = positive(input.lineCurrent);
  const powerFactor = clamp(input.powerFactor, 0.01, 1);
  const efficiency = clamp(input.efficiency, 0.1, 100) / 100;
  const targetPowerFactor = clamp(input.targetPowerFactor, powerFactor, 1);
  const apparentPowerKva = Math.sqrt(3) * lineVoltage * lineCurrent / 1000;
  const realPowerKw = apparentPowerKva * powerFactor;
  const reactivePowerKvar = apparentPowerKva * Math.sin(Math.acos(powerFactor));
  const correctionKvar = Math.max(0, realPowerKw * (Math.tan(Math.acos(powerFactor)) - Math.tan(Math.acos(targetPowerFactor))));
  const valid = lineVoltage > 0 && lineCurrent >= 0;
  return {
    phaseVoltage: input.system === 'star' ? lineVoltage / Math.sqrt(3) : lineVoltage,
    phaseCurrent: input.system === 'star' ? lineCurrent : lineCurrent / Math.sqrt(3),
    apparentPowerKva, realPowerKw, outputPowerKw: realPowerKw * efficiency, reactivePowerKvar,
    neutralCurrent: lineCurrent * clamp(input.imbalancePct, 0, 100) / 100,
    correctionKvar, phaseAngleDeg: Math.acos(powerFactor) * 180 / Math.PI,
    valid, error: valid ? undefined : 'Line voltage must be greater than zero and current cannot be negative.',
  };
}

// Energy cost -----------------------------------------------------------------

export interface EnergyInputs {
  powerWatts: number; hoursPerDay: number; daysPerMonth: number; tariffPerKwh: number;
  peakRate: number; offPeakRate: number; peakSharePct: number; carbonKgPerKwh: number;
}
export interface EnergyResult {
  dailyKwh: number; monthlyKwh: number; annualKwh: number; dailyCost: number; monthlyCost: number;
  annualCost: number; effectiveBlendedRate: number; blendedMonthlyCost: number; blendedAnnualCost: number;
  annualCarbonKg: number; valid: boolean; error?: string;
}
export function calculateEnergyCost(input: EnergyInputs): EnergyResult {
  const powerKw = positive(input.powerWatts) / 1000;
  const hoursPerDay = clamp(input.hoursPerDay, 0, 24);
  const daysPerMonth = clamp(input.daysPerMonth, 0, 31);
  const dailyKwh = powerKw * hoursPerDay;
  const monthlyKwh = dailyKwh * daysPerMonth;
  const annualKwh = monthlyKwh * 12;
  const tariff = positive(input.tariffPerKwh);
  const peakShare = clamp(input.peakSharePct, 0, 100) / 100;
  const effectiveBlendedRate = peakShare * positive(input.peakRate) + (1 - peakShare) * positive(input.offPeakRate);
  const valid = input.powerWatts >= 0 && input.hoursPerDay >= 0 && input.hoursPerDay <= 24 && input.daysPerMonth >= 0 && input.daysPerMonth <= 31;
  return {
    dailyKwh, monthlyKwh, annualKwh,
    dailyCost: dailyKwh * tariff, monthlyCost: monthlyKwh * tariff, annualCost: annualKwh * tariff,
    effectiveBlendedRate, blendedMonthlyCost: monthlyKwh * effectiveBlendedRate,
    blendedAnnualCost: annualKwh * effectiveBlendedRate,
    annualCarbonKg: annualKwh * positive(input.carbonKgPerKwh),
    valid, error: valid ? undefined : 'Hours must be 0–24 and active days must be 0–31.',
  };
}

// Load and preliminary breaker sizing -----------------------------------------

export interface LoadItem { id: string; name: string; watts: number; quantity: number; }
export interface LoadCalculationInputs {
  standard: ElectricalStandard; loads: LoadItem[]; diversityPct: number; voltage: number;
  phases: 1 | 3; powerFactor: number; continuousFactor: number;
}
export interface LoadCalculationResult {
  connectedWatts: number; diversifiedWatts: number; fullLoadCurrent: number; designCurrentWithMargin: number;
  recommendedBreaker: number | null; indicativeConductor: NormalizedConductorSpec | null;
  spareCapacityA: number; valid: boolean; diagnostics: string[]; standardsReference: string;
}
export function calculateLoadAndBreaker(input: LoadCalculationInputs): LoadCalculationResult {
  const voltage = positive(input.voltage, 1);
  const powerFactor = clamp(input.powerFactor, 0.01, 1);
  const connectedWatts = input.loads.reduce((sum, load) => sum + positive(load.watts) * Math.max(0, Math.floor(finite(load.quantity))), 0);
  const diversifiedWatts = connectedWatts * clamp(input.diversityPct, 0, 100) / 100;
  const denominator = input.phases === 3 ? Math.sqrt(3) * voltage * powerFactor : voltage * powerFactor;
  const fullLoadCurrent = diversifiedWatts / denominator;
  const designCurrentWithMargin = fullLoadCurrent * Math.max(1, finite(input.continuousFactor, 1.25));
  const ratings = input.standard === 'NEC' ? NEC_BREAKER_RATINGS : IEC_BREAKER_RATINGS;
  const recommendedBreaker = ratings.find((rating) => rating >= designCurrentWithMargin) ?? null;
  const indicativeConductor = recommendedBreaker
    ? normalizedSpecifications(input.standard).find((spec) => spec.copperPvcAmpacity >= recommendedBreaker) ?? null
    : null;
  const diagnostics: string[] = [];
  if (input.loads.length === 0 || connectedWatts <= 0) diagnostics.push('Add at least one positive connected load.');
  if (!recommendedBreaker && connectedWatts > 0) diagnostics.push(`The required rating exceeds the ${input.standard} breaker list available to this assistant.`);
  diagnostics.push('Select diversity and continuous-load treatment for the actual occupancy and applicable code rather than relying on a generic preset.');
  diagnostics.push('The indicative conductor ignores installation, grouping, ambient temperature, voltage drop, fault-loop impedance, and terminal limits; complete the cable-size calculation separately.');
  return {
    connectedWatts, diversifiedWatts, fullLoadCurrent, designCurrentWithMargin,
    recommendedBreaker, indicativeConductor,
    spareCapacityA: recommendedBreaker ? Math.max(0, recommendedBreaker - designCurrentWithMargin) : 0,
    valid: connectedWatts > 0 && recommendedBreaker !== null,
    diagnostics,
    standardsReference: input.standard === 'NEC'
      ? 'NEC standard overcurrent ratings; continuous-load treatment must be verified for the actual circuit'
      : 'IEC/BS standard device ratings; overload coordination must be verified for the actual circuit',
  };
}

// Electrical unit conversion --------------------------------------------------

export type PowerUnit = 'W' | 'kW' | 'hp' | 'kVA' | 'BTUhr';
export interface ConversionInputs { value: number; sourceUnit: PowerUnit; powerFactor: number; voltage: number; phases: 1 | 3; }
export interface ConversionResult {
  watts: number; kilowatts: number; horsepower: number; kva: number; btuPerHour: number;
  currentAmps: number; reactiveKvar: number; valid: boolean; error?: string;
}
export function calculateConversion(input: ConversionInputs): ConversionResult {
  const value = positive(input.value);
  const pf = clamp(input.powerFactor, 0.01, 1);
  let watts = value;
  if (input.sourceUnit === 'kW') watts = value * 1000;
  if (input.sourceUnit === 'hp') watts = value * 745.699872;
  if (input.sourceUnit === 'kVA') watts = value * 1000 * pf;
  if (input.sourceUnit === 'BTUhr') watts = value / 3.412141633;
  const kilowatts = watts / 1000;
  const horsepower = watts / 745.699872;
  const kva = kilowatts / pf;
  const voltage = positive(input.voltage, 1);
  const currentAmps = input.phases === 3 ? watts / (Math.sqrt(3) * voltage * pf) : watts / (voltage * pf);
  const reactiveKvar = Math.sqrt(Math.max(0, kva ** 2 - kilowatts ** 2));
  const valid = input.value >= 0 && input.voltage > 0 && input.powerFactor > 0 && input.powerFactor <= 1;
  return {
    watts, kilowatts, horsepower, kva, btuPerHour: watts * 3.412141633,
    currentAmps, reactiveKvar, valid,
    error: valid ? undefined : 'Value cannot be negative; voltage and power factor must be positive, and power factor cannot exceed 1.',
  };
}
