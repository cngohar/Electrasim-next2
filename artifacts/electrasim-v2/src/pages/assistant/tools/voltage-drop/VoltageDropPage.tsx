import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Route, SlidersHorizontal } from 'lucide-react';
import { Wire3DVisualizer } from '@/components/Wire3DVisualizer';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import { EngineeringNotice, Metric, NumberField, Panel, PanelHeading, PresetBar, PresetButton, ResultStatus, Segmented } from '../../components/ToolUi';
import { calculateWireGauge, getConductorSizeMm2, type CableSystem, type WireInputs } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['voltage-drop'];

export default function VoltageDropPage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [system, setSystem] = useState<CableSystem>('single');
  const [voltage, setVoltage] = useState(120);
  const [current, setCurrent] = useState(15);
  const [distanceMeters, setDistanceMeters] = useState(25);
  const [material, setMaterial] = useState<'copper' | 'aluminium'>('copper');
  const [maxVoltageDropPct, setMaxVoltageDropPct] = useState(3);

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });

  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    const input = entry.inputs;
    if (typeof input.voltage === 'number') setVoltage(input.voltage);
    if (typeof input.current === 'number') setCurrent(input.current);
    if (typeof input.distanceMeters === 'number') setDistanceMeters(input.distanceMeters);
    if (input.system === 'single' || input.system === 'three') setSystem(input.system);
    if (input.material === 'copper' || input.material === 'aluminium') setMaterial(input.material);
  }, []);

  const inputs: WireInputs = { standard: runtime.standard, system, voltage, current, distanceMeters, material, maxVoltageDropPct };
  const result = useMemo(() => calculateWireGauge(inputs), [runtime.standard, system, voltage, current, distanceMeters, material, maxVoltageDropPct]);
  const area = getConductorSizeMm2(result.selectedSize) || 2.5;
  const summary = result.selectedSize
    ? `${result.selectedSize.label} ${material} conductor gives ${result.voltageDrop.toFixed(2)} V (${result.voltageDropPct.toFixed(2)}%) drop over ${distanceMeters} m.`
    : `No listed ${runtime.standard} conductor satisfies ${current} A over ${distanceMeters} m.`;

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5">
        <div className="grid items-start gap-4 xl:grid-cols-[320px_minmax(420px,1fr)_390px]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="Route inputs" eyebrow="Voltage-drop design" isDark={isDark} />
            <div className="space-y-3 p-4">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => { setSystem('single'); setVoltage(120); setCurrent(15); setDistanceMeters(25); }}>120 V branch</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSystem('single'); setVoltage(230); setCurrent(32); setDistanceMeters(40); }}>Cooker circuit</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSystem('three'); setVoltage(400); setCurrent(45); setDistanceMeters(80); }}>3φ feeder</PresetButton>
              </PresetBar>
              <Segmented label="Circuit system" value={system} onChange={(value) => setSystem(value as CableSystem)} isDark={isDark} options={[{ value: 'single', label: 'Single phase' }, { value: 'three', label: 'Three phase' }]} />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Supply voltage" unit="V" value={voltage} min={1} onChange={setVoltage} isDark={isDark} />
                <NumberField label="Current load" unit="A" value={current} min={0} onChange={setCurrent} isDark={isDark} />
                <NumberField label="One-way distance" unit="m" value={distanceMeters} min={0} onChange={setDistanceMeters} isDark={isDark} />
                <NumberField label="Maximum drop" unit="%" value={maxVoltageDropPct} min={0.1} step={0.1} onChange={setMaxVoltageDropPct} isDark={isDark} />
              </div>
              <Segmented label="Conductor material" value={material} onChange={(value) => setMaterial(value as 'copper' | 'aluminium')} isDark={isDark} options={[{ value: 'copper', label: 'Copper' }, { value: 'aluminium', label: 'Aluminium' }]} />
              <div className={`rounded-xl border p-3 text-[10px] leading-relaxed ${isDark ? 'border-blue-500/25 bg-blue-500/5 text-slate-400' : 'border-blue-200 bg-blue-50 text-slate-600'}`}>
                <Route size={14} className="mb-1.5 text-blue-500" />The route length is one-way. The engine applies the correct return-path factor for single-phase circuits and √3 for balanced three-phase circuits.
              </div>
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <div className="min-h-[420px] xl:sticky xl:top-[102px] xl:h-[calc(100vh-122px)]">
            <Wire3DVisualizer awg={result.selectedSize?.label ?? 'No solution'} mm2={area} current={result.designCurrent} voltage={voltage} distance={distanceMeters} material={material} vDrop={result.voltageDrop} vDropPct={result.voltageDropPct} powerLossWatts={result.powerLossWatts} isPass={result.isPass} />
          </div>

          <Panel isDark={isDark}>
            <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Route result" eyebrow="Gauge and losses" isDark={isDark} />
            <div className="space-y-3 p-4">
              <ResultStatus ok={result.isPass} label={result.isPass ? 'Voltage-drop target met' : 'No listed solution'} message={result.isPass ? `Selected from the ${runtime.standard} ${material} conductor table while checking both ampacity and voltage drop.` : result.diagnostics.join(' ')} isDark={isDark} />
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Recommended conductor" value={result.selectedSize?.label ?? 'No solution'} detail={result.selectedSize ? `${area.toFixed(2)} mm² equivalent area` : undefined} tone="emerald" isDark={isDark} />
                <Metric label="Voltage drop" value={result.selectedSize ? `${result.voltageDrop.toFixed(2)} V` : '—'} detail={result.selectedSize ? `${result.voltageDropPct.toFixed(2)}% of supply` : undefined} tone={result.isPass ? 'emerald' : 'rose'} isDark={isDark} />
                <Metric label="End voltage" value={result.selectedSize ? `${result.endVoltage.toFixed(2)} V` : '—'} detail="At the load terminals" tone="blue" isDark={isDark} />
                <Metric label="Loop resistance" value={result.selectedSize ? `${result.resistanceOhms.toFixed(4)} Ω` : '—'} detail="Operating-temperature estimate" tone="purple" isDark={isDark} />
                <Metric label="Power loss" value={result.selectedSize ? `${result.powerLossWatts.toFixed(1)} W` : '—'} detail={result.selectedSize ? `${result.energyLossKwhYear.toFixed(1)} kWh/year at 8 h/day` : undefined} tone="amber" isDark={isDark} />
                <Metric label="Utilization" value={result.selectedSize ? `${result.ampacityUtilizationPct.toFixed(1)}%` : '—'} detail="Load ÷ table ampacity" tone="cyan" isDark={isDark} />
              </div>
              {result.diagnostics.length > 0 && <div className={`rounded-xl border p-3 text-[10px] leading-relaxed ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{result.diagnostics.map((item) => <p key={item}>• {item}</p>)}</div>}
              <ResultExportActions
                toolId="wire"
                toolName={TOOL.name}
                summary={summary}
                inputs={inputs}
                outputs={{ conductor: result.selectedSize?.label ?? 'No table solution', voltageDrop: result.selectedSize ? `${result.voltageDrop.toFixed(2)} V (${result.voltageDropPct.toFixed(2)}%)` : '—', endVoltage: result.selectedSize ? `${result.endVoltage.toFixed(2)} V` : '—', resistance: result.selectedSize ? `${result.resistanceOhms.toFixed(4)} Ω` : '—', powerLoss: result.selectedSize ? `${result.powerLossWatts.toFixed(1)} W` : '—' }}
                standardsRef={result.standardsReference}
                onSaveToHistory={runtime.saveToHistory}
                isDark={isDark}
              />
            </div>
          </Panel>
        </div>
      </div>
    </AssistantShell>
  );
}
