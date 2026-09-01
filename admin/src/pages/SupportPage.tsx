import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, Inbox, LifeBuoy, Paperclip, Search } from 'lucide-react';
import { supportApi } from '@/services/api';
import { SupportStats, SupportTicket } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { Pagination } from '@/components/Pagination';
import { UserAvatar } from '@/components/UserAvatar';
import { cn } from '@/lib/utils';

const formatAge = (hours: number | null) => {
  if (hours === null) return '—';
  if (hours < 1) return 'under an hour';
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const SLA_STYLES: Record<string, string> = {
  overdue: 'bg-destructive/10 text-destructive border-destructive/30',
  needs_reply: 'bg-destructive/10 text-destructive border-destructive/30',
  due_soon: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  ok: 'bg-muted text-muted-foreground border-border',
  done: 'bg-muted text-muted-foreground border-border',
};

export default function SupportPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [stats, setStats] = useState<SupportStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<'pending' | 'resolved' | 'rejected' | 'all'>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce so a query isn't fired on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [list, s] = await Promise.all([
          supportApi.getTickets(page, 20, { status, search }),
          supportApi.getStats(),
        ]);
        if (cancelled) return;
        setTickets(list.data);
        setTotalPages(list.totalPages || 1);
        setStats(s);
      } catch {
        if (!cancelled) setError('Could not load the support desk. Check your connection and try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [page, status, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Help requests raised from the app. Oldest first.
        </p>
      </div>

      {stats && stats.awaitingReply > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-destructive">
              {stats.awaitingReply} ticket{stats.awaitingReply === 1 ? '' : 's'} waiting more than{' '}
              {stats.firstReplyHours} hours with no reply
            </p>
            <p className="text-muted-foreground mt-0.5">
              The oldest has been open {formatAge(stats.oldestOpenAgeHours)}. A support request can
              also be a grievance, which is expected to be acknowledged within {stats.firstReplyHours}{' '}
              hours and resolved within {stats.resolutionDays} days.
            </p>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Open', value: stats.pending },
            { label: 'No reply yet', value: stats.awaitingReply, alert: stats.awaitingReply > 0 },
            { label: 'Oldest open', value: formatAge(stats.oldestOpenAgeHours) },
            { label: 'Resolved', value: stats.resolved },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-semibold mt-1', s.alert && 'text-destructive')}>
                {s.value}
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(['pending', 'resolved', 'rejected', 'all'] as const).map((s) => (
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
            {s === 'pending' ? 'Open' : s}
          </Button>
        ))}

        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search name, email, or message"
            className="pl-8"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading tickets…" />
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Couldn't load the desk" description={error} />
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={status === 'pending' ? Inbox : LifeBuoy}
          title={status === 'pending' ? 'No open tickets' : 'Nothing matches this filter'}
          description={
            status === 'pending'
              ? 'Every support request has been dealt with.'
              : 'Try a different status or search term.'
          }
        />
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Card
              key={ticket._id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/support/${ticket._id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/support/${ticket._id}`);
                }
              }}
              className="p-4 cursor-pointer transition-colors hover:bg-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start gap-4">
                {ticket.userId ? (
                  <UserAvatar
                    user={{ name: ticket.userId.name, avatar: ticket.userId.avatar || '' }}
                    size="sm"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {ticket.userId?.name || 'Deleted account'}
                    </span>
                    {ticket.replies?.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {ticket.replies.length}{' '}
                        {ticket.replies.length === 1 ? 'reply' : 'replies'}
                      </Badge>
                    )}
                    {ticket.hasAttachment && (
                      <Badge variant="outline" className="text-xs gap-1">
                        <Paperclip className="h-3 w-3" />
                        image
                      </Badge>
                    )}
                    {ticket.status !== 'pending' && (
                      <Badge variant="outline" className="text-xs capitalize">
                        {ticket.status}
                      </Badge>
                    )}
                  </div>

                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.reason}</p>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>

                <div
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
                    SLA_STYLES[ticket.sla.state]
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {ticket.status !== 'pending' ? ticket.status : formatAge(ticket.sla.hoursOpen)}
                </div>
              </div>
            </Card>
          ))}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
