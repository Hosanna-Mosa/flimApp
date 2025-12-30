import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificationApi } from '@/services/api';
import { VerificationRequest, VerificationStatus } from '@/types';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/UserAvatar';
import { StatusBadge } from '@/components/StatusBadge';
import { VerificationTypeBadge } from '@/components/VerificationTypeBadge';
import { Pagination } from '@/components/Pagination';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { Eye, ClipboardList, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Mock data for demo
const mockRequests: VerificationRequest[] = [
  {
    id: '1',
    userId: 'u1',
    user: {
      id: 'u1',
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      role: 'CREATOR',
      bio: 'Digital content creator and lifestyle influencer',
      isVerified: false,
      createdAt: '2024-01-15T10:00:00Z',
    },
    verificationType: 'CREATOR',
    status: 'PENDING',
    reason: 'I have 500k followers on Instagram and create daily lifestyle content.',
    documents: [
      { id: 'd1', type: 'SOCIAL_LINK', url: 'https://instagram.com/sarahjohnson', name: 'Instagram Profile' }
    ],
    adminNotes: null,
    submittedAt: '2024-12-28T14:30:00Z',
    reviewedAt: null,
    reviewedBy: null,
  },
  {
    id: '2',
    userId: 'u2',
    user: {
      id: 'u2',
      name: 'Tech Gadgets Inc',
      email: 'contact@techgadgets.com',
      avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
      role: 'BRAND',
      bio: 'Leading tech accessories brand',
      isVerified: false,
      createdAt: '2024-02-20T10:00:00Z',
    },
    verificationType: 'BRAND',
    status: 'PENDING',
    reason: 'We are an established tech brand with official business registration.',
    documents: [
      { id: 'd2', type: 'ID_DOCUMENT', url: '#', name: 'Business Registration' }
    ],
    adminNotes: null,
    submittedAt: '2024-12-27T09:15:00Z',
    reviewedAt: null,
    reviewedBy: null,
  },
  {
    id: '3',
    userId: 'u3',
    user: {
      id: 'u3',
      name: 'Michael Chen',
      email: 'michael@news.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      role: 'CREATOR',
      bio: 'Senior journalist at Daily News',
      isVerified: true,
      createdAt: '2024-01-10T10:00:00Z',
    },
    verificationType: 'JOURNALIST',
    status: 'APPROVED',
    reason: 'I am a senior journalist at Daily News covering tech and business.',
    documents: [
      { id: 'd3', type: 'PROOF_OF_WORK', url: '#', name: 'Press ID Card' }
    ],
    adminNotes: 'Verified press credentials.',
    submittedAt: '2024-12-20T11:00:00Z',
    reviewedAt: '2024-12-21T15:30:00Z',
    reviewedBy: 'admin1',
  },
  {
    id: '4',
    userId: 'u4',
    user: {
      id: 'u4',
      name: 'Alex Rivera',
      email: 'alex@example.com',
      avatar: null,
      role: 'USER',
      bio: 'Aspiring influencer',
      isVerified: false,
      createdAt: '2024-03-01T10:00:00Z',
    },
    verificationType: 'PUBLIC_FIGURE',
    status: 'REJECTED',
    reason: 'I want to be verified because I am famous.',
    documents: [],
    adminNotes: 'Insufficient documentation provided.',
    submittedAt: '2024-12-22T16:45:00Z',
    reviewedAt: '2024-12-23T10:00:00Z',
    reviewedBy: 'admin1',
  },
];

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      // In production, use the API
      // const response = await verificationApi.getRequests(currentPage, 10, statusFilter);
      // setRequests(response.data);
      // setTotalPages(response.totalPages);
      
      // Demo: Use mock data with filtering
      let filtered = mockRequests;
      if (statusFilter !== 'ALL') {
        filtered = mockRequests.filter(r => r.status === statusFilter);
      }
      setRequests(filtered);
      setTotalPages(1);
    } catch (error) {
      toast.error('Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter]);

  const handleViewRequest = (id: string) => {
    navigate(`/requests/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and manage user verification applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {isLoading ? (
          <LoadingState message="Loading requests..." />
        ) : requests.length === 0 ? (
          <EmptyState 
            title="No requests found"
            description="There are no verification requests matching your filter."
            icon={ClipboardList}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar user={request.user} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">
                              {request.user.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <VerificationTypeBadge type={request.verificationType} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(request.submittedAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
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
