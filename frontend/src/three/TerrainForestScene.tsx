import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Eye, Layers, Calendar, AlertTriangle, Compass, RotateCcw,
  Plane, Sliders, Maximize2, ShieldAlert, Crosshair,
  TrendingDown, Sun, Info, Play, Pause, ChevronRight
} from 'lucide-react';

interface TerrainForestSceneProps {
  forestName?: string;
}

// Forest AOI Presets with authentic Geographic Coordinates and Elevation Models
const FOREST_AOIS = [
  {
    id: 'FOREST_001',
    name: 'Nilgiri Biosphere Reserve (Zone A)',
    code: 'NBR-001',
    lat: 11.5833,
    lng: 76.5500,
    baseElevation: 840,
    peakElevation: 2160,
    totalAreaHa: 5520,
    baselineDensity: 88.4,
    currentDensity: 64.2,
    deforestationAreaKm2: 0.95,
  },
  {
    id: 'FOREST_002',
    name: 'Mudumalai Tiger Reserve',
    code: 'MTR-002',
    lat: 11.5500,
    lng: 76.6200,
    baseElevation: 910,
    peakElevation: 1240,
    totalAreaHa: 3210,
    baselineDensity: 79.1,
    currentDensity: 76.8,
    deforestationAreaKm2: 0.12,
  },
  {
    id: 'FOREST_003',
    name: 'Wayanad Wildlife Sanctuary',
    code: 'WWS-003',
    lat: 11.7000,
    lng: 76.1500,
    baseElevation: 750,
    peakElevation: 1840,
    totalAreaHa: 3444,
    baselineDensity: 84.5,
    currentDensity: 69.3,
    deforestationAreaKm2: 0.68,
  },
  {
    id: 'FOREST_004',
    name: 'Anamalai Tiger Reserve',
    code: 'ATR-004',
    lat: 10.4800,
    lng: 77.1200,
    baseElevation: 680,
    peakElevation: 2400,
    totalAreaHa: 9580,
    baselineDensity: 91.2,
    currentDensity: 86.4,
    deforestationAreaKm2: 0.35,
  },
];

const TIMELINE_MONTHS = [
  { key: 'JAN', label: 'JAN 2026', progress: 0.0, desc: 'Pristine canopy baseline' },
  { key: 'FEB', label: 'FEB 2026', progress: 0.1, desc: 'Dry season start' },
  { key: 'MAR', label: 'MAR 2026', progress: 0.2, desc: 'Minor trail formation' },
  { key: 'APR', label: 'APR 2026', progress: 0.35, desc: 'Logging track penetration' },
  { key: 'MAY', label: 'MAY 2026', progress: 0.5, desc: 'Canopy thinning detected' },
  { key: 'JUN', label: 'JUN 2026', progress: 0.65, desc: 'Monsoon - cloud masked' },
  { key: 'JUL', label: 'JUL 2026', progress: 0.8, desc: 'Heavy clearing active' },
  { key: 'AUG', label: 'AUG 2026', progress: 0.92, desc: 'Core canopy collapse' },
  { key: 'SEP', label: 'SEP 2026', progress: 1.0, desc: 'High-risk deforestation anomaly' },
];

export const TerrainForestScene: React.FC<TerrainForestSceneProps> = ({ forestName = 'Nilgiri Biosphere' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // UI & Layer States
  const [selectedAoiId, setSelectedAoiId] = useState<string>('FOREST_001');
  const [activeLayer, setActiveLayer] = useState<'satellite' | 'density' | 'blended' | 'terrain'>('blended');
  const [densityOpacity, setDensityOpacity] = useState<number>(0.75);
  const [canopyHeightScale, setCanopyHeightScale] = useState<number>(1.8);
  const [elevationExaggeration, setElevationExaggeration] = useState<number>(1.5);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [showPointCloud, setShowPointCloud] = useState<boolean>(false);
  const [sunAzimuth, setSunAzimuth] = useState<number>(135);
  const [isFlyover, setIsFlyover] = useState<boolean>(false);
  
  // Timeline State
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(8); // September
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [compareMonthIdx, setCompareMonthIdx] = useState<number>(0); // January

  // Inspected Cell State (when user clicks anywhere on 3D terrain)
  const [inspectedCell, setInspectedCell] = useState<{
    lat: number;
    lng: number;
    density: number;
    canopyCoverage: number;
    elevation: number;
    vegetationChange: number;
    classification: string;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    isHotspot: boolean;
  } | null>({
    lat: 11.5862,
    lng: 76.5541,
    density: 84.6,
    canopyCoverage: 81.2,
    elevation: 894,
    vegetationChange: -4.8,
    classification: 'Tropical Wet Evergreen Canopy',
    riskLevel: 'HIGH',
    isHotspot: false,
  });

  const aoi = FOREST_AOIS.find(a => a.id === selectedAoiId) || FOREST_AOIS[0];

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const canopyMeshRef = useRef<THREE.Mesh | null>(null);
  const pointCloudRef = useRef<THREE.Points | null>(null);
  const hotspotGroupRef = useRef<THREE.Group | null>(null);
  const beaconMeshRef = useRef<THREE.Mesh | null>(null);
  const pointerPinRef = useRef<THREE.Group | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Generate procedural DEM + Density + Multispectral satellite canvas texture
  const generateTextures = useCallback((clearingProgress: number) => {
    const size = 512;
    
    // 1. Satellite True-Color Texture Canvas
    const satCanvas = document.createElement('canvas');
    satCanvas.width = size;
    satCanvas.height = size;
    const satCtx = satCanvas.getContext('2d')!;

    // 2. Continuous Density Heatmap Canvas (0-100)
    const densCanvas = document.createElement('canvas');
    densCanvas.width = size;
    densCanvas.height = size;
    const densCtx = densCanvas.getContext('2d')!;

    // 3. Elevation Hypsometric DEM Texture Canvas
    const demCanvas = document.createElement('canvas');
    demCanvas.width = size;
    demCanvas.height = size;
    const demCtx = demCanvas.getContext('2d')!;

    const satImg = satCtx.createImageData(size, size);
    const densImg = densCtx.createImageData(size, size);
    const demImg = demCtx.createImageData(size, size);

    // Deforestation zone center & parameters
    const cx = size * 0.58;
    const cy = size * 0.62;
    const maxRadius = size * 0.16 * clearingProgress;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        const nx = x / size;
        const ny = y / size;

        // Terrain Elevation (DEM) multi-frequency procedural noise
        const n1 = Math.sin(nx * 5.0 + ny * 3.5) * 0.4 + Math.cos(nx * 8.0 - ny * 6.0) * 0.25;
        const n2 = Math.sin(nx * 14.0) * Math.cos(ny * 12.0) * 0.15 + Math.sin(nx * 26.0 + ny * 20.0) * 0.08;
        const elevNorm = Math.max(0, Math.min(1, n1 + n2 + 0.45));

        // Valley / stream drainage path
        const streamDist = Math.abs(ny - (Math.sin(nx * 4.0) * 0.15 + 0.5));
        const isStream = streamDist < 0.018;

        // Clearing anomaly calculation
        const dx = x - cx;
        const dy = y - cy;
        const angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);
        const irregularDist = maxRadius * (1.0 + 0.25 * Math.sin(angle * 5) + 0.15 * Math.cos(angle * 3));
        const inClearing = clearingProgress > 0.05 && dist < irregularDist;
        
        // Logging access road corridor
        const inRoad = clearingProgress > 0.2 && Math.abs((y - 0.7 * x) - (cy - 0.7 * cx)) < 6 && x > size * 0.25 && x < cx + maxRadius;

        // --- Density Calculation (0 to 100) ---
        let density = Math.min(100, Math.max(10, elevNorm * 75 + 25 + Math.sin(nx * 20) * 5));
        if (isStream) density = 45;
        if (inRoad) density = Math.max(5, density * (1.0 - 0.8 * clearingProgress));
        if (inClearing) {
          const clearingFactor = Math.max(0, 1.0 - (dist / irregularDist));
          density = Math.max(4, density * (1.0 - 0.9 * clearingFactor * clearingProgress));
        }

        // --- 1. Satellite Imagery True Color ---
        let rSat = 18, gSat = 78, bSat = 32;
        if (elevNorm > 0.75) {
          // High ridge evergreen
          rSat = 12; gSat = 58; bSat = 24;
        } else if (elevNorm < 0.3) {
          // Lowland valley
          rSat = 30; gSat = 95; bSat = 42;
        }
        if (isStream) {
          rSat = 35; gSat = 65; bSat = 90;
        }
        if (inRoad || (inClearing && density < 35)) {
          // Exposed laterite red soil / felled logs
          rSat = Math.floor(165 + Math.random() * 20);
          gSat = Math.floor(92 + Math.random() * 15);
          bSat = Math.floor(62 + Math.random() * 15);
        }
        // Micro terrain shading
        const shade = 0.8 + elevNorm * 0.35;
        satImg.data[idx] = Math.min(255, Math.floor(rSat * shade));
        satImg.data[idx + 1] = Math.min(255, Math.floor(gSat * shade));
        satImg.data[idx + 2] = Math.min(255, Math.floor(bSat * shade));
        satImg.data[idx + 3] = 255;

        // --- 2. Density Heatmap (Color Scale: 0-20 Red, 20-40 Orange, 40-60 Yellow, 60-80 Light Green, 80-100 Deep Emerald) ---
        let rDens = 0, gDens = 0, bDens = 0;
        if (density < 20) {
          // Very Low (Critical Deforestation)
          rDens = 220; gDens = 38; bDens = 38;
        } else if (density < 40) {
          // Low
          rDens = 234; gDens = 88; bDens = 12;
        } else if (density < 60) {
          // Moderate
          rDens = 234; gDens = 179; bDens = 8;
        } else if (density < 80) {
          // High
          rDens = 34; gDens = 197; bDens = 94;
        } else {
          // Very High
          rDens = 5; gDens = 150; bDens = 65;
        }
        densImg.data[idx] = rDens;
        densImg.data[idx + 1] = gDens;
        densImg.data[idx + 2] = bDens;
        densImg.data[idx + 3] = 255;

        // --- 3. DEM Hypsometric Elevation ---
        const demVal = Math.floor(elevNorm * 255);
        demImg.data[idx] = demVal;
        demImg.data[idx + 1] = demVal;
        demImg.data[idx + 2] = demVal;
        demImg.data[idx + 3] = 255;
      }
    }

    satCtx.putImageData(satImg, 0, 0);
    densCtx.putImageData(densImg, 0, 0);
    demCtx.putImageData(demImg, 0, 0);

    const satTexture = new THREE.CanvasTexture(satCanvas);
    const densTexture = new THREE.CanvasTexture(densCanvas);
    const demTexture = new THREE.CanvasTexture(demCanvas);

    satTexture.generateMipmaps = true;
    densTexture.generateMipmaps = true;
    demTexture.generateMipmaps = true;

    return { satTexture, densTexture, demTexture };
  }, []);

  // Initialize 3D Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene & Atmosphere Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060201);
    scene.fog = new THREE.FogExp2(0x0a0301, 0.007);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 2000);
    camera.position.set(0, 55, 80);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High Precision & Shadows
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going below ground
    controls.minDistance = 15;
    controls.maxDistance = 350;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // 5. Lighting System (Sun Directional + Ambient + Holographic Rim)
    const ambientLight = new THREE.AmbientLight(0xfff1e8, 0.65);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    sunLight.position.set(60, 90, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 400;
    sunLight.shadow.camera.left = -70;
    sunLight.shadow.camera.right = 70;
    sunLight.shadow.camera.top = 70;
    sunLight.shadow.camera.bottom = -70;
    scene.add(sunLight);
    dirLightRef.current = sunLight;

    // Holographic Grid Base
    const gridHelper = new THREE.GridHelper(120, 24, 0xb91c1c, 0x450a0a);
    gridHelper.position.y = -6.5;
    scene.add(gridHelper);

    // Build 3D Terrain Geometries
    const gridRes = 140;
    const terrainGeo = new THREE.PlaneGeometry(100, 100, gridRes - 1, gridRes - 1);
    terrainGeo.rotateX(-Math.PI / 2);

    const canopyGeo = new THREE.PlaneGeometry(100, 100, gridRes - 1, gridRes - 1);
    canopyGeo.rotateX(-Math.PI / 2);

    // Generate initial procedural DEM vertices
    const progress = TIMELINE_MONTHS[selectedMonthIdx].progress;
    const { satTexture, densTexture } = generateTextures(progress);

    const tPos = terrainGeo.attributes.position;
    const cPos = canopyGeo.attributes.position;

    // Point cloud vertex array
    const pcVertices: number[] = [];
    const pcColors: number[] = [];

    for (let i = 0; i < tPos.count; i++) {
      const x = tPos.getX(i);
      const z = tPos.getZ(i);
      const nx = (x + 50) / 100;
      const nz = (z + 50) / 100;

      // Realistic DEM terrain height
      const n1 = Math.sin(nx * 5.0 + nz * 3.5) * 6.5 + Math.cos(nx * 8.0 - nz * 6.0) * 4.0;
      const n2 = Math.sin(nx * 14.0) * Math.cos(nz * 12.0) * 2.2 + Math.sin(nx * 26.0 + nz * 20.0) * 1.0;
      let terrainY = n1 + n2;

      // Deforestation clearing zone
      const dx = x - 8.0;
      const dz = z - 12.0;
      const dist = Math.hypot(dx, dz);
      const inClearing = dist < 16.0;

      // Canopy height (elevation on top of ground)
      let canopyHeight = 4.5;
      if (inClearing) {
        const factor = Math.max(0, 1.0 - (dist / 16.0));
        canopyHeight = Math.max(0.3, 4.5 * (1.0 - factor * progress));
      }

      tPos.setY(i, terrainY);
      cPos.setY(i, terrainY + canopyHeight);

      // Point cloud samples
      if (i % 2 === 0) {
        pcVertices.push(x, terrainY + canopyHeight * 0.8, z);
        if (inClearing && progress > 0.3) {
          pcColors.push(0.9, 0.2, 0.15);
        } else {
          pcColors.push(0.1, 0.8, 0.3);
        }
      }
    }

    terrainGeo.computeVertexNormals();
    canopyGeo.computeVertexNormals();

    // Terrain Base Material (Satellite / DEM texture)
    const terrainMat = new THREE.MeshStandardMaterial({
      map: satTexture,
      roughness: 0.85,
      metalness: 0.1,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    terrainMesh.castShadow = false;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // Volumetric Canopy Density Surface Material
    const canopyMat = new THREE.MeshStandardMaterial({
      map: densTexture,
      transparent: true,
      opacity: densityOpacity,
      roughness: 0.6,
      metalness: 0.05,
      wireframe: false,
    });
    const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
    canopyMesh.castShadow = true;
    canopyMesh.receiveShadow = true;
    scene.add(canopyMesh);
    canopyMeshRef.current = canopyMesh;

    // LiDAR / Density Point Cloud
    const pcGeo = new THREE.BufferGeometry();
    pcGeo.setAttribute('position', new THREE.Float32BufferAttribute(pcVertices, 3));
    pcGeo.setAttribute('color', new THREE.Float32BufferAttribute(pcColors, 3));
    const pcMat = new THREE.PointsMaterial({ size: 1.2, vertexColors: true, transparent: true, opacity: 0.85 });
    const pointCloud = new THREE.Points(pcGeo, pcMat);
    pointCloud.visible = showPointCloud;
    scene.add(pointCloud);
    pointCloudRef.current = pointCloud;

    // Hotspot Delineation Wireframe Group
    const hotspotGroup = new THREE.Group();
    const hotspotRingGeo = new THREE.RingGeometry(11, 15, 32);
    hotspotRingGeo.rotateX(-Math.PI / 2);
    const hotspotRingMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
    const hotspotRing = new THREE.Mesh(hotspotRingGeo, hotspotRingMat);
    hotspotRing.position.set(8.0, 7.5, 12.0);
    hotspotGroup.add(hotspotRing);

    // 3D Pulsing Beacon Pin
    const beaconGeo = new THREE.CylinderGeometry(0.2, 1.8, 14, 16);
    const beaconMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, emissive: 0xef4444, emissiveIntensity: 0.8, transparent: true, opacity: 0.8 });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.position.set(8.0, 14.5, 12.0);
    hotspotGroup.add(beaconMesh);
    beaconMeshRef.current = beaconMesh;
    scene.add(hotspotGroup);
    hotspotGroupRef.current = hotspotGroup;

    // Clicked Pointer Pin
    const pinGroup = new THREE.Group();
    const pinGeo = new THREE.ConeGeometry(1.2, 4, 16);
    pinGeo.rotateX(Math.PI);
    const pinMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const pinMesh = new THREE.Mesh(pinGeo, pinMat);
    pinMesh.position.y = 2;
    pinGroup.add(pinMesh);
    pinGroup.position.set(4, 9, -2);
    scene.add(pinGroup);
    pointerPinRef.current = pinGroup;

    // Raycasting for interactive cell selection on 3D click
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([terrainMesh, canopyMesh]);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const pt = hit.point;

        // Position 3D pin at intersection
        if (pointerPinRef.current) {
          pointerPinRef.current.position.set(pt.x, pt.y + 2.5, pt.z);
        }

        // Calculate scientific geospatial attributes for clicked point
        const nx = (pt.x + 50) / 100;
        const nz = (pt.z + 50) / 100;
        const cellLat = aoi.lat + (0.5 - nz) * 0.045;
        const cellLng = aoi.lng + (nx - 0.5) * 0.045;
        
        const dx = pt.x - 8.0;
        const dz = pt.z - 12.0;
        const distFromClearing = Math.hypot(dx, dz);
        const isClearingCell = distFromClearing < 15.0;

        let densityVal = isClearingCell ? Math.max(12, 85 - (15 - distFromClearing) * 5.2 * progress) : (75 + Math.sin(nx * 12) * 15);
        densityVal = Math.round(densityVal * 10) / 10;
        
        const canopyCov = Math.round(densityVal * 0.94 * 10) / 10;
        const elev = Math.round(aoi.baseElevation + (pt.y + 6) * 75);
        const vegChange = isClearingCell ? -Math.round((1.0 - densityVal / 88.4) * 100 * 10) / 10 : -Math.round(Math.random() * 4 * 10) / 10;
        
        let risk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
        if (densityVal < 30) risk = 'CRITICAL';
        else if (densityVal < 55) risk = 'HIGH';
        else if (densityVal < 70) risk = 'MODERATE';

        let classification = 'Tropical Wet Evergreen Canopy';
        if (isClearingCell && progress > 0.4) classification = 'Active Forest Clearing & Felling Zone';
        else if (elev > 1600) classification = 'High-Altitude Shola Grassland';
        else if (densityVal < 50) classification = 'Degraded Semi-Evergreen Forest';

        setInspectedCell({
          lat: cellLat,
          lng: cellLng,
          density: densityVal,
          canopyCoverage: canopyCov,
          elevation: elev,
          vegetationChange: vegChange,
          classification,
          riskLevel: risk,
          isHotspot: isClearingCell,
        });
      }
    };

    container.addEventListener('click', handleCanvasClick);

    // Animation Loop
    let angle = 0;
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Autonomous Flyover Drone mode
      if (isFlyover) {
        angle += 0.005;
        camera.position.x = Math.sin(angle) * 75;
        camera.position.z = Math.cos(angle) * 75;
        camera.position.y = 35 + Math.sin(angle * 2) * 10;
        camera.lookAt(0, 2, 0);
      } else {
        controls.update();
      }

      // Beacon pulsing animation
      if (beaconMeshRef.current) {
        const t = performance.now() * 0.003;
        beaconMeshRef.current.scale.y = 1.0 + 0.15 * Math.sin(t * 3);
        const mat = beaconMeshRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 4);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleCanvasClick);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, [selectedAoiId, generateTextures]);

  // Update Textures & Displacements when Month or Layer parameters change
  useEffect(() => {
    if (!canopyMeshRef.current || !terrainMeshRef.current) return;

    const progress = TIMELINE_MONTHS[selectedMonthIdx].progress;
    const { satTexture, densTexture, demTexture } = generateTextures(progress);

    const terrainMat = terrainMeshRef.current.material as THREE.MeshStandardMaterial;
    const canopyMat = canopyMeshRef.current.material as THREE.MeshStandardMaterial;

    if (activeLayer === 'satellite') {
      terrainMat.map = satTexture;
      canopyMat.visible = false;
    } else if (activeLayer === 'density') {
      terrainMat.map = densTexture;
      canopyMat.visible = false;
    } else if (activeLayer === 'terrain') {
      terrainMat.map = demTexture;
      canopyMat.visible = false;
    } else {
      // Blended mode: Terrain has satellite, canopy surface has density texture overlay
      terrainMat.map = satTexture;
      canopyMat.map = densTexture;
      canopyMat.visible = true;
      canopyMat.opacity = densityOpacity;
    }

    terrainMat.needsUpdate = true;
    canopyMat.needsUpdate = true;

    // Update Sun Light Position based on Azimuth
    if (dirLightRef.current) {
      const rad = (sunAzimuth * Math.PI) / 180;
      dirLightRef.current.position.set(Math.cos(rad) * 90, 80, Math.sin(rad) * 90);
    }

    // Toggle Hotspot & PointCloud visibility
    if (hotspotGroupRef.current) hotspotGroupRef.current.visible = showHotspots;
    if (pointCloudRef.current) pointCloudRef.current.visible = showPointCloud;
  }, [selectedMonthIdx, activeLayer, densityOpacity, showHotspots, showPointCloud, sunAzimuth, generateTextures]);

  // Camera Presets
  const setCameraPreset = (preset: 'nadir' | 'isometric' | 'ridge' | 'flyover') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setIsFlyover(false);

    if (preset === 'nadir') {
      camera.position.set(0, 110, 0.1);
      controls.target.set(0, 0, 0);
    } else if (preset === 'isometric') {
      camera.position.set(55, 55, 65);
      controls.target.set(0, 0, 0);
    } else if (preset === 'ridge') {
      camera.position.set(0, 14, 75);
      controls.target.set(0, 5, 0);
    } else if (preset === 'flyover') {
      setIsFlyover(true);
    }
    controls.update();
  };

  const resetCamera = () => {
    setCameraPreset('isometric');
  };

  return (
    <div className="relative w-full h-[680px] rounded-2xl overflow-hidden flex flex-col font-sans select-none animate-fade-slide-up"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #170500 0%, #080100 100%)',
        border: '1px solid rgba(185,28,28,0.3)',
        boxShadow: '0 0 35px rgba(0,0,0,0.85)'
      }}
    >
      {/* ── 1. Top Futuristic HUD Header ── */}
      <div
        className="z-20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl"
        style={{
          background: 'rgba(15,3,0,0.88)',
          borderBottom: '1px solid rgba(185,28,28,0.25)'
        }}
      >
        {/* Title & Coordinates */}
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl animate-glow-red" style={{ background: 'linear-gradient(135deg, #7F1D1D, #DC2626)' }}>
            <Eye className="h-5 w-5 text-red-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron text-xs font-black uppercase tracking-widest text-red-300">
                3D DIGITAL TWIN &amp; FOREST DENSITY MODEL
              </h2>
              <span className="font-mono-hud text-[8px] px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-bold">
                10M SENTINEL-2 L2A · COPERNICUS DEM
              </span>
            </div>
            <p className="font-mono-hud text-[9px] text-amber-500/70">
              AOI: {aoi.name} · {aoi.lat.toFixed(4)}°N, {aoi.lng.toFixed(4)}°E · Elev {aoi.baseElevation}m - {aoi.peakElevation}m MSL
            </p>
          </div>
        </div>

        {/* Forest AOI Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedAoiId}
            onChange={(e) => setSelectedAoiId(e.target.value)}
            className="rounded-lg px-2.5 py-1.5 font-orbitron text-[10px] font-bold"
            style={{
              background: 'rgba(10,3,0,0.9)',
              border: '1px solid rgba(185,28,28,0.4)',
              color: '#F5E6DC',
              outline: 'none',
              colorScheme: 'dark'
            }}
          >
            {FOREST_AOIS.map(f => (
              <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
            ))}
          </select>

          {/* Camera View Angle Buttons */}
          <div className="flex items-center rounded-lg p-0.5" style={{ background: 'rgba(25,5,0,0.85)', border: '1px solid rgba(185,28,28,0.3)' }}>
            <button
              onClick={() => setCameraPreset('nadir')}
              className="px-2 py-1 text-[9px] font-orbitron font-bold text-red-300 hover:text-white transition-all"
              title="Top-down 90° Nadir Satellite View"
            >
              NADIR
            </button>
            <button
              onClick={() => setCameraPreset('isometric')}
              className="px-2 py-1 text-[9px] font-orbitron font-bold text-red-300 hover:text-white transition-all border-l border-red-900/40"
              title="45° Isometric Orbit"
            >
              ORBIT
            </button>
            <button
              onClick={() => setCameraPreset('ridge')}
              className="px-2 py-1 text-[9px] font-orbitron font-bold text-red-300 hover:text-white transition-all border-l border-red-900/40"
              title="Ridge Profile View"
            >
              RIDGE
            </button>
            <button
              onClick={() => setCameraPreset('flyover')}
              className={`px-2.5 py-1 text-[9px] font-orbitron font-bold flex items-center gap-1 transition-all border-l border-red-900/40 ${isFlyover ? 'bg-red-700 text-white rounded' : 'text-amber-400 hover:text-white'}`}
              title="Autonomous Drone Flyover Tour"
            >
              <Plane className="h-2.5 w-2.5" />
              {isFlyover ? 'FLYING' : 'FLYOVER'}
            </button>
          </div>

          <button
            onClick={resetCamera}
            className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-950/60 border border-red-900/40 transition-all"
            title="Reset 3D Camera"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── 2. Main Three.js 3D WebGL Canvas Container ── */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing" ref={mountRef}>
        {/* Real-time Compass HUD (Top Left) */}
        <div
          className="absolute top-3 left-3 z-10 p-2 rounded-xl backdrop-blur-md space-y-1.5 text-[9px] font-mono-hud"
          style={{ background: 'rgba(15,3,0,0.85)', border: '1px solid rgba(185,28,28,0.35)', color: '#F5E6DC' }}
        >
          <div className="flex items-center gap-1.5 font-bold text-red-300">
            <Compass className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: '20s' }} />
            <span>HEADING: 042° NNE</span>
          </div>
          <div className="text-[8px] text-amber-500/80">
            PITCH: 38° · FOV: 45° · DEM GSD: 10m
          </div>
        </div>

        {/* ── Floating Left Toolbar: Layer Controls & Sliders ── */}
        <div
          className="absolute top-14 left-3 z-10 p-3 rounded-xl backdrop-blur-xl w-60 space-y-3"
          style={{ background: 'rgba(15,3,0,0.92)', border: '1px solid rgba(185,28,28,0.3)', color: '#F5E6DC' }}
        >
          <div className="flex items-center justify-between pb-1 border-b border-red-900/30">
            <span className="font-orbitron text-[9px] font-black uppercase text-red-300 flex items-center gap-1.5">
              <Layers className="h-3 w-3 text-amber-500" /> SPATIAL LAYERS
            </span>
          </div>

          {/* Layer Selector Buttons */}
          <div className="grid grid-cols-2 gap-1 text-[9px] font-orbitron font-bold">
            {[
              { id: 'blended', label: 'SATELLITE + DENSITY' },
              { id: 'satellite', label: 'SATELLITE ONLY' },
              { id: 'density', label: 'DENSITY HEATMAP' },
              { id: 'terrain', label: 'DEM ELEVATION' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => setActiveLayer(l.id as any)}
                className={`py-1.5 px-2 rounded text-center transition-all ${
                  activeLayer === l.id
                    ? 'bg-red-900 text-red-100 font-black border border-red-500 shadow-md'
                    : 'bg-black/50 text-stone-400 hover:text-white border border-red-950'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Density Opacity Slider */}
          {activeLayer === 'blended' && (
            <div className="space-y-1">
              <div className="flex justify-between text-[8.5px] font-bold text-amber-400/90">
                <span>DENSITY OPACITY</span>
                <span>{Math.round(densityOpacity * 100)}%</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05} value={densityOpacity}
                onChange={(e) => setDensityOpacity(Number(e.target.value))}
                className="w-full h-1 bg-red-950 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          )}

          {/* Sun / Lighting Azimuth */}
          <div className="space-y-1">
            <div className="flex justify-between text-[8.5px] font-bold text-amber-400/90">
              <span className="flex items-center gap-1"><Sun className="h-2.5 w-2.5" /> SUN ANGLE</span>
              <span>{sunAzimuth}°</span>
            </div>
            <input
              type="range" min={0} max={360} step={5} value={sunAzimuth}
              onChange={(e) => setSunAzimuth(Number(e.target.value))}
              className="w-full h-1 bg-red-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Layer Toggles */}
          <div className="space-y-1.5 pt-1 border-t border-red-900/30 text-[9px] font-bold">
            <label className="flex items-center justify-between cursor-pointer text-red-200">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3 text-red-500" /> Hotspot Clearing Overlay
              </span>
              <input
                type="checkbox" checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
                className="accent-red-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer text-green-300">
              <span className="flex items-center gap-1.5">
                <Sliders className="h-3 w-3 text-green-400" /> 3D LiDAR Point Cloud
              </span>
              <input
                type="checkbox" checked={showPointCloud}
                onChange={(e) => setShowPointCloud(e.target.checked)}
                className="accent-green-500 rounded"
              />
            </label>
          </div>
        </div>

        {/* ── Floating Right HUD: Selected Cell Inspector ── */}
        {inspectedCell && (
          <div
            className="absolute top-3 right-3 z-10 p-3.5 rounded-xl backdrop-blur-xl w-72 space-y-2.5 animate-fade-slide-up"
            style={{
              background: 'rgba(15,3,0,0.94)',
              border: `1px solid ${inspectedCell.isHotspot ? 'rgba(239,68,68,0.7)' : 'rgba(185,28,28,0.35)'}`,
              boxShadow: inspectedCell.isHotspot ? '0 0 25px rgba(220,38,38,0.3)' : 'none'
            }}
          >
            <div className="flex items-center justify-between border-b border-red-900/40 pb-1.5">
              <span className="font-orbitron text-[9.5px] font-black uppercase tracking-wider text-red-300 flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-red-500" /> GEOSPATIAL CELL INSPECTOR
              </span>
              <span
                className="px-2 py-0.5 rounded font-orbitron text-[8px] font-black"
                style={{
                  background: inspectedCell.riskLevel === 'CRITICAL' ? '#7f1d1d' : inspectedCell.riskLevel === 'HIGH' ? '#9a3412' : '#14532d',
                  color: '#fee2e2'
                }}
              >
                {inspectedCell.riskLevel} RISK
              </span>
            </div>

            <div className="space-y-1 text-[9.5px] font-mono-hud text-stone-300">
              <div className="flex justify-between">
                <span className="text-amber-500/70">COORDINATES:</span>
                <span className="font-bold text-stone-100">{inspectedCell.lat.toFixed(5)}°N, {inspectedCell.lng.toFixed(5)}°E</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-500/70">ELEVATION (MSL):</span>
                <span className="font-bold text-amber-400">{inspectedCell.elevation} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-500/70">CANOPY DENSITY:</span>
                <span className="font-bold font-orbitron" style={{ color: inspectedCell.density > 60 ? '#86efac' : '#fca5a5' }}>
                  {inspectedCell.density}% ({inspectedCell.density > 80 ? 'Very High' : inspectedCell.density > 60 ? 'High' : inspectedCell.density > 40 ? 'Moderate' : 'Critical Low'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-500/70">CANOPY COVERAGE:</span>
                <span className="font-bold text-stone-100">{inspectedCell.canopyCoverage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-500/70">VEG LOSS (ΔNDVI):</span>
                <span className="font-bold text-red-400">{inspectedCell.vegetationChange}%</span>
              </div>
              <div className="pt-1 text-[8.5px] text-amber-300/80 border-t border-red-950">
                CLASS: {inspectedCell.classification}
              </div>
            </div>

            {/* Hotspot Alert Banner if clicked in clearing */}
            {inspectedCell.isHotspot && (
              <div className="rounded-lg p-2 bg-red-950/80 border border-red-700/60 space-y-1 text-[8.5px]">
                <div className="flex items-center gap-1 font-orbitron font-black text-red-300">
                  <AlertTriangle className="h-3 w-3 text-red-400 animate-pulse" />
                  POTENTIAL FOREST-LOSS HOTSPOT
                </div>
                <div className="font-mono-hud text-red-200">
                  Area: {aoi.deforestationAreaKm2} km² ({Math.round(aoi.deforestationAreaKm2 * 100)} ha) · Confidence: 93.4%
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 3. Bottom Color Legend & Scale ── */}
        <div
          className="absolute bottom-20 left-4 z-10 p-2 rounded-xl backdrop-blur-md flex items-center gap-3 text-[8.5px] font-mono-hud"
          style={{ background: 'rgba(15,3,0,0.85)', border: '1px solid rgba(185,28,28,0.25)', color: '#F5E6DC' }}
        >
          <span className="font-bold text-amber-400">CANOPY DENSITY:</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-600" /> 0–20 (Very Low)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> 20–40 (Low)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-400" /> 40–60 (Moderate)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> 60–80 (High)</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-600" /> 80–100 (Very High)</span>
        </div>
      </div>

      {/* ── 4. Bottom Time Series Comparison Timeline (Interactive) ── */}
      <div
        className="z-20 px-4 py-2.5 backdrop-blur-xl flex flex-col gap-1.5"
        style={{
          background: 'rgba(12,2,0,0.92)',
          borderTop: '1px solid rgba(185,28,28,0.3)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-red-500" />
            <span className="font-orbitron text-[9px] font-black uppercase text-red-300">
              TIME-SERIES SATELLITE CHRONOLOGY · {TIMELINE_MONTHS[selectedMonthIdx].label}
            </span>
            <span className="text-[8.5px] font-mono-hud text-amber-400/80">
              ({TIMELINE_MONTHS[selectedMonthIdx].desc})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[9px] font-orbitron font-bold">
            <span className="text-stone-400">SCENE DENSITY:</span>
            <span className="text-red-400 font-black">
              {Math.round(aoi.baselineDensity - (aoi.baselineDensity - aoi.currentDensity) * TIMELINE_MONTHS[selectedMonthIdx].progress * 10) / 10}%
            </span>
          </div>
        </div>

        {/* Timeline Months Bar */}
        <div className="grid grid-cols-9 gap-1">
          {TIMELINE_MONTHS.map((m, idx) => {
            const isSelected = selectedMonthIdx === idx;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMonthIdx(idx)}
                className={`py-1 rounded text-center font-orbitron text-[9px] font-bold transition-all ${
                  isSelected
                    ? 'bg-red-700 text-white shadow-lg shadow-red-900/60 font-black border border-red-400 scale-[1.03]'
                    : 'bg-stone-900/80 text-stone-400 hover:text-white hover:bg-stone-800 border border-stone-800'
                }`}
              >
                {m.key}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
