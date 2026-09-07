import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { ChangePolygon } from '../types';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface TerrainForestSceneProps {
  forestName: string;
  changePolygons?: ChangePolygon[];
}

export const TerrainForestScene: React.FC<TerrainForestSceneProps> = ({
  forestName,
  changePolygons = []
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(1.0);
  const [isRotating] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0B0907);
    scene.fog = new THREE.FogExp2(0x0B0907, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(0, 42, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. Controlled Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xF1E7D5, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xD99A4A, 1.2);
    sunLight.position.set(30, 55, 25);
    sunLight.castShadow = true;
    scene.add(sunLight);

    const redBeaconLight = new THREE.PointLight(0xD52B1E, 3.5, 40);
    redBeaconLight.position.set(4, 5, -4);
    scene.add(redBeaconLight);

    // 3. Terrain DEM Plane Geometry
    const gridCols = 64;
    const gridRows = 64;
    const geometry = new THREE.PlaneGeometry(70, 70, gridCols - 1, gridRows - 1);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Primary disturbance coordinate
    const targetX = 4.0;
    const targetZ = -4.0;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // DEM terrain height calculation with vertical exaggeration
      const baseHeight = (Math.sin(x * 0.12) * Math.cos(z * 0.12) * 3.2 + Math.sin(x * 0.05) * 1.8);
      const distToClearing = Math.sqrt((x - targetX) ** 2 + (z - targetZ) ** 2);

      let y = baseHeight * verticalExaggeration;
      if (distToClearing < 10) {
        y -= (10 - distToClearing) * 0.35 * verticalExaggeration;
      }
      pos.setY(i, y);

      // Color mapping: Dense Forest vs Sandalwood Red Disturbance Polygon Overlay
      if (distToClearing < 8.5) {
        colors[i * 3] = 0.55;     // Sandalwood Red
        colors[i * 3 + 1] = 0.17;
        colors[i * 3 + 2] = 0.09;
      } else {
        const intensity = 0.2 + Math.min(0.4, y / 12.0);
        colors[i * 3] = 0.11;     // Dense Canopy Green
        colors[i * 3 + 1] = 0.22 + intensity;
        colors[i * 3 + 2] = 0.09;
      }
    }

    geometry.computeVertexNormals();
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.1
    });

    const terrainMesh = new THREE.Mesh(geometry, material);
    terrainMeshRef.current = terrainMesh;
    scene.add(terrainMesh);

    // Tactical Wireframe Overlay
    const wireGeo = new THREE.WireframeGeometry(geometry);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x4A3022, opacity: 0.25, transparent: true });
    const wireframe = new THREE.LineSegments(wireGeo, wireMat);
    scene.add(wireframe);

    // Disturbance Target Marker Cylinder
    const beaconGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xD52B1E, transparent: true, opacity: 0.85 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(targetX, 4.5, targetZ);
    scene.add(beacon);

    // 4. Animation Loop with Resource Management
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      if (isRotating && terrainMesh) {
        terrainMesh.rotation.y = Math.sin(elapsedTime * 0.08) * 0.06;
        wireframe.rotation.y = terrainMesh.rotation.y;
      }

      redBeaconLight.intensity = 2.5 + Math.sin(elapsedTime * 3.5) * 1.0;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 5. Cleanup on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      wireGeo.dispose();
      material.dispose();
      beaconGeo.dispose();
      beaconMat.dispose();
    };
  }, [forestName, verticalExaggeration, isRotating]);

  const handleResetCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 42, 60);
      cameraRef.current.lookAt(0, 0, 0);
    }
  };

  const handleZoom = (delta: number) => {
    if (cameraRef.current) {
      cameraRef.current.position.z = Math.max(30, Math.min(90, cameraRef.current.position.z + delta));
    }
  };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-[#4A3022]/60 bg-[#0B0907] shadow-xl">
      <div ref={mountRef} className="h-full w-full" />

      {/* Top Left: DEM Intelligence HUD */}
      <div className="absolute top-3 left-3 z-10 pushpa-panel p-3 rounded-lg border border-[#4A3022]/60 max-w-xs text-xs font-tactical">
        <div className="flex items-center space-x-1.5 text-[#D99A4A] font-bold uppercase tracking-wider text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D52B1E] animate-ping" />
          <span>3D TACTICAL TERRAIN ELEVATION</span>
        </div>
        <h3 className="font-title text-sm font-bold text-[#F1E7D5] mt-0.5">{forestName}</h3>
        <p className="text-[10px] text-[#A99A87] font-mono mt-0.5">
          DEM Mesh + Sandalwood Red Disturbance Overlay
        </p>

        <div className="mt-2 pt-2 border-t border-[#4A3022]/40 flex items-center justify-between text-[10px]">
          <span className="text-[#A99A87]">Disturbances:</span>
          <span className="text-[#D52B1E] font-bold font-mono">{changePolygons.length || 1} Candidate Extracted</span>
        </div>
      </div>

      {/* Top Right: Tactical Camera & Vertical Exaggeration Controls */}
      <div className="absolute top-3 right-3 z-10 pushpa-panel p-2 rounded-lg border border-[#4A3022]/60 flex flex-col space-y-2 text-xs">
        {/* Zoom & Reset */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleZoom(-8)}
            className="p-1.5 rounded bg-[#1D1813] text-[#F1E7D5] hover:bg-[#8E2B18] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleZoom(8)}
            className="p-1.5 rounded bg-[#1D1813] text-[#F1E7D5] hover:bg-[#8E2B18] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleResetCamera}
            className="p-1.5 rounded bg-[#1D1813] text-[#D99A4A] hover:bg-[#8E2B18] hover:text-[#F1E7D5] transition-colors"
            title="Reset Camera"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Vertical Exaggeration (0.5x, 1x, 2x) */}
        <div className="flex items-center space-x-1 pt-1 border-t border-[#4A3022]/40 text-[10px] font-tactical">
          <span className="text-[#A99A87] mr-1">EXAG:</span>
          {[0.5, 1.0, 2.0].map((val) => (
            <button
              key={val}
              onClick={() => setVerticalExaggeration(val)}
              className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                verticalExaggeration === val
                  ? 'bg-[#8E2B18] text-[#F1E7D5]'
                  : 'bg-[#12100D] text-[#74695D] hover:text-[#F1E7D5]'
              }`}
            >
              {val}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
