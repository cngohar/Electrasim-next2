import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Cable, SlidersHorizontal } from 'lucide-react';
import { Cable3DVisualizer } from '@/components/Cable3DVisualizer';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import {
  EngineeringNotice,
  Metric,
  NumberField,
  Panel,
  PanelHeading,
  PresetBar,
  PresetButton,
  ResultStatus,
  Segmented,
  SelectField,
} from '../../components/ToolUi';
import { calculateCableSize, getConductorSizeMm2, type CableInputs, type CableSystem } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['cable-size'];

export default function CableSizePage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [system, setSystem] = useState<CableSystem>('single');
  const [powerWatts, setPowerWatts] = useState(3000);
  const [voltage, setVoltage] = useState(230);
  const [powerFactor, setPowerFactor] = useState(0.9);
  const [lengthMeters, setLengthMeters] = useState(25);
  const [material, setMaterial] = useState<'copper' | 'aluminium'>('copper');
  const [installationMethod, setInstallationMethod] = useState('clipped-direct');
  const [ambientTemperature, setAmbientTemperature] = useState(30);
  const [groupingCircuits, setGroupingCircuits] = useState(1);
  const [maxVoltageDropPct, setMaxVoltageDropPct] = useState(3);
  const [cableType, setCableType] = useState('PVC multicore');
  const [cores, setCores] = useState(3);

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });

  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    const input = entry.inputs;
    if (typeof input.powerWatts === 'number') setPowerWatts(input.powerWatts);
    if (typeof input.voltage === 'number') setVoltage(input.voltage);
    if (typeof input.powerFactor === 'number') setPowerFactor(input.powerFactor);
    if (typeof input.lengthMeters === 'number') setLengthMeters(input.lengthMeters);
    if (input.system === 'single' || input.system === 'three') setSystem(input.system);
    if (input.material === 'copper' || input.material === 'aluminium') setMaterial(input.material);
  }, []);

  const inputs: CableInputs = {
    standard: runtime.standard,
    system,
    powerWatts,
    voltage,
    powerFactor,
    lengthMeters,
    material,
    installationMethod,
    ambientTemperature,
    groupingCircuits,
    maxVoltageDropPct,
  };
  const result = useMemo(() => calculateCableSize(inputs), [
    runtime.standard, system, powerWatts, voltage, powerFactor, lengthMeters, material,
    installationMethod, ambientTemperature, groupingCircuits, maxVoltageDropPct,
  ]);

  const selectedArea = getConductorSizeMm2(result.selectedSize);
  const summary = result.selectedSize
    ? `${result.selectedSize.label} ${material} conductor; ${result.designCurrent.toFixed(1)} A design current; ${result.voltageDropPct.toFixed(2)}% voltage drop.`
    : `No listed ${runtime.standard} conductor satisfies the entered design constraints.`;
  const exportInputs = { ...inputs, cableType, cores };
  const exportOutputs = {
    conductor: result.selectedSize?.label ?? 'No table solution',
    designCurrent: `${result.designCurrent.toFixed(2)} A`,
    requiredAmpacity: `${result.requiredAmpacity.toFixed(2)} A`,
    correctedAmpacity: result.selectedSize ? `${result.correctedAmpacity.toFixed(2)} A` : '—',
    voltageDrop: result.selectedSize ? `${result.voltageDrop.toFixed(2)} V (${result.voltageDropPct.toFixed(2)}%)` : '—',
    recommendedBreaker: result.recommendedBreaker ? `${result.recommendedBreaker} A` : 'Review required',
    powerLoss: result.selectedSize ? `${result.powerLossWatts.toFixed(1)} W` : '—',
  };

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5">
        <div className="grid items-start gap-4 xl:grid-cols-[330px_minmax(420px,1fr)_390px]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="Design inputs" eyebrow="Circuit specification" isDark={isDark} />
            <div className="space-y-3 p-4">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => { setSystem('single'); setPowerWatts(3000); setVoltage(230); setLengthMeters(25); setPowerFactor(0.9); }}>Home radial</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSystem('three'); setPowerWatts(15000); setVoltage(400); setLengthMeters(45); setPowerFactor(0.85); }}>3φ motor</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSystem('single'); setPowerWatts(7000); setVoltage(230); setLengthMeters(65); setPowerFactor(1); }}>Long EV run</PresetButton>
              </PresetBar>
              <Segmented label="Supply system" value={system} onChange={(value) => setSystem(value as CableSystem)} isDark={isDark} options={[{ value: 'single', label: 'Single phase' }, { value: 'three', label: 'Three phase' }]} />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Connected power" unit="W" value={powerWatts} min={0} onChange={setPowerWatts} isDark={isDark} />
                <NumberField label="Line voltage" unit="V" value={voltage} min={1} onChange={setVoltage} isDark={isDark} />
                <NumberField label="Power factor" unit="PF" value={powerFactor} min={0.01} max={1} step={0.01} onChange={setPowerFactor} isDark={isDark} />
                <NumberField label="One-way length" unit="m" value={lengthMeters} min={0} onChange={setLengthMeters} isDark={isDark} />
              </div>
              <Segmented label="Conductor material" value={material} onChange={(value) => setMaterial(value as 'copper' | 'aluminium')} isDark={isDark} options={[{ value: 'copper', label: 'Copper' }, { value: 'aluminium', label: 'Aluminium' }]} />
              <SelectField label="Installation method" value={installationMethod} onChange={(event) => setInstallationMethod(event.target.value)} isDark={isDark}>
                <option value="clipped-direct">Clipped direct / free air</option>
                <option value="conduit-wall">Conduit in insulated wall</option>
                <option value="conduit-surface">Surface conduit or trunking</option>
                <option value="underground">Buried / underground</option>
                <option value="cable-tray">Cable tray</option>
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Ambient temperature" unit="°C" value={ambientTemperature} onChange={setAmbientTemperature} isDark={isDark} />
                <NumberField label="Grouped circuits" value={groupingCircuits} min={1} step={1} onChange={setGroupingCircuits} isDark={isDark} />
                <NumberField label="Maximum voltage drop" unit="%" value={maxVoltageDropPct} min={0.1} step={0.1} onChange={setMaxVoltageDropPct} isDark={isDark} />
                <NumberField label="Cable cores" value={cores} min={1} step={1} onChange={setCores} isDark={isDark} />
              </div>
              <SelectField label="Cable construction" value={cableType} onChange={(event) => setCableType(event.target.value)} isDark={isDark}>
                <option>PVC multicore</option><option>XLPE multicore</option><option>SWA XLPE cable</option><option>Single-core conduit</option>
              </SelectField>
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <div className="min-h-[420px] xl:sticky xl:top-[102px] xl:h-[calc(100vh-122px)]">
            <Cable3DVisualizer
              system={system}
              mm2={selectedArea || 2.5}
              diameterMm={Math.sqrt((selectedArea || 2.5) * 4 / Math.PI) + 4}
              material={material}
              cableType={cableType}
              installMethod={installationMethod}
              designCurrent={result.designCurrent}
              requiredCapacity={result.requiredAmpacity}
              powerLossWatts={result.powerLossWatts}
              voltageDropPct={result.voltageDropPct}
              isPass={result.isPass}
              standard={runtime.standard}
            />
          </div>

          <Panel isDark={isDark}>
            <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Engineering result" eyebrow="Live calculation" isDark={isDark} />
            <div className="space-y-3 p-4">
              <ResultStatus ok={result.isPass} label={result.isPass ? 'Listed solution found' : 'Design review required'} message={result.isPass ? `The selected conductor satisfies corrected ampacity and the ${maxVoltageDropPct}% voltage-drop target.` : result.diagnostics.join(' ')} isDark={isDark} />
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Selected conductor" value={result.selectedSize?.label ?? 'No solution'} detail={`${runtime.standard} dataset · ${material}`} tone="emerald" isDark={isDark} />
                <Metric label="Design current" value={`${result.designCurrent.toFixed(2)} A`} detail={system === 'three' ? 'P / (√3 × V × PF)' : 'P / (V × PF)'} tone="blue" isDark={isDark} />
                <Metric label="Required ampacity" value={`${result.requiredAmpacity.toFixed(2)} A`} detail={`Combined derating ${result.combinedFactor.toFixed(3)}`} tone="amber" isDark={isDark} />
                <Metric label="Corrected ampacity" value={result.selectedSize ? `${result.correctedAmpacity.toFixed(2)} A` : '—'} detail="Tabulated × correction factors" tone="cyan" isDark={isDark} />
                <Metric label="Voltage drop" value={result.selectedSize ? `${result.voltageDrop.toFixed(2)} V` : '—'} detail={result.selectedSize ? `${result.voltageDropPct.toFixed(2)}% of supply` : undefined} tone={result.voltageDropPct <= maxVoltageDropPct ? 'emerald' : 'rose'} isDark={isDark} />
                <Metric label="Recommended breaker" value={result.recommendedBreaker ? `${result.recommendedBreaker} A` : 'Review'} detail="Standard rating constrained by conductor" tone="purple" isDark={isDark} />
                <Metric label="Circuit heat loss" value={result.selectedSize ? `${result.powerLossWatts.toFixed(1)} W` : '—'} detail={result.selectedSize ? `${result.energyLossKwhYear.toFixed(1)} kWh/year at 8 h/day` : undefined} tone="amber" isDark={isDark} />
                <Metric label="End voltage" value={result.selectedSize ? `${result.endVoltage.toFixed(1)} V` : '—'} detail="Nominal minus calculated drop" tone="blue" isDark={isDark} />
              </div>
              {result.diagnostics.length > 0 && (
                <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">Design notes</p>
                  <ul className={`space-y-1 text-[10px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{result.diagnostics.map((item) => <li key={item}>• {item}</li>)}</ul>
                </div>
              )}
              <ResultExportActions toolId="cablesize" toolName={TOOL.name} summary={summary} inputs={exportInputs} outputs={exportOutputs} standardsRef={result.standardsReference} onSaveToHistory={runtime.saveToHistory} isDark={isDark} />
            </div>
          </Panel>
        </div>
      </div>
    </AssistantShell>
  );
}
