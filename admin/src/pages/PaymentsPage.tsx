import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Download, IndianRupee, Wallet } from 'lucide-react';
import { paymentApi } from '@/services/api';
import { PaymentEntry, PaymentExceptions, PaymentSummary } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { Pagination } from '@/components/Pagination';
import { cn } from '@/lib/utils';

const money = (n: number, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n || 0);

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  failed: 'bg-destructive/10 text-destructive border-destructive/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  expired: 'bg-muted text-muted-foreground border-border',
  started: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
};

/** Recharts needs a concrete fill; the token carries the validated step per theme. */
const SERIES = 'hsl(var(--chart-1))';

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { payload: { count: number; collected: number } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">
        {new Date(label as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
      <p className="mt-1 text-popover-foreground">{money(d.collected)} collected</p>
      <p className="text-muted-foreground">
        {d.count} payment{d.count === 1 ? '' : 's'}
      </p>
    </div>
  );
}

export default function PaymentsPage() {
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [exceptions, setExceptions] = useState<PaymentExceptions | null>(null);
  const [entries, setEntries] = useState<PaymentEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [s, e, list] = await Promise.all([
          paymentApi.getSummary({ from, to }),
          paymentApi.getExceptions(),
          paymentApi.getPayments(page, 25, { status, from, to }),
        ]);
        if (cancelled) return;
        setSummary(s);
        setExceptions(e);
        setEntries(list.data);
        setTotalPages(list.totalPages || 1);
      } catch {
        if (!cancelled) setError('Could not load payments. Check your connection and try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, status, from, to]);

  const exceptionTotal = exceptions
    ? exceptions.totals.paidNotDelivered +
      exceptions.totals.abandonedCheckouts +
      exceptions.totals.pendingSubscriptions
    : 0;

  if (isLoading && !summary) return <LoadingState message="Loading payments…" />;
  if (error) return <EmptyState icon={AlertTriangle} title="Couldn't load payments" description={error} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Everything collected through Razorpay — subscriptions and wallet top-ups together.
          </p>
        </div>
        <Button variant="outline" onClick={() => paymentApi.exportCsv({ from, to, status })}>
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Headline numbers */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Collected</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {money(summary.collected, summary.currency)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payments</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.paidCount}</p>
            <p className="text-xs text-muted-foreground">of {summary.attempted} attempted</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Success rate</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{summary.successRate}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Average payment</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {money(summary.averagePayment, summary.currency)}
            </p>
          </Card>
        </div>
      )}

      {/* Exceptions */}
      {exceptions && exceptionTotal > 0 && (
        <Card className="border-destructive/30 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h2 className="font-semibold text-destructive">Needs attention</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  There is no refund path in the app, so these can only be put right by hand.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  {
                    label: 'Paid, not delivered',
                    value: exceptions.totals.paidNotDelivered,
                    hint: 'Money taken, nothing given',
                  },
                  {
                    label: 'Abandoned checkouts',
                    value: exceptions.totals.abandonedCheckouts,
                    hint: `Started over ${exceptions.staleAfterHours}h ago`,
                  },
                  {
                    label: 'Subscriptions stuck pending',
                    value: exceptions.totals.pendingSubscriptions,
                    hint: 'Never completed',
                  },
                ].map((x) => (
                  <div key={x.label} className="rounded-md border border-border p-3">
                    <p className={cn('text-xl font-semibold tabular-nums', x.value > 0 && 'text-destructive')}>
                      {x.value}
                    </p>
                    <p className="text-xs font-medium">{x.label}</p>
                    <p className="text-xs text-muted-foreground">{x.hint}</p>
                  </div>
                ))}
              </div>

              {exceptions.pendingSubscriptions.length > 0 && (
                <div className="space-y-1.5">
                  {exceptions.pendingSubscriptions.slice(0, 5).map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="font-medium">{e.user?.name || 'Unknown user'}</span>
                        {' · '}
                        <span className="text-muted-foreground">{e.planType?.replace(/_/g, ' ').toLowerCase()}</span>
                      </span>
                      <span className="flex items-center gap-3">
                        <code className="text-xs text-muted-foreground">{e.razorpayOrderId}</code>
                        <span className="tabular-nums font-medium">{money(e.amount, e.currency)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Daily collections */}
      {summary && summary.daily.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold">Collected per day</h2>
          <p className="text-sm text-muted-foreground mt-0.5 mb-4">
            Successful payments only.
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.daily} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  }
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(v) => money(v)}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                <Bar dataKey="collected" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Breakdowns */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { title: 'Where it came from', data: summary.bySource, icon: Wallet },
            { title: 'By plan', data: summary.byPlan, icon: IndianRupee },
          ].map((block) => {
            const rows = Object.entries(block.data).filter(([k]) => k !== 'unknown' || block.title !== 'By plan');
            return (
              <Card key={block.title} className="p-5">
                <h2 className="font-semibold mb-3">{block.title}</h2>
                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing yet.</p>
                ) : (
                  <div className="space-y-2">
                    {rows.map(([key, v]) => (
                      <div key={key} className="flex items-center justify-between gap-3 text-sm">
                        <span className="capitalize">{key.replace(/_/g, ' ').toLowerCase()}</span>
                        <span className="flex items-center gap-3">
                          <span className="text-muted-foreground tabular-nums">
                            {v.paidCount}/{v.count}
                          </span>
                          <span className="font-medium tabular-nums">
                            {money(v.collected, summary.currency)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Ledger — also the table view for the chart above */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">All payments</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="w-auto"
              aria-label="From date"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="w-auto"
              aria-label="To date"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {['all', 'paid', 'started', 'failed', 'cancelled', 'expired'].map((s) => (
            <Button
              key={s}
              variant={status === s ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className="capitalize"
            >
              {s}
            </Button>
          ))}
        </div>

        {entries.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No payments in this range"
            description="Try widening the dates or clearing the status filter."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Date</th>
                    <th className="pb-2 pr-3 font-medium">User</th>
                    <th className="pb-2 pr-3 font-medium">For</th>
                    <th className="pb-2 pr-3 font-medium">Reference</th>
                    <th className="pb-2 pr-3 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 pr-3 whitespace-nowrap text-muted-foreground">
                        {new Date(e.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 pr-3">{e.user?.name || '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span className="capitalize">{e.purpose}</span>
                        {e.planType && (
                          <span className="text-muted-foreground">
                            {' '}
                            · {e.planType.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <code className="text-xs text-muted-foreground">
                          {e.razorpayPaymentId || e.razorpayOrderId || '—'}
                        </code>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge variant="outline" className={cn('text-xs', STATUS_STYLE[e.status])}>
                          {e.status}
                        </Badge>
                        {e.status === 'paid' && !e.fulfilled && (
                          <Badge variant="outline" className="ml-1 text-xs border-destructive/30 text-destructive">
                            not delivered
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-medium tabular-nums whitespace-nowrap">
                        {money(e.amount, e.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
