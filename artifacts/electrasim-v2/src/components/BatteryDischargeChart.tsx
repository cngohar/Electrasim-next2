import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { Activity, Clock, Zap, ShieldAlert, Sparkles } from 'lucide-react';

interface BatteryDischargeChartProps {
  systemVoltage: number;
  batteryAh: number;
  usableKwh: number;
  totalKwh: number;
  dodPct: number;
  chemistry: 'lifepo4' | 'li-ion' | 'agm' | 'gel' | 'flooded';
  totalLoadWatts: number;
  dcPowerWatts: number;
  calculatedRuntimeHours: number;
  isDark: boolean;
}

export const BatteryDischargeChart: React.FC<BatteryDischargeChartProps> = ({
  systemVoltage,
  batteryAh,
  usableKwh,
  totalKwh,
  dodPct,
  chemistry,
  totalLoadWatts,
  dcPowerWatts,
  calculatedRuntimeHours,
  isDark
}) => {
  // Generate 25 points along the discharge timeline
  const pointsCount = 25;
  const maxHours = Math.max(0.2, calculatedRuntimeHours);
  const voltageMultiplier = systemVoltage / 12; // Normalize based on 12V block

  const chartData = React.useMemo(() => {
    const data = [];
    for (let i = 0; i <= pointsCount; i++) {
      const fraction = i / pointsCount;
      const elapsedHours = fraction * maxHours;
      const hoursDisplay = elapsedHours.toFixed(1);

      // Remaining State of Charge % (100% down to (100 - dodPct)%)
      const remainingSocPct = Math.max(0, 100 - (fraction * dodPct));

      // Chemistry-specific voltage curve simulation
      let baseCell12v = 12.8;
      if (chemistry === 'lifepo4') {
        // Flat plateau between 100% and 20% SoC, then sharp drop
        if (remainingSocPct > 90) baseCell12v = 13.4 - ((100 - remainingSocPct) * 0.04);
        else if (remainingSocPct > 20) baseCell12v = 13.0 - ((90 - remainingSocPct) * 0.005);
        else if (remainingSocPct > 10) baseCell12v = 12.6 - ((20 - remainingSocPct) * 0.08);
        else baseCell12v = Math.max(10.0, 11.8 - ((10 - remainingSocPct) * 0.18));
      } else if (chemistry === 'li-ion') {
        // Linear sloping voltage drop from 4.2V/cell down to 3.0V/cell
        baseCell12v = 10.5 + (remainingSocPct / 100) * 2.1;
      } else {
        // Lead-Acid / AGM / GEL: steady decline from 12.8V down to 10.8V
        baseCell12v = 10.8 + (remainingSocPct / 100) * 2.0;
      }

      const simulatedVoltage = parseFloat((baseCell12v * voltageMultiplier).toFixed(2));
      const remainingKwh = parseFloat(((remainingSocPct / 100) * totalKwh).toFixed(3));

      data.push({
        elapsedHours: parseFloat(hoursDisplay),
        timeLabel: `${hoursDisplay}h`,
        socPct: parseFloat(remainingSocPct.toFixed(1)),
        voltage: simulatedVoltage,
        remainingKwh
      });
    }
    return data;
  }, [pointsCount, maxHours, dodPct, chemistry, voltageMultiplier, totalKwh]);

  // Cutoff threshold line value
  const cutoffSoc = 100 - dodPct;

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    } shadow-xs space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Activity size={16} />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Discharge Dynamics & Voltage Curve
            </h4>
            <div className="text-xs text-slate-500">
              State of Charge (SoC %) & Voltage vs. Runtime ({totalLoadWatts}W Load)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
            Cutoff DoD: {dodPct}%
          </span>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-semibold">
            Runtime: {calculatedRuntimeHours.toFixed(1)}h
          </span>
        </div>
      </div>

      {/* Recharts Composed Chart Component */}
      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? '#1e293b' : '#f1f5f9'}
            />

            <XAxis
              dataKey="elapsedHours"
              unit="h"
              stroke={isDark ? '#64748b' : '#94a3b8'}
              tick={{ fontSize: 11 }}
            />

            {/* Left Y Axis: SoC Percentage */}
            <YAxis
              yAxisId="left"
              domain={[0, 100]}
              unit="%"
              stroke={isDark ? '#10b981' : '#059669'}
              tick={{ fontSize: 11 }}
            />

            {/* Right Y Axis: System Voltage */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={['auto', 'auto']}
              unit="V"
              stroke={isDark ? '#38bdf8' : '#0284c7'}
              tick={{ fontSize: 11 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
                fontSize: '12px'
              }}
              labelFormatter={(label) => `Elapsed: ${label} Hours`}
              formatter={(value: any, name: any) => {
                if (name === 'State of Charge') return [`${value}%`, 'Battery SoC'];
                if (name === 'Terminal Voltage') return [`${value} V`, 'DC Voltage'];
                if (name === 'Remaining Energy') return [`${value} kWh`, 'Energy Remaining'];
                return [value, name];
              }}
            />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />

            {/* Safe Depth of Discharge Cutoff Reference Line */}
            <ReferenceLine
              yAxisId="left"
              y={cutoffSoc}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{
                value: `Safe Cutoff (${cutoffSoc}% SoC)`,
                fill: '#ef4444',
                fontSize: 10,
                position: 'insideBottomRight'
              }}
            />

            {/* Area: State of Charge */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="socPct"
              name="State of Charge"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#socGradient)"
            />

            {/* Line: Terminal Voltage */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="voltage"
              name="Terminal Voltage"
              stroke="#38bdf8"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Engineering Insights Footer */}
      <div className={`p-2.5 rounded-xl border text-[11px] flex flex-wrap items-center justify-between gap-2 font-mono ${
        isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-amber-500 shrink-0" />
          <span>
            {chemistry === 'lifepo4'
              ? 'LiFePO4 flat voltage curve delivers consistent AC inverter power across 90% of cycle.'
              : 'Lead-Acid chemistry experiences early voltage sag under high current discharge.'}
          </span>
        </div>
        <div className="font-bold text-slate-700 dark:text-slate-200">
          Peak Load Draw: {dcPowerWatts.toFixed(0)}W DC
        </div>
      </div>
    </div>
  );
};
