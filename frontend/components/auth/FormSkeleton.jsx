/** Fallback while a form that reads the URL (useSearchParams) streams in. */
export default function FormSkeleton({ fields = 2 }) {
  return (
    <div aria-hidden="true" className="space-y-5">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
          <div className="h-11 animate-pulse rounded-md bg-surface-muted" />
        </div>
      ))}
      <div className="h-11 animate-pulse rounded-md bg-surface-muted" />
    </div>
  );
}
