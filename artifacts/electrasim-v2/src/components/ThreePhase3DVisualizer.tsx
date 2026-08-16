import React, { useCallback, useState } from 'react';
import * as THREE from 'three';
import { Activity, Box, Eye, Gauge, Pause, Play, RotateCcw, Tag, Zap } from 'lucide-react';
import { useEngineeringViewport, type CameraPreset } from './three/useEngineeringViewport';

interface ThreePhase3DProps {
  system: 'star' | 'delta';
  lineVoltage: number;
  lineCurrent: number;
  powerFactor: number;
  realPowerKw: number;
  phaseAngleDeg: number;
  imbalancePct: number;
  neutralCurrent: number;
}

type ModelView = 'machine' | 'connection' | 'field';

const phaseColors = [0xef4444, 0xfacc15, 0x3b82f6];
const safe = (value: number, fallback = 0) => Number.isFinite(value) ? value : fallback;

function tubeBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: number) {
  const curve = new THREE.LineCurve3(start, end);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 16, radius, 10, false),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.16, metalness: 0.5, roughness: 0.3 }),
  );
}

export default function ThreePhase3DVisualizer({
  system,
  lineVoltage,
  lineCurrent,
  powerFactor,
  realPowerKw,
  phaseAngleDeg,
  imbalancePct,
  neutralCurrent,
}: ThreePhase3DProps) {
  const [viewMode, setViewMode] = useState<ModelView>('machine');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showPhaseVectors, setShowPhaseVectors] = useState(true);
  const [showFlux, setShowFlux] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const buildModel = useCallback((model: THREE.Group) => {
    const current = Math.max(0, safe(lineCurrent));
    const imbalance = THREE.MathUtils.clamp(safe(imbalancePct) / 100, 0, 1);
    const pf = THREE.MathUtils.clamp(safe(powerFactor, 1), 0.01, 1);
    const fieldScale = THREE.MathUtils.clamp(0.65 + current / 110, 0.65, 1.8);
    const phaseMeshes: THREE.Mesh[][] = [[], [], []];
    const animatedVectors: THREE.ArrowHelper[] = [];
    let resultantVector: THREE.ArrowHelper | null = null;
    let rotor: THREE.Group | null = null;
    let fluxShell: THREE.Mesh | null = null;

    if (viewMode === 'machine' || viewMode === 'field') {
      const stator = new THREE.Mesh(
        new THREE.TorusGeometry(3.7, 0.52, 18, 72),
        new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.3 }),
      );
      stator.rotation.x = Math.PI / 2;
      model.add(stator);

      const backIron = new THREE.Mesh(
        new THREE.TorusGeometry(4.35, 0.22, 14, 72),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.82, roughness: 0.24 }),
      );
      backIron.rotation.x = Math.PI / 2;
      model.add(backIron);

      const toothGeometry = new THREE.BoxGeometry(0.42, 1.15, 0.78);
      for (let index = 0; index < 18; index += 1) {
        const phaseIndex = index % 3;
        const angle = index / 18 * Math.PI * 2;
        const material = new THREE.MeshStandardMaterial({
          color: phaseColors[phaseIndex],
          emissive: phaseColors[phaseIndex],
          emissiveIntensity: 0.22,
          metalness: 0.18,
          roughness: 0.42,
        });
        const tooth = new THREE.Mesh(toothGeometry, material);
        tooth.position.set(Math.cos(angle) * 3.35, 0, Math.sin(angle) * 3.35);
        tooth.rotation.y = -angle;
        model.add(tooth);
        phaseMeshes[phaseIndex].push(tooth);
      }

      rotor = new THREE.Group();
      const rotorBody = new THREE.Mesh(
        new THREE.CylinderGeometry(2.05, 2.05, 1.45, 48),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.24 }),
      );
      rotorBody.castShadow = true;
      rotor.add(rotorBody);
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 4.5, 24),
        new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.95, roughness: 0.14 }),
      );
      rotor.add(shaft);
      for (let index = 0; index < 8; index += 1) {
        const angle = index / 8 * Math.PI * 2;
        const bar = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 1.55, 0.34),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.22 }),
        );
        bar.position.set(Math.cos(angle) * 1.55, 0, Math.sin(angle) * 1.55);
        bar.rotation.y = -angle;
        rotor.add(bar);
      }
      model.add(rotor);

      if (showPhaseVectors) {
        for (let phase = 0; phase < 3; phase += 1) {
          const angle = -Math.PI / 2 + phase * Math.PI * 2 / 3;
          const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)),
            new THREE.Vector3(0, 0.95, 0),
            2.45,
            phaseColors[phase],
            0.35,
            0.22,
          );
          model.add(arrow);
          animatedVectors.push(arrow);
        }
        resultantVector = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 1.12, 0),
          3.05,
          0x22d3ee,
          0.5,
          0.3,
        );
        model.add(resultantVector);
      }

      if (showFlux) {
        fluxShell = new THREE.Mesh(
          new THREE.TorusGeometry(2.72, 0.045, 10, 80),
          new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.65, blending: THREE.AdditiveBlending }),
        );
        fluxShell.rotation.x = Math.PI / 2;
        fluxShell.position.y = 0.78;
        model.add(fluxShell);
        for (let index = 0; index < 4; index += 1) {
          const flux = new THREE.Mesh(
            new THREE.TorusGeometry(2.35 + index * 0.28, 0.018, 8, 64),
            new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.32 - index * 0.05 }),
          );
          flux.rotation.x = Math.PI / 2;
          flux.position.y = 0.74;
          model.add(flux);
        }
      }
    }

    if (viewMode === 'connection') {
      const vertices = [
        new THREE.Vector3(0, 2.8, -3.2),
        new THREE.Vector3(3.6, 2.8, 2.4),
        new THREE.Vector3(-3.6, 2.8, 2.4),
      ];
      const lowerVertices = vertices.map((point) => point.clone().setY(-1.1));

      vertices.forEach((point, phase) => {
        const terminal = new THREE.Mesh(
          new THREE.SphereGeometry(0.34, 22, 16),
          new THREE.MeshStandardMaterial({ color: phaseColors[phase], emissive: phaseColors[phase], emissiveIntensity: 0.65 }),
        );
        terminal.position.copy(point);
        model.add(terminal);
        model.add(tubeBetween(point, lowerVertices[phase], 0.1, phaseColors[phase]));
      });

      if (system === 'star') {
        const neutral = new THREE.Vector3(0, -1.1, 0);
        lowerVertices.forEach((point, phase) => model.add(tubeBetween(point, neutral, 0.13, phaseColors[phase])));
        const neutralNode = new THREE.Mesh(
          new THREE.SphereGeometry(0.42, 24, 16),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0x64748b, emissiveIntensity: 0.42, metalness: 0.62 }),
        );
        neutralNode.position.copy(neutral);
        model.add(neutralNode);
        if (neutralCurrent > 0.01) {
          const neutralFlow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), neutral, 2.1, 0xa5b4fc, 0.3, 0.18);
          model.add(neutralFlow);
        }
      } else {
        lowerVertices.forEach((point, phase) => {
          model.add(tubeBetween(point, lowerVertices[(phase + 1) % 3], 0.13, phaseColors[phase]));
        });
      }

      vertices.forEach((point, phase) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.72, 0.1, 10, 36),
          new THREE.MeshBasicMaterial({ color: phaseColors[phase], transparent: true, opacity: 0.62 }),
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(point).add(new THREE.Vector3(0, -1.2, 0));
        model.add(ring);
        phaseMeshes[phase].push(ring);
      });
    }

    const phaseLag = Math.acos(pf);
    return {
      animate: (delta: number, elapsed: number) => {
        const electricalAngle = elapsed * 1.8;
        phaseMeshes.forEach((meshes, phase) => {
          const wave = Math.sin(electricalAngle - phaseLag - phase * Math.PI * 2 / 3);
          meshes.forEach((mesh) => {
            const material = mesh.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
            material.opacity = 0.7 + Math.abs(wave) * 0.3;
            if ('emissiveIntensity' in material) material.emissiveIntensity = 0.18 + Math.abs(wave) * fieldScale * 0.55;
          });
          const arrow = animatedVectors[phase];
          if (arrow) {
            const baseAngle = -Math.PI / 2 + phase * Math.PI * 2 / 3;
            const sign = wave >= 0 ? 1 : -1;
            arrow.setDirection(new THREE.Vector3(Math.cos(baseAngle) * sign, 0, Math.sin(baseAngle) * sign));
            arrow.setLength(0.75 + Math.abs(wave) * 1.85 * fieldScale, 0.34, 0.2);
          }
        });
        if (resultantVector) {
          const rotation = electricalAngle - phaseLag;
          resultantVector.setDirection(new THREE.Vector3(Math.cos(rotation), 0, Math.sin(rotation)));
          resultantVector.setLength(2.6 * fieldScale * (1 - imbalance * 0.22), 0.48, 0.28);
        }
        if (rotor) rotor.rotation.y += delta * (0.65 + Math.min(realPowerKw / 80, 1.8));
        if (fluxShell) {
          fluxShell.rotation.z = electricalAngle * 0.35;
          const pulse = 1 + Math.sin(electricalAngle * 2) * (0.018 + imbalance * 0.04);
          fluxShell.scale.setScalar(pulse);
        }
      },
    };
  }, [imbalancePct, lineCurrent, neutralCurrent, powerFactor, realPowerKw, showFlux, showPhaseVectors, system, viewMode]);

  const viewport = useEngineeringViewport({
    buildModel,
    autoRotate: isAutoRotating,
    ariaLabel: `Interactive ${system} three-phase model at ${safe(lineVoltage)} volts and ${safe(lineCurrent)} amperes`,
    initialRadius: 12,
    minRadius: 5,
    maxRadius: 28,
  });

  const modeButton = (mode: ModelView, label: string, icon: React.ReactNode, activeClass: string) => (
    <button type="button" onClick={() => setViewMode(mode)} aria-pressed={viewMode === mode} className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${viewMode === mode ? activeClass : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      {icon}{label}
    </button>
  );
  const preset = (camera: CameraPreset, label: string) => (
    <button type="button" onClick={() => viewport.setCameraPreset(camera)} className="rounded px-1.5 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">{label}</button>
  );

  return (
    <section className="relative h-[390px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
      <div ref={viewport.mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-slate-950/95 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-slate-950/95 to-transparent" />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex max-w-[calc(100%-44px)] gap-1 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
          {modeButton('machine', 'Machine', <Gauge size={13} />, 'bg-blue-600 text-white')}
          {modeButton('connection', system === 'star' ? 'Star network' : 'Delta network', <Activity size={13} />, 'bg-violet-600 text-white')}
          {modeButton('field', 'Field', <Zap size={13} />, 'bg-cyan-600 text-white')}
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
          <button type="button" onClick={() => setIsAutoRotating((value) => !value)} aria-pressed={isAutoRotating} className={`rounded-lg p-1.5 ${isAutoRotating && !viewport.reducedMotion ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400 hover:text-white'}`} title={isAutoRotating ? 'Pause automatic orbit' : 'Start automatic orbit'}>{isAutoRotating ? <Pause size={14} /> : <Play size={14} />}</button>
          <button type="button" onClick={viewport.resetCamera} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" title="Reset 3D viewpoint"><RotateCcw size={14} /></button>
        </div>
      </div>

      <div className="pointer-events-auto absolute left-3 top-14 z-20 flex gap-1 rounded-lg border border-slate-800 bg-slate-950/75 p-1 backdrop-blur">
        <button type="button" onClick={() => setShowPhaseVectors((value) => !value)} aria-pressed={showPhaseVectors} className={`rounded-md p-1.5 ${showPhaseVectors ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'}`} title="Toggle phase and resultant vectors"><Eye size={13} /></button>
        <button type="button" onClick={() => setShowFlux((value) => !value)} aria-pressed={showFlux} className={`rounded-md p-1.5 ${showFlux ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500 hover:text-white'}`} title="Toggle rotating flux overlay"><Activity size={13} /></button>
        <button type="button" onClick={() => setShowLabels((value) => !value)} aria-pressed={showLabels} className={`rounded-md p-1.5 ${showLabels ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-white'}`} title="Toggle electrical labels"><Tag size={13} /></button>
      </div>

      <div className="pointer-events-auto absolute right-3 top-14 z-20 hidden gap-1 rounded-lg border border-slate-800 bg-slate-950/75 p-1 backdrop-blur sm:flex">
        {preset('iso', 'ISO')}{preset('top', 'TOP')}{preset('side', 'SIDE')}{preset('macro', 'MACRO')}
      </div>

      {showLabels && (
        <div className="pointer-events-none absolute left-3 top-24 z-10 hidden max-w-[245px] flex-col gap-1.5 sm:flex">
          <div className="rounded-lg border border-blue-500/25 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] text-blue-200 backdrop-blur">{safe(lineVoltage).toFixed(0)} V line · {safe(lineCurrent).toFixed(1)} A</div>
          <div className="rounded-lg border border-violet-500/25 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] text-violet-200 backdrop-blur">{system === 'star' ? 'Star / wye' : 'Delta'} · PF {safe(powerFactor).toFixed(2)}</div>
          <div className="rounded-lg border border-cyan-500/25 bg-slate-950/80 px-2.5 py-1 font-mono text-[10px] text-cyan-200 backdrop-blur">120° sequence · lag {safe(phaseAngleDeg).toFixed(1)}°</div>
        </div>
      )}

      {viewport.status !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-slate-950/75 p-6 text-center backdrop-blur-sm">
          <div><Box className="mx-auto mb-2 text-blue-400" size={24} /><p className="text-sm font-bold">{viewport.status === 'context-lost' ? '3D context interrupted' : viewport.status === 'unavailable' ? 'WebGL is unavailable' : 'Preparing rotating-field model…'}</p><p className="mt-1 text-xs text-slate-400">The three-phase results remain available.</p></div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 font-mono text-[10px] backdrop-blur-md sm:text-xs"><Activity size={13} className="text-cyan-300" /><strong>{safe(realPowerKw).toFixed(2)} kW</strong><span className="text-slate-600">·</span><span className="text-slate-300">rotating field</span></div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 font-mono text-[10px] backdrop-blur-md sm:text-xs"><Zap size={13} className="text-amber-400" /><strong className={imbalancePct <= 5 ? 'text-emerald-300' : 'text-amber-300'}>{safe(imbalancePct).toFixed(1)}% imbalance</strong><span className="hidden text-slate-500 md:inline">· {viewport.zoomPercent}%</span></div>
      </div>

      {viewport.reducedMotion && <div className="pointer-events-none absolute bottom-14 right-3 rounded bg-slate-950/75 px-2 py-1 text-[9px] text-slate-400">Reduced motion</div>}
    </section>
  );
}
