'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cn } from '@/lib/utils';

export type LearningPlayFamily = 'code' | 'prompt' | 'video' | 'research' | 'design' | 'creative';
export type LearningPlayPose = { id: string; x: number; y: number; rotation?: number; scale?: number; placed?: boolean };
export type LearningPlaySceneProps = {
  family: LearningPlayFamily;
  round: number;
  progress: number;
  outcome: 'playing' | 'success' | 'retry';
  active?: boolean;
  className?: string;
  poses?: LearningPlayPose[];
  selectedId?: string | null;
};

const BLUE = '#335cff';
const ORANGE = '#f58b45';
const ROOTS: Record<LearningPlayFamily, string> = {
  prompt: 'Prompt_Play', code: 'Code_Play', video: 'Video_Play',
  research: 'Research_Play', design: 'Design_Play', creative: 'Creative_Play',
};
const PARTS: Record<LearningPlayFamily, string[]> = {
  prompt: ['Prompt_Context_tile_1', 'Prompt_Context_tile_2', 'Prompt_Context_tile_3'],
  code: ['Code_Circuit_node_0', 'Code_Circuit_node_1', 'Code_Circuit_node_2'],
  video: ['Video_Reel_spoke_0', 'Video_Reel_spoke_1', 'Video_Reel_spoke_2'],
  research: ['Research_Evidence_node_0', 'Research_Evidence_node_1', 'Research_Evidence_node_2'],
  design: ['Design_Hero_plane', 'Design_Grid_plane_1', 'Design_Grid_plane_2'],
  creative: ['Creative_Idea_orb', 'Creative_Orbit_focus', 'Creative_Aperture_right'],
};

const clamp = (value: number, fallback = 0) => Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback;

/** Dispose shared GLTF resources once, including unused families in the loaded kit. */
function disposeObjects(roots: THREE.Object3D[]) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  roots.forEach(root => root.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
      geometries.add(object.geometry);
      (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => {
        materials.add(material);
        Object.values(material).forEach(value => { if (value instanceof THREE.Texture) textures.add(value); });
      });
    }
  }));
  textures.forEach(value => value.dispose());
  materials.forEach(value => value.dispose());
  geometries.forEach(value => value.dispose());
}

/** A quiet, stateful sculpture. The sibling game board owns every playable action. */
export function LearningPlayScene({ family, round, progress, outcome, active = true, className, poses = [], selectedId = null }: LearningPlaySceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({ round, progress, outcome, poses, selectedId });
  const activeRef = useRef(active);
  const updateRef = useRef<(() => void) | null>(null);
  const [mode, setMode] = useState<'loading' | 'blender' | 'fallback'>('loading');
  stateRef.current = { round, progress, outcome, poses, selectedId };
  activeRef.current = active;

  useEffect(() => { updateRef.current?.(); }, [round, progress, outcome, poses, selectedId, active]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setMode('loading');
    const canvas = document.createElement('canvas');
    let context: WebGL2RenderingContext | null = null;
    try { context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { /* The accessible board remains playable with the flat illustration. */ }
    if (!context) { setMode('fallback'); return; }
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { setMode('fallback'); return; }

    let disposed = false;
    let lostContext = false;
    let inView = true;
    let animationFrame = 0;
    let transitionStart = 0;
    let animating = false;
    let model: THREE.Object3D | null = null;
    let loadedKit: THREE.Object3D | null = null;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvas.className = 'absolute inset-0 h-full w-full';
    canvas.style.pointerEvents = 'none';
    canvas.style.visibility = 'hidden';
    canvas.setAttribute('aria-hidden', 'true');
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-4, 4, 1.8, -1.8, 0.1, 30);
    camera.position.set(3, 2.8, 6);
    camera.lookAt(0, 1.1, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd3d9e3, 2.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-3, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(512, 512);
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.normalBias = 0.025;
    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.radius = 4;
    scene.add(keyLight);
    const fill = new THREE.DirectionalLight(0xe9edff, 1.0);
    fill.position.set(4, 3, -2);
    scene.add(fill);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.1 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.04;
    shadow.receiveShadow = true;
    scene.add(shadow);

    type Piece = { group: THREE.Group; base: THREE.Vector3; extent: number; from: THREE.Vector3; target: THREE.Vector3; fromRotation: number; rotation: number; fromScale: number; scale: number; materials: THREE.MeshStandardMaterial[] };
    const pieces: Piece[] = [];
    const extras: Array<{ object: THREE.Object3D; base: THREE.Vector3; scale: THREE.Vector3 }> = [];
    const pathMaterial = new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0.45 });
    const pathGeometry = new THREE.BufferGeometry();
    const path = new THREE.Line(pathGeometry, pathMaterial);
    path.visible = false;
    scene.add(path);
    const tracer = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 8), new THREE.MeshStandardMaterial({ color: ORANGE, roughness: 0.6 }));
    tracer.visible = false;
    scene.add(tracer);
    let fromProgress = clamp(stateRef.current.progress);
    let displayedProgress = fromProgress;
    let targetProgress = fromProgress;

    const canRender = () => !disposed && !lostContext && activeRef.current && inView && !document.hidden;
    const stop = () => { if (animationFrame) cancelAnimationFrame(animationFrame); animationFrame = 0; };
    const requestRender = () => { if (!animationFrame && canRender()) animationFrame = requestAnimationFrame(render); };

    function resize() {
      const width = host!.clientWidth;
      const height = host!.clientHeight;
      if (!width || !height) return;
      const aspect = width / height;
      // Keep breathing room even in the game's narrow supporting column.
      const halfHeight = Math.max(1.72, 1.98 / aspect);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      requestRender();
    }

    function applyFrame(amount: number) {
      const current = stateRef.current;
      displayedProgress = THREE.MathUtils.lerp(fromProgress, targetProgress, amount);
      pieces.forEach((piece, index) => {
        piece.group.position.lerpVectors(piece.from, piece.target, amount);
        piece.group.rotation.z = THREE.MathUtils.lerp(piece.fromRotation, piece.rotation, amount);
        piece.group.scale.setScalar(THREE.MathUtils.lerp(piece.fromScale, piece.scale, amount));
        const isSelected = current.poses[index]?.id === current.selectedId;
        piece.materials.forEach(material => {
          material.emissive.set(current.outcome === 'retry' ? ORANGE : BLUE);
          material.emissiveIntensity = isSelected ? 0.23 : current.outcome === 'success' ? 0.1 : 0;
        });
      });
      extras.forEach(({ object, base, scale }) => {
        object.position.copy(base);
        object.scale.copy(scale);
        if (object.name === 'Code_Active_trace') object.scale.x = scale.x * (0.2 + displayedProgress * 0.8);
        if (object.name === 'Video_Cut_playhead' || object.name === 'Video_Cut_marker') object.position.x += (displayedProgress - 0.5) * 1.35;
        if (object.name === 'Design_Resize_marker') object.position.x += (displayedProgress - 0.5) * 0.3;
        if (object.name === 'Creative_Idea_orbit') object.rotation.y = displayedProgress * Math.PI * 0.6;
      });
      // The path follows the manipulated model parts: progress moves a signal along it.
      if ((family === 'code' || family === 'research') && pieces.length >= 3 && displayedProgress > 0.005) {
        const points = pieces.map(piece => piece.group.position.clone().add(new THREE.Vector3(0, 0, piece.extent * 0.52)));
        const curve = new THREE.CatmullRomCurve3(points);
        const samples = curve.getPoints(48);
        pathGeometry.setFromPoints(samples);
        pathGeometry.setDrawRange(0, Math.max(2, Math.floor(displayedProgress * 49)));
        pathMaterial.color.set(current.outcome === 'retry' ? ORANGE : BLUE);
        path.visible = true;
        tracer.position.copy(curve.getPoint(displayedProgress));
        tracer.visible = true;
      } else { path.visible = false; tracer.visible = false; }
    }

    function render(timestamp: number) {
      animationFrame = 0;
      if (!canRender()) return;
      const linear = animating ? Math.min(1, (timestamp - transitionStart) / 480) : 1;
      const eased = 1 - Math.pow(1 - linear, 3);
      applyFrame(eased);
      renderer.render(scene, camera);
      canvas.dataset.frame = String(Number(canvas.dataset.frame || 0) + 1);
      if (animating && linear < 1) requestRender();
      else animating = false;
    }

    function update() {
      if (disposed) return;
      const current = stateRef.current;
      fromProgress = displayedProgress;
      targetProgress = clamp(current.progress);
      pieces.forEach((piece, index) => {
        const pose = current.poses[index];
        piece.from.copy(piece.group.position);
        piece.target.copy(piece.base);
        if (pose) {
          piece.target.x += (clamp(pose.x, 0.5) - 0.5) * 0.72;
          piece.target.y += (0.5 - clamp(pose.y, 0.5)) * 0.56;
          if (pose.placed) piece.target.y -= 0.025;
        }
        piece.fromRotation = piece.group.rotation.z;
        piece.rotation = Number.isFinite(pose?.rotation) ? pose!.rotation! : 0;
        piece.fromScale = piece.group.scale.x;
        piece.scale = pose?.scale === undefined ? 1 : 0.75 + clamp(pose.scale, 0.5) * 0.5;
      });
      transitionStart = performance.now();
      animating = !mediaQuery.matches;
      if (!canRender()) { stop(); animating = false; return; }
      requestRender();
    }
    updateRef.current = update;

    function attachModel(root: THREE.Object3D) {
      const content = new THREE.Group();
      content.add(root);
      scene.add(content);
      root.updateWorldMatrix(true, true);
      const bounds = new THREE.Box3().setFromObject(root);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = Math.min(3.4 / Math.max(size.x, 0.01), 2.35 / Math.max(size.y, 0.01), 2.7 / Math.max(size.z, 0.01));
      content.scale.setScalar(scale);
      content.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      content.updateMatrixWorld(true);
      root.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.castShadow = true;
          object.receiveShadow = true;
        }
      });
      PARTS[family].forEach((name, index) => {
        const object = root.getObjectByName(name);
        if (!object) return;
        const box = new THREE.Box3().setFromObject(object);
        const group = new THREE.Group();
        group.position.copy(box.getCenter(new THREE.Vector3()));
        scene.add(group);
        group.updateWorldMatrix(true, false);
        group.attach(object);
        if (family === 'prompt') {
          const signal = root.getObjectByName(`Prompt_Context_signal_${index + 1}`);
          if (signal) group.attach(signal);
          if (index === 2) {
            const marker = root.getObjectByName('Prompt_Focus_marker');
            if (marker) group.attach(marker);
          }
        }
        const materials: THREE.MeshStandardMaterial[] = [];
        group.traverse(child => {
          if (!(child instanceof THREE.Mesh)) return;
          const clone = (material: THREE.Material) => {
            const copy = material.clone();
            if (copy instanceof THREE.MeshStandardMaterial) materials.push(copy);
            return copy;
          };
          child.material = Array.isArray(child.material) ? child.material.map(clone) : clone(child.material);
        });
        pieces.push({ group, base: group.position.clone(), extent: box.getSize(new THREE.Vector3()).length(), from: group.position.clone(), target: group.position.clone(), fromRotation: 0, rotation: 0, fromScale: 1, scale: 1, materials });
      });
      ['Code_Active_trace', 'Video_Cut_playhead', 'Video_Cut_marker', 'Design_Resize_marker', 'Creative_Idea_orbit'].forEach(name => {
        const object = root.getObjectByName(name);
        if (object) extras.push({ object, base: object.position.clone(), scale: object.scale.clone() });
      });
      model = content;
      update();
      resize();
    }

    const loader = new GLTFLoader();
    loader.load('/models/academy/minimal-play-kit.glb', gltf => {
      if (disposed) { disposeObjects([gltf.scene]); return; }
      loadedKit = gltf.scene;
      const root = gltf.scene.getObjectByName(ROOTS[family]);
      if (!root) { setMode('fallback'); return; }
      root.removeFromParent();
      attachModel(root);
      canvas.style.visibility = lostContext ? 'hidden' : 'visible';
      setMode(lostContext ? 'fallback' : 'blender');
    }, undefined, () => { if (!disposed) setMode('fallback'); });

    const onVisibility = () => { if (canRender()) update(); else stop(); };
    const onMotion = () => { animating = false; update(); };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lostContext = true;
      stop();
      canvas.style.visibility = 'hidden';
      setMode('fallback');
    };
    const onContextRestored = () => { lostContext = false; if (model) { canvas.style.visibility = 'visible'; setMode('blender'); update(); } };
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    document.addEventListener('visibilitychange', onVisibility);
    mediaQuery.addEventListener('change', onMotion);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    const intersectionObserver = new IntersectionObserver(entries => {
      inView = entries[0]?.isIntersecting ?? true;
      if (canRender()) update(); else stop();
    });
    intersectionObserver.observe(host);
    resize();

    return () => {
      disposed = true;
      stop();
      updateRef.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      mediaQuery.removeEventListener('change', onMotion);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      disposeObjects(loadedKit ? [scene, loadedKit] : [scene]);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [family]);

  return <div
    ref={hostRef}
    className={cn('pointer-events-none relative h-[210px] w-full overflow-hidden bg-[#f8f9fc] sm:h-[230px]', className)}
    data-learning-play-scene={family}
    data-scene-source={mode}
    role="img"
    aria-label={`${family} learning sculpture, round ${round + 1}. ${outcome === 'success' ? 'Challenge complete.' : outcome === 'retry' ? 'Adjust the game pieces and try again.' : `${Math.round(clamp(progress) * 100)} percent complete.`}`}
  >
    {mode !== 'blender' && <FlatPlaySculpture family={family} progress={progress} outcome={outcome} poses={poses} selectedId={selectedId} />}
  </div>;
}

function FlatPlaySculpture({ family, progress, outcome, poses, selectedId }: Pick<LearningPlaySceneProps, 'family' | 'progress' | 'outcome' | 'poses' | 'selectedId'>) {
  const accent = outcome === 'retry' ? ORANGE : BLUE;
  const nodes = [[-72, 24], [0, -42], [72, 24]];
  return <svg aria-hidden="true" viewBox="0 0 440 230" className="absolute inset-0 h-full w-full" data-flat-play-sculpture={family}>
    <ellipse cx="220" cy="197" rx="74" ry="7" fill="#202938" opacity=".06" />
    <g transform="translate(220 112)" fill="none" stroke="#283140" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
      {family === 'prompt' && [2, 1, 0].map(i => <g key={i} transform={`translate(${(poses?.[i]?.x ?? 0.5) * 12 - 6} ${i * 19 - 20})`}><path d="M-75 -17 33 -29 75 -8 -35 6Z" fill={i === 2 ? '#283140' : '#ffffff'} /><path d="m-31 5 72-9" stroke={accent} strokeWidth="3" /></g>)}
      {family === 'video' && <><circle r="65" /><circle r="52" stroke={accent} strokeWidth="2" /><g transform={`rotate(${clamp(progress) * 90})`}>{[0, 120, 240].map(angle => <path key={angle} d="M0 0V-50" transform={`rotate(${angle})`} stroke="#b8c0ce" />)}</g><circle r="15" fill="#ffffff" stroke="#b8c0ce" /><path d="M-72 76H72" stroke="#aeb8c8" /><path d={`M${-65 + clamp(progress) * 130} 65v22`} stroke={accent} /></>}
      {(family === 'code' || family === 'research') && <><path d="M-72 24 0-42 72 24" stroke="#d6dce6" strokeWidth="3" /><path d="M-72 24 0-42 72 24" stroke={accent} strokeWidth="3" pathLength="100" strokeDasharray={`${clamp(progress) * 100} 100`} />{nodes.map(([x, y], i) => <g key={i} transform={`translate(${x + ((poses?.[i]?.x ?? .5) - .5) * 22} ${y + ((poses?.[i]?.y ?? .5) - .5) * 16}) rotate(${(poses?.[i]?.rotation ?? 0) * 180 / Math.PI})`}>{family === 'code' ? <rect x="-12" y="-12" width="24" height="24" rx="4" fill={selectedId === poses?.[i]?.id ? accent : '#ffffff'} /> : <circle r="12" fill={i === 1 ? accent : '#ffffff'} />}</g>)}{family === 'research' && <><circle cx="30" cy="-8" r="31" strokeWidth="4" /><path d="m51 16 20 26" /></>}</>}
      {(family === 'design' || family === 'creative') && <><rect x="-79" y="-65" width="158" height="140" rx="2" />{family === 'design' ? <><path d="M-63-38H56" stroke="#aeb8c8" strokeWidth="19" /><rect x="-62" y="-13" width={45 + clamp(progress) * 15} height="56" fill={accent} stroke="none" /><rect x="12" y="-13" width="48" height="56" fill="#ffffff" stroke="#ccd3df" strokeWidth="2" /></> : <><circle r={30 + clamp(progress) * 7} fill={accent} stroke="none" /><ellipse rx="57" ry="24" transform="rotate(-28)" stroke="#aeb8c8" strokeWidth="2" /><circle cx="48" cy="-25" r="6" fill={ORANGE} stroke="none" /></>}<circle cx="79" cy="75" r="6" fill={ORANGE} stroke="none" /></>}
    </g>
  </svg>;
}
