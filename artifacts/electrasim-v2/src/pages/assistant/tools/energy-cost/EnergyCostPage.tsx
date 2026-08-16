import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Leaf, SlidersHorizontal } from 'lucide-react';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import { EngineeringNotice, Metric, NumberField, Panel, PanelHeading, PresetBar, PresetButton, ResultStatus } from '../../components/ToolUi';
import { calculateEnergyCost, type EnergyInputs } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['energy-cost'];

export default function EnergyCostPage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [powerWatts, setPowerWatts] = useState(1500);
  const [hoursPerDay, setHoursPerDay] = useState(4);
  const [daysPerMonth, setDaysPerMonth] = useState(30);
  const [tariffPerKwh, setTariffPerKwh] = useState(0.25);
  const [peakRate, setPeakRate] = useState(0.35);
  const [offPeakRate, setOffPeakRate] = useState(0.18);
  const [peakSharePct, setPeakSharePct] = useState(40);
  const [carbonKgPerKwh, setCarbonKgPerKwh] = useState(0.42);

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });
  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    if (typeof entry.inputs.powerWatts === 'number') setPowerWatts(entry.inputs.powerWatts);
    if (typeof entry.inputs.hoursPerDay === 'number') setHoursPerDay(entry.inputs.hoursPerDay);
    if (typeof entry.inputs.tariffPerKwh === 'number') setTariffPerKwh(entry.inputs.tariffPerKwh);
  }, []);

  const inputs: EnergyInputs = { powerWatts, hoursPerDay, daysPerMonth, tariffPerKwh, peakRate, offPeakRate, peakSharePct, carbonKgPerKwh };
  const result = useMemo(() => calculateEnergyCost(inputs), [powerWatts, hoursPerDay, daysPerMonth, tariffPerKwh, peakRate, offPeakRate, peakSharePct, carbonKgPerKwh]);
  const summary = result.valid ? `${result.monthlyKwh.toFixed(1)} kWh/month costs ${result.monthlyCost.toFixed(2)} at the flat tariff or ${result.blendedMonthlyCost.toFixed(2)} at the blended tariff.` : result.error ?? 'Invalid energy inputs.';
  const chartMax = Math.max(result.annualCost, result.blendedAnnualCost, 1);

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5">
        <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="Usage and tariff" eyebrow="Operating profile" isDark={isDark} />
            <div className="space-y-3 p-4">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => { setPowerWatts(1500); setHoursPerDay(4); setDaysPerMonth(30); }}>Space heater</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setPowerWatts(120); setHoursPerDay(8); setDaysPerMonth(22); }}>Office equipment</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setPowerWatts(7000); setHoursPerDay(2.5); setDaysPerMonth(20); setPeakSharePct(15); }}>EV charging</PresetButton>
              </PresetBar>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Equipment power" unit="W" value={powerWatts} min={0} onChange={setPowerWatts} isDark={isDark} />
                <NumberField label="Use per day" unit="h" value={hoursPerDay} min={0} max={24} step={0.1} onChange={setHoursPerDay} isDark={isDark} />
                <NumberField label="Days per month" unit="days" value={daysPerMonth} min={0} max={31} step={1} onChange={setDaysPerMonth} isDark={isDark} />
                <NumberField label="Flat tariff" unit="/kWh" value={tariffPerKwh} min={0} step={0.01} onChange={setTariffPerKwh} isDark={isDark} />
                <NumberField label="Peak rate" unit="/kWh" value={peakRate} min={0} step={0.01} onChange={setPeakRate} isDark={isDark} />
                <NumberField label="Off-peak rate" unit="/kWh" value={offPeakRate} min={0} step={0.01} onChange={setOffPeakRate} isDark={isDark} />
                <NumberField label="Peak energy share" unit="%" value={peakSharePct} min={0} max={100} step={1} onChange={setPeakSharePct} isDark={isDark} />
                <NumberField label="Grid carbon factor" unit="kg/kWh" value={carbonKgPerKwh} min={0} step={0.01} onChange={setCarbonKgPerKwh} isDark={isDark} />
              </div>
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel isDark={isDark}>
              <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Consumption and cost" eyebrow="Daily to annual projection" isDark={isDark} />
              <div className="space-y-4 p-4 sm:p-5">
                <ResultStatus ok={result.valid} label={result.valid ? 'Energy projection ready' : 'Input correction required'} message={result.valid ? 'The monthly model uses the entered active days; the annual projection multiplies the resulting monthly estimate by 12.' : result.error ?? 'Review entered values.'} isDark={isDark} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Daily energy" value={`${result.dailyKwh.toFixed(2)} kWh`} tone="blue" isDark={isDark} />
                  <Metric label="Monthly energy" value={`${result.monthlyKwh.toFixed(1)} kWh`} tone="cyan" isDark={isDark} />
                  <Metric label="Annual energy" value={`${result.annualKwh.toFixed(1)} kWh`} tone="purple" isDark={isDark} />
                  <Metric label="Effective blended rate" value={`${result.effectiveBlendedRate.toFixed(3)}/kWh`} tone="amber" isDark={isDark} />
                  <Metric label="Monthly flat cost" value={result.monthlyCost.toFixed(2)} tone="emerald" isDark={isDark} />
                  <Metric label="Monthly blended cost" value={result.blendedMonthlyCost.toFixed(2)} tone="blue" isDark={isDark} />
                  <Metric label="Annual blended cost" value={result.blendedAnnualCost.toFixed(2)} tone="rose" isDark={isDark} />
                  <Metric label="Annual emissions" value={`${result.annualCarbonKg.toFixed(1)} kg CO₂e`} tone="emerald" isDark={isDark} />
                </div>

                <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="mb-4 flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blue-500">Annual tariff comparison</p><h2 className="mt-1 text-sm font-bold">Flat versus time-of-use estimate</h2></div><Leaf className="text-emerald-500" size={20} /></div>
                  <div className="space-y-4">
                    {[{ label: 'Flat tariff', value: result.annualCost, color: 'bg-blue-500' }, { label: 'Blended peak/off-peak', value: result.blendedAnnualCost, color: 'bg-emerald-500' }].map((bar) => (
                      <div key={bar.label}><div className="mb-1.5 flex justify-between text-[10px]"><span className={isDark ? 'text-slate-400' : 'text-slate-600'}>{bar.label}</span><strong className="font-mono">{bar.value.toFixed(2)}</strong></div><div className={`h-3 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}><div className={`h-full rounded-full ${bar.color}`} style={{ width: `${Math.max(2, bar.value / chartMax * 100)}%` }} /></div></div>
                    ))}
                  </div>
                </div>

                <ResultExportActions toolId="energycost" toolName={TOOL.name} summary={summary} inputs={inputs} outputs={{ dailyEnergy: `${result.dailyKwh.toFixed(3)} kWh`, monthlyEnergy: `${result.monthlyKwh.toFixed(3)} kWh`, annualEnergy: `${result.annualKwh.toFixed(3)} kWh`, monthlyFlatCost: result.monthlyCost.toFixed(2), monthlyBlendedCost: result.blendedMonthlyCost.toFixed(2), annualBlendedCost: result.blendedAnnualCost.toFixed(2), annualCarbon: `${result.annualCarbonKg.toFixed(2)} kg CO2e` }} standardsRef="User-provided tariff and emissions factors" onSaveToHistory={runtime.saveToHistory} isDark={isDark} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AssistantShell>
  );
}
