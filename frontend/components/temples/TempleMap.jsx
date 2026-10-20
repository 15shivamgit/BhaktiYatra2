'use client';

import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from 'react-leaflet';
import { useMemo } from 'react';

const SAFFRON = '#d9731f';
const MAROON = '#7a1f2b';

/**
 * OpenStreetMap view of temples (FR-TEMPLE-06). Circle markers avoid Leaflet's image-icon
 * asset problems under bundlers. Loaded only on the client (see TempleMapLazy).
 * @param {{ temples: { slug: string, name: string, city?: string, location: { lat: number, lng: number } | null, position?: number }[],
 *   highlightSlug?: string, route?: boolean, label: string, height?: number }} props
 */
export default function TempleMap({ temples, highlightSlug, route = false, label, height = 380 }) {
  const points = useMemo(() => temples.filter((t) => t.location), [temples]);
  const bounds = useMemo(
    () => (points.length ? points.map((t) => [t.location.lat, t.location.lng]) : [[22.5, 79]]),
    [points],
  );
  const single = points.length === 1;

  return (
    <div
      role="region"
      aria-label={label}
      className="overflow-hidden rounded-lg border border-border"
    >
      <MapContainer
        {...(single
          ? { center: bounds[0], zoom: 11 }
          : points.length
            ? { bounds, boundsOptions: { padding: [32, 32] } }
            : { center: [22.5, 79], zoom: 4 })}
        scrollWheelZoom={false}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {route && points.length > 1 && (
          <Polyline
            positions={bounds}
            pathOptions={{ color: MAROON, weight: 3, dashArray: '6 6' }}
          />
        )}
        {points.map((temple) => {
          const highlighted = temple.slug === highlightSlug;
          return (
            <CircleMarker
              key={temple.slug}
              center={[temple.location.lat, temple.location.lng]}
              radius={highlighted ? 10 : 7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: highlighted ? MAROON : SAFFRON,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <span className="block text-sm font-semibold">
                  {temple.position ? `${temple.position}. ` : ''}
                  {temple.name}
                </span>
                {temple.city && <span className="block text-xs">{temple.city}</span>}
                {!highlighted && (
                  <Link href={`/temples/${temple.slug}`} className="mt-1 block text-xs font-medium">
                    View temple →
                  </Link>
                )}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
