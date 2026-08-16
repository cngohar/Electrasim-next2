import React, { useCallback, useState } from 'react';
import * as THREE from 'three';
import {
  Activity,
  BatteryCharging,
  Box,
  CircuitBoard,
  Eye,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Tag,
  Zap,
} from 'lucide-react';
import {
  useEngineeringViewport,
  type CameraPreset,
} from './three/useEngineeringViewport';

interface Ohms3DProps {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  solveMode: string;
}

type OhmsView = 'circuit' | 'resistor' | 'field';

const safeNumber = (value: number, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

function xCylinder(radius: number, length: number, segments = 32) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}

function getResistorColorBands(ohms: number): [number, number, number, number] {
  if (!Number.isFinite(ohms) || ohms <= 0) return [0x171717, 0x171717, 0x171717, 0xd4af37];

  const colors = [
    0x171717, 0x78350f, 0xef4444, 0xf97316, 0xeab308,
    0x22c55e, 0x3b82f6, 0xa855f7, 0x64748b, 0xf8fafc,
  ];
  const multipliers: Record<number, number> = {
    [-2]: 0xcbd5e1,
    [-1]: 0xd4af37,
    0: 0x171717,
    1: 0x78350f,
    2: 0xef4444,
    3: 0xf97316,
    4: 0xeab308,
    5: 0x22c55e,
    6: 0x3b82f6,
  };

  const exponent = Math.floor(Math.log10(ohms));
  const normalized = ohms / 10 ** exponent;
  const first = THREE.MathUtils.clamp(Math.floor(normalized), 0, 9);
  const second = THREE.MathUtils.clamp(Math.floor((normalized - first) * 10 + 1e-6), 0, 9);
  return [colors[first], colors[second], multipliers[exponent - 1] ?? 0x171717, 0xd4af37];
}

function addResistor(
  group: THREE.Group,
  resistance: number,
  scale = 1,
): THREE.Group {
  const resistor = new THREE.Group();
  const body = new THREE.Mesh(
    xCylinder(0.62 * scale, 3.6 * scale, 40),
    new THREE.MeshStandardMaterial({ color: 0xe8d7ad, roughness: 0.58, metalness: 0.03 }),
  );
  body.castShadow = true;
  resistor.add(body);

  const leadGeometry = xCylinder(0.085 * scale, 2.2 * scale, 12);
  const leadMaterial = new THREE.MeshStandardMaterial({ color: 0xb7c2d0, metalness: 0.92, roughness: 0.18 });
  [-2.85, 2.85].forEach((x) => {
    const lead = new THREE.Mesh(leadGeometry, leadMaterial);
    lead.position.x = x * scale;
    resistor.add(lead);
  });

  const bands = getResistorColorBands(resistance);
  const bandPositions = [-1.1, -0.42, 0.34, 1.15];
  bands.forEach((color, index) => {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.625 * scale, 0.075 * scale, 10, 36),
      new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: color === 0xd4af37 ? 0.65 : 0.06 }),
    );
    band.rotation.y = Math.PI / 2;
    band.position.x = bandPositions[index] * scale;
    resistor.add(band);
  });
  group.add(resistor);
  return resistor;
}

export const Ohms3DVisualizer: React.FC<Ohms3DProps> = ({
  voltage,
  current,
  resistance,
  power,
  solveMode,
}) => {
  const [viewMode, setViewMode] = useState<OhmsView>('circuit');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showMagneticField, setShowMagneticField] = useState(false);
  const [showVectors, setShowVectors] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const buildModel = useCallback(
    (model: THREE.Group) => {
      const safeVoltage = Math.max(0, safeNumber(voltage));
      const safeCurrent = Math.max(0, safeNumber(current));
      const safeResistance = Math.max(0.001, safeNumber(resistance, 1));
      const safePower = Math.max(0, safeNumber(power));
      const loadColor = safePower > 800 ? 0xef4444 : safePower > 180 ? 0xf59e0b : 0x22c55e;
      const powerLight = new THREE.PointLight(loadColor, 8 + Math.min(16, safePower / 80), 20, 2);
      powerLight.position.set(0, 1.5, 2);
      model.add(powerLight);

      let updateParticles: ((elapsed: number) => void) | null = null;
      let pulseTarget: THREE.Object3D | null = null;

      if (viewMode === 'circuit') {
        const circuitPoints = [
          new THREE.Vector3(-5.4, -1.7, 0),
          new THREE.Vector3(-5.4, 1.7, 0),
          new THREE.Vector3(-1.8, 1.7, 0),
          new THREE.Vector3(1.8, 1.7, 0),
          new THREE.Vector3(5.4, 1.7, 0),
          new THREE.Vector3(5.4, -1.7, 0),
          new THREE.Vector3(0, -1.7, 0),
        ];
        const curve = new THREE.CatmullRomCurve3(circuitPoints, true, 'catmullrom', 0.06);
        const wire = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 220, 0.105, 12, true),
          new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.22 }),
        );
        wire.castShadow = true;
        model.add(wire);

        const battery = new THREE.Group();
        const batteryBody = new THREE.Mesh(
          new THREE.BoxGeometry(1.35, 2.5, 1.4),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.52, roughness: 0.35 }),
        );
        battery.add(batteryBody);
        const positive = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.28, 0.45),
          new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x7f1d1d, emissiveIntensity: 0.8 }),
        );
        positive.position.set(0, 1.38, 0);
        battery.add(positive);
        battery.position.set(-5.4, 0, 0);
        model.add(battery);

        const circuitResistor = addResistor(model, safeResistance, 0.72);
        circuitResistor.position.set(0, 1.7, 0);

        const load = new THREE.Mesh(
          new THREE.SphereGeometry(0.86, 30, 20),
          new THREE.MeshPhysicalMaterial({
            color: loadColor,
            emissive: loadColor,
            emissiveIntensity: THREE.MathUtils.clamp(0.22 + safePower / 600, 0.25, 1.8),
            roughness: 0.23,
            clearcoat: 0.8,
          }),
        );
        load.position.set(5.4, 0, 0);
        model.add(load);
        pulseTarget = load;

        const particleCount = 120;
        const positions = new Float32Array(particleCount * 3);
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        model.add(
          new THREE.Points(
            particleGeometry,
            new THREE.PointsMaterial({
              color: 0x7dd3fc,
              size: 0.13,
              transparent: true,
              opacity: 0.95,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          ),
        );
        updateParticles = (elapsed) => {
          const flow = 0.035 + Math.min(safeCurrent / 900, 0.18);
          for (let index = 0; index < particleCount; index += 1) {
            const point = curve.getPoint(((index / particleCount) + elapsed * flow) % 1);
            positions[index * 3] = point.x;
            positions[index * 3 + 1] = point.y;
            positions[index * 3 + 2] = point.z;
          }
          particleGeometry.attributes.position.needsUpdate = true;
        };
        updateParticles(0);
      } else if (viewMode === 'resistor') {
        const detailedResistor = addResistor(model, safeResistance, 1.35);
        detailedResistor.rotation.z = -0.08;
        pulseTarget = detailedResistor;

        const halo = new THREE.Mesh(
          new THREE.TorusGeometry(2.2, 0.035, 10, 56),
          new THREE.MeshBasicMaterial({ color: loadColor, transparent: true, opacity: 0.42 }),
        );
        halo.rotation.y = Math.PI / 2;
        model.add(halo);
      } else {
        const plateMaterial = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.86, roughness: 0.2 });
        [-3.6, 3.6].forEach((x, index) => {
          const plate = new THREE.Mesh(new THREE.BoxGeometry(0.24, 5.4, 4.2), plateMaterial);
          plate.position.x = x;
          model.add(plate);
          const charge = new THREE.PointLight(index === 0 ? 0xef4444 : 0x3b82f6, 15, 12, 2);
          charge.position.set(x, 0, 0);
          model.add(charge);
        });

        const fieldStrength = THREE.MathUtils.clamp(safeVoltage / 230, 0.45, 2.2);
        for (let row = -2; row <= 2; row += 1) {
          for (let depth = -1; depth <= 1; depth += 1) {
            const arrow = new THREE.ArrowHelper(
              new THREE.Vector3(1, 0, 0),
              new THREE.Vector3(-2.9, row * 0.8, depth * 1.05),
              5.8,
              0x60a5fa,
              0.28 * fieldStrength,
              0.16 * fieldStrength,
            );
            model.add(arrow);
          }
        }

        const center = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.72, 2),
          new THREE.MeshStandardMaterial({ color: loadColor, emissive: loadColor, emissiveIntensity: 0.7, wireframe: true }),
        );
        model.add(center);
        pulseTarget = center;
      }

      if (showMagneticField) {
        const opacity = 0.28 + Math.min(safeCurrent / 150, 0.5);
        for (let index = 0; index < 7; index += 1) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.15 + index * 0.22, 0.026, 10, 42),
            new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity }),
          );
          ring.rotation.y = Math.PI / 2;
          ring.position.x = -3.3 + index * 1.1;
          model.add(ring);
        }
      }

      if (showVectors && viewMode !== 'field') {
        for (let index = 0; index < 5; index += 1) {
          model.add(
            new THREE.ArrowHelper(
              new THREE.Vector3(1, 0, 0),
              new THREE.Vector3(-3.8 + index * 1.8, -2.5, 0),
              1.15,
              0x38bdf8,
              0.3,
              0.18,
            ),
          );
        }
      }

      return {
        animate: (_delta: number, elapsed: number) => {
          updateParticles?.(elapsed);
          powerLight.intensity = 8 + Math.min(16, safePower / 80) + Math.sin(elapsed * 3.3) * 1.2;
          if (pulseTarget) {
            const pulse = 1 + Math.sin(elapsed * 3) * 0.025;
            pulseTarget.scale.setScalar(pulse);
          }
        },
      };
    },
    [current, power, resistance, showMagneticField, showVectors, viewMode, voltage],
  );

  const viewport = useEngineeringViewport({
    buildModel,
    autoRotate: isAutoRotating,
    ariaLabel: `Interactive Ohm's law model showing ${safeNumber(voltage)} volts and ${safeNumber(current)} amperes`,
    initialRadius: 12,
    minRadius: 5,
    maxRadius: 28,
  });

  const modeButton = (mode: OhmsView, label: string, icon: React.ReactNode, active: string) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      aria-pressed={viewMode === mode}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${viewMode === mode ? active : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      {icon}{label}
    </button>
  );

  const preset = (mode: CameraPreset, label: string) => (
    <button type="button" onClick={() => viewport.setCameraPreset(mode)} className="rounded px-1.5 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white">
      {label}
    </button>
  );

  return (
    <section className="relative h-full min-h-[350px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <div ref={viewport.mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-slate-950/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-slate-950/95 to-transparent" />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex max-w-[calc(100%-44px)] gap-1 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
          {modeButton('circuit', 'Circuit', <CircuitBoard size={13} />, 'bg-blue-600 text-white')}
          {modeButton('resistor', 'Resistor', <Gauge size={13} />, 'bg-violet-600 text-white')}
          {modeButton('field', 'E-field', <Zap size={13} />, 'bg-cyan-600 text-white')}
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
          <button type="button" onClick={() => setIsAutoRotating((value) => !value)} aria-pressed={isAutoRotating} className={`rounded-lg p-1.5 ${isAutoRotating && !viewport.reducedMotion ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400 hover:text-white'}`} title={isAutoRotating ? 'Pause automatic orbit' : 'Start automatic orbit'}>
            {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button type="button" onClick={viewport.resetCamera} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" title="Reset viewpoint">
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="pointer-events-auto absolute left-3 top-14 z-20 flex gap-1 rounded-lg border border-slate-800 bg-slate-950/75 p-1 backdrop-blur">
        <button type="button" onClick={() => setShowMagneticField((value) => !value)} aria-pressed={showMagneticField} className={`rounded-md p-1.5 ${showMagneticField ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'}`} title="Toggle magnetic field">
          <Activity size={13} />
        </button>
        <button type="button" onClick={() => setShowVectors((value) => !value)} aria-pressed={showVectors} className={`rounded-md p-1.5 ${showVectors ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-white'}`} title="Toggle direction vectors">
          <Eye size={13} />
        </button>
        <button type="button" onClick={() => setShowLabels((value) => !value)} aria-pressed={showLabels} className={`rounded-md p-1.5 ${showLabels ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-white'}`} title="Toggle electrical labels">
          <Tag size={13} />
        </button>
      </div>

      <div className="pointer-events-auto absolute right-3 top-14 z-20 hidden gap-1 rounded-lg border border-slate-800 bg-slate-950/75 p-1 backdrop-blur sm:flex">
        {preset('iso', 'ISO')}{preset('top', 'TOP')}{preset('side', 'SIDE')}{preset('macro', 'MACRO')}
      </div>

      {showLabels && (
        <div className="pointer-events-none absolute left-3 top-24 z-10 hidden max-w-[235px] flex-col gap-1.5 sm:flex">
          <div className="rounded-lg border border-blue-500/25 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-blue-200 backdrop-blur">V = {safeNumber(voltage).toFixed(2)} V</div>
          <div className="rounded-lg border border-cyan-500/25 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-cyan-200 backdrop-blur">I = {safeNumber(current).toFixed(3)} A</div>
          <div className="rounded-lg border border-amber-500/25 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-amber-200 backdrop-blur">R = {safeNumber(resistance).toFixed(2)} Ω · P = {safeNumber(power).toFixed(2)} W</div>
        </div>
      )}

      {viewport.status !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-slate-950/75 p-6 text-center backdrop-blur-sm">
          <div>
            <Box className="mx-auto mb-2 text-blue-400" size={24} />
            <p className="text-sm font-bold text-white">{viewport.status === 'context-lost' ? '3D context interrupted' : viewport.status === 'unavailable' ? 'WebGL is unavailable' : 'Preparing circuit model…'}</p>
            <p className="mt-1 text-xs text-slate-400">The Ohm’s law results remain available.</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[10px] font-mono backdrop-blur-md sm:text-xs">
          <BatteryCharging size={13} className="text-blue-300" />
          <strong className="text-white">{safeNumber(voltage).toFixed(1)} V</strong>
          <span className="text-slate-600">·</span>
          <strong className="text-cyan-200">{safeNumber(current).toFixed(2)} A</strong>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[10px] font-mono backdrop-blur-md sm:text-xs">
          <Zap size={13} className="text-amber-400" />
          <strong className="text-amber-200">{safeNumber(power).toFixed(1)} W</strong>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300">{solveMode}</span>
          <span className="hidden text-slate-500 md:inline">· {viewport.zoomPercent}%</span>
        </div>
      </div>

      {viewport.reducedMotion && <div className="pointer-events-none absolute bottom-14 right-3 rounded bg-slate-950/75 px-2 py-1 text-[9px] text-slate-400">Reduced motion</div>}
    </section>
  );
};
