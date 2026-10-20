import TempleCard from './TempleCard';

/** Responsive grid of temple cards: 1 / 2 / 3 / 4 columns. */
export default function TempleGrid({ temples, columns = 4, priorityCount = 0 }) {
  const cols =
    columns === 3
      ? 'sm:grid-cols-2 lg:grid-cols-3'
      : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  return (
    <ul className={`grid grid-cols-1 gap-6 ${cols}`}>
      {temples.map((temple, index) => (
        <li key={temple.id} className="flex">
          <div className="w-full">
            <TempleCard temple={temple} priority={index < priorityCount} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TempleGridSkeleton({ count = 8 }) {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-md border border-border bg-surface">
          <div className="aspect-[3/2] animate-pulse bg-surface-muted" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
