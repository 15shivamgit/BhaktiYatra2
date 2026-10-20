'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

function MapPlaceholder({ height }) {
  return (
    <div
      aria-hidden="true"
      style={{ height }}
      className="animate-pulse rounded-lg border border-border bg-surface-muted"
    />
  );
}

/** Leaflet touches `window`, so the map loads only in the browser. */
const TempleMap = dynamic(() => import('./TempleMap'), { ssr: false });

/**
 * Loads Leaflet and the map tiles only when the map is about to scroll into view, so they do
 * not compete with the hero photo and page scripts on first load (Lighthouse LCP and TBT).
 * A map at the top of the page (list "map" view) is visible at once and loads immediately.
 */
export default function TempleMapLazy(props) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  const height = props.height ?? 380;
  return (
    <div ref={ref} data-map-slot="" style={{ minHeight: height }}>
      {visible ? <TempleMap {...props} /> : <MapPlaceholder height={height} />}
    </div>
  );
}
