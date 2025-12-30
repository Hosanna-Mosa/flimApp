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
import { VerificationTypeBadge } from '@/components/VerificationTypeBadge';
import { Pagination } from '@/components/Pagination';
import { LoadingState, EmptyState } from '@/components/StateDisplay';
import { Eye, ClipboardList, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [nameFilter, setNameFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await verificationApi.getRequests(currentPage, 10, {
        status: statusFilter,
        name: nameFilter,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        phone: phoneFilter,
        industry: industryFilter !== 'ALL' ? industryFilter : undefined
      });

      setRequests(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter, roleFilter, industryFilter]);

  // Debounced effect for text inputs
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 500);
    return () => clearTimeout(timer);
  }, [nameFilter, phoneFilter]);

  const handleViewRequest = (id: string) => {
    navigate(`/requests/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Verification Requests</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage user verification applications
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={fetchRequests}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 bg-card p-4 rounded-lg border border-border">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">Name</Label>
            <Input 
              placeholder="Search name..." 
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">Phone</Label>
            <Input 
              placeholder="Search phone..." 
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="actor">Actor</SelectItem>
                <SelectItem value="director">Director</SelectItem>
                <SelectItem value="producer">Producer</SelectItem>
                <SelectItem value="production_manager">Production Manager</SelectItem>
                <SelectItem value="casting_artists">Casting / Artists</SelectItem>
                <SelectItem value="story_screenplay_writer">Story / Screenplay Writer</SelectItem>
                <SelectItem value="dialogue_writer">Dialogue Writer</SelectItem>
                <SelectItem value="music_director_composer">Music Director / Composer</SelectItem>
                <SelectItem value="lyrics_writer">Lyrics Writer</SelectItem>
                <SelectItem value="cinematographer_dop">Cinematographer (DOP)</SelectItem>
                <SelectItem value="art_director">Art Director</SelectItem>
                <SelectItem value="makeup_department">Make-up Department</SelectItem>
                <SelectItem value="costume_designer">Costume Designer</SelectItem>
                <SelectItem value="choreographer">Choreographer</SelectItem>
                <SelectItem value="stunt_master_action_director">Stunt Master / Action Director</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="sound_designer_engineer">Sound Designer / Sound Engineer</SelectItem>
                <SelectItem value="playback_singers">Playback Singers</SelectItem>
                <SelectItem value="dubbing_artists">Dubbing Artists</SelectItem>
                <SelectItem value="vfx_cgi_department">VFX / CGI Department</SelectItem>
                <SelectItem value="lighting_technicians">Lighting Technicians</SelectItem>
                <SelectItem value="camera_assistants_focus_pullers">Camera Assistants / Focus Pullers</SelectItem>
                <SelectItem value="set_designers_workers">Set Designers / Set Workers</SelectItem>
                <SelectItem value="production_assistants_ad_team">Production Assistants / AD Team</SelectItem>
                <SelectItem value="publicity_promotion_pro">Publicity & Promotion / PRO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase text-muted-foreground font-semibold">Industry</Label>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Industries</SelectItem>
                <SelectItem value="tollywood">Tollywood</SelectItem>
                <SelectItem value="bollywood">Bollywood</SelectItem>
                <SelectItem value="kollywood">Kollywood</SelectItem>
                <SelectItem value="mollywood">Mollywood</SelectItem>
                <SelectItem value="sandalwood">Sandalwood</SelectItem>
                <SelectItem value="punjabi">Punjabi</SelectItem>
                <SelectItem value="bengali">Bengali</SelectItem>
                <SelectItem value="bhojpuri">Bhojpuri</SelectItem>
                <SelectItem value="marathi">Marathi</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
