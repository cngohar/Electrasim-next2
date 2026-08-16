import { useEffect, useMemo, useState } from 'react';
import { BarChart3, CircuitBoard, SlidersHorizontal } from 'lucide-react';
import { Ohms3DVisualizer } from '@/components/Ohms3DVisualizer';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import { EngineeringNotice, Metric, NumberField, Panel, PanelHeading, PresetBar, PresetButton, ResultStatus, SelectField } from '../../components/ToolUi';
import { calculateOhmsLaw, type OhmInputs, type OhmSolveMode } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['ohms-law'];
const MODE_LABELS: Record<OhmSolveMode, string> = {
  VI: 'Voltage + current', VR: 'Voltage + resistance', IR: 'Current + resistance',
  PV: 'Real power + voltage', PR: 'Real power + resistance', PI: 'Real power + current',
};

export default function OhmsLawPage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [solveMode, setSolveMode] = useState<OhmSolveMode>('VI');
  const [voltage, setVoltage] = useState(230);
  const [current, setCurrent] = useState(10);
  const [resistance, setResistance] = useState(23);
  const [power, setPower] = useState(2070);
  const [powerFactor, setPowerFactor] = useState(0.9);
  const [efficiency, setEfficiency] = useState(100);
  const [frequency, setFrequency] = useState(50);

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });

  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    const input = entry.inputs;
    if (['VI', 'VR', 'IR', 'PV', 'PR', 'PI'].includes(String(input.solveMode))) setSolveMode(input.solveMode as OhmSolveMode);
    if (typeof input.voltage === 'number') setVoltage(input.voltage);
    if (typeof input.current === 'number') setCurrent(input.current);
    if (typeof input.resistance === 'number') setResistance(input.resistance);
    if (typeof input.power === 'number') setPower(input.power);
    if (typeof input.powerFactor === 'number') setPowerFactor(input.powerFactor);
  }, []);

  const inputs: OhmInputs = { solveMode, voltage, current, resistance, power, powerFactor, efficiency, frequency };
  const result = useMemo(() => calculateOhmsLaw(inputs), [solveMode, voltage, current, resistance, power, powerFactor, efficiency, frequency]);
  const summary = result.valid
    ? `${result.voltage.toFixed(2)} V, ${result.current.toFixed(3)} A and ${result.resistance.toFixed(2)} Ω equivalent series resistance at PF ${result.powerFactor.toFixed(2)}.`
    : result.error ?? 'Invalid circuit inputs.';

  const firstFields = (() => {
    switch (solveMode) {
      case 'VI': return <><NumberField label="Supply voltage" unit="V" value={voltage} min={0} onChange={setVoltage} isDark={isDark} /><NumberField label="Current" unit="A" value={current} min={0} onChange={setCurrent} isDark={isDark} /></>;
      case 'VR': return <><NumberField label="Supply voltage" unit="V" value={voltage} min={0} onChange={setVoltage} isDark={isDark} /><NumberField label="Resistance" unit="Ω" value={resistance} min={0} onChange={setResistance} isDark={isDark} /></>;
      case 'IR': return <><NumberField label="Current" unit="A" value={current} min={0} onChange={setCurrent} isDark={isDark} /><NumberField label="Resistance" unit="Ω" value={resistance} min={0} onChange={setResistance} isDark={isDark} /></>;
      case 'PV': return <><NumberField label="Real output power" unit="W" value={power} min={0} onChange={setPower} isDark={isDark} /><NumberField label="Supply voltage" unit="V" value={voltage} min={0} onChange={setVoltage} isDark={isDark} /></>;
      case 'PR': return <><NumberField label="Real output power" unit="W" value={power} min={0} onChange={setPower} isDark={isDark} /><NumberField label="Resistance" unit="Ω" value={resistance} min={0} onChange={setResistance} isDark={isDark} /></>;
      case 'PI': return <><NumberField label="Real output power" unit="W" value={power} min={0} onChange={setPower} isDark={isDark} /><NumberField label="Current" unit="A" value={current} min={0} onChange={setCurrent} isDark={isDark} /></>;
    }
  })();

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5">
        <div className="grid items-start gap-4 xl:grid-cols-[320px_minmax(420px,1fr)_400px]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="Known quantities" eyebrow="Equivalent AC circuit" isDark={isDark} />
            <div className="space-y-3 p-4">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => { setSolveMode('VI'); setVoltage(50); setCurrent(10); setPowerFactor(1); setEfficiency(100); }}>50 V / 10 A check</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSolveMode('VR'); setVoltage(230); setResistance(46); setPowerFactor(0.82); setEfficiency(92); }}>AC motor equivalent</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSolveMode('PV'); setPower(1000); setVoltage(230); setPowerFactor(0.95); setEfficiency(88); }}>1 kW load</PresetButton>
              </PresetBar>
              <SelectField label="Solve from" value={solveMode} onChange={(event) => setSolveMode(event.target.value as OhmSolveMode)} isDark={isDark}>
                {(Object.keys(MODE_LABELS) as OhmSolveMode[]).map((mode) => <option key={mode} value={mode}>{MODE_LABELS[mode]}</option>)}
              </SelectField>
              <div className="grid grid-cols-2 gap-3">{firstFields}</div>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Power factor" unit="PF" value={powerFactor} min={0.01} max={1} step={0.01} onChange={setPowerFactor} isDark={isDark} />
                <NumberField label="Efficiency" unit="%" value={efficiency} min={0.1} max={100} step={0.1} onChange={setEfficiency} isDark={isDark} />
                <NumberField label="Frequency" unit="Hz" value={frequency} min={0} step={1} onChange={setFrequency} isDark={isDark} />
              </div>
              <div className={`rounded-xl border p-3 text-[10px] leading-relaxed ${isDark ? 'border-blue-500/25 bg-blue-500/5 text-slate-400' : 'border-blue-200 bg-blue-50 text-slate-600'}`}>
                <CircuitBoard size={14} className="mb-1.5 text-blue-500" />R is the equivalent series resistance that dissipates real power. Z is impedance magnitude, while X is the derived reactive component.
              </div>
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <div className="min-h-[420px] xl:sticky xl:top-[102px] xl:h-[calc(100vh-122px)]">
            <Ohms3DVisualizer voltage={result.voltage} current={result.current} resistance={result.resistance} power={result.realPower} solveMode={MODE_LABELS[solveMode]} />
          </div>

          <Panel isDark={isDark}>
            <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Solved circuit" eyebrow="AC quantities" isDark={isDark} />
            <div className="space-y-3 p-4">
              <ResultStatus ok={result.valid} label={result.valid ? 'Consistent solution' : 'Input correction required'} message={result.valid ? `Solved as a single-phase equivalent series circuit at ${frequency} Hz.` : result.error ?? 'Enter positive known quantities.'} isDark={isDark} />
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Voltage" value={`${result.voltage.toFixed(2)} V`} tone="blue" isDark={isDark} />
                <Metric label="Current" value={`${result.current.toFixed(3)} A`} tone="cyan" isDark={isDark} />
                <Metric label="Resistance R" value={`${result.resistance.toFixed(2)} Ω`} detail="Equivalent series resistance" tone="amber" isDark={isDark} />
                <Metric label="Impedance |Z|" value={`${result.impedance.toFixed(2)} Ω`} detail="V ÷ I" tone="purple" isDark={isDark} />
                <Metric label="Reactance |X|" value={`${result.reactance.toFixed(2)} Ω`} detail="√(Z² − R²)" tone="rose" isDark={isDark} />
                <Metric label="Real input power" value={`${result.realPower.toFixed(2)} W`} detail={`Output ${result.outputPower.toFixed(2)} W`} tone="emerald" isDark={isDark} />
                <Metric label="Apparent power" value={`${result.apparentPower.toFixed(2)} VA`} detail="V × I" tone="blue" isDark={isDark} />
                <Metric label="Reactive power" value={`${result.reactivePower.toFixed(2)} var`} detail={`${result.phaseAngleDeg.toFixed(2)}° phase angle`} tone="cyan" isDark={isDark} />
              </div>
              <ResultExportActions toolId="ohms" toolName={TOOL.name} summary={summary} inputs={inputs} outputs={{ voltage: `${result.voltage.toFixed(3)} V`, current: `${result.current.toFixed(4)} A`, resistance: `${result.resistance.toFixed(3)} Ω`, impedance: `${result.impedance.toFixed(3)} Ω`, reactance: `${result.reactance.toFixed(3)} Ω`, realPower: `${result.realPower.toFixed(3)} W`, apparentPower: `${result.apparentPower.toFixed(3)} VA`, reactivePower: `${result.reactivePower.toFixed(3)} var`, powerFactor: result.powerFactor.toFixed(3), phaseAngle: `${result.phaseAngleDeg.toFixed(3)}°` }} standardsRef="IEC AC circuit relationships" onSaveToHistory={runtime.saveToHistory} isDark={isDark} />
            </div>
          </Panel>
        </div>
      </div>
    </AssistantShell>
  );
}
