import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, FileWarning, Inbox, MessageSquare, User as UserIcon } from 'lucide-react';
import { reportApi } from '@/services/api';
import { Report, ReportStats, ReportType } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { Pagination } from '@/components/Pagination';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<ReportType, typeof UserIcon> = {
  post: FileWarning,
  comment: MessageSquare,
  user: UserIcon,
};

/** Whole hours read badly past a day, so anything older is shown in days. */
const formatAge = (hours: number | null) => {
  if (hours === null) return '—';
  if (hours < 1) return 'under an hour';
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const SLA_STYLES: Record<string, string> = {
  overdue: 'bg-destructive/10 text-destructive border-destructive/30',
  due_soon: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  ok: 'bg-muted text-muted-foreground border-border',
  done: 'bg-muted text-muted-foreground border-border',
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'open' | 'resolved' | 'all'>('open');
  const [type, setType] = useState<'all' | ReportType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [list, s] = await Promise.all([
          reportApi.getReports(page, 20, { status, type }),
          reportApi.getStats(),
        ]);
        if (cancelled) return;
        setReports(list.data);
        setTotalPages(list.totalPages || 1);
        setStats(s);
      } catch {
        if (!cancelled) setError('Could not load the report queue. Check your connection and try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, status, type]);

  const overdueBanner = useMemo(() => {
    if (!stats || stats.overdue === 0) return null;
    return (
      <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-destructive">
            {stats.overdue} report{stats.overdue === 1 ? '' : 's'} past the {stats.slaHours}-hour target
          </p>
          <p className="text-muted-foreground mt-0.5">
            The oldest has been open {formatAge(stats.oldestOpenAgeHours)}. App Store policy expects
            reported content to be actioned within {stats.slaHours} hours.
          </p>
        </div>
      </div>
    );
  }, [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Content and accounts reported by users. Oldest first — the oldest is the closest to breaching.
        </p>
      </div>

      {overdueBanner}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Open', value: stats.open },
            { label: 'Overdue', value: stats.overdue, alert: stats.overdue > 0 },
            { label: 'Oldest open', value: formatAge(stats.oldestOpenAgeHours) },
            { label: 'Resolved', value: stats.resolved },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-semibold mt-1', s.alert && 'text-destructive')}>{s.value}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {(['open', 'resolved', 'all'] as const).map((s) => (
          <Button
            key={s}
            variant={status === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s === 'open' ? 'Open' : s === 'resolved' ? 'Resolved' : 'All'}
          </Button>
        ))}
        <div className="w-px bg-border mx-1" />
        {(['all', 'post', 'comment', 'user'] as const).map((t) => (
          <Button
            key={t}
            variant={type === t ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => {
              setType(t);
              setPage(1);
            }}
          >
            {t === 'all' ? 'All types' : t}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <LoadingState message="Loading reports…" />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Couldn't load the queue"
          description={error}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={status === 'open' ? 'The queue is clear' : 'No reports match this filter'}
          description={
            status === 'open'
              ? 'Nothing is waiting for review right now.'
              : 'Try a different status or type.'
          }
        />
      ) : (
        <div className="space-y-2">
          {reports.map((report) => {
            const Icon = TYPE_ICON[report.type];
            const owner = report.target?.owner;
            return (
              <Card
                key={report._id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/reports/${report._id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/reports/${report._id}`);
                  }
                }}
                className="p-4 cursor-pointer transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-md bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium capitalize">{report.type}</span>
                      <Badge variant="outline" className="text-xs">{report.reason}</Badge>
                      {report.otherReportsOnTarget ? (
                        <Badge variant="secondary" className="text-xs">
                          +{report.otherReportsOnTarget} more on this
                        </Badge>
                      ) : null}
                      {report.target?.missing && (
                        <Badge variant="outline" className="text-xs">content deleted</Badge>
                      )}
                      {report.target?.isActive === false && !report.target?.missing && (
                        <Badge variant="outline" className="text-xs">already hidden</Badge>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {report.target?.preview || 'Reported content is no longer available.'}
                    </p>

                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {owner ? <>By <span className="font-medium">{owner.name}</span> · </> : null}
                      reported by {report.reporterId?.name || 'a deleted account'}
                    </p>
                  </div>

                  <div
                    className={cn(
                      'flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
                      SLA_STYLES[report.sla.state]
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {report.status === 'resolved' ? 'resolved' : formatAge(report.sla.hoursOpen)}
                  </div>
                </div>
              </Card>
            );
          })}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
