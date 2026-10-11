'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RotateCcw } from 'lucide-react';
import type { LabState, LessonLab } from '@/lib/lesson-labs';
import { cn } from '@/lib/utils';

type Props = {
  lab: LessonLab; state: LabState; selectedPiece: string | null;
  onSelectPiece: (id: string) => void; onSelectSlot: (index: number) => void;
  active?: boolean; runId?: number;
};

function disposeScene(root: THREE.Object3D) {
  const geometry = new Set<THREE.BufferGeometry>();
  const material = new Set<THREE.Material>();
  const texture = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return;
    if (object instanceof THREE.Mesh) geometry.add(object.geometry);
    (Array.isArray(object.material) ? object.material : [object.material]).forEach(value => {
      material.add(value);
      Object.values(value).forEach(item => { if (item instanceof THREE.Texture) texture.add(item); });
    });
  });
  geometry.forEach(value => value.dispose());
  material.forEach(value => value.dispose());
  texture.forEach(value => value.dispose());
}

function labelSprite(text: string, color = '#fffbea', background = '#294338') {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 136;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = background;
    ctx.beginPath();
    ctx.roundRect(4, 4, 376, 128, 24);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '800 54px system-ui';
    ctx.fillText(text, 192, 69, 352);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, depthTest: false, toneMapped: false }));
  sprite.scale.set(1.35, 0.48, 1);
  return sprite;
}

/** The DOM workbench below mirrors every pick, including when WebGL is unavailable. */
export function LessonLabScene({ lab, state, selectedPiece, onSelectPiece, onSelectSlot, active = true, runId = 0 }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef({ onSelectPiece, onSelectSlot });
  const stateRef = useRef({ state, selectedPiece });
  const activeRef = useRef(active);
  const updateRef = useRef<(() => void) | null>(null);
  const runRef = useRef<(() => void) | null>(null);
  const resetRef = useRef<(() => void) | null>(null);
  const [mode, setMode] = useState<'loading' | 'model' | 'shapes' | 'flat'>('loading');
  actionRef.current = { onSelectPiece, onSelectSlot };
  stateRef.current = { state, selectedPiece };
  activeRef.current = active;

  useEffect(() => { updateRef.current?.(); }, [state, selectedPiece, active]);
  useEffect(() => { if (runId) runRef.current?.(); }, [runId]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setMode('loading');
    let renderer: THREE.WebGLRenderer;
    // Probe on the renderer's own canvas so unavailable WebGL selects the workbench
    // without Three logging an expected graphics error or creating a second context.
    const renderingCanvas = document.createElement('canvas');
    let context: WebGL2RenderingContext | null;
    try { context = renderingCanvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { setMode('flat'); return; }
    if (!context) { setMode('flat'); return; }
    try { renderer = new THREE.WebGLRenderer({ canvas: renderingCanvas, context, alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { setMode('flat'); return; }
    let disposed = false;
    let frame = 0;
    let pulseStart: number | null = null;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = 'absolute inset-0 h-full w-full';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', `${lab.title}. Drag to rotate. Select a colored part, then a numbered station. Arrow keys rotate, Home resets. All placement controls are also available below the scene.`);
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const startPosition = new THREE.Vector3(5.6, 7.2, 9.5);
    camera.position.copy(startPosition);
    scene.add(new THREE.HemisphereLight(0xfffaee, 0x879ab0, 1.6));
    const key = new THREE.DirectionalLight(0xfff6e5, 2.2);
    key.position.set(-4, 9, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfebff, 0.8);
    rim.position.set(6, 5, -4);
    scene.add(rim);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0.4, -0.2);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = false;
    controls.minPolarAngle = 0.4;
    controls.maxPolarAngle = 1.24;
    controls.rotateSpeed = 0.45;
    canvas.style.touchAction = 'pan-y';

    const board = new THREE.Mesh(new THREE.BoxGeometry(8.8, 0.3, 7.5), new THREE.MeshStandardMaterial({ color: '#e8decc', roughness: 0.92 }));
    board.position.set(0, -0.28, -0.4);
    scene.add(board);
    const legsMaterial = new THREE.MeshStandardMaterial({ color: '#788687', roughness: 0.8 });
    [-3.6, 3.6].forEach(x => [-3, 2].forEach(z => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 0.8, 8), legsMaterial);
      leg.position.set(x, -0.8, z);
      scene.add(leg);
    }));

    const pickable: THREE.Object3D[] = [];
    const slots: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[] = [];
    const tokenGroups = new Map<string, THREE.Group>();
    const tokenMaterials = new Map<string, THREE.MeshStandardMaterial>();
    const rings = new Map<string, THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>>();
    const xAt = (index: number) => (index - 2) * 1.5;
    const pathways: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>[] = [];
    for (let index = 0; index < 5; index += 1) {
      const socket = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.12, 1.35), new THREE.MeshStandardMaterial({ color: '#c5c4b7', roughness: 0.8 }));
      socket.position.set(xAt(index), 0, 0.8);
      socket.userData.slot = index;
      scene.add(socket);
      slots.push(socket);
      pickable.push(socket);
      const text = labelSprite(`${index + 1}`, '#294338', '#fffbea');
      text.scale.set(0.34, 0.34, 1);
      text.position.set(xAt(index), 0.28, 1.54);
      scene.add(text);
      if (index < 4) {
        const path = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 0.17), new THREE.MeshStandardMaterial({ color: '#899d94', emissive: '#000000' }));
        path.position.set(xAt(index) + 0.75, 0.1, 0.8);
        scene.add(path);
        pathways.push(path);
      }
    }

    lab.pieces.forEach((item, index) => {
      const group = new THREE.Group();
      const material = new THREE.MeshStandardMaterial({ color: item.color, roughness: 0.44, metalness: 0.05 });
      tokenMaterials.set(item.id, material);
      const shape = lab.family === 'research' ? new THREE.CylinderGeometry(0.45, 0.45, 0.28, 6)
        : lab.family === 'creative' ? new THREE.IcosahedronGeometry(0.42, 0)
          : lab.family === 'video' ? new THREE.BoxGeometry(0.95, 0.32, 0.66)
            : lab.family === 'design' ? new THREE.BoxGeometry(0.78, 0.12, 1)
              : lab.family === 'prompt' ? new THREE.CylinderGeometry(0.34, 0.44, 0.5, 12)
                : new THREE.BoxGeometry(0.78, 0.45, 0.78);
      const token = new THREE.Mesh(shape, material);
      token.userData.piece = item.id;
      group.add(token);
      pickable.push(token);
      if (lab.family === 'code' || lab.family === 'video') {
        const screen = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.34), new THREE.MeshStandardMaterial({ color: '#263a4a', emissive: '#263a4a', emissiveIntensity: 0.12 }));
        screen.position.y = 0.27;
        screen.userData.piece = item.id;
        group.add(screen);
        pickable.push(screen);
      }
      const label = labelSprite(item.short);
      label.position.y = 0.85;
      group.add(label);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.04, 6, 30), new THREE.MeshBasicMaterial({ color: '#343f54' }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.13;
      group.add(ring);
      rings.set(item.id, ring);
      group.position.set((index - 2.5) * 1.24, 0.3, 2.68);
      scene.add(group);
      tokenGroups.set(item.id, group);
    });

    const resultBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: lab.color, emissive: lab.color, emissiveIntensity: 0.2 }));
    resultBeacon.position.set(3.6, 1.5, -1.8);
    scene.add(resultBeacon);
    const gauge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), new THREE.MeshStandardMaterial({ color: lab.color }));
    gauge.position.set(-3.65, 0.5, -1.3);
    scene.add(gauge);

    const render = (time: number) => {
      frame = 0;
      if (disposed || !activeRef.current) return;
      if (pulseStart !== null) {
        const elapsed = time - pulseStart;
        const step = Math.floor(elapsed / 240);
        pathways.forEach((path, index) => { path.material.emissive.set(index === step % 4 ? lab.color : '#000000'); });
        resultBeacon.scale.setScalar(1 + Math.sin(elapsed / 170) * 0.12);
        if (elapsed < 1700) frame = window.requestAnimationFrame(render);
        else {
          pulseStart = null;
          pathways.forEach(path => path.material.emissive.set('#000000'));
          resultBeacon.scale.setScalar(1);
        }
      }
      renderer.render(scene, camera);
    };
    const requestRender = () => {
      if (disposed || !activeRef.current || frame) return;
      frame = window.requestAnimationFrame(render);
    };
    controls.addEventListener('change', requestRender);
    controls.update();
    const update = () => {
      const current = stateRef.current;
      if (!activeRef.current && frame) { window.cancelAnimationFrame(frame); frame = 0; pulseStart = null; }
      lab.pieces.forEach((item, index) => {
        const group = tokenGroups.get(item.id)!;
        const slot = current.state.slots.indexOf(item.id);
        group.position.set(slot >= 0 ? xAt(slot) : (index - 2.5) * 1.24, slot >= 0 ? 0.37 : 0.3, slot >= 0 ? 0.8 : 2.68);
        rings.get(item.id)!.visible = current.selectedPiece === item.id;
        tokenMaterials.get(item.id)!.emissive.set(current.selectedPiece === item.id ? item.color : '#000000');
        tokenMaterials.get(item.id)!.emissiveIntensity = current.selectedPiece === item.id ? 0.22 : 0;
      });
      slots.forEach((socket, index) => {
        const id = current.state.slots[index];
        socket.material.color.set(id ? lab.pieces.find(item => item.id === id)?.color || '#c5c4b7' : '#c5c4b7');
      });
      const first = lab.controls[0];
      gauge.scale.y = 0.2 + ((current.state.first - first.min) / (first.max - first.min)) * 1.2;
      gauge.position.y = gauge.scale.y * 0.6;
      const correct = lab.sequence.every((id, index) => current.state.slots[index] === id);
      resultBeacon.material.color.set(correct && current.state.safeguard ? '#66b287' : '#efb665');
      resultBeacon.material.emissive.set(correct && current.state.safeguard ? '#66b287' : '#efb665');
      requestRender();
    };
    updateRef.current = update;
    runRef.current = () => { if (!activeRef.current) return; pulseStart = reducedMotion ? null : performance.now(); requestRender(); };
    resetRef.current = () => { camera.position.copy(startPosition); controls.target.set(0, 0.4, -0.2); controls.update(); requestRender(); };
    update();

    // Models are bundled locally. A missing model leaves the interactive geometry intact.
    new GLTFLoader().load('/models/academy/lesson-lab-kit.glb', gltf => {
      if (disposed) { disposeScene(gltf.scene); return; }
      gltf.scene.updateMatrixWorld(true);
      const group = new THREE.Group();
      gltf.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh) || !object.name.startsWith(lab.prefix)) return;
        const clone = object.clone();
        clone.matrix.copy(object.matrixWorld);
        clone.matrixAutoUpdate = false;
        group.add(clone);
      });
      if (!group.children.length) { disposeScene(gltf.scene); setMode('shapes'); return; }
      const box = new THREE.Box3().setFromObject(group);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = Math.min(6.6 / Math.max(size.x, size.z, 0.1), 2.5 / Math.max(size.y, 0.1));
      group.scale.setScalar(scale);
      group.position.set(-center.x * scale, -box.min.y * scale, -2.0 - center.z * scale);
      scene.add(group);
      // Remove unrelated families and dispose only the geometry not used by this scene.
      const usedGeometries = new Set<THREE.BufferGeometry>();
      const usedMaterials = new Set<THREE.Material>();
      group.traverse(object => { if (object instanceof THREE.Mesh) { usedGeometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(value => usedMaterials.add(value)); } });
      const unusedGeometry = new Set<THREE.BufferGeometry>();
      const unusedMaterial = new Set<THREE.Material>();
      gltf.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        if (!usedGeometries.has(object.geometry)) unusedGeometry.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(value => { if (!usedMaterials.has(value)) unusedMaterial.add(value); });
      });
      unusedGeometry.forEach(value => value.dispose());
      unusedMaterial.forEach(value => value.dispose());
      setMode('model');
      requestRender();
    }, undefined, () => { if (!disposed) { setMode('shapes'); requestRender(); } });

    const resize = () => {
      if (disposed) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      requestRender();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const raycaster = new THREE.Raycaster();
    const point = new THREE.Vector2();
    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      point.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(point, camera);
      return raycaster.intersectObjects(pickable, false)[0]?.object;
    };
    let down: { x: number; y: number } | null = null;
    const pointerDown = (event: PointerEvent) => { down = { x: event.clientX, y: event.clientY }; };
    const pointerUp = (event: PointerEvent) => {
      if (!activeRef.current) return;
      if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 7) {
        const object = pick(event);
        if (typeof object?.userData.piece === 'string') {
          const occupied = stateRef.current.state.slots.indexOf(object.userData.piece);
          if (stateRef.current.selectedPiece && stateRef.current.selectedPiece !== object.userData.piece && occupied >= 0) actionRef.current.onSelectSlot(occupied);
          else actionRef.current.onSelectPiece(object.userData.piece);
        }
        else if (typeof object?.userData.slot === 'number') actionRef.current.onSelectSlot(object.userData.slot);
      }
      down = null;
    };
    const pointerCancel = () => { down = null; };
    const pointerMove = (event: PointerEvent) => { if (!down && event.pointerType !== 'touch') canvas.style.cursor = pick(event) ? 'pointer' : 'grab'; };
    const keyDown = (event: KeyboardEvent) => {
      if (!activeRef.current) return;
      if (event.key === 'Home') { event.preventDefault(); resetRef.current?.(); return; }
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (event.key === 'ArrowLeft') spherical.theta -= 0.14;
      if (event.key === 'ArrowRight') spherical.theta += 0.14;
      if (event.key === 'ArrowUp') spherical.phi -= 0.08;
      if (event.key === 'ArrowDown') spherical.phi += 0.08;
      spherical.phi = THREE.MathUtils.clamp(spherical.phi, 0.4, 1.24);
      camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target));
      controls.update();
      requestRender();
    };
    const contextLost = (event: Event) => { event.preventDefault(); if (!disposed) setMode('flat'); };
    const contextRestored = () => { if (!disposed) { setMode('shapes'); requestRender(); } };
    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerCancel);
    canvas.addEventListener('pointermove', pointerMove);
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
      canvas.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      disposeScene(scene);
      renderer.dispose();
      canvas.remove();
      updateRef.current = null;
      runRef.current = null;
      resetRef.current = null;
    };
  }, [lab]);

  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-white/70 bg-[#e8ede4]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#fffaf0_0%,_transparent_70%)]" />
      <div ref={hostRef} className={cn('relative h-[310px] sm:h-[400px]', mode === 'flat' && 'invisible h-0 sm:h-0')} />
      {mode === 'flat' && (
        <div className="relative grid min-h-[220px] grid-cols-5 gap-2 p-4 sm:p-8" aria-label="Visual workbench">
          {state.slots.map((id, index) => {
            const part = lab.pieces.find(item => item.id === id);
            return <button key={index} onClick={() => onSelectSlot(index)} className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[#b6c6b8] bg-white/70 px-1 text-center text-xs font-semibold text-[#42524d]" style={part ? { borderColor: part.color, backgroundColor: `${part.color}35` } : undefined}><span className="text-2xl" aria-hidden>{part?.symbol || `${index + 1}`}</span><span>{part?.short || lab.slotLabels[index]}</span></button>;
          })}
        </div>
      )}
      <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#67796b]">{mode === 'loading' ? 'Opening your workshop' : mode === 'flat' ? 'Visual workbench' : 'Drag to explore · pick a part'}</div>
      {mode !== 'flat' && <button onClick={() => resetRef.current?.()} className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-white/85 text-[#5e6b62] transition hover:bg-white" title="Reset 3D view" aria-label="Reset 3D view"><RotateCcw className="size-4" /></button>}
      <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3 text-[10px] font-medium text-[#63776b]">
        <span>{selectedPiece ? `Selected: ${lab.pieces.find(item => item.id === selectedPiece)?.label}. Choose a station below.` : 'Select a part from the tray to begin.'}</span>
        <span className="hidden shrink-0 sm:inline">{mode === 'model' ? 'Handcrafted 3D workshop' : 'Every control works below'}</span>
      </div>
    </div>
  );
}
