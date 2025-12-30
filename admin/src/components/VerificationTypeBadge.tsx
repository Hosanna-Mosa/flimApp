import { VerificationType } from '@/types';
import { cn } from '@/lib/utils';
import { 
  Star, 
  Briefcase, 
  Mic2, 
  Newspaper, 
  Users 
} from 'lucide-react';

interface VerificationTypeBadgeProps {
  type: VerificationType;
  className?: string;
}

const typeConfig: Record<VerificationType, { 
  label: string; 
  icon: React.ElementType;
  className: string;
}> = {
  CREATOR: {
    label: 'Creator',
    icon: Star,
    className: 'bg-chart-1/10 text-chart-1',
  },
  CELEBRITY: {
    label: 'Celebrity',
    icon: Star,
    className: 'bg-chart-2/10 text-chart-2',
  },
  BRAND: {
    label: 'Brand',
    icon: Briefcase,
    className: 'bg-chart-3/10 text-chart-3',
  },
  PUBLIC_FIGURE: {
    label: 'Public Figure',
    icon: Users,
    className: 'bg-chart-4/10 text-chart-4',
  },
  JOURNALIST: {
    label: 'Journalist',
    icon: Newspaper,
    className: 'bg-chart-5/10 text-chart-5',
  },
};

export function VerificationTypeBadge({ type, className }: VerificationTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
