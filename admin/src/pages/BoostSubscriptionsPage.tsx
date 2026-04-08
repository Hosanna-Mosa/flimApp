import { useState, useEffect } from 'react';
import { statsApi } from '@/services/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { cn } from '@/lib/utils';

export default function BoostSubscriptionsPage() {
  const [boostedUsers, setBoostedUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBoostStats = async () => {
    setIsLoading(true);
    try {
      const response = await statsApi.getBoostStats();
      setBoostedUsers(response.users);
      setTotalCount(response.count);
    } catch (error) {
      toast.error('Failed to load boost statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoostStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Boost Profile Subscriptions</h1>
            <p className="text-muted-foreground mt-1">
              Currently {totalCount} profiles are boosted on the platform
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchBoostStats}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Boosts</p>
              <h3 className="text-3xl font-bold text-foreground">{totalCount}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        {isLoading ? (
          <LoadingState message="Fetching boosted profiles..." />
        ) : boostedUsers.length === 0 ? (
          <EmptyState 
            title="No active boosts"
            description="Currently no users have an active profile boost subscription."
            icon={Zap}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[300px]">User</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Boost Status</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead className="text-right">Expires At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boostedUsers.map((user) => {
                  const expiryDate = new Date(user.boostedUntil);
                  const isExpired = expiryDate < new Date();
                  
                  return (
                    <TableRow key={user._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={user} size="sm" />
                          <div>
                            <p className="font-semibold text-foreground">
                              {user.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {user._id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="text-foreground">{user.email}</span>
                          <span className="text-muted-foreground">{user.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                          isExpired ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                        )}>
                          <Zap className="mr-1 h-3 w-3" />
                          {isExpired ? 'Expired' : 'Active'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!isExpired ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{formatDistanceToNow(expiryDate)} left</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm font-medium">
                          {format(expiryDate, 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(expiryDate, 'HH:mm')}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
