import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import ResultExportActions from '@/components/ResultExportActions';
import AssistantShell from '../../components/AssistantShell';
import { EngineeringNotice, Metric, NumberField, Panel, PanelHeading, PresetBar, PresetButton, ResultStatus, SelectField } from '../../components/ToolUi';
import { calculateLoadAndBreaker, type LoadCalculationInputs, type LoadItem } from '../../calculations/electricalCalculations';
import { TOOL_BY_ID } from '../../toolCatalog';
import { consumePendingHistory, useAssistantRuntime } from '../../useAssistantRuntime';
import { usePageSeo } from '../../usePageSeo';

const TOOL = TOOL_BY_ID['load-calculator'];
const starterLoads: LoadItem[] = [
  { id: 'refrigerator', name: 'Refrigerator', watts: 600, quantity: 1 },
  { id: 'lighting', name: 'LED lighting', watts: 150, quantity: 1 },
  { id: 'microwave', name: 'Microwave oven', watts: 1200, quantity: 1 },
];

export default function LoadCalculatorPage() {
  const runtime = useAssistantRuntime();
  const { isDark } = runtime;
  const [loads, setLoads] = useState<LoadItem[]>(starterLoads);
  const [diversityPct, setDiversityPct] = useState(80);
  const [voltage, setVoltage] = useState(230);
  const [phases, setPhases] = useState<1 | 3>(1);
  const [powerFactor, setPowerFactor] = useState(1);
  const [continuousFactor, setContinuousFactor] = useState(1.25);
  const [newName, setNewName] = useState('');
  const [newWatts, setNewWatts] = useState(1000);

  usePageSeo({ title: TOOL.title, description: TOOL.description, path: TOOL.path, keywords: TOOL.keywords });

  useEffect(() => {
    const entry = consumePendingHistory(TOOL.id);
    if (!entry) return;
    const input = entry.inputs;
    if (Array.isArray(input.loads)) setLoads(input.loads.filter((item: LoadItem) => item && typeof item.name === 'string' && typeof item.watts === 'number' && typeof item.quantity === 'number'));
    if (typeof input.diversityPct === 'number') setDiversityPct(input.diversityPct);
    if (typeof input.voltage === 'number') setVoltage(input.voltage);
    if (input.phases === 1 || input.phases === 3) setPhases(input.phases);
    if (typeof input.powerFactor === 'number') setPowerFactor(input.powerFactor);
    if (typeof input.continuousFactor === 'number') setContinuousFactor(input.continuousFactor);
  }, []);

  const inputs: LoadCalculationInputs = { standard: runtime.standard, loads, diversityPct, voltage, phases, powerFactor, continuousFactor };
  const result = useMemo(() => calculateLoadAndBreaker(inputs), [runtime.standard, loads, diversityPct, voltage, phases, powerFactor, continuousFactor]);
  const summary = result.valid
    ? `${result.connectedWatts.toFixed(0)} W connected, ${result.diversifiedWatts.toFixed(0)} W diversified, preliminary ${result.recommendedBreaker} A protection.`
    : result.diagnostics.join(' ');

  const addLoad = () => {
    if (!newName.trim() || newWatts <= 0) return;
    setLoads((current) => [...current, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name: newName.trim(), watts: newWatts, quantity: 1 }]);
    setNewName('');
  };
  const setPreset = (kind: 'home' | 'coffee' | 'workshop') => {
    if (kind === 'home') {
      setLoads([{ id: 'sockets', name: 'Socket circuits', watts: 7360, quantity: 1 }, { id: 'lights', name: 'House lighting', watts: 500, quantity: 1 }, { id: 'cooker', name: 'Induction cooker', watts: 7200, quantity: 1 }, { id: 'shower', name: 'Electric shower', watts: 9500, quantity: 1 }, { id: 'ev', name: 'EV home charger', watts: 7400, quantity: 1 }]);
      setDiversityPct(65); setVoltage(230); setPhases(1); setPowerFactor(1);
    } else if (kind === 'coffee') {
      setLoads([{ id: 'espresso', name: 'Espresso machine', watts: 6000, quantity: 1 }, { id: 'boiler', name: 'Water boiler', watts: 3000, quantity: 1 }, { id: 'hvac', name: 'Air conditioning', watts: 4500, quantity: 1 }, { id: 'dishwasher', name: 'Dishwasher', watts: 3500, quantity: 1 }, { id: 'lighting', name: 'Lighting and POS', watts: 2500, quantity: 1 }]);
      setDiversityPct(80); setVoltage(400); setPhases(3); setPowerFactor(0.9);
    } else {
      setLoads([{ id: 'hoists', name: 'Hydraulic hoists', watts: 6000, quantity: 2 }, { id: 'compressor', name: 'Air compressor', watts: 7500, quantity: 1 }, { id: 'welders', name: 'Welding stations', watts: 12000, quantity: 2 }, { id: 'lighting', name: 'High-bay lighting', watts: 2500, quantity: 1 }]);
      setDiversityPct(60); setVoltage(400); setPhases(3); setPowerFactor(0.82);
    }
  };

  return (
    <AssistantShell runtime={runtime} tool={TOOL}>
      <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5">
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_390px]">
          <Panel isDark={isDark}>
            <PanelHeading icon={<SlidersHorizontal size={16} className="text-blue-500" />} title="Connected load schedule" eyebrow="Appliances and equipment" isDark={isDark} />
            <div className="space-y-4 p-4 sm:p-5">
              <PresetBar isDark={isDark}>
                <PresetButton isDark={isDark} onClick={() => setPreset('home')}>All-electric home</PresetButton>
                <PresetButton isDark={isDark} onClick={() => setPreset('coffee')}>Coffee shop</PresetButton>
                <PresetButton isDark={isDark} onClick={() => setPreset('workshop')}>Auto workshop</PresetButton>
              </PresetBar>
              <div className="space-y-2">
                {loads.map((load) => (
                  <div key={load.id} className={`grid grid-cols-[1fr_76px_82px_34px] items-center gap-2 rounded-xl border p-2.5 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="min-w-0"><p className="truncate text-xs font-bold">{load.name}</p><p className={`font-mono text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{load.watts.toLocaleString()} W each</p></div>
                    <input type="number" aria-label={`${load.name} watts`} value={load.watts} min={0} onChange={(event) => setLoads((current) => current.map((item) => item.id === load.id ? { ...item, watts: Number(event.target.value) } : item))} className={`h-8 min-w-0 rounded-lg border px-2 font-mono text-[10px] ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`} />
                    <div className="flex items-center gap-1"><span className="text-[9px] text-slate-500">Qty</span><input type="number" aria-label={`${load.name} quantity`} value={load.quantity} min={0} step={1} onChange={(event) => setLoads((current) => current.map((item) => item.id === load.id ? { ...item, quantity: Number(event.target.value) } : item))} className={`h-8 w-12 rounded-lg border px-1.5 font-mono text-[10px] ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`} /></div>
                    <button type="button" onClick={() => setLoads((current) => current.filter((item) => item.id !== load.id))} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-500/10 hover:text-rose-500" aria-label={`Remove ${load.name}`}><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-blue-500">Add a load</p>
                <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
                  <input type="text" value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addLoad(); }} placeholder="Equipment name" aria-label="New equipment name" className={`h-10 rounded-xl border px-3 text-xs outline-none focus:border-blue-500 ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`} />
                  <input type="number" value={newWatts} onChange={(event) => setNewWatts(Number(event.target.value))} min={0} aria-label="New equipment power in watts" className={`h-10 rounded-xl border px-3 font-mono text-xs outline-none focus:border-blue-500 ${isDark ? 'border-slate-700 bg-slate-900 text-white' : 'border-slate-300 bg-white'}`} />
                  <button type="button" onClick={addLoad} className="flex h-10 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-500"><Plus size={14} />Add</button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <NumberField label="Diversity factor" unit="%" value={diversityPct} min={0} max={100} step={5} onChange={setDiversityPct} isDark={isDark} />
                <NumberField label="System voltage" unit="V" value={voltage} min={1} onChange={setVoltage} isDark={isDark} />
                <SelectField label="Supply phases" value={phases} onChange={(event) => setPhases(Number(event.target.value) as 1 | 3)} isDark={isDark}><option value={1}>Single phase</option><option value={3}>Three phase</option></SelectField>
                <NumberField label="Power factor" unit="PF" value={powerFactor} min={0.01} max={1} step={0.01} onChange={setPowerFactor} isDark={isDark} />
                <NumberField label="Design multiplier" value={continuousFactor} min={1} step={0.05} onChange={setContinuousFactor} isDark={isDark} help="Use only where required for the actual continuous-load treatment." />
              </div>
              <EngineeringNotice isDark={isDark} />
            </div>
          </Panel>

          <Panel isDark={isDark} className="lg:sticky lg:top-[102px]">
            <PanelHeading icon={<BarChart3 size={16} className="text-emerald-500" />} title="Demand result" eyebrow="Preliminary protection" isDark={isDark} />
            <div className="space-y-3 p-4">
              <ResultStatus ok={result.valid} label={result.valid ? 'Standard rating identified' : 'Manual design required'} message={result.valid ? `The recommended rating is the first ${runtime.standard} standard size above diversified current after the entered design multiplier.` : result.diagnostics[0]} isDark={isDark} />
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Connected load" value={`${result.connectedWatts.toFixed(0)} W`} detail={`${loads.length} load groups`} tone="blue" isDark={isDark} />
                <Metric label="Diversified load" value={`${result.diversifiedWatts.toFixed(0)} W`} detail={`${diversityPct.toFixed(0)}% simultaneous use`} tone="purple" isDark={isDark} />
                <Metric label="Operating current" value={`${result.fullLoadCurrent.toFixed(2)} A`} detail={`${phases === 3 ? 'Three' : 'Single'} phase`} tone="cyan" isDark={isDark} />
                <Metric label="Design current" value={`${result.designCurrentWithMargin.toFixed(2)} A`} detail={`× ${continuousFactor.toFixed(2)} multiplier`} tone="amber" isDark={isDark} />
                <Metric label="Preliminary breaker" value={result.recommendedBreaker ? `${result.recommendedBreaker} A` : 'No solution'} detail={`${runtime.standard} standard rating`} tone="emerald" isDark={isDark} />
                <Metric label="Rating headroom" value={result.recommendedBreaker ? `${result.spareCapacityA.toFixed(2)} A` : '—'} detail="Breaker rating minus design current" tone="blue" isDark={isDark} />
                <Metric label="Indicative conductor" value={result.indicativeConductor?.label ?? 'Complete sizing'} detail="Nominal Cu/PVC ampacity only" tone="rose" isDark={isDark} />
              </div>
              <div className={`rounded-xl border p-3 text-[10px] leading-relaxed ${isDark ? 'border-slate-800 bg-slate-950 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{result.diagnostics.map((item) => <p key={item}>• {item}</p>)}</div>
              <ResultExportActions toolId="loadcalc" toolName={TOOL.name} summary={summary} inputs={inputs} outputs={{ connectedLoad: `${result.connectedWatts.toFixed(0)} W`, diversifiedLoad: `${result.diversifiedWatts.toFixed(0)} W`, fullLoadCurrent: `${result.fullLoadCurrent.toFixed(2)} A`, designCurrent: `${result.designCurrentWithMargin.toFixed(2)} A`, recommendedBreaker: result.recommendedBreaker ? `${result.recommendedBreaker} A` : 'No standard solution', indicativeConductor: result.indicativeConductor?.label ?? 'Complete cable sizing required' }} standardsRef={result.standardsReference} onSaveToHistory={runtime.saveToHistory} isDark={isDark} />
            </div>
          </Panel>
        </div>
      </div>
    </AssistantShell>
  );
}
