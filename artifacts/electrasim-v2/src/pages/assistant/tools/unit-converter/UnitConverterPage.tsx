import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, BarChart3, SlidersHorizontal } from 'lucide-react';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import { EngineeringNotice, Metric, NumberField, Panel, PanelHeading, PresetBar, PresetButton, ResultStatus, SelectField } from '../../components/ToolUi';
import { calculateConversion, type ConversionInputs, type PowerUnit } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['unit-converter'];
const UNIT_LABELS: Record<PowerUnit, string> = { W: 'Watts (W)', kW: 'Kilowatts (kW)', hp: 'Mechanical horsepower (hp)', kVA: 'Kilovolt-amperes (kVA)', BTUhr: 'BTU per hour (BTU/h)' };

export default function UnitConverterPage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [value, setValue] = useState(1);
  const [sourceUnit, setSourceUnit] = useState<PowerUnit>('kW');
  const [powerFactor, setPowerFactor] = useState(0.9);
  const [voltage, setVoltage] = useState(230);
  const [phases, setPhases] = useState<1 | 3>(1);

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });
  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    if (typeof entry.inputs.value === 'number') setValue(entry.inputs.value);
    if (Object.keys(UNIT_LABELS).includes(String(entry.inputs.sourceUnit))) setSourceUnit(entry.inputs.sourceUnit as PowerUnit);
  }, []);

  const inputs: ConversionInputs = { value, sourceUnit, powerFactor, voltage, phases };
  const result = useMemo(() => calculateConversion(inputs), [value, sourceUnit, powerFactor, voltage, phases]);
  const summary = result.valid ? `${value} ${sourceUnit} equals ${result.kilowatts.toFixed(4)} kW, ${result.horsepower.toFixed(4)} hp and ${result.kva.toFixed(4)} kVA at PF ${powerFactor.toFixed(2)}.` : result.error ?? 'Invalid conversion inputs.';

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-5xl px-3 py-5 sm:px-5">
        <div className="grid items-start gap-4 lg:grid-cols-[350px_1fr]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="Conversion source" eyebrow="Power unit basis" isDark={isDark} />
            <div className="space-y-3 p-4">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => { setValue(1); setSourceUnit('kW'); setPowerFactor(0.9); setVoltage(230); setPhases(1); }}>1 kW</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setValue(10); setSourceUnit('hp'); setPowerFactor(0.85); setVoltage(400); setPhases(3); }}>10 hp motor</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setValue(36); setSourceUnit('kVA'); setPowerFactor(0.8); setVoltage(415); setPhases(3); }}>36 kVA load</PresetButton>
              </PresetBar>
              <NumberField label="Source value" value={value} min={0} onChange={setValue} isDark={isDark} />
              <SelectField label="Source unit" value={sourceUnit} onChange={(event) => setSourceUnit(event.target.value as PowerUnit)} isDark={isDark}>
                {(Object.keys(UNIT_LABELS) as PowerUnit[]).map((unit) => <option key={unit} value={unit}>{UNIT_LABELS[unit]}</option>)}
              </SelectField>
              <div className={`flex items-center justify-center py-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}><ArrowDownUp size={20} /></div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Power factor" unit="PF" value={powerFactor} min={0.01} max={1} step={0.01} onChange={setPowerFactor} isDark={isDark} />
                <NumberField label="System voltage" unit="V" value={voltage} min={0} onChange={setVoltage} isDark={isDark} />
              </div>
              <SelectField label="Current estimate system" value={phases} onChange={(event) => setPhases(Number(event.target.value) as 1 | 3)} isDark={isDark}>
                <option value={1}>Single phase</option><option value={3}>Three phase</option>
              </SelectField>
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <Panel isDark={isDark}>
            <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Converted values" eyebrow="Common electrical units" isDark={isDark} />
            <div className="space-y-4 p-4 sm:p-5">
              <ResultStatus ok={result.valid} label={result.valid ? 'Conversion ready' : 'Input correction required'} message={result.valid ? `All power units share a ${result.watts.toFixed(2)} W real-power basis. kVA and current depend on entered power factor.` : result.error ?? 'Review entered values.'} isDark={isDark} />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric label="Watts" value={`${result.watts.toFixed(3)} W`} tone="blue" isDark={isDark} />
                <Metric label="Kilowatts" value={`${result.kilowatts.toFixed(6)} kW`} tone="emerald" isDark={isDark} />
                <Metric label="Horsepower" value={`${result.horsepower.toFixed(6)} hp`} detail="1 hp = 745.699872 W" tone="amber" isDark={isDark} />
                <Metric label="Apparent power" value={`${result.kva.toFixed(6)} kVA`} detail={`At PF ${powerFactor.toFixed(3)}`} tone="purple" isDark={isDark} />
                <Metric label="Thermal rate" value={`${result.btuPerHour.toFixed(2)} BTU/h`} detail="1 W = 3.412141633 BTU/h" tone="rose" isDark={isDark} />
                <Metric label="Estimated current" value={`${result.currentAmps.toFixed(4)} A`} detail={`${phases === 3 ? 'Three' : 'Single'} phase at ${voltage} V`} tone="cyan" isDark={isDark} />
                <Metric label="Reactive power" value={`${result.reactiveKvar.toFixed(6)} kvar`} detail="From apparent and real power" tone="purple" isDark={isDark} />
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                <h2 className="text-xs font-bold">Conversion assumptions</h2>
                <p className={`mt-2 text-[10px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Horsepower uses mechanical horsepower. kVA assumes the entered value represents real input power when the source is W, kW, hp or BTU/h. When kVA is the source, real power is kVA × PF. Current is based on active power and PF using the selected phase relationship.</p>
              </div>
              <ResultExportActions toolId="converter" toolName={TOOL.name} summary={summary} inputs={inputs} outputs={{ watts: result.watts, kilowatts: result.kilowatts, horsepower: result.horsepower, kva: result.kva, btuPerHour: result.btuPerHour, currentAmps: result.currentAmps, reactiveKvar: result.reactiveKvar }} standardsRef="SI and mechanical horsepower conversion constants" onSaveToHistory={runtime.saveToHistory} isDark={isDark} />
            </div>
          </Panel>
        </div>
      </div>
    </AssistantShell>
  );
}
