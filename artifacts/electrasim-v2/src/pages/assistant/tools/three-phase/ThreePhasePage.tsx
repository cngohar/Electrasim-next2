import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Box, Orbit, SlidersHorizontal } from 'lucide-react';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import { EngineeringNotice, Metric, NumberField, Panel, PanelHeading, PresetBar, PresetButton, ResultStatus, Segmented } from '../../components/ToolUi';
import { calculateThreePhasePower, type ThreePhaseInputs, type ThreePhaseSystem } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['three-phase'];
const ThreePhase3DVisualizer = lazy(() => import('@/components/ThreePhase3DVisualizer'));

function PhasorDiagram({ voltage, current, powerFactor, imbalance }: { voltage: number; current: number; powerFactor: number; imbalance: number }) {
  const angle = Math.acos(Math.min(1, Math.max(0, powerFactor))) * 180 / Math.PI;
  return (
    <div className="relative h-[340px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(59,130,246,.2), transparent 58%), linear-gradient(rgba(51,65,85,.2) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,.2) 1px, transparent 1px)', backgroundSize: 'auto, 32px 32px, 32px 32px' }} />
      <svg viewBox="0 0 500 330" role="img" aria-label="Three-phase phasor diagram" className="relative h-full w-full">
        <circle cx="250" cy="165" r="112" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="5 6" />
        <circle cx="250" cy="165" r="4" fill="#e2e8f0" />
        {[{ a: -90, c: '#ef4444', l: 'L1' }, { a: 30, c: '#facc15', l: 'L2' }, { a: 150, c: '#3b82f6', l: 'L3' }].map(({ a, c, l }) => {
          const rad = a * Math.PI / 180;
          const x = 250 + Math.cos(rad) * 112;
          const y = 165 + Math.sin(rad) * 112;
          return <g key={l}><line x1="250" y1="165" x2={x} y2={y} stroke={c} strokeWidth="4" strokeLinecap="round" /><circle cx={x} cy={y} r="6" fill={c} /><text x={250 + Math.cos(rad) * 137} y={170 + Math.sin(rad) * 137} fill={c} fontSize="14" fontWeight="700" textAnchor="middle">{l}</text></g>;
        })}
        <text x="250" y="307" fill="#94a3b8" fontSize="12" textAnchor="middle">120° separation · current lag {angle.toFixed(1)}°</text>
      </svg>
      <div className="absolute left-3 top-3 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 font-mono text-[10px] text-slate-300">{voltage.toFixed(0)} V line · {current.toFixed(1)} A</div>
      <div className="absolute bottom-3 right-3 rounded-xl border border-slate-700 bg-slate-900/90 px-3 py-2 font-mono text-[10px] text-cyan-300">Estimated imbalance {imbalance.toFixed(1)}%</div>
    </div>
  );
}

export default function ThreePhasePage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [system, setSystem] = useState<ThreePhaseSystem>('star');
  const [lineVoltage, setLineVoltage] = useState(400);
  const [lineCurrent, setLineCurrent] = useState(30);
  const [powerFactor, setPowerFactor] = useState(0.85);
  const [efficiency, setEfficiency] = useState(92);
  const [imbalancePct, setImbalancePct] = useState(3);
  const [targetPowerFactor, setTargetPowerFactor] = useState(0.95);
  const [visualMode, setVisualMode] = useState<'phasor' | 'field3d'>('phasor');

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });
  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    if (typeof entry.inputs.lineVoltage === 'number') setLineVoltage(entry.inputs.lineVoltage);
    if (typeof entry.inputs.lineCurrent === 'number') setLineCurrent(entry.inputs.lineCurrent);
    if (entry.inputs.system === 'star' || entry.inputs.system === 'delta') setSystem(entry.inputs.system);
  }, []);

  const inputs: ThreePhaseInputs = { system, lineVoltage, lineCurrent, powerFactor, efficiency, imbalancePct, targetPowerFactor };
  const result = useMemo(() => calculateThreePhasePower(inputs), [system, lineVoltage, lineCurrent, powerFactor, efficiency, imbalancePct, targetPowerFactor]);
  const summary = result.valid ? `${result.realPowerKw.toFixed(2)} kW input power at ${lineVoltage} V, ${lineCurrent} A and PF ${powerFactor.toFixed(2)} in ${system}.` : result.error ?? 'Invalid inputs.';

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-[1400px] px-3 py-5 sm:px-5">
        <div className="grid items-start gap-4 lg:grid-cols-[340px_1fr]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="System inputs" eyebrow="Balanced three-phase model" isDark={isDark} />
            <div className="space-y-3 p-4">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => { setSystem('star'); setLineVoltage(400); setLineCurrent(30); setPowerFactor(0.85); setEfficiency(92); }}>400 V motor</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSystem('delta'); setLineVoltage(480); setLineCurrent(75); setPowerFactor(0.8); setEfficiency(95); }}>480 V delta</PresetButton>
                <PresetButton isDark={isDark} onClick={() => { setSystem('star'); setLineVoltage(415); setLineCurrent(120); setPowerFactor(0.72); setTargetPowerFactor(0.96); }}>PF correction</PresetButton>
              </PresetBar>
              <Segmented label="Connection" value={system} onChange={(value) => setSystem(value as ThreePhaseSystem)} isDark={isDark} options={[{ value: 'star', label: 'Star / wye' }, { value: 'delta', label: 'Delta' }]} />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Line voltage" unit="V" value={lineVoltage} min={0} onChange={setLineVoltage} isDark={isDark} />
                <NumberField label="Line current" unit="A" value={lineCurrent} min={0} onChange={setLineCurrent} isDark={isDark} />
                <NumberField label="Power factor" unit="PF" value={powerFactor} min={0.01} max={1} step={0.01} onChange={setPowerFactor} isDark={isDark} />
                <NumberField label="Efficiency" unit="%" value={efficiency} min={0.1} max={100} step={0.1} onChange={setEfficiency} isDark={isDark} />
                <NumberField label="Current imbalance" unit="%" value={imbalancePct} min={0} max={100} step={0.1} onChange={setImbalancePct} isDark={isDark} />
                <NumberField label="Target power factor" unit="PF" value={targetPowerFactor} min={0.01} max={1} step={0.01} onChange={setTargetPowerFactor} isDark={isDark} />
              </div>
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <div className="space-y-4">
            <div>
              <div className={`mb-2 inline-flex rounded-xl border p-1 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`} aria-label="Three-phase visualization mode">
                <button type="button" onClick={() => setVisualMode('phasor')} aria-pressed={visualMode === 'phasor'} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold transition ${visualMode === 'phasor' ? 'bg-blue-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Activity size={13} />Phasor diagram</button>
                <button type="button" onClick={() => setVisualMode('field3d')} aria-pressed={visualMode === 'field3d'} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold transition ${visualMode === 'field3d' ? 'bg-blue-600 text-white' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Orbit size={13} />Rotating field 3D</button>
              </div>
              {visualMode === 'phasor' ? (
                <PhasorDiagram voltage={lineVoltage} current={lineCurrent} powerFactor={powerFactor} imbalance={imbalancePct} />
              ) : (
                <Suspense fallback={<div className="grid h-[390px] place-items-center rounded-2xl border border-slate-800 bg-slate-950 text-center text-white"><div><Box className="mx-auto mb-2 animate-pulse text-blue-400" size={24} /><p className="text-sm font-bold">Loading rotating-field model…</p><p className="mt-1 text-xs text-slate-400">The calculation remains interactive.</p></div></div>}>
                  <ThreePhase3DVisualizer system={system} lineVoltage={lineVoltage} lineCurrent={lineCurrent} powerFactor={powerFactor} realPowerKw={result.realPowerKw} phaseAngleDeg={result.phaseAngleDeg} imbalancePct={imbalancePct} neutralCurrent={result.neutralCurrent} />
                </Suspense>
              )}
            </div>
            <Panel isDark={isDark}>
              <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Three-phase result" eyebrow="Power and phase values" isDark={isDark} />
              <div className="space-y-4 p-4 sm:p-5">
                <ResultStatus ok={result.valid} label={result.valid ? 'Three-phase solution ready' : 'Input correction required'} message={result.valid ? `${system === 'star' ? 'Star: Vphase = Vline / √3 and Iphase = Iline.' : 'Delta: Vphase = Vline and Iphase = Iline / √3.'}` : result.error ?? 'Check entered values.'} isDark={isDark} />
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Input real power" value={`${result.realPowerKw.toFixed(2)} kW`} tone="emerald" isDark={isDark} />
                  <Metric label="Output power" value={`${result.outputPowerKw.toFixed(2)} kW`} detail={`${efficiency.toFixed(1)}% efficiency`} tone="blue" isDark={isDark} />
                  <Metric label="Apparent power" value={`${result.apparentPowerKva.toFixed(2)} kVA`} tone="cyan" isDark={isDark} />
                  <Metric label="Reactive power" value={`${result.reactivePowerKvar.toFixed(2)} kvar`} tone="purple" isDark={isDark} />
                  <Metric label="Phase voltage" value={`${result.phaseVoltage.toFixed(2)} V`} detail={system === 'star' ? 'Vline ÷ √3' : 'Equals line voltage'} tone="amber" isDark={isDark} />
                  <Metric label="Phase current" value={`${result.phaseCurrent.toFixed(2)} A`} detail={system === 'delta' ? 'Iline ÷ √3' : 'Equals line current'} tone="rose" isDark={isDark} />
                  <Metric label="Estimated neutral" value={`${result.neutralCurrent.toFixed(2)} A`} detail="Simplified imbalance indicator" tone="amber" isDark={isDark} />
                  <Metric label="PF correction" value={`${result.correctionKvar.toFixed(2)} kvar`} detail={`To PF ${targetPowerFactor.toFixed(2)}`} tone="cyan" isDark={isDark} />
                </div>
                <div className={`flex items-start gap-2 rounded-xl border p-3 text-[10px] leading-relaxed ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}><Activity size={15} className="shrink-0 text-blue-500" />Neutral-current estimation here is a simplified imbalance indicator, not a harmonic load-flow calculation. Nonlinear loads require harmonic spectrum analysis.</div>
                <ResultExportActions toolId="threephase" toolName={TOOL.name} summary={summary} inputs={inputs} outputs={{ realPower: `${result.realPowerKw.toFixed(3)} kW`, outputPower: `${result.outputPowerKw.toFixed(3)} kW`, apparentPower: `${result.apparentPowerKva.toFixed(3)} kVA`, reactivePower: `${result.reactivePowerKvar.toFixed(3)} kvar`, phaseVoltage: `${result.phaseVoltage.toFixed(3)} V`, phaseCurrent: `${result.phaseCurrent.toFixed(3)} A`, neutralCurrent: `${result.neutralCurrent.toFixed(3)} A`, correction: `${result.correctionKvar.toFixed(3)} kvar` }} standardsRef="IEC three-phase power relationships" onSaveToHistory={runtime.saveToHistory} isDark={isDark} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AssistantShell>
  );
}
