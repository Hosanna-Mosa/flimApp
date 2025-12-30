import { VerificationStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusConfig: Record<VerificationStatus, { label: string; className: string }> = {
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
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
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
