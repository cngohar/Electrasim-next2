import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Battery, 
  Sun, 
  Moon, 
  Eye, 
  FastForward, 
  Layers, 
  Activity, 
  Maximize2,
  Cpu,
  Clock,
  Flame,
  Info,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Sliders
} from 'lucide-react';

interface Battery3DVisualizerProps {
  batteryVoltage: number;
  batteryAh: number;
  usableKwh: number;
  totalKwh: number;
  dodPct: number;
  chemistryName: string;
  inverterEfficiencyPct: number;
  totalLoadWatts: number;
  dcCurrentAmps: number;
  backupHours: number;
  backupMinutes: number;
  isDark: boolean;
  lightingWatts: number;
  motorWatts: number;
  electronicsWatts: number;
  batteryStringConfig?: string;
}

export const Battery3DVisualizer: React.FC<Battery3DVisualizerProps> = ({
  batteryVoltage,
  batteryAh,
  usableKwh,
  totalKwh,
  dodPct,
  chemistryName,
  inverterEfficiencyPct,
  totalLoadWatts,
  dcCurrentAmps,
  backupHours,
  backupMinutes,
  isDark,
  lightingWatts,
  motorWatts,
  electronicsWatts,
  batteryStringConfig
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Simulation state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(60); // 60x real-time default
  const [simulatedSocPct, setSimulatedSocPct] = useState<number>(100);
  const [selectedComponent, setSelectedComponent] = useState<'battery' | 'inverter' | 'loads' | null>(null);
  const [cameraView, setCameraView] = useState<'system' | 'battery' | 'inverter' | 'loads'>('system');
  const [isLoading3D, setIsLoading3D] = useState<boolean>(true);

  // Hover Tooltip state
  interface HoverTooltipData {
    show: boolean;
    x: number;
    y: number;
    target: string;
    title: string;
    specs: Array<{ label: string; val: string; color?: string }>;
  }
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltipData | null>(null);

  // References for Three.js state
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Animated elements references
  const batteryGroupRef = useRef<THREE.Group | null>(null);
  const inverterGroupRef = useRef<THREE.Group | null>(null);
  const loadsGroupRef = useRef<THREE.Group | null>(null);
  const fanBladesRef = useRef<THREE.Group | null>(null);
  const inverterFanRef = useRef<THREE.Group | null>(null);
  const lightBulbMeshRef = useRef<THREE.Mesh | null>(null);
  const bulbFilamentRef = useRef<THREE.Mesh | null>(null);
  const bulbLightRef = useRef<THREE.PointLight | null>(null);
  const inverterGlowRef = useRef<THREE.PointLight | null>(null);
  const batterySocBarsRef = useRef<THREE.Mesh[]>([]);
  const oledDisplayMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Particle flow references
  const dcParticlesRef = useRef<THREE.Points | null>(null);
  const acParticlesRef = useRef<THREE.Points | null>(null);

  // Drag orbit camera controls
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraAngleRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4.8,
    phi: Math.PI / 3.8,
    radius: 13.5
  });

  // Total runtime in seconds
  const totalRuntimeSeconds = useMemo(() => {
    return Math.max(60, (backupHours * 3600) + (backupMinutes * 60));
  }, [backupHours, backupMinutes]);

  // Handle simulation clock & battery drain
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSimulatedSocPct((prev) => {
        const drainPerSec = (100 / totalRuntimeSeconds) * (simSpeed / 10);
        const next = prev - drainPerSec;
        if (next <= (100 - dodPct)) {
          return 100; // Loop back for continuous live demo
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, totalRuntimeSeconds, simSpeed, dodPct]);

  // Main Three.js Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 380;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isDark ? 0x070b14 : 0xf8fafc);
    scene.fog = new THREE.FogExp2(isDark ? 0x070b14 : 0xf8fafc, 0.035);
    sceneRef.current = scene;

    // Grid Floor
    const gridColor1 = isDark ? 0x1e293b : 0xcbd5e1;
    const gridColor2 = isDark ? 0x0f172a : 0xe2e8f0;
    const gridHelper = new THREE.GridHelper(30, 30, gridColor1, gridColor2);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    // Studio Circular Drop Shadow Decals under components
    const createShadowDecal = (x: number, z: number, radius: number) => {
      const geo = new THREE.CircleGeometry(radius, 32);
      const mat = new THREE.MeshBasicMaterial({
        color: isDark ? 0x000000 : 0x94a3b8,
        transparent: true,
        opacity: isDark ? 0.6 : 0.25,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(x, -1.79, z);
      scene.add(mesh);
    };

    createShadowDecal(-5.0, 0, 1.8); // Under Battery
    createShadowDecal(0, 0, 1.5);    // Under Inverter
    createShadowDecal(5.0, 0, 1.8);  // Under Loads

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer with soft shadow maps and tone mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(isDark ? 0xdbeafe : 0xffffff, isDark ? 0.9 : 1.1);
    scene.add(ambientLight);

    // Key Light
    const keyLight = new THREE.DirectionalLight(0xffffff, isDark ? 1.6 : 1.3);
    keyLight.position.set(9, 16, 11);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Cool Cyan Fill Light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, isDark ? 0.9 : 0.6);
    fillLight.position.set(-10, 8, -6);
    scene.add(fillLight);

    // Subtle Warm Orange Accent Rim Light
    const rimLight = new THREE.DirectionalLight(0xf59e0b, isDark ? 0.8 : 0.4);
    rimLight.position.set(0, -4, -10);
    scene.add(rimLight);

    // -------------------------------------------------------------
    // MODULE A: HIGH-FIDELITY BATTERY BANK ENCLOSURE (Left: X = -5.0)
    // -------------------------------------------------------------
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(-5.0, 0, 0);
    batteryGroup.userData = { componentType: 'battery' };
    batteryGroupRef.current = batteryGroup;
    scene.add(batteryGroup);

    // Physical scale based on usable kWh
    const isLiFePO4 = chemistryName.includes('LiFePO4') || chemistryName.includes('Lithium');
    const batteryWidth = Math.min(2.6, Math.max(1.7, 1.4 + (usableKwh / 12)));
    const batteryHeight = 2.4;
    const batteryDepth = 1.4;

    // Outer Main Rack Cabinet Body
    const cabinetGeo = new THREE.BoxGeometry(batteryWidth, batteryHeight, batteryDepth);
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: isDark ? (isLiFePO4 ? 0x0f2922 : 0x1e293b) : (isLiFePO4 ? 0x134e4a : 0x334155),
      metalness: 0.85,
      roughness: 0.25
    });
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    batteryGroup.add(cabinet);

    // Top Beveled Lid & Handles
    const lidGeo = new THREE.BoxGeometry(batteryWidth + 0.08, 0.12, batteryDepth + 0.08);
    const lidMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x090d16 : 0x1e293b,
      metalness: 0.9,
      roughness: 0.2
    });
    const lid = new THREE.Mesh(lidGeo, lidMat);
    lid.position.y = (batteryHeight / 2) + 0.06;
    lid.castShadow = true;
    batteryGroup.add(lid);

    // Heavy Industrial Handles on sides
    [-1, 1].forEach((dir) => {
      const handleGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16, Math.PI);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.rotation.y = dir * (Math.PI / 2);
      handle.position.set(dir * ((batteryWidth / 2) + 0.04), 0.3, 0);
      batteryGroup.add(handle);
    });

    // Front Laser-Etched Module Livery Faceplate
    const faceplateGeo = new THREE.PlaneGeometry(batteryWidth * 0.88, batteryHeight * 0.84);
    const faceplateMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0b1120 : 0x0f172a,
      metalness: 0.6,
      roughness: 0.35
    });
    const faceplate = new THREE.Mesh(faceplateGeo, faceplateMat);
    faceplate.position.set(0, 0, (batteryDepth / 2) + 0.01);
    batteryGroup.add(faceplate);

    // Front Laser Status Badge
    const badgeGeo = new THREE.PlaneGeometry(batteryWidth * 0.75, 0.35);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: isLiFePO4 ? 0x0d9488 : 0x0284c7,
      emissive: isLiFePO4 ? 0x0f766e : 0x0369a1,
      emissiveIntensity: 0.4,
      roughness: 0.2
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, 0.7, (batteryDepth / 2) + 0.02);
    batteryGroup.add(badge);

    // Battery Terminals with Red (+) and Black (-) Silicone Boots & Hex Nut Studs
    const createTerminal = (isPositive: boolean, xOffset: number) => {
      const termGroup = new THREE.Group();
      termGroup.position.set(xOffset, (batteryHeight / 2) + 0.12, 0);

      // Silicone Boot Base
      const bootGeo = new THREE.CylinderGeometry(0.16, 0.2, 0.18, 16);
      const bootMat = new THREE.MeshStandardMaterial({
        color: isPositive ? 0xef4444 : 0x0f172a,
        metalness: 0.2,
        roughness: 0.6
      });
      const boot = new THREE.Mesh(bootGeo, bootMat);
      termGroup.add(boot);

      // Solid Copper Stud
      const studGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
      const studMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.15
      });
      const stud = new THREE.Mesh(studGeo, studMat);
      stud.position.y = 0.12;
      termGroup.add(stud);

      // Hex Nut
      const nutGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 6);
      const nutMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
      const nut = new THREE.Mesh(nutGeo, nutMat);
      nut.position.y = 0.08;
      termGroup.add(nut);

      batteryGroup.add(termGroup);
    };

    createTerminal(true, batteryWidth * 0.28);  // Positive (+)
    createTerminal(false, -batteryWidth * 0.28); // Negative (-)

    // BMS State of Charge (SoC) Multi-Segment Illuminated LED Meter
    batterySocBarsRef.current = [];
    const numBars = 6;
    const barWidth = batteryWidth * 0.72;
    const barHeight = 0.11;
    const barSpacing = 0.18;

    for (let i = 0; i < numBars; i++) {
      const barGeo = new THREE.BoxGeometry(barWidth, barHeight, 0.04);
      const barMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.85,
        roughness: 0.1
      });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.set(0, -0.65 + (i * barSpacing), (batteryDepth / 2) + 0.03);
      batteryGroup.add(bar);
      batterySocBarsRef.current.push(bar);
    }

    // -------------------------------------------------------------
    // MODULE B: SMART INDUSTRIAL PURE SINE INVERTER (Center: X = 0)
    // -------------------------------------------------------------
    const inverterGroup = new THREE.Group();
    inverterGroup.position.set(0, 0, 0);
    inverterGroup.userData = { componentType: 'inverter' };
    inverterGroupRef.current = inverterGroup;
    scene.add(inverterGroup);

    const invWidth = 1.9;
    const invHeight = 2.6;
    const invDepth = 1.1;

    // Inverter Main Aluminum Body
    const invBodyGeo = new THREE.BoxGeometry(invWidth, invHeight, invDepth);
    const invBodyMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0x1e293b,
      metalness: 0.85,
      roughness: 0.25
    });
    const invBody = new THREE.Mesh(invBodyGeo, invBodyMat);
    invBody.castShadow = true;
    invBody.receiveShadow = true;
    inverterGroup.add(invBody);

    // Aluminum Extruded Cooling Heatsink Fins on Top and Sides
    const numFins = 8;
    for (let f = 0; f < numFins; f++) {
      const finGeo = new THREE.BoxGeometry(invWidth * 0.9, 0.05, invDepth * 0.9);
      const finMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        metalness: 0.9,
        roughness: 0.15
      });
      const fin = new THREE.Mesh(finGeo, finMat);
      fin.position.set(0, (invHeight / 2) + 0.03 + (f * 0.06), 0);
      inverterGroup.add(fin);
    }

    // OLED High-Tech Display Screen
    const oledGeo = new THREE.PlaneGeometry(1.3, 0.75);
    const oledMat = new THREE.MeshStandardMaterial({
      color: 0x0369a1,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    oledDisplayMaterialRef.current = oledMat;
    const oledScreen = new THREE.Mesh(oledGeo, oledMat);
    oledScreen.position.set(0, 0.5, (invDepth / 2) + 0.01);
    inverterGroup.add(oledScreen);

    // Inverter Internal Fan Exhaust (Back/Bottom)
    const fanExhaustGeo = new THREE.CircleGeometry(0.35, 24);
    const fanExhaustMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const fanExhaust = new THREE.Mesh(fanExhaustGeo, fanExhaustMat);
    fanExhaust.position.set(0, -0.6, (invDepth / 2) + 0.01);
    inverterGroup.add(fanExhaust);

    // Dual Inverter Cooling Fan Blades
    const invFanGroup = new THREE.Group();
    invFanGroup.position.set(0, -0.6, (invDepth / 2) + 0.02);
    inverterGroup.add(invFanGroup);
    inverterFanRef.current = invFanGroup;

    for (let b = 0; b < 4; b++) {
      const bladeGeo = new THREE.BoxGeometry(0.08, 0.28, 0.01);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.2 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (b * Math.PI) / 2;
      blade.position.y = 0.1 * Math.cos((b * Math.PI) / 2);
      blade.position.x = -0.1 * Math.sin((b * Math.PI) / 2);
      invFanGroup.add(blade);
    }

    // Inverter Pure Sine Glow Indicator
    const invGlow = new THREE.PointLight(0x38bdf8, 1.4, 3.5);
    invGlow.position.set(0, 0.5, 0.7);
    inverterGroup.add(invGlow);
    inverterGlowRef.current = invGlow;

    // AC Output Breaker / Sockets on Front Bottom
    [-0.45, 0.45].forEach((xOff) => {
      const socketGeo = new THREE.BoxGeometry(0.32, 0.32, 0.04);
      const socketMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.6 });
      const socket = new THREE.Mesh(socketGeo, socketMat);
      socket.position.set(xOff, -0.05, (invDepth / 2) + 0.02);
      inverterGroup.add(socket);
    });

    // -------------------------------------------------------------
    // MODULE C: CONNECTED REAL-WORLD 3D LOADS (Right: X = +5.0)
    // -------------------------------------------------------------
    const loadsGroup = new THREE.Group();
    loadsGroup.position.set(5.0, 0, 0);
    loadsGroup.userData = { componentType: 'loads' };
    loadsGroupRef.current = loadsGroup;
    scene.add(loadsGroup);

    // Distribution Mounting Sub-Chassis Platform
    const loadPlatformGeo = new THREE.BoxGeometry(2.8, 0.4, 1.8);
    const loadPlatformMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x0f172a : 0x334155,
      metalness: 0.8,
      roughness: 0.3
    });
    const loadPlatform = new THREE.Mesh(loadPlatformGeo, loadPlatformMat);
    loadPlatform.position.y = -1.4;
    loadPlatform.castShadow = true;
    loadPlatform.receiveShadow = true;
    loadsGroup.add(loadPlatform);

    // LOAD 1: Edison Filament Lighting Luminaire
    const lightingGroup = new THREE.Group();
    lightingGroup.position.set(-0.85, 0.2, 0);
    lightingGroup.userData = { componentType: 'bulb' };
    loadsGroup.add(lightingGroup);

    // Brass Socket Base
    const socketBaseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.4, 20);
    const socketBaseMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.95,
      roughness: 0.15
    });
    const socketBase = new THREE.Mesh(socketBaseGeo, socketBaseMat);
    socketBase.position.y = 0.2;
    lightingGroup.add(socketBase);

    // Transparent Glass Bulb Envelope
    const glassGeo = new THREE.SphereGeometry(0.48, 32, 32);
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      transmission: 0.9,
      ior: 1.5,
      thickness: 0.2
    });
    const glassBulb = new THREE.Mesh(glassGeo, glassMat);
    glassBulb.position.y = 0.85;
    lightingGroup.add(glassBulb);
    lightBulbMeshRef.current = glassBulb;

    // Glowing Filament Coil
    const filamentGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 24);
    const filamentMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf59e0b,
      emissiveIntensity: Math.min(3.0, 0.4 + (lightingWatts / 100)),
      roughness: 0.1
    });
    const filament = new THREE.Mesh(filamentGeo, filamentMat);
    filament.position.y = 0.85;
    filament.rotation.x = Math.PI / 2;
    lightingGroup.add(filament);
    bulbFilamentRef.current = filament;

    // Real Warm Point Light
    const bulbLight = new THREE.PointLight(0xf59e0b, Math.min(3.5, 0.6 + (lightingWatts / 90)), 6);
    bulbLight.position.set(-0.85, 1.05, 0);
    bulbLight.castShadow = true;
    loadsGroup.add(bulbLight);
    bulbLightRef.current = bulbLight;

    // LOAD 2: Industrial Electric Motor & Heavy-Duty Ventilation Fan
    const motorGroup = new THREE.Group();
    motorGroup.position.set(0.85, 0.2, 0);
    motorGroup.userData = { componentType: 'fan' };
    loadsGroup.add(motorGroup);

    // Cast Aluminum Motor Housing with Ribbed Stator Fins
    const motorBodyGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.7, 24);
    const motorBodyMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x1e293b : 0x475569,
      metalness: 0.8,
      roughness: 0.3
    });
    const motorBody = new THREE.Mesh(motorBodyGeo, motorBodyMat);
    motorBody.rotation.x = Math.PI / 2;
    motorBody.castShadow = true;
    motorGroup.add(motorBody);

    // Motor Terminal Box on top
    const termBoxGeo = new THREE.BoxGeometry(0.3, 0.2, 0.3);
    const termBoxMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.2 });
    const termBox = new THREE.Mesh(termBoxGeo, termBoxMat);
    termBox.position.set(0, 0.52, 0);
    motorGroup.add(termBox);

    // Aerodynamic Industrial Fan Blades
    const fanGroup = new THREE.Group();
    fanGroup.position.set(0, 0, 0.42);
    motorGroup.add(fanGroup);
    fanBladesRef.current = fanGroup;

    // Fan Hub
    const hubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.12, 16);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.rotation.x = Math.PI / 2;
    fanGroup.add(hub);

    // 5 Aerodynamic Fan Blades
    for (let i = 0; i < 5; i++) {
      const bladeGeo = new THREE.BoxGeometry(0.14, 0.65, 0.03);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        metalness: 0.5,
        roughness: 0.2
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      const angle = (i * 2 * Math.PI) / 5;
      blade.rotation.z = angle;
      blade.position.y = 0.28 * Math.cos(angle);
      blade.position.x = -0.28 * Math.sin(angle);
      fanGroup.add(blade);
    }

    // Protective Circular Wire Mesh Guard
    const wireGuardGeo = new THREE.TorusGeometry(0.68, 0.02, 8, 32);
    const wireGuardMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
    const wireGuard = new THREE.Mesh(wireGuardGeo, wireGuardMat);
    wireGuard.position.set(0, 0, 0.46);
    motorGroup.add(wireGuard);

    // LOAD 3: IT Electronics / Server Blade Module
    const serverGroup = new THREE.Group();
    serverGroup.position.set(0, -0.65, 0);
    serverGroup.userData = { componentType: 'server' };
    loadsGroup.add(serverGroup);

    const serverGeo = new THREE.BoxGeometry(2.4, 0.7, 1.2);
    const serverMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x020617 : 0x1e293b,
      metalness: 0.7,
      roughness: 0.35
    });
    const serverMesh = new THREE.Mesh(serverGeo, serverMat);
    serverMesh.castShadow = true;
    serverGroup.add(serverMesh);

    // Server Drive Bays & Glowing Activity LEDs
    for (let d = 0; d < 6; d++) {
      const driveGeo = new THREE.PlaneGeometry(0.3, 0.18);
      const driveMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        emissive: 0x3b82f6,
        emissiveIntensity: 0.6,
        roughness: 0.1
      });
      const drive = new THREE.Mesh(driveGeo, driveMat);
      drive.position.set(-0.85 + (d * 0.34), 0.08, 0.61);
      serverGroup.add(drive);
    }

    // -------------------------------------------------------------
    // MODULE D: REALISTIC POWER CABLES & FLOWING PARTICLE STREAMS
    // -------------------------------------------------------------

    // DC Power Cables (Red Positive & Black Negative with Catenary Sag)
    const createCurvedCable = (start: THREE.Vector3, end: THREE.Vector3, color: number, sag: number) => {
      const mid = new THREE.Vector3(
        (start.x + end.x) / 2,
        ((start.y + end.y) / 2) - sag,
        (start.z + end.z) / 2
      );
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.08, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.3,
        roughness: 0.4
      });
      const mesh = new THREE.Mesh(tubeGeo, tubeMat);
      mesh.castShadow = true;
      scene.add(mesh);
      return curve;
    };

    // Red Positive DC Cable
    const dcPosCurve = createCurvedCable(
      new THREE.Vector3(-3.8, 0.6, 0.2),
      new THREE.Vector3(-1.0, 0.6, 0.2),
      0xef4444,
      0.25
    );

    // Black Negative DC Cable
    createCurvedCable(
      new THREE.Vector3(-3.8, 0.6, -0.2),
      new THREE.Vector3(-1.0, 0.6, -0.2),
      0x0f172a,
      0.25
    );

    // AC Power Output Line (Inverter -> Loads)
    const acCableCurve = createCurvedCable(
      new THREE.Vector3(1.0, 0.5, 0),
      new THREE.Vector3(3.8, 0.5, 0),
      0x3b82f6,
      0.2
    );

    // DC Energy Flow Particle Points
    const numDcParticles = 60;
    const dcPositions = new Float32Array(numDcParticles * 3);
    for (let i = 0; i < numDcParticles; i++) {
      const pt = dcPosCurve.getPoint(i / numDcParticles);
      dcPositions[i * 3] = pt.x;
      dcPositions[i * 3 + 1] = pt.y;
      dcPositions[i * 3 + 2] = pt.z;
    }
    const dcParticleGeo = new THREE.BufferGeometry();
    dcParticleGeo.setAttribute('position', new THREE.BufferAttribute(dcPositions, 3));
    const dcParticleMat = new THREE.PointsMaterial({
      color: 0xfacc15,
      size: 0.22,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const dcParticles = new THREE.Points(dcParticleGeo, dcParticleMat);
    scene.add(dcParticles);
    dcParticlesRef.current = dcParticles;

    // AC Energy Flow Particle Points
    const numAcParticles = 60;
    const acPositions = new Float32Array(numAcParticles * 3);
    for (let i = 0; i < numAcParticles; i++) {
      const pt = acCableCurve.getPoint(i / numAcParticles);
      acPositions[i * 3] = pt.x;
      acPositions[i * 3 + 1] = pt.y;
      acPositions[i * 3 + 2] = pt.z;
    }
    const acParticleGeo = new THREE.BufferGeometry();
    acParticleGeo.setAttribute('position', new THREE.BufferAttribute(acPositions, 3));
    const acParticleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.22,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const acParticles = new THREE.Points(acParticleGeo, acParticleMat);
    scene.add(acParticles);
    acParticlesRef.current = acParticles;

    // -------------------------------------------------------------
    // REAL-TIME RENDER & ANIMATION LOOP
    // -------------------------------------------------------------
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // 1. Rotate Industrial Motor Fan Blades proportional to motor load
      if (fanBladesRef.current && totalLoadWatts > 0) {
        const fanRpmSpeed = Math.min(35, 4 + (motorWatts / 30));
        fanBladesRef.current.rotation.z += fanRpmSpeed * delta;
      }

      // 2. Rotate Inverter Chassis Cooling Fan proportional to total AC load
      if (inverterFanRef.current && totalLoadWatts > 0) {
        const invFanSpeed = Math.min(30, 3 + (totalLoadWatts / 80));
        inverterFanRef.current.rotation.z += invFanSpeed * delta;
      }

      // 3. Pulse Light Bulb Filament and PointLight
      if (bulbLightRef.current && lightingWatts > 0) {
        const pulse = Math.sin(elapsedTime * 6) * 0.12;
        bulbLightRef.current.intensity = Math.min(3.8, 1.2 + (lightingWatts / 100) + pulse);
      }

      // 4. Move DC Particles from Battery Bank to Inverter
      if (dcParticlesRef.current) {
        const posAttr = dcParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const currentSpeed = Math.min(5.0, 1.0 + (dcCurrentAmps / 20));
        for (let i = 0; i < numDcParticles; i++) {
          let progress = (i / numDcParticles) + (elapsedTime * (currentSpeed * 0.15)) % 1;
          if (progress > 1) progress -= 1;
          const pt = dcPosCurve.getPoint(progress);
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        posAttr.needsUpdate = true;
      }

      // 5. Move AC Particles from Inverter to Connected Loads
      if (acParticlesRef.current) {
        const posAttr = acParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const acSpeed = Math.min(5.0, 1.0 + (totalLoadWatts / 300));
        for (let i = 0; i < numAcParticles; i++) {
          let progress = (i / numAcParticles) + (elapsedTime * (acSpeed * 0.15)) % 1;
          if (progress > 1) progress -= 1;
          const pt = acCableCurve.getPoint(progress);
          posAttr.setXYZ(i, pt.x, pt.y, pt.z);
        }
        posAttr.needsUpdate = true;
      }

      // 6. Subtle OLED display pulsation
      if (oledDisplayMaterialRef.current) {
        oledDisplayMaterialRef.current.emissiveIntensity = 0.7 + Math.sin(elapsedTime * 3) * 0.15;
      }

      renderer.render(scene, camera);
    };

    animate();

    const loadTimer = setTimeout(() => {
      setIsLoading3D(false);
    }, 280);

    // Responsive Canvas Resize Observer
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight || 380;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(loadTimer);
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [isDark, usableKwh, chemistryName, dodPct]);

  // Update SoC LED bar colors based on simulated battery level
  useEffect(() => {
    if (!batterySocBarsRef.current) return;

    const numBars = batterySocBarsRef.current.length;
    const thresholdPerBar = 100 / numBars;

    batterySocBarsRef.current.forEach((bar, idx) => {
      const threshold = (idx + 1) * thresholdPerBar;
      const isLit = simulatedSocPct >= threshold - (thresholdPerBar * 0.5);
      const mat = bar.material as THREE.MeshStandardMaterial;
      if (mat) {
        if (isLit) {
          const colorHex = simulatedSocPct > 50 ? 0x10b981 : simulatedSocPct > 20 ? 0xf59e0b : 0xef4444;
          mat.color.setHex(colorHex);
          mat.emissive.setHex(colorHex);
          mat.emissiveIntensity = 0.9;
        } else {
          mat.color.setHex(0x1e293b);
          mat.emissive.setHex(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    });
  }, [simulatedSocPct]);

  // Update Camera position helper
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngleRef.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Mouse drag Orbit Controls & Raycasting Hover Inspection
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setHoverTooltip(null);
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraAngleRef.current.theta += deltaX * 0.008;
      cameraAngleRef.current.phi = Math.max(0.15, Math.min(Math.PI / 2.05, cameraAngleRef.current.phi - deltaY * 0.008));

      updateCameraPosition();
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Raycast hover detection when not dragging
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    const container = mountRef.current;
    const rect = container.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);

    const targets: THREE.Object3D[] = [];
    if (batteryGroupRef.current) targets.push(batteryGroupRef.current);
    if (inverterGroupRef.current) targets.push(inverterGroupRef.current);
    if (loadsGroupRef.current) targets.push(loadsGroupRef.current);

    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      let hitType: string = 'system';
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

      if (hitType === 'battery') {
        setHoverTooltip({
          show: true,
          x: mousePxX,
          y: mousePxY,
          target: 'battery',
          title: `🔋 ${chemistryName} Storage Array`,
          specs: [
            { label: 'Nominal Voltage', val: `${batteryVoltage}V DC` },
            { label: 'Rated Capacity', val: `${batteryAh} Ah (${totalKwh.toFixed(2)} kWh Gross)` },
            { label: 'Safe Usable Energy', val: `${usableKwh.toFixed(2)} kWh (${dodPct}% DoD)`, color: 'text-emerald-400' },
            { label: 'Discharge Current', val: `${dcCurrentAmps.toFixed(1)} Amps DC` },
            { label: 'String Config', val: batteryStringConfig || `${Math.ceil(batteryVoltage / 12)}S Series String` },
            { label: 'State of Charge (SoC)', val: `${Math.round(simulatedSocPct)}%`, color: simulatedSocPct > 40 ? 'text-emerald-400' : 'text-amber-400' }
          ]
        });
      } else if (hitType === 'inverter') {
        setHoverTooltip({
          show: true,
          x: mousePxX,
          y: mousePxY,
          target: 'inverter',
          title: '⚡ Pure Sine Wave Power Inverter',
          specs: [
            { label: 'Continuous Output', val: `${Math.round(totalLoadWatts * 1.25)}W Continuous` },
            { label: 'Peak Surge Rating', val: `${Math.round(totalLoadWatts * 2.5)}W Surge (5s)` },
            { label: 'Conversion Efficiency', val: `${inverterEfficiencyPct}% (${(totalLoadWatts * (1 - inverterEfficiencyPct/100)).toFixed(0)}W Heat Loss)`, color: 'text-blue-400' },
            { label: 'Waveform Quality', val: 'Pure Sine Wave (< 3% THD)' },
            { label: 'AC Output Sockets', val: '120V / 230V @ 50/60Hz AC' },
            { label: 'Cooling Rig', val: 'Dual Active Thermal Fans' }
          ]
        });
      } else if (hitType === 'bulb') {
        setHoverTooltip({
          show: true,
          x: mousePxX,
          y: mousePxY,
          target: 'bulb',
          title: '💡 Connected Lighting Luminaire',
          specs: [
            { label: 'Lighting Demand', val: `${lightingWatts} Watts (${(lightingWatts * 80).toFixed(0)} Lumens)` },
            { label: 'Load Characteristic', val: 'Resistive / Non-inductive' },
            { label: 'Power Factor', val: '1.00 Unity PF' }
          ]
        });
      } else if (hitType === 'fan') {
        setHoverTooltip({
          show: true,
          x: mousePxX,
          y: mousePxY,
          target: 'fan',
          title: '🌀 Inductive Motor & HVAC Load',
          specs: [
            { label: 'Active Motor Draw', val: `${motorWatts} Watts (${(motorWatts / 745.7).toFixed(2)} HP)` },
            { label: 'Inrush Multiplier', val: '3x – 6x Starting Current' },
            { label: 'Power Factor', val: '0.80 Inductive Lagging' }
          ]
        });
      } else if (hitType === 'server') {
        setHoverTooltip({
          show: true,
          x: mousePxX,
          y: mousePxY,
          target: 'server',
          title: '💻 IT Infrastructure / Computing Load',
          specs: [
            { label: 'Compute Power Draw', val: `${electronicsWatts} Watts Continuous` },
            { label: 'Power Supply Type', val: 'Active PFC Switched Mode (SMPS)' },
            { label: 'Waveform Requirement', val: 'Pure Sine Wave Essential' }
          ]
        });
      } else {
        setHoverTooltip({
          show: true,
          x: mousePxX,
          y: mousePxY,
          target: 'loads',
          title: '⚡ Total Connected AC Demand',
          specs: [
            { label: 'Total Active Load', val: `${totalLoadWatts} Watts`, color: 'text-amber-400' },
            { label: 'Lighting Share', val: `${lightingWatts}W` },
            { label: 'Motor / HVAC Share', val: `${motorWatts}W` },
            { label: 'Electronics Share', val: `${electronicsWatts}W` }
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

  const handleZoom = (delta: number) => {
    cameraAngleRef.current.radius = Math.max(6, Math.min(22, cameraAngleRef.current.radius + delta));
    updateCameraPosition();
  };

  const setPresetCamera = (view: 'system' | 'battery' | 'inverter' | 'loads') => {
    setCameraView(view);
    setSelectedComponent(view === 'system' ? null : view);

    if (view === 'system') {
      cameraAngleRef.current = { theta: Math.PI / 4.8, phi: Math.PI / 3.8, radius: 13.5 };
    } else if (view === 'battery') {
      cameraAngleRef.current = { theta: Math.PI / 2.3, phi: Math.PI / 3.4, radius: 7.5 };
    } else if (view === 'inverter') {
      cameraAngleRef.current = { theta: 0.05, phi: Math.PI / 3.4, radius: 6.8 };
    } else if (view === 'loads') {
      cameraAngleRef.current = { theta: -Math.PI / 2.6, phi: Math.PI / 3.4, radius: 7.5 };
    }
    updateCameraPosition();
  };

  return (
    <div className={`relative w-full rounded-3xl border overflow-hidden shadow-2xl transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top 3D Header Bar & In-Scene Power Flow HUD */}
      <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
        isDark ? 'bg-slate-950/80 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold shadow-xs">
            <Battery size={20} />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1.5">
              <span>LIVE 3D HARDWARE SIMULATION</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Interactive Energy Flow & Discharge Dynamics
            </div>
          </div>
        </div>

        {/* 4 Camera Presets Selector */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setPresetCamera('system')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              cameraView === 'system'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            System Orbit
          </button>
          <button
            type="button"
            onClick={() => setPresetCamera('battery')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              cameraView === 'battery'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            🔋 Battery Bank
          </button>
          <button
            type="button"
            onClick={() => setPresetCamera('inverter')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              cameraView === 'inverter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            ⚡ Pure Sine Inverter
          </button>
          <button
            type="button"
            onClick={() => setPresetCamera('loads')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              cameraView === 'loads'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            💡 Active Loads
          </button>
        </div>
      </div>

      {/* Floating Real-Time Power Diagram HUD directly on top of 3D Scene */}
      <div className="absolute top-20 left-4 right-4 z-10 pointer-events-none flex items-center justify-center">
        <div className="w-full max-w-3xl px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 text-white shadow-2xl flex items-center justify-between gap-3 text-xs font-mono">
          {/* Battery Flow Tag */}
          <div className="text-center">
            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">🔋 Source Bank</div>
            <div className="font-bold text-white text-xs sm:text-sm">
              {batteryAh}Ah ({usableKwh.toFixed(2)} kWh Usable)
            </div>
            <div className="text-[10px] text-slate-400">@{batteryVoltage}V DC • {chemistryName.split(' ')[0]}</div>
          </div>

          <div className="text-amber-400 font-bold flex flex-col items-center">
            <span className="text-[11px] font-black">{dcCurrentAmps.toFixed(1)}A DC</span>
            <span className="text-sm tracking-tighter text-amber-300 animate-pulse">➔➔➔</span>
          </div>

          {/* Inverter Flow Tag */}
          <div className="text-center">
            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">⚡ Inverter</div>
            <div className="font-bold text-white text-xs sm:text-sm">
              {inverterEfficiencyPct}% Efficiency
            </div>
            <div className="text-[10px] text-slate-400">Pure Sine 50/60Hz</div>
          </div>

          <div className="text-blue-400 font-bold flex flex-col items-center">
            <span className="text-[11px] font-black">120/230V AC</span>
            <span className="text-sm tracking-tighter text-blue-300 animate-pulse">➔➔➔</span>
          </div>

          {/* Load Tag */}
          <div className="text-center">
            <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">💡 Connected Loads</div>
            <div className="font-bold text-white text-xs sm:text-sm">
              {totalLoadWatts} Watts
            </div>
            <div className="text-[10px] text-slate-400">
              {lightingWatts}W Light • {motorWatts}W Motor • {electronicsWatts}W IT
            </div>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Mount Element */}
      <div
        ref={mountRef}
        className="w-full h-96 sm:h-[430px] cursor-grab active:cursor-grabbing select-none relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {/* Skeleton Loader Animation */}
        {isLoading3D && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md transition-opacity duration-300">
            <div className="relative w-20 h-20 mb-4">
              <div className="absolute inset-0 rounded-3xl border-2 border-emerald-500/40 animate-ping opacity-75" />
              <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-blue-500/60 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                <Battery size={32} className="animate-pulse" />
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Initializing 3D Hardware Simulation...</span>
            </div>
            <div className="w-56 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-amber-500 animate-pulse w-3/4 rounded-full" />
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-2">
              Compiling WebGL Shaders & Raycasting Geometry
            </p>
          </div>
        )}

        {/* Floating 3D Raycasting Tooltip HUD */}
        {hoverTooltip && hoverTooltip.show && !isLoading3D && (
          <div 
            className="absolute z-20 pointer-events-none transition-all duration-75 animate-in fade-in zoom-in-95"
            style={{
              left: `${Math.min(window.innerWidth > 600 ? 500 : 260, Math.max(10, hoverTooltip.x - 110))}px`,
              top: `${Math.max(10, Math.min(220, hoverTooltip.y - 120))}px`
            }}
          >
            <div className="px-3.5 py-3 rounded-2xl bg-slate-950/95 backdrop-blur-md border border-slate-700/80 shadow-2xl text-white font-sans max-w-[280px]">
              <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-800">
                <Sparkles size={13} className="text-amber-400 shrink-0" />
                <span className="truncate">{hoverTooltip.title}</span>
              </div>
              <div className="space-y-1 text-[11px] font-mono">
                {hoverTooltip.specs.map((spec, sIdx) => (
                  <div key={sIdx} className="flex items-center justify-between gap-3">
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

        {/* Floating Zoom & Reset controls overlay on canvas */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-xl">
          <button
            type="button"
            onClick={() => handleZoom(-1.5)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => handleZoom(1.5)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer transition-colors"
            title="Zoom Out"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setPresetCamera('system')}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Reset Camera Orientation"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Interactive Simulation Dashboard Bar */}
      <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-4 ${
        isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Left: Battery State of Charge Meter & Controls */}
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-xs font-mono">
              <span className="text-slate-500 dark:text-slate-400 font-bold">Simulated SoC Level:</span>
              <span className={`font-bold ${
                simulatedSocPct > 50 ? 'text-emerald-500' : simulatedSocPct > 20 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {simulatedSocPct.toFixed(0)}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-36 sm:w-48 h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  simulatedSocPct > 50 ? 'bg-emerald-500' : simulatedSocPct > 20 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${simulatedSocPct}%` }}
              />
            </div>
          </div>

          {/* Play/Pause Live Simulation */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1 text-xs"
            title={isPlaying ? 'Pause Discharge Simulation' : 'Start Discharge Simulation'}
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
            <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            onClick={() => setSimulatedSocPct(100)}
            className="p-2.5 rounded-2xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold cursor-pointer transition-colors"
            title="Reset to 100% Charge"
          >
            <RotateCcw size={15} />
          </button>

          {/* Fast Forward Speed Selector */}
          <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-slate-200/70 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setSimSpeed(10)}
              className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${simSpeed === 10 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}
            >
              10x
            </button>
            <button
              type="button"
              onClick={() => setSimSpeed(60)}
              className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${simSpeed === 60 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}
            >
              60x
            </button>
            <button
              type="button"
              onClick={() => setSimSpeed(300)}
              className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${simSpeed === 300 ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'}`}
            >
              300x
            </button>
          </div>
        </div>

        {/* Right: Calculated Runtime Badge */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-2.5 shadow-xs">
            <Clock size={20} className="animate-pulse text-emerald-500" />
            <div>
              <div className="text-[10px] font-mono uppercase font-bold text-slate-400">
                Calculated Runtime
              </div>
              <div className="text-xl font-mono font-black">
                {backupHours}h {backupMinutes}m
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
