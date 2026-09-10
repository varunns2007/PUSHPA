import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { motion, AnimatePresence } from "framer-motion";
import { useComparison } from "../state/ComparisonContext";

interface Readout { x: number; y: number; densityPct: number; canopyHeightM: number; valuable: boolean; }

export default function Forest3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [readout, setReadout] = useState<Readout | null>(null);
  const { comparison } = useComparison();
  const comparisonRef = useRef(comparison);
  comparisonRef.current = comparison;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x173c2a);
    scene.fog = new THREE.Fog(0x173c2a, 110, 260);

    const camera = new THREE.PerspectiveCamera(48, Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight), 0.1, 600);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x31502f, 2.4));
    const sun = new THREE.DirectionalLight(0xfff0c2, 4.0);
    sun.position.set(60, 100, 40);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x66d9ff, 1.6);
    fill.position.set(-70, 35, -50);
    scene.add(fill);
    const warm = new THREE.PointLight(0xffb45a, 55, 150, 2);
    warm.position.set(25, 28, 25);
    scene.add(warm);

    const size = 180;
    const segments = 100;
    const heightAt = (x: number, z: number) =>
      Math.sin(x * 0.045) * 4 + Math.cos(z * 0.055) * 3 + Math.sin((x + z) * 0.026) * 7 + Math.cos((x - z) * 0.018) * 2;
    const lossAt = (x: number, z: number) => {
      const grid = comparisonRef.current.lossGrid;
      const n = comparisonRef.current.gridSize;
      if (!grid.length || !n) return 0;
      const gx = Math.min(n - 1, Math.max(0, Math.floor(((x + size / 2) / size) * n)));
      const gz = Math.min(n - 1, Math.max(0, Math.floor(((z + size / 2) / size) * n)));
      return grid[gz * n + gx] ?? 0;
    };

    // Terrain with a bright, readable forest floor.
    const terrainGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    terrainGeo.rotateX(-Math.PI / 2);
    const pos = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, heightAt(x, z));
    }
    terrainGeo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x39734a, roughness: 0.92, metalness: 0.02 });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.name = "forest-terrain";
    scene.add(terrain);

    // Mountain silhouettes make the 3D view immediately readable as a landscape.
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x2d6650, roughness: 1 });
    const mountainGeo = new THREE.ConeGeometry(22, 55, 7);
    const mountainSpots = [
      [-105, -65, 1.8], [-70, -78, 1.45], [-25, -92, 1.7], [20, -100, 2.0], [70, -80, 1.55], [112, -62, 1.9],
      [-120, 25, 1.2], [125, 30, 1.25],
    ];
    mountainSpots.forEach(([x, z, s]) => {
      const m = new THREE.Mesh(mountainGeo, mountainMat);
      m.position.set(x, 18, z);
      m.scale.set(s, s, s);
      scene.add(m);
    });

    // River / stream through the valley.
    const riverCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-80, 3, -75), new THREE.Vector3(-48, 4, -45), new THREE.Vector3(-20, 2, -15),
      new THREE.Vector3(18, 3, 10), new THREE.Vector3(48, 4, 35), new THREE.Vector3(82, 3, 68),
    ]);
    const riverGeo = new THREE.TubeGeometry(riverCurve, 70, 1.5, 8, false);
    const riverMat = new THREE.MeshStandardMaterial({ color: 0x3ec9f5, roughness: 0.15, metalness: 0.35, emissive: 0x063d52, emissiveIntensity: 0.35 });
    scene.add(new THREE.Mesh(riverGeo, riverMat));

    // Clearings are tied to the same comparison grid used by the density view.
    const patchGeo = new THREE.CircleGeometry(1, 20);
    const patchMat = new THREE.MeshBasicMaterial({ color: 0xd94b36, transparent: true, opacity: 0.42, depthWrite: false });
    const patches = new THREE.InstancedMesh(patchGeo, patchMat, 42);
    const patchDummy = new THREE.Object3D();
    for (let i = 0; i < 42; i++) {
      const x = (Math.random() - 0.5) * 140;
      const z = (Math.random() - 0.5) * 125;
      const loss = lossAt(x, z);
      patchDummy.position.set(x, heightAt(x, z) + 0.25, z);
      patchDummy.rotation.x = -Math.PI / 2;
      const s = 0.7 + Math.random() * 2.5 + loss * 3;
      patchDummy.scale.set(s, s, s);
      patchDummy.updateMatrix();
      patches.setMatrixAt(i, patchDummy.matrix);
    }
    patches.instanceMatrix.needsUpdate = true;
    scene.add(patches);

    const treeCount = 1050;
    const trunkGeo = new THREE.CylinderGeometry(0.14, 0.25, 1.8, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b3620, roughness: 0.9 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);

    const canopyGeo = new THREE.ConeGeometry(1.5, 4.8, 8);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x4f9f59, roughness: 0.85, metalness: 0 });
    const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
    const d1 = new THREE.Object3D();
    const d2 = new THREE.Object3D();
    const healthy = new THREE.Color(0x43a85e);
    const lightGreen = new THREE.Color(0x9bd35d);
    const stressed = new THREE.Color(0xd58a3a);
    const lost = new THREE.Color(0xd94b36);
    const treePositions: { x: number; z: number }[] = [];

    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * size * 0.9;
      const z = (Math.random() - 0.5) * size * 0.9;
      const y = heightAt(x, z);
      const loss = Math.min(1, Math.max(0, lossAt(x, z)));
      const s = (0.65 + Math.random() * 1.05) * (1 - loss * 0.42);
      treePositions.push({ x, z });

      d1.position.set(x, y + 0.9 * s, z);
      d1.scale.set(s, s, s);
      d1.rotation.y = Math.random() * Math.PI;
      d1.updateMatrix();
      trunks.setMatrixAt(i, d1.matrix);

      d2.position.set(x, y + 2.8 * s, z);
      d2.scale.set(s, s, s);
      d2.rotation.y = Math.random() * Math.PI;
      d2.updateMatrix();
      canopies.setMatrixAt(i, d2.matrix);

      const variation = Math.random();
      let c = healthy.clone().lerp(lightGreen, variation * 0.65);
      if (loss > 0.25) c = c.lerp(stressed, Math.min(1, (loss - 0.25) * 1.6));
      if (loss > 0.65) c = c.lerp(lost, Math.min(1, (loss - 0.65) * 2.2));
      canopies.setColorAt(i, c);
    }
    trunks.instanceMatrix.needsUpdate = true;
    canopies.instanceMatrix.needsUpdate = true;
    if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
    scene.add(trunks, canopies);

    // A second canopy layer adds depth and colour without making the scene too heavy.
    const crownGeo = new THREE.SphereGeometry(0.9, 8, 6);
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x72bf57, roughness: 0.9 });
    const crowns = new THREE.InstancedMesh(crownGeo, crownMat, 520);
    for (let i = 0; i < 520; i++) {
      const p = treePositions[i * 2];
      if (!p) continue;
      const y = heightAt(p.x, p.z);
      d2.position.set(p.x + (Math.random() - .5), y + 5.0 + Math.random() * 1.4, p.z + (Math.random() - .5));
      const s = 0.55 + Math.random() * 0.7;
      d2.scale.set(s, s * 0.75, s);
      d2.rotation.y = Math.random() * Math.PI;
      d2.updateMatrix();
      crowns.setMatrixAt(i, d2.matrix);
    }
    crowns.instanceMatrix.needsUpdate = true;
    scene.add(crowns);

    // High-value / inspection markers.
    const markerGeo = new THREE.OctahedronGeometry(1.0, 0);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0xffd166, emissive: 0xf08b24, emissiveIntensity: 0.75, roughness: 0.3 });
    const markerSpots = [{ x: 24, z: -14 }, { x: -32, z: 20 }, { x: 42, z: 32 }];
    const markers = markerSpots.map((spot) => {
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.set(spot.x, heightAt(spot.x, spot.z) + 8, spot.z);
      scene.add(m);
      return m;
    });

    // Floating particles for atmosphere.
    const dustCount = 260;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - .5) * size;
      dustPos[i * 3 + 1] = Math.random() * 28 + 3;
      dustPos[i * 3 + 2] = (Math.random() - .5) * size;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffdf8a, size: 0.18, transparent: true, opacity: 0.7 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const startPos = new THREE.Vector3(0, 78, 125);
    const endPos = new THREE.Vector3(42, 30, 76);
    const target = new THREE.Vector3(0, 7, 0);
    camera.position.copy(startPos);
    camera.lookAt(target);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 8;
    controls.maxDistance = 190;
    controls.maxPolarAngle = Math.PI / 2.03;
    controls.enabled = false;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let flyTarget: { from: THREE.Vector3; to: THREE.Vector3; toLookAt: THREE.Vector3; start: number } | null = null;

    const onClick = (e: MouseEvent) => {
      if (!controls.enabled) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(terrain, false)[0];
      if (!hit) return;
      const p = hit.point;
      const loss = lossAt(p.x, p.z);
      const valuable = markers.some((m) => m.position.distanceTo(p) < 15);
      setReadout({ x: Math.round(p.x), y: Math.round(p.z), densityPct: Math.round((1 - loss) * 100), canopyHeightM: Math.round((18 + (1 - loss) * 9) * 10) / 10, valuable });
      const dir = new THREE.Vector3().subVectors(camera.position, p).normalize();
      const to = p.clone().add(dir.multiplyScalar(18)).add(new THREE.Vector3(0, 8, 0));
      flyTarget = { from: camera.position.clone(), to, toLookAt: p.clone().add(new THREE.Vector3(0, 4, 0)), start: performance.now() };
    };
    renderer.domElement.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    const flyDuration = 2.8;
    let raf = 0;
    const animate = () => {
      const t = clock.getElapsedTime();
      if (t < flyDuration) {
        const p = 1 - Math.pow(1 - t / flyDuration, 3);
        camera.position.lerpVectors(startPos, endPos, p);
        camera.lookAt(target);
      } else {
        if (!controls.enabled) { controls.enabled = true; camera.position.copy(endPos); setLoading(false); }
        if (flyTarget) {
          const elapsed = (performance.now() - flyTarget.start) / 1000;
          const p = Math.min(1, elapsed / 1.0);
          const ease = 1 - Math.pow(1 - p, 3);
          camera.position.lerpVectors(flyTarget.from, flyTarget.to, ease);
          controls.target.lerp(flyTarget.toLookAt, ease);
          if (p >= 1) flyTarget = null;
        }
        controls.update();
      }
      markers.forEach((m, i) => { m.rotation.y += 0.012; m.position.y += Math.sin(t * 1.6 + i) * 0.004; });
      dust.rotation.y += 0.0008;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = Math.max(1, mount.clientWidth) / Math.max(1, mount.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("click", onClick);
      controls.dispose();
      renderer.dispose();
      terrainGeo.dispose(); terrainMat.dispose(); mountainGeo.dispose(); mountainMat.dispose(); riverGeo.dispose(); riverMat.dispose();
      patchGeo.dispose(); patchMat.dispose(); trunkGeo.dispose(); trunkMat.dispose(); canopyGeo.dispose(); canopyMat.dispose(); crownGeo.dispose(); crownMat.dispose();
      markerGeo.dispose(); markerMat.dispose(); dustGeo.dispose(); dustMat.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />
      <AnimatePresence>
        {loading && <motion.div exit={{ opacity: 0 }} transition={{ duration: .6 }} className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#102c1d]/35 font-mono text-xs tracking-[.3em] text-gold-300">FLYING IN · 3D CANOPY MODEL</motion.div>}
      </AnimatePresence>
      <div className="pointer-events-none absolute left-4 top-4 rounded border border-forest-300/40 bg-[#06140c]/65 px-3 py-2 backdrop-blur-md"><div className="font-mono text-[11px] font-semibold text-white">3D FOREST TERRAIN</div><div className="font-mono text-[9px] text-forest-200">CANOPY · TERRAIN · CHANGE HOTSPOTS</div></div>
      <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-white/70">DRAG TO LOOK · SCROLL TO ZOOM · CLICK TERRAIN TO INSPECT</div>
      <AnimatePresence>
        {readout && <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="absolute right-4 top-4 w-60 border border-line/70 bg-[#06140c]/90 p-3 backdrop-blur-md">
          <div className="flex items-center justify-between font-mono text-[10px] text-ash-400"><span>SPOT INSPECTED</span><button onClick={() => setReadout(null)} className="text-ash-400 hover:text-white">✕</button></div>
          {readout.valuable && <div className="mt-2 inline-block border border-value-500/60 bg-value-600/10 px-1.5 py-0.5 font-mono text-[9px] text-value-300">HIGH-VALUE TIMBER HISTORY NEARBY</div>}
          <div className="mt-2 space-y-1 font-mono text-[11px] text-ash-200"><Row k="Tree cover" v={`${readout.densityPct}%`} color={readout.densityPct > 60 ? "#63e58e" : "#ff9b52"}/><Row k="Canopy height" v={`~${readout.canopyHeightM} m`}/><Row k="3D position" v={`${readout.x}, ${readout.y}`}/></div>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return <div className="flex justify-between border-b border-line/50 py-1 last:border-0"><span className="text-ash-500">{k}</span><span style={{ color: color ?? "var(--color-ash-100)" }}>{v}</span></div>;
}
