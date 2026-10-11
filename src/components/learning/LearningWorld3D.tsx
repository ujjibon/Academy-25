'use client';

import { useEffect, useRef, useState } from 'react';
import { BookOpen, Boxes, Brain, Check, Flag, Gamepad2, RotateCcw } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cn } from '@/lib/utils';

export type LearningStationId = 'learn' | 'play' | 'build' | 'recall' | 'boss';

const STATIONS = [
  { id: 'learn', name: 'Slide sanctuary', short: 'Learn', icon: BookOpen, position: [-3.1, 0.69, 2.5], color: '#f5614c' },
  { id: 'play', name: 'Puzzle arena', short: 'Play', icon: Gamepad2, position: [3.1, 0.69, 2.5], color: '#ffb83f' },
  { id: 'build', name: 'Maker observatory', short: 'Build', icon: Boxes, position: [3.3, 0.69, -1.8], color: '#219d90' },
  { id: 'recall', name: 'Memory grove', short: 'Recall', icon: Brain, position: [-3.3, 0.69, -1.8], color: '#aa82ed' },
  { id: 'boss', name: 'Mastery gateway', short: 'Boss quest', icon: Flag, position: [0, 0.69, -4.3], color: '#48446f' },
] as const;

export interface LearningWorld3DProps {
  activeStation?: LearningStationId;
  onSelectStation?: (id: LearningStationId) => void;
  completedStations?: string[];
  className?: string;
}

function disposeObject(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
    objectMaterials.forEach((material) => {
      materials.add(material);
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) textures.add(value);
      });
    });
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  textures.forEach((texture) => texture.dispose());
}

/** Real Blender-authored geometry; every station also has a keyboard/touch control. */
export function LearningWorld3D({ activeStation = 'learn', onSelectStation, completedStations = [], className }: LearningWorld3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelectStation);
  const updateRef = useRef<((active: LearningStationId, completed: string[]) => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [hoveredStation, setHoveredStation] = useState<LearningStationId | null>(null);
  selectRef.current = onSelectStation;

  useEffect(() => {
    updateRef.current?.(activeStation, completedStations);
  }, [activeStation, completedStations]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setStatus('fallback');
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = 'absolute inset-0 h-full w-full touch-pan-y';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Interactive Quest Isles. Drag to explore, click a station to enter. Arrow keys rotate, plus and minus zoom, Home resets the view. Station buttons are below.');
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const initialPosition = new THREE.Vector3(12, 11, 16);
    camera.position.copy(initialPosition);
    scene.add(new THREE.HemisphereLight(0xfff9ef, 0x8874a3, 2.8));
    const sunlight = new THREE.DirectionalLight(0xfff8ed, 3.0);
    sunlight.position.set(-6, 12, 8);
    scene.add(sunlight);
    const fill = new THREE.DirectionalLight(0xe8e1ff, 1.4);
    fill.position.set(8, 6, -8);
    scene.add(fill);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.25, 0);
    controls.enablePan = false;
    controls.enableDamping = false;
    controls.minDistance = 12;
    controls.maxDistance = 30;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.32;
    controls.rotateSpeed = 0.55;
    controls.enableZoom = false;
    canvas.style.touchAction = 'pan-y';
    // On-demand rendering means no ambient motion or idle animation, including
    // for visitors who prefer reduced motion.
    let frame = 0;
    const render = () => {
      frame = 0;
      if (!disposed) renderer.render(scene, camera);
    };
    const requestRender = () => {
      if (!disposed && !frame) frame = window.requestAnimationFrame(render);
    };
    controls.addEventListener('change', requestRender);
    controls.update();

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height || disposed) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestRender();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const markers = new Map<LearningStationId, THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>>();
    STATIONS.forEach((station) => {
      const marker = new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.045, 6, 44), new THREE.MeshBasicMaterial({ color: station.color, transparent: true, opacity: 0.95 }));
      marker.position.fromArray([...station.position]);
      marker.rotation.x = -Math.PI / 2;
      marker.visible = false;
      scene.add(marker);
      markers.set(station.id, marker);
    });
    const updateMarkers = (active: LearningStationId, completed: string[]) => {
      markers.forEach((marker, id) => {
        marker.visible = id === active || completed.includes(id);
        const color = completed.includes(id) ? '#148b70' : STATIONS.find((station) => station.id === id)?.color ?? '#f5614c';
        marker.material.color.set(color);
        marker.material.opacity = id === active ? 1 : 0.45;
      });
      requestRender();
    };
    updateRef.current = updateMarkers;
    updateMarkers(activeStation, completedStations);
    const reset = () => {
      camera.position.copy(initialPosition);
      controls.target.set(0, 0.25, 0);
      controls.update();
      requestRender();
    };
    resetRef.current = reset;

    let model: THREE.Object3D | null = null;
    new GLTFLoader().load('/models/academy/quest-isles.glb', (gltf) => {
      if (disposed) {
        disposeObject(gltf.scene);
        return;
      }
      model = gltf.scene;
      scene.add(gltf.scene);
      setStatus('ready');
      requestRender();
    }, undefined, () => {
      if (!disposed) setStatus('fallback');
    });

    const raycaster = new THREE.Raycaster();
    const point = new THREE.Vector2();
    const getStation = (event: PointerEvent): LearningStationId | null => {
      if (!model) return null;
      const rect = canvas.getBoundingClientRect();
      point.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(point, camera);
      const intersections = raycaster.intersectObject(model, true);
      // Only use the front surface; scenery must not click through to a station.
      let object: THREE.Object3D | null = intersections[0]?.object ?? null;
      while (object) {
        const id = object.userData.stationId;
        if (STATIONS.some((station) => station.id === id)) return id as LearningStationId;
        object = object.parent;
      }
      return null;
    };
    let pointerStart: { x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => { pointerStart = { x: event.clientX, y: event.clientY }; };
    const pointerUp = (event: PointerEvent) => {
      if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) < 7) {
        const id = getStation(event);
        if (id) selectRef.current?.(id);
      }
      pointerStart = null;
    };
    const pointerCancel = () => { pointerStart = null; };
    const pointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || pointerStart) return;
      const id = getStation(event);
      canvas.style.cursor = id ? 'pointer' : 'grab';
      setHoveredStation(id);
    };
    const pointerLeave = () => { setHoveredStation(null); };
    const keyDown = (event: KeyboardEvent) => {
      if (event.key === 'Home') {
        event.preventDefault();
        reset();
        return;
      }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-'].includes(event.key)) return;
      event.preventDefault();
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (event.key === 'ArrowLeft') spherical.theta -= 0.12;
      if (event.key === 'ArrowRight') spherical.theta += 0.12;
      if (event.key === 'ArrowUp') spherical.phi -= 0.08;
      if (event.key === 'ArrowDown') spherical.phi += 0.08;
      if (event.key === '+' || event.key === '=') spherical.radius -= 1;
      if (event.key === '-') spherical.radius += 1;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.35, 1.32);
      spherical.radius = THREE.MathUtils.clamp(spherical.radius, 12, 30);
      camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target));
      controls.update();
      requestRender();
    };
    const contextLost = (event: Event) => {
      event.preventDefault();
      if (!disposed) setStatus('fallback');
    };
    const contextRestored = () => {
      if (disposed) return;
      setStatus(model ? 'ready' : 'loading');
      requestRender();
    };
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerCancel);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerleave', pointerLeave);
    canvas.addEventListener('keydown', keyDown);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      controls.removeEventListener('change', requestRender);
      controls.dispose();
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerCancel);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerleave', pointerLeave);
      canvas.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      disposeObject(scene);
      renderer.dispose();
      canvas.remove();
      updateRef.current = null;
      resetRef.current = null;
    };
    // The viewer is created once; station changes update its markers independently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleStation = STATIONS.find((station) => station.id === hoveredStation);

  return (
    <div className={cn('overflow-hidden rounded-[1.8rem] border border-[#dddfd3] bg-[#f1f6f0] text-[#242c38]', className)}>
      <div className="relative isolate h-[330px] sm:h-[390px] lg:h-[440px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,#e8f1eb_75%)]" />
        {status !== 'ready' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/models/academy/quest-isles-preview.png" alt="A floating learning island with a slide sanctuary, game arena, maker lab, memory grove and mastery gateway" className="pointer-events-none absolute inset-0 h-full w-full object-contain" />
        )}
        <div ref={hostRef} className={cn('absolute inset-0', status === 'fallback' && 'invisible')} />
        <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] shadow-sm backdrop-blur-md">Quest Isles · your learning world</div>
        {status === 'ready' && (
          <button type="button" onClick={() => resetRef.current?.()} aria-label="Reset island view" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white/80 shadow-sm transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#267c70]">
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
        {visibleStation && <div className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#242c38] px-4 py-2 text-xs font-semibold text-white">Enter {visibleStation.name}</div>}
        <p className="pointer-events-none absolute inset-x-4 bottom-4 text-center text-[11px] text-[#526a61]" role="status" aria-live="polite">
          {status === 'ready' ? 'Drag to explore · select a station to start' : status === 'loading' ? 'Your island is coming into view…' : 'Choose a station below to keep exploring.'}
        </p>
      </div>
      <nav aria-label="Learning island stations" className="grid grid-cols-5 gap-1.5 border-t border-[#dce5da] bg-white/65 p-2.5 sm:gap-2 sm:p-3">
        {STATIONS.map((station) => {
          const Icon = station.icon;
          const completed = completedStations.includes(station.id);
          const active = activeStation === station.id;
          return (
            <button key={station.id} type="button" onClick={() => selectRef.current?.(station.id)} aria-pressed={active} aria-label={`${station.name}${completed ? ', completed' : ''}`} className={cn('group relative flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 py-2 text-[10px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#267c70] sm:text-xs', active ? 'border-[#ed9c8d] bg-[#fff0ea] text-[#913b2b]' : 'border-transparent text-[#637168] hover:border-[#dce5da] hover:bg-white')}>
              <span className="relative"><Icon className="h-[18px] w-[18px]" />{completed && <Check className="absolute -right-2 -top-1 h-3 w-3 rounded-full bg-[#16795e] p-0.5 text-white" />}</span>
              <span>{station.short}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default LearningWorld3D;
