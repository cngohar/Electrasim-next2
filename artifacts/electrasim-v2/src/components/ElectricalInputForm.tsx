import React, { useState, useEffect } from 'react';
import { Zap, Scale, Cpu, Gauge, RefreshCw, Check, AlertTriangle } from 'lucide-react';
import CalculationError from './CalculationError';

export interface ElectricalFormValues {
  voltage: number; // in Volts
  voltageUnit: 'mV' | 'V' | 'kV';
  current: number; // in Amperes
  currentUnit: 'mA' | 'A' | 'kA';
  resistance: number; // in Ohms
  resistanceUnit: 'mΩ' | 'Ω' | 'kΩ' | 'MΩ';
  power: number; // in Watts
  powerUnit: 'mW' | 'W' | 'kW' | 'MW' | 'HP';
  powerFactor: number;
}

export interface ElectricalInputFormProps {
  initialValues?: Partial<ElectricalFormValues>;
  visibleFields?: Array<'voltage' | 'current' | 'resistance' | 'power' | 'powerFactor'>;
  onChange?: (values: ElectricalFormValues, isValid: boolean, errorMsg: string | null) => void;
  onSubmit?: (values: ElectricalFormValues) => void;
  title?: string;
  isDark?: boolean;
  className?: string;
}

const VOLTAGE_MULTIPLIERS = { mV: 0.001, V: 1, kV: 1000 };
const CURRENT_MULTIPLIERS = { mA: 0.001, A: 1, kA: 1000 };
const RESISTANCE_MULTIPLIERS = { 'mΩ': 0.001, 'Ω': 1, 'kΩ': 1000, 'MΩ': 1000000 };
const POWER_MULTIPLIERS = { mW: 0.001, W: 1, kW: 1000, MW: 1000000, HP: 745.7 };

export const ElectricalInputForm: React.FC<ElectricalInputFormProps> = ({
  initialValues,
  visibleFields = ['voltage', 'current', 'resistance', 'power', 'powerFactor'],
  onChange,
  onSubmit,
  title = 'Electrical Parameter Inputs',
  isDark = true,
  className = '',
}) => {
  const [voltageVal, setVoltageVal] = useState<number>(initialValues?.voltage ?? 230);
  const [voltageUnit, setVoltageUnit] = useState<'mV' | 'V' | 'kV'>(initialValues?.voltageUnit ?? 'V');

  const [currentVal, setCurrentVal] = useState<number>(initialValues?.current ?? 10);
  const [currentUnit, setCurrentUnit] = useState<'mA' | 'A' | 'kA'>(initialValues?.currentUnit ?? 'A');

  const [resistanceVal, setResistanceVal] = useState<number>(initialValues?.resistance ?? 23);
  const [resistanceUnit, setResistanceUnit] = useState<'mΩ' | 'Ω' | 'kΩ' | 'MΩ'>(initialValues?.resistanceUnit ?? 'Ω');

  const [powerVal, setPowerVal] = useState<number>(initialValues?.power ?? 2300);
  const [powerUnit, setPowerUnit] = useState<'mW' | 'W' | 'kW' | 'MW' | 'HP'>(initialValues?.powerUnit ?? 'W');

  const [pfVal, setPfVal] = useState<number>(initialValues?.powerFactor ?? 0.85);

  const [error, setError] = useState<string | null>(null);
  const [errorSuggestion, setErrorSuggestion] = useState<string | undefined>(undefined);

  // Normalized calculations in standard SI units
  const normVoltage = voltageVal * VOLTAGE_MULTIPLIERS[voltageUnit];
  const normCurrent = currentVal * CURRENT_MULTIPLIERS[currentUnit];
  const normResistance = resistanceVal * RESISTANCE_MULTIPLIERS[resistanceUnit];
  const normPower = powerVal * POWER_MULTIPLIERS[powerUnit];

  // Validation logic
  useEffect(() => {
    let err: string | null = null;
    let sugg: string | undefined = undefined;

    if (visibleFields.includes('voltage') && normVoltage <= 0) {
      err = 'Voltage must be greater than 0 V.';
      sugg = 'Enter a positive supply voltage (e.g., 120V AC domestic or 230V EU).';
    } else if (visibleFields.includes('current') && normCurrent < 0) {
      err = 'Current cannot be negative.';
      sugg = 'Current represents magnitude of electrical charge flow in Amperes.';
    } else if (visibleFields.includes('resistance') && normResistance <= 0) {
      err = 'Resistance must be greater than 0 Ω to prevent infinite short-circuit current.';
      sugg = 'Zero resistance causes division by zero. Enter a positive resistance value.';
    } else if (visibleFields.includes('power') && normPower < 0) {
      err = 'Power dissipation cannot be negative.';
      sugg = 'Real active power (W) consumed by load must be non-negative.';
    } else if (visibleFields.includes('powerFactor') && (pfVal <= 0 || pfVal > 1)) {
      err = 'Power Factor must be strictly between 0.01 and 1.00.';
      sugg = 'Purely resistive loads have PF = 1.0. Inductive motor loads typically range from 0.70 to 0.95.';
    }

    setError(err);
    setErrorSuggestion(sugg);

    const formValues: ElectricalFormValues = {
      voltage: normVoltage,
      voltageUnit,
      current: normCurrent,
      currentUnit,
      resistance: normResistance,
      resistanceUnit,
      power: normPower,
      powerUnit,
      powerFactor: pfVal,
    };

    if (onChange) {
      onChange(formValues, err === null, err);
    }
  }, [
    voltageVal,
    voltageUnit,
    currentVal,
    currentUnit,
    resistanceVal,
    resistanceUnit,
    powerVal,
    powerUnit,
    pfVal,
    JSON.stringify(visibleFields),
  ]);

  const handleReset = () => {
    setVoltageVal(230);
    setVoltageUnit('V');
    setCurrentVal(10);
    setCurrentUnit('A');
    setResistanceVal(23);
    setResistanceUnit('Ω');
    setPowerVal(2300);
    setPowerUnit('W');
    setPfVal(0.85);
  };

  const handlePresetSelect = (preset: 'US_120' | 'EU_230' | '3P_400' | 'DC_12') => {
    if (preset === 'US_120') {
      setVoltageVal(120);
      setVoltageUnit('V');
      setCurrentVal(15);
      setCurrentUnit('A');
      setResistanceVal(8);
      setResistanceUnit('Ω');
      setPowerVal(1800);
      setPowerUnit('W');
    } else if (preset === 'EU_230') {
      setVoltageVal(230);
      setVoltageUnit('V');
      setCurrentVal(13);
      setCurrentUnit('A');
      setResistanceVal(17.7);
      setResistanceUnit('Ω');
      setPowerVal(2990);
      setPowerUnit('W');
    } else if (preset === '3P_400') {
      setVoltageVal(400);
      setVoltageUnit('V');
      setCurrentVal(32);
      setCurrentUnit('A');
      setResistanceVal(7.2);
      setResistanceUnit('Ω');
      setPowerVal(22000);
      setPowerUnit('W');
    } else if (preset === 'DC_12') {
      setVoltageVal(12);
      setVoltageUnit('V');
      setCurrentVal(5);
      setCurrentUnit('A');
      setResistanceVal(2.4);
      setResistanceUnit('Ω');
      setPowerVal(60);
      setPowerUnit('W');
    }
  };

  return (
    <div
      id="electrical-input-form-container"
      className={`p-4 rounded-2xl border shadow-xl flex flex-col justify-between transition-all ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      } ${className}`}
    >
      <div className="space-y-3.5">
        <div className={`text-xs font-bold uppercase tracking-wider pb-2 border-b flex items-center justify-between ${
          isDark ? 'text-slate-200 border-slate-800' : 'text-slate-800 border-slate-100'
        }`}>
          <span className="flex items-center gap-2 font-mono text-amber-500 font-bold">
            <Zap size={15} />
            {title}
          </span>
          <button
            type="button"
            onClick={handleReset}
            className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              isDark ? 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <RefreshCw size={10} />
            Reset
          </button>
        </div>

        {/* Preset Chips */}
        <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <label className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1.5 flex items-center gap-1 font-mono">
            <Gauge size={11} />
            Quick Presets
          </label>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => handlePresetSelect('US_120')}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
              }`}
            >
              🇺🇸 120V / 15A US
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('EU_230')}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
              }`}
            >
              🇪🇺 230V / 13A EU
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('3P_400')}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
              }`}
            >
              ⚡ 400V 3-Phase
            </button>
            <button
              type="button"
              onClick={() => handlePresetSelect('DC_12')}
              className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700' : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-2xs'
              }`}
            >
              🔋 12V DC Battery
            </button>
          </div>
        </div>

        {/* Validation Alert */}
        <CalculationError
          error={error}
          title="Input Validation Warning"
          suggestion={errorSuggestion}
          onReset={handleReset}
          isDark={isDark}
        />

        {/* Input Fields Grid */}
        <div className="space-y-3">
          {/* Voltage Input */}
          {visibleFields.includes('voltage') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Voltage (V)
                </label>
                <span className="text-[11px] font-mono font-bold text-amber-500">
                  {normVoltage.toLocaleString()} V
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={voltageVal}
                  onChange={(e) => setVoltageVal(Number(e.target.value))}
                  className={`flex-1 px-3 py-1.5 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Voltage"
                />
                <select
                  value={voltageUnit}
                  onChange={(e) => setVoltageUnit(e.target.value as any)}
                  className={`px-2.5 py-1.5 border rounded-xl text-xs font-mono font-bold ${
                    isDark ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-slate-100 border-slate-300 text-amber-700'
                  }`}
                >
                  <option value="mV">mV</option>
                  <option value="V">V</option>
                  <option value="kV">kV</option>
                </select>
              </div>
            </div>
          )}

          {/* Current Input */}
          {visibleFields.includes('current') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Current (I)
                </label>
                <span className="text-[11px] font-mono font-bold text-cyan-500">
                  {normCurrent.toLocaleString()} A
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={currentVal}
                  onChange={(e) => setCurrentVal(Number(e.target.value))}
                  className={`flex-1 px-3 py-1.5 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-cyan-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Current"
                />
                <select
                  value={currentUnit}
                  onChange={(e) => setCurrentUnit(e.target.value as any)}
                  className={`px-2.5 py-1.5 border rounded-xl text-xs font-mono font-bold ${
                    isDark ? 'bg-slate-950 border-slate-800 text-cyan-400' : 'bg-slate-100 border-slate-300 text-cyan-700'
                  }`}
                >
                  <option value="mA">mA</option>
                  <option value="A">A</option>
                  <option value="kA">kA</option>
                </select>
              </div>
            </div>
          )}

          {/* Resistance Input */}
          {visibleFields.includes('resistance') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Resistance (R)
                </label>
                <span className="text-[11px] font-mono font-bold text-emerald-500">
                  {normResistance.toLocaleString()} Ω
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={resistanceVal}
                  onChange={(e) => setResistanceVal(Number(e.target.value))}
                  className={`flex-1 px-3 py-1.5 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Resistance"
                />
                <select
                  value={resistanceUnit}
                  onChange={(e) => setResistanceUnit(e.target.value as any)}
                  className={`px-2.5 py-1.5 border rounded-xl text-xs font-mono font-bold ${
                    isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-100 border-slate-300 text-emerald-700'
                  }`}
                >
                  <option value="mΩ">mΩ</option>
                  <option value="Ω">Ω</option>
                  <option value="kΩ">kΩ</option>
                  <option value="MΩ">MΩ</option>
                </select>
              </div>
            </div>
          )}

          {/* Power Input */}
          {visibleFields.includes('power') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Power (P)
                </label>
                <span className="text-[11px] font-mono font-bold text-purple-500">
                  {normPower.toLocaleString()} W
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={powerVal}
                  onChange={(e) => setPowerVal(Number(e.target.value))}
                  className={`flex-1 px-3 py-1.5 border rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-purple-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                  placeholder="Power"
                />
                <select
                  value={powerUnit}
                  onChange={(e) => setPowerUnit(e.target.value as any)}
                  className={`px-2.5 py-1.5 border rounded-xl text-xs font-mono font-bold ${
                    isDark ? 'bg-slate-950 border-slate-800 text-purple-400' : 'bg-slate-100 border-slate-300 text-purple-700'
                  }`}
                >
                  <option value="mW">mW</option>
                  <option value="W">W</option>
                  <option value="kW">kW</option>
                  <option value="MW">MW</option>
                  <option value="HP">HP</option>
                </select>
              </div>
            </div>
          )}

          {/* Power Factor Input */}
          {visibleFields.includes('powerFactor') && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Power Factor (cos φ)
                </label>
                <span className="text-[11px] font-mono font-bold text-rose-500">
                  {pfVal.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.01"
                value={pfVal}
                onChange={(e) => setPfVal(Number(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Action Submit Button if provided */}
      {onSubmit && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            disabled={error !== null}
            onClick={() => {
              if (error === null) {
                onSubmit({
                  voltage: normVoltage,
                  voltageUnit,
                  current: normCurrent,
                  currentUnit,
                  resistance: normResistance,
                  resistanceUnit,
                  power: normPower,
                  powerUnit,
                  powerFactor: pfVal,
                });
              }
            }}
            className={`w-full py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              error !== null
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md'
            }`}
          >
            <Check size={14} />
            Apply Calculation Inputs
          </button>
        </div>
      )}
    </div>
  );
};

export default ElectricalInputForm;
