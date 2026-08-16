import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';

export type CameraPreset = 'iso' | 'top' | 'side' | 'macro';

export interface EngineeringModelAnimation {
  animate?: (deltaSeconds: number, elapsedSeconds: number) => void;
}

export type EngineeringModelBuilder = (
  group: THREE.Group,
) => EngineeringModelAnimation | void;

interface UseEngineeringViewportOptions {
  buildModel: EngineeringModelBuilder;
  autoRotate: boolean;
  ariaLabel: string;
  initialRadius?: number;
  minRadius?: number;
  maxRadius?: number;
}

interface OrbitState {
  theta: number;
  phi: number;
  radius: number;
}

export type ViewportStatus = 'initializing' | 'ready' | 'context-lost' | 'unavailable';

interface UseEngineeringViewportResult {
  mountRef: RefObject<HTMLDivElement | null>;
  status: ViewportStatus;
  reducedMotion: boolean;
  zoomPercent: number;
  setCameraPreset: (preset: CameraPreset) => void;
  resetCamera: () => void;
}

/**
 * Disposes every GPU-backed resource below an Object3D. Sets prevent duplicate
 * disposal when a model intentionally shares geometry or material instances.
 */
function disposeObject3D(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);

    const objectMaterials = mesh.material
      ? Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]
      : [];

    objectMaterials.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });

  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
  geometries.forEach((geometry) => geometry.dispose());
}

export function useEngineeringViewport({
  buildModel,
  autoRotate,
  ariaLabel,
  initialRadius = 12,
  minRadius = 5,
  maxRadius = 30,
}: UseEngineeringViewportOptions): UseEngineeringViewportResult {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const modelAnimationRef = useRef<EngineeringModelAnimation>({});
  const frameRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef(0);
  const autoRotateRef = useRef(autoRotate);
  const isDraggingRef = useRef(false);
  const isIntersectingRef = useRef(true);
  const isDocumentVisibleRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const orbitRef = useRef<OrbitState>({
    theta: Math.PI / 4,
    phi: Math.PI / 3,
    radius: initialRadius,
  });

  const [status, setStatus] = useState<ViewportStatus>('initializing');
  const [reducedMotion, setReducedMotion] = useState(false);
  const [zoomPercent, setZoomPercent] = useState(100);

  const renderFrame = useCallback(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (renderer && scene && camera) renderer.render(scene, camera);
  }, []);

  const updateCamera = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;

    const { theta, phi, radius } = orbitRef.current;
    camera.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
    camera.lookAt(0, 0, 0);
  }, []);

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const canAnimate = useCallback(
    () =>
      isIntersectingRef.current &&
      isDocumentVisibleRef.current &&
      !reducedMotionRef.current &&
      status !== 'context-lost' &&
      status !== 'unavailable',
    [status],
  );

  const startAnimationRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  // Inputs can change without recreating the renderer; keep the canvas's
  // accessible description synchronized with the live engineering model.
  useEffect(() => {
    rendererRef.current?.domElement.setAttribute('aria-label', ariaLabel);
  }, [ariaLabel]);

  // Create one renderer and one WebGL context for the entire component lifetime.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      console.error('WebGL is unavailable for the engineering visualizer.', error);
      setStatus('unavailable');
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07101f);
    scene.fog = new THREE.Fog(0x07101f, 18, 42);

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    // No receiver plane is used, so shadow maps only add GPU work without a visible benefit.
    renderer.shadowMap.enabled = false;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

    const canvas = renderer.domElement;
    canvas.dataset.engineeringViewport = 'true';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', ariaLabel);
    canvas.setAttribute('tabindex', '0');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    mount.replaceChildren(canvas);

    // Shared, low-cost studio setup. Dynamic engineering geometry lives in modelRef.
    const hemisphere = new THREE.HemisphereLight(0xb9dcff, 0x101827, 1.35);
    scene.add(hemisphere);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(7, 11, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x2563eb, 22, 30, 2);
    rimLight.position.set(-8, 4, -5);
    scene.add(rimLight);

    const grid = new THREE.GridHelper(32, 32, 0x24456f, 0x13243d);
    grid.position.y = -3.2;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.46;
    scene.add(grid);

    updateCamera();

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height || 340));
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderFrame();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const applyMotionPreference = () => {
      reducedMotionRef.current = media.matches;
      setReducedMotion(media.matches);
      if (media.matches) {
        stopAnimation();
        renderFrame();
      } else {
        startAnimationRef.current();
      }
    };
    media.addEventListener('change', applyMotionPreference);
    applyMotionPreference();

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersectingRef.current = entry?.isIntersecting ?? true;
        if (isIntersectingRef.current) startAnimationRef.current();
        else stopAnimation();
      },
      { rootMargin: '120px', threshold: 0.01 },
    );
    intersectionObserver.observe(mount);

    const handleVisibility = () => {
      isDocumentVisibleRef.current = document.visibilityState === 'visible';
      if (isDocumentVisibleRef.current) startAnimationRef.current();
      else stopAnimation();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();

    let activePointerId: number | null = null;
    let previousX = 0;
    let previousY = 0;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      activePointerId = event.pointerId;
      isDraggingRef.current = true;
      previousX = event.clientX;
      previousY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current || activePointerId !== event.pointerId) return;
      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      orbitRef.current.theta -= deltaX * 0.008;
      orbitRef.current.phi = THREE.MathUtils.clamp(
        orbitRef.current.phi - deltaY * 0.008,
        0.08,
        Math.PI - 0.08,
      );
      updateCamera();
      renderFrame();
    };

    const finishPointer = (event: PointerEvent) => {
      if (activePointerId !== event.pointerId) return;
      isDraggingRef.current = false;
      activePointerId = null;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      orbitRef.current.radius = THREE.MathUtils.clamp(
        orbitRef.current.radius + event.deltaY * 0.012,
        minRadius,
        maxRadius,
      );
      setZoomPercent(Math.round((initialRadius / orbitRef.current.radius) * 100));
      updateCamera();
      renderFrame();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const orbit = orbitRef.current;
      if (event.key === 'ArrowLeft') orbit.theta += 0.12;
      else if (event.key === 'ArrowRight') orbit.theta -= 0.12;
      else if (event.key === 'ArrowUp') orbit.phi = Math.max(0.08, orbit.phi - 0.1);
      else if (event.key === 'ArrowDown') orbit.phi = Math.min(Math.PI - 0.08, orbit.phi + 0.1);
      else if (event.key === '+' || event.key === '=') orbit.radius = Math.max(minRadius, orbit.radius - 0.75);
      else if (event.key === '-') orbit.radius = Math.min(maxRadius, orbit.radius + 0.75);
      else return;
      event.preventDefault();
      setZoomPercent(Math.round((initialRadius / orbit.radius) * 100));
      updateCamera();
      renderFrame();
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      stopAnimation();
      setStatus('context-lost');
    };
    const handleContextRestored = () => {
      setStatus('ready');
      renderFrame();
      startAnimationRef.current();
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', finishPointer);
    canvas.addEventListener('pointercancel', finishPointer);
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    setStatus('ready');

    return () => {
      stopAnimation();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      media.removeEventListener('change', applyMotionPreference);
      document.removeEventListener('visibilitychange', handleVisibility);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', finishPointer);
      canvas.removeEventListener('pointercancel', finishPointer);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);

      if (modelRef.current) {
        scene.remove(modelRef.current);
        disposeObject3D(modelRef.current);
        modelRef.current = null;
      }
      disposeObject3D(scene);
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      modelAnimationRef.current = {};
    };
    // Renderer lifetime is intentionally independent of model props and toolbar state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep a single RAF loop. It is suspended off-screen, in background tabs, and
  // for reduced-motion users instead of burning CPU/GPU continuously.
  useEffect(() => {
    const animate = (now: number) => {
      frameRef.current = null;
      if (!canAnimate()) return;

      const rawDelta = lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : 1 / 60;
      const delta = Math.min(Math.max(rawDelta, 0), 0.05);
      lastFrameRef.current = now;
      elapsedRef.current += delta;

      if (autoRotateRef.current && !isDraggingRef.current) {
        orbitRef.current.theta += delta * 0.35;
        updateCamera();
      }
      modelAnimationRef.current.animate?.(delta, elapsedRef.current);
      renderFrame();
      frameRef.current = requestAnimationFrame(animate);
    };

    startAnimationRef.current = () => {
      if (frameRef.current !== null || !canAnimate()) {
        if (reducedMotionRef.current) renderFrame();
        return;
      }
      lastFrameRef.current = performance.now();
      frameRef.current = requestAnimationFrame(animate);
    };

    startAnimationRef.current();
    return stopAnimation;
  }, [canAnimate, renderFrame, stopAnimation, updateCamera]);

  // Rebuild only disposable model geometry when inputs change; renderer, canvas,
  // controls, camera, ResizeObserver, and WebGL context remain intact.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !rendererRef.current) return;

    if (modelRef.current) {
      scene.remove(modelRef.current);
      disposeObject3D(modelRef.current);
    }

    const model = new THREE.Group();
    model.name = 'engineering-model';
    scene.add(model);
    modelRef.current = model;
    modelAnimationRef.current = buildModel(model) ?? {};
    renderFrame();
    startAnimationRef.current();
  }, [buildModel, renderFrame, status]);

  const setCameraPreset = useCallback(
    (preset: CameraPreset) => {
      const presets: Record<CameraPreset, OrbitState> = {
        iso: { theta: Math.PI / 4, phi: Math.PI / 3, radius: initialRadius },
        top: { theta: 0, phi: 0.08, radius: initialRadius },
        side: { theta: 0, phi: Math.PI / 2, radius: initialRadius },
        macro: { theta: Math.PI / 4, phi: Math.PI / 3, radius: Math.max(minRadius, initialRadius * 0.55) },
      };
      orbitRef.current = presets[preset];
      setZoomPercent(Math.round((initialRadius / orbitRef.current.radius) * 100));
      updateCamera();
      renderFrame();
    },
    [initialRadius, minRadius, renderFrame, updateCamera],
  );

  const resetCamera = useCallback(() => setCameraPreset('iso'), [setCameraPreset]);

  return {
    mountRef,
    status,
    reducedMotion,
    zoomPercent,
    setCameraPreset,
    resetCamera,
  };
}
