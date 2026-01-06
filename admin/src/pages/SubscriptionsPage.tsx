import { useState, useEffect } from 'react';
import { verificationApi } from '@/services/api';
import { Subscription } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { Pagination } from '@/components/Pagination';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { CreditCard, RefreshCw, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [nameFilter, setNameFilter] = useState('');

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await verificationApi.getSubscriptions(currentPage, 10, {
        status: statusFilter,
        name: nameFilter,
      });

      setSubscriptions(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subscription record?')) return;
    try {
      await verificationApi.deleteSubscription(id);
      toast.success('Subscription deleted');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to delete subscription');
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubscriptions();
    }, 500);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Subscription Users</h1>
            <p className="text-muted-foreground mt-1">
              Track paid verification users and their validity
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchSubscriptions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-card p-4 rounded-lg border border-border">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="PENDING">Pending Payment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">User Name</Label>
            <Input 
              placeholder="Search user..." 
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading subscriptions..." />
        ) : subscriptions.length === 0 ? (
          <EmptyState 
            title="No subscriptions found"
            description="There are no subscription records matching your filter."
            icon={CreditCard}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={sub.user} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">
                              {sub.user?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {sub.user?.email || 'No email'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {sub.planType.replace('_', ' ')}
                      </TableCell>
                      <TableCell>₹{sub.amount}</TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell>
                        {sub.startDate && sub.endDate ? (
                          <div className="flex flex-col text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">From:</span>
                              <span className="font-medium">{format(new Date(sub.startDate), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">Until:</span>
                              <span className={cn(
                                "font-bold",
                                new Date(sub.endDate) < new Date() ? "text-destructive" : "text-primary"
                              )}>
                                {format(new Date(sub.endDate), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Not started</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {format(new Date(sub.createdAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(sub.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="border-t border-border p-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
