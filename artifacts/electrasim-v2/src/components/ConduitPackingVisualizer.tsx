import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Maximize2, 
  RotateCcw, 
  Play, 
  Pause, 
  Layers, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Box, 
  Gauge, 
  Sliders,
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  ConductorItem, 
  ConductorDimensionSpec, 
  checkJamRatio, 
  ConduitStandard 
} from '@/lib/conduitData';

export interface PackedCircle {
  id: string;
  gauge: string;
  insulation: string;
  type: string;
  color: string;
  x: number; // Center offset in mm
  y: number; // Center offset in mm
  radiusMm: number;
  outerDiameterMm: number;
  areaMm2: number;
}

interface ConduitPackingVisualizerProps {
  standard: ConduitStandard;
  racewayShape: 'circle' | 'rectangle';
  racewayName: string;
  insideDiameterMm: number;
  trunkingWidthMm?: number;
  trunkingHeightMm?: number;
  totalConduitAreaMm2: number;
  totalConductorsAreaMm2: number;
  fillPercentage: number;
  maxAllowedFillPct: number;
  conductorsList: ConductorItem[];
  conductorSpecsMap: Record<string, ConductorDimensionSpec>;
  isDark: boolean;
}

export const ConduitPackingVisualizer: React.FC<ConduitPackingVisualizerProps> = ({
  standard,
  racewayShape,
  racewayName,
  insideDiameterMm,
  trunkingWidthMm = 50,
  trunkingHeightMm = 50,
  totalConduitAreaMm2,
  totalConductorsAreaMm2,
  fillPercentage,
  maxAllowedFillPct,
  conductorsList,
  conductorSpecsMap,
  isDark
}) => {
  const [activeView, setActiveView] = useState<'2d' | '3d'>('2d');
  const [selectedWire, setSelectedWire] = useState<PackedCircle | null>(null);
  const [hoveredWire, setHoveredWire] = useState<PackedCircle | null>(null);
  const [showFillLimitRing, setShowFillLimitRing] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [is3dRotating, setIs3dRotating] = useState(true);
  const [cutawayOpacity, setCutawayOpacity] = useState(0.4);

  // 3D Canvas Mount Ref
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);

  // -------------------------------------------------------------
  // Flatten individual conductor instances for packing
  // -------------------------------------------------------------
  const flattenedWires = useMemo(() => {
    const list: Array<{
      id: string;
      gauge: string;
      insulation: string;
      type: string;
      color: string;
      radiusMm: number;
      outerDiameterMm: number;
      areaMm2: number;
    }> = [];

    conductorsList.forEach((item, itemIdx) => {
      const key = `${item.gauge}_${item.insulation}`;
      const spec = conductorSpecsMap[key];
      const od = spec ? spec.outerDiameterMm : 4.0;
      const radius = od / 2;
      const area = spec ? spec.areaMm2 : Math.PI * radius * radius;

      // Determine wire color based on standard & type
      let defaultColor = '#3b82f6';
      if (item.color) {
        defaultColor = item.color;
      } else if (item.type === 'phase') {
        if (standard === 'NEC') {
          // US Phase colors: Black, Red, Blue
          const phaseColors = ['#1e293b', '#ef4444', '#2563eb'];
          defaultColor = phaseColors[itemIdx % 3];
        } else {
          // IEC Phase colors: Brown, Black, Grey
          const phaseColors = ['#854d0e', '#1e293b', '#64748b'];
          defaultColor = phaseColors[itemIdx % 3];
        }
      } else if (item.type === 'neutral') {
        defaultColor = standard === 'NEC' ? '#f8fafc' : '#3b82f6'; // White for NEC, Blue for IEC
      } else if (item.type === 'ground') {
        defaultColor = '#10b981'; // Green / Earth
      } else if (item.type === 'control') {
        defaultColor = '#f59e0b'; // Orange / Amber
      }

      for (let i = 0; i < item.count; i++) {
        list.push({
          id: `${item.id}-${i}`,
          gauge: item.gauge,
          insulation: item.insulation,
          type: item.type,
          color: defaultColor,
          radiusMm: radius,
          outerDiameterMm: od,
          areaMm2: area
        });
      }
    });

    return list;
  }, [conductorsList, conductorSpecsMap, standard]);

  // -------------------------------------------------------------
  // Physics-based Circle Packing Algorithm
  // -------------------------------------------------------------
  const packedCircles: PackedCircle[] = useMemo(() => {
    if (flattenedWires.length === 0) return [];

    const totalRadius = insideDiameterMm / 2;
    const isRect = racewayShape === 'rectangle';
    const halfW = trunkingWidthMm / 2;
    const halfH = trunkingHeightMm / 2;

    // Initialize positions in a circle/box with mild jitter
    const nodes: PackedCircle[] = flattenedWires.map((w, idx) => {
      const angle = (idx / Math.max(1, flattenedWires.length)) * Math.PI * 2;
      const dist = (idx % 3) * (totalRadius * 0.25);
      return {
        ...w,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - (isRect ? halfH * 0.3 : totalRadius * 0.2) // slight downward gravity bias
      };
    });

    // Iterative relaxation / collision resolution steps
    const iterations = 120;
    for (let iter = 0; iter < iterations; iter++) {
      // 1. Pairwise repulsion between circles to prevent overlap
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
          const minDist = n1.radiusMm + n2.radiusMm + 0.15; // 0.15mm air gap buffer

          if (dist < minDist) {
            const overlap = (minDist - dist) * 0.5;
            const nx = dx / dist;
            const ny = dy / dist;
            n1.x -= nx * overlap;
            n1.y -= ny * overlap;
            n2.x += nx * overlap;
            n2.y += ny * overlap;
          }
        }
      }

      // 2. Boundary constraint: Keep circles inside conduit wall or trunking box
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (isRect) {
          // Rectangular trunking boundary
          const margin = 0.5;
          const minX = -halfW + n.radiusMm + margin;
          const maxX = halfW - n.radiusMm - margin;
          const minY = -halfH + n.radiusMm + margin;
          const maxY = halfH - n.radiusMm - margin;

          if (n.x < minX) n.x = minX;
          if (n.x > maxX) n.x = maxX;
          if (n.y < minY) n.y = minY;
          if (n.y > maxY) n.y = maxY;
        } else {
          // Circular conduit boundary
          const distFromCenter = Math.sqrt(n.x * n.x + n.y * n.y);
          const maxDist = totalRadius - n.radiusMm - 0.2;
          if (distFromCenter > maxDist && maxDist > 0) {
            const angle = Math.atan2(n.y, n.x);
            n.x = Math.cos(angle) * maxDist;
            n.y = Math.sin(angle) * maxDist;
          }
        }

        // Slight gravity pulling down towards bottom of raceway
        n.y -= 0.08;
      }
    }

    return nodes;
  }, [flattenedWires, insideDiameterMm, racewayShape, trunkingWidthMm, trunkingHeightMm]);

  // Jam Ratio Check for 3-conductor bundle
  const jamInfo = useMemo(() => {
    if (flattenedWires.length === 3) {
      const avgOd = flattenedWires.reduce((acc, w) => acc + w.outerDiameterMm, 0) / 3;
      return checkJamRatio(insideDiameterMm, avgOd, 3);
    }
    return null;
  }, [flattenedWires, insideDiameterMm]);

  // -------------------------------------------------------------
  // Three.js 3D Isometric View Setup
  // -------------------------------------------------------------
  useEffect(() => {
    if (activeView !== '3d' || !mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(40, 35, 75);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(50, 60, 40);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-40, -20, -30);
    scene.add(dirLight2);

    // Group for all raceway & conductor meshes
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    groupRef.current = mainGroup;

    // 1. Build Raceway 3D Geometry
    const conduitLength = 80;
    const rConduit = (insideDiameterMm / 2) || 10;
    const wallThick = 2.0;

    if (racewayShape === 'rectangle') {
      const w = trunkingWidthMm;
      const h = trunkingHeightMm;
      const boxGeo = new THREE.BoxGeometry(w + wallThick * 2, h + wallThick * 2, conduitLength);
      const boxMat = new THREE.MeshPhysicalMaterial({
        color: isDark ? 0x64748b : 0x94a3b8,
        metalness: 0.8,
        roughness: 0.3,
        transparent: true,
        opacity: cutawayOpacity,
        side: THREE.DoubleSide
      });
      const boxMesh = new THREE.Mesh(boxGeo, boxMat);
      mainGroup.add(boxMesh);
    } else {
      // Cylindrical Conduit with cutaway section
      const cylGeo = new THREE.CylinderGeometry(
        rConduit + wallThick, 
        rConduit + wallThick, 
        conduitLength, 
        48, 
        1, 
        true, 
        0, 
        Math.PI * 1.5 // 270 degree cutaway so wires inside are visible
      );
      cylGeo.rotateX(Math.PI / 2);

      const cylMat = new THREE.MeshPhysicalMaterial({
        color: isDark ? 0x94a3b8 : 0xcfd8dc,
        metalness: 0.7,
        roughness: 0.25,
        transparent: true,
        opacity: cutawayOpacity,
        side: THREE.DoubleSide
      });
      const conduitMesh = new THREE.Mesh(cylGeo, cylMat);
      mainGroup.add(conduitMesh);

      // Rings at ends
      const endRingGeo = new THREE.RingGeometry(rConduit, rConduit + wallThick, 48);
      const endRingMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const ring1 = new THREE.Mesh(endRingGeo, endRingMat);
      ring1.position.z = conduitLength / 2;
      mainGroup.add(ring1);
    }

    // 2. Build 3D Conductor Cylinders from Packed 2D Coordinates
    packedCircles.forEach((circle) => {
      const wireRadius = circle.radiusMm;
      const wireColor = new THREE.Color(circle.color);

      // Conductor Extrusion
      const wireLength = conduitLength + 8; // extends slightly out of the pipe
      const wireGeo = new THREE.CylinderGeometry(wireRadius, wireRadius, wireLength, 24);
      wireGeo.rotateX(Math.PI / 2);

      const wireMat = new THREE.MeshStandardMaterial({
        color: wireColor,
        roughness: 0.4,
        metalness: 0.15
      });
      const wireMesh = new THREE.Mesh(wireGeo, wireMat);
      wireMesh.position.set(circle.x, circle.y, 0);
      mainGroup.add(wireMesh);

      // Copper / Metallic Core tip at end
      const coreRadius = wireRadius * 0.7;
      const coreGeo = new THREE.CylinderGeometry(coreRadius, coreRadius, 2, 20);
      coreGeo.rotateX(Math.PI / 2);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xb45309, // Copper color
        metalness: 0.9,
        roughness: 0.2
      });
      const coreMeshFront = new THREE.Mesh(coreGeo, coreMat);
      coreMeshFront.position.set(circle.x, circle.y, wireLength / 2 + 0.1);
      mainGroup.add(coreMeshFront);
    });

    camera.lookAt(0, 0, 0);

    // Animation Loop
    const animate = () => {
      if (is3dRotating && groupRef.current) {
        groupRef.current.rotation.y += 0.008;
      }
      renderer.render(scene, camera);
      animFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newW = mountRef.current.clientWidth;
      const newH = mountRef.current.clientHeight || 360;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, [activeView, packedCircles, insideDiameterMm, racewayShape, trunkingWidthMm, trunkingHeightMm, is3dRotating, cutawayOpacity, isDark]);

  // SVG Dimension & Scale Math for 2D Cross-Section View
  const svgSize = 340;
  const conduitRadiusMm = insideDiameterMm / 2 || 15;
  const maxDimMm = racewayShape === 'rectangle' ? Math.max(trunkingWidthMm, trunkingHeightMm) : conduitRadiusMm * 2;
  const svgScale = (svgSize * 0.72) / (maxDimMm || 30);
  const cx = svgSize / 2;
  const cy = svgSize / 2;

  // Max Allowed Fill Radius (for 40% area rule: Area = π*r² -> r_max = r * sqrt(0.40) ≈ 0.632 * r)
  const maxFillRadiusSvg = conduitRadiusMm * Math.sqrt(maxAllowedFillPct / 100) * svgScale;

  const isOverfilled = fillPercentage > maxAllowedFillPct;
  const isNearLimit = fillPercentage > maxAllowedFillPct * 0.85 && !isOverfilled;

  return (
    <div className={`rounded-2xl border p-5 transition-all shadow-sm ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header with View Toggle & Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Gauge size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm flex items-center gap-2">
              <span>Raceway Packing & Cross-Section Visualizer</span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                isOverfilled 
                  ? 'bg-red-500/10 text-red-600 border-red-500/30' 
                  : isNearLimit 
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
              }`}>
                {isOverfilled ? 'OVERFILL EXCEEDED' : isNearLimit ? 'NEAR LIMIT' : 'CODE COMPLIANT'}
              </span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {racewayName} • {packedCircles.length} Conductors Sized
            </p>
          </div>
        </div>

        {/* 2D / 3D View Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveView('2d')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === '2d'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            <span>2D Cross-Section</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('3d')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === '3d'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Box size={14} />
            <span>3D Isometric Tube</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Stage */}
      <div className="grid lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Interactive Diagram / Three.js Canvas */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          {activeView === '2d' ? (
            <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center p-2 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden">
              <svg 
                viewBox={`0 0 ${svgSize} ${svgSize}`} 
                className="w-full h-full select-none"
              >
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="conduit-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.75" />
                  </pattern>
                  <radialGradient id="conduitGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="1" />
                  </radialGradient>
                </defs>

                <rect width={svgSize} height={svgSize} fill="url(#conduitGlow)" />
                <rect width={svgSize} height={svgSize} fill="url(#conduit-grid)" />

                {/* Raceway Outer Shell */}
                {racewayShape === 'rectangle' ? (
                  <>
                    {/* Trunking Wall */}
                    <rect
                      x={cx - (trunkingWidthMm / 2) * svgScale}
                      y={cy - (trunkingHeightMm / 2) * svgScale}
                      width={trunkingWidthMm * svgScale}
                      height={trunkingHeightMm * svgScale}
                      fill="#0f172a"
                      stroke="#475569"
                      strokeWidth="6"
                      rx="4"
                    />
                    {/* 45% Fill Boundary Box */}
                    {showFillLimitRing && (
                      <rect
                        x={cx - (trunkingWidthMm / 2) * Math.sqrt(maxAllowedFillPct / 100) * svgScale}
                        y={cy - (trunkingHeightMm / 2) * Math.sqrt(maxAllowedFillPct / 100) * svgScale}
                        width={trunkingWidthMm * Math.sqrt(maxAllowedFillPct / 100) * svgScale}
                        height={trunkingHeightMm * Math.sqrt(maxAllowedFillPct / 100) * svgScale}
                        fill="none"
                        stroke="#38bdf8"
                        strokeDasharray="4 3"
                        strokeWidth="1.2"
                      />
                    )}
                  </>
                ) : (
                  <>
                    {/* Outer Pipe Wall */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={conduitRadiusMm * svgScale + 4}
                      fill="#1e293b"
                      stroke="#475569"
                      strokeWidth="6"
                    />
                    {/* Inside Conduit Hole */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={conduitRadiusMm * svgScale}
                      fill="#090d16"
                      stroke="#334155"
                      strokeWidth="1.5"
                    />

                    {/* 40% Allowable Fill Reference Boundary (Dashed Ring) */}
                    {showFillLimitRing && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={maxFillRadiusSvg}
                        fill="none"
                        stroke="#38bdf8"
                        strokeDasharray="4 3"
                        strokeWidth="1.2"
                      />
                    )}
                  </>
                )}

                {/* Dimension Reference Lines */}
                {showDimensions && (
                  <g className="text-[10px] font-mono fill-slate-400">
                    <line
                      x1={cx - conduitRadiusMm * svgScale}
                      y1={cy + conduitRadiusMm * svgScale + 12}
                      x2={cx + conduitRadiusMm * svgScale}
                      y2={cy + conduitRadiusMm * svgScale + 12}
                      stroke="#64748b"
                      strokeWidth="1"
                      markerStart="url(#arrow)"
                      markerEnd="url(#arrow)"
                    />
                    <text
                      x={cx}
                      y={cy + conduitRadiusMm * svgScale + 22}
                      textAnchor="middle"
                      className="fill-slate-400 text-[10px]"
                    >
                      ID: {insideDiameterMm.toFixed(1)} mm ({((insideDiameterMm / 25.4)).toFixed(2)}")
                    </text>
                  </g>
                )}

                {/* Render All Individual Packed Conductors */}
                {packedCircles.map((circle) => {
                  const isHovered = hoveredWire?.id === circle.id;
                  const isSelected = selectedWire?.id === circle.id;
                  const circleSvgX = cx + circle.x * svgScale;
                  const circleSvgY = cy + circle.y * svgScale;
                  const circleSvgR = Math.max(2.5, circle.radiusMm * svgScale);

                  return (
                    <g 
                      key={circle.id}
                      className="cursor-pointer transition-transform"
                      onMouseEnter={() => setHoveredWire(circle)}
                      onMouseLeave={() => setHoveredWire(null)}
                      onClick={() => setSelectedWire(circle)}
                    >
                      {/* Selection / Hover Glow Ring */}
                      {(isHovered || isSelected) && (
                        <circle
                          cx={circleSvgX}
                          cy={circleSvgY}
                          r={circleSvgR + 3}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                      )}

                      {/* Conductor Outer Insulation Sheath */}
                      <circle
                        cx={circleSvgX}
                        cy={circleSvgY}
                        r={circleSvgR}
                        fill={circle.color}
                        stroke={isHovered || isSelected ? '#ffffff' : '#0f172a'}
                        strokeWidth="1"
                      />

                      {/* Conductor Metallic Core (Copper / Bronze Center) */}
                      <circle
                        cx={circleSvgX}
                        cy={circleSvgY}
                        r={Math.max(1, circleSvgR * 0.62)}
                        fill="#d97706"
                        stroke="#92400e"
                        strokeWidth="0.5"
                      />

                      {/* Small Spec Label on larger conductors */}
                      {circleSvgR > 11 && (
                        <text
                          x={circleSvgX}
                          y={circleSvgY + 3}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="7.5"
                          fontWeight="bold"
                          fontFamily="monospace"
                          pointerEvents="none"
                        >
                          {circle.gauge.replace(' AWG', '').replace(' mm²', '')}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Interactive Tooltip on Hover */}
              {hoveredWire && (
                <div className="absolute top-3 left-3 bg-slate-900/95 border border-slate-700 text-white text-[11px] p-2.5 rounded-xl shadow-xl backdrop-blur-xs font-mono pointer-events-none z-10">
                  <div className="font-bold text-blue-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredWire.color }} />
                    {hoveredWire.gauge} ({hoveredWire.insulation})
                  </div>
                  <div className="text-slate-300 mt-1">
                    Type: <span className="capitalize">{hoveredWire.type}</span>
                  </div>
                  <div className="text-slate-400">
                    OD: {hoveredWire.outerDiameterMm} mm • Area: {hoveredWire.areaMm2.toFixed(1)} mm²
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 3D Isometric View Container */
            <div className="relative w-full max-w-[420px] aspect-square flex flex-col items-center justify-center rounded-2xl bg-slate-950 border border-slate-800 shadow-inner overflow-hidden">
              <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

              {/* 3D Controls Floating Bar */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setIs3dRotating(!is3dRotating)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {is3dRotating ? <Pause size={13} /> : <Play size={13} />}
                  <span>{is3dRotating ? 'Pause Spin' : 'Auto Spin'}</span>
                </button>

                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[11px]">Shell Opacity:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.1"
                    value={cutawayOpacity}
                    onChange={(e) => setCutawayOpacity(parseFloat(e.target.value))}
                    className="w-20 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Quick Diagram Toggles */}
          <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showFillLimitRing}
                onChange={(e) => setShowFillLimitRing(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>{maxAllowedFillPct}% Max Fill Boundary</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showDimensions}
                onChange={(e) => setShowDimensions(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Dimension Callouts</span>
            </label>
          </div>
        </div>

        {/* Right Column: Mathematical Fill Analysis & Key Code Diagnostics */}
        <div className="lg:col-span-5 space-y-4">
          {/* Fill Percentage Gauge Card */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Calculated Raceway Fill
              </span>
              <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                isOverfilled
                  ? 'bg-red-500/20 text-red-500'
                  : isNearLimit
                  ? 'bg-amber-500/20 text-amber-500'
                  : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {fillPercentage.toFixed(1)}% / {maxAllowedFillPct}% Limit
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3.5 p-0.5 overflow-hidden relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverfilled
                    ? 'bg-red-500'
                    : isNearLimit
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, (fillPercentage / maxAllowedFillPct) * 100)}%` }}
              />
              {/* Max Code Limit Marker */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10" 
                style={{ left: `${Math.min(100, 100)}%` }}
                title="Code Limit"
              />
            </div>

            {/* Fill Stats Breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="text-slate-500 text-[10px]">Conductor Area:</div>
                <div className="font-bold text-blue-500 mt-0.5">
                  {totalConductorsAreaMm2.toFixed(1)} mm²
                </div>
                <div className="text-[10px] text-slate-400">
                  ({(totalConductorsAreaMm2 / 645.16).toFixed(3)} in²)
                </div>
              </div>

              <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="text-slate-500 text-[10px]">Raceway Usable:</div>
                <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                  {(totalConduitAreaMm2 * (maxAllowedFillPct / 100)).toFixed(1)} mm²
                </div>
                <div className="text-[10px] text-slate-400">
                  ({((totalConduitAreaMm2 * (maxAllowedFillPct / 100)) / 645.16).toFixed(3)} in²)
                </div>
              </div>
            </div>
          </div>

          {/* Jam Ratio Warning Banner (For 3-conductor runs) */}
          {jamInfo && (
            <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
              jamInfo.status === 'danger'
                ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                : jamInfo.status === 'caution'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
            }`}>
              {jamInfo.status === 'danger' ? (
                <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-500" />
              ) : (
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-500" />
              )}
              <div>
                <div className="font-bold flex items-center gap-1">
                  <span>3-Conductor Jam Ratio: D/d = {jamInfo.jamRatio.toFixed(2)}</span>
                  {jamInfo.status === 'danger' && <span className="underline">CRITICAL HAZARD</span>}
                </div>
                <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                  {jamInfo.message}
                </p>
              </div>
            </div>
          )}

          {/* Code Reference Notes */}
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              <span>Standard Fill Rules:</span>
            </div>
            {standard === 'NEC' ? (
              <ul className="space-y-1 list-disc list-inside text-[11px]">
                <li><strong>1 Conductor:</strong> 53% maximum raceway fill.</li>
                <li><strong>2 Conductors:</strong> 31% maximum raceway fill.</li>
                <li><strong>3+ Conductors:</strong> 40% maximum fill (NEC Ch. 9 Table 1).</li>
                <li><strong>Nipples (≤ 24" / 600mm):</strong> 60% allowable fill.</li>
              </ul>
            ) : (
              <ul className="space-y-1 list-disc list-inside text-[11px]">
                <li><strong>BS 7671 Conduits:</strong> Total Cable Factors ≤ Conduit Factor.</li>
                <li><strong>BS 7671 Trunking:</strong> 45% maximum space factor.</li>
                <li><strong>Thermal Derating (Cg):</strong> Table 4C1 grouping applied.</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
