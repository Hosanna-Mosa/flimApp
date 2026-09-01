import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  Clock,
  EyeOff,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { reportApi } from '@/services/api';
import { Report, ReportResolution } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';

const formatAge = (hours: number | null) => {
  if (hours === null) return '—';
  if (hours < 1) return 'under an hour';
  if (hours < 48) return `${hours} hours`;
  return `${Math.floor(hours / 24)} days`;
};

/**
 * The four ways a report can be closed. `no_action` matters as much as the
 * others: a report that has been read and judged fine still has to leave the
 * queue, or the queue stops meaning "needs a human".
 */
const ACTIONS: {
  value: Exclude<ReportResolution, 'escalated'>;
  label: string;
  description: string;
  icon: typeof EyeOff;
  destructive?: boolean;
  hideForUserReports?: boolean;
}[] = [
  {
    value: 'content_removed',
    label: 'Remove content',
    description: 'Hides it from the app and tells the author why.',
    icon: EyeOff,
    hideForUserReports: true,
  },
  {
    value: 'user_warned',
    label: 'Warn the user',
    description: 'Sends a warning notification. Content stays up.',
    icon: TriangleAlert,
  },
  {
    value: 'user_suspended',
    label: 'Suspend the account',
    description: 'Blocks sign-in for a set number of days.',
    icon: Ban,
    destructive: true,
  },
  {
    value: 'no_action',
    label: 'No action needed',
    description: 'Closes the report without penalising anyone.',
    icon: Check,
  },
];

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selected, setSelected] = useState<Exclude<ReportResolution, 'escalated'> | null>(null);
  const [notes, setNotes] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [isSaving, setIsSaving] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      setReport(await reportApi.getReportById(id));
    } catch {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAcknowledge = async () => {
    if (!id) return;
    try {
      await reportApi.acknowledge(id);
      toast.success('Marked as under review');
      load();
    } catch {
      /* the interceptor already surfaced the reason */
    }
  };

  const handleResolve = async () => {
    if (!id || !selected) return;
    setIsSaving(true);
    try {
      const result = await reportApi.resolve(
        id,
        selected,
        notes.trim() || undefined,
        selected === 'user_suspended' ? parseInt(suspensionDays, 10) || undefined : undefined
      );
      toast.success(
        result.duplicatesClosed
          ? `${result.outcome}. Also closed ${result.duplicatesClosed} duplicate report${
              result.duplicatesClosed === 1 ? '' : 's'
            }.`
          : result.outcome
      );
      navigate('/reports');
    } catch {
      /* the interceptor already surfaced the reason */
    } finally {
      setIsSaving(false);
    }
  };

  const handleEscalate = async () => {
    if (!id) return;
    setIsSaving(true);
    try {
      await reportApi.escalate(id, notes.trim() || undefined);
      toast.success('Escalated to a super admin');
      navigate('/reports');
    } catch {
      /* the interceptor already surfaced the reason */
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading report…" />;

  if (notFound || !report) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Report not found"
        description="It may have been removed. Go back to the queue."
      />
    );
  }

  const owner = report.target?.owner;
  const isResolved = report.status === 'resolved';
  const isUserReport = report.type === 'user';
  const targetGone = report.target?.missing;

  const availableActions = ACTIONS.filter((a) => !(isUserReport && a.hideForUserReports));

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/reports')} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to queue
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight capitalize">
            Reported {report.type}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Reason given: <span className="font-medium">{report.reason}</span>
          </p>
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium',
            report.sla.state === 'overdue'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : report.sla.state === 'due_soon'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
              : 'border-border bg-muted text-muted-foreground'
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {isResolved ? 'Resolved' : `Open ${formatAge(report.sla.hoursOpen)}`}
        </div>
      </div>

      {report.sla.state === 'overdue' && !isResolved && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <p className="text-muted-foreground">
            This report has been open for {formatAge(report.sla.hoursOpen)}, past the 24-hour target
            set by App Store policy for reported content.
          </p>
        </div>
      )}

      {/* Reported content */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">The reported content</h2>
          {targetGone ? (
            <Badge variant="outline">Already deleted</Badge>
          ) : report.target?.isActive === false ? (
            <Badge variant="outline">Already hidden</Badge>
          ) : null}
        </div>

        {targetGone ? (
          <p className="text-sm text-muted-foreground">
            This content no longer exists. Closing the report will record no action.
          </p>
        ) : (
          <>
            {owner && (
              <div className="flex items-center gap-2.5">
                <UserAvatar user={{ name: owner.name, avatar: owner.avatar || "" }} size="sm" />
                <div className="text-sm">
                  <p className="font-medium">{owner.name}</p>
                  {owner.username && (
                    <p className="text-xs text-muted-foreground">@{owner.username}</p>
                  )}
                </div>
                {owner.status && owner.status !== 'active' && (
                  <Badge variant="destructive" className="ml-1 text-xs">{owner.status}</Badge>
                )}
              </div>
            )}

            <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
              {report.target?.preview}
            </p>

            {report.target?.mediaUrl && (
              <a
                href={report.target.mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-primary underline underline-offset-4"
              >
                Open attached media
              </a>
            )}
          </>
        )}
      </Card>

      {/* Who reported it */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Who reported it</h2>
        {report.reporterId ? (
          <div className="flex items-center gap-2.5">
            <UserAvatar user={{ name: report.reporterId.name, avatar: report.reporterId.avatar || "" }} size="sm" />
            <div className="text-sm">
              <p className="font-medium">{report.reporterId.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(report.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">The reporting account has been deleted.</p>
        )}

        {report.otherReports && report.otherReports.length > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
            <p className="font-medium text-amber-600">
              {report.otherReports.length} other {report.otherReports.length === 1 ? 'person' : 'people'} reported this
            </p>
            <p className="text-muted-foreground mt-0.5">
              Acting here also closes those reports.
            </p>
          </div>
        )}
      </Card>

      {/* Decision */}
      {isResolved ? (
        <Card className="p-5 space-y-2">
          <h2 className="font-semibold">Decision</h2>
          <p className="text-sm">
            <span className="font-medium capitalize">
              {report.resolution?.replace(/_/g, ' ')}
            </span>{' '}
            by {report.reviewedByName || 'an admin'}
            {report.reviewedAt && ` on ${new Date(report.reviewedAt).toLocaleString()}`}
          </p>
          {report.adminNotes && (
            <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              {report.adminNotes}
            </p>
          )}
        </Card>
      ) : (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">What do you want to do?</h2>
            {report.status === 'pending' && (
              <Button variant="outline" size="sm" onClick={handleAcknowledge}>
                Mark under review
              </Button>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {availableActions.map((action) => {
              const Icon = action.icon;
              const isSelected = selected === action.value;
              const disabled = targetGone && action.value !== 'no_action';
              return (
                <button
                  key={action.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(action.value)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? action.destructive
                        ? 'border-destructive bg-destructive/5'
                        : 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/40',
                    disabled && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 mt-0.5 shrink-0',
                      isSelected && action.destructive ? 'text-destructive' : 'text-muted-foreground'
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {selected === 'user_suspended' && (
            <div className="space-y-1.5">
              <label htmlFor="days" className="text-sm font-medium">
                Suspend for how many days?
              </label>
              <Input
                id="days"
                type="number"
                min={1}
                value={suspensionDays}
                onChange={(e) => setSuspensionDays(e.target.value)}
                className="max-w-32"
              />
              <p className="text-xs text-muted-foreground">Leave blank to suspend indefinitely.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-sm font-medium">
              Internal notes
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why you decided this. Only other admins see it."
              rows={3}
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleResolve} disabled={!selected || isSaving}>
              {isSaving ? 'Saving…' : 'Apply and close report'}
            </Button>
            <Button variant="outline" onClick={handleEscalate} disabled={isSaving}>
              <ShieldAlert className="h-4 w-4 mr-1.5" />
              Escalate to super admin
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
