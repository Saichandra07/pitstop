import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";

// ─── Fit map bounds to show both markers ─────────────────────────────────────
function FitBounds({ positions }) {
  const map = useMap();
  useMemo(() => {
    if (positions.length === 2) {
      map.fitBounds(positions, { padding: [60, 60] });
    }
  }, [map, positions]);
  return null;
}

// ─── Custom div icons — no default Leaflet images needed ─────────────────────
const mechIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#4ADE80;border:2.5px solid rgba(74,222,128,0.5);box-shadow:0 0 12px rgba(74,222,128,0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#E63946;border:2.5px solid rgba(230,57,70,0.5);box-shadow:0 0 12px rgba(230,57,70,0.6);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// ─── Main component ───────────────────────────────────────────────────────────
export default function NavigationMap({ mechLat, mechLng, userLat, userLng }) {
  const mechPos = [mechLat, mechLng];
  const userPos = [userLat, userLng];
  const bounds  = [mechPos, userPos];

  const mapsUrl = `https://www.google.com/maps/dir/${mechLat},${mechLng}/${userLat},${userLng}`;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [60, 60] }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds positions={bounds} />

        {/* Mechanic pin — green */}
        <Marker position={mechPos} icon={mechIcon} />

        {/* User pin — red */}
        <Marker position={userPos} icon={userIcon} />

        {/* Dashed route line */}
        <Polyline
          positions={[mechPos, userPos]}
          pathOptions={{ color: "#E63946", weight: 2, dashArray: "6 6", opacity: 0.7 }}
        />
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: "absolute", top: 72, left: 16, zIndex: 10,
        display: "flex", flexDirection: "column", gap: 6,
        background: "rgba(12,14,22,0.82)", backdropFilter: "blur(6px)",
        borderRadius: 10, padding: "8px 12px",
        border: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>You</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E63946", flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>User</span>
        </div>
      </div>

    </div>
  );
}
