import { useCallback, useEffect, useRef, useState } from "react";
import { GoogleMap, InfoWindowF, MarkerF, CircleF, useJsApiLoader } from "@react-google-maps/api";
import HUDFrame from "../HUD/HUDFrame";
import {
  getConvoySignatures,
  listPoliceStations,
  listVehicles,
  simulateVehicleTick,
  subscribeAlerts,
} from "../../api/client";
import { REGION } from "../../data/mockData";

const GOOGLE_MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const POLL_MS = 4000;

// Dark, low-chroma map theme so the Google basemap doesn't fight the
// app's amber/copper HUD aesthetic used everywhere else.
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0d120e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d120e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a9188" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c2620" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7269" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1512" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#111a13" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2b332c" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#8a9188" }] },
];

const RISK_COLOR: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f59e0b",
  MODERATE: "#eab308",
  LOW: "#22c55e",
};

function riskFromFlags(flags: string[]): string {
  if (flags.includes("INSIDE_CHANGE_BUFFER") && flags.includes("OFF_ROUTE_TRANSIT")) return "CRITICAL";
  if (flags.includes("INSIDE_CHANGE_BUFFER") || flags.includes("OFF_ROUTE_TRANSIT")) return "HIGH";
  if (flags.length > 0) return "MODERATE";
  return "LOW";
}

function vehicleIcon(color: string): google.maps.Symbol {
  return {
    path: "M -6,-3 L -6,3 L -3,3 L -3,5 L 3,5 L 3,3 L 6,3 L 6,-3 L 3,-5 L -3,-5 Z",
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#0d120e",
    strokeWeight: 1.5,
    scale: 1.6,
    anchor: new google.maps.Point(0, 0),
  };
}

function stationIcon(): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: "#38bdf8",
    fillOpacity: 0.95,
    strokeColor: "#0d120e",
    strokeWeight: 1.5,
    scale: 6,
  };
}

interface LiveAlert {
  alert_id: string;
  headline?: string;
  rating?: string;
  kind?: string;
  notified_stations?: { name: string; distance_km: number }[];
  created_at: string;
}

export default function GoogleLiveMap() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [convoys, setConvoys] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [recentAlerts, setRecentAlerts] = useState<LiveAlert[]>([]);
  const tickingRef = useRef(false);

  const { isLoaded } = useJsApiLoader({
    id: "pushpa-google-maps",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || "",
  });

  const refresh = useCallback(async () => {
    const [v, s, c] = await Promise.all([listVehicles(), listPoliceStations(), getConvoySignatures()]);
    if (v.ok) setVehicles(v.data.vehicles);
    if (s.ok) setStations(s.data.stations);
    if (c.ok) setConvoys(c.data.signatures);
  }, []);

  // Poll for live telemetry, and gently nudge each vehicle's position each
  // cycle so the map visibly moves — same simulate-tick endpoint the
  // Vehicle Monitor tab already uses, kept here so this view is
  // self-contained on its own tab.
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    let cancelled = false;

    const cycle = async () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      try {
        const list = await listVehicles();
        if (list.ok) {
          await Promise.all(list.data.vehicles.map((v: any) => simulateVehicleTick(v.vehicle_id)));
        }
        if (!cancelled) await refresh();
      } finally {
        tickingRef.current = false;
      }
    };

    cycle();
    const timer = setInterval(cycle, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [refresh]);

  // Live alert stream (SSE) — the moment a convoy signature or satellite
  // watch alert fires on the backend, it lands here instantly.
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) return;
    const unsubscribe = subscribeAlerts((alert) => {
      setRecentAlerts((prev) => [alert, ...prev].slice(0, 6));
    });
    return unsubscribe;
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <HUDFrame label="LIVE SATELLITE MAP · GOOGLE MAPS" className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="font-mono text-sm text-gold-400">No Google Maps API key configured</div>
        <p className="max-w-md font-mono text-[11px] leading-relaxed text-ash-500">
          Set <span className="text-ash-200">VITE_GOOGLE_MAPS_API_KEY</span> in a{" "}
          <span className="text-ash-200">.env.local</span> file at the project root, then restart{" "}
          <span className="text-ash-200">npm run dev</span>. The tactical map on the other tabs keeps working with
          zero keys in the meantime — this view is the real-world upgrade once you have one.
        </p>
      </HUDFrame>
    );
  }

  if (!isLoaded) {
    return (
      <HUDFrame label="LIVE SATELLITE MAP · GOOGLE MAPS" className="flex h-full items-center justify-center">
        <div className="font-mono text-xs text-ash-500">Loading map…</div>
      </HUDFrame>
    );
  }

  return (
    <div className="grid h-full grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_300px]">
      <HUDFrame label="LIVE SATELLITE MAP · VEHICLE + POLICE OVERLAY" scanline className="relative overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={{ lat: REGION.centerLat, lng: REGION.centerLng }}
          zoom={9}
          options={{
            mapTypeId: "satellite",
            styles: MAP_STYLE,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
          }}
        >
          {vehicles.map((v) => {
            const risk = riskFromFlags(v.analysis?.flags ?? []);
            return (
              <MarkerF
                key={v.vehicle_id}
                position={{ lat: v.lat, lng: v.lng }}
                icon={vehicleIcon(RISK_COLOR[risk])}
                label={{
                  text: v.vehicle_id,
                  color: "#e7e4dc",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  className: "pushpa-marker-label",
                }}
                onClick={() => setSelected({ kind: "vehicle", data: v, risk })}
              />
            );
          })}

          {stations.map((s) => (
            <MarkerF
              key={s.station_id}
              position={{ lat: s.lat, lng: s.lng }}
              icon={stationIcon()}
              onClick={() => setSelected({ kind: "station", data: s })}
            />
          ))}

          {convoys.map((c) => (
            <CircleF
              key={c.polygon_id}
              center={{ lat: c.centroid.lat, lng: c.centroid.lng }}
              radius={3000}
              options={{
                strokeColor: RISK_COLOR[c.rating] ?? "#ef4444",
                strokeOpacity: 0.8,
                strokeWeight: 1.5,
                fillColor: RISK_COLOR[c.rating] ?? "#ef4444",
                fillOpacity: 0.12,
                clickable: true,
              }}
              onClick={() => setSelected({ kind: "convoy", data: c })}
            />
          ))}

          {selected && (
            <InfoWindowF
              position={
                selected.kind === "vehicle"
                  ? { lat: selected.data.lat, lng: selected.data.lng }
                  : selected.kind === "station"
                  ? { lat: selected.data.lat, lng: selected.data.lng }
                  : { lat: selected.data.centroid.lat, lng: selected.data.centroid.lng }
              }
              onCloseClick={() => setSelected(null)}
            >
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#111", minWidth: 180 }}>
                {selected.kind === "vehicle" && (
                  <>
                    <div style={{ fontWeight: 700 }}>{selected.data.vehicle_id}</div>
                    <div>{selected.data.type}</div>
                    <div>Speed: {selected.data.speed_kmh} km/h</div>
                    <div>Cargo: {selected.data.cargo_weight_kg} kg — {selected.data.declared_species}</div>
                    <div>Risk: {selected.risk}</div>
                    {selected.data.analysis?.flags?.length > 0 && (
                      <div>Flags: {selected.data.analysis.flags.join(", ")}</div>
                    )}
                  </>
                )}
                {selected.kind === "station" && (
                  <>
                    <div style={{ fontWeight: 700 }}>{selected.data.name}</div>
                    <div>{selected.data.phone}</div>
                    <div>{selected.data.email}</div>
                  </>
                )}
                {selected.kind === "convoy" && (
                  <>
                    <div style={{ fontWeight: 700 }}>Convoy signature — {selected.data.polygon_id}</div>
                    <div>Score: {selected.data.convoy_score} ({selected.data.rating})</div>
                    <div>Vehicles: {selected.data.vehicles_involved.join(", ")}</div>
                  </>
                )}
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
        <div className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] text-ash-500">
          {vehicles.length} TRACKED VEHICLES · {stations.length} POLICE STATIONS · LIVE VIA {POLL_MS / 1000}s POLL + SSE
        </div>
      </HUDFrame>

      <div className="flex flex-col gap-3 overflow-y-auto">
        <div className="font-mono text-[11px] tracking-wider text-ash-500">LIVE ALERT FEED</div>
        {recentAlerts.length === 0 && (
          <div className="border border-line/60 bg-panel/30 px-3 py-2 font-mono text-[10px] text-ash-500">
            Waiting for the next detection…
          </div>
        )}
        {recentAlerts.map((a) => (
          <div key={a.alert_id} className="border border-line/60 bg-panel/40 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-wider" style={{ color: RISK_COLOR[a.rating ?? "LOW"] }}>
                {a.kind === "convoy_signature" ? "CONVOY" : a.kind === "satellite_watch" ? "CLEARING" : "VEHICLE"} · {a.rating}
              </span>
              <span className="font-mono text-[9px] text-ash-600">{new Date(a.created_at).toLocaleTimeString()}</span>
            </div>
            {a.headline && <div className="mt-1 font-mono text-[10px] text-ash-300">{a.headline}</div>}
            {a.notified_stations && a.notified_stations.length > 0 && (
              <div className="mt-1.5 border-t border-line/40 pt-1.5 font-mono text-[9px] text-signal-400">
                🚓 Notified: {a.notified_stations.map((s) => s.name).join(", ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
