import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { motion, AnimatePresence } from "framer-motion";
import { useComparison } from "../state/ComparisonContext";

interface Readout {
  x: number;
  y: number;
  densityPct: number;
  canopyHeightM: number;
  valuable: boolean;
}

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
    scene.background = new THREE.Color(0x05080a);
    scene.fog = new THREE.FogExp2(0x0a1210, 0.028);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x2a3a2f, 1.1);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight(0xc9a24b, 1.4);
    sun.position.set(30, 40, -10);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0xa83a26, 0.5);
    rim.position.set(-30, 10, 30);
    scene.add(rim);

    const size = 200, segments = 90;
    function heightAt(x: number, z: number) {
      return Math.sin(x * 0.05) * 3 + Math.cos(z * 0.07) * 3 + Math.sin((x + z) * 0.03) * 4;
    }
    // sample the shared loss grid (from Satellite Compare) at a world position
    function lossAt(x: number, z: number) {
      const grid = comparisonRef.current.lossGrid;
      const n = comparisonRef.current.gridSize;
      const gx = Math.min(n - 1, Math.max(0, Math.floor(((x + size / 2) / size) * n)));
      const gz = Math.min(n - 1, Math.max(0, Math.floor(((z + size / 2) / size) * n)));
      return grid[gz * n + gx] ?? 0;
    }

    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i);
      pos.setY(i, heightAt(x, z) + (Math.random() - 0.5) * 0.6);
    }
    geo.computeVertexNormals();
    const terrainMat = new THREE.MeshStandardMaterial({ color: 0x14261a, roughness: 1, metalness: 0 });
    const terrain = new THREE.Mesh(geo, terrainMat);
    terrain.name = "terrain";
    scene.add(terrain);

    const patchGeo = new THREE.CircleGeometry(1, 8);
    const patchMat = new THREE.MeshStandardMaterial({ color: 0x611f16, roughness: 1 });
    const patchMesh = new THREE.InstancedMesh(patchGeo, patchMat, 40);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * size * 0.8;
      const z = (Math.random() - 0.5) * size * 0.8;
      dummy.position.set(x, 0.05, z);
      dummy.rotation.x = -Math.PI / 2;
      const s = Math.random() * 1.5 + 0.5;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      patchMesh.setMatrixAt(i, dummy.matrix);
    }
    scene.add(patchMesh);

    const treeCount = 900;
    const trunkGeo = new THREE.CylinderGeometry(0.15, 0.22, 1.6, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 1 });
    const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);

    const canopyGeo = new THREE.ConeGeometry(1.3, 3.2, 7);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, vertexColors: true });
    const canopies = new THREE.InstancedMesh(canopyGeo, canopyMat, treeCount);
    canopies.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(treeCount * 3), 3);

    const healthyColor = new THREE.Color(0x3f9160);
    const lostColor = new THREE.Color(0xa83a26);
    const d1 = new THREE.Object3D();
    const d2 = new THREE.Object3D();
    const treePositions: { x: number; z: number }[] = [];
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * size * 0.95;
      const z = (Math.random() - 0.5) * size * 0.95;
      const y = heightAt(x, z);
      const loss = lossAt(x, z);
      const s = (0.6 + Math.random() * 0.9) * (1 - loss * 0.55);
      treePositions.push({ x, z });

      d1.position.set(x, y + 0.8 * s, z);
      d1.scale.set(s, s, s);
      d1.rotation.y = Math.random() * Math.PI;
      d1.updateMatrix();
      trunks.setMatrixAt(i, d1.matrix);

      d2.position.set(x, y + 2.2 * s, z);
      d2.scale.set(s, s, s);
      d2.rotation.y = Math.random() * Math.PI;
      d2.updateMatrix();
      canopies.setMatrixAt(i, d2.matrix);

      const tint = 0.85 + Math.random() * 0.3;
      const c = healthyColor.clone().lerp(lostColor, loss).multiplyScalar(tint);
      canopies.setColorAt(i, c);
    }
    canopies.instanceMatrix.needsUpdate = true;
    if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
    scene.add(trunks, canopies);

    // valuable-species markers: floating copper diamonds over a couple of
    // fresh clearings, echoing the Hotspot list's "valuableSpecies" flag
    const markerGeo = new THREE.OctahedronGeometry(0.9, 0);
    const markerMat = new THREE.MeshStandardMaterial({ color: 0xe2984a, emissive: 0xc47a2e, emissiveIntensity: 0.4, roughness: 0.4 });
    const markerSpots = [
      { x: 22, z: -14 },
      { x: -30, z: 18 },
    ];
    const markers: THREE.Mesh[] = markerSpots.map((spot) => {
      const m = new THREE.Mesh(markerGeo, markerMat);
      m.position.set(spot.x, heightAt(spot.x, spot.z) + 6, spot.z);
      scene.add(m);
      return m;
    });

    const dustCount = 400;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * size;
      dustPos[i * 3 + 1] = Math.random() * 12 + 1;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * size;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xc9a24b, size: 0.12, transparent: true, opacity: 0.5 });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const startPos = new THREE.Vector3(0, 90, 0.1);
    const endPos = new THREE.Vector3(24, 9, 28);
    const target = new THREE.Vector3(0, 2, 0);
    camera.position.copy(startPos);
    camera.lookAt(target);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 90;
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.enabled = false;

    // click-to-zoom: raycast the terrain, fly the camera close to that spot
    // and surface a density/canopy-height readout for that patch
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let flyTarget: { from: THREE.Vector3; to: THREE.Vector3; toLookAt: THREE.Vector3; start: number } | null = null;

    function onClick(e: MouseEvent) {
      if (!controls.enabled) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(terrain, false)[0];
      if (!hit) return;

      const p = hit.point;
      const loss = lossAt(p.x, p.z);
      const nearestMarker = markers.some((m) => m.position.distanceTo(p) < 14);
      setReadout({
        x: Math.round(p.x),
        y: Math.round(p.z),
        densityPct: Math.round((1 - loss) * 100),
        canopyHeightM: Math.round((22 - loss * 12) * 10) / 10,
        valuable: nearestMarker,
      });

      const dir = new THREE.Vector3().subVectors(camera.position, p).normalize();
      const to = p.clone().add(dir.multiplyScalar(14)).add(new THREE.Vector3(0, 6, 0));
      flyTarget = { from: camera.position.clone(), to, toLookAt: p.clone().add(new THREE.Vector3(0, 2, 0)), start: performance.now() };
    }
    renderer.domElement.addEventListener("click", onClick);

    const clock = new THREE.Clock();
    const flyDuration = 3.4;
    let raf: number;

    const animate = () => {
      const t = clock.getElapsedTime();
      if (t < flyDuration) {
        const p = 1 - Math.pow(1 - t / flyDuration, 3);
        camera.position.lerpVectors(startPos, endPos, p);
        camera.lookAt(target);
      } else {
        if (!controls.enabled) {
          controls.enabled = true;
          camera.position.copy(endPos);
          setLoading(false);
        }
        if (flyTarget) {
          const elapsed = (performance.now() - flyTarget.start) / 1000;
          const p = Math.min(1, elapsed / 1.1);
          const ease = 1 - Math.pow(1 - p, 3);
          camera.position.lerpVectors(flyTarget.from, flyTarget.to, ease);
          controls.target.lerp(flyTarget.toLookAt, ease);
          if (p >= 1) flyTarget = null;
        }
        controls.update();
      }
      dust.rotation.y += 0.0006;
      const dp = dust.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < dustCount; i++) {
        let y = dp.getY(i) + 0.004;
        if (y > 14) y = 1;
        dp.setY(i, y);
      }
      dp.needsUpdate = true;

      markers.forEach((m, i) => {
        m.rotation.y += 0.01;
        m.position.y += Math.sin(t * 1.5 + i) * 0.004;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
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
      geo.dispose();
      terrainMat.dispose();
      trunkGeo.dispose();
      trunkMat.dispose();
      canopyGeo.dispose();
      canopyMat.dispose();
      patchGeo.dispose();
      patchMat.dispose();
      markerGeo.dispose();
      markerMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div ref={mountRef} className="h-full w-full" />

      <AnimatePresence>
        {loading && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-void/40 font-mono text-xs tracking-[0.3em] text-gold-400"
          >
            FLYING IN · MAPPING THE CANOPY
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-ash-500">
        DRAG TO LOOK AROUND · SCROLL TO ZOOM · CLICK ANY SPOT TO INSPECT IT
      </div>

      <AnimatePresence>
        {readout && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="absolute right-4 top-4 w-56 border border-line/70 bg-void/85 p-3 backdrop-blur-md"
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-ash-500">
              <span>SPOT INSPECTED</span>
              <button data-cursor-hover onClick={() => setReadout(null)} className="text-ash-500 hover:text-ash-100">✕</button>
            </div>
            {readout.valuable && (
              <div className="mt-1.5 mb-1 inline-block border border-value-500/60 bg-value-600/10 px-1.5 py-0.5 font-mono text-[9px] tracking-wider text-value-400">
                HIGH-VALUE TREES NEARBY
              </div>
            )}
            <div className="mt-1 space-y-1 font-mono text-[11px] text-ash-300">
              <Row k="Tree cover here" v={`${readout.densityPct}%`} color={readout.densityPct > 60 ? "var(--color-forest-400)" : "var(--color-earth-400)"} />
              <Row k="Canopy height" v={`~${readout.canopyHeightM} m`} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex justify-between border-b border-line/50 py-1 last:border-0">
      <span className="text-ash-500">{k}</span>
      <span style={{ color: color ?? "var(--color-ash-100)" }}>{v}</span>
    </div>
  );
}
