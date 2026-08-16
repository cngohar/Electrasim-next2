import React, { useCallback, useState } from 'react';
import * as THREE from 'three';
import {
  Activity,
  Box,
  Eye,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Route,
  Tag,
  Zap,
} from 'lucide-react';
import {
  useEngineeringViewport,
  type CameraPreset,
} from './three/useEngineeringViewport';

interface Wire3DProps {
  awg: string;
  mm2: number;
  current: number;
  voltage: number;
  distance: number;
  material: 'copper' | 'aluminium';
  vDrop: number;
  vDropPct: number;
  powerLossWatts: number;
  isPass: boolean;
}

type WireView = 'crossSection' | 'routeFlow' | 'thermal';

const safeNumber = (value: number, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

function xCylinder(radius: number, length: number, segments = 32, openEnded = false) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments, 1, openEnded);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}

export const Wire3DVisualizer: React.FC<Wire3DProps> = ({
  awg,
  mm2,
  current,
  voltage,
  distance,
  material,
  vDrop,
  vDropPct,
  powerLossWatts,
  isPass,
}) => {
  const [viewMode, setViewMode] = useState<WireView>('crossSection');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showMagneticField, setShowMagneticField] = useState(false);
  const [showVectors, setShowVectors] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const buildModel = useCallback(
    (model: THREE.Group) => {
      const safeArea = Math.max(0.25, safeNumber(mm2, 2.5));
      const safeCurrent = Math.max(0, safeNumber(current));
      const safeLoss = Math.max(0, safeNumber(powerLossWatts));
      const radius = THREE.MathUtils.clamp(Math.sqrt(safeArea) * 0.16, 0.42, 1.65);
      const conductorColor = material === 'copper' ? 0xd97706 : 0xb9c5d4;
      const heatColor = isPass ? (safeLoss > 55 ? 0xf59e0b : 0x22c55e) : 0xef4444;
      const heatLight = new THREE.PointLight(heatColor, 8, 18, 2);
      heatLight.position.set(0, 1, 2);
      model.add(heatLight);

      let animateParticles: ((elapsed: number) => void) | null = null;
      let pulsingObject: THREE.Object3D | null = null;

      if (viewMode === 'crossSection') {
        const wireLength = 8.5;
        const insulation = new THREE.Mesh(
          xCylinder(radius * 1.72, wireLength, 48, true),
          new THREE.MeshPhysicalMaterial({
            color: isPass ? 0x2563eb : 0xb91c1c,
            roughness: 0.48,
            transparent: true,
            opacity: 0.48,
            transmission: 0.06,
            side: THREE.DoubleSide,
          }),
        );
        model.add(insulation);

        const strandGeometry = xCylinder(radius * 0.24, wireLength + 0.24, 14);
        const strandMaterial = new THREE.MeshStandardMaterial({
          color: conductorColor,
          metalness: 0.94,
          roughness: 0.2,
        });
        const strandLayout: Array<[number, number]> = [[0, 0]];
        for (let ring = 1; ring <= 2; ring += 1) {
          const count = ring * 6;
          for (let index = 0; index < count; index += 1) {
            const angle = (index / count) * Math.PI * 2;
            strandLayout.push([
              Math.sin(angle) * radius * 0.48 * ring,
              Math.cos(angle) * radius * 0.48 * ring,
            ]);
          }
        }
        strandLayout.forEach(([y, z]) => {
          const strand = new THREE.Mesh(strandGeometry, strandMaterial);
          strand.position.set(0, y, z);
          strand.castShadow = true;
          model.add(strand);
        });

        const positions = new Float32Array(72 * 3);
        for (let index = 0; index < 72; index += 1) {
          const strand = strandLayout[index % strandLayout.length];
          positions[index * 3] = -wireLength / 2 + ((index * 0.618) % 1) * wireLength;
          positions[index * 3 + 1] = strand[0];
          positions[index * 3 + 2] = strand[1];
        }
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        model.add(
          new THREE.Points(
            particleGeometry,
            new THREE.PointsMaterial({
              color: isPass ? 0x67e8f9 : 0xfda4af,
              size: 0.12,
              transparent: true,
              opacity: 0.95,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          ),
        );
        animateParticles = (elapsed) => {
          const offset = elapsed * Math.max(0.25, safeCurrent / 24);
          for (let index = 0; index < positions.length; index += 3) {
            positions[index] = -wireLength / 2 + ((index * 0.618 + offset) % wireLength);
          }
          particleGeometry.attributes.position.needsUpdate = true;
        };
      } else if (viewMode === 'routeFlow') {
        const points = [
          new THREE.Vector3(-6, -1.1, 0),
          new THREE.Vector3(-4, 1.2, 0.8),
          new THREE.Vector3(-1.5, 0.6, -0.7),
          new THREE.Vector3(1.2, -0.9, -0.6),
          new THREE.Vector3(4, 1.1, 0.7),
          new THREE.Vector3(6, 0.2, 0),
        ];
        const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.34);
        const route = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 160, radius * 0.62, 18, false),
          new THREE.MeshStandardMaterial({
            color: conductorColor,
            metalness: 0.84,
            roughness: 0.28,
          }),
        );
        route.castShadow = true;
        model.add(route);

        const sheath = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 160, radius, 18, false),
          new THREE.MeshPhysicalMaterial({
            color: 0x2563eb,
            roughness: 0.45,
            transparent: true,
            opacity: 0.34,
            side: THREE.DoubleSide,
          }),
        );
        model.add(sheath);

        const terminalMaterial = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.62, roughness: 0.34 });
        [points[0], points.at(-1)!].forEach((point, index) => {
          const terminal = new THREE.Mesh(
            new THREE.BoxGeometry(index === 0 ? 1.7 : 2, index === 0 ? 2.5 : 2, 2),
            terminalMaterial,
          );
          terminal.position.copy(point);
          terminal.castShadow = true;
          model.add(terminal);
        });

        const particleCount = 90;
        const positions = new Float32Array(particleCount * 3);
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        model.add(
          new THREE.Points(
            particleGeometry,
            new THREE.PointsMaterial({
              color: 0x7dd3fc,
              size: 0.16,
              transparent: true,
              opacity: 0.95,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
            }),
          ),
        );
        animateParticles = (elapsed) => {
          const speed = 0.045 + Math.min(safeCurrent / 1600, 0.14);
          for (let index = 0; index < particleCount; index += 1) {
            const point = curve.getPoint(((index / particleCount) + elapsed * speed) % 1);
            positions[index * 3] = point.x;
            positions[index * 3 + 1] = point.y;
            positions[index * 3 + 2] = point.z;
          }
          particleGeometry.attributes.position.needsUpdate = true;
        };
        animateParticles(0);
      } else {
        const body = new THREE.Mesh(
          xCylinder(radius * 1.4, 9, 48),
          new THREE.MeshStandardMaterial({
            color: heatColor,
            emissive: heatColor,
            emissiveIntensity: THREE.MathUtils.clamp(0.15 + safeLoss / 90, 0.2, 1.3),
            roughness: 0.32,
          }),
        );
        model.add(body);
        pulsingObject = body;

        for (let index = 1; index <= 5; index += 1) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius * (1.45 + index * 0.46), 0.035, 10, 42),
            new THREE.MeshBasicMaterial({
              color: heatColor,
              transparent: true,
              opacity: 0.66 / index,
            }),
          );
          ring.rotation.y = Math.PI / 2;
          ring.position.x = -3 + index * 1.05;
          model.add(ring);
        }
      }

      if (showMagneticField) {
        const fieldColor = safeCurrent > 40 ? 0xfb7185 : safeCurrent > 18 ? 0xfbbf24 : 0x22d3ee;
        for (let index = 0; index < 7; index += 1) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(radius * (1.7 + index * 0.18), 0.025, 10, 38),
            new THREE.MeshBasicMaterial({ color: fieldColor, transparent: true, opacity: 0.48 }),
          );
          ring.rotation.y = Math.PI / 2;
          ring.position.x = -3.3 + index * 1.1;
          model.add(ring);
        }
      }

      if (showVectors) {
        for (let index = 0; index < 5; index += 1) {
          model.add(
            new THREE.ArrowHelper(
              new THREE.Vector3(1, 0, 0),
              new THREE.Vector3(-3.6 + index * 1.7, radius * 2.1, 0),
              1.1,
              0x38bdf8,
              0.3,
              0.18,
            ),
          );
        }
      }

      return {
        animate: (_delta: number, elapsed: number) => {
          animateParticles?.(elapsed);
          heatLight.intensity = 7 + Math.sin(elapsed * 3.4) * 1.1;
          if (pulsingObject) {
            const pulse = 1 + Math.sin(elapsed * 2.5) * 0.025;
            pulsingObject.scale.set(1, pulse, pulse);
          }
        },
      };
    },
    [current, isPass, material, mm2, powerLossWatts, showMagneticField, showVectors, viewMode],
  );

  const viewport = useEngineeringViewport({
    buildModel,
    autoRotate: isAutoRotating,
    ariaLabel: `Interactive 3D wire model for ${awg}, ${mm2} square millimetres`,
    initialRadius: 12,
    minRadius: 5,
    maxRadius: 28,
  });

  const modeButton = (mode: WireView, label: string, icon: React.ReactNode, active: string) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      aria-pressed={viewMode === mode}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
        viewMode === mode ? active : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const preset = (mode: CameraPreset, label: string) => (
    <button
      type="button"
      onClick={() => viewport.setCameraPreset(mode)}
      className="rounded px-1.5 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
    >
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
          {modeButton('crossSection', 'Section', <Eye size={13} />, 'bg-blue-600 text-white')}
          {modeButton('routeFlow', 'Route flow', <Route size={13} />, 'bg-cyan-600 text-white')}
          {modeButton('thermal', 'Thermal', <Flame size={13} />, 'bg-amber-600 text-white')}
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsAutoRotating((value) => !value)}
            aria-pressed={isAutoRotating}
            className={`rounded-lg p-1.5 ${isAutoRotating && !viewport.reducedMotion ? 'bg-blue-500/15 text-blue-300' : 'text-slate-400 hover:text-white'}`}
            title={isAutoRotating ? 'Pause automatic orbit' : 'Start automatic orbit'}
          >
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
        <button type="button" onClick={() => setShowVectors((value) => !value)} aria-pressed={showVectors} className={`rounded-md p-1.5 ${showVectors ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-white'}`} title="Toggle flow vectors">
          <Zap size={13} />
        </button>
        <button type="button" onClick={() => setShowLabels((value) => !value)} aria-pressed={showLabels} className={`rounded-md p-1.5 ${showLabels ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-white'}`} title="Toggle model labels">
          <Tag size={13} />
        </button>
      </div>

      <div className="pointer-events-auto absolute right-3 top-14 z-20 hidden gap-1 rounded-lg border border-slate-800 bg-slate-950/75 p-1 backdrop-blur sm:flex">
        {preset('iso', 'ISO')}{preset('top', 'TOP')}{preset('side', 'SIDE')}{preset('macro', 'MACRO')}
      </div>

      {showLabels && (
        <div className="pointer-events-none absolute left-3 top-24 z-10 hidden max-w-[235px] flex-col gap-1.5 sm:flex">
          <div className="rounded-lg border border-amber-500/25 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-amber-200 backdrop-blur">
            {material === 'copper' ? 'Cu' : 'Al'} conductor · {awg} / {mm2} mm²
          </div>
          <div className="rounded-lg border border-blue-500/25 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-blue-200 backdrop-blur">
            Run length {safeNumber(distance).toFixed(1)} m · {safeNumber(voltage).toFixed(0)} V
          </div>
        </div>
      )}

      {viewport.status !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-slate-950/75 p-6 text-center backdrop-blur-sm">
          <div>
            <Box className="mx-auto mb-2 text-blue-400" size={24} />
            <p className="text-sm font-bold text-white">
              {viewport.status === 'context-lost' ? '3D context interrupted' : viewport.status === 'unavailable' ? 'WebGL is unavailable' : 'Preparing wire model…'}
            </p>
            <p className="mt-1 text-xs text-slate-400">The electrical results remain available.</p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[10px] font-mono backdrop-blur-md sm:text-xs">
          <Zap size={13} className="text-cyan-300" />
          <strong className="text-white">{safeNumber(current).toFixed(1)} A</strong>
          <span className="text-slate-600">·</span>
          <span className="text-slate-300">{safeNumber(vDrop).toFixed(2)} V drop</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[10px] font-mono backdrop-blur-md sm:text-xs">
          <Flame size={13} className="text-amber-400" />
          <strong className="text-amber-200">{safeNumber(powerLossWatts).toFixed(1)} W</strong>
          <span className="text-slate-600">·</span>
          <strong className={isPass ? 'text-emerald-300' : 'text-red-300'}>{safeNumber(vDropPct).toFixed(2)}%</strong>
          <span className="hidden text-slate-500 md:inline">· {viewport.zoomPercent}%</span>
        </div>
      </div>

      {viewport.reducedMotion && <div className="pointer-events-none absolute bottom-14 right-3 rounded bg-slate-950/75 px-2 py-1 text-[9px] text-slate-400">Reduced motion</div>}
    </section>
  );
};
