import { useEffect, useState } from 'react';
import { AlertTriangle, Bug, Check, ChevronDown, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { errorLogApi } from '@/services/api';
import { ErrorLogEntry, ErrorStats } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { Pagination } from '@/components/Pagination';
import { cn } from '@/lib/utils';

const timeAgo = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [expanded, setExpanded] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'open' | 'resolved' | 'all'>('open');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, s] = await Promise.all([
        errorLogApi.getErrors(page, 25, { status, search }),
        errorLogApi.getStats(),
      ]);
      setErrors(list.data);
      setTotalPages(list.totalPages || 1);
      setStats(s);
    } catch {
      setError('Could not load errors. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, search]);

  /** The stack is fetched only when someone opens a row. */
  const toggleStack = async (entry: ErrorLogEntry) => {
    if (expanded[entry._id]) {
      setExpanded((prev) => {
        const next = { ...prev };
        delete next[entry._id];
        return next;
      });
      return;
    }
    try {
      const full = await errorLogApi.getErrorById(entry._id);
      setExpanded((prev) => ({ ...prev, [entry._id]: full.stack || 'No stack trace recorded.' }));
    } catch {
      /* the interceptor already surfaced the reason */
    }
  };

  const toggleResolved = async (entry: ErrorLogEntry) => {
    try {
      await errorLogApi.setResolved(entry._id, !entry.resolved);
      toast.success(entry.resolved ? 'Reopened' : 'Marked fixed');
      load();
    } catch {
      /* the interceptor already surfaced the reason */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Errors</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Things that broke on the server. Identical faults are grouped, so one row can stand for
          many occurrences.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Open', value: stats.open, alert: stats.open > 0 },
            { label: 'Seen in 24 hours', value: stats.last24h, alert: stats.last24h > 0 },
            { label: 'Total occurrences', value: stats.totalOccurrences },
            { label: 'Marked fixed', value: stats.resolved },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className={cn('mt-1 text-2xl font-semibold tabular-nums', s.alert && 'text-destructive')}>
                {s.value}
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['open', 'resolved', 'all'] as const).map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className="capitalize"
          >
            {s === 'resolved' ? 'Fixed' : s}
          </Button>
        ))}

        <div className="relative ml-auto w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search message, type, or route"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading && errors.length === 0 ? (
        <LoadingState message="Loading errors…" />
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load errors" description={error} />
      ) : errors.length === 0 ? (
        <EmptyState
          icon={status === 'open' ? ShieldCheck : Bug}
          title={status === 'open' ? 'Nothing is broken' : 'Nothing matches this filter'}
          description={
            status === 'open'
              ? 'No unresolved server errors. New faults appear here automatically.'
              : 'Try a different filter or search term.'
          }
        />
      ) : (
        <div className="space-y-2">
          {errors.map((entry) => (
            <Card key={entry._id} className={cn('p-4', entry.resolved && 'opacity-60')}>
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'rounded-md p-2',
                    entry.resolved ? 'bg-muted' : 'bg-destructive/10'
                  )}
                >
                  <Bug
                    className={cn(
                      'h-4 w-4',
                      entry.resolved ? 'text-muted-foreground' : 'text-destructive'
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{entry.name}</span>
                    {entry.count > 1 && (
                      <Badge variant="secondary" className="text-xs tabular-nums">
                        ×{entry.count}
                      </Badge>
                    )}
                    {entry.statusCode && (
                      <Badge variant="outline" className="text-xs">{entry.statusCode}</Badge>
                    )}
                    {entry.resolved && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Check className="h-3 w-3" /> fixed
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 break-words text-sm text-muted-foreground">{entry.message}</p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {entry.path && (
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        {entry.method} {entry.path}
                      </code>
                    )}
                    <span>last {timeAgo(entry.lastSeenAt)}</span>
                    {entry.count > 1 && <span>first {timeAgo(entry.firstSeenAt)}</span>}
                    {entry.lastUserId && <span>last hit by {entry.lastUserId.name}</span>}
                  </div>

                  {expanded[entry._id] && (
                    <pre className="mt-3 max-h-72 overflow-auto rounded-md bg-muted/60 p-3 text-xs leading-relaxed">
                      {expanded[entry._id]}
                    </pre>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1.5">
                  <Button variant="ghost" size="sm" onClick={() => toggleStack(entry)}>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 mr-1 transition-transform',
                        expanded[entry._id] && 'rotate-180'
                      )}
                    />
                    Stack
                  </Button>
                  <Button
                    variant={entry.resolved ? 'ghost' : 'outline'}
                    size="sm"
                    onClick={() => toggleResolved(entry)}
                  >
                    {entry.resolved ? (
                      <>
                        <RotateCcw className="h-4 w-4 mr-1" /> Reopen
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" /> Fixed
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {stats && (
        <p className="text-xs text-muted-foreground">
          Errors are kept for {stats.retentionDays} days after they were last seen, then removed
          automatically. Marking one fixed is not permanent — if it happens again it reopens itself.
        </p>
      )}
    </div>
  );
}
