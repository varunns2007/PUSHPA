import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

interface HeatmapCell {
  col: number;
  row: number;
  densityBefore: number;  // 0–100 tree density %
  densityToday: number;
  loss: number;           // densityBefore - densityToday
}

interface PoliceStation {
  name: string;
  distKm: number;
  lat: number;
  lng: number;
}

interface HeatmapDensity3DSceneProps {
  forestName: string;
  onPoliceDispatch: (cell: HeatmapCell, stations: PoliceStation[]) => void;
}

// ─── Demo Data Generator ───────────────────────────────────────────
const GRID = 20;
const POLICE_STATIONS: PoliceStation[] = [
  { name: 'Masinagudi Forest Range Station', distKm: 4.2,  lat: 11.5621, lng: 76.6241 },
  { name: 'Ooty (Udhagamandalam) Police HQ', distKm: 18.7, lat: 11.4102, lng: 76.6950 },
  { name: 'Gudalur Sub-Division Police',      distKm: 26.1, lat: 11.4979, lng: 76.4981 },
];

function generateDensityGrid(): HeatmapCell[] {
  const cells: HeatmapCell[] = [];
  const cx = 10, cy = 8; // clearing epicentre

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      // Base density — high in core forest, lower at edges
      const edgeFactor = 1 - (Math.abs(c - GRID / 2) + Math.abs(r - GRID / 2)) / (GRID * 1.2);
      const base = 55 + edgeFactor * 40 + (Math.random() - 0.5) * 10;
      const densityBefore = Math.max(20, Math.min(98, base));

      // Clearing around epicentre
      const dist = Math.sqrt((c - cx) ** 2 + (r - cy) ** 2);
      let lossMultiplier = 0;
      if (dist < 2.5) lossMultiplier = 0.6 + Math.random() * 0.3;
      else if (dist < 4)   lossMultiplier = 0.25 + Math.random() * 0.25;
      else if (dist < 6)   lossMultiplier = 0.05 + Math.random() * 0.1;

      const densityToday = Math.max(5, densityBefore * (1 - lossMultiplier));
      cells.push({ col: c, row: r, densityBefore, densityToday, loss: densityBefore - densityToday });
    }
  }
  return cells;
}

// ─── Color by density ─────────────────────────────────────────────
function densityColor(d: number): THREE.Color {
  if (d > 70) return new THREE.Color(0x10b981); // emerald — dense
  if (d > 50) return new THREE.Color(0x84cc16); // lime
  if (d > 35) return new THREE.Color(0xf59e0b); // amber
  if (d > 20) return new THREE.Color(0xf97316); // orange
  return new THREE.Color(0xef4444);             // red — cleared
}

// ─── Component ────────────────────────────────────────────────────
export const HeatmapDensity3DScene: React.FC<HeatmapDensity3DSceneProps> = ({
  forestName,
  onPoliceDispatch,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    bars: THREE.Mesh[];
    cells: HeatmapCell[];
    angle: number;
    rafId: number;
  } | null>(null);

  const [sliderDay, setSliderDay] = useState(0);   // 0=before, 100=today
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [cells] = useState<HeatmapCell[]>(() => generateDensityGrid());
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [dispatchedCell, setDispatchedCell] = useState<HeatmapCell | null>(null);
  const [totalLoss, setTotalLoss] = useState(0);
  const [criticalCells, setCriticalCells] = useState(0);

  // Stats
  useEffect(() => {
    const critical = cells.filter(c => c.loss > 15).length;
    const avgLoss = cells.reduce((s, c) => s + c.loss, 0) / cells.length;
    setCriticalCells(critical);
    setTotalLoss(parseFloat(avgLoss.toFixed(1)));
  }, [cells]);

  // ─── Three.js Setup ───────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const W = container.clientWidth;
    const H = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020913);
    scene.fog = new THREE.FogExp2(0x020913, 0.008);

    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 500);
    camera.position.set(0, 28, 38);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0x10b981, 1.4);
    dirLight.position.set(20, 40, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);
    const redLight = new THREE.PointLight(0xef4444, 4, 25);
    redLight.position.set(3, 6, -2);
    scene.add(redLight);
    const blueLight = new THREE.PointLight(0x06b6d4, 2, 30);
    blueLight.position.set(-15, 8, 10);
    scene.add(blueLight);

    // Ground grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x10b981, 0x0d2d1c);
    gridHelper.material.opacity = 0.35;
    (gridHelper.material as THREE.Material).transparent = true;
    scene.add(gridHelper);

    // Build bars
    const barSize = 0.85;
    const bars: THREE.Mesh[] = [];
    const spacing = 1.0;
    const offsetX = -(GRID * spacing) / 2 + spacing / 2;
    const offsetZ = -(GRID * spacing) / 2 + spacing / 2;

    cells.forEach((cell, idx) => {
      const h = Math.max(0.1, cell.densityBefore / 100 * 6);
      const geo = new THREE.BoxGeometry(barSize, h, barSize);
      // Shift geometry so bar grows from bottom
      geo.translate(0, h / 2, 0);
      const mat = new THREE.MeshStandardMaterial({
        color: densityColor(cell.densityBefore),
        roughness: 0.55,
        metalness: 0.3,
        emissive: densityColor(cell.densityBefore),
        emissiveIntensity: 0.08,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        offsetX + cell.col * spacing,
        0,
        offsetZ + cell.row * spacing
      );
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { cell, idx };
      scene.add(mesh);
      bars.push(mesh);
    });

    // Beacon rings over high-loss cells
    cells.filter(c => c.loss > 20).forEach(c => {
      const ringGeo = new THREE.RingGeometry(0.4, 0.55, 20);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(
        offsetX + c.col * spacing,
        7.5,
        offsetZ + c.row * spacing
      );
      scene.add(ring);
    });

    // Animation
    let angle = 0;
    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      if (sceneRef.current?.angle !== undefined) {
        angle = sceneRef.current.angle;
      }
      if (autoOrbit) {
        angle += 0.004;
        camera.position.x = Math.sin(angle) * 38;
        camera.position.z = Math.cos(angle) * 38;
        camera.position.y = 28 + Math.sin(angle * 0.5) * 4;
        camera.lookAt(0, 2, 0);
        if (sceneRef.current) sceneRef.current.angle = angle;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    sceneRef.current = { scene, camera, renderer, bars, cells, angle: 0, rafId };

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [cells]);

  // ─── Update bars when slider moves ────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return;
    const { bars } = sceneRef.current;
    const t = sliderDay / 100; // 0 = before, 1 = today

    bars.forEach((bar, idx) => {
      const cell = cells[idx];
      const density = cell.densityBefore + (cell.densityToday - cell.densityBefore) * t;
      const h = Math.max(0.1, density / 100 * 6);

      // Scale bar height
      bar.scale.y = h / Math.max(0.1, cell.densityBefore / 100 * 6);

      // Color
      const col = densityColor(density);
      (bar.material as THREE.MeshStandardMaterial).color = col;
      (bar.material as THREE.MeshStandardMaterial).emissive = col;
      // Emissive intensity stronger for loss zones
      const lossRatio = (cell.densityBefore - density) / Math.max(1, cell.densityBefore);
      (bar.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.05 + lossRatio * 0.6;
    });
  }, [sliderDay, cells]);

  // ─── Mouse click raycasting ────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!sceneRef.current || !mountRef.current) return;
    const { renderer, camera, bars } = sceneRef.current;
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width)  *  2 - 1;
    const y = -((e.clientY - rect.top)  / rect.height) *  2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const intersects = raycaster.intersectObjects(bars, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const cell: HeatmapCell = hit.userData.cell;
      if (cell.loss > 10) {
        setDispatchedCell(cell);
        onPoliceDispatch(cell, POLICE_STATIONS);
      }
    }
  }, [onPoliceDispatch]);

  const formatDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const daysAgo = Math.round((1 - sliderDay / 100) * 7);

  return (
    <div className="gis-glass rounded-xl border border-slate-800 flex flex-col h-full hud-scanline animate-fade-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div>
          <h2 className="font-orbitron text-xs font-black uppercase tracking-widest text-emerald-400 text-glow-green">
            3D TREE DENSITY HEATMAP
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">{forestName} — Daily Satellite Comparison · {GRID}×{GRID} Grid</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono-hud text-red-400 font-bold animate-glow-red rounded bg-red-950/60 px-2 py-1 border border-red-900/60">
            {criticalCells} CRITICAL CELLS
          </span>
          <span className="text-[10px] font-mono-hud text-amber-400 rounded bg-amber-950/60 px-2 py-1 border border-amber-900/60">
            AVG LOSS: {totalLoss}%
          </span>
          <span className="rounded bg-cyan-950 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-800">
            INTERACTIVE 3D
          </span>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative flex-1 overflow-hidden min-h-[300px]" onClick={handleCanvasClick}>
        <div ref={mountRef} className="w-full h-full cursor-crosshair" />

        {/* Floating top-left HUD */}
        <div className="absolute top-3 left-3 heatmap-hud p-3 text-xs space-y-1.5 max-w-[200px] animate-fade-slide-up delay-200">
          <div className="font-orbitron text-[9px] uppercase text-emerald-400 text-glow-green tracking-widest mb-1">
            DENSITY LEGEND
          </div>
          {[
            { color: '#10b981', label: '70–100% Dense Forest' },
            { color: '#84cc16', label: '50–70% Moderate Canopy' },
            { color: '#f59e0b', label: '35–50% Sparse Cover' },
            { color: '#f97316', label: '20–35% Heavy Loss' },
            { color: '#ef4444', label: '0–20% Cleared Zone' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 text-[10px] text-slate-300">
              <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
          <div className="border-t border-slate-700/60 pt-1.5 text-[9px] text-slate-500 font-mono-hud">
            Click red bar → Police Dispatch
          </div>
        </div>

        {/* Top-right info */}
        <div className="absolute top-3 right-3 heatmap-hud p-3 text-xs space-y-1 text-right animate-fade-slide-up delay-300">
          <div className="font-orbitron text-[9px] uppercase text-slate-400 tracking-widest">Comparing</div>
          <div className="text-emerald-400 font-bold">{formatDate(daysAgo)}</div>
          <div className="text-slate-500">vs.</div>
          <div className={`font-bold ${sliderDay === 100 ? 'text-red-400' : 'text-slate-300'}`}>
            {sliderDay === 100 ? 'TODAY (Latest)' : formatDate(0)}
          </div>
        </div>

        {/* Orbit toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setAutoOrbit(o => !o); }}
          className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
            autoOrbit
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
              : 'bg-slate-900/80 text-slate-400 border-slate-700'
          }`}
        >
          {autoOrbit ? '⟳ AUTO-ORBIT ON' : '⟳ AUTO-ORBIT OFF'}
        </button>

        {/* Bottom right mesh info */}
        <div className="absolute bottom-3 right-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono-hud">
          {GRID * GRID} Cells · Three.js WebGL · India Forest Zone
        </div>

        {/* Dispatch badge if cell was clicked */}
        {dispatchedCell && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="animate-beacon-ring rounded-full border-2 border-red-500 w-20 h-20" />
          </div>
        )}
      </div>

      {/* Timeline Slider */}
      <div className="px-5 py-3 border-t border-slate-800/80 space-y-2 animate-fade-slide-up delay-400">
        <div className="flex justify-between text-[10px] font-mono-hud">
          <span className="text-emerald-400">◀ 7 DAYS AGO — {formatDate(7)}</span>
          <span className="font-bold text-amber-400 uppercase">
            {daysAgo === 0 ? '📡 TODAY — LIVE SATELLITE' : `${daysAgo} DAYS AGO`}
          </span>
          <span className="text-red-400">TODAY — {formatDate(0)} ▶</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={sliderDay}
          onChange={e => setSliderDay(Number(e.target.value))}
          className="heatmap-slider"
        />
        <div className="flex justify-between text-[9px] text-slate-600 font-mono-hud">
          {[7, 6, 5, 4, 3, 2, 1, 0].map(d => (
            <span key={d}>{d === 0 ? 'Now' : `-${d}d`}</span>
          ))}
        </div>

        {/* Loss summary bar */}
        <div className="flex items-center gap-3 pt-1">
          <span className="text-[10px] text-slate-500 uppercase font-bold whitespace-nowrap">Loss intensity:</span>
          <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${(sliderDay / 100) * totalLoss}%`,
                background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)'
              }}
            />
          </div>
          <span className="text-[10px] font-bold text-red-400 font-mono-hud">
            {((sliderDay / 100) * totalLoss).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};
