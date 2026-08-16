import { useEffect, useMemo, useState } from 'react';
import { BarChart3, ShieldAlert, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import { EngineeringNotice, Metric, NumberField, Panel, PanelHeading, PresetBar, PresetButton, ResultStatus, Segmented, SelectField } from '../../components/ToolUi';
import { calculateProtection, type LoadCategory, type ProtectionInputs, type RcdSensitivity } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['circuit-protection'];

export default function CircuitProtectionPage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [loadCurrent, setLoadCurrent] = useState(16);
  const [loadCategory, setLoadCategory] = useState<LoadCategory>('general');
  const [voltage, setVoltage] = useState(230);
  const [faultCurrentKa, setFaultCurrentKa] = useState(4.5);
  const [rcdSensitivity, setRcdSensitivity] = useState<RcdSensitivity>('30mA');
  const [cableLengthMeters, setCableLengthMeters] = useState(20);

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });
  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    if (typeof entry.inputs.loadCurrent === 'number') setLoadCurrent(entry.inputs.loadCurrent);
    if (typeof entry.inputs.faultCurrentKa === 'number') setFaultCurrentKa(entry.inputs.faultCurrentKa);
  }, []);

  const inputs: ProtectionInputs = { loadCurrent, loadCategory, voltage, faultCurrentKa, rcdSensitivity, cableLengthMeters };
  const result = useMemo(() => calculateProtection(inputs), [loadCurrent, loadCategory, voltage, faultCurrentKa, rcdSensitivity, cableLengthMeters]);
  const summary = result.valid
    ? `${result.suggestedRating} A type ${result.curve} ${result.deviceType}, ${result.rcdType} residual-current type and ${result.breakingCapacityKa} kA breaking capacity.`
    : result.diagnostics.join(' ');

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5">
        <div className="grid items-start gap-4 lg:grid-cols-[360px_1fr]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="Protection inputs" eyebrow="Circuit characteristics" isDark={isDark} />
            <div className="space-y-3 p-4">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => { setLoadCurrent(10); setLoadCategory('lighting'); setFaultCurrentKa(4.5); setRcdSensitivity('30mA'); }}>Lighting</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setLoadCurrent(28); setLoadCategory('motor'); setFaultCurrentKa(6); setRcdSensitivity('30mA'); }}>Motor feeder</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setLoadCurrent(40); setLoadCategory('ev_charger'); setFaultCurrentKa(6); setRcdSensitivity('30mA'); }}>EV charger</PresetButton>
              </PresetBar>
              <NumberField label="Design load current" unit="A" value={loadCurrent} min={0} onChange={setLoadCurrent} isDark={isDark} />
              <SelectField label="Load category" value={loadCategory} onChange={(event) => setLoadCategory(event.target.value as LoadCategory)} isDark={isDark}>
                <option value="general">General purpose</option><option value="lighting">Lighting</option><option value="motor">Motor</option><option value="transformer">Transformer</option><option value="heater">Resistive heating</option><option value="ev_charger">EV charger</option><option value="solar">Solar inverter</option>
              </SelectField>
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Nominal voltage" unit="V" value={voltage} min={1} onChange={setVoltage} isDark={isDark} />
                <NumberField label="Prospective fault current" unit="kA" value={faultCurrentKa} min={0} step={0.1} onChange={setFaultCurrentKa} isDark={isDark} />
                <NumberField label="Circuit length" unit="m" value={cableLengthMeters} min={0} onChange={setCableLengthMeters} isDark={isDark} />
              </div>
              <Segmented label="Residual-current sensitivity" value={rcdSensitivity} onChange={(value) => setRcdSensitivity(value as RcdSensitivity)} isDark={isDark} options={[{ value: '30mA', label: '30 mA' }, { value: '100mA', label: '100 mA' }, { value: '300mA', label: '300 mA' }]} />
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel isDark={isDark}>
              <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Protection recommendation" eyebrow="Preliminary coordination" isDark={isDark} />
              <div className="space-y-4 p-4 sm:p-5">
                <ResultStatus ok={result.valid} label={result.valid ? 'Standard device rating identified' : 'Manual design required'} message={result.valid ? 'The device rating is the first standard size at or above the design margin. Confirm cable coordination and disconnection time separately.' : result.diagnostics.join(' ')} isDark={isDark} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Metric label="Device and rating" value={result.valid ? `${result.suggestedRating} A ${result.deviceType}` : 'No solution'} detail={`${result.poles} pole${result.poles === 1 ? '' : 's'}`} tone="emerald" isDark={isDark} />
                  <Metric label="Trip curve" value={result.valid ? `Type ${result.curve}` : '—'} detail={result.curveReason} tone="blue" isDark={isDark} />
                  <Metric label="Breaking capacity" value={result.valid ? `${result.breakingCapacityKa} kA` : '—'} detail={`Entered fault level ${faultCurrentKa} kA`} tone="rose" isDark={isDark} />
                  <Metric label="Residual-current type" value={result.rcdType} detail={result.rcdTypeReason} tone="purple" isDark={isDark} />
                  <Metric label="Sensitivity" value={result.sensitivity} detail={result.sensitivityReason} tone="cyan" isDark={isDark} />
                  <Metric label="Design margin" value={`${result.designCurrentWithMargin.toFixed(2)} A`} detail="Load × category multiplier" tone="amber" isDark={isDark} />
                </div>
                <ResultExportActions toolId="mcb_rcbo" toolName={TOOL.name} summary={summary} inputs={{ ...inputs, standardContext: runtime.standard }} outputs={{ device: result.valid ? `${result.suggestedRating} A ${result.deviceType}` : 'No standard solution', poles: result.poles, tripCurve: result.curve, rcdType: result.rcdType, sensitivity: result.sensitivity, breakingCapacity: `${result.breakingCapacityKa} kA`, designCurrentWithMargin: `${result.designCurrentWithMargin.toFixed(2)} A` }} standardsRef={`${runtime.standard} context; manufacturer curves and local wiring rules must be verified`} onSaveToHistory={runtime.saveToHistory} isDark={isDark} />
              </div>
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel isDark={isDark}>
                <div className="p-5">
                  <ShieldCheck size={22} className="text-emerald-500" />
                  <h2 className="mt-3 text-sm font-bold">What this assistant checks</h2>
                  <ul className={`mt-2 space-y-1.5 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}><li>• Load-category design margin</li><li>• Nearest standard current rating</li><li>• Typical B, C or D magnetic trip characteristic</li><li>• Breaking capacity above the entered prospective fault level</li><li>• Common RCD/RCBO type by load electronics</li></ul>
                </div>
              </Panel>
              <Panel isDark={isDark}>
                <div className="p-5">
                  <ShieldAlert size={22} className="text-amber-500" />
                  <h2 className="mt-3 text-sm font-bold">Still verify before selection</h2>
                  <ul className={`mt-2 space-y-1.5 text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}><li>• Cable current-carrying capacity and thermal limit</li><li>• Earth-fault loop impedance and disconnection time</li><li>• Selectivity with upstream/downstream devices</li><li>• Manufacturer time-current and let-through data</li><li>• Local requirements for special locations</li></ul>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </div>
    </AssistantShell>
  );
}
