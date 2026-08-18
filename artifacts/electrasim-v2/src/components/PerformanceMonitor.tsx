import React, { useState, useEffect, useRef } from 'react';
import { Activity, Gauge, Zap, ChevronDown, ChevronUp, RefreshCw, Cpu, Monitor, X, Play } from 'lucide-react';

export interface PerformanceMonitorProps {
  lastCalcDurationMs?: number;
  totalCalculationsCount?: number;
  isDark?: boolean;
  className?: string;
  position?: 'bottom-right' | 'top-right' | 'inline';
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  lastCalcDurationMs = 0.45,
  totalCalculationsCount = 1,
  isDark = true,
  className = '',
  position = 'inline',
}) => {
  const [fps, setFps] = useState<number>(60);
  const [minFps, setMinFps] = useState<number>(60);
  const [maxFps, setMaxFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<{
    cycles: number;
    totalMs: number;
    opsPerSec: number;
  } | null>(null);

  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);

  // Measure Real-time WebGL / DOM Animation FPS
  useEffect(() => {
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (delta > 0) {
        const instantFps = 1000 / delta;
        const boundedFps = Math.min(240, Math.max(1, instantFps));
        
        frameTimesRef.current.push(boundedFps);
        if (frameTimesRef.current.length > 30) {
          frameTimesRef.current.shift();
        }

        frameCount++;
      }

      // Update UI state every 400ms to reduce React re-renders
      if (now - lastFpsUpdate >= 400) {
        if (frameTimesRef.current.length > 0) {
          const avg = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
          const roundedAvg = Math.round(avg);
          setFps(roundedAvg);
          setFrameTimeMs(Number((1000 / Math.max(1, roundedAvg)).toFixed(1)));
          
          setMinFps((prev) => Math.min(prev, ...frameTimesRef.current));
          setMaxFps((prev) => Math.max(prev, ...frameTimesRef.current));
        }
        lastFpsUpdate = now;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Run a Client-Side 50,000-Iteration Math & Physics Benchmark
  const runBenchmark = () => {
    setIsBenchmarking(true);
    setTimeout(() => {
      const start = performance.now();
      const iterations = 50000;
      let accum = 0;

      // Simulate complex AC load, vector voltage drop, and Peukert battery curve equations
      for (let i = 0; i < iterations; i++) {
        const v = 230 + (i % 10);
        const r = 0.05 + (i % 5) * 0.01;
        const x = 0.02 + (i % 3) * 0.005;
        const pf = 0.85;
        const sinPhi = Math.sqrt(1 - pf * pf);
        const z = Math.sqrt(r * r + x * x);
        const vd = (2 * (i % 40) * (r * pf + x * sinPhi)) / v;
        const peukert = Math.pow(100 / Math.max(1, (i % 25) + 5), 1.15);
        accum += vd + peukert + z;
      }

      const end = performance.now();
      const totalMs = Math.max(0.01, end - start);
      const opsPerSec = Math.round((iterations / totalMs) * 1000);

      setBenchmarkResult({
        cycles: iterations,
        totalMs: Number(totalMs.toFixed(2)),
        opsPerSec,
      });
      setIsBenchmarking(false);
    }, 50);
  };

  const getFpsColor = (val: number) => {
    if (val >= 55) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (val >= 30) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getFpsDot = (val: number) => {
    if (val >= 55) return 'bg-emerald-400 animate-pulse';
    if (val >= 30) return 'bg-amber-400';
    return 'bg-rose-400 animate-ping';
  };

  return (
    <div
      id="electrasim-performance-monitor"
      className={`relative inline-block font-mono select-none ${className}`}
    >
      {/* Minimized Quick Status Pill */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all shadow-xs cursor-pointer ${
          isDark
            ? 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900'
            : 'bg-white/90 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        }`}
        title="Toggle Real-time Performance & Engine Benchmark Diagnostics"
      >
        <span className={`w-2 h-2 rounded-full ${getFpsDot(fps)}`} />
        <span className="flex items-center gap-1">
          <span className="font-bold">{fps}</span>
          <span className="text-[9px] text-slate-400">FPS</span>
        </span>
        <span className="text-slate-500">|</span>
        <span className="flex items-center gap-1 text-blue-400">
          <Zap size={11} className="text-blue-500" />
          <span>{lastCalcDurationMs.toFixed(2)}ms</span>
        </span>
        {isExpanded ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
      </button>

      {/* Expanded Performance Diagnostics Flyout */}
      {isExpanded && (
        <div
          className={`absolute z-50 right-0 mt-2 w-72 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${
            isDark
              ? 'bg-slate-950/95 border-slate-800 text-slate-200'
              : 'bg-white/95 border-slate-200 text-slate-800'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Activity size={15} />
              </div>
              <div>
                <h4 className="text-xs font-bold font-sans">Engine Diagnostics</h4>
                <p className="text-[10px] text-slate-400">Real-time FPS & Compute Latency</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>

          {/* Grid Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* 3D FPS Metric */}
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>3D Frame Rate</span>
                <Monitor size={11} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-bold ${fps >= 50 ? 'text-emerald-400' : fps >= 30 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {fps}
                </span>
                <span className="text-[10px] text-slate-400">FPS</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1 flex justify-between">
                <span>Min: {Math.round(minFps)}</span>
                <span>Max: {Math.round(maxFps)}</span>
              </div>
            </div>

            {/* Frame Time */}
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Frame Interval</span>
                <Gauge size={11} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-blue-400">{frameTimeMs}</span>
                <span className="text-[10px] text-slate-400">ms</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">
                {frameTimeMs <= 16.7 ? '🟢 60+ Hz Target' : '🟡 Dropped Frames'}
              </div>
            </div>

            {/* Compute Speed */}
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Calc Execution</span>
                <Zap size={11} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-amber-400">
                  {lastCalcDurationMs.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400">ms</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1 truncate">
                Sub-millisecond solver
              </div>
            </div>

            {/* Total Evaluations */}
            <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Total Solves</span>
                <Cpu size={11} />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-purple-400">
                  {totalCalculationsCount}
                </span>
                <span className="text-[10px] text-slate-400">runs</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-1">
                Active Client Engine
              </div>
            </div>
          </div>

          {/* Benchmark Runner */}
          <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100/60 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Stress Benchmark
              </span>
              <button
                type="button"
                onClick={runBenchmark}
                disabled={isBenchmarking}
                className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isBenchmarking ? (
                  <RefreshCw size={10} className="animate-spin" />
                ) : (
                  <Play size={10} />
                )}
                <span>{isBenchmarking ? 'Testing...' : 'Run 50k Cycles'}</span>
              </button>
            </div>

            {benchmarkResult ? (
              <div className="text-[10px] space-y-1 font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration:</span>
                  <span className="font-bold text-emerald-400">{benchmarkResult.totalMs} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Throughput:</span>
                  <span className="font-bold text-blue-400">
                    {(benchmarkResult.opsPerSec / 1000).toFixed(0)}k ops/sec
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic">
                Tests CPU matrix and trigonometric AC cable calculations.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
