import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Eye, 
  RotateCcw, 
  Play, 
  Pause, 
  Flame, 
  Zap, 
  Maximize2, 
  Layers,
  Activity,
  Box,
  Thermometer
} from 'lucide-react';

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
  isPass
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'crossSection' | 'routeFlow' | 'thermal'>('crossSection');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [cameraZoomLevel, setCameraZoomLevel] = useState<number>(100);

  // Overlay state toggles
  const [showMagneticField, setShowMagneticField] = useState<boolean>(false);
  const [showVectors, setShowVectors] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isLoading3D, setIsLoading3D] = useState<boolean>(true);

  // Hover Tooltip State
  interface HoverTooltipData {
    show: boolean;
    x: number;
    y: number;
    title: string;
    specs: Array<{ label: string; val: string; color?: string }>;
  }
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltipData | null>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Interactive camera drag controls state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 4,
    radius: 12
  });

  // Group references for animation
  const cableGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particlePositionsRef = useRef<Float32Array | null>(null);
  const heatLightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 260;

    // Safe numeric props
    const safeMm2 = isFinite(mm2) && mm2 > 0 ? mm2 : 2.5;
    const safeCurrent = isFinite(current) && current >= 0 ? current : 15;
    const safeLoss = isFinite(powerLossWatts) && powerLossWatts >= 0 ? powerLossWatts : 0;
    const safeVDropPct = isFinite(vDropPct) && vDropPct >= 0 ? vDropPct : 0;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900 dark atmosphere
    sceneRef.current = scene;

    // Grid Helper
    const gridHelper = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    gridHelper.position.y = -3;
    scene.add(gridHelper);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(10, 20, 15);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6);
    dirLight2.position.set(-10, -10, -10);
    scene.add(dirLight2);

    const heatLight = new THREE.PointLight(0x38bdf8, 2, 10);
    heatLight.position.set(0, 0, 0);
    scene.add(heatLight);
    heatLightRef.current = heatLight;

    // 5. Build 3D Cable Assembly Group
    const cableGroup = new THREE.Group();
    scene.add(cableGroup);
    cableGroupRef.current = cableGroup;

    // Calculate proportional radius from mm2 (clamp for view bounds)
    // Real mm² ranges from ~1.5 to ~120 mm²
    const baseCoreRadius = Math.max(0.25, Math.min(2.2, Math.sqrt(safeMm2 / Math.PI) * 0.45));
    const conductorColor = material === 'copper' ? 0xb87333 : 0xc0c0c0; // Metallic Copper vs Silver Aluminium
    const heatIntensityColor = isPass ? (safeVDropPct > 3 ? 0xf59e0b : 0x10b981) : 0xef4444;

    if (viewMode === 'crossSection') {
      // -------------------------------------------------------------
      // CUTAWAY CABLE CROSS-SECTION MODEL
      // -------------------------------------------------------------
      const outerSheathRadius = baseCoreRadius * 3.2;
      const innerInsulationRadius = baseCoreRadius * 1.6;

      // Outer Black Sheath (PVC Cutaway Cylinder)
      const sheathGeo = new THREE.CylinderGeometry(outerSheathRadius, outerSheathRadius, 8, 32, 1, false, 0, Math.PI * 1.65);
      const sheathMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.5,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      const sheathMesh = new THREE.Mesh(sheathGeo, sheathMat);
      sheathMesh.rotation.z = Math.PI / 2;
      cableGroup.add(sheathMesh);

      // Steel Wire Armor (SWA) Interstitial Mesh Ring
      const armorGeo = new THREE.TorusGeometry(outerSheathRadius * 0.88, 0.08, 12, 32);
      const armorMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
      for (let i = -3; i <= 3; i += 1.5) {
        const armorRing = new THREE.Mesh(armorGeo, armorMat);
        armorRing.rotation.y = Math.PI / 2;
        armorRing.position.x = i;
        cableGroup.add(armorRing);
      }

      // Three Insulated Core Sleeves (Live-Brown, Neutral-Blue, CPC-Earth)
      const corePositions = [
        { angle: 0, color: 0x8b4513, name: 'Live (Brown)' },
        { angle: (2 * Math.PI) / 3, color: 0x2563eb, name: 'Neutral (Blue)' },
        { angle: (4 * Math.PI) / 3, color: 0x16a34a, name: 'CPC Earth (Green/Yellow)' }
      ];

      corePositions.forEach((core) => {
        const offsetDist = baseCoreRadius * 1.35;
        const cx = Math.cos(core.angle) * offsetDist;
        const cy = Math.sin(core.angle) * offsetDist;

        // Core Insulation Sleeve
        const coreInsGeo = new THREE.CylinderGeometry(innerInsulationRadius, innerInsulationRadius, 8.4, 24);
        const coreInsMat = new THREE.MeshStandardMaterial({
          color: core.color,
          roughness: 0.3,
          metalness: 0.1
        });
        const coreInsMesh = new THREE.Mesh(coreInsGeo, coreInsMat);
        coreInsMesh.rotation.z = Math.PI / 2;
        coreInsMesh.position.set(0, cy, cx);
        cableGroup.add(coreInsMesh);

        // Multi-strand Metallic Conductor Cores inside sleeve
        const strandCount = mm2 > 6 ? 7 : 1;
        const strandRadius = strandCount === 1 ? baseCoreRadius : baseCoreRadius * 0.38;

        for (let s = 0; s < strandCount; s++) {
          const strandAngle = (s * Math.PI * 2) / Math.max(1, strandCount - 1);
          const strandOffset = s === 0 && strandCount > 1 ? 0 : baseCoreRadius * 0.55;
          const sx = cx + (s === 0 && strandCount > 1 ? 0 : Math.cos(strandAngle) * strandOffset);
          const sy = cy + (s === 0 && strandCount > 1 ? 0 : Math.sin(strandAngle) * strandOffset);

          const strandGeo = new THREE.CylinderGeometry(strandRadius, strandRadius, 9, 16);
          const strandMat = new THREE.MeshStandardMaterial({
            color: conductorColor,
            metalness: 0.95,
            roughness: 0.15,
            emissive: heatIntensityColor,
            emissiveIntensity: Math.min(0.8, powerLossWatts / 100)
          });
          const strandMesh = new THREE.Mesh(strandGeo, strandMat);
          strandMesh.rotation.z = Math.PI / 2;
          strandMesh.position.set(0.2, sy, sx);
          cableGroup.add(strandMesh);
        }
      });

    } else if (viewMode === 'routeFlow') {
      // -------------------------------------------------------------
      // 3D ROUTE & ANIMATED CURRENT FLOW PARTICLES MODEL
      // -------------------------------------------------------------
      // 3D Path from Distribution Board Box to Load Machine Box
      const pathPoints: THREE.Vector3[] = [];
      const curveSegments = 100;

      for (let i = 0; i <= curveSegments; i++) {
        const t = i / curveSegments;
        const x = (t - 0.5) * 16;
        const y = Math.sin(t * Math.PI * 2) * 1.5;
        const z = Math.cos(t * Math.PI) * 1.2;
        pathPoints.push(new THREE.Vector3(x, y, z));
      }

      const curve = new THREE.CatmullRomCurve3(pathPoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 64, baseCoreRadius * 1.2, 16, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.55,
        roughness: 0.2,
        metalness: 0.6
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      cableGroup.add(tubeMesh);

      // Start Box (Distribution Board)
      const boardGeo = new THREE.BoxGeometry(2, 3, 2);
      const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
      const boardMesh = new THREE.Mesh(boardGeo, boardMat);
      boardMesh.position.copy(pathPoints[0]);
      cableGroup.add(boardMesh);

      // End Box (Load Equipment)
      const loadGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      const loadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7 });
      const loadMesh = new THREE.Mesh(loadGeo, loadMat);
      loadMesh.position.copy(pathPoints[pathPoints.length - 1]);
      cableGroup.add(loadMesh);

      // Current Flow Electron Particle System
      const particleCount = 200;
      const particleGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);

      for (let p = 0; p < particleCount; p++) {
        const t = (p / particleCount);
        const point = curve.getPoint(t);
        pPositions[p * 3] = isFinite(point.x) ? point.x : 0;
        pPositions[p * 3 + 1] = isFinite(point.y) ? point.y : 0;
        pPositions[p * 3 + 2] = isFinite(point.z) ? point.z : 0;
      }

      particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      particleGeo.computeBoundingSphere();
      particlePositionsRef.current = pPositions;

      const pMat = new THREE.PointsMaterial({
        color: heatIntensityColor,
        size: 0.35,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });

      const particleSystem = new THREE.Points(particleGeo, pMat);
      cableGroup.add(particleSystem);
      particlesRef.current = particleSystem;

    } else {
      // -------------------------------------------------------------
      // THERMAL HEATMAP / DISSIPATION MODEL
      // -------------------------------------------------------------
      const tubeGeo = new THREE.CylinderGeometry(baseCoreRadius * 2, baseCoreRadius * 2, 12, 32);
      
      // Dynamic vertex coloring based on power loss heat gradient
      const thermalMat = new THREE.MeshStandardMaterial({
        color: heatIntensityColor,
        roughness: 0.2,
        emissive: heatIntensityColor,
        emissiveIntensity: Math.min(1.0, 0.2 + safeLoss / 50)
      });
      const thermalMesh = new THREE.Mesh(tubeGeo, thermalMat);
      thermalMesh.rotation.z = Math.PI / 2;
      cableGroup.add(thermalMesh);

      // Thermal Radiation Rings
      for (let r = 1; r <= 4; r++) {
        const ringGeo = new THREE.TorusGeometry(baseCoreRadius * (2 + r * 0.8), 0.05, 12, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: heatIntensityColor,
          transparent: true,
          opacity: 0.8 / r
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.y = Math.PI / 2;
        cableGroup.add(ringMesh);
      }
    }

    // Magnetic Field B-Field Rings
    if (showMagneticField) {
      const fieldGroup = new THREE.Group();
      const ringCount = 6;
      for (let r = 0; r < ringCount; r++) {
        const rRadius = baseCoreRadius * (2.2 + r * 0.3);
        const rGeo = new THREE.TorusGeometry(rRadius, 0.03, 12, 32);
        const rMat = new THREE.MeshBasicMaterial({
          color: safeCurrent > 40 ? 0xef4444 : safeCurrent > 20 ? 0xf59e0b : 0x06b6d4,
          transparent: true,
          opacity: Math.min(0.8, 0.3 + (safeCurrent / 60))
        });
        const rMesh = new THREE.Mesh(rGeo, rMat);
        rMesh.rotation.y = Math.PI / 2;
        rMesh.position.x = (r - ringCount / 2) * 1.5;
        fieldGroup.add(rMesh);
      }
      cableGroup.add(fieldGroup);
    }

    // Vector Flow Arrows
    if (showVectors) {
      const arrowGroup = new THREE.Group();
      const arrowDir = new THREE.Vector3(1, 0, 0);
      for (let a = 0; a < 5; a++) {
        const arrow = new THREE.ArrowHelper(
          arrowDir,
          new THREE.Vector3(-4 + a * 2, baseCoreRadius * 2, 0),
          1.2,
          0x38bdf8,
          0.3,
          0.2
        );
        arrowGroup.add(arrow);
      }
      cableGroup.add(arrowGroup);
    }

    // 6. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Camera position update based on orbit angles
      if (cameraRef.current) {
        const { theta, phi, radius } = cameraAngleRef.current;
        cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
        cameraRef.current.position.y = radius * Math.cos(phi);
        cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
        cameraRef.current.lookAt(0, 0, 0);
      }

      // Auto rotation
      if (isAutoRotating) {
        cameraAngleRef.current.theta += (isFinite(delta) ? delta : 0.016) * 0.4;
      }

      // Particle Current Flow Animation along circuit curve
      if (viewMode === 'routeFlow' && particlesRef.current && particlePositionsRef.current) {
        const flowSpeedRaw = (safeCurrent / 20) * (isFinite(delta) ? delta : 0.016);
        const flowSpeed = isFinite(flowSpeedRaw) ? flowSpeedRaw : 0.01;
        const positions = particlePositionsRef.current;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3] += flowSpeed * 3;
          if (positions[i * 3] > 8) {
            positions[i * 3] = -8;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Pulse heat glow
      if (heatLightRef.current) {
        heatLightRef.current.intensity = 1.5 + Math.sin(elapsedTime * 4) * 0.5;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const loadTimer = setTimeout(() => {
      setIsLoading3D(false);
    }, 280);

    // Resize Handler
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight || 340;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(loadTimer);
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.dispose();
      }
    };
  }, [awg, mm2, current, voltage, distance, material, vDrop, vDropPct, powerLossWatts, isPass, viewMode, isAutoRotating, showMagneticField, showVectors]);

  // Mouse & Touch Drag Controls for 3D Camera Rotation
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setHoverTooltip(null);
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - deltaY * 0.008));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycasting inspection
    if (!mountRef.current || !cameraRef.current || !sceneRef.current || !cableGroupRef.current) return;
    const container = mountRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const intersects = raycaster.intersectObjects(cableGroupRef.current.children, true);
    if (intersects.length > 0) {
      const mousePxX = e.clientX - rect.left;
      const mousePxY = e.clientY - rect.top;

      setHoverTooltip({
        show: true,
        x: mousePxX,
        y: mousePxY,
        title: `⚡ ${awg} (${mm2} mm²) ${material === 'copper' ? 'Copper' : 'Aluminum'} Conductor`,
        specs: [
          { label: 'Cross-Sectional Area', val: `${mm2} mm²` },
          { label: 'Current Load', val: `${current} A (${(current / mm2).toFixed(2)} A/mm²)` },
          { label: 'Voltage Drop', val: `${vDrop.toFixed(2)}V (${vDropPct.toFixed(2)}%)`, color: isPass ? 'text-emerald-400' : 'text-rose-400' },
          { label: 'Joule Power Loss', val: `${powerLossWatts.toFixed(1)} Watts I²R`, color: 'text-amber-400' },
          { label: 'Circuit Distance', val: `${distance} meters (${(distance * 3.28084).toFixed(0)} ft)` }
        ]
      });
    } else {
      setHoverTooltip(null);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setHoverTooltip(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngleRef.current.radius = Math.max(5, Math.min(25, cameraAngleRef.current.radius + e.deltaY * 0.01));
    setCameraZoomLevel(Math.round((12 / cameraAngleRef.current.radius) * 100));
  };

  const handleSetAngle = (angle: 'iso' | 'top' | 'side' | 'macro') => {
    let theta = Math.PI / 4;
    let phi = Math.PI / 4;
    let radius = 12;

    if (angle === 'top') {
      theta = 0;
      phi = 0.001;
      radius = 12;
    } else if (angle === 'side') {
      theta = 0;
      phi = Math.PI / 2 - 0.02;
      radius = 12;
    } else if (angle === 'macro') {
      theta = Math.PI / 4;
      phi = Math.PI / 4;
      radius = 6;
    }

    cameraAngleRef.current = { theta, phi, radius };
    setCameraZoomLevel(Math.round((12 / radius) * 100));
  };

  const handleResetCamera = () => {
    handleSetAngle('iso');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-white relative h-full flex flex-col justify-between">
      {/* Visualizer Header Toolbar */}
      <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Box size={13} className="text-blue-400" />
            3D Cable & Thermal Renderer
          </span>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80">
          <button
            type="button"
            onClick={() => setViewMode('crossSection')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'crossSection'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={11} />
            3D Cutaway
          </button>

          <button
            type="button"
            onClick={() => setViewMode('routeFlow')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'routeFlow'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={11} />
            Current Flow
          </button>

          <button
            type="button"
            onClick={() => setViewMode('thermal')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${
              viewMode === 'thermal'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame size={11} />
            Thermal Heat
          </button>
        </div>

        {/* View Angles & Overlay Toggles */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80 text-[10px] font-mono">
            <span className="text-slate-400 px-1 font-semibold">Angles:</span>
            <button type="button" onClick={() => handleSetAngle('iso')} className="px-1.5 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-700">Iso</button>
            <button type="button" onClick={() => handleSetAngle('top')} className="px-1.5 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-700">Top</button>
            <button type="button" onClick={() => handleSetAngle('side')} className="px-1.5 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-700">Side</button>
            <button type="button" onClick={() => handleSetAngle('macro')} className="px-1.5 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-700">Macro</button>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/90 p-0.5 rounded-lg border border-slate-700/80 text-[10px]">
            <button
              type="button"
              onClick={() => setShowMagneticField(!showMagneticField)}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                showMagneticField ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              🧲 B-Field
            </button>
            <button
              type="button"
              onClick={() => setShowVectors(!showVectors)}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                showVectors ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Vectors
            </button>
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                showLabels ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
              }`}
            >
              🏷️ Badges
            </button>
          </div>

          {/* Camera Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              title={isAutoRotating ? 'Pause Auto Rotation' : 'Start Auto Rotation'}
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
            >
              {isAutoRotating ? <Pause size={12} /> : <Play size={12} />}
            </button>

            <button
              type="button"
              onClick={handleResetCamera}
              title="Reset 3D Camera"
              className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* 3D Canvas Container */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        className="w-full flex-1 min-h-[220px] cursor-grab active:cursor-grabbing relative select-none"
      >
        {/* Skeleton Loader Animation */}
        {isLoading3D && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300">
            <div className="relative w-14 h-14 mb-2.5">
              <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/40 animate-ping opacity-75" />
              <div className="absolute inset-1.5 rounded-xl border-2 border-dashed border-amber-500/60 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                <Layers size={22} className="animate-pulse" />
              </div>
            </div>
            <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Building Conductor Geometry...</span>
            </div>
            <div className="w-40 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-sky-500 animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* Floating 3D Raycasting Tooltip HUD */}
        {hoverTooltip && hoverTooltip.show && !isLoading3D && (
          <div 
            className="absolute z-30 pointer-events-none transition-all duration-75 animate-in fade-in zoom-in-95"
            style={{
              left: `${Math.min(window.innerWidth > 600 ? 400 : 200, Math.max(10, hoverTooltip.x - 90))}px`,
              top: `${Math.max(10, Math.min(130, hoverTooltip.y - 95))}px`
            }}
          >
            <div className="px-3 py-2 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-white font-sans max-w-[260px]">
              <div className="text-[11px] font-bold text-slate-100 pb-1 mb-1 border-b border-slate-800 truncate">
                {hoverTooltip.title}
              </div>
              <div className="space-y-0.5 text-[10px] font-mono">
                {hoverTooltip.specs.map((spec, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between gap-2">
                    <span className="text-slate-400">{spec.label}:</span>
                    <span className={`font-bold ${spec.color || 'text-slate-200'}`}>
                      {spec.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Hover Controls Hint Overlay */}
        <div className="absolute top-2.5 left-2.5 bg-slate-950/70 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 border border-slate-800 pointer-events-none flex items-center gap-1">
          <Eye size={10} className="text-blue-400" />
          Drag to Orbit • Zoom ({cameraZoomLevel}%)
        </div>

        {/* Real-Time Telemetry HUD Overlay */}
        <div className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-right space-y-0.5 text-[10px] font-mono pointer-events-none shadow-lg">
          <div className="text-slate-400 text-[9px] uppercase font-sans font-semibold">Active Telemetry</div>
          <div className="text-slate-200">
            Gauge: <span className="font-bold text-amber-400">{awg}</span> ({mm2} mm²)
          </div>
          <div className="text-slate-200">
            Material: <span className="capitalize font-bold text-sky-400">{material}</span>
          </div>
          <div className="text-slate-200">
            Current: <span className="font-bold text-emerald-400">{current} A</span>
          </div>
          <div className="text-slate-200">
            Heat Loss: <span className="font-bold text-orange-400">{powerLossWatts.toFixed(1)} W</span>
          </div>
        </div>
      </div>

      {/* Footer Specs Bar */}
      <div className="bg-slate-950 px-3 py-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-mono gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-blue-400" />
          <span>Current Density: <strong className="text-white">{(current / mm2).toFixed(2)} A/mm²</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Thermometer size={12} className={isPass ? 'text-emerald-400' : 'text-rose-400'} />
          <span>Thermal: <strong className={isPass ? 'text-emerald-400' : 'text-rose-400'}>{isPass ? 'Normal' : 'High Heat Risk'}</strong></span>
        </div>
      </div>
    </div>
  );
};
