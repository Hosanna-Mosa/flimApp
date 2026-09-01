import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, Clock, Mail, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { supportApi } from '@/services/api';
import { ReplyChannel, SupportTicket } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
 * Openers for the replies that come up constantly. They are starting points
 * the admin edits before sending, not canned messages sent as-is — a support
 * reply that reads like a form letter is worse than a short human one.
 */
const QUICK_REPLIES = [
  {
    label: 'Asking for detail',
    body: "Thanks for getting in touch. So I can help, could you tell me a bit more — what were you doing when this happened, and what did you see?",
  },
  {
    label: 'Looking into it',
    body: "Thanks for reporting this. We've reproduced the problem and are working on a fix. I'll come back to you as soon as it's sorted.",
  },
  {
    label: 'Fixed',
    body: "This should be working now. Please close and reopen the app, then try again. Let me know if you still hit trouble.",
  },
  {
    label: 'Payment being checked',
    body: "Thanks for flagging this. We're checking the payment against our records and will come back to you shortly with what we find.",
  },
];

export default function SupportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState('');
  const [channel, setChannel] = useState<ReplyChannel>('both');
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const load = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      setTicket(await supportApi.getTicketById(id));
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

  const handleReply = async () => {
    if (!id || !reply.trim()) return;
    setIsSending(true);
    try {
      const result = await supportApi.reply(id, reply.trim(), channel);
      if (result.emailDelivered === false) {
        toast.warning('Reply sent in the app, but the email did not go through.');
      } else {
        toast.success('Reply sent');
      }
      setReply('');
      load();
    } catch {
      /* the interceptor already surfaced the reason */
    } finally {
      setIsSending(false);
    }
  };

  const handleStatus = async (status: 'resolved' | 'rejected' | 'pending') => {
    if (!id) return;
    setIsClosing(true);
    try {
      await supportApi.setStatus(id, status);
      toast.success(
        status === 'pending' ? 'Ticket reopened' : `Ticket marked ${status}`
      );
      if (status === 'pending') load();
      else navigate('/support');
    } catch {
      /* the interceptor already surfaced the reason */
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) return <LoadingState message="Loading ticket…" />;

  if (notFound || !ticket) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Ticket not found"
        description="It may have been removed. Go back to the desk."
      />
    );
  }

  const user = ticket.userId;
  const isOpen = ticket.status === 'pending';

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" onClick={() => navigate('/support')} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to desk
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Support request</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Raised {new Date(ticket.createdAt).toLocaleString()}
          </p>
        </div>

        <div
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm font-medium',
            ticket.sla.state === 'overdue' || ticket.sla.state === 'needs_reply'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : ticket.sla.state === 'due_soon'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-600'
              : 'border-border bg-muted text-muted-foreground'
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {isOpen ? `Open ${formatAge(ticket.sla.hoursOpen)}` : ticket.status}
        </div>
      </div>

      {/* Who asked */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Who asked</h2>
        {user ? (
          <div className="flex items-center gap-3">
            <UserAvatar user={{ name: user.name, avatar: user.avatar || '' }} size="md" />
            <div className="text-sm">
              <p className="font-medium">{user.name}</p>
              {user.email && <p className="text-muted-foreground">{user.email}</p>}
            </div>
            {user.status && user.status !== 'active' && (
              <Badge variant="destructive" className="text-xs capitalize">{user.status}</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              className="ml-auto"
              onClick={() => navigate(`/users/${user._id}`)}
            >
              Open profile
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            The account that raised this ticket has been deleted, so no reply can be sent.
          </p>
        )}
      </Card>

      {/* What they said */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">What they said</h2>
        <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{ticket.reason}</p>

        {ticket.imageUrl && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Attachment
            </p>
            <img
              src={ticket.imageUrl}
              alt="Attachment from the user"
              className="max-h-80 rounded-md border border-border object-contain"
            />
          </div>
        )}
      </Card>

      {/* Conversation */}
      {ticket.replies?.length > 0 && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Replies sent</h2>
          <div className="space-y-3">
            {ticket.replies.map((r) => (
              <div key={r._id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{r.adminName}</span>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                  <Badge variant="outline" className="text-xs">
                    {r.channel === 'both' ? 'app + email' : r.channel}
                  </Badge>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{r.body}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Reply box */}
      {user && (
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold">Reply</h2>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map((q) => (
              <Button
                key={q.label}
                variant="outline"
                size="sm"
                onClick={() => setReply(q.body)}
                className="text-xs"
              >
                {q.label}
              </Button>
            ))}
          </div>

          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply. The user sees this exactly as typed."
            rows={5}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Send via</span>
            {(
              [
                { value: 'both', label: 'App + email' },
                { value: 'notification', label: 'App only' },
                { value: 'email', label: 'Email only' },
              ] as const
            ).map((c) => (
              <Button
                key={c.value}
                variant={channel === c.value ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setChannel(c.value)}
                disabled={c.value !== 'notification' && !user.email}
              >
                {c.value !== 'notification' && <Mail className="h-3.5 w-3.5 mr-1.5" />}
                {c.label}
              </Button>
            ))}
          </div>

          <Button onClick={handleReply} disabled={!reply.trim() || isSending}>
            <Send className="h-4 w-4 mr-1.5" />
            {isSending ? 'Sending…' : 'Send reply'}
          </Button>
        </Card>
      )}

      {/* Close */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold">Close this ticket</h2>
        {isOpen ? (
          <>
            <p className="text-sm text-muted-foreground">
              Resolved means the user's problem was dealt with. Rejected means there was nothing to
              act on — spam, a duplicate, or a request outside what support covers.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleStatus('resolved')} disabled={isClosing}>
                <Check className="h-4 w-4 mr-1.5" />
                Mark resolved
              </Button>
              <Button variant="outline" onClick={() => handleStatus('rejected')} disabled={isClosing}>
                <X className="h-4 w-4 mr-1.5" />
                Reject
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm">
              Marked <span className="font-medium capitalize">{ticket.status}</span>
              {ticket.resolvedByName && ` by ${ticket.resolvedByName}`}
              {ticket.resolvedAt && ` on ${new Date(ticket.resolvedAt).toLocaleString()}`}
            </p>
            <Button variant="outline" onClick={() => handleStatus('pending')} disabled={isClosing}>
              Reopen ticket
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
