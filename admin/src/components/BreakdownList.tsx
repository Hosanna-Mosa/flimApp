import { cn } from '@/lib/utils';

interface BreakdownListProps {
  rows: { label: string; value: number }[];
  /** Appended after each value, e.g. "users" or "views". */
  unit?: string;
  emptyText?: string;
  max?: number;
}

/**
 * A ranked list with the proportion drawn behind each row.
 *
 * The bar is a background fill rather than a separate chart column, so the
 * label and number stay on one line and a dozen of these can sit side by side
 * without the page turning into a wall of axes. Scaled against the largest row
 * rather than the total, because the question these answer is "which is
 * biggest", not "what share of the whole".
 */
export function BreakdownList({ rows, unit, emptyText = 'Nothing reported yet.', max = 8 }: BreakdownListProps) {
  if (!rows?.length) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }

  const visible = rows.slice(0, max);
  const peak = Math.max(...visible.map((r) => r.value), 1);

  return (
    <div className="space-y-1">
      {visible.map((row) => (
        <div key={row.label} className="relative overflow-hidden rounded-md">
          <div
            className="absolute inset-y-0 left-0 bg-primary/10"
            style={{ width: `${Math.max((row.value / peak) * 100, 2)}%` }}
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-sm">
            <span className="truncate" title={row.label}>
              {row.label || '—'}
            </span>
            <span className="shrink-0 tabular-nums font-medium">
              {row.value.toLocaleString('en-IN')}
              {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
            </span>
          </div>
        </div>
      ))}
      {rows.length > max && (
        <p className="pt-1 text-xs text-muted-foreground">+{rows.length - max} more</p>
      )}
    </div>
  );
}

/** A labelled figure. Used across the Firebase panel so the tiles stay uniform. */
export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'good' | 'bad';
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          tone === 'good' && 'text-emerald-600',
          tone === 'bad' && 'text-destructive'
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
