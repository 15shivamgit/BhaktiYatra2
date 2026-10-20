import TourCard from './TourCard';

/** Responsive grid of tour cards: 1 / 2 / 3 columns (4 on very wide screens when asked). */
export default function TourGrid({ tours, columns = 3, priorityCount = 0 }) {
  const cols =
    columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <ul className={`grid grid-cols-1 gap-6 ${cols}`}>
      {tours.map((tour, index) => (
        <li key={tour.id} className="flex">
          <div className="w-full">
            <TourCard tour={tour} priority={index < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TourGridSkeleton({ count = 6 }) {
  return (
    <ul aria-hidden="true" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="aspect-[3/2] animate-pulse bg-surface-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-surface-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
