import { VerificationStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: 'Pending',
    className: 'bg-accent text-accent-foreground',
  },
  APPROVED: {
    label: 'Approved',
    className: 'bg-primary/10 text-primary',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-destructive/10 text-destructive',
  },
  ACTIVE: {
    label: 'Active',
    className: 'bg-primary/10 text-primary',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-destructive/10 text-destructive',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toUpperCase()] || { label: status, className: 'bg-muted text-muted-foreground' };
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
