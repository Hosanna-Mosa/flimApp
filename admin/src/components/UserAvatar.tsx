import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '@/types';

interface UserAvatarProps {
  user: Pick<User, 'name' | 'avatar'>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

export function UserAvatar({ user, size = 'md', className }: UserAvatarProps) {
  const initials = user.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={user.avatar || undefined} alt={user.name} />
      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
