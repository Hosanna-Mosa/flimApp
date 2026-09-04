import { cn } from '@/lib/utils';

interface Row {
  label: string;
  value: number;
  /** Optional second figure, shown small beside the first. */
  sub?: string;
}

interface BreakdownListProps {
  rows: Row[];
  unit?: string;
  emptyText?: string;
  max?: number;
  /** Numbers the bars against the total rather than the largest row. */
  ofTotal?: boolean;
}

/**
 * A ranked list with each row's share drawn behind it.
 *
 * The bar sits behind the text rather than beside it, so a dozen of these fit
 * on a page without it becoming a wall of axes — which is the shape this data
 * actually has. Scaled to the largest row by default, since the usual question
 * is which is biggest; ofTotal switches to share-of-whole for splits like
 * platform, where the proportion is the point.
 */
export function BreakdownList({
  rows,
  unit,
  emptyText = 'Nothing reported yet.',
  max = 8,
  ofTotal = false,
}: BreakdownListProps) {
  if (!rows?.length) {
    return (
      <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }

  const visible = rows.slice(0, max);
  const total = rows.reduce((sum, r) => sum + r.value, 0) || 1;
  const peak = Math.max(...visible.map((r) => r.value), 1);
  const scale = ofTotal ? total : peak;

  return (
    <div className="space-y-0.5">
      {visible.map((row, i) => {
        const pct = Math.round((row.value / total) * 100);
        return (
          <div
            key={`${row.label}-${i}`}
            className="group relative overflow-hidden rounded-md transition-colors hover:bg-accent/30"
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary/10 transition-all group-hover:bg-primary/20"
              style={{ width: `${Math.max((row.value / scale) * 100, 2)}%` }}
              aria-hidden="true"
            />
            <div className="relative flex items-center gap-3 px-2.5 py-2 text-sm">
              <span className="w-5 shrink-0 text-xs tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate" title={row.label}>
                {row.label || <span className="text-muted-foreground">(unnamed)</span>}
              </span>
              {row.sub && (
                <span className="shrink-0 text-xs text-muted-foreground">{row.sub}</span>
              )}
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pct}%</span>
              <span className="w-16 shrink-0 text-right font-medium tabular-nums">
                {row.value.toLocaleString('en-IN')}
                {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
              </span>
            </div>
          </div>
        );
      })}
      {rows.length > max && (
        <p className="pt-1.5 text-xs text-muted-foreground">
          +{rows.length - max} more not shown
        </p>
      )}
    </div>
  );
}

/** A labelled figure, uniform across the page. */
export function Stat({
  label,
  value,
  hint,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'good' | 'bad';
  icon?: React.ElementType;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
      </div>
      <p
        className={cn(
          'mt-2 text-3xl font-semibold tabular-nums tracking-tight',
          tone === 'good' && 'text-emerald-600',
          tone === 'bad' && 'text-destructive'
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
