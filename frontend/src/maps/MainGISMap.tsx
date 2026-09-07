import React, { useEffect, useState } from 'react';
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
  selectedForest?: ForestArea | null;
  onSelectPolygon: (poly: ChangePolygon) => void;
  onSelectVehicle: (v: Vehicle) => void;
  flyToCenter?: [number, number] | null;
}

// Helper to handle map pan/zoom programmatically on context selection
const MapContextFlyTo: React.FC<{ center?: [number, number] | null }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && !isNaN(center[0]) && !isNaN(center[1])) {
      map.flyTo(center, 13, { duration: 1.2 });
    }
  }, [center, map]);
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
  const [tileError, setTileError] = useState<boolean>(false);

  // Authorized Timber Route Corridors from Registry
  const monitoredCorridors = [
    {
      id: 'CORRIDOR_01',
      name: 'Forest Reserve Highway 181 (Timber Transit Corridor)',
      status: 'LEGAL',
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
      id: 'CORRIDOR_02',
      name: 'Unharvested Track 4 (Off-Corridor Deviation)',
      status: 'HIGH_RISK',
      coordinates: [
        [11.5830, 76.5490],
        [11.5900, 76.5300],
        [11.6100, 76.5100],
        [11.6400, 76.4800]
      ] as [number, number][]
    }
  ];

  // Professional Vehicle Icon
  const createVehicleIcon = (v: Vehicle) => {
    const isCritical = v.risk_level === 'CRITICAL' || v.risk_level === 'VERY HIGH';
    return L.divIcon({
      className: 'vehicle-marker-node',
      html: `
        <div style="
          background: ${isCritical ? '#8E2B18' : '#1D1813'};
          color: #F1E7D5;
          border: 1.5px solid ${isCritical ? '#D52B1E' : '#D99A4A'};
          border-radius: 4px;
          padding: 2px 5px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0,0,0,0.65);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          <span style="color: ${isCritical ? '#D52B1E' : '#718C48'};">●</span>
          <span>${v.vehicle_number}</span>
        </div>
      `,
      iconSize: [95, 22],
      iconAnchor: [47, 11]
    });
  };

  // Basemap Tile URL Resolution with graceful fallback
  const getTileConfig = () => {
    if (tileError || layers.basemapMode === 'dark') {
      return {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
      };
    }
    if (layers.basemapMode === 'topo') {
      return {
        url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; OpenTopoMap'
      };
    }
    // Default Satellite Layer (Google Satellite / Esri World Imagery fallback)
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    };
  };

  const tileConfig = getTileConfig();

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-[#4A3022]/60 shadow-xl bg-[#0B0907]">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#0B0907' }}
        scrollWheelZoom={true}
      >
        <MapContextFlyTo center={flyToCenter} />

        {/* Dynamic Basemap Layer */}
        <TileLayer
          attribution={tileConfig.attribution}
          url={tileConfig.url}
          maxZoom={19}
          eventHandlers={{
            tileerror: () => setTileError(true)
          }}
        />

        {/* 1. Forest Boundaries (GeoJSON Coordinate Safety [lng, lat] -> [lat, lng]) */}
        {layers.forestBoundaries && forests.map((forest) => {
          if (!forest.polygon_coordinates || forest.polygon_coordinates.length < 3) return null;
          const latLngs = forest.polygon_coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
          return (
            <Polygon
              key={forest.id}
              positions={latLngs}
              pathOptions={{
                color: '#718C48',
                weight: 1.5,
                fillColor: '#718C48',
                fillOpacity: 0.08,
                dashArray: '3, 3'
              }}
            >
              <Popup>
                <div className="p-2 text-xs bg-[#17130F] text-[#F1E7D5] border border-[#718C48] rounded-md font-tactical">
                  <h4 className="font-bold text-sm text-[#D99A4A]">{forest.name}</h4>
                  <p className="text-[11px] text-[#A99A87] mt-0.5 font-mono">Area: {forest.total_area_ha} ha</p>
                  <p className="text-[11px] text-[#D52B1E] font-mono">Recent Disturbance: {forest.recent_loss_ha} ha</p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* 2. Monitored Corridors */}
        {layers.vehicleRoutes && monitoredCorridors.map((road) => (
          <Polyline
            key={road.id}
            positions={road.coordinates}
            pathOptions={{
              color: road.status === 'HIGH_RISK' ? '#D52B1E' : '#9A8065',
              weight: road.status === 'HIGH_RISK' ? 2.5 : 1.5,
              opacity: 0.85,
              dashArray: road.status === 'HIGH_RISK' ? '5, 5' : undefined
            }}
          >
            <Popup>
              <div className="p-1.5 text-xs bg-[#17130F] text-[#F1E7D5] font-tactical">
                <span className="font-bold text-[#D99A4A]">{road.name}</span>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* 3. Disturbance Polygons (Actual Extracted GeoJSON geometries) */}
        {layers.disturbancePolygons && changePolygons.map((poly) => {
          if (!poly.polygon_geometry || poly.polygon_geometry.length < 3) return null;
          // poly.polygon_geometry is GeoJSON standard [[lng, lat], ...]
          const latLngs = poly.polygon_geometry.map(coord => [coord[1], coord[0]] as [number, number]);
          return (
            <React.Fragment key={poly.id}>
              <Polygon
                positions={latLngs}
                eventHandlers={{ click: () => onSelectPolygon(poly) }}
                pathOptions={{
                  color: '#D52B1E',
                  weight: 2,
                  fillColor: '#8E2B18',
                  fillOpacity: 0.65
                }}
              >
                <Popup>
                  <div className="p-2.5 text-xs bg-[#17130F] text-[#F1E7D5] border border-[#8E2B18] rounded-md font-tactical">
                    <div className="text-[#D52B1E] font-bold text-xs">
                      DISTURBANCE #{poly.id}
                    </div>
                    <div className="text-[11px] text-[#D99A4A] mt-1 font-mono">
                      Area: {poly.area_ha} ha • Veg Loss: -{poly.veg_loss_pct}%
                    </div>
                    <div className="text-[10px] text-[#A99A87] font-mono">
                      NDVI: {poly.mean_ndvi_before} → {poly.mean_ndvi_after}
                    </div>
                    <button
                      onClick={() => onSelectPolygon(poly)}
                      className="mt-2 w-full px-2 py-1 rounded bg-[#8E2B18] text-[#F1E7D5] text-[10px] font-bold uppercase hover:bg-[#5C160F] transition-colors"
                    >
                      OPEN INVESTIGATION DOSSIER
                    </button>
                  </div>
                </Popup>
              </Polygon>

              {/* Centroid indicator */}
              <CircleMarker
                center={[poly.centroid_lat, poly.centroid_lng]}
                radius={4}
                pathOptions={{
                  color: '#F1E7D5',
                  fillColor: '#D52B1E',
                  fillOpacity: 1,
                  weight: 1
                }}
              />
            </React.Fragment>
          );
        })}

        {/* 4. Historical Hotspots */}
        {layers.historicalHotspots && incidents.slice(0, 30).map((inc) => (
          <CircleMarker
            key={inc.id}
            center={[inc.latitude, inc.longitude]}
            radius={3.5}
            pathOptions={{
              color: '#8E2B18',
              fillColor: '#B65324',
              fillOpacity: 0.75,
              weight: 1
            }}
          >
            <Popup>
              <div className="p-1.5 text-xs bg-[#17130F] text-[#F1E7D5] font-tactical">
                <span className="font-bold text-[#D99A4A]">{inc.incident_type}</span>
                <p className="text-[10px] text-[#A99A87] font-mono">{inc.incident_date} • {inc.estimated_quantity_m3} m³</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 5. Tracked Vehicles & Telemetry */}
        {layers.vehicles && vehicles.map((v) => (
          <React.Fragment key={v.id}>
            <Marker
              position={[v.current_lat, v.current_lng]}
              icon={createVehicleIcon(v)}
              eventHandlers={{ click: () => onSelectVehicle(v) }}
            >
              <Popup>
                <div className="p-2.5 text-xs bg-[#17130F] text-[#F1E7D5] border border-[#4A3022] rounded-md font-tactical">
                  <h4 className="font-bold text-sm text-[#D99A4A]">{v.vehicle_number} ({v.vehicle_type})</h4>
                  <p className="text-[11px] text-[#A99A87] font-mono mt-0.5">
                    Speed: {v.speed_kmh} km/h • Heading: {v.heading_deg}°
                  </p>
                  <p className="text-[11px] text-[#A99A87] font-mono">
                    Route: {v.origin} → {v.destination}
                  </p>
                  <div className="mt-1 flex items-center space-x-2 font-mono text-[11px]">
                    <span className="text-[#A99A87]">Permit:</span>
                    <span className={v.permit_status === 'VALID' ? 'text-[#718C48]' : 'text-[#D52B1E]'}>
                      {v.permit_status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>

            {/* Trajectory Polyline */}
            {layers.vehicleRoutes && v.route_history && v.route_history.length > 1 && (
              <Polyline
                positions={v.route_history as [number, number][]}
                pathOptions={{
                  color: v.permit_status === 'VALID' ? '#718C48' : '#D52B1E',
                  weight: 1.8,
                  dashArray: '3, 3'
                }}
              />
            )}
          </React.Fragment>
        ))}
      </MapContainer>

      {/* Non-intrusive Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] pushpa-panel p-2 rounded-lg border border-[#4A3022]/60 text-[10px] font-tactical text-[#A99A87] flex items-center space-x-3 backdrop-blur-md">
        <span className="flex items-center space-x-1">
          <span className="h-2 w-2 rounded-full bg-[#718C48]" />
          <span>AOI Boundary</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="h-2 w-2 rounded-full bg-[#D52B1E]" />
          <span>Disturbance Candidate</span>
        </span>
        <span className="flex items-center space-x-1">
          <span className="h-2 w-2 rounded-full bg-[#D99A4A]" />
          <span>Vehicle Telemetry</span>
        </span>
      </div>
    </div>
  );
};
