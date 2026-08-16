import React, { useCallback, useState } from 'react';
import * as THREE from 'three';
import {
  Activity,
  Eye,
  Flame,
  Gauge,
  Layers3,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Tag,
  Zap,
} from 'lucide-react';
import {
  useEngineeringViewport,
  type CameraPreset,
} from './three/useEngineeringViewport';

interface Cable3DProps {
  system: 'single' | 'three';
  mm2: number;
  diameterMm: number;
  material: 'copper' | 'aluminium';
  cableType: string;
  installMethod: string;
  designCurrent: number;
  requiredCapacity: number;
  powerLossWatts: number;
  voltageDropPct: number;
  isPass: boolean;
  standard?: 'IEC' | 'NEC';
}

type CableView = 'cutaway' | 'conduit' | 'thermal';

const finiteOr = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;

function cylinderAlongX(radius: number, length: number, segments = 32, openEnded = false) {
  const geometry = new THREE.CylinderGeometry(radius, radius, length, segments, 1, openEnded);
  geometry.rotateZ(Math.PI / 2);
  return geometry;
}

export const Cable3DVisualizer: React.FC<Cable3DProps> = ({
  system,
  mm2,
  diameterMm,
  material,
  cableType,
  installMethod,
  designCurrent,
  requiredCapacity,
  powerLossWatts,
  voltageDropPct,
  isPass,
  standard = 'IEC',
}) => {
  const [viewMode, setViewMode] = useState<CableView>('cutaway');
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [showMagneticField, setShowMagneticField] = useState(false);
  const [showVectors, setShowVectors] = useState(false);
  const [showLabels, setShowLabels] = useState(true);

  const buildModel = useCallback(
    (model: THREE.Group) => {
      const safeArea = Math.max(0.5, finiteOr(mm2, 2.5));
      const safeCurrent = Math.max(0, finiteOr(designCurrent, 0));
      const safeLoss = Math.max(0, finiteOr(powerLossWatts, 0));
      const cableLength = 8.6;
      const scale = THREE.MathUtils.clamp(Math.sqrt(safeArea) * 0.23, 0.62, 1.85);
      const cableRadius = 1.25 * scale;
      const coreRadius = cableRadius * (system === 'three' ? 0.29 : 0.34);
      const coreOffset = cableRadius * 0.52;
      const conductorColor = material === 'copper' ? 0xd97706 : 0xb8c4d4;
      const heatColor = new THREE.Color(isPass ? (safeLoss > 80 ? 0xf59e0b : 0x22c55e) : 0xef4444);

      model.rotation.z = -0.04;

      const fillLight = new THREE.PointLight(heatColor, viewMode === 'thermal' ? 18 : 5, 16, 2);
      fillLight.position.set(0, 1, 2);
      model.add(fillLight);

      // Outer sheath remains translucent in cutaway mode so conductor layout is legible.
      const sheathMaterial = new THREE.MeshPhysicalMaterial({
        color: cableType.includes('SWA') ? 0x1b2638 : 0x24354e,
        roughness: 0.46,
        metalness: cableType.includes('SWA') ? 0.35 : 0.08,
        transparent: viewMode === 'cutaway',
        opacity: viewMode === 'cutaway' ? 0.34 : 0.94,
        transmission: viewMode === 'cutaway' ? 0.08 : 0,
        side: THREE.DoubleSide,
      });
      const sheath = new THREE.Mesh(
        cylinderAlongX(cableRadius, cableLength, 48, viewMode === 'cutaway'),
        sheathMaterial,
      );
      sheath.castShadow = true;
      sheath.receiveShadow = true;
      model.add(sheath);

      if (cableType.includes('SWA')) {
        const armorGeometry = cylinderAlongX(0.055 * scale, cableLength - 0.1, 8);
        const armorMaterial = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.92,
          roughness: 0.22,
        });
        for (let index = 0; index < 22; index += 1) {
          const angle = (index / 22) * Math.PI * 2;
          const armor = new THREE.Mesh(armorGeometry, armorMaterial);
          armor.position.set(0, Math.sin(angle) * cableRadius * 0.9, Math.cos(angle) * cableRadius * 0.9);
          model.add(armor);
        }
      }

      const requiresConduit =
        viewMode === 'conduit' || installMethod.toLowerCase().includes('conduit');
      if (requiresConduit) {
        const conduit = new THREE.Mesh(
          cylinderAlongX(cableRadius * 1.55, cableLength + 1.2, 48, true),
          new THREE.MeshPhysicalMaterial({
            color: 0x64748b,
            metalness: 0.55,
            roughness: 0.34,
            transparent: true,
            opacity: viewMode === 'conduit' ? 0.28 : 0.14,
            side: THREE.DoubleSide,
          }),
        );
        model.add(conduit);
      }

      const coreColors =
        standard === 'NEC'
          ? system === 'three'
            ? [0x171717, 0xdc2626, 0x2563eb, 0xf8fafc, 0x16a34a]
            : [0x171717, 0xf8fafc, 0x16a34a]
          : system === 'three'
            ? [0x7c2d12, 0x171717, 0x64748b, 0x2563eb, 0x16a34a]
            : [0x7c2d12, 0x2563eb, 0x16a34a];

      const conductorGeometry = cylinderAlongX(coreRadius * 0.56, cableLength + 0.34, 20);
      const conductorMaterial = new THREE.MeshStandardMaterial({
        color: conductorColor,
        metalness: 0.88,
        roughness: 0.24,
      });
      const particles: number[] = [];

      coreColors.forEach((color, index) => {
        const angle = (index / coreColors.length) * Math.PI * 2;
        const y = Math.sin(angle) * coreOffset;
        const z = Math.cos(angle) * coreOffset;
        const insulation = new THREE.Mesh(
          cylinderAlongX(coreRadius, cableLength - 0.24, 32),
          new THREE.MeshStandardMaterial({
            color,
            roughness: 0.42,
            metalness: 0.03,
            transparent: viewMode === 'cutaway',
            opacity: viewMode === 'cutaway' ? 0.78 : 1,
          }),
        );
        insulation.position.set(0, y, z);
        insulation.castShadow = true;
        model.add(insulation);

        const conductor = new THREE.Mesh(conductorGeometry, conductorMaterial);
        conductor.position.set(0, y, z);
        conductor.castShadow = true;
        model.add(conductor);

        for (let particle = 0; particle < 22; particle += 1) {
          particles.push(-cableLength / 2 + (particle / 22) * cableLength, y, z);
        }
      });

      const particlePositions = new Float32Array(particles);
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      const particleCloud = new THREE.Points(
        particleGeometry,
        new THREE.PointsMaterial({
          color: isPass ? 0x7dd3fc : 0xfca5a5,
          size: 0.12,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      model.add(particleCloud);

      let thermalShell: THREE.Mesh | null = null;
      if (viewMode === 'thermal') {
        thermalShell = new THREE.Mesh(
          cylinderAlongX(cableRadius * 1.72, cableLength, 32, true),
          new THREE.MeshBasicMaterial({
            color: heatColor,
            transparent: true,
            opacity: THREE.MathUtils.clamp(0.2 + safeLoss / 300, 0.22, 0.62),
            wireframe: true,
            side: THREE.DoubleSide,
          }),
        );
        model.add(thermalShell);
      }

      if (showMagneticField) {
        const fieldColor = safeCurrent > 50 ? 0xfb7185 : safeCurrent > 25 ? 0xfbbf24 : 0x22d3ee;
        for (let index = 0; index < 7; index += 1) {
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(cableRadius * (1.25 + index * 0.13), 0.025, 10, 40),
            new THREE.MeshBasicMaterial({
              color: fieldColor,
              transparent: true,
              opacity: 0.28 + Math.min(safeCurrent / 160, 0.45),
            }),
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
              new THREE.Vector3(-3.7 + index * 1.75, cableRadius * 1.32, 0),
              1.15,
              0x38bdf8,
              0.3,
              0.18,
            ),
          );
        }
      }

      return {
        animate: (delta: number, elapsed: number) => {
          const speed = Math.max(0.22, Math.min(2.8, safeCurrent / 28)) * delta;
          for (let index = 0; index < particlePositions.length; index += 3) {
            particlePositions[index] += speed;
            if (particlePositions[index] > cableLength / 2) particlePositions[index] = -cableLength / 2;
          }
          particleGeometry.attributes.position.needsUpdate = true;
          fillLight.intensity = (viewMode === 'thermal' ? 16 : 5) + Math.sin(elapsed * 3.2) * 1.2;
          if (thermalShell) {
            const pulse = 1 + Math.sin(elapsed * 2.4) * 0.018;
            thermalShell.scale.set(1, pulse, pulse);
          }
        },
      };
    },
    [
      cableType,
      designCurrent,
      installMethod,
      isPass,
      material,
      mm2,
      powerLossWatts,
      showMagneticField,
      showVectors,
      standard,
      system,
      viewMode,
    ],
  );

  const viewport = useEngineeringViewport({
    buildModel,
    autoRotate: isAutoRotating,
    ariaLabel: `Interactive 3D ${standard} cable model, ${mm2} square millimetres`,
    initialRadius: 12,
    minRadius: 5,
    maxRadius: 27,
  });

  const viewButton = (
    mode: CableView,
    label: string,
    icon: React.ReactNode,
    activeClass: string,
  ) => (
    <button
      type="button"
      onClick={() => setViewMode(mode)}
      aria-pressed={viewMode === mode}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
        viewMode === mode ? activeClass : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const presetButton = (preset: CameraPreset, label: string) => (
    <button
      type="button"
      onClick={() => viewport.setCameraPreset(preset)}
      className="rounded px-1.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white"
    >
      {label}
    </button>
  );

  return (
    <section className="relative h-full min-h-[360px] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      <div ref={viewport.mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-slate-950/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-slate-950/95 to-transparent" />

      <div className="pointer-events-none absolute inset-x-3 top-3 z-20 flex items-start justify-between gap-2">
        <div className="pointer-events-auto flex max-w-[calc(100%-44px)] items-center gap-1 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-xl backdrop-blur-md">
          {viewButton('cutaway', 'Cutaway', <Eye size={13} />, 'bg-blue-600 text-white')}
          {viewButton('conduit', 'Conduit', <Shield size={13} />, 'bg-cyan-600 text-white')}
          {viewButton('thermal', 'Thermal', <Flame size={13} />, 'bg-amber-600 text-white')}
        </div>

        <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-slate-700/80 bg-slate-900/90 p-1 shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setIsAutoRotating((value) => !value)}
            aria-pressed={isAutoRotating}
            className={`rounded-lg p-1.5 transition ${
              isAutoRotating && !viewport.reducedMotion
                ? 'bg-blue-500/15 text-blue-300'
                : 'text-slate-400 hover:text-white'
            }`}
            title={isAutoRotating ? 'Pause automatic orbit' : 'Start automatic orbit'}
          >
            {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            onClick={viewport.resetCamera}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            title="Reset 3D viewpoint"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="pointer-events-auto absolute right-3 top-14 z-20 hidden items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/75 p-1 backdrop-blur sm:flex">
        {presetButton('iso', 'ISO')}
        {presetButton('top', 'TOP')}
        {presetButton('side', 'SIDE')}
        {presetButton('macro', 'MACRO')}
      </div>

      <div className="absolute left-3 top-14 z-20 flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/75 p-1 backdrop-blur">
        <button
          type="button"
          onClick={() => setShowMagneticField((value) => !value)}
          aria-pressed={showMagneticField}
          className={`rounded-md p-1.5 transition ${showMagneticField ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-white'}`}
          title="Toggle magnetic field overlay"
        >
          <Activity size={13} />
        </button>
        <button
          type="button"
          onClick={() => setShowVectors((value) => !value)}
          aria-pressed={showVectors}
          className={`rounded-md p-1.5 transition ${showVectors ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-white'}`}
          title="Toggle current vectors"
        >
          <Zap size={13} />
        </button>
        <button
          type="button"
          onClick={() => setShowLabels((value) => !value)}
          aria-pressed={showLabels}
          className={`rounded-md p-1.5 transition ${showLabels ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500 hover:text-white'}`}
          title="Toggle cable labels"
        >
          <Tag size={13} />
        </button>
      </div>

      {showLabels && (
        <div className="pointer-events-none absolute left-3 top-24 z-10 hidden max-w-[240px] flex-col gap-1.5 sm:flex">
          <div className="rounded-lg border border-amber-500/25 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-amber-200 backdrop-blur">
            {material === 'copper' ? 'Copper' : 'Aluminium'} conductor · {mm2} mm²
          </div>
          <div className="rounded-lg border border-blue-500/25 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-blue-200 backdrop-blur">
            {standard} core identification · {system === 'three' ? '3-phase' : '1-phase'}
          </div>
          <div className="rounded-lg border border-slate-600/40 bg-slate-950/80 px-2.5 py-1 text-[10px] font-mono text-slate-300 backdrop-blur">
            Ø {finiteOr(diameterMm, 0).toFixed(1)} mm · {cableType}
          </div>
        </div>
      )}

      {viewport.status !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 z-30 grid place-items-center bg-slate-950/75 p-6 text-center backdrop-blur-sm">
          <div>
            <Layers3 className="mx-auto mb-2 text-blue-400" size={24} />
            <p className="text-sm font-bold text-white">
              {viewport.status === 'context-lost'
                ? '3D context interrupted'
                : viewport.status === 'unavailable'
                  ? 'WebGL is unavailable'
                  : 'Preparing engineering model…'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {viewport.status === 'context-lost'
                ? 'The browser will restore this view automatically.'
                : 'Calculation results remain available below.'}
            </p>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20 flex flex-wrap items-end justify-between gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[10px] font-mono shadow-xl backdrop-blur-md sm:text-xs">
          <Gauge size={13} className="text-blue-300" />
          <span className="text-slate-400">Load</span>
          <strong className="text-white">{finiteOr(designCurrent, 0).toFixed(1)} A</strong>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">Required</span>
          <strong className="text-emerald-300">{finiteOr(requiredCapacity, 0).toFixed(1)} A</strong>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 text-[10px] font-mono shadow-xl backdrop-blur-md sm:text-xs">
          <Flame size={13} className="text-amber-400" />
          <strong className="text-amber-200">{finiteOr(powerLossWatts, 0).toFixed(1)} W</strong>
          <span className="text-slate-600">·</span>
          <strong className={isPass ? 'text-emerald-300' : 'text-red-300'}>
            {finiteOr(voltageDropPct, 0).toFixed(2)}% drop
          </strong>
          <span className="hidden text-slate-500 md:inline">· {viewport.zoomPercent}%</span>
        </div>
      </div>

      {viewport.reducedMotion && (
        <div className="pointer-events-none absolute bottom-14 right-3 z-20 rounded-md bg-slate-950/75 px-2 py-1 text-[9px] font-semibold text-slate-400">
          Reduced motion
        </div>
      )}
    </section>
  );
};
