import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Eye, 
  RotateCcw, 
  Play, 
  Pause, 
  Flame, 
  Zap, 
  Layers,
  Activity,
  Box,
  Cpu,
  Gauge
} from 'lucide-react';

interface Ohms3DProps {
  voltage: number;
  current: number;
  resistance: number;
  power: number;
  solveMode: string;
}

// Resistor standard 4-band color code calculation
function getResistorColorBands(ohms: number): [string, string, string, string] {
  if (ohms <= 0 || !isFinite(ohms)) {
    return ['#000000', '#000000', '#000000', '#D4AF37']; // Default 0
  }

  const digitColors = [
    '#1e293b', // 0 Black
    '#78350f', // 1 Brown
    '#ef4444', // 2 Red
    '#f97316', // 3 Orange
    '#eab308', // 4 Yellow
    '#22c55e', // 5 Green
    '#3b82f6', // 6 Blue
    '#a855f7', // 7 Violet
    '#64748b', // 8 Grey
    '#f8fafc'  // 9 White
  ];

  const multiplierColors: { [key: number]: string } = {
    [-2]: '#cbd5e1', // Silver
    [-1]: '#d97706', // Gold
    0: '#1e293b',    // Black (x1)
    1: '#78350f',    // Brown (x10)
    2: '#ef4444',    // Red (x100)
    3: '#f97316',    // Orange (x1k)
    4: '#eab308',    // Yellow (x10k)
    5: '#22c55e',    // Green (x100k)
    6: '#3b82f6',    // Blue (x1M)
  };

  const exp = Math.floor(Math.log10(ohms));
  const norm = ohms / Math.pow(10, exp);
  const firstDigit = Math.floor(norm);
  const secondDigit = Math.floor((norm - firstDigit) * 10);

  const multExp = exp - 1;
  const b1 = digitColors[Math.min(9, Math.max(0, firstDigit))];
  const b2 = digitColors[Math.min(9, Math.max(0, secondDigit))];
  const b3 = multiplierColors[multExp] || '#1e293b';
  const b4 = '#d97706'; // Gold (5%)

  return [b1, b2, b3, b4];
}

export const Ohms3DVisualizer: React.FC<Ohms3DProps> = ({
  voltage,
  current,
  resistance,
  power,
  solveMode
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'circuit' | 'resistor' | 'field'>('circuit');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);

  // Overlay state toggles
  const [showMagneticField, setShowMagneticField] = useState<boolean>(false);
  const [showVectors, setShowVectors] = useState<boolean>(false);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Interactive camera controls
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 4,
    radius: 12
  });

  // Animation references
  const mainGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particlePositionsRef = useRef<Float32Array | null>(null);
  const heatLightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 300;

    // Safe numerical props guard
    const safeVoltage = isFinite(voltage) ? Math.max(0, voltage) : 0;
    const safeCurrent = isFinite(current) ? Math.max(0, current) : 0;
    const safeResistance = isFinite(resistance) ? Math.max(0, resistance) : 0;
    const safePower = isFinite(power) ? Math.max(0, power) : 0;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900
    sceneRef.current = scene;

    // Grid Floor
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

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Dynamic Heat / Power glow light
    const heatColor = safePower > 1000 ? 0xef4444 : safePower > 200 ? 0xf59e0b : 0x10b981;
    const heatLight = new THREE.PointLight(heatColor, Math.min(5, 0.8 + safePower / 200), 15);
    heatLight.position.set(0, 0, 0);
    scene.add(heatLight);
    heatLightRef.current = heatLight;

    // 5. Build 3D Scene Objects
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    if (viewMode === 'circuit') {
      // -----------------------------------------------------------------
      // A. FULL 3D CIRCUIT LOOP (DC Power Source, Resistor, Wire, Electrons)
      // -----------------------------------------------------------------

      // Circuit Wire Loop Path (Rounded rectangular loop)
      const pathPoints: THREE.Vector3[] = [
        new THREE.Vector3(-6, 0, -3),
        new THREE.Vector3(6, 0, -3),
        new THREE.Vector3(6, 0, 3),
        new THREE.Vector3(-6, 0, 3),
        new THREE.Vector3(-6, 0, -3)
      ];

      const curve = new THREE.CatmullRomCurve3(pathPoints, true);
      const wireTubeGeo = new THREE.TubeGeometry(curve, 100, 0.15, 12, true);
      const wireMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        metalness: 0.8,
        roughness: 0.2
      });
      const wireMesh = new THREE.Mesh(wireTubeGeo, wireMat);
      mainGroup.add(wireMesh);

      // Power Source (DC Battery Cylinder on Left Side: x = -6, z = 0)
      const batteryGroup = new THREE.Group();
      batteryGroup.position.set(-6, 0, 0);

      const batBodyGeo = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 24);
      const batBodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
      const batBody = new THREE.Mesh(batBodyGeo, batBodyMat);
      batteryGroup.add(batBody);

      // Positive Terminal Ring (Glows based on Voltage V)
      const batPosGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16);
      const batPosMat = new THREE.MeshStandardMaterial({ 
        color: 0xef4444, 
        emissive: 0xef4444, 
        emissiveIntensity: Math.min(1, safeVoltage / 200) 
      });
      const batPos = new THREE.Mesh(batPosGeo, batPosMat);
      batPos.position.y = 1.45;
      batteryGroup.add(batPos);

      // Voltage Label Indicator Sphere
      const vGlowGeo = new THREE.SphereGeometry(1.2, 16, 16);
      const vGlowMat = new THREE.MeshBasicMaterial({
        color: 0x3b82f6,
        transparent: true,
        opacity: Math.min(0.5, 0.1 + safeVoltage / 500),
        wireframe: true
      });
      const vGlowMesh = new THREE.Mesh(vGlowGeo, vGlowMat);
      batteryGroup.add(vGlowMesh);

      mainGroup.add(batteryGroup);

      // Resistor Component on Right Side (x = 6, z = 0)
      const resistorGroup = new THREE.Group();
      resistorGroup.position.set(6, 0, 0);
      resistorGroup.rotation.z = Math.PI / 2;

      // Resistor Ceramic Body
      const resBodyGeo = new THREE.CylinderGeometry(0.6, 0.6, 2.8, 24);
      const resBodyMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.4, metalness: 0.1 }); // Beige/Yellow ceramic
      const resBody = new THREE.Mesh(resBodyGeo, resBodyMat);
      resistorGroup.add(resBody);

      // Color Code Bands
      const bands = getResistorColorBands(safeResistance);
      const bandPositions = [-0.9, -0.4, 0.1, 0.8];
      bands.forEach((colorHex, idx) => {
        const bandGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.2, 24);
        const bandMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2 });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.position.y = bandPositions[idx];
        resistorGroup.add(bandMesh);
      });

      // Power Heat Aura around Resistor
      const pAuraGeo = new THREE.SphereGeometry(1.5, 16, 16);
      const pAuraMat = new THREE.MeshBasicMaterial({
        color: heatColor,
        transparent: true,
        opacity: Math.min(0.6, safePower / 1500),
        wireframe: true
      });
      const pAuraMesh = new THREE.Mesh(pAuraGeo, pAuraMat);
      resistorGroup.add(pAuraMesh);

      mainGroup.add(resistorGroup);

      // Electron Flow Particles along circuit tube
      const particleCount = 150;
      const particlePositionsList: number[] = [];

      for (let p = 0; p < particleCount; p++) {
        const t = p / particleCount;
        const pt = curve.getPoint(t);
        const px = isFinite(pt.x) ? pt.x : 0;
        const py = isFinite(pt.y) ? pt.y : 0;
        const pz = isFinite(pt.z) ? pt.z : 0;
        particlePositionsList.push(px, py, pz);
      }

      const pGeom = new THREE.BufferGeometry();
      const posArray = new Float32Array(particlePositionsList);
      pGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      pGeom.computeBoundingSphere();
      particlePositionsRef.current = posArray;

      const pMat = new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.25,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
      });

      const pMesh = new THREE.Points(pGeom, pMat);
      mainGroup.add(pMesh);
      particlesRef.current = pMesh;

    } else if (viewMode === 'resistor') {
      // -----------------------------------------------------------------
      // B. FOCUSED 3D RESISTOR & THERMAL DISSIPATION MODEL
      // -----------------------------------------------------------------
      const resistorGroup = new THREE.Group();

      // Main Ceramic Resistor Barrel
      const resBodyGeo = new THREE.CylinderGeometry(1.4, 1.4, 6, 32);
      resBodyGeo.rotateZ(Math.PI / 2);
      const resBodyMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a, // Light yellow ceramic body
        roughness: 0.3,
        metalness: 0.1
      });
      const resBody = new THREE.Mesh(resBodyGeo, resBodyMat);
      resistorGroup.add(resBody);

      // Metal Lead Wires at ends
      const leadGeo = new THREE.CylinderGeometry(0.2, 0.2, 4, 16);
      leadGeo.rotateZ(Math.PI / 2);
      const leadMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.9, roughness: 0.1 });
      
      const leadLeft = new THREE.Mesh(leadGeo, leadMat);
      leadLeft.position.x = -5;
      resistorGroup.add(leadLeft);

      const leadRight = new THREE.Mesh(leadGeo, leadMat);
      leadRight.position.x = 5;
      resistorGroup.add(leadRight);

      // Color Code Bands
      const bands = getResistorColorBands(safeResistance);
      const bandPositions = [-1.8, -0.8, 0.2, 1.8];
      bands.forEach((colorHex, idx) => {
        const bandGeo = new THREE.CylinderGeometry(1.44, 1.44, 0.45, 32);
        bandGeo.rotateZ(Math.PI / 2);
        const bandMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.2 });
        const bandMesh = new THREE.Mesh(bandGeo, bandMat);
        bandMesh.position.x = bandPositions[idx];
        resistorGroup.add(bandMesh);
      });

      // Radiating Thermal Heat Rings (Scaling with Power P)
      const ringCount = Math.min(8, Math.max(2, Math.floor(safePower / 100)));
      for (let r = 1; r <= ringCount; r++) {
        const ringGeo = new THREE.TorusGeometry(1.8 + r * 0.4, 0.06, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: heatColor,
          transparent: true,
          opacity: Math.max(0.1, 0.8 / r)
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.y = Math.PI / 2;
        resistorGroup.add(ringMesh);
      }

      mainGroup.add(resistorGroup);

    } else {
      // -----------------------------------------------------------------
      // C. POTENTIAL GRADIENT & POWER DENSITY FIELD MAP
      // -----------------------------------------------------------------
      // 3D Grid Wave Matrix showing Voltage Drop Potential across Resistance
      const planeGeo = new THREE.PlaneGeometry(12, 8, 30, 20);
      planeGeo.rotateX(-Math.PI / 2);

      // Deform height based on Voltage Gradient and Resistance
      const posAttr = planeGeo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const z = posAttr.getZ(i);
        // Voltage drop curve from left (+V) to right (0V)
        const vPotential = ((6 - x) / 12) * Math.min(10, safeVoltage / 20);
        const ripple = Math.sin(x * 1.5 + z * 1.5) * (safeCurrent / 20);
        const finalY = isFinite(vPotential + ripple) ? vPotential + ripple : 0;
        posAttr.setY(i, finalY);
      }
      planeGeo.computeVertexNormals();
      planeGeo.computeBoundingSphere();

      const fieldMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        wireframe: true,
        roughness: 0.2,
        emissive: heatColor,
        emissiveIntensity: Math.min(0.6, safePower / 1000)
      });
      const fieldMesh = new THREE.Mesh(planeGeo, fieldMat);
      mainGroup.add(fieldMesh);
    }

    // Camera positioning
    const updateCameraPos = () => {
      const { theta, phi, radius } = cameraAngleRef.current;
      camera.position.x = radius * Math.sin(phi) * Math.cos(theta);
      camera.position.y = radius * Math.cos(phi);
      camera.position.z = radius * Math.sin(phi) * Math.sin(theta);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    // 6. Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isAutoRotating && !isDraggingRef.current) {
        cameraAngleRef.current.theta += (isFinite(delta) ? delta : 0.016) * 0.4;
        updateCameraPos();
      }

      // Animate electron drift along circuit loop
      if (viewMode === 'circuit' && particlesRef.current && particlePositionsRef.current) {
        const positions = particlePositionsRef.current;
        const speedRaw = Math.min(15, safeCurrent * 0.5);
        const driftSpeed = (isFinite(speedRaw) ? speedRaw : 1) * (isFinite(delta) ? delta : 0.016);

        // Shift positions slightly
        for (let i = 0; i < positions.length; i += 3) {
          const shift = Math.sin(now * 0.002 + i) * 0.02 * driftSpeed;
          if (isFinite(shift)) {
            positions[i] += shift;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Heat light pulsing
      if (heatLightRef.current) {
        heatLightRef.current.intensity = (0.8 + Math.min(4, safePower / 200)) + Math.sin(now * 0.006) * 0.4;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Mouse Controls
    const domElem = mountRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta -= deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - deltaY * 0.008));

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCameraPos();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(5, Math.min(30, cameraAngleRef.current.radius + e.deltaY * 0.01));
      updateCameraPos();
    };

    domElem.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 300;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      domElem.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElem.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [voltage, current, resistance, power, solveMode, viewMode, isAutoRotating, showMagneticField, showVectors]);

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
    if (cameraRef.current) {
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleResetCamera = () => {
    handleSetAngle('iso');
  };

  return (
    <div className="w-full h-full min-h-[350px] bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-2xl">
      {/* Top Floating 3D Control Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Left: View Mode Pills */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          <button
            type="button"
            onClick={() => setViewMode('circuit')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'circuit'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={13} />
            Circuit
          </button>
          <button
            type="button"
            onClick={() => setViewMode('resistor')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'resistor'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu size={13} />
            Resistor
          </button>
          <button
            type="button"
            onClick={() => setViewMode('field')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'field'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers size={13} />
            Field
          </button>
        </div>

        {/* Center/Right: View Angles & Overlay Toggles */}
        <div className="flex items-center gap-2">
          {/* View Angle Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg text-[11px] font-mono">
            <span className="text-slate-500 px-1 font-semibold">View:</span>
            <button
              type="button"
              onClick={() => handleSetAngle('iso')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              3D Iso
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle('top')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle('side')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Side
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle('macro')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Macro
            </button>
          </div>

          {/* Overlay Toggles */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg text-[11px]">
            <button
              type="button"
              onClick={() => setShowMagneticField(!showMagneticField)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                showMagneticField
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🧲 B-Field
            </button>
            <button
              type="button"
              onClick={() => setShowVectors(!showVectors)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                showVectors
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Vectors
            </button>
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                showLabels
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏷️ Badges
            </button>
          </div>

          {/* Camera Tools */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
            <button
              type="button"
              onClick={() => setIsAutoRotating(!isAutoRotating)}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                isAutoRotating ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white'
              }`}
              title={isAutoRotating ? 'Pause Orbit Rotation' : 'Auto Orbit Rotation'}
            >
              {isAutoRotating ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              type="button"
              onClick={handleResetCamera}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
              title="Reset 3D Viewpoint"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating HUD 3D Core Labels */}
      {showLabels && (
        <div className="absolute top-16 left-3 z-20 pointer-events-none hidden sm:flex flex-col gap-1.5 animate-in fade-in duration-200">
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-blue-500/30 text-[10px] font-mono text-blue-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Voltage Source: {voltage.toFixed(1)} V</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Resistor Element: {resistance.toFixed(1)} Ω</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-purple-500/30 text-[10px] font-mono text-purple-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Power Dissipation: {power.toFixed(1)} W</span>
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1 min-h-[280px]" 
      />

      {/* Bottom Floating Telemetry Stats */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono shadow-xl">
          <Zap size={13} className="text-blue-400" />
          <span className="text-slate-400">Potential:</span>
          <span className="font-bold text-white">{voltage.toFixed(1)} V</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Current:</span>
          <span className="font-bold text-amber-400">{current.toFixed(2)} A</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono shadow-xl">
          <Gauge size={13} className="text-emerald-400" />
          <span className="text-slate-400">Resistance:</span>
          <span className="font-bold text-emerald-300">{resistance.toFixed(2)} Ω</span>
          <span className="text-slate-600">|</span>
          <Flame size={13} className="text-purple-400" />
          <span className="text-slate-400">Power:</span>
          <span className="font-bold text-purple-300">{power.toFixed(1)} W</span>
        </div>
      </div>
    </div>
  );
};
