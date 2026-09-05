import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { analyticsApi } from '@/services/api';
import {
  AnalyticsEvents,
  AnalyticsGrowth,
  AnalyticsOverview,
  FirebaseReport,
  FunnelStep,
  RetentionCohort,
} from '@/types';
import { Button } from '@/components/ui/button';
import { FirebasePanel } from '@/components/FirebasePanel';
import { Card } from '@/components/ui/card';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { cn } from '@/lib/utils';

const SERIES = 'hsl(var(--chart-1))';

const shortDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function SeriesTooltip({ active, payload, label, unit }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">
        {new Date(label as string).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </p>
      <p className="mt-1 text-popover-foreground tabular-nums">
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [growth, setGrowth] = useState<AnalyticsGrowth | null>(null);
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [cohorts, setCohorts] = useState<RetentionCohort[]>([]);
  const [events, setEvents] = useState<AnalyticsEvents | null>(null);
  const [firebase, setFirebase] = useState<FirebaseReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [o, g, f, r, e, fb] = await Promise.all([
          analyticsApi.getOverview(days),
          analyticsApi.getGrowth(days),
          analyticsApi.getFunnel(),
          analyticsApi.getRetention(),
          analyticsApi.getEvents(days),
          // Firebase is a third-party round trip and may be unconfigured, so a
          // failure there must not blank the page built from our own data.
          analyticsApi.getFirebase(days).catch(() => null),
        ]);
        if (cancelled) return;
        setOverview(o);
        setGrowth(g);
        setFunnel(f.steps);
        setCohorts(r.cohorts);
        setEvents(e);
        setFirebase(fb);
      } catch {
        if (!cancelled) setError('Could not load analytics. Check your connection and try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  if (isLoading && !overview) return <LoadingState message="Crunching numbers…" />;
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load analytics" description={error} />;
  if (!overview || !growth) return null;

  const change = overview.users.changePct;
  const biggestDrop = funnel
    .slice(1)
    .reduce<FunnelStep | null>(
      (worst, s) =>
        s.pctOfPrevious !== null && (worst === null || s.pctOfPrevious < (worst.pctOfPrevious ?? 100))
          ? s
          : worst,
      null
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Two sources, shown separately: what your own database knows, and what the app itself
            reports to Firebase.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(d)}
            >
              {d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Headline */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total users</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{overview.users.total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            New in {days} days
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{overview.users.new}</p>
          {change !== null && (
            <p
              className={cn(
                'mt-0.5 flex items-center gap-1 text-xs',
                change < 0 ? 'text-destructive' : 'text-emerald-600'
              )}
            >
              {change < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <TrendingUp className="h-3 w-3" />
              )}
              {change > 0 ? '+' : ''}
              {change}% vs previous {days}d
            </p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Have posted</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{overview.users.activationPct}%</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {overview.users.creators} of {overview.users.total}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Verified</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{overview.users.verified}</p>
        </Card>
      </div>

      <div className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold">From your own records</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Worked out from what the app already stores, so these cover the whole history — not just
          since tracking was switched on.
        </p>
      </div>

      {/* Signups */}
      <Card className="p-5">
        <h2 className="font-semibold">Signups per day</h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
          {overview.users.new} in the last {days} days.
        </p>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growth.signups} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={SERIES} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={shortDate}
                minTickGap={28}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<SeriesTooltip unit="signups" />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={SERIES}
                strokeWidth={2}
                fill="url(#signupFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Funnel */}
      <Card className="p-5">
        <h2 className="font-semibold">From signup to paying</h2>
        <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
          Each step is a subset of the one above. The drop between two rows is what matters.
        </p>

        <div className="space-y-2.5">
          {funnel.map((step, i) => (
            <div key={step.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span>{step.label}</span>
                <span className="flex items-baseline gap-2">
                  <span className="font-medium tabular-nums">{step.count}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {step.pctOfTotal}%
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(step.pctOfTotal, 0.6)}%`,
                    background: SERIES,
                  }}
                />
              </div>
              {i > 0 && step.pctOfPrevious !== null && (
                <p
                  className={cn(
                    'mt-1 text-xs',
                    step.pctOfPrevious < 40 ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {step.pctOfPrevious}% of the step above
                  {biggestDrop?.key === step.key ? ' — the biggest drop-off' : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Engagement + retention */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Activity in the last {days} days</h2>
          <div className="space-y-2 text-sm">
            {[
              ['New posts', overview.content.newPosts],
              ['Likes', overview.content.likes],
              ['Comments', overview.content.comments],
              ['Messages', overview.content.messages],
              ['New follows', overview.content.follows],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{value as number}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
            {overview.active.inPeriod} accounts signed in during this period. Sign-in dates exist for{' '}
            {overview.active.coveragePct}% of accounts, so treat this as a floor rather than an
            exact figure.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Do they come back?</h2>
          {cohorts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Not enough history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Joined</th>
                    <th className="pb-2 pr-3 text-right font-medium">Signed up</th>
                    <th className="pb-2 pr-3 text-right font-medium">Came back</th>
                    <th className="pb-2 text-right font-medium">Active 30d</th>
                  </tr>
                </thead>
                <tbody>
                  {cohorts.slice(-8).map((c) => (
                    <tr key={c.month} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3">
                        {new Date(`${c.month}-01`).toLocaleDateString('en-IN', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{c.signedUp}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">
                        {c.everReturned}
                      </td>
                      <td className="py-2 text-right tabular-nums">{c.activeLast30}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Firebase */}
      <div className="border-t border-border pt-6">
        <FirebasePanel report={firebase} />
      </div>

    </div>
  );
}
