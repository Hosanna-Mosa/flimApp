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

// Mock data for demo
const mockLogs: VerificationLog[] = [
  {
    id: 'l1',
    userId: 'u3',
    userName: 'Michael Chen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    action: 'APPROVE',
    adminId: 'admin1',
    adminName: 'Admin User',
    notes: 'Verified press credentials.',
    timestamp: '2024-12-21T15:30:00Z',
  },
  {
    id: 'l2',
    userId: 'u4',
    userName: 'Alex Rivera',
    userAvatar: null,
    action: 'REJECT',
    adminId: 'admin1',
    adminName: 'Admin User',
    notes: 'Insufficient documentation provided.',
    timestamp: '2024-12-23T10:00:00Z',
  },
  {
    id: 'l3',
    userId: 'u5',
    userName: 'Emma Wilson',
    userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    action: 'APPROVE',
    adminId: 'admin2',
    adminName: 'Senior Admin',
    notes: 'Verified celebrity status.',
    timestamp: '2024-12-22T09:15:00Z',
  },
  {
    id: 'l4',
    userId: 'u6',
    userName: 'James Brown',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    action: 'REVOKE',
    adminId: 'admin1',
    adminName: 'Admin User',
    notes: 'Violation of community guidelines.',
    timestamp: '2024-12-20T16:45:00Z',
  },
];

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

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      // In production, use the API
      // const response = await verificationApi.getLogs(currentPage, 20);
      // setLogs(response.data);
      // setTotalPages(response.totalPages);
      
      // Demo: Use mock data
      setLogs(mockLogs);
      setTotalPages(1);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
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
