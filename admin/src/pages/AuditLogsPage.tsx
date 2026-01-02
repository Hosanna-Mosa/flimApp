import { useState, useEffect } from 'react';
import { verificationApi } from '@/services/api';
import { VerificationLog, VerificationAction } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { Pagination } from '@/components/Pagination';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { RefreshCw, History, CheckCircle2, XCircle, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

const actionConfig: Record<VerificationAction, { 
  label: string; 
  icon: React.ElementType;
  className: string;
}> = {
  APPROVE: {
    label: 'Approved',
    icon: CheckCircle2,
    className: 'text-primary',
  },
  REJECT: {
    label: 'Rejected',
    icon: XCircle,
    className: 'text-destructive',
  },
  REVOKE: {
    label: 'Revoked',
    icon: Ban,
    className: 'text-chart-5',
  },
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userNameFilter, setUserNameFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await verificationApi.getLogs(currentPage, 20, {
        userName: userNameFilter,
        action: actionFilter !== 'ALL' ? actionFilter : undefined
      });
      setLogs(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter]);

  // Debounced effect for name input
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(timer);
  }, [userNameFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
            <p className="text-muted-foreground mt-1">
              History of all verification actions
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border border-border">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">User Name</Label>
            <Input 
              placeholder="Filter by user name..." 
              value={userNameFilter}
              onChange={(e) => setUserNameFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-[200px] space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">Action</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="APPROVE">Approved</SelectItem>
                <SelectItem value="REJECT">Rejected</SelectItem>
                <SelectItem value="REVOKE">Revoked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading audit logs..." />
        ) : logs.length === 0 ? (
          <EmptyState 
            title="No logs found"
            description="There are no verification audit logs yet."
            icon={History}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const config = actionConfig[log.action];
                    const Icon = config.icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar 
                              user={{ name: log.userName, avatar: log.userAvatar }} 
                              size="sm" 
                            />
                            <span className="font-medium text-foreground">
                              {log.userName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("flex items-center gap-2", config.className)}>
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{config.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.adminName}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground max-w-xs truncate block">
                            {log.notes || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
