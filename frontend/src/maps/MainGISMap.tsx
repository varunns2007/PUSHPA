import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { ForestArea, ChangePolygon, Vehicle, HistoricalIncident } from '../types';
import type { LayerToggles } from './LayerControls';

interface MainGISMapProps {
  forests: ForestArea[];
  changePolygons: ChangePolygon[];
  vehicles: Vehicle[];
  incidents: HistoricalIncident[];
  layers: LayerToggles;
  selectedForest: ForestArea | null;
  onSelectPolygon: (poly: ChangePolygon) => void;
  onSelectVehicle: (v: Vehicle) => void;
  flyToCenter?: [number, number] | null;
}

// Helper to handle map pan/zoom programmatically
const MapFlyTo: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

export const MainGISMap: React.FC<MainGISMapProps> = ({
  forests,
  changePolygons,
  vehicles,
  incidents,
  layers,
  onSelectPolygon,
  onSelectVehicle,
  flyToCenter
}) => {
  const defaultCenter: [number, number] = [11.5833, 76.5500];

  // Primary Forest Road Network passing through the forest reserve
  const forestRoads = [
    {
      id: 'ROAD_01',
      name: 'Forest Reserve Highway 181 (Timber Corridor)',
      coordinates: [
        [11.5300, 76.4900],
        [11.5500, 76.5200],
        [11.5750, 76.5400],
        [11.5830, 76.5490],
        [11.5855, 76.5520],
        [11.6000, 76.5700],
        [11.6300, 76.6000]
      ] as [number, number][]
    },
    {
      id: 'ROAD_02',
      name: 'Unharvested Track 4 (High Risk Exit Route)',
      coordinates: [
        [11.5830, 76.5490],
        [11.5900, 76.5300],
        [11.6100, 76.5100],
        [11.6400, 76.4800]
      ] as [number, number][]
    }
  ];

  // Grid points for Dense Tree Canopy Heatmap (🟢 Green)
  const denseTreePoints: [number, number][] = [
    [11.5800, 76.5300], [11.5900, 76.5400], [11.5700, 76.5600],
    [11.5600, 76.5400], [11.6000, 76.5600], [11.6100, 76.5800],
    [11.6800, 76.3600], [11.6900, 76.3800], [11.5500, 76.5200],
    [11.5300, 76.5000], [11.5000, 77.2200], [11.5200, 77.2500]
  ];

  // Custom Vehicle Icon
  const createVehicleIcon = (v: Vehicle) => {
    const isHighRisk = v.risk_level === 'CRITICAL' || v.risk_level === 'VERY HIGH';
    return L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div style="
          background: ${isHighRisk ? '#ef4444' : '#3b82f6'};
          color: white;
          border: 2px solid white;
          border-radius: 6px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 0 12px ${isHighRisk ? 'rgba(239,68,68,0.9)' : 'rgba(59,130,246,0.6)'};
          display: flex;
          align-items: center;
          gap: 3px;
        ">
          🚛 ${v.vehicle_number}
        </div>
      `,
      iconSize: [85, 24],
      iconAnchor: [42, 12]
    });
  };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: '#090d16' }}
      >
        {flyToCenter && <MapFlyTo center={flyToCenter} zoom={13} />}

        {/* Dynamic Basemap Engine */}
        {layers.basemapMode === 'google-hybrid' ? (
          <TileLayer
            attribution='&copy; Google Maps Platform (Hybrid Satellite & Roads)'
            url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        ) : layers.basemapMode === 'google-roads' ? (
          <TileLayer
            attribution='&copy; Google Maps Platform (Terrain & Road Network)'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            maxZoom={20}
          />
        ) : (
          <TileLayer
            attribution='&copy; OpenStreetMap contributors & CartoDB Dark'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        )}

        {/* 🟢 DENSE TREE CANOPY HEATMAP (Lush Green Heatmap Gradient) */}
        {layers.denseTreeHeatmap && denseTreePoints.map((pt, idx) => (
          <CircleMarker
            key={`dense-heat-${idx}`}
            center={pt}
            radius={35}
            pathOptions={{
              color: '#10b981',
              fillColor: '#10b981',
              fillOpacity: 0.32,
              stroke: false
            }}
          />
        ))}

        {/* 🔴 TREES CUT / DEFORESTATION HEATMAP (Bright Red Hotspots) */}
        {layers.treesCutHeatmap && changePolygons.map((poly) => (
          <React.Fragment key={`cut-heat-${poly.id}`}>
            {/* Outer Red Halo */}
            <CircleMarker
              center={[poly.centroid_lat, poly.centroid_lng]}
              radius={45}
              pathOptions={{
                color: '#dc2626',
                fillColor: '#ef4444',
                fillOpacity: 0.5,
                weight: 3
              }}
            />
            {/* Inner Red Core */}
            <CircleMarker
              center={[poly.centroid_lat, poly.centroid_lng]}
              radius={18}
              pathOptions={{
                color: '#991b1b',
                fillColor: '#b91c1c',
                fillOpacity: 0.8,
                weight: 2
              }}
            />
          </React.Fragment>
        ))}

        {/* Layer 1: Forest Boundaries */}
        {layers.forestBoundaries && forests.map((f) => (
          <Polygon
            key={f.id}
            positions={f.polygon_coordinates.map(pt => [pt[1], pt[0]]) as [number, number][]}
            pathOptions={{
              color: '#10b981',
              weight: 2.5,
              fillColor: '#10b981',
              fillOpacity: 0.15,
              dashArray: '5, 5'
            }}
          >
            <Popup className="custom-gis-popup">
              <div className="p-1 space-y-1 text-slate-900 font-sans">
                <h4 className="font-extrabold text-xs text-emerald-800">{f.name}</h4>
                <p className="text-[11px] font-medium">Total Area: {f.total_area_ha} ha</p>
                <p className="text-[11px]">Dense Canopy Coverage: {f.dense_veg_pct}%</p>
                <p className="text-[11px] font-bold text-red-600">Investigation Risk: {f.current_risk_score}/100</p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Forest Roads surrounded by Forest */}
        {layers.roads && forestRoads.map((road) => (
          <Polyline
            key={road.id}
            positions={road.coordinates}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.9,
              dashArray: '8, 8'
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans">
                <span className="font-bold text-xs text-blue-700 block">🛣️ {road.name}</span>
                <p className="text-[11px]">Forest Corridor Road for Timber Logistics</p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Extracted Change Polygons (Trees Cut Polygon Boundary) */}
        {layers.changePolygons && changePolygons.map((poly) => (
          <Polygon
            key={poly.id}
            positions={poly.polygon_geometry.map(pt => [pt[1], pt[0]]) as [number, number][]}
            pathOptions={{
              color: '#f43f5e',
              weight: 3,
              fillColor: '#f43f5e',
              fillOpacity: 0.65
            }}
            eventHandlers={{
              click: () => onSelectPolygon(poly)
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans">
                <span className="font-bold text-xs text-red-600 block">🪓 TREES CUT CLEARING POLYGON #{poly.id}</span>
                <p className="text-[11px]">Area Cleared: <strong>{poly.area_ha} ha</strong></p>
                <p className="text-[11px]">Vegetation Loss: <strong className="text-red-600">-{poly.veg_loss_pct}%</strong></p>
                <p className="text-[11px]">NDVI Drop: {poly.mean_ndvi_before} → {poly.mean_ndvi_after}</p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Vehicles & Route Trajectories on Forest Roads */}
        {layers.vehicles && vehicles.map((v) => (
          <React.Fragment key={v.id}>
            {layers.vehicleRoutes && v.route_history.length > 1 && (
              <Polyline
                positions={v.route_history as [number, number][]}
                pathOptions={{
                  color: v.risk_level === 'CRITICAL' ? '#ef4444' : '#06b6d4',
                  weight: 4,
                  dashArray: '6, 6'
                }}
              />
            )}

            <Marker
              position={[v.current_lat, v.current_lng]}
              icon={createVehicleIcon(v)}
              eventHandlers={{ click: () => onSelectVehicle(v) }}
            >
              <Popup>
                <div className="p-1 text-slate-900 font-sans space-y-1">
                  <span className="font-bold text-xs text-blue-700 block">🚛 VEHICLE {v.vehicle_number}</span>
                  <p className="text-[11px]">Type: {v.vehicle_type}</p>
                  <p className="text-[11px]">Speed: {v.speed_kmh} km/h</p>
                  <p className="text-[11px]">Destination: {v.destination}</p>
                  <p className="text-[11px] font-bold text-red-600">Permit: {v.permit_status}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Historical Incidents */}
        {layers.historicalIncidents && incidents.slice(0, 35).map((inc) => (
          <CircleMarker
            key={inc.id}
            center={[inc.latitude, inc.longitude]}
            radius={6}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#fbbf24',
              fillOpacity: 0.85,
              weight: 1
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans">
                <span className="font-bold text-xs text-amber-700 block">⚠️ HISTORICAL LOGGING INCIDENT</span>
                <p className="text-[11px]">{inc.incident_type} ({inc.incident_date})</p>
                <p className="text-[11px]">Est. Quantity: {inc.estimated_quantity_m3} m³</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Permitted Timber Depot Locations */}
        {layers.permittedLocations && (
          <Marker position={[11.5510, 76.5200]}>
            <Popup>
              <div className="p-1 text-slate-900 font-sans">
                <span className="font-bold text-xs text-emerald-700 block">✅ LICENSED TIMBER DEPOT A</span>
                <p className="text-[11px]">Approved forestry coupe transport station</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 z-[400] gis-glass px-3 py-2 rounded-xl border border-slate-800 text-[11px] flex items-center space-x-3 shadow-xl">
        <span className="flex items-center text-emerald-400 font-bold">
          <span className="h-3 w-3 rounded-full bg-emerald-500 mr-1.5 opacity-80"></span>
          Dense Tree Canopy
        </span>
        <span className="flex items-center text-red-400 font-bold">
          <span className="h-3 w-3 rounded-full bg-red-600 mr-1.5 animate-pulse"></span>
          Trees Cut / Deforestation
        </span>
        <span className="flex items-center text-blue-400 font-bold">
          <span className="h-2 w-4 bg-blue-500 mr-1.5"></span>
          Forest Route
        </span>
      </div>
    </div>
  );
};
