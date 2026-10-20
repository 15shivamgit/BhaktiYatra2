'use client';

import 'leaflet/dist/leaflet.css';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';

function ClickToSet({ onPick }) {
  useMapEvents({
    click(event) {
      onPick({
        lat: Number(event.latlng.lat.toFixed(5)),
        lng: Number(event.latlng.lng.toFixed(5)),
      });
    },
  });
  return null;
}

/**
 * Click-to-place map for temple coordinates (5 decimal places ≈ 1 m).
 * @param {{ value: { lat: number, lng: number } | null, onChange: (v: { lat: number, lng: number }) => void, label: string }} props
 */
export default function MapPicker({ value, onChange, label }) {
  const center = value ? [value.lat, value.lng] : [22.5, 79];
  return (
    <div
      role="region"
      aria-label={label}
      className="overflow-hidden rounded-lg border border-border"
    >
      <MapContainer
        center={center}
        zoom={value ? 13 : 5}
        scrollWheelZoom
        style={{ height: 360, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToSet onPick={onChange} />
        {value && (
          <CircleMarker
            center={[value.lat, value.lng]}
            radius={9}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#7a1f2b', fillOpacity: 0.95 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
