import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface TerrainForestSceneProps {
  forestName: string;
}

export const TerrainForestScene: React.FC<TerrainForestSceneProps> = ({ forestName }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 45, 65);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x10b981, 1.2);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const redLight = new THREE.PointLight(0xef4444, 3, 40);
    redLight.position.set(5, 5, -5);
    scene.add(redLight);

    // Terrain Plane Geometry with elevation texture
    const gridCols = 80;
    const gridRows = 80;
    const geometry = new THREE.PlaneGeometry(80, 80, gridCols - 1, gridRows - 1);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Terrain elevation sine wave + noise
      let y = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 3.5 + Math.sin(x * 0.05) * 2.0;

      // Clearing Depression Zone around (x=5, z=-5)
      const distToClearing = Math.sqrt((x - 5) ** 2 + (z + 5) ** 2);
      if (distToClearing < 12) {
        y -= (12 - distToClearing) * 0.4; // Depress cleared area
      }

      pos.setY(i, y);

      // Color mapping: Dense forest (Green), Cleared area (Red/Brown)
      if (distToClearing < 10) {
        // Red / Brown vegetation loss zone
        colors[i * 3] = 0.93; // R
        colors[i * 3 + 1] = 0.26; // G
        colors[i * 3 + 2] = 0.26; // B
      } else {
        // Green forest density
        const intensity = 0.3 + (y / 8);
        colors[i * 3] = 0.05; // R
        colors[i * 3 + 1] = Math.min(0.8, 0.4 + intensity); // G
        colors[i * 3 + 2] = 0.3; // B
      }
    }

    geometry.computeVertexNormals();
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1,
      wireframe: false
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    scene.add(terrainMesh);

    // Wireframe grid overlay
    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x064e3b, opacity: 0.3, transparent: true });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wireframe);

    // Animated Highlight Beacon over Change Zone
    const beaconGeo = new THREE.CylinderGeometry(0.5, 3, 20, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.5, wireframe: true });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(5, 10, -5);
    scene.add(beacon);

    // Animation Loop
    let animationFrameId: number;
    let angle = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      angle += 0.003;
      camera.position.x = Math.sin(angle) * 70;
      camera.position.z = Math.cos(angle) * 70;
      camera.lookAt(0, 0, 0);

      beacon.rotation.y += 0.02;

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

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div className="gis-glass rounded-xl p-4 border border-slate-800 space-y-3 h-full flex flex-col">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-emerald-400">
            3D FOREST DENSITY / TERRAIN VISUALIZATION
          </h2>
          <p className="text-xs text-slate-400">{forestName} — 3D Vegetation Density Surface & Elevation Mesh</p>
        </div>
        <span className="rounded bg-cyan-950 px-2.5 py-1 text-xs font-bold text-cyan-400 border border-cyan-800">
          INTERACTIVE 3D VIEW
        </span>
      </div>

      <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-800 min-h-[380px]">
        <div ref={mountRef} className="w-full h-full" />

        {/* Floating 3D HUD Badge */}
        <div className="absolute top-3 left-3 gis-glass p-3 rounded-xl border border-slate-800 text-xs space-y-1 max-w-xs">
          <span className="font-bold text-slate-200 block">3D Vegetation Surface</span>
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span>Dense Forest Canopy Surface</span>
          </div>
          <div className="flex items-center space-x-2 text-[11px] text-red-400 font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
            <span>Highlighted Clearing Zone (#CHG001)</span>
          </div>
        </div>

        <div className="absolute bottom-3 right-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-mono">
          Auto Orbit | 3D Mesh Vertices: 6,400
        </div>
      </div>
    </div>
  );
};
