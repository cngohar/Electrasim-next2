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
  Shield,
  Sun
} from 'lucide-react';

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
  standard = 'IEC'
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'cutaway' | 'conduit' | 'thermal'>('cutaway');
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

  // Interactive camera drag controls
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 4,
    radius: 12
  });

  // Animation references
  const cableGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particlePositionsRef = useRef<Float32Array | null>(null);
  const heatLightRef = useRef<THREE.PointLight | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight || 300;

    // Safe numeric props
    const safeMm2 = isFinite(mm2) && mm2 > 0 ? mm2 : 2.5;
    const safeCurrent = isFinite(designCurrent) && designCurrent >= 0 ? designCurrent : 15;
    const safeLoss = isFinite(powerLossWatts) && powerLossWatts >= 0 ? powerLossWatts : 0;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // Slate-900 background
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

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const bluePointLight = new THREE.PointLight(0x3b82f6, 1.5, 20);
    bluePointLight.position.set(-5, 5, 5);
    scene.add(bluePointLight);

    // Thermal point light (heat dissipation effect)
    const heatColor = isPass ? (safeLoss > 80 ? 0xf59e0b : 0x10b981) : 0xef4444;
    const heatLight = new THREE.PointLight(heatColor, viewMode === 'thermal' ? 3.5 : 0.8, 15);
    heatLight.position.set(0, 0, 0);
    scene.add(heatLight);
    heatLightRef.current = heatLight;

    // 5. Build 3D Cable Assembly
    const mainCableGroup = new THREE.Group();
    scene.add(mainCableGroup);
    cableGroupRef.current = mainCableGroup;

    // Material definitions
    const condColor = material === 'copper' ? 0xd97706 : 0x94a3b8;
    const condMetal = new THREE.MeshStandardMaterial({
      color: condColor,
      metalness: 0.9,
      roughness: 0.2,
      wireframe: false
    });

    const outerSheathColor = cableType.includes('SWA') ? 0x1e293b : 0x334155;
    const outerMaterial = new THREE.MeshStandardMaterial({
      color: outerSheathColor,
      roughness: 0.4,
      metalness: 0.3,
      transparent: viewMode === 'cutaway',
      opacity: viewMode === 'cutaway' ? 0.45 : 0.95
    });

    // Core Colors based on standard BS 7671 / IEC 60446 or US NEC
    let coreColors: number[];
    if (standard === 'NEC') {
      coreColors = system === 'three'
        ? [0x18181b, 0xdc2626, 0x2563eb, 0xf8fafc, 0x16a34a] // Black (Ph A), Red (Ph B), Blue (Ph C), White (Neutral), Green (Ground)
        : [0x18181b, 0xf8fafc, 0x16a34a];                   // Black (Line), White (Neutral), Green (Ground)
    } else {
      coreColors = system === 'three'
        ? [0x78350f, 0x18181b, 0x64748b, 0x2563eb, 0x16a34a] // L1 Brown, L2 Black, L3 Grey, N Blue, PE Green
        : [0x78350f, 0x2563eb, 0x16a34a];                   // L Brown, N Blue, PE Green
    }

    const scaleFactor = Math.max(0.6, Math.min(2.2, Math.sqrt(safeMm2) * 0.25));
    const cableRadius = 1.4 * scaleFactor;
    const cableLength = 8;

    // A. Outer Protective Sheath Cylinder
    const sheathGeom = new THREE.CylinderGeometry(cableRadius, cableRadius, cableLength, 32, 1, true);
    sheathGeom.rotateZ(Math.PI / 2);
    const sheathMesh = new THREE.Mesh(sheathGeom, outerMaterial);
    sheathMesh.userData = { componentType: 'sheath' };
    mainCableGroup.add(sheathMesh);

    // B. Steel Wire Armoring (SWA Braid helices if cableType contains SWA)
    if (cableType.includes('SWA') || viewMode === 'conduit') {
      const armorRadius = cableRadius * 1.08;
      const wireCount = 16;
      for (let i = 0; i < wireCount; i++) {
        const angle = (i / wireCount) * Math.PI * 2;
        const armorWireGeom = new THREE.CylinderGeometry(0.08 * scaleFactor, 0.08 * scaleFactor, cableLength, 8);
        armorWireGeom.rotateZ(Math.PI / 2);
        const armorMat = new THREE.MeshStandardMaterial({
          color: 0x64748b,
          metalness: 0.95,
          roughness: 0.1
        });
        const armorMesh = new THREE.Mesh(armorWireGeom, armorMat);
        armorMesh.userData = { componentType: 'armor' };
        armorMesh.position.y = Math.sin(angle) * armorRadius;
        armorMesh.position.z = Math.cos(angle) * armorRadius;
        mainCableGroup.add(armorMesh);
      }
    }

    // C. Conduit Pipe (If installMethod contains conduit/trunking and in conduit mode)
    if (viewMode === 'conduit' || installMethod.toLowerCase().includes('conduit')) {
      const conduitGeom = new THREE.CylinderGeometry(cableRadius * 1.6, cableRadius * 1.6, cableLength + 1, 32, 1, true);
      conduitGeom.rotateZ(Math.PI / 2);
      const conduitMat = new THREE.MeshStandardMaterial({
        color: 0x475569,
        metalness: 0.2,
        roughness: 0.6,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      });
      const conduitMesh = new THREE.Mesh(conduitGeom, conduitMat);
      conduitMesh.userData = { componentType: 'conduit' };
      mainCableGroup.add(conduitMesh);
    }

    // D. Inner Insulated Cores & Metallic Conductors
    const coreCount = coreColors.length;
    const coreOffsetRadius = cableRadius * 0.52;
    const coreRadius = cableRadius * 0.35;

    const particlePositionsList: number[] = [];

    coreColors.forEach((colorHex, idx) => {
      const angle = (idx / coreCount) * Math.PI * 2;
      const offsetPosY = Math.sin(angle) * coreOffsetRadius;
      const offsetPosZ = Math.cos(angle) * coreOffsetRadius;

      // Insulation Cylinder
      const coreGeom = new THREE.CylinderGeometry(coreRadius, coreRadius, cableLength - 0.5, 24);
      coreGeom.rotateZ(Math.PI / 2);
      const coreMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.1,
        transparent: viewMode === 'cutaway',
        opacity: viewMode === 'cutaway' ? 0.75 : 0.95
      });
      const coreMesh = new THREE.Mesh(coreGeom, coreMat);
      coreMesh.userData = { componentType: 'core', coreIdx: idx };
      coreMesh.position.y = offsetPosY;
      coreMesh.position.z = offsetPosZ;
      mainCableGroup.add(coreMesh);

      // Inner Metallic Copper/Aluminium Conductor Strand
      const condStrandGeom = new THREE.CylinderGeometry(coreRadius * 0.55, coreRadius * 0.55, cableLength + 0.5, 16);
      condStrandGeom.rotateZ(Math.PI / 2);
      const condMesh = new THREE.Mesh(condStrandGeom, condMetal);
      condMesh.userData = { componentType: 'conductor', coreIdx: idx };
      condMesh.position.y = offsetPosY;
      condMesh.position.z = offsetPosZ;
      mainCableGroup.add(condMesh);

      // Add electron particle points along each active phase/neutral conductor
      const particlesPerCore = 25;
      for (let p = 0; p < particlesPerCore; p++) {
        const posX = (Math.random() - 0.5) * cableLength;
        particlePositionsList.push(posX, offsetPosY, offsetPosZ);
      }
    });

    // E. 3D Electron Flow Particles
    const pGeom = new THREE.BufferGeometry();
    const posArray = new Float32Array(particlePositionsList.map(v => isFinite(v) ? v : 0));
    pGeom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    pGeom.computeBoundingSphere();
    particlePositionsRef.current = posArray;

    const pMat = new THREE.PointsMaterial({
      color: isPass ? 0x38bdf8 : 0xf87171,
      size: 0.15,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const pMesh = new THREE.Points(pGeom, pMat);
    mainCableGroup.add(pMesh);
    particlesRef.current = pMesh;

    // F. Thermal Heat Radiation Shell (Visualized in Thermal view mode)
    if (viewMode === 'thermal') {
      const thermalGeom = new THREE.CylinderGeometry(cableRadius * 1.8, cableRadius * 1.8, cableLength, 24);
      thermalGeom.rotateZ(Math.PI / 2);
      const thermalMat = new THREE.MeshBasicMaterial({
        color: isPass ? 0xf59e0b : 0xef4444,
        transparent: true,
        opacity: Math.min(0.65, Math.max(0.2, safeLoss / 150)),
        wireframe: true
      });
      const thermalMesh = new THREE.Mesh(thermalGeom, thermalMat);
      mainCableGroup.add(thermalMesh);
    }

    // G. Magnetic Field (B-Field) Overlay Rings around Conductor
    if (showMagneticField) {
      const fieldRingGroup = new THREE.Group();
      const ringCount = 7;
      const bColor = safeCurrent > 50 ? 0xef4444 : safeCurrent > 25 ? 0xf59e0b : 0x06b6d4;
      
      for (let r = 0; r < ringCount; r++) {
        const ringRadius = cableRadius * (1.25 + r * 0.22);
        const ringGeom = new THREE.TorusGeometry(ringRadius, 0.03, 12, 32);
        ringGeom.rotateY(Math.PI / 2);
        const ringMat = new THREE.MeshBasicMaterial({
          color: bColor,
          transparent: true,
          opacity: Math.min(0.85, 0.25 + (safeCurrent / 80))
        });
        const ringMesh = new THREE.Mesh(ringGeom, ringMat);
        ringMesh.position.x = (r - ringCount / 2) * 1.1;
        fieldRingGroup.add(ringMesh);
      }
      mainCableGroup.add(fieldRingGroup);
    }

    // H. Directional Current Flow Vector Arrows Overlay
    if (showVectors) {
      const arrowGroup = new THREE.Group();
      const arrowCount = 5;
      const arrowDir = new THREE.Vector3(1, 0, 0); // Along X-axis
      
      for (let a = 0; a < arrowCount; a++) {
        const posX = -3.5 + a * 1.8;
        const arrowHelper = new THREE.ArrowHelper(
          arrowDir,
          new THREE.Vector3(posX, cableRadius * 1.3, 0),
          1.2,
          0x38bdf8,
          0.4,
          0.25
        );
        arrowGroup.add(arrowHelper);
      }
      mainCableGroup.add(arrowGroup);
    }

    // Update Camera Position from Polar Coordinates
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

      // Move electron particles based on current load
      if (particlesRef.current && particlePositionsRef.current) {
        const positions = particlePositionsRef.current;
        const speedRaw = (safeCurrent / 50) * 4 * (isFinite(delta) ? delta : 0.016);
        const speed = isFinite(speedRaw) ? speedRaw : 0.01;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += speed; // Move along X axis
          if (positions[i] > cableLength / 2) {
            positions[i] = -cableLength / 2;
          }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Pulse heat light intensity
      if (heatLightRef.current) {
        heatLightRef.current.intensity = (viewMode === 'thermal' ? 3.0 : 0.8) + Math.sin(now * 0.005) * 0.3;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const loadTimer = setTimeout(() => {
      setIsLoading3D(false);
    }, 280);

    // Mouse Controls (Drag to rotate, Scroll to zoom, Raycasting Inspect)
    const domElem = mountRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      setHoverTooltip(null);
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        cameraAngleRef.current.theta -= deltaX * 0.008;
        cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraAngleRef.current.phi - deltaY * 0.008));

        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
        updateCameraPos();
        return;
      }

      // Raycast inspection when hovering
      if (!domElem || !cameraRef.current || !sceneRef.current || !mainCableGroup) return;
      const rect = domElem.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / domElem.clientWidth) * 2 - 1;
      const mouseY = -((e.clientY - rect.top) / domElem.clientHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

      const intersects = raycaster.intersectObjects(mainCableGroup.children, true);
      if (intersects.length > 0) {
        let hitType: string = 'conductor';
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr) {
          if (curr.userData && curr.userData.componentType) {
            hitType = curr.userData.componentType;
            break;
          }
          curr = curr.parent;
        }

        const mousePxX = e.clientX - rect.left;
        const mousePxY = e.clientY - rect.top;

        if (hitType === 'conductor') {
          setHoverTooltip({
            show: true,
            x: mousePxX,
            y: mousePxY,
            title: `⚡ ${material === 'copper' ? 'Copper (Cu)' : 'Aluminum (Al)'} Active Core`,
            specs: [
              { label: 'Conductor Size', val: `${mm2} mm² (${standard === 'NEC' ? 'AWG/kcmil' : 'IEC Metric'})` },
              { label: 'Current Carrying Capacity', val: `${requiredCapacity.toFixed(1)} A rated`, color: 'text-emerald-400' },
              { label: 'Active Current Load', val: `${designCurrent.toFixed(1)} A` },
              { label: 'Current Density (J)', val: `${(designCurrent / (safeMm2 || 2.5)).toFixed(2)} A/mm²` },
              { label: 'Specific Resistance', val: `${material === 'copper' ? '0.0175' : '0.0282'} Ω·mm²/m` }
            ]
          });
        } else if (hitType === 'core') {
          setHoverTooltip({
            show: true,
            x: mousePxX,
            y: mousePxY,
            title: '🛡️ Core Dielectric Insulation',
            specs: [
              { label: 'Insulation Type', val: cableType.includes('XLPE') ? 'XLPE (90°C)' : 'Thermoplastic PVC (70°C)' },
              { label: 'Dielectric Withstand', val: '600V / 1000V (U0/U)' },
              { label: 'Standard Coding', val: standard === 'NEC' ? 'NEC Art. 310' : 'IEC 60446 / BS 7671' },
              { label: 'Thermal Degradation', val: isPass ? 'Safe within limits' : 'Thermal warning threshold reached', color: isPass ? 'text-emerald-400' : 'text-rose-400' }
            ]
          });
        } else if (hitType === 'sheath') {
          setHoverTooltip({
            show: true,
            x: mousePxX,
            y: mousePxY,
            title: '🧥 Outer Protective Jacket',
            specs: [
              { label: 'Sheath Composition', val: 'Flame Retardant UV-Resistant PVC/LSZH' },
              { label: 'Installation Rating', val: installMethod },
              { label: 'External Radius', val: `${(cableRadius * 10).toFixed(1)} mm OD` }
            ]
          });
        } else if (hitType === 'armor') {
          setHoverTooltip({
            show: true,
            x: mousePxX,
            y: mousePxY,
            title: '⚔️ Steel Wire Armor (SWA)',
            specs: [
              { label: 'Mechanical Shield', val: 'Galvanized High-Tensile Steel Wire' },
              { label: 'Fault Earth Path', val: 'Protective Conductor CPC compliance' },
              { label: 'Crush / Impact Class', val: 'Direct burial & industrial rated' }
            ]
          });
        } else if (hitType === 'conduit') {
          setHoverTooltip({
            show: true,
            x: mousePxX,
            y: mousePxY,
            title: '🏗️ Metallic / Rigid Conduit',
            specs: [
              { label: 'Enclosure Standard', val: 'Rigid Steel / Schedule 40 PVC' },
              { label: 'Conduit Fill Factor', val: '40% Max permissible fill (NEC/IEC)' },
              { label: 'Dissipation Factor', val: 'Enclosed thermal de-rating active' }
            ]
          });
        }
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

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraAngleRef.current.radius = Math.max(5, Math.min(30, cameraAngleRef.current.radius + e.deltaY * 0.01));
      updateCameraPos();
    };

    domElem.addEventListener('mousedown', handleMouseDown);
    domElem.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElem.addEventListener('wheel', handleWheel, { passive: false });

    // Handle Resize
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
      clearTimeout(loadTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      domElem.removeEventListener('mousedown', handleMouseDown);
      domElem.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElem.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, [system, mm2, material, cableType, installMethod, designCurrent, powerLossWatts, isPass, viewMode, isAutoRotating, showMagneticField, showVectors]);

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
            onClick={() => setViewMode('cutaway')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'cutaway'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye size={13} />
            Cutaway
          </button>
          <button
            type="button"
            onClick={() => setViewMode('conduit')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'conduit'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield size={13} />
            Conduit
          </button>
          <button
            type="button"
            onClick={() => setViewMode('thermal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'thermal'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame size={13} />
            Thermal
          </button>
        </div>

        {/* Center/Right: View Angle Presets & Overlay Toggles */}
        <div className="flex items-center gap-2">
          {/* View Angle Presets */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg text-[11px] font-mono">
            <span className="text-slate-500 px-1 font-semibold">View:</span>
            <button
              type="button"
              onClick={() => handleSetAngle('iso')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Isometric 3D Perspective"
            >
              3D Iso
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle('top')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Top Down / Cross Section View"
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle('side')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Side Elevation View"
            >
              Side
            </button>
            <button
              type="button"
              onClick={() => handleSetAngle('macro')}
              className="px-2 py-0.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Macro Close-Up Core View"
            >
              Macro
            </button>
          </div>

          {/* Overlays Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg text-[11px]">
            <button
              type="button"
              onClick={() => setShowMagneticField(!showMagneticField)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                showMagneticField
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Magnetic Field (B-Field) Rings"
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
              title="Toggle Current Vector Flow Arrows"
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
              title="Toggle Interactive 3D Component Labels"
            >
              🏷️ Badges
            </button>
          </div>

          {/* Camera Controls */}
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
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-amber-500/30 text-[10px] font-mono text-amber-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Phase Conductor ({material === 'copper' ? 'Cu' : 'Al'}, {mm2} mm²)</span>
          </div>
          <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-blue-500/30 text-[10px] font-mono text-blue-300 flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>
              {standard === 'NEC' ? 'Neutral / Equipment Ground (NEC Art. 250)' : 'Neutral / PE Insulation (BS 7671)'}
            </span>
          </div>
          {cableType.includes('SWA') && (
            <div className="bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-600/30 text-[10px] font-mono text-slate-300 flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>Steel Wire Armor (SWA Sheath)</span>
            </div>
          )}
        </div>
      )}

      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1 min-h-[280px] relative" 
      >
        {/* Skeleton Loader Animation */}
        {isLoading3D && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300">
            <div className="relative w-16 h-16 mb-3">
              <div className="absolute inset-0 rounded-2xl border-2 border-amber-500/40 animate-ping opacity-75" />
              <div className="absolute inset-1.5 rounded-xl border-2 border-dashed border-sky-500/60 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-amber-400">
                <Zap size={26} className="animate-pulse" />
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Rendering 3D Conductor Assembly...</span>
            </div>
            <div className="w-48 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-500 animate-pulse w-2/3 rounded-full" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1.5">
              Generating Dielectric Shaders & Catenary Meshes
            </p>
          </div>
        )}

        {/* Floating 3D Raycasting Tooltip HUD */}
        {hoverTooltip && hoverTooltip.show && !isLoading3D && (
          <div 
            className="absolute z-30 pointer-events-none transition-all duration-75 animate-in fade-in zoom-in-95"
            style={{
              left: `${Math.min(window.innerWidth > 600 ? 460 : 220, Math.max(10, hoverTooltip.x - 100))}px`,
              top: `${Math.max(10, Math.min(180, hoverTooltip.y - 110))}px`
            }}
          >
            <div className="px-3 py-2.5 rounded-xl bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-white font-sans max-w-[270px]">
              <div className="text-xs font-bold text-slate-100 pb-1.5 mb-1.5 border-b border-slate-800 truncate">
                {hoverTooltip.title}
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                {hoverTooltip.specs.map((spec, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between gap-2.5">
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
      </div>

      {/* Bottom Floating Dynamic Telemetry Stats */}
      <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono shadow-xl">
          <Zap size={13} className="text-amber-400" />
          <span className="text-slate-400">Current Load:</span>
          <span className="font-bold text-white">{designCurrent.toFixed(1)} A</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Required Rating:</span>
          <span className="font-bold text-emerald-400">{requiredCapacity.toFixed(1)} A</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono shadow-xl">
          <Flame size={13} className="text-amber-500" />
          <span className="text-slate-400">Power Loss:</span>
          <span className="font-bold text-amber-300">{powerLossWatts.toFixed(1)} W</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">V-Drop:</span>
          <span className={`font-bold ${isPass ? 'text-emerald-400' : 'text-red-400'}`}>
            {voltageDropPct.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};
